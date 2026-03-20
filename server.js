import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// ── Cache de dados reais da Riot (Data Dragon) ──
let lolData = null;
let lolDataLast = 0;
const LOL_CACHE_MS = 6 * 60 * 60 * 1000; // 6 horas

async function getLolData() {
  if (lolData && Date.now() - lolDataLast < LOL_CACHE_MS) return lolData;

  console.log("Buscando dados do patch atual via Data Dragon...");

  // 1. Versão mais recente
  const versionsRes = await axios.get(
    "https://ddragon.leagueoflegends.com/api/versions.json",
    { timeout: 10000 }
  );
  const version = versionsRes.data[0];
  console.log("Patch atual:", version);

  // 2. Busca campeões, itens e runas em paralelo
  const [champRes, itemRes, runesRes] = await Promise.all([
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/champion.json`, { timeout: 10000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/item.json`, { timeout: 10000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/runesReforged.json`, { timeout: 10000 }),
  ]);

  // 3. Processa campeões
  const champions = Object.values(champRes.data.data).map((c) => ({
    id: c.id,
    nome: c.name,
    titulo: c.title,
    tags: c.tags,
  }));

  // 4. Processa itens (apenas os compráveis, sem componentes básicos sem ouro)
  const items = Object.entries(itemRes.data.data)
    .filter(([, v]) => v.gold?.purchasable && v.gold?.total >= 1000 && !v.consumed)
    .map(([id, v]) => ({
      id,
      nome: v.name,
      custo: v.gold.total,
      tags: v.tags || [],
    }));

  // 5. Processa runas
  const runes = runesRes.data.map((tree) => ({
    arvore: tree.name,
    chave: tree.key,
    slots: tree.slots.map((slot) =>
      slot.runes.map((r) => ({ nome: r.name, chave: r.key }))
    ),
  }));

  lolData = { version, champions, items, runes };
  lolDataLast = Date.now();
  console.log(`Data Dragon carregado: ${champions.length} campeões, ${items.length} itens`);
  return lolData;
}

// Formata os dados para inserir no prompt (resumido para não estourar tokens)
function buildGameContext(data, role) {
  const roleFilter = {
    top:    ["Fighter", "Tank"],
    jungle: ["Assassin", "Fighter", "Tank"],
    mid:    ["Mage", "Assassin"],
    adc:    ["Marksman"],
    sup:    ["Support", "Tank", "Mage"],
  };

  const tags = roleFilter[role?.toLowerCase()] || [];
  const relevantChamps = tags.length
    ? data.champions.filter((c) => c.tags.some((t) => tags.includes(t)))
    : data.champions;

  const champList = relevantChamps.map((c) => c.nome).join(", ");

  const runeList = data.runes
    .map((tree) => {
      const keystones = tree.slots[0]?.map((r) => r.nome).join(", ") || "";
      return `${tree.arvore} (Keystones: ${keystones})`;
    })
    .join(" | ");

  const itemList = data.items
    .slice(0, 60)
    .map((i) => i.nome)
    .join(", ");

  return `PATCH ATUAL: ${data.version}

CAMPEÕES DISPONÍVEIS PARA ${role?.toUpperCase() || "TODAS AS ROTAS"}:
${champList}

RUNAS REAIS (use APENAS esses nomes):
${runeList}

ITENS REAIS (use APENAS esses nomes):
${itemList}`;
}

// ── GET / health check ──
app.get("/", async (req, res) => {
  try {
    const data = await getLolData();
    res.json({
      status: "Nexus Oracle online",
      patch: data.version,
      campeoes: data.champions.length,
      itens: data.items.length,
    });
  } catch (e) {
    res.json({ status: "Nexus Oracle online", erro_datadragon: e.message });
  }
});

// ── POST /oracle — perguntas em texto via Groq ──
app.post("/oracle", async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    if (!question) return res.status(400).json({ error: "question ausente" });

    const allies  = context.allies  || "não informado";
    const enemies = context.enemies || "não informado";
    const bans    = context.bans    || "não informado";
    const role    = context.role    || "";

    // Busca dados reais do patch
    const data = await getLolData();
    const gameCtx = buildGameContext(data, role);

    const prompt = `Você é um coach Challenger de League of Legends no patch ${data.version}.

${gameCtx}

PARTIDA ATUAL:
- Meu time: ${allies}
- Inimigos: ${enemies}
- Bans: ${bans}

REGRAS OBRIGATÓRIAS:
- Use APENAS campeões, itens e runas listados acima
- Não invente nomes. Se não souber, diga que não tem certeza
- Seja direto e objetivo
- Responda em português brasileiro

Pergunta: ${question}`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        max_tokens: 800,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `Você é um coach Challenger de League of Legends. Patch atual: ${data.version}. Use APENAS dados reais do jogo. Responda em português brasileiro.`,
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const text = response.data.choices[0].message.content;
    res.json({ text, patch: data.version });

  } catch (e) {
    const detail = e.response?.data || e.message;
    console.log("ERRO /oracle:", JSON.stringify(detail));
    res.status(500).json({ error: JSON.stringify(detail) });
  }
});

// ── POST /analyze — análise de screenshot via OpenRouter ──
app.post("/analyze", async (req, res) => {
  try {
    const { image, context = {} } = req.body;
    if (!image) return res.status(400).json({ error: "image ausente" });

    const allies  = context.allies  || "não informado";
    const enemies = context.enemies || "não informado";
    const bans    = context.bans    || "não informado";

    // Busca patch atual para contexto
    const data = await getLolData();

    const prompt = `Você é um coach Challenger de League of Legends analisando um screenshot ao vivo. Patch atual: ${data.version}.

Contexto da partida:
- Meu time: ${allies}
- Inimigos: ${enemies}
- Bans: ${bans}

Analise CUIDADOSAMENTE o screenshot e identifique:
1. Barra de vida e mana do jogador (percentual)
2. Posição no mapa (rota, base, objetivo)
3. Dragão ou Barão disponível (temporizador visível)
4. Torretas com pouca vida
5. Inimigos visíveis e ameaças

Com base nisso, retorne APENAS um JSON válido sem nenhum texto fora:
{
  "acao": "instrução direta em até 8 palavras",
  "urgencia": "alta|media|baixa",
  "detalhes": "explicação em 1-2 frases do que você viu",
  "observacoes": ["detalhe 1", "detalhe 2"]
}

Regras do JSON:
- "urgencia" = "alta" se vida < 30% ou inimigo próximo
- "urgencia" = "media" se objetivo disponível ou torreta fraca
- "urgencia" = "baixa" se situação estável
- Se a imagem não mostrar League of Legends claramente:
  {"acao":"Posicione a tela do LoL","urgencia":"baixa","detalhes":"Não foi possível identificar o jogo na imagem.","observacoes":[]}`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-2.0-flash-exp:free",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${image}` },
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://nexus-oracle.onrender.com",
          "X-Title": "Nexus Oracle",
        },
        timeout: 25000,
      }
    );

    const raw = response.data.choices[0].message.content;
    console.log("Resposta visão:", raw.slice(0, 200));

    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
    } catch {
      parsed = {
        acao: "Analisando tela...",
        urgencia: "baixa",
        detalhes: raw.slice(0, 200),
        observacoes: [],
      };
    }

    res.json(parsed);

  } catch (e) {
    const detail = e.response?.data || e.message;
    console.log("ERRO /analyze:", JSON.stringify(detail));
    res.status(500).json({ error: JSON.stringify(detail) });
  }
});

// Pré-carrega os dados ao iniciar o servidor
getLolData().catch((e) => console.log("Erro ao pré-carregar Data Dragon:", e.message));

app.listen(3000, () => console.log("Nexus Oracle rodando na porta 3000"));
