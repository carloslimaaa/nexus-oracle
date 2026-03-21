import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

const GROQ_KEY = process.env.GROQ_KEY;
const RIOT_KEY = process.env.RIOT_KEY; // opcional — habilita dados de OTPs Challenger

// ═══════════════════════════════════════════════════════════════════════
// CACHE
// ═══════════════════════════════════════════════════════════════════════
const CACHE = new Map();
const TTL = {
  patch:   6  * 3600_000,
  dd:      12 * 3600_000,
  lol:     2  * 3600_000,
  riot:    4  * 3600_000,
};
function cacheGet(k)       { const e = CACHE.get(k); return e && Date.now()-e.ts < e.ttl ? e.v : null; }
function cacheSet(k, v, t) { CACHE.set(k, { v, ts: Date.now(), ttl: t }); return v; }

// ═══════════════════════════════════════════════════════════════════════
// DATA DRAGON
// ═══════════════════════════════════════════════════════════════════════
async function getPatch() {
  const c = cacheGet("patch");
  if (c) return c;
  try {
    const r = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json", { timeout: 6000 });
    return cacheSet("patch", r.data[0], TTL.patch);
  } catch { return cacheGet("patch") || "15.1.1"; }
}

async function getDDItems() {
  const c = cacheGet("items");
  if (c) return c;
  try {
    const patch = await getPatch();
    const r = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/item.json`, { timeout: 8000 });
    const map = {};
    for (const [id, it] of Object.entries(r.data.data || {})) map[id] = it.name;
    return cacheSet("items", map, TTL.dd);
  } catch { return cacheGet("items") || {}; }
}

async function getDDRunes() {
  const c = cacheGet("runes");
  if (c) return c;
  try {
    const patch = await getPatch();
    const r = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/runesReforged.json`, { timeout: 8000 });
    const map = {};
    for (const tree of (r.data || [])) {
      map[tree.id] = tree.name;
      for (const row of (tree.slots || []))
        for (const rune of (row.runes || [])) map[rune.id] = rune.name;
    }
    return cacheSet("runes", map, TTL.dd);
  } catch { return cacheGet("runes") || {}; }
}

async function getDDChampions() {
  const c = cacheGet("champs_dd");
  if (c) return c;
  try {
    const patch = await getPatch();
    const r = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion.json`, { timeout: 8000 });
    // map: "lesin" → "LeeSin", "chogath" → "Chogath", etc.
    const map = {};
    for (const [key, data] of Object.entries(r.data.data || {})) {
      map[key.toLowerCase()] = key;
      map[data.name.toLowerCase()] = key;
    }
    return cacheSet("champs_dd", map, TTL.dd);
  } catch { return cacheGet("champs_dd") || {}; }
}

async function toDDKey(name) {
  if (!name) return "";
  const champMap = await getDDChampions();
  const normalized = name.toLowerCase()
    .replace(/['\s]+/g, "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // tenta direto, depois normalizado, depois parcial
  return champMap[name.toLowerCase()] ||
         champMap[normalized] ||
         Object.keys(champMap).find(k => k.replace(/['\s]/g,"") === normalized) && champMap[Object.keys(champMap).find(k => k.replace(/['\s]/g,"") === normalized)] ||
         name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace(/\s+/g,"");
}

// ═══════════════════════════════════════════════════════════════════════
// LOLALYTICS — 3 tipos de fetch:
//   1. base()   → build + runas gerais do campeão na rota
//   2. vs()     → WR vs cada inimigo específico
//   3. with()   → WR com aliados (sinergia)
// ═══════════════════════════════════════════════════════════════════════
const LL_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0",
  "Accept": "application/json, */*",
  "Referer": "https://lolalytics.com/",
};
const LANE_MAP = { top:"top", jungle:"jungle", mid:"mid", adc:"adc", bot:"adc", sup:"support", support:"support", suporte:"support" };

async function llFetch(url) {
  try {
    const r = await axios.get(url, { timeout: 8000, headers: LL_HEADERS });
    if (r.status === 200 && r.data && typeof r.data === "object") return r.data;
  } catch (e) { console.log("[LL fail]", url.slice(0,90), e.message?.slice(0,60)); }
  return null;
}

async function lolalyticsBase(champName, role) {
  const ck = `ll_base:${champName}:${role}`;
  const cached = cacheGet(ck);
  if (cached) return cached;

  const ddKey = await toDDKey(champName);
  const lane  = LANE_MAP[role?.toLowerCase()] || "mid";
  const patch = await getPatch();
  const p2    = patch.split(".").slice(0,2).join("_");

  const urls = [
    `https://lolalytics.com/api/tier1/?lane=${lane}&tier=platinum_plus&patch=${p2}&region=all&queue=ranked_solo_5x5&c=${ddKey}`,
    `https://lolalytics.com/api/tier1/?lane=${lane}&tier=platinum_plus&patch=&region=all&queue=ranked_solo_5x5&c=${ddKey}`,
    `https://lolalytics.com/api/tier1/?lane=${lane}&tier=gold_plus&patch=&region=all&queue=ranked_solo_5x5&c=${ddKey}`,
  ];

  for (const url of urls) {
    const d = await llFetch(url);
    if (d) {
      const result = await parseLLBase(d, ddKey, lane);
      if (result.valid) return cacheSet(ck, result, TTL.lol);
    }
  }
  return null;
}

async function lolalyticsVs(champName, enemyName, role) {
  const ddKey = await toDDKey(champName);
  const ddEnemy = await toDDKey(enemyName);
  const lane = LANE_MAP[role?.toLowerCase()] || "mid";
  const ck = `ll_vs:${ddKey}:${ddEnemy}:${lane}`;
  const cached = cacheGet(ck);
  if (cached) return cached;

  const url = `https://lolalytics.com/api/vs1/?lane=${lane}&tier=platinum_plus&patch=&region=all&queue=ranked_solo_5x5&c=${ddKey}&e=${ddEnemy}`;
  const d = await llFetch(url);
  if (!d) return null;

  // extrai WR vs inimigo
  const wr = d.header?.winRate || d.winRate || d.wr || null;
  const n  = d.header?.n || d.n || 0;
  if (!wr) return null;
  const result = { valid: true, enemy: ddEnemy, winRate: Math.round(parseFloat(wr)*100)/100, games: n };
  return cacheSet(ck, result, TTL.lol);
}

async function lolalyticsComp(champName, role, allies, enemies) {
  // Busca WR vs cada inimigo e com cada aliado em paralelo
  const allChamps = [...(allies||[]), ...(enemies||[])].filter(Boolean);
  if (!allChamps.length) return { vsData: [], withData: [] };

  const ddKey = await toDDKey(champName);
  const lane  = LANE_MAP[role?.toLowerCase()] || "mid";

  const vsResults   = [];
  const withResults = [];

  await Promise.all(allChamps.map(async (c) => {
    const ddC = await toDDKey(c);
    if (!ddC) return;

    // vs inimigos
    if ((enemies||[]).some(e => e.toLowerCase().includes(c.toLowerCase()))) {
      const url = `https://lolalytics.com/api/vs1/?lane=${lane}&tier=platinum_plus&patch=&region=all&queue=ranked_solo_5x5&c=${ddKey}&e=${ddC}`;
      const d = await llFetch(url);
      if (d) {
        const wr = d.header?.winRate || d.winRate || d.wr;
        if (wr) vsResults.push({ champ: ddC, wr: Math.round(parseFloat(wr)*100)/100, games: d.header?.n || d.n || 0 });
      }
    }

    // with aliados
    if ((allies||[]).some(a => a.toLowerCase().includes(c.toLowerCase()))) {
      const url = `https://lolalytics.com/api/champion/?lane=${lane}&tier=platinum_plus&patch=&region=all&queue=ranked_solo_5x5&c=${ddKey}&e=${ddC}&type=duo`;
      const d = await llFetch(url);
      if (d) {
        const wr = d.header?.winRate || d.winRate || d.wr;
        if (wr) withResults.push({ champ: ddC, wr: Math.round(parseFloat(wr)*100)/100, games: d.header?.n || d.n || 0 });
      }
    }
  }));

  return { vsData: vsResults, withData: withResults };
}

async function parseLLBase(raw, champName, lane) {
  if (!raw || typeof raw !== "object") return { valid: false };
  const itemsMap = await getDDItems();
  const runesMap = await getDDRunes();
  const res = { valid: false, fonte: "lolalytics", champion: champName, lane, games: 0, builds: [], runas: [], skillOrder: "" };

  const header = raw.header || raw.Header || {};
  res.games = header.n || header.count || raw.n || 0;

  // ── BUILDS ──
  // lolalytics retorna itens como "3152_3020_3157" → ids separados por _
  const itemData = raw.build?.item || raw.item || raw.items || {};
  if (typeof itemData === "object" && !Array.isArray(itemData)) {
    const entries = Object.entries(itemData)
      .filter(([k, v]) => typeof v === "object" && (v.n || 0) > 30)
      .map(([k, v]) => {
        const ids    = k.split("_").filter(Boolean);
        const names  = ids.map(id => itemsMap[id]).filter(Boolean);
        const wr     = v.wins ? Math.round((v.wins / v.n) * 100) : (v.wr ? Math.round(v.wr) : 0);
        const pr     = res.games > 0 ? Math.round((v.n / res.games) * 100) : 0;
        return { names, wr, pr, n: v.n };
      })
      .filter(x => x.names.length >= 3)
      .sort((a, b) => (b.pr * 0.5 + b.wr * 0.5) - (a.pr * 0.5 + a.wr * 0.5));

    res.builds = entries.slice(0, 3).map((x, i) => ({
      items: x.names,
      winRate: x.wr,
      pickRate: x.pr,
      label: i === 0 ? "mais popular" : i === 1 ? "alternativa" : "situacional",
    }));
  }

  // ── RUNAS ──
  const runaData = raw.rune || raw.runes || raw.Runes || {};
  const keystoneData = runaData.keystone || {};
  if (typeof keystoneData === "object" && !Array.isArray(keystoneData)) {
    const ks = Object.entries(keystoneData)
      .filter(([, v]) => v && typeof v === "object" && (v.n || 0) > 10)
      .map(([id, v]) => ({
        id, name: runesMap[id] || `#${id}`,
        n: v.n || 0,
        wr: v.wins ? Math.round((v.wins / v.n) * 100) : (v.wr ? Math.round(v.wr) : 0)
      }))
      .sort((a, b) => b.n - a.n);

    if (ks.length > 0) {
      // tenta pegar a árvore primária
      const primaryTree = raw.rune?.primary || {};
      const primaryId   = Object.entries(primaryTree)
        .filter(([, v]) => v && v.n > 10)
        .sort(([, a], [, b]) => (b.n||0) - (a.n||0))[0]?.[0];

      const secondaryTree = raw.rune?.secondary || {};
      const secondaryId   = Object.entries(secondaryTree)
        .filter(([, v]) => v && v.n > 10)
        .sort(([, a], [, b]) => (b.n||0) - (a.n||0))[0]?.[0];

      res.runas = ks.slice(0, 2).map((k, i) => ({
        keystone: k.name,
        primary:  runesMap[primaryId]   || "",
        secondary: runesMap[secondaryId] || "",
        winRate: k.wr,
        pickRate: res.games > 0 ? Math.round((k.n / res.games) * 100) : 0,
        label: i === 0 ? "mais popular" : "alternativa",
      }));
    }
  }

  // ── SKILL ORDER ──
  const skills = raw.skills || raw.skill || {};
  if (typeof skills === "object") {
    const orders = Object.entries(skills)
      .filter(([, v]) => v && typeof v === "object" && (v.n||0) > 20)
      .sort(([, a], [, b]) => (b.n||0) - (a.n||0));
    if (orders[0]) res.skillOrder = orders[0][0]; // ex: "QWEQRQEQRQERQERE"
  }

  res.valid = res.builds.length > 0 || res.runas.length > 0;
  return res;
}

// ═══════════════════════════════════════════════════════════════════════
// RIOT API — Challenger OTPs
// Requer RIOT_KEY env var. Região padrão: BR1
// ═══════════════════════════════════════════════════════════════════════
async function riotFetch(url, region = "br1") {
  if (!RIOT_KEY) return null;
  const base = region.includes("americas") ? "https://americas.api.riotgames.com" : `https://${region}.api.riotgames.com`;
  try {
    const r = await axios.get(base + url, {
      timeout: 8000,
      headers: { "X-Riot-Token": RIOT_KEY },
    });
    return r.data;
  } catch (e) {
    if (e.response?.status === 403) console.log("[Riot] API key inválida ou expirada");
    else if (e.response?.status === 429) console.log("[Riot] Rate limit atingido");
    else console.log("[Riot fail]", url.slice(0,60), e.message?.slice(0,40));
    return null;
  }
}

async function riotChallengerOTPs(champName, role) {
  if (!RIOT_KEY) return null;
  const ck = `riot_otp:${champName}:${role}`;
  const cached = cacheGet(ck);
  if (cached) return cached;

  // 1. Busca champion ID pelo nome
  const champMap = await getDDChampions();
  const ddKey    = champMap[champName.toLowerCase()] || champName;
  const patch    = await getPatch();
  let champId    = null;

  try {
    const r = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion/${ddKey}.json`, { timeout: 6000 });
    champId = parseInt(r.data?.data?.[ddKey]?.key);
  } catch { return null; }

  if (!champId) return null;

  // 2. Busca ladder Challenger
  const queueMap = { top:"RANKED_SOLO_5x5", jungle:"RANKED_SOLO_5x5", mid:"RANKED_SOLO_5x5", adc:"RANKED_SOLO_5x5", sup:"RANKED_SOLO_5x5" };
  const ladder = await riotFetch(`/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`);
  if (!ladder?.entries?.length) return null;

  console.log(`[Riot] Challenger ladder: ${ladder.entries.length} jogadores`);

  // 3. Pega top 30 por wins (mais prováveis OTPs)
  const topPlayers = ladder.entries
    .filter(e => e.wins + e.losses >= 50)
    .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
    .slice(0, 30);

  // 4. Para cada jogador, busca PUUID e recentes matches com o campeão
  const otpBuilds = [];
  const BATCH = 5; // máximo simultâneo para não bater rate limit

  for (let i = 0; i < Math.min(topPlayers.length, 20); i += BATCH) {
    const batch = topPlayers.slice(i, i + BATCH);
    await Promise.all(batch.map(async (player) => {
      try {
        // Get summoner info (puuid)
        const summ = await riotFetch(`/lol/summoner/v4/summoners/${player.summonerId}`);
        if (!summ?.puuid) return;

        // Get recent matches with this champion
        const matches = await riotFetch(
          `/lol/match/v5/matches/by-puuid/${summ.puuid}/ids?queue=420&count=10`,
          "americas"
        );
        if (!matches?.length) return;

        // Fetch match details and extract items
        let champMatches = 0;
        for (const matchId of matches.slice(0, 5)) {
          const match = await riotFetch(`/lol/match/v5/matches/${matchId}`, "americas");
          if (!match) continue;

          const participant = match.info?.participants?.find(
            p => p.puuid === summ.puuid && p.championId === champId
          );
          if (!participant) continue;

          champMatches++;
          const builtItems = [
            participant.item0, participant.item1, participant.item2,
            participant.item3, participant.item4, participant.item5,
          ].filter(id => id > 0);

          const itemsMap = await getDDItems();
          const runesMap = await getDDRunes();

          const itemNames   = builtItems.map(id => itemsMap[String(id)]).filter(Boolean);
          const keystoneId  = participant.perks?.styles?.[0]?.selections?.[0]?.perk;
          const primaryId   = participant.perks?.styles?.[0]?.style;
          const secondaryId = participant.perks?.styles?.[1]?.style;

          if (itemNames.length >= 4) {
            otpBuilds.push({
              summoner:   player.summonerId.slice(0, 10) + "...",
              lp:         player.leaguePoints,
              wins:       player.wins,
              losses:     player.losses,
              items:      itemNames,
              keystone:   runesMap[keystoneId] || "",
              primary:    runesMap[primaryId]  || "",
              secondary:  runesMap[secondaryId] || "",
              win:        participant.win,
              kills:      participant.kills,
              deaths:     participant.deaths,
              assists:    participant.assists,
              matchId,
            });
          }
          if (champMatches >= 3) break;
        }
      } catch (e) { /* ignora jogador específico */ }
    }));

    if (otpBuilds.length >= 8) break; // suficiente
    await new Promise(r => setTimeout(r, 500)); // small delay entre batches
  }

  if (!otpBuilds.length) return null;

  // Agrupa e encontra as builds mais frequentes
  const result = {
    valid:     true,
    fonte:     "Riot API — Challenger OTPs",
    champion:  ddKey,
    lane:      role,
    totalGames: otpBuilds.length,
    builds:    consolidateOTPBuilds(otpBuilds),
    runas:     consolidateOTPRunes(otpBuilds),
    raw:       otpBuilds.slice(0, 5),
  };

  return cacheSet(ck, result, TTL.riot);
}

function consolidateOTPBuilds(builds) {
  // Encontra o item mítico mais comum (item 0-1 geralmente é o mítico)
  const firstItems = {};
  for (const b of builds) {
    const key = b.items[0];
    if (!key) continue;
    firstItems[key] = (firstItems[key] || 0) + 1;
  }
  const topMythic = Object.entries(firstItems).sort((a,b)=>b[1]-a[1]).map(([k])=>k);

  // Para cada mítico top, encontra a build mais comum
  return topMythic.slice(0,2).map(mythic => {
    const matching = builds.filter(b => b.items[0] === mythic);
    // Conta frequência de cada item subsequente
    const freq = {};
    for (const b of matching) {
      for (let i = 1; i < b.items.length; i++) {
        freq[b.items[i]] = (freq[b.items[i]] || 0) + 1;
      }
    }
    const topItems = Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
    const winRate  = Math.round((matching.filter(b=>b.win).length / matching.length) * 100);
    return {
      items:   [mythic, ...topItems.slice(0,5)],
      games:   matching.length,
      winRate,
      label:   `OTP Challenger (${matching.length} partidas — WR ${winRate}%)`,
    };
  });
}

function consolidateOTPRunes(builds) {
  const ksFreq = {};
  for (const b of builds) {
    if (b.keystone) ksFreq[b.keystone] = (ksFreq[b.keystone] || 0) + 1;
  }
  return Object.entries(ksFreq)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,2)
    .map(([ks, n]) => {
      const matching = builds.filter(b => b.keystone === ks);
      const primary   = mostFrequent(matching.map(b=>b.primary));
      const secondary = mostFrequent(matching.map(b=>b.secondary));
      const wr        = Math.round((matching.filter(b=>b.win).length / matching.length)*100);
      return { keystone: ks, primary, secondary, games: n, winRate: wr, label: `OTP (${n} jogadores — WR ${wr}%)` };
    });
}

function mostFrequent(arr) {
  const freq = {};
  for (const x of arr) if (x) freq[x] = (freq[x]||0)+1;
  return Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] || "";
}

// ═══════════════════════════════════════════════════════════════════════
// ANÁLISE DE COMPOSIÇÃO — identifica o arquétipo do time inimigo/aliado
// ═══════════════════════════════════════════════════════════════════════
function analisarComp(teamStr) {
  if (!teamStr || teamStr === "não informado") return { tipos: [], descricao: "" };
  const t = teamStr.toLowerCase();

  const TIPOS = {
    engage_duro:  /malphite|amumu|jarvan|sejuani|leona|nautilus|blitzcrank|alistar|rell|wukong/,
    poke:         /jayce|zoe|syndra|xerath|vel|nidalee|ezreal|corki|karma|lux|caitlyn|jinx/,
    assassino:    /zed|talon|rengar|khazix|akali|diana|leblanc|fizz|katarina|shaco|nocturne|evelynn/,
    split_push:   /camille|fiora|jax|tryndamere|yorick|nasus|yasuo|riven|irelia/,
    teamfight:    /orianna|azir|amumu|malphite|zyra|rumble|kennen|jarvan|wukong/,
    cura_pesada:  /soraka|yuumi|nami|sona|lulu|mundo|aatrox|warwick|sylas|swain|olaf|gwen/,
    escudos:      /lulu|janna|karma|renata|seraphine|shen|orianna/,
    carry_ad:     /jinx|caitlyn|jhin|draven|vayne|tristana|twitch|ezreal|kaisa|xayah/,
    carry_ap:     /syndra|leblanc|veigar|ahri|zoe|orianna|azir|cassiopeia/,
    cc_pesado:    /malzahar|nautilus|blitzcrank|leona|amumu|morgana|alistar|thresh|sion|sejuani/,
  };

  const tipos = [];
  for (const [tipo, regex] of Object.entries(TIPOS)) {
    if (regex.test(t)) tipos.push(tipo);
  }

  const descricoes = {
    engage_duro:  "engage duro (engage de diving)",
    poke:         "poke pesado (lane de desgaste)",
    assassino:    "assassinos (dive em carries)",
    split_push:   "split push (pressão lateral)",
    teamfight:    "teamfight pesado (lutas em grupo)",
    cura_pesada:  "cura excessiva (precisa de grievous wounds)",
    escudos:      "escudos (precisa de quebra-escudo)",
    carry_ad:     "carry AD principal",
    carry_ap:     "carry AP principal",
    cc_pesado:    "CC em cadeia (precisa de tenacidade/cleanse)",
  };

  return {
    tipos,
    descricao: tipos.map(t => descricoes[t]).filter(Boolean).join("; ") || "composição geral",
  };
}

// ═══════════════════════════════════════════════════════════════════════
// CLASSE DO CAMPEÃO + ITENS SITUACIONAIS CORRETOS POR CLASSE
// ═══════════════════════════════════════════════════════════════════════
const CLASSE_MAP = {
  adc:         ["jinx","caitlyn","jhin","ezreal","draven","varus","ashe","sivir","tristana","twitch",
                 "kogmaw","xayah","kalista","aphelios","samira","nilah","zeri","smolder","graves","quinn",
                 "vayne","lucian","misfortune","draven","senna"],
  mago:        ["lux","syndra","orianna","veigar","ahri","zoe","vel","xerath","anivia","annie",
                 "malzahar","heimerdinger","neeko","ziggs","azir","viktor","cassiopeia","taliyah",
                 "aurelionsol","hwei","ryze","lissandra","brand","seraphine","karma","morgana","zyra",
                 "sona","zilean","galio","corki","swain"],
  assassino_ap:["fizz","ekko","katarina","akali","diana","evelynn","leblanc","qiyana","sylas","naafiri"],
  assassino_ad:["zed","talon","khazix","rengar","nocturne","akshan","shaco","kayn"],
  lutador:     ["darius","garen","irelia","camille","fiora","jax","riven","renekton","tryndamere",
                 "ambessa","aatrox","wukong","xinzhao","vi","jarvaniv","kled","olaf","urgot","sett",
                 "yorick","illaoi","gwen","trundle","leesin","briar","yasuo","yone","volibear",
                 "warwick","nasus","mordekaiser","belveth"],
  tank:        ["malphite","maokai","ornn","chogath","sion","nautilus","leona","rell","amumu","zac",
                 "sejuani","poppy","rammus","hecarim","udyr","nunu","skarner","drmundo","tahm",
                 "alistar","braum","blitzcrank"],
  enchanter:   ["lulu","soraka","nami","janna","karma","sona","yuumi","milio","seraphine","zilean",
                 "renata","bard","ivern"],
  sup_engage:  ["thresh","nautilus","blitzcrank","alistar","braum","rell","rakan","pyke","morgana",
                 "brand","zyra","leona"],
};

function getClasse(name) {
  if (!name) return "desconhecido";
  const n = name.toLowerCase().replace(/['\s]+/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  for (const [c, lista] of Object.entries(CLASSE_MAP)) {
    if (lista.some(x => n===x || n.startsWith(x) || x.startsWith(n))) return c;
  }
  return "desconhecido";
}

function situacionaisPorClasse(classe, enemies, allies) {
  const e = (enemies||"").toLowerCase();
  const a = (allies||"").toLowerCase();
  const temCura    = /soraka|yuumi|nami|sona|lulu|mundo|aatrox|warwick|irelia|sylas|swain|vladimir|olaf|gwen|nasus|fiora/.test(e);
  const temTanks   = (e.match(/malphite|maokai|ornn|cho|sion|zac|sejuani|poppy|rammus|leona|nautilus|alistar|thresh|amumu|garen|drmundo|nasus/g)||[]).length >= 1;
  const temEscudos = /lulu|janna|karma|renata|seraphine|shen|orianna/.test(e);
  const temAssAD   = /zed|talon|rengar|khazix|nocturne|naafiri/.test(e);
  const temAPCC    = /malzahar|veigar|syndra|lux|orianna|xerath|anivia|annie/.test(e);
  const temCCHard  = /malzahar|nautilus|blitzcrank|leona|amumu|morgana|alistar|thresh/.test(e);
  const fullAP     = !/darius|garen|zed|talon|jinx|caitlyn|jhin|ezreal|draven|graves|irelia|jax|riven|fiora|aatrox|ambessa|olaf|renekton|wukong|xin|vi|tryndamere|yasuo|yone|urgot|sett/.test(e);

  const items = [], runas = [];

  if (["adc","adc_onhit"].includes(classe)) {
    if (temCura)    items.push("🔪 **Lembrete Mortal** — anti-cura para AD (nunca Morellonomicon, que é item AP)");
    if (temTanks)   items.push("🐙 **Kraken Slayer** + **Lembrete Mortal** — % HP dano vs tanques");
    if (temEscudos) items.push("🐍 **Serpentine Fang** — quebra shields de Lulu/Janna/Karma");
    if (fullAP)     items.push("🔵 **Mercurial Scimitar** — MR + cleanse vs time full AP");
    if (temAssAD)   items.push("💀 **Guardião Mortal** — MR vs assassino AD foca em você");

  } else if (["mago","assassino_ap"].includes(classe)) {
    if (temCura)    items.push("🔮 **Morellonomicon** — anti-cura para AP (nunca Lembrete Mortal, que é item AD)");
    if (temTanks)   items.push("🌀 **Bastão do Vazio** — penetração mágica % obrigatória vs 2+ tanques");
    if (temAssAD)   items.push("⏳ **Ampulheta de Zhonya** slot 3 — sobreviver Zed/Talon/Rengar");
    if (temAPCC)    items.push("🔵 **Véu da Banshee** — bloqueia 1ª habilidade de Malzahar/Veigar/Syndra");
    if (fullAP)     items.push("⏳ **Ampulheta de Zhonya** early — time full AD vai te focar primeiro");

  } else if (classe === "assassino_ad") {
    if (temCura)    items.push("🔪 **Faca Chempunk Serrilhada** — anti-cura AD (nunca Morellonomicon)");
    if (temTanks)   items.push("🗡️ **Rancor de Serylda** — armor pen + slow vs tanques");
    if (temEscudos) items.push("🐍 **Serpentine Fang** — quebra shields");
    if (temCCHard)  items.push("🔵 **Cimitarra Mercurial** — cleanse vs suppressão/root");

  } else if (classe === "lutador") {
    if (temCura)    items.push("🔪 **Faca Chempunk Serrilhada** — anti-cura melee (nunca Morellonomicon)");
    if (temTanks)   items.push("🔪 **Faca Chempunk** ou **Lembrete Mortal** — depends on range");
    if (temEscudos) items.push("🐍 **Serpentine Fang** — vs Lulu/Janna/Karma suporte");
    if (fullAP)     items.push("🍀 **Força da Natureza** + **Botas de Mercúrio** vs time full AP");
    if (temCCHard)  items.push("🔵 **Cimitarra Mercurial** — cleanse vs suppressão/root longo");

  } else if (classe === "tank") {
    if (temCura)    items.push("🌵 **Armadura de Espinhos** — anti-cura tank (nunca Morellonomicon/Lembrete Mortal)");
    if (fullAP)     items.push("🍀 **Força da Natureza** obrigatória vs time full AP");
    if (temAPCC)    items.push("🔵 **Véu da Banshee** — bloqueia 1ª habilidade de mago pesado");

  } else if (["enchanter","sup_engage"].includes(classe)) {
    if (temAssAD)   items.push("🔒 **Vigilância Locket** — dive vai te matar primeiro como enchanter");
    if (temTanks)   items.push("💚 **Fortaleza de Redenção** — utility extra vs tanks tanky");
  }

  if (temTanks && !["tank","enchanter","sup_engage"].includes(classe))
    runas.push("📌 RUNA: **Conquistador** > Eletrocutar vs 2+ tanques (dano sustentado em fights longas)");
  if (temCCHard && !["tank"].includes(classe))
    runas.push("📌 RUNA SECUNDÁRIA: **Lenda: Tenacidade** vs CC pesado (Nautilus/Leona/Malzahar)");
  if (temAssAD && ["mago","assassino_ap"].includes(classe))
    runas.push("📌 RUNA: **Manto de Nuvem** na secundária vs assassino AD — 10s de invulnerabilidade");

  return { items, runas };
}

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
function parseChampList(str) {
  if (!str || str === "não informado") return [];
  return str.split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
}

// ── Ponto 2: sanitizeBuild — valida itens contra Data Dragon ──
function sanitizeBuild(builds, validItemsMap) {
  if (!builds?.length || !validItemsMap) return builds || [];
  const validSet = new Set(Object.values(validItemsMap));
  return builds
    .map(b => ({
      ...b,
      items: (b.items || []).filter(i => {
        if (!i || typeof i !== "string") return false;
        if (validSet.has(i)) return true;
        const lower = i.toLowerCase();
        return [...validSet].some(v => v.toLowerCase() === lower);
      }),
    }))
    .filter(b => b.items.length >= 3);
}

// ── Ponto 3: escolherBuildPorMatchup ──
function escolherBuildPorMatchup(builds, vsData) {
  if (!builds?.length) return null;
  const hasBadMatchup = (vsData || []).some(v => v.wr < 48);
  return [...builds].sort((a, b) => {
    const scoreA = hasBadMatchup
      ? (a.winRate||0)*0.8 + (a.pickRate||0)*0.2
      : (a.pickRate||0)*0.6 + (a.winRate||0)*0.4;
    const scoreB = hasBadMatchup
      ? (b.winRate||0)*0.8 + (b.pickRate||0)*0.2
      : (b.pickRate||0)*0.6 + (b.winRate||0)*0.4;
    return scoreB - scoreA;
  })[0];
}

// ── Detectar ameaça "fed" ──
function detectarAmeaca(killsMap) {
  if (!killsMap || !Object.keys(killsMap).length) return null;
  const ameacas = Object.entries(killsMap)
    .filter(([, kda]) => (kda.kills||0) >= 5 && (kda.deaths||0) <= 2)
    .sort(([,a],[,b]) => b.kills - a.kills);
  if (!ameacas.length) return null;
  const [nome, kda] = ameacas[0];
  return { nome, kills: kda.kills, deaths: kda.deaths, classe: getClasse(nome) };
}

// ── Adapta slot 6 da build com counter para ameaça ──
function adaptarBuildParaAmeaca(items, ameaca, minhaClasse) {
  if (!ameaca || !items?.length) return items;
  const counterMap = {
    assassino_ad: { adc:"Guardião Mortal", mago:"Ampulheta de Zhonya", enchanter:"Vigilância Locket", _:"Guardião Mortal" },
    tank:         { adc:"Lembrete Mortal", mago:"Bastão do Vazio", lutador:"Faca Chempunk Serrilhada", _:"Lembrete Mortal" },
    mago:         { adc:"Mercurial Scimitar", lutador:"Força da Natureza", tank:"Véu da Banshee", _:"Véu da Banshee" },
    assassino_ap: { adc:"Mercurial Scimitar", lutador:"Cimitarra Mercurial", _:"Ampulheta de Zhonya" },
    lutador:      { adc:"Lembrete Mortal", mago:"Morellonomicon", tank:"Armadura de Espinhos", _:"Faca Chempunk Serrilhada" },
  };
  const map  = counterMap[ameaca.classe] || {};
  const item = map[minhaClasse] || map._ ;
  if (!item || items.includes(item)) return items;
  return [...items.slice(0, 5), item];
}

// ═══════════════════════════════════════════════════════════════════════
// ROTAS
// ═══════════════════════════════════════════════════════════════════════
app.get("/", async (req, res) => {
  const patch = await getPatch();
  res.json({
    status: "Nexus Oracle online",
    patch,
    riot_key: RIOT_KEY ? "configurada" : "não configurada (OTPs desabilitados)",
    fontes: ["lolalytics.com (builds + matchups + comp)", "Riot API (Challenger OTPs)", "Data Dragon (nomes)"],
  });
});

// ── POST /oracle ──────────────────────────────────────────────────────
app.post("/oracle", async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    if (!question) return res.status(400).json({ error: "question ausente" });

    const { champion="", role="", allies="não informado", enemies="não informado", bans="não informado" } = context;
    const patch = await getPatch();
    const champName = champion.trim();
    const classe    = getClasse(champName);

    // ─────────────────────────────────────────────────────────────────
    // COLETA DADOS EM PARALELO
    // ─────────────────────────────────────────────────────────────────
    const [llBase, otpData] = await Promise.all([
      champName ? lolalyticsBase(champName, role) : null,
      champName ? riotChallengerOTPs(champName, role) : null,
    ]);

    // Matchups vs inimigos
    const enemyList  = parseChampList(enemies);
    const allyList   = parseChampList(allies);
    const compData   = champName
      ? await lolalyticsComp(champName, role, allyList, enemyList)
      : { vsData: [], withData: [] };

    // Análise de composição
    const compAnalysis = analisarComp(enemies);
    const allyAnalysis = analisarComp(allies);

    // Itens situacionais server-side
    const { items: sitItems, runas: sitRunas } = situacionaisPorClasse(classe, enemies, allies);

    // ── Ponto 2: sanitizar builds contra Data Dragon (remove itens inventados) ──
    const itemsMap = await getDDItems();
    if (llBase?.builds) llBase.builds = sanitizeBuild(llBase.builds, itemsMap);
    if (otpData?.builds) otpData.builds = sanitizeBuild(otpData.builds, itemsMap);

    // ── Ponto 3: escolher a melhor build com base no matchup ──
    // Prioridade: OTP Challenger > lolalytics
    const buildFinal = escolherBuildPorMatchup(otpData?.builds, compData.vsData)
                    || escolherBuildPorMatchup(llBase?.builds,  compData.vsData);

    // ── Ameaça fed (se front enviar KDA) ──
    const killsMap  = context.killsMap || {};
    const ameacaFed = detectarAmeaca(killsMap);
    const buildFinalItems = adaptarBuildParaAmeaca(buildFinal?.items, ameacaFed, classe);


    // ─────────────────────────────────────────────────────────────────
    // FORMATA TUDO PARA O PROMPT
    // ─────────────────────────────────────────────────────────────────
    const sections = [];

    // Lolalytics base
    if (llBase?.valid) {
      sections.push(`━━ LOLALYTICS — BUILDS GERAIS (${llBase.games.toLocaleString()} partidas Platinum+) ━━`);
      llBase.builds.forEach((b, i) => {
        sections.push(`Build ${i+1} [${b.label}] WR:${b.winRate}% Pick:${b.pickRate}%`);
        sections.push(b.items.map((it,idx)=>`  ${idx+1}. ${it}`).join("\n"));
      });
      if (llBase.runas.length) {
        sections.push("\nRunas mais usadas:");
        llBase.runas.forEach(r => sections.push(`  • [${r.label}] Keystone: ${r.keystone}${r.primary?" | Primária: "+r.primary:""}${r.secondary?" | Secundária: "+r.secondary:""} (WR ${r.winRate}%)`));
      }
      if (llBase.skillOrder) sections.push(`  • Skill order mais comum: ${llBase.skillOrder}`);
    } else {
      sections.push(`━━ LOLALYTICS — dados não disponíveis agora para ${champName||"?"} ━━`);
    }

    // Matchups vs inimigos
    if (compData.vsData.length) {
      sections.push(`\n━━ MATCHUPS vs INIMIGOS DESTA PARTIDA ━━`);
      compData.vsData.forEach(m => sections.push(`  • vs ${m.champ}: WR ${m.wr}% (${m.games} jogos) — ${m.wr>=50?"favorável":"desfavorável"}`));
    }

    // Sinergia com aliados
    if (compData.withData.length) {
      sections.push(`\n━━ SINERGIA COM ALIADOS ━━`);
      compData.withData.forEach(m => sections.push(`  • com ${m.champ}: WR ${m.wr}% (${m.games} jogos)`));
    }

    // OTPs Challenger
    if (otpData?.valid) {
      sections.push(`\n━━ RIOT API — CHALLENGER OTPs (${otpData.totalGames} partidas analisadas) ━━`);
      otpData.builds.forEach(b => {
        sections.push(`${b.label}:`);
        sections.push(b.items.map((it,i)=>`  ${i+1}. ${it}`).join("\n"));
      });
      if (otpData.runas.length) {
        sections.push("Runas preferidas pelos OTPs:");
        otpData.runas.forEach(r => sections.push(`  • ${r.keystone} — ${r.primary} / ${r.secondary} (${r.label})`));
      }
    } else if (RIOT_KEY) {
      sections.push(`\n━━ RIOT API — sem dados OTP disponíveis agora ━━`);
    } else {
      sections.push(`\n━━ RIOT API — não configurada (adicione RIOT_KEY no Render para habilitar OTPs Challenger) ━━`);
    }

    // Análise de composição
    sections.push(`\n━━ ANÁLISE DE COMPOSIÇÃO ━━`);
    sections.push(`Time INIMIGO (${enemies}): ${compAnalysis.descricao || "composição não identificada"}`);
    sections.push(`Time ALIADO  (${allies}): ${allyAnalysis.descricao || "composição não identificada"}`);

    // Situacionais server-side
    if (sitItems.length || sitRunas.length) {
      sections.push(`\n━━ AJUSTES SITUACIONAIS (pré-calculados — classe: ${classe}) ━━`);
      sections.push("⚠️ Use EXATAMENTE estes itens situacionais — calculados para a classe do campeão:");
      sitItems.forEach(x => sections.push("  " + x));
      sitRunas.forEach(x => sections.push("  " + x));
    }


    // ── Ponto 4: build final travada — IA apenas explica, não escolhe ──
    if (buildFinalItems?.length) {
      sections.push('\n━━ BUILD FINAL DEFINIDA PELO SISTEMA (NÃO ALTERAR) ━━');
      sections.push('⚠️  A IA DEVE APENAS EXPLICAR ESTA BUILD. PROIBIDO MODIFICAR OS ITENS.');
      buildFinalItems.forEach((it, i) => sections.push(`  ${i+1}. ${it}`));
      if (buildFinal?.winRate) sections.push(`  WR: ${buildFinal.winRate}% | Source: ${buildFinal.label || 'lolalytics'}`);
      if (ameacaFed) sections.push(`  ⚠️  Slot 6 adaptado para ameaça: ${ameacaFed.nome} (${ameacaFed.kills}/${ameacaFed.deaths}) — ${ameacaFed.classe}`);
    } else {
      sections.push('\n━━ BUILD FINAL ━━');
      sections.push('Dados insuficientes para definir build final — use lolalytics acima como referência.');
    }

        const dataBlock = sections.join("\n");

    // ─────────────────────────────────────────────────────────────────
    // Detecta tipo de pergunta
    // ─────────────────────────────────────────────────────────────────
    const isBestPick = /melhor pick|melhor campe|qual pick|best pick|composição|counter|qual jog/i.test(question);
    const bestPickFmt = isBestPick ? `
FORMATO OBRIGATÓRIO:
🏆 MELHOR PICK PARA ESSA COMPOSIÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**[CAMPEÃO RECOMENDADO]** — [Rota]

✅ POR QUÊ É O MELHOR:
• [motivo 1 — resposta ao time INIMIGO]
• [motivo 2 — sinergia com time ALIADO]
• [motivo 3 — se ADC, mencione sinergia com suporte aliado]

📊 DADOS QUE CONFIRMAM:
• WR vs comp inimiga: X% (se disponível)
• WR com suporte aliado: X% (se disponível)

⚔️ COMO VENCE OS INIMIGOS:
• [matchup principal]
• [como lidar com ameaça maior]

🔄 ALTERNATIVAS (se principal estiver banido):
• 2° pick: [campeão] — [motivo]
• 3° pick: [campeão] — [motivo]

❌ EVITE JOGAR: [campeões ruins nessa composição específica]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : "";

    // Anti-hallucination system rule (Ponto 1 do documento)
    const antiHallClass = {
      adc:         'CAMPEÃO AD — anti-cura: LEMBRETE MORTAL. PROIBIDO: Morellonomicon, itens AP.',
      mago:        'CAMPEÃO AP — anti-cura: MORELLONOMICON. PROIBIDO: Lembrete Mortal, itens AD.',
      assassino_ap:'CAMPEÃO AP — anti-cura: MORELLONOMICON. PROIBIDO: Lembrete Mortal, itens AD.',
      assassino_ad:'ASSASSINO AD — anti-cura: FACA CHEMPUNK. PROIBIDO: Morellonomicon.',
      lutador:     'LUTADOR AD — anti-cura: FACA CHEMPUNK/THORNMAIL. PROIBIDO: Morellonomicon.',
      tank:        'TANK — anti-cura: ARMADURA DE ESPINHOS. PROIBIDO: Morellonomicon e Lembrete Mortal.',
    };
    const systemRule = [
      'Você é um analista profissional de League of Legends.',
      'REGRAS CRÍTICAS (NUNCA QUEBRE):',
      '- NÃO invente itens, runas ou builds.',
      '- NÃO mencione itens que não estão na lista fornecida no prompt.',
      '- NÃO use conhecimento externo — use APENAS os dados fornecidos.',
      '- Se não houver dados suficientes, diga claramente.',
      '- A BUILD FINAL foi definida pelo sistema. Você NÃO pode alterá-la.',
      '- Você apenas explica o motivo da build escolhida.',
      `CLASSE: ${classe} — ${antiHallClass[classe]||'respeite a classe.'}`,
      'Prioridade de fonte: OTPs Challenger > lolalytics > conhecimento geral.',
      'Responda em português brasileiro.',
    ].join(' ');

    const prompt = `${dataBlock}

${bestPickFmt}

Pergunta: ${question}

TAREFA:
1. A BUILD FINAL acima foi escolhida pelo sistema — NÃO altere os itens listados
2. Explique POR QUÊ essa build funciona contra a composição inimiga desta partida
3. Mencione os ajustes situacionais usando APENAS itens que estão no prompt
4. Se for pergunta de melhor pick: use o formato definido acima
5. Seja direto — máximo 3 parágrafos de explicação

PROIBIDO: criar itens inexistentes, alterar a build final, sugerir itens fora das listas fornecidas.

Patch: ${patch}`;

    const resp = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      { model:"llama-3.3-70b-versatile", max_tokens:1200, temperature:0.1,
        messages:[{ role:"system", content:systemRule },{ role:"user", content:prompt }] },
      { headers:{ Authorization:`Bearer ${GROQ_KEY}`, "Content-Type":"application/json" }, timeout:35000 }
    );

    res.json({
      text: resp.data.choices[0].message.content,
      patch,
      classe,
      fontes: {
        lolalytics: llBase?.valid ? `${llBase.games} partidas` : "indisponível",
        matchups:   compData.vsData.length,
        sinergias:  compData.withData.length,
        otp_riot:   otpData?.valid ? `${otpData.totalGames} partidas OTP` : (RIOT_KEY ? "sem dados" : "RIOT_KEY não configurada"),
      },
    });

  } catch (e) {
    const d = e.response?.data || e.message;
    console.log("ERRO /oracle:", JSON.stringify(d).slice(0,200));
    res.status(500).json({ error: JSON.stringify(d) });
  }
});

// ── POST /analyze ──────────────────────────────────────────────────────
app.post("/analyze", async (req, res) => {
  try {
    const { image, context = {}, gameTime } = req.body;
    if (!image) return res.status(400).json({ error: "image ausente" });
    const { allies="", enemies="", champion="" } = context;
    const patch = await getPatch();
    const min = parseInt(gameTime) || 0;

    const tips = [];
    if (min>=1  && min<=2)  tips.push("Plante sentinela no tribush ou rio lateral");
    if (min>=3  && min<=4)  tips.push("Jungle inimigo pode estar no camp vermelho — ward no rio");
    if (min>=5  && min<=6)  tips.push("Primeiro dragão disponível — pressione bot ou prepare visão");
    if (min>=8  && min<=10) tips.push("Segundo dragão em breve — jungle provavelmente rotacionando");
    if (min>=14 && min<=16) tips.push("Dragão da Alma disponível — prioridade máxima");
    if (min>=20)            tips.push("Barão Nashor ativo — ward pixel brush e entrada do pit");
    if (min>=25)            tips.push("Late game: não ande sozinho, agrupe para objetivos");

    const prompt = `Coach Challenger de LoL ao vivo. Patch ${patch}. Campeão: ${champion}. Aliados: ${allies}. Inimigos: ${enemies}. Minuto: ${min}.
${tips.length ? "\nDICAS PARA "+min+"min:\n"+tips.map(t=>"• "+t).join("\n") : ""}

Analise o screenshot e retorne APENAS JSON:
{"acao":"instrução em até 7 palavras","urgencia":"alta|media|baixa","detalhes":"1 frase do que você viu","observacoes":["dica1","dica2"]}`;

    const resp = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      { model:"meta-llama/llama-4-scout-17b-16e-instruct", max_tokens:220, temperature:0.1,
        messages:[{ role:"user", content:[
          { type:"text", text:prompt },
          { type:"image_url", image_url:{ url:`data:image/jpeg;base64,${image}` } },
        ]}] },
      { headers:{ Authorization:`Bearer ${GROQ_KEY}`, "Content-Type":"application/json" }, timeout:12000 }
    );

    const raw = resp.data.choices[0].message.content;
    let parsed;
    try { const m = raw.match(/\{[\s\S]*\}/); parsed = JSON.parse(m ? m[0] : raw); }
    catch { parsed = { acao:"Analisando...", urgencia:"baixa", detalhes:raw.slice(0,150), observacoes:[] }; }
    res.json(parsed);

  } catch (e) {
    const d = e.response?.data || e.message;
    console.log("ERRO /analyze:", JSON.stringify(d).slice(0,200));
    res.status(500).json({ error: JSON.stringify(d) });
  }
});

// Start
getPatch().then(p => {
  console.log(`Nexus Oracle | patch ${p} | Riot API: ${RIOT_KEY ? "ON" : "OFF"}`);
  getDDItems().catch(()=>{});
  getDDRunes().catch(()=>{});
  getDDChampions().catch(()=>{});
}).catch(()=>{});

app.listen(3000, () => console.log("Servidor na porta 3000"));
