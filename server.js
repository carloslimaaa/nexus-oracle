// ═══════════════════════════════════════════════════════════════════════════════
// NEXUS ORACLE — SERVER v4.0
// Arquitetura:
//   1. Dataset local (dataset.js) — 164 campeões, builds verificadas
//   2. Motor de pick server-side (sem IA, sem API externa)
//   3. IA (llama-3.3-70b) apenas para explicação
//   4. /analyze em dois modos: fast (rule-based) e deep (IA com texto)
//   5. Zero dependência de lolalytics
// ═══════════════════════════════════════════════════════════════════════════════

import express from "express";
import axios   from "axios";
import cors    from "cors";
import { D, findChamp, ALIASES, CHAMP_COUNT } from "./dataset.js";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

const GROQ_KEY = process.env.GROQ_KEY;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════════════════

function parseList(str) {
  if (!str || str === "não informado") return [];
  return str.split(/[,;/|]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
}

function normalizeName(name) {
  if (!name) return "";
  const k = name.toLowerCase().trim()
    .replace(/['\s-]+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ALIASES[name.toLowerCase().trim()] || ALIASES[k] || k;
}

function getChamp(name) {
  const key = normalizeName(name);
  return D[key] || findChamp(name);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE → ANTI-CURA e ITENS SITUACIONAIS (100% server-side, nunca erra)
// ═══════════════════════════════════════════════════════════════════════════════
const ANTI_HEAL = {
  adc:         "Lembrete Mortal (AD — NUNCA Morellonomicon)",
  mago:        "Morellonomicon (AP — NUNCA Lembrete Mortal)",
  assassino_ap:"Morellonomicon (AP — NUNCA Lembrete Mortal)",
  assassino_ad:"Faca Chempunk Serrilhada (AD — NUNCA Morellonomicon)",
  lutador:     "Faca Chempunk Serrilhada ou Armadura de Espinhos (AD — NUNCA Morellonomicon)",
  tank:        "Armadura de Espinhos (tank — NUNCA Morellonomicon)",
  enchanter:   "Executioner's Calling → Mortal Reminder (suporte)",
  sup_engage:  "Vigilância Locket prioritário vs dive",
};

function situacionais(champ, enemies, allies) {
  const data = getChamp(champ);
  const cls  = data?.cls || "desconhecido";
  const e    = (enemies || "").toLowerCase();
  const a    = (allies  || "").toLowerCase();
  const items = [], notas = [];

  const temCura    = /soraka|yuumi|nami|sona|lulu|mundo|aatrox|warwick|irelia|sylas|swain|vladimir|olaf|gwen|nasus|fiora/.test(e);
  const temTanks   = (e.match(/malphite|maokai|ornn|chogath|sion|zac|sejuani|poppy|leona|nautilus|alistar|thresh|amumu|garen|drmundo|nasus/g)||[]).length >= 2;
  const temEscudos = /lulu|janna|karma|renata|seraphine|shen|orianna/.test(e);
  const temAssAD   = /zed|talon|rengar|khazix|nocturne|naafiri/.test(e);
  const temAssAP   = /fizz|leblanc|akali|diana|evelynn|katarina/.test(e);
  const temCCHard  = /malzahar|nautilus|blitzcrank|leona|amumu|morgana|alistar|thresh|sion|sejuani/.test(e);
  const fullAP     = !/darius|garen|zed|talon|jinx|caitlyn|jhin|ezreal|draven|graves|irelia|jax|riven|fiora|aatrox|ambessa|olaf|renekton|wukong|xinzhao|vi|tryndamere|yasuo|yone|urgot|sett/.test(e);

  if (temCura && ANTI_HEAL[cls]) items.push(`🩸 ANTI-CURA: ${ANTI_HEAL[cls]}`);
  if (temTanks && ["adc","mago","assassino_ap","assassino_ad","lutador"].includes(cls))
    items.push("🐙 Itens de penetração (Kraken/Bastão do Vazio) vs 2+ tanques");
  if (temEscudos && !["tank","enchanter","sup_engage"].includes(cls))
    items.push("🐍 Serpentine Fang / Rift-Maker vs escudos (Lulu/Janna/Karma)");
  if (temAssAD && ["mago","assassino_ap"].includes(cls))
    items.push("⏳ Ampulheta de Zhonya SLOT 3 obrigatória vs Zed/Talon/Rengar");
  if (temAssAD && cls === "adc")
    items.push("💀 Guardião Mortal vs assassino AD foca em você");
  if (temCCHard && !["tank"].includes(cls))
    items.push("🔵 Cimitarra Mercurial / Botas de Mercúrio vs CC pesado");
  if (fullAP && ["lutador","adc"].includes(cls))
    items.push("🍀 Força da Natureza + Botas de Mercúrio vs time full AP");

  if (temTanks && !["tank","enchanter","sup_engage"].includes(cls))
    notas.push("RUNA: Conquistador > Eletrocutar vs 2+ tanques (damage sustentado)");
  if (temCCHard && cls !== "tank")
    notas.push("RUNA SECUNDÁRIA: Lenda: Tenacidade vs CC pesado do time inimigo");
  if (temAssAD && ["mago","assassino_ap"].includes(cls))
    notas.push("RUNA: Manto de Nuvem na secundária vs assassino AD (10s invulnerabilidade)");

  return { cls, items, notas };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOTOR DE PICK — 100% local, zero API externa
//
// Score = WR médio vs inimigos × 0.7 + WR pior matchup × 0.3
//         + bônus sinergia com aliados
//         + bônus arquétipo de composição
// ═══════════════════════════════════════════════════════════════════════════════

// Pool por rota — campeões tier S/A atuais
const POOL = {
  // Zaahen: Top/Jungle (Skirmisher) | Yunara: ADC (Marksman)
  top:     ["aatrox","camille","darius","fiora","garen","gnar","gwen","irelia","jax","jayce","kayle","kennen","ksante","mordekaiser","ornn","renekton","riven","rumble","sett","shen","sion","trundle","urgot","volibear","wukong","yorick","zaahen","ambessa"],
  jungle:  ["amumu","belveth","briar","diana","elise","evelynn","fiddlesticks","gragas","graves","hecarim","ivern","jarvaniv","kayn","khazix","kindred","leesin","lillia","masteryi","nidalee","nocturne","nunu","rammus","reksai","rengar","sejuani","shaco","taliyah","udyr","vi","viego","volibear","warwick","wukong","xinzhao","zaahen","zac","karthus"],
  mid:     ["ahri","akali","akshan","anivia","annie","aurelionsol","aurora","azir","cassiopeia","corki","ekko","fizz","galio","heimerdinger","hwei","kassadin","katarina","leblanc","lissandra","lux","malzahar","mel","naafiri","neeko","orianna","qiyana","ryze","syndra","sylas","talon","twistedfate","veigar","vel","vex","viktor","vladimir","xerath","yasuo","yone","zed","ziggs","zoe"],
  adc:     ["aphelios","ashe","caitlyn","draven","ezreal","jhin","jinx","kaisa","kalista","kogmaw","lucian","misfortune","nilah","samira","sivir","smolder","tristana","twitch","varus","vayne","xayah","yunara","zeri"],
  support: ["alistar","bard","blitzcrank","brand","braum","janna","karma","leona","lulu","milio","morgana","nami","nautilus","pyke","rakan","rell","renata","seraphine","sona","soraka","tahm","taric","thresh","yuumi","zilean","zyra","swain","senna"],
};

const LANE_MAP = { top:"top", jungle:"jungle", mid:"mid", adc:"adc", bot:"adc", sup:"support", support:"support", suporte:"support" };

// Arquétipos de composição
const COMP_REGEX = {
  engage_duro:  /malphite|amumu|jarvaniv|sejuani|leona|nautilus|blitzcrank|alistar|rell|wukong/,
  poke:         /jayce|zoe|syndra|xerath|vel|nidalee|ezreal|corki|karma|lux|caitlyn/,
  assassino:    /zed|talon|rengar|khazix|akali|diana|leblanc|fizz|katarina|nocturne|evelynn/,
  split_push:   /camille|fiora|jax|tryndamere|yorick|nasus|riven|irelia/,
  teamfight:    /orianna|azir|amumu|malphite|zyra|rumble|kennen|jarvaniv|wukong/,
  cura_pesada:  /soraka|yuumi|nami|sona|lulu|mundo|aatrox|warwick|sylas|swain|olaf|gwen/,
  escudos:      /lulu|janna|karma|renata|seraphine|shen|orianna/,
  carry_ad:     /jinx|caitlyn|jhin|draven|vayne|tristana|twitch|ezreal|kaisa|xayah/,
  carry_ap:     /syndra|leblanc|veigar|ahri|zoe|orianna|azir|cassiopeia/,
  cc_pesado:    /malzahar|nautilus|blitzcrank|leona|amumu|morgana|alistar|thresh|sion|sejuani/,
};

// ── Bônus de composição vs arquétipo inimigo ──────────────────────────────────
const COMP_SCORE = {
  engage_duro:  { malphite:5, kennen:4, rumble:4, lissandra:4, janna:5, morgana:4, yasuo:5, yone:4, vex:4, zac:3, fiddlesticks:3 },
  poke:         { vladimir:4, kassadin:4, mordekaiser:4, diana:3, fizz:3, vex:3, zed:3, akali:3 },
  assassino:    { malzahar:5, lissandra:4, galio:4, leona:3, nautilus:3, vex:4, lulu:4, soraka:3 },
  cura_pesada:  { veigar:3, karthus:3, zed:3, katarina:2, draven:2 },
  teamfight:    { orianna:5, azir:4, amumu:4, malphite:5, kennen:4, fiddlesticks:5, wukong:4, jarvaniv:3 },
  split_push:   { shen:5, twistedfate:4, nocturne:4, gangplank:3, twisted:3 },
  carry_ad:     { malphite:4, leona:3, nautilus:3, alistar:3 }, // tanques/engage counterm ADC
  carry_ap:     { galio:4, kassadin:4, ksante:3, malphite:3 }, // MR picks vs AP heavy
  cc_pesado:    { olaf:5, gangplank:4, kaisa:3, garen:3 }, // CC immune/cleanse vs CC chain
  escudos:      { veigar:3, kaisa:3, zed:3, draven:3 }, // vs shield comps (burst first)
};

// ── Fase do jogo: early/late power ────────────────────────────────────────────
// Bonus quando a composição inimiga é early ou late dominant
const PHASE_POWER = {
  // early dominant (comps com alto DPS/poke early → picks late safe são penalizados)
  // late dominant (comps de scaling → picks early aggressive são valorizados)
  early: ["draven","renekton","darius","jayce","camille","leesin","elise","graves","nidalee","caitlyn","lucian","pantheon","riven"],
  late:  ["kayle","kassadin","Vladimir","nasus","veigar","jinx","kogmaw","twitch","smolder","azir","orianna","tryndamere","tristana"],
  scaling:["cassiopeia","ryze","aurelionsol","viktor","veigar","lissandra","anivia","swain","mordekaiser"],
};

// Bonus de completude de composição com aliados
const ARCHETYPE_NEEDS = {
  // se time aliado não tem X, dar bônus para picks desse tipo
  tank:     { malphite:4, amumu:4, maokai:3, ornn:4, zac:3, chogath:3, malzahar:3 },
  engage:   { malphite:4, amumu:3, zac:3, leona:3, nautilus:3, alistar:3 },
  ap:       { orianna:3, azir:3, syndra:3, veigar:3, ahri:3, lux:3, hwei:3 },
  ad:       { zed:3, talon:3, khazix:3, rengar:3, graves:3, draven:3 },
  enchanter:{ lulu:4, soraka:4, nami:3, janna:3, milio:3, yuumi:3 },
  peel:     { lulu:4, janna:4, soraka:3, karma:3, thresh:3, braum:3 },
};

function calcCompBonus(champKey, enemies, allies = "") {
  const e = enemies.toLowerCase();
  const a = allies.toLowerCase();
  let bonus = 0;

  // 1. Bônus vs arquétipo inimigo
  for (const [tipo, regex] of Object.entries(COMP_REGEX)) {
    if (regex.test(e) && COMP_SCORE[tipo]?.[champKey]) {
      bonus += COMP_SCORE[tipo][champKey];
    }
  }

  // 2. Complemento do time aliado (o que falta no time)
  const allyHasTank    = /malphite|maokai|ornn|amumu|zac|chogath|sion|leona|nautilus|alistar/.test(a);
  const allyHasEngage  = /malphite|amumu|zac|leona|nautilus|alistar|blitzcrank|thresh|rell/.test(a);
  const allyHasAP      = /orianna|azir|syndra|veigar|ahri|lux|hwei|zoe|ryze|viktor|cassiopeia|malzahar|anivia/.test(a);
  const allyHasAD      = /zed|talon|khazix|rengar|graves|draven|caitlyn|jinx|jhin|kaisa|xayah/.test(a);
  const allyHasPeel    = /lulu|janna|soraka|nami|karma|thresh|braum|milio|yuumi/.test(a);

  if (!allyHasTank    && ARCHETYPE_NEEDS.tank?.[champKey])     bonus += ARCHETYPE_NEEDS.tank[champKey];
  if (!allyHasEngage  && ARCHETYPE_NEEDS.engage?.[champKey])   bonus += ARCHETYPE_NEEDS.engage[champKey];
  if (!allyHasAP      && ARCHETYPE_NEEDS.ap?.[champKey])       bonus += ARCHETYPE_NEEDS.ap[champKey];
  if (!allyHasAD      && ARCHETYPE_NEEDS.ad?.[champKey])       bonus += ARCHETYPE_NEEDS.ad[champKey];
  if (!allyHasPeel    && ARCHETYPE_NEEDS.peel?.[champKey])     bonus += ARCHETYPE_NEEDS.peel[champKey];

  // 3. Fase do jogo: se time inimigo é full late, early picks ganham bônus
  const enemyIsLate = PHASE_POWER.late.filter(c=>e.includes(c)).length >= 2;
  const enemyIsEarly = PHASE_POWER.early.filter(c=>e.includes(c)).length >= 2;
  if (enemyIsLate    && PHASE_POWER.early.includes(champKey)) bonus += 3; // jogar early vs late
  if (enemyIsEarly   && PHASE_POWER.late.includes(champKey))  bonus -= 2; // penaliza late vs early (não recomenda)
  if (enemyIsEarly   && PHASE_POWER.scaling.includes(champKey)) bonus += 2; // scaling safe vs early

  return Math.min(bonus, 12); // cap aumentado para refletir análise completa
}

function calcSynergyBonus(champKey, allies) {
  const champData = D[champKey];
  if (!champData?.syn) return 0;
  let bonus = 0;
  for (const ally of allies) {
    const allyKey = normalizeName(ally);
    if (champData.syn[allyKey]) bonus += champData.syn[allyKey];
    // Reverse: ally's syn também conta
    const allyData = D[allyKey];
    if (allyData?.syn?.[champKey]) bonus += allyData.syn[champKey];
  }
  return Math.min(bonus, 10);
}

function calcMatchupScore(champKey, enemyKeys) {
  const champData = D[champKey];
  if (!champData?.vs || enemyKeys.length === 0) return { avg: 50, worst: 50, fromLocal: false };

  const wrs = enemyKeys.map(ek => {
    // Tenta pelo nome exato, depois normalizado
    return champData.vs[ek] ||
           champData.vs[Object.keys(champData.vs).find(k => normalizeName(k) === ek)] ||
           50; // neutro se não tem dados
  });

  const avg   = wrs.reduce((a, b) => a + b, 0) / wrs.length;
  const worst = Math.min(...wrs);
  const fromLocal = wrs.some(w => w !== 50);
  return { avg, worst, fromLocal };
}

function calcularMelhorPick({ role, allies, enemies, bans = "" }) {
  const lane     = LANE_MAP[role?.toLowerCase()] || "mid";
  const pool     = POOL[lane] || POOL.mid;
  const enemyKeys = parseList(enemies).map(normalizeName).filter(Boolean).slice(0, 5);
  const allyKeys  = parseList(allies).map(normalizeName).filter(Boolean).slice(0, 4);
  const banKeys   = parseList(bans).map(normalizeName).filter(Boolean);

  const results = [];

  for (const champKey of pool) {
    // Descarta bans
    if (banKeys.includes(champKey)) continue;
    const champData = D[champKey];
    if (!champData) continue;

    const { avg, worst, fromLocal } = calcMatchupScore(champKey, enemyKeys);
    const baseScore  = avg * 0.7 + worst * 0.3;
    const synergy    = calcSynergyBonus(champKey, allyKeys);
    const compBonus  = calcCompBonus(champKey, enemies, allies);
    // Score total: matchup (70% WR médio + 30% pior matchup) + sinergia + composição completa
    const score      = baseScore + synergy + compBonus;

    results.push({
      champ:      champKey.charAt(0).toUpperCase() + champKey.slice(1),
      champKey,
      score:      Math.round(score    * 10) / 10,
      avgWR:      Math.round(avg      * 10) / 10,
      worstWR:    Math.round(worst    * 10) / 10,
      synergy,
      compBonus,
      hasMatchupData: fromLocal,
      role:   lane,
      data:   champData,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATA PICK para o prompt da IA
// ═══════════════════════════════════════════════════════════════════════════════
function formatPickForPrompt(pick) {
  if (!pick) return "";
  const d = pick.data;
  const lines = [
    `━━ PICK #1 CALCULADO PELO SISTEMA: ${pick.champ} ━━`,
    `Score: ${pick.score} | WR médio vs inimigos: ${pick.avgWR}% | Pior matchup: ${pick.worstWR}%`,
    pick.synergy   > 0 ? `Bônus sinergia: +${pick.synergy}` : "",
    pick.compBonus > 0 ? `Bônus composição: +${pick.compBonus}` : "",
    "",
    `Rota: ${d.role} | Classe: ${d.cls}`,
    `Feitiços: ${d.f?.join(" + ") || "Flash + Ignite"}`,
    ``,
    `RUNAS REAIS DO DATASET:`,
    `  Keystone: ${d.runes?.key || "?"}`,
    `  Primária: ${d.runes?.p || "?"} → ${[d.runes?.r1, d.runes?.r2, d.runes?.r3].filter(Boolean).join(" / ")}`,
    `  Secundária: ${d.runes?.s || "?"} → ${[d.runes?.s1, d.runes?.s2].filter(Boolean).join(" / ")}`,
    `  Shards: ${d.runes?.sh?.join(" | ") || "Adaptativo/Adaptativo/Armadura"}`,
    ``,
    `BUILD VERIFICADA (em ordem):`,
    (d.build || []).map((it, i) => `  ${i+1}. ${it}`).join("\n"),
    `Inicial: ${d.ini || "Doran Blade + Poção"}`,
  ].filter(s => s !== undefined);

  return lines.join("\n");
}

function formatBuildForPrompt(champ, enemies, allies) {
  const data = getChamp(champ);
  if (!data) return `Campeão "${champ}" não encontrado no dataset.`;

  const { cls, items: sitItems, notas: sitNotas } = situacionais(champ, enemies, allies);

  return [
    `━━ BUILD PARA ${champ.toUpperCase()} — dataset local ━━`,
    `Classe: ${cls} | Rota: ${data.role}`,
    `Feitiços: ${data.f?.join(" + ") || "Flash + Ignite"}`,
    "",
    `RUNAS:`,
    `  Keystone: ${data.runes?.key}`,
    `  Primária: ${data.runes?.p} → ${[data.runes?.r1, data.runes?.r2, data.runes?.r3].filter(Boolean).join(" / ")}`,
    `  Secundária: ${data.runes?.s} → ${[data.runes?.s1, data.runes?.s2].filter(Boolean).join(" / ")}`,
    `  Shards: ${data.runes?.sh?.join(" | ")}`,
    "",
    `BUILD (em ordem):`,
    (data.build || []).map((it, i) => `  ${i+1}. ${it}`).join("\n"),
    `Inicial: ${data.ini}`,
    "",
    sitItems.length ? `AJUSTES SITUACIONAIS:\n${sitItems.map(x => "  "+x).join("\n")}` : "",
    sitNotas.length ? `RUNAS SITUACIONAIS:\n${sitNotas.map(x => "  "+x).join("\n")}` : "",
    "",
    `DICAS DO PERSONAGEM:\n${(data.d || []).map((x,i) => `  ${i+1}. ${x}`).join("\n")}`,
  ].filter(Boolean).join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAMADA GROQ (IA)
// ═══════════════════════════════════════════════════════════════════════════════
async function callGroq(systemMsg, userMsg, maxTokens = 900) {
  const resp = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      max_tokens: maxTokens,
      temperature: 0.1,
      messages: [
        { role: "system",  content: systemMsg },
        { role: "user",    content: userMsg   },
      ],
    },
    {
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      timeout: 25000,
    }
  );
  return resp.data.choices[0].message.content;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE (em memória)
// ═══════════════════════════════════════════════════════════════════════════════
const CACHE = new Map();
function cGet(k)       { const e = CACHE.get(k); return e && Date.now()-e.ts < e.ttl ? e.v : null; }
function cSet(k, v, t) { CACHE.set(k, { v, ts: Date.now(), ttl: t }); return v; }

// Cache de patch do Data Dragon
let cachedPatch = null;
async function getPatch() {
  if (cachedPatch) return cachedPatch;
  try {
    const r = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json", { timeout: 5000 });
    cachedPatch = r.data[0];
  } catch { cachedPatch = "15.6.1"; }
  return cachedPatch;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROTAS
// ═══════════════════════════════════════════════════════════════════════════════

app.get("/", async (req, res) => {
  const patch = await getPatch();
  res.json({
    status: "Nexus Oracle v4 online",
    patch,
    dataset: `${CHAMP_COUNT} campeões (local)`,
    dependencias_externas: "nenhuma — 100% local + IA para explicação",
    modelo_ia: "llama-3.3-70b-versatile (ilimitado no Groq free)",
  });
});

// ── POST /oracle — Chat principal ─────────────────────────────────────────────
app.post("/oracle", async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    if (!question) return res.status(400).json({ error: "question ausente" });

    const {
      champion = "", role = "",
      allies   = "não informado",
      enemies  = "não informado",
      bans     = "não informado",
    } = context;

    const patch = await getPatch();
    const champName = champion.trim();

    // 1. Motor de pick (server-side)
    const picks = calcularMelhorPick({ role, allies, enemies, bans });

    // 2. Build para o campeão selecionado (se houver)
    const champBuildBlock = champName
      ? formatBuildForPrompt(champName, enemies, allies)
      : "";

    // 3. Bloco de picks calculados
    const picksBlock = picks.length > 0 ? [
      "",
      "━━ MELHORES PICKS CALCULADOS (motor local, sem API) ━━",
      picks.map((p, i) => {
        const medal = ["🥇","🥈","🥉","4.","5."][i];
        return [
          `${medal} ${p.champ} — Score: ${p.score} | WR médio: ${p.avgWR}% | Pior: ${p.worstWR}%`,
          p.synergy   > 0 ? `   +${p.synergy} sinergia com aliados` : "",
          p.compBonus > 0 ? `   +${p.compBonus} vs composição inimiga` : "",
        ].filter(Boolean).join("\n");
      }).join("\n"),
    ].join("\n") : "";

    // 4. Sistema pick #1 completo para IA
    const topPickBlock = picks[0] ? formatPickForPrompt(picks[0]) : "";

    // 5. Composição do time inimigo
    const compTypes = [];
    for (const [tipo, regex] of Object.entries(COMP_REGEX)) {
      if (regex.test(enemies.toLowerCase())) compTypes.push(tipo.replace(/_/g," "));
    }
    const compLine = compTypes.length
      ? `Arquétipo inimigo: ${compTypes.join(", ")}`
      : "Composição inimiga: geral";

    const isBestPick = /melhor pick|qual pick|best pick|qual campe|o que jogar|o que pick|countera|counter|quem ganha|quem é bom/i.test(question);

    const dataBlock = [
      `Patch: ${patch} | Dataset: ${CHAMP_COUNT} campeões locais`,
      `Time aliado: ${allies}`,
      `Time inimigo: ${enemies}`,
      `Bans: ${bans}`,
      compLine,
      champBuildBlock,
      picksBlock,
      isBestPick ? topPickBlock : "",
    ].filter(Boolean).join("\n");

    // 6. Formato do melhor pick
    const pick1 = picks[0];
    const pick1Data = pick1?.data;
    const bestPickFmt = (isBestPick && pick1) ? `
RESPONDA COM ESTE FORMATO EXATO:

🏆 PICK DEFINIDO PELO SISTEMA: **${pick1.champ}** — ${pick1.role}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SCORE: ${pick1.score} | WR médio vs inimigos: ${pick1.avgWR}% | Pior matchup: ${pick1.worstWR}%

🔮 RUNAS DEFINIDAS (use EXATAMENTE estas):
  Keystone: ${pick1Data?.runes?.key}
  Primária: ${pick1Data?.runes?.p} → ${[pick1Data?.runes?.r1, pick1Data?.runes?.r2, pick1Data?.runes?.r3].filter(Boolean).join(" / ")}
  Secundária: ${pick1Data?.runes?.s} → ${[pick1Data?.runes?.s1, pick1Data?.runes?.s2].filter(Boolean).join(" / ")}
  Shards: ${pick1Data?.runes?.sh?.join(" | ")}

⚔️ BUILD DEFINIDA (em ordem):
${(pick1Data?.build || []).map((it, i) => `  ${i+1}. ${it}`).join("\n")}
  Inicial: ${pick1Data?.ini}

✅ POR QUE ESSE PICK VENCE ESSA COMPOSIÇÃO:
[Explique 2-3 razões baseadas nos inimigos específicos acima]

🔄 ALTERNATIVAS:
  2°: ${picks[1]?.champ || "—"} (score ${picks[1]?.score || "—"})
  3°: ${picks[2]?.champ || "—"} (score ${picks[2]?.score || "—"})

❌ REGRA: NÃO altere o pick, runas ou build acima. Use EXATAMENTE os dados fornecidos.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : "";

    const systemMsg = [
      "Você é o Nexus Oracle — coach de League of Legends nível LCK/LPL.",
      "REGRAS ABSOLUTAS:",
      "1. Use APENAS dados fornecidos no prompt — NUNCA invente itens ou runas.",
      "2. O pick, runas e build já foram calculados e definidos — você NÃO pode alterá-los.",
      "3. Sua função: explicar por que o sistema escolheu assim baseado na composição inimiga.",
      `4. Classe do campeão: ${champName ? (getChamp(champName)?.cls || "desconhecida") : "N/A"}`,
      "5. Se pergunta NÃO é de pick: explique a build/runas do campeão selecionado.",
      "Responda em português brasileiro, direto e confiante como um coach profissional.",
    ].join(" ");

    const userMsg = `${dataBlock}\n\n${bestPickFmt}\n\nPergunta: ${question}\n\nPatch: ${patch}`;

    const text = await callGroq(systemMsg, userMsg);

    res.json({
      text,
      patch,
      picks_calculados: picks.map(p => ({ champ: p.champ, score: p.score, avgWR: p.avgWR })),
      fonte: "dataset local (100%)",
    });

  } catch (e) {
    const d = e.response?.data || e.message;
    if (Math.random() < 0.2) console.error("[/oracle erro]", JSON.stringify(d).slice(0, 200));
    res.status(500).json({ error: JSON.stringify(d) });
  }
});

// ── POST /analyze — Análise de tela em tempo real ─────────────────────────────
// Dois modos:
//   fast (default, a cada 2s): rule-based, 0ms, 0 tokens de IA
//   deep (a cada 15s): IA textual (llama-3.3, sem limite free)
// Debounce server-side para o modo deep

// ── Ação contextual por estado real do jogo ─────────────────────────────────
// Analisa: minuto + composição inimiga + pick selecionado → gera recomendação real
function gerarAcaoContextual(min, champion, enemies, allies, bestPick) {
  const e = (enemies||"").toLowerCase();
  const a = (allies||"").toLowerCase();
  const c = (champion||"").toLowerCase();
  const hasChamp = c && c !== "";

  // Ameaças identificadas no time inimigo
  const temEngage  = /malphite|amumu|leona|nautilus|blitzcrank|alistar|rell|sejuani|zac/.test(e);
  const temAssass  = /zed|talon|rengar|khazix|akali|diana|leblanc|nocturne|evelynn/.test(e);
  const temCura    = /soraka|yuumi|nami|sona|lulu|mundo|aatrox|warwick|sylas|swain|olaf/.test(e);
  const temPoke    = /jayce|zoe|syndra|xerath|vel|nidalee|ezreal|lux|caitlyn/.test(e);
  const temSplit   = /camille|fiora|jax|tryndamere|yorick|nasus|riven/.test(e);
  const temCC      = /malzahar|leona|amumu|nautilus|blitzcrank|sion|sejuani|morgana|thresh/.test(e);

  // Objetivos por tempo
  if (min >= 0 && min <= 1) return { acao:"Farm seguro, sem risco", urgencia:"baixa",
    detalhes:"Priorize CS perfeito. Não tente kills nível 1 sem vantagem clara." };

  if (min >= 2 && min <= 3) return { acao:"Ward no rio e camp inimigo", urgencia:"baixa",
    detalhes: temAssass ? "⚠️ Assassino inimigo — ward entrância da jungle e jogue com minions." : "Place sentinela no rio. Prepare para level 3 fight." };

  if (min >= 4 && min <= 5) {
    if (temEngage) return { acao:"Recue para torre se engajarem", urgencia:"media",
      detalhes:"Time inimigo tem engage pesado. Não dê abertura longe da torre." };
    if (temPoke) return { acao:"Jogue encostado nos minions", urgencia:"media",
      detalhes:"Poke inimigo ativo. Use minions como escudo vs skillshots. Use cura com sabedoria." };
    return { acao:"1° Dragão se possível (min 5)", urgencia:"media",
      detalhes:"Prepare visão no pit do dragão. Comunique com o time antes de contestar." };
  }

  if (min >= 6 && min <= 7) {
    if (temAssass && hasChamp) return { acao:"Guarde Flash para assassino", urgencia:"alta",
      detalhes:`Assassino inimigo com ultimate disponível. Jogue encostado nos aliados.` };
    return { acao:"Pressione e roame para objetivos", urgencia:"media",
      detalhes:"Power spike de level 6. Confirme kill ou converta pressão em dragão/torre." };
  }

  if (min >= 8 && min <= 10) {
    if (temCura) return { acao:"Compre anti-cura antes de lutar", urgencia:"alta",
      detalhes:"Time inimigo tem cura pesada. Anti-heal obrigatório antes de teamfight." };
    return { acao:"2° Dragão + controle de mapa", urgencia:"media",
      detalhes:"Estabeleça visão no rio. O time com mais dragões vence o mid game." };
  }

  if (min >= 11 && min <= 13) {
    if (temSplit) return { acao:"Não deixe split push inimigo solo", urgencia:"alta",
      detalhes:`${e.includes("camille")||e.includes("fiora")||e.includes("tryndamere")?"Splitpusher":"Alguém"} inimigo ameaça lateral. Mande 1 para pressionar e agrupe 4.` };
    return { acao:"Empurre torre e agrupe", urgencia:"media",
      detalhes:"Mid game: converta pressão de lane em torre. Agrupe para objetivos." };
  }

  if (min >= 14 && min <= 16) {
    return { acao:"Dragão da Alma — prioridade máxima", urgencia:"alta",
      detalhes: temCC ? "⚠️ CC pesado inimigo — Ward pit antes. Flash disponível? Se não, não entre primeiro." : "Prepare visão 60s antes. Não permita contestação sem wards no pit." };
  }

  if (min >= 17 && min <= 19) {
    if (temEngage) return { acao:"Não ande sozinho — engage inimigo ativo", urgencia:"alta",
      detalhes:"Time inimigo tem initiation pesada. Mova em grupo de 3+. Fique com o time." };
    return { acao:"Pressione para Baron às 20", urgencia:"media",
      detalhes:"Garanta visão no pit do Baron. Um teamfight vantajoso aqui fecha o jogo." };
  }

  if (min >= 20 && min <= 24) {
    const pickStr = bestPick ? ` Melhor pick atual: ${bestPick}.` : "";
    return { acao:"Baron Nashor — ward e decisão", urgencia:"alta",
      detalhes:`Baron 20min+. Nunca entre no pit sem visão nos arbustos laterais.${pickStr}` };
  }

  if (min >= 25 && min <= 29) {
    return { acao:"Agrupe e force objetivos", urgencia:"alta",
      detalhes: temSplit ? "Splitpusher inimigo — defender 3, empurrar 2 laterais. Não deixe baron grátis." : "Late game: não divida o time. 1 morte = perda de Baron/Base." };
  }

  if (min >= 30) {
    return { acao:"One teamfight fecha o jogo", urgencia:"alta",
      detalhes:"Nexus vulnerável a qualquer Baron. Jogue em grupo de 5. Um engage vantajoso termina a partida." };
  }

  return null; // usa cache padrão
}

const VISION_DEBOUNCE = 15_000;
let lastVision = 0;
let lastVisionCache = null;

app.post("/analyze", async (req, res) => {
  try {
    const { image, context = {}, gameTime, mode = "fast" } = req.body;
    if (!image && mode !== "fast") return res.status(400).json({ error: "image ausente" });

    const { allies = "", enemies = "", champion = "" } = context;
    const patch = await getPatch();
    const min   = parseInt(gameTime) || 0;

    // ── Dicas de tempo (rule-based, sempre) ──
    const tips = [];
    if (min>=1  && min<=2)  tips.push("Plante sentinela no tribush ou rio lateral");
    if (min>=3  && min<=4)  tips.push("Jungle inimigo pode estar no camp vermelho — ward no rio");
    if (min>=5  && min<=6)  tips.push("Primeiro dragão disponível — pressione bot ou prepare visão");
    if (min>=8  && min<=10) tips.push("Segundo dragão em breve — jungle pode estar rotacionando");
    if (min>=14 && min<=16) tips.push("Dragão da Alma disponível — prioridade máxima de objetivo");
    if (min>=20)            tips.push("Barão Nashor ativo — ward pixel brush e entrada do pit");
    if (min>=25)            tips.push("Late game: não ande sozinho, agrupe para objetivos");
    if (min>=30)            tips.push("Dragão Ancião disponível — lute pelo objetivo ou ceda e recue");

    // ── TOP 3 picks calculados (motor local, rule-based) ──
    let topPicks = [];
    let bestPick = null;
    if (parseList(enemies).length >= 1) {
      topPicks  = calcularMelhorPick({ role: context.role || "mid", allies, enemies });
      bestPick  = topPicks[0] || null;
    }
    // Fallback se motor não achar nada
    if (!topPicks.length) {
      const fallbackPool = ["Ahri","Orianna","Syndra","Zed","LeeSin"];
      topPicks = fallbackPool.map((c,i) => ({ champ:c, score:50, avgWR:50, worstWR:50, synergy:0, compBonus:0 }));
      bestPick = topPicks[0];
    }

    // ── MODO FAST: rule-based instantâneo ──
    const now = Date.now();
    const canDeep = (now - lastVision) >= VISION_DEBOUNCE;

    if (mode === "fast" || !canDeep) {
      const obs = [...tips.slice(0, 3)];
      const base = lastVisionCache || {
        acao: tips[0] || "Foque no CS e posicionamento",
        urgencia: "baixa",
        detalhes: `Min ${min}: jogue seguro, prepare o próximo objetivo`,
      };
      // Gera ação contextual real baseada no estado atual do jogo
      const ctxAcao = gerarAcaoContextual(min, champion, enemies, allies, bestPick?.champ);
      if(ctxAcao) { base.acao = ctxAcao.acao; base.urgencia = ctxAcao.urgencia; base.detalhes = ctxAcao.detalhes; }

      return res.json({
        ...base,
        observacoes: obs,
        picks: topPicks.slice(0, 3).map(p => ({
          champ: p.champ, score: p.score, avgWR: p.avgWR, worstWR: p.worstWR,
          synergy: p.synergy, compBonus: p.compBonus,
          data: { runes: p.data?.runes, build: p.data?.build, ini: p.data?.ini, f: p.data?.f, cls: p.data?.cls },
        })),
        best: bestPick?.champ || "",
        fonte: "rule-based",
        proximaAnalise: canDeep ? "disponível" : `${Math.round((VISION_DEBOUNCE-(now-lastVision))/1000)}s`,
      });
    }

    // ── MODO DEEP: IA textual (sem vision model, sem limite) ──
    lastVision = now;

    const pickLine = bestPick
      ? `MELHOR PICK RECOMENDADO: ${bestPick.champ} (score ${bestPick.score}, WR médio ${bestPick.avgWR}%)`
      : "";

    const champBuild = champion ? formatBuildForPrompt(champion, enemies, allies) : "";

    const contextStr = `
Coach Challenger analisando partida ao vivo. Patch ${patch}.
Campeão atual: ${champion || "desconhecido"}.
Aliados: ${allies || "não informado"}.
Inimigos: ${enemies || "não informado"}.
Minuto: ${min}.
${pickLine}

${champBuild ? "BUILD ATUAL:\n" + champBuild.split("\n").slice(0,8).join("\n") : ""}

Dicas baseadas no minuto:
${tips.map(t => "• " + t).join("\n") || "• Jogue seguro"}

Com base no contexto acima, retorne APENAS JSON válido:
{
  "acao": "ação prioritária agora (até 7 palavras)",
  "urgencia": "alta ou media ou baixa",
  "detalhes": "análise em 1 frase do que deve fazer agora",
  "observacoes": ["dica 1", "dica 2", "dica 3"],
  "pick": "${bestPick?.champ || ''}"
}
Urgência: alta = perigo imediato | media = objetivo disponível | baixa = estável`;

    let parsed;
    try {
      const raw = await callGroq(
        "Coach de LoL nível Challenger. Responda apenas com JSON válido.",
        contextStr,
        300
      );
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : raw);
    } catch {
      parsed = {
        acao: tips[0] || "Foque no CS e posicionamento",
        urgencia: tips.length > 0 ? "media" : "baixa",
        detalhes: `Min ${min}: ${tips[0] || "jogue seguro e aguarde objetivo"}`,
        observacoes: tips.slice(0, 3),
        pick: bestPick?.champ || "",
      };
    }

    lastVisionCache = parsed;
    res.json({
      ...parsed,
      fonte: "ia-textual",
      best: parsed.pick || bestPick?.champ || "",
      picks: topPicks.slice(0, 3).map(p => ({
        champ: p.champ, score: p.score, avgWR: p.avgWR, worstWR: p.worstWR,
        synergy: p.synergy, compBonus: p.compBonus,
        data: { runes: p.data?.runes, build: p.data?.build, ini: p.data?.ini, f: p.data?.f, cls: p.data?.cls },
      })),
    });

  } catch (e) {
    const d = e.response?.data || e.message;
    if (Math.random() < 0.1) console.error("[/analyze erro]", JSON.stringify(d).slice(0, 150));
    res.status(500).json({ error: JSON.stringify(d) });
  }
});

// ── POST /pick — Motor de pick puro (para uso direto do frontend) ─────────────
app.post("/pick", async (req, res) => {
  try {
    const { role = "mid", allies = "", enemies = "", bans = "" } = req.body;
    if (!enemies || enemies === "não informado") return res.status(400).json({ error: "enemies obrigatório" });

    const picks = calcularMelhorPick({ role, allies, enemies, bans });
    if (!picks.length) return res.json({ picks: [], mensagem: "Nenhum pick calculado" });

    res.json({
      picks: picks.map(p => ({
        champ:     p.champ,
        score:     p.score,
        avgWR:     p.avgWR,
        worstWR:   p.worstWR,
        synergy:   p.synergy,
        compBonus: p.compBonus,
        role:      p.role,
        runes:     p.data?.runes,
        build:     p.data?.build,
        ini:       p.data?.ini,
        feiticos:  p.data?.f,
        dicas:     p.data?.d?.slice(0, 2),
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /champ — Dados completos de um campeão ───────────────────────────────
app.post("/champ", (req, res) => {
  const { name } = req.body;
  const data = getChamp(name);
  if (!data) return res.status(404).json({ error: `Campeão "${name}" não encontrado` });
  res.json({ name, ...data });
});

// Start
getPatch().then(p => {
  console.log(`Nexus Oracle v4 | patch ${p} | dataset: ${CHAMP_COUNT} campeões | IA: llama-3.3-70b`);
}).catch(() => {});

app.listen(3000, () => console.log("Servidor na porta 3000"));
