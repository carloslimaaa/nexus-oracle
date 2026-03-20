import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// ── Chaves ──
const RIOT_KEY       = process.env.RIOT_API_KEY;   // RGAPI-...
const GROQ_KEY       = process.env.GROQ_KEY;        // gsk_...
const OPENROUTER_KEY = process.env.OPENROUTER_KEY;  // sk-or-...

// ── Regiões Riot ──
const PLATFORM = "br1.api.riotgames.com";
const ROUTING  = "americas.api.riotgames.com";

// ── Helpers de requisição ──
async function riotGet(url, params = {}) {
  const res = await axios.get(url, {
    params: { ...params, api_key: RIOT_KEY },
    timeout: 10000,
  });
  return res.data;
}

// Rate limiter simples (evita 429 na Riot API)
let lastRiotCall = 0;
async function riotSafe(url, params = {}) {
  const now = Date.now();
  const gap = now - lastRiotCall;
  if (gap < 70) await new Promise(r => setTimeout(r, 70 - gap));
  lastRiotCall = Date.now();
  return riotGet(url, params);
}

// ── Cache de dados estáticos (Data Dragon) ──
let ddCache = null;
let ddLast  = 0;

async function getDD() {
  if (ddCache && Date.now() - ddLast < 6 * 3600000) return ddCache;

  const versRes = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json", { timeout: 8000 });
  const version = versRes.data[0];

  const [champRes, itemRes, runesRes] = await Promise.all([
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/champion.json`, { timeout: 10000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/item.json`,    { timeout: 10000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/runesReforged.json`, { timeout: 10000 }),
  ]);

  // Mapa id → nome de campeão
  const champById = {};
  const champByName = {};
  Object.values(champRes.data.data).forEach(c => {
    champById[c.key]  = c.name;
    champByName[c.name.toLowerCase()] = { id: c.key, nome: c.name, tags: c.tags };
  });

  // Itens compráveis com nome
  const itemById = {};
  Object.entries(itemRes.data.data).forEach(([id, v]) => {
    if (v.gold?.purchasable && v.gold?.total >= 800 && !v.consumed) {
      itemById[id] = v.name;
    }
  });

  // Runas por id
  const runeById = {};
  const runeTree = [];
  runesRes.data.forEach(tree => {
    const slots = tree.slots.map(slot =>
      slot.runes.map(r => { runeById[r.id] = r.name; return r.name; })
    );
    runeTree.push({ nome: tree.name, slots });
  });

  ddCache = { version, champById, champByName, itemById, runeById, runeTree };
  ddLast = Date.now();
  console.log(`Data Dragon ${version}: ${Object.keys(champById).length} campeões, ${Object.keys(itemById).length} itens`);
  return ddCache;
}

// ── Cache de especialistas Challenger ──
// { [champName]: { specialists: [{name, puuid, games, winrate}], builds: [...], runas: [...] } }
let specialistCache = {};
let specialistLast  = {};
const SPECIALIST_TTL = 4 * 3600000; // 4 horas

async function getChallengerSpecialists(champName, dd) {
  const key = champName.toLowerCase();

  if (specialistCache[key] && Date.now() - (specialistLast[key] || 0) < SPECIALIST_TTL) {
    return specialistCache[key];
  }

  console.log(`Buscando especialistas Challenger de ${champName}...`);

  // 1. Pega lista Challenger BR
  let chalengers = [];
  try {
    const league = await riotSafe(`https://${PLATFORM}/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`);
    // Pega os top 100 por LP
    chalengers = league.entries
      .sort((a, b) => b.leaguePoints - a.leaguePoints)
      .slice(0, 100);
  } catch (e) {
    console.log("Erro ao buscar Challenger:", e.message);
    return null;
  }

  // 2. Para cada summoner, checa maestria do campeão
  const champId = Object.entries(dd.champByName).find(
    ([k]) => k === champName.toLowerCase()
  )?.[1]?.id;

  if (!champId) return null;

  const specialists = [];

  for (const entry of chalengers) {
    if (specialists.length >= 5) break; // Queremos apenas os top 5 especialistas

    try {
      // Busca dados do summoner
      const summoner = await riotSafe(
        `https://${PLATFORM}/lol/summoner/v4/summoners/${entry.summonerId}`
      );

      // Checa maestria deste campeão
      const mastery = await riotSafe(
        `https://${PLATFORM}/lol/champion-mastery/v4/champion-masteries/by-puuid/${summoner.puuid}/by-champion/${champId}`
      );

      // Considera especialista se tiver >100k pontos de maestria
      if (mastery.championPoints >= 100000) {
        specialists.push({
          name:    entry.summonerName || summoner.name,
          puuid:   summoner.puuid,
          lp:      entry.leaguePoints,
          maestria: mastery.championPoints,
        });
        console.log(`Especialista encontrado: ${summoner.name} (${mastery.championPoints} maestria)`);
      }
    } catch (e) {
      // Jogador não tem maestria neste campeão, pula
      continue;
    }
  }

  if (specialists.length === 0) {
    console.log(`Nenhum especialista Challenger de ${champName} encontrado no BR, buscando KR...`);
    // Fallback: busca globalmente via tag Riot ID
    specialistCache[key] = { specialists: [], builds: [], runas: [], nota: "Sem especialistas no BR Challenger agora" };
    specialistLast[key]  = Date.now();
    return specialistCache[key];
  }

  // 3. Para cada especialista, pega as últimas 10 partidas com este campeão
  const allBuilds = [];
  const allRunes  = [];

  for (const spec of specialists) {
    try {
      // Lista de matches recentes
      const matchIds = await riotSafe(
        `https://${ROUTING}/lol/match/v5/matches/by-puuid/${spec.puuid}/ids`,
        { queue: 420, count: 20 } // 420 = Ranked Solo
      );

      let gamesAnalyzed = 0;

      for (const matchId of matchIds) {
        if (gamesAnalyzed >= 5) break;
        try {
          const match = await riotSafe(`https://${ROUTING}/lol/match/v5/matches/${matchId}`);

          // Encontra o participante
          const participant = match.info.participants.find(
            p => p.puuid === spec.puuid
          );

          if (!participant || participant.championId !== parseInt(champId)) continue;

          gamesAnalyzed++;

          // Extrai itens comprados
          const items = [
            participant.item0, participant.item1, participant.item2,
            participant.item3, participant.item4, participant.item5,
          ]
            .filter(id => id > 0 && dd.itemById[id])
            .map(id => dd.itemById[id]);

          // Extrai runas
          const perks = participant.perks;
          const primaryStyle = perks?.styles?.[0];
          const secondaryStyle = perks?.styles?.[1];

          const keystone = primaryStyle?.selections?.[0]?.perk;
          const rune1    = primaryStyle?.selections?.[1]?.perk;
          const rune2    = primaryStyle?.selections?.[2]?.perk;
          const rune3    = primaryStyle?.selections?.[3]?.perk;
          const sec1     = secondaryStyle?.selections?.[0]?.perk;
          const sec2     = secondaryStyle?.selections?.[1]?.perk;

          const runasBuild = {
            keystone:  dd.runeById[keystone] || `id:${keystone}`,
            primaria:  dd.runeById[rune1]   || "",
            runa2:     dd.runeById[rune2]   || "",
            runa3:     dd.runeById[rune3]   || "",
            secundaria:dd.runeById[sec1]    || "",
            sec2:      dd.runeById[sec2]    || "",
            shards:    perks?.statPerks
              ? {
                  ofensivo: perks.statPerks.offense,
                  flex:     perks.statPerks.flex,
                  defensivo: perks.statPerks.defense,
                }
              : {},
          };

          // Mapa para identificar árvore primária
          const primaryTreeId = primaryStyle?.style;
          const secondaryTreeId = secondaryStyle?.style;

          const treeName = id => {
            const t = dd.runeTree.find(t => {
              // Verifica se alguma runa da árvore bate com o keystone
              return t.slots[0]?.some(r => {
                return Object.entries(dd.runeById).some(
                  ([rid, rname]) => rname === r && parseInt(rid) === keystone
                );
              });
            });
            return t?.nome || "Precisão";
          };

          allBuilds.push({
            jogador:  spec.name,
            lp:       spec.lp,
            vitoria:  participant.win,
            itens:    items,
            kda:      `${participant.kills}/${participant.deaths}/${participant.assists}`,
            duracao:  Math.round(match.info.gameDuration / 60) + "min",
          });

          allRunes.push({
            jogador:    spec.name,
            vitoria:    participant.win,
            arvorePrim: treeName(primaryTreeId),
            keystone:   runasBuild.keystone,
            runa1:      runasBuild.primaria,
            runa2:      runasBuild.runa2,
            runa3:      runasBuild.runa3,
            arvoreSec:  secondaryStyle ? "verificar" : "",
            sec1:       runasBuild.secundaria,
            sec2:       runasBuild.sec2,
          });

        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      continue;
    }
  }

  const result = {
    specialists,
    builds: allBuilds.slice(0, 15),
    runas:  allRunes.slice(0, 15),
    nota:   `${specialists.length} especialistas Challenger analisados`,
  };

  specialistCache[key] = result;
  specialistLast[key]  = Date.now();
  return result;
}

// ── Formata os dados de especialistas para o prompt ──
function formatSpecialistData(data, champName) {
  if (!data || (!data.builds.length && !data.runas.length)) {
    return `Dados de especialistas de ${champName} não disponíveis agora. Use seu conhecimento geral do meta.`;
  }

  // Conta os itens mais frequentes
  const itemCount = {};
  data.builds.forEach(b => b.itens.forEach(i => { itemCount[i] = (itemCount[i] || 0) + 1; }));
  const topItems = Object.entries(itemCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([nome, n]) => `${nome} (${n}/${data.builds.length} jogos)`);

  // Conta keystones mais frequentes
  const keystoneCount = {};
  data.runas.forEach(r => {
    if (r.keystone) keystoneCount[r.keystone] = (keystoneCount[r.keystone] || 0) + 1;
  });
  const topKeystones = Object.entries(keystoneCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, n]) => `${k} (${n}/${data.runas.length} jogos)`);

  // Monta exemplo de runas completas de um jogo vencido
  const winGame = data.runas.find(r => r.vitoria);
  const runaExemplo = winGame
    ? `Exemplo real (vitória de ${winGame.jogador}):
   Keystome: ${winGame.keystone}
   Runas primárias: ${winGame.runa1}, ${winGame.runa2}, ${winGame.runa3}
   Secundárias: ${winGame.sec1}, ${winGame.sec2}`
    : "";

  return `DADOS REAIS DE ${data.specialists.map(s => s.name).join(", ")} (${data.nota}):

ITENS MAIS USADOS (por frequência):
${topItems.join("\n")}

KEYSTONES MAIS USADOS:
${topKeystones.join("\n")}

${runaExemplo}`;
}

// ── GET / ──
app.get("/", async (req, res) => {
  try {
    const dd = await getDD();
    res.json({
      status:   "Nexus Oracle online",
      patch:    dd.version,
      campeoes: Object.keys(dd.champById).length,
      itens:    Object.keys(dd.itemById).length,
      riot_api: RIOT_KEY ? "configurada" : "AUSENTE",
      groq:     GROQ_KEY ? "configurada" : "AUSENTE",
    });
  } catch (e) {
    res.json({ status: "Nexus Oracle online", erro: e.message });
  }
});

// ── POST /oracle ──
app.post("/oracle", async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    if (!question) return res.status(400).json({ error: "question ausente" });

    const allies  = context.allies  || "não informado";
    const enemies = context.enemies || "não informado";
    const bans    = context.bans    || "não informado";
    const role    = context.role    || "";
    const champion = context.champion || "";

    const dd = await getDD();

    // Tenta identificar o campeão na pergunta
    let champDetected = champion;
    if (!champDetected) {
      const lower = question.toLowerCase();
      champDetected = Object.keys(dd.champByName).find(c => lower.includes(c)) || "";
    }

    // Busca dados reais de especialistas se um campeão foi identificado
    let specialistBlock = "";
    if (champDetected && RIOT_KEY) {
      try {
        const specData = await getChallengerSpecialists(
          dd.champByName[champDetected]?.nome || champDetected, dd
        );
        if (specData) specialistBlock = formatSpecialistData(specData, champDetected);
      } catch (e) {
        console.log("Erro ao buscar especialistas:", e.message);
      }
    }

    // Monta lista de runas reais para o prompt
    const runesRef = dd.runeTree.map(tree =>
      `${tree.nome}: [${tree.slots[0]?.join(" | ")}] [${tree.slots[1]?.join(" | ")}] [${tree.slots[2]?.join(" | ")}] [${tree.slots[3]?.join(" | ")}]`
    ).join("\n");

    const prompt = `Você é um coach Challenger de League of Legends. Patch atual: ${dd.version}.

CONTEXTO DA PARTIDA:
- Rota: ${role || "não definida"}
- Meu time: ${allies}
- Inimigos: ${enemies}
- Bans: ${bans}

${specialistBlock || ""}

RUNAS REAIS DISPONÍVEIS NO JOGO (use APENAS esses nomes, nunca invente):
${runesRef}

REGRAS OBRIGATÓRIAS DE RESPOSTA:
1. SEMPRE dar uma recomendação de campeão, mesmo sem informação total — use o meta atual
2. Para runas: informar ÁRVORE PRIMÁRIA completa (Keystone + 3 runas) + ÁRVORE SECUNDÁRIA (2 runas) + SHARDS (3 fragmentos)
3. Para itens: listar os 6 itens finais em ordem, com o item mítico primeiro
4. Fundamentar nas partidas reais dos especialistas quando disponível
5. Responder em português brasileiro

Pergunta: ${question}`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `Você é um coach Challenger de League of Legends no patch ${dd.version}. Use dados reais quando disponíveis. Para runas, SEMPRE informe a árvore completa: keystone + 3 runas primárias + árvore secundária + 2 runas + 3 shards. Responda em português brasileiro.`,
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    const text = response.data.choices[0].message.content;
    res.json({ text, patch: dd.version });

  } catch (e) {
    const d = e.response?.data || e.message;
    console.log("ERRO /oracle:", JSON.stringify(d));
    res.status(500).json({ error: JSON.stringify(d) });
  }
});

// ── POST /analyze — visão via Groq ──
app.post("/analyze", async (req, res) => {
  try {
    const { image, context = {} } = req.body;
    if (!image) return res.status(400).json({ error: "image ausente" });

    const allies  = context.allies  || "não informado";
    const enemies = context.enemies || "não informado";
    const bans    = context.bans    || "não informado";

    const dd = await getDD();

    const prompt = `Você é um coach Challenger de League of Legends analisando um screenshot ao vivo. Patch: ${dd.version}.

Contexto: time aliado: ${allies} | inimigos: ${enemies} | bans: ${bans}

Analise com cuidado o screenshot e identifique:
- Barra de vida e mana (percentual aproximado)
- Posição no mapa (rota, base, rio, selva)
- Temporizadores visíveis (dragão, barão, torretas)
- Inimigos ou ameaças visíveis
- Ouro atual e itens no inventário (se visível)

Retorne APENAS o JSON abaixo, sem texto fora:
{
  "acao": "instrução direta em até 8 palavras",
  "urgencia": "alta|media|baixa",
  "detalhes": "o que você viu na tela em 2 frases",
  "observacoes": ["detalhe 1", "detalhe 2", "detalhe 3"]
}

Critério de urgência:
- alta: vida < 30%, inimigo atacando, torre caindo
- media: objetivo disponível (dragão/barão), gank possível, torre com pouca vida
- baixa: situação estável, farm, rotação normal

Se não conseguir identificar claramente o LoL na imagem:
{"acao":"Posicione a janela do LoL","urgencia":"baixa","detalhes":"Imagem não identificada como League of Legends.","observacoes":[]}`;

    // Usa Groq llama vision (mais estável que OpenRouter gratuito)
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 400,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: [
              { type: "text",      text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
            ],
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        timeout: 25000,
      }
    );

    const raw = response.data.choices[0].message.content;
    console.log("Visão resposta:", raw.slice(0, 150));

    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
    } catch {
      parsed = {
        acao:        "Analisando...",
        urgencia:    "baixa",
        detalhes:    raw.slice(0, 200),
        observacoes: [],
      };
    }

    res.json(parsed);

  } catch (e) {
    const d = e.response?.data || e.message;
    console.log("ERRO /analyze:", JSON.stringify(d));
    res.status(500).json({ error: JSON.stringify(d) });
  }
});

// Pré-carrega Data Dragon ao iniciar
getDD().catch(e => console.log("Erro Data Dragon:", e.message));

app.listen(3000, () => console.log("Nexus Oracle rodando na porta 3000"));
