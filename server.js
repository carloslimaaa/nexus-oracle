import express from "express";
import axios from "axios";
import cors from "cors";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import { D, findChamp, ALIASES, CHAMP_COUNT } from "./dataset.js";

const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GROQ_KEY = process.env.GROQ_KEY || "";
const RIOT_KEY = process.env.RIOT_KEY || "";
const LIVE_AGENT = new https.Agent({ rejectUnauthorized: false });

const CACHE = new Map();
const TTL = {
  patch: 6 * 3600_000,
  ddragon: 6 * 3600_000,
  riotBuild: 20 * 60_000,
  live: 1500,
};
const cGet = (k) => {
  const e = CACHE.get(k);
  return e && Date.now() - e.ts < e.ttl ? e.v : null;
};
const cSet = (k, v, ttl) => (CACHE.set(k, { v, ts: Date.now(), ttl }), v);

const parseList = (str) => (!str || str === "não informado" ? [] : str.split(/[,;/|]+/).map(s => s.trim()).filter(Boolean));
function normalizeKey(name) {
  if (!name) return "";
  const clean = name.toLowerCase().trim().replace(/[’'\s\-\.]+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ALIASES[name.toLowerCase().trim()] || ALIASES[clean] || clean;
}
function getChamp(name) {
  if (!name) return null;
  return D[normalizeKey(name)] || findChamp(name);
}
const ROLE_MAP = { top: "top", jungle: "jungle", mid: "mid", adc: "adc", bot: "adc", support: "support", sup: "support", suporte: "support" };
const LIVE_ROLE_MAP = { TOP: "top", JUNGLE: "jungle", MIDDLE: "mid", BOTTOM: "adc", UTILITY: "support" };

const ITEM_ALIASES = {
  "anel de doran": "Doran's Ring",
  "doran ring": "Doran's Ring",
  "poção": "Health Potion",
  "pocao": "Health Potion",
  "anel de doran + poção": "Doran's Ring + Health Potion",
  "espada longa + poção": "Long Sword + Health Potion",
  "machado longo + poção": "Long Sword + Health Potion",
  "doran shield + poção": "Doran's Shield + Health Potion",
  "doran blade + poção": "Doran's Blade + Health Potion",
  "botas de berserker": "Berserker's Greaves",
  "sandalias do feiticeiro": "Sorcerer's Shoes",
  "sandálias do feiticeiro": "Sorcerer's Shoes",
  "ampulheta de zhonya": "Zhonya's Hourglass",
  "chama das sombras": "Shadowflame",
  "chapéu mortal de rabadon": "Rabadon's Deathcap",
  "bastão do vazio": "Void Staff",
  "veu da banshee": "Banshee's Veil",
  "véu da banshee": "Banshee's Veil",
  "força da trindade": "Trinity Force",
  "dança da morte": "Death's Dance",
  "pele de pedra de gárgula": "Gargoyle Stoneplate",
  "armadura de espinhos": "Thornmail",
  "coração congelado": "Frozen Heart",
  "força da natureza": "Force of Nature",
  "kraken slayer": "Kraken Slayer",
  "fio do infinito": "Infinity Edge",
  "lembrete mortal": "Mortal Reminder",
  "espada do rei destruído": "Blade of the Ruined King",
  "espada do rei destruido": "Blade of the Ruined King",
  "machado negro": "Black Cleaver",
  "sterak's gage": "Sterak's Gage",
  "faca chempunk serrilhada": "Chempunk Chainsword",
  "faca chempunk": "Chempunk Chainsword",
  "cimitarra mercurial": "Mercurial Scimitar",
  "bastão das eras": "Rod of Ages",
  "criador de fendas": "Riftmaker",
  "tormento de liandry": "Liandry's Torment",
  "dente de nashor": "Nashor's Tooth",
  "rylai's crystal scepter": "Rylai's Crystal Scepter",
  "foguetão hextech": "Hextech Rocketbelt",
  "foguetao hextech": "Hextech Rocketbelt",
  "lich bane": "Lich Bane",
  "rapidfire cannon": "Rapid Firecannon",
  "rapid fire cannon": "Rapid Firecannon",
  "lord dominik's regards": "Lord Dominik's Regards",
  "guardião mortal": "Guardian Angel",
  "guardiao mortal": "Guardian Angel",
  "botas de mercúrio": "Mercury's Treads",
  "botas de mercurio": "Mercury's Treads",
  "plated steelcaps": "Plated Steelcaps",
  "botas de aço": "Plated Steelcaps",
};

const RUNE_ALIASES = {
  "domination": "Domination",
  "sorcery": "Sorcery",
  "precision": "Precision",
  "resolve": "Resolve",
  "inspiration": "Inspiration",
  "dark harvest": "Dark Harvest",
  "electrocute": "Electrocute",
  "conqueror": "Conqueror",
  "fleet footwork": "Fleet Footwork",
  "grasp of the undying": "Grasp of the Undying",
  "taste of blood": "Taste of Blood",
  "sudden impact": "Sudden Impact",
  "eyeball collection": "Eyeball Collection",
  "treasure hunter": "Treasure Hunter",
  "ultimate hunter": "Ultimate Hunter",
  "nimbus cloak": "Nimbus Cloak",
  "transcendence": "Transcendence",
  "gathering storm": "Gathering Storm",
  "scorch": "Scorch",
  "manaflow band": "Manaflow Band",
  "triumph": "Triumph",
  "legend: haste": "Legend: Haste",
  "legend: alacrity": "Legend: Alacrity",
  "legend: tenacity": "Legend: Tenacity",
  "coup de grace": "Coup de Grace",
  "cut down": "Cut Down",
  "last stand": "Last Stand",
  "conditioning": "Conditioning",
  "unflinching": "Unflinching",
  "bone plating": "Bone Plating",
  "second wind": "Second Wind",
  "overgrowth": "Overgrowth",
  "demolish": "Demolish",
  "cash back": "Cash Back",
  "cosmic insight": "Cosmic Insight",
  "biscuit delivery": "Biscuit Delivery",
  "jack of all trades": "Jack of All Trades",
  "adaptive force": "Adaptive Force",
  "armor": "Armor",
  "health scaling": "Health Scaling",
  "attack speed": "Attack Speed",
  "ability haste": "Ability Haste",
};

async function getPatch() {
  const cached = cGet("patch");
  if (cached) return cached;
  try {
    const r = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json", { timeout: 7000 });
    return cSet("patch", r.data[0], TTL.patch);
  } catch {
    return cSet("patch", "16.6.1", TTL.patch);
  }
}

async function getDDragon() {
  const cached = cGet("ddragon");
  if (cached) return cached;
  const patch = await getPatch();
  const [champRes, itemRes, spellRes, runeRes] = await Promise.all([
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion.json`, { timeout: 10000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/item.json`, { timeout: 10000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/summoner.json`, { timeout: 10000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/runesReforged.json`, { timeout: 10000 }),
  ]);

  const champions = champRes.data.data || {};
  const championKeyMap = {};
  const championIdMap = {};
  for (const [key, val] of Object.entries(champions)) {
    championKeyMap[normalizeKey(key)] = key;
    championKeyMap[normalizeKey(val.name)] = key;
    championIdMap[String(val.key)] = key;
  }

  const items = itemRes.data.data || {};
  const itemByName = {};
  for (const [id, it] of Object.entries(items)) {
    itemByName[normalizeKey(it.name)] = { id, name: it.name, icon: `https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${id}.png` };
  }

  const spells = spellRes.data.data || {};
  const spellById = {};
  const spellByName = {};
  for (const [key, sp] of Object.entries(spells)) {
    spellById[String(sp.key)] = { name: sp.name, icon: `https://ddragon.leagueoflegends.com/cdn/${patch}/img/spell/${sp.image.full}` };
    spellByName[normalizeKey(sp.name)] = spellById[String(sp.key)];
  }

  const runeByName = {};
  const runeTreeByName = {};
  const runeById = {};
  for (const tree of runeRes.data || []) {
    const treeObj = { id: String(tree.id), name: tree.name, icon: `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}` };
    runeTreeByName[normalizeKey(tree.name)] = treeObj;
    runeById[String(tree.id)] = treeObj;
    for (const slot of tree.slots || []) {
      for (const rune of slot.runes || []) {
        const obj = { id: String(rune.id), name: rune.name, icon: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}` };
        runeByName[normalizeKey(rune.name)] = obj;
        runeById[String(rune.id)] = obj;
      }
    }
  }

  return cSet("ddragon", { patch, championKeyMap, championIdMap, itemByName, items, spellById, spellByName, runeByName, runeTreeByName, runeById }, TTL.ddragon);
}

function currentChampionIcon(ddKey, patch) {
  return ddKey ? `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${ddKey}.png` : "";
}

async function resolveItem(raw) {
  const dd = await getDDragon();
  if (!raw) return null;
  if (typeof raw === "number" || /^\d+$/.test(String(raw))) {
    const id = String(raw);
    const it = dd.items[id];
    if (!it) return null;
    return { id, name: it.name, icon: `https://ddragon.leagueoflegends.com/cdn/${dd.patch}/img/item/${id}.png` };
  }
  const alias = ITEM_ALIASES[normalizeKey(raw)] || raw;
  return dd.itemByName[normalizeKey(alias)] || null;
}

async function resolveRune(raw, isTree = false) {
  const dd = await getDDragon();
  if (!raw) return null;
  if (typeof raw === "number" || /^\d+$/.test(String(raw))) {
    return dd.runeById[String(raw)] || null;
  }
  const alias = RUNE_ALIASES[normalizeKey(raw)] || raw;
  const norm = normalizeKey(alias);
  return isTree ? (dd.runeTreeByName[norm] || dd.runeById[String(raw)] || null) : (dd.runeByName[norm] || dd.runeById[String(raw)] || null);
}

async function normalizeRunePage(runes = {}) {
  const primaryTree = await resolveRune(runes.p, true);
  const secondaryTree = await resolveRune(runes.s, true);
  const primary = (await Promise.all([runes.key, runes.r1, runes.r2, runes.r3].map(r => resolveRune(r)))).filter(Boolean);
  const secondary = (await Promise.all([runes.s1, runes.s2].map(r => resolveRune(r)))).filter(Boolean);
  const shardNames = (runes.sh || []).filter(Boolean).map(s => RUNE_ALIASES[normalizeKey(s)] || s);
  while (shardNames.length < 3) shardNames.push(["Adaptive Force", "Adaptive Force", "Armor"][shardNames.length]);
  return {
    primaryTree,
    secondaryTree,
    primary,
    secondary,
    shards: shardNames.slice(0,3),
  };
}

function deriveSituationalNames(champData, enemies = "", currentNames = []) {
  const cls = champData?.cls || "";
  const e = enemies.toLowerCase();
  const result = [];
  const needPen = /malphite|ornn|sion|rammus|maokai|sejuani|zac|nautilus|leona/.test(e);
  const needAntiHeal = /aatrox|soraka|yuumi|vladimir|swain|warwick|mundo|fiora|gwen/.test(e);
  const needMR = /syndra|ahri|orianna|viktor|anivia|brand|hwei|lux|cassiopeia|zoe/.test(e);
  const needArmor = /zed|talon|rengar|khazix|jhin|jinx|caitlyn|draven|yasuo|yone/.test(e);

  if (cls === "adc") {
    if (needPen) result.push("Lord Dominik's Regards");
    if (needAntiHeal) result.push("Mortal Reminder");
    if (needArmor) result.push("Guardian Angel");
    if (needMR) result.push("Mercurial Scimitar");
  } else if (["mago", "assassino_ap"].includes(cls)) {
    if (needArmor) result.push("Zhonya's Hourglass");
    if (needPen) result.push("Void Staff");
    if (needAntiHeal) result.push("Morellonomicon");
    if (needMR) result.push("Banshee's Veil");
  } else if (["lutador", "assassino_ad"].includes(cls)) {
    if (needAntiHeal) result.push("Chempunk Chainsword");
    if (needPen) result.push("Serylda's Grudge");
    if (needArmor) result.push("Guardian Angel");
    if (needMR) result.push("Force of Nature");
  } else if (cls === "tank") {
    if (needAntiHeal) result.push("Thornmail");
    if (needMR) result.push("Force of Nature");
    if (needArmor) result.push("Frozen Heart");
  }
  return result.filter(n => n && !currentNames.includes(n));
}

async function ensureBuildItems(champData, rawBuild = [], enemies = "") {
  const cls = champData?.cls || "";
  const target = cls === "adc" ? 7 : 6;
  const resolved = [];
  for (const raw of rawBuild) {
    const item = await resolveItem(raw);
    if (item && !resolved.some(x => x.name === item.name)) resolved.push(item);
  }
  const situational = deriveSituationalNames(champData, enemies, resolved.map(x => x.name));
  for (const name of situational) {
    const item = await resolveItem(name);
    if (item && !resolved.some(x => x.name === item.name)) resolved.push(item);
    if (resolved.length >= target) break;
  }
  return resolved.slice(0, target);
}

async function datasetBuildForChampion(champion, role = "", allies = "", enemies = "") {
  const dd = await getDDragon();
  const data = getChamp(champion);
  if (!data) return null;
  const champKey = dd.championKeyMap[normalizeKey(champion)] || dd.championKeyMap[normalizeKey(findChamp(champion)?.name || champion)] || "";
  const primaryRunePage = await normalizeRunePage(data.runes || {});
  const buildItems = await ensureBuildItems(data, data.build || [], enemies);
  const spells = await Promise.all((data.f || ["Flash", "Ignite"]).slice(0,2).map(resolveSpellByName));
  return {
    source: "dataset+ddragon",
    patch: dd.patch,
    champion: findChamp(champion)?.name || champion,
    championKey: champKey,
    championIcon: currentChampionIcon(champKey, dd.patch),
    role: role || data.role || "",
    cls: data.cls || "",
    starter: data.ini || "",
    spells: spells.filter(Boolean),
    runes: primaryRunePage,
    build: buildItems,
    notes: (data.d || []).slice(0, 4),
  };
}

async function resolveSpellByName(raw) {
  const dd = await getDDragon();
  if (!raw) return null;
  return dd.spellByName[normalizeKey(raw)] || null;
}

async function getLiveClient() {
  const cached = cGet("live");
  if (cached) return cached;
  try {
    const r = await axios.get("https://127.0.0.1:2999/liveclientdata/allgamedata", { httpsAgent: LIVE_AGENT, timeout: 1200 });
    return cSet("live", r.data, TTL.live);
  } catch {
    return null;
  }
}

async function riotChampionBuild(champion, role = "", enemies = "", allies = "") {
  if (!RIOT_KEY) return null;
  const dd = await getDDragon();
  const champKey = dd.championKeyMap[normalizeKey(champion)];
  if (!champKey) return null;
  const champId = Object.entries(dd.championIdMap).find(([, key]) => key === champKey)?.[0];
  if (!champId) return null;
  const lane = ROLE_MAP[role] || role || "";
  const cacheKey = `riotbuild:${champKey}:${lane}`;
  const cached = cGet(cacheKey);
  if (cached) return cached;

  const riotGet = async (base, url) => {
    const r = await axios.get(base + url, { timeout: 8000, headers: { "X-Riot-Token": RIOT_KEY } });
    return r.data;
  };
  try {
    const ladder = await riotGet("https://br1.api.riotgames.com", "/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5");
    const entries = (ladder.entries || []).slice().sort((a,b)=> (b.leaguePoints||0)-(a.leaguePoints||0)).slice(0, 12);
    const samples = [];
    for (const entry of entries) {
      if (samples.length >= 10) break;
      try {
        const summ = await riotGet("https://br1.api.riotgames.com", `/lol/summoner/v4/summoners/${entry.summonerId}`);
        const matchIds = await riotGet("https://americas.api.riotgames.com", `/lol/match/v5/matches/by-puuid/${summ.puuid}/ids?queue=420&count=5`);
        for (const matchId of matchIds) {
          const match = await riotGet("https://americas.api.riotgames.com", `/lol/match/v5/matches/${matchId}`);
          const part = (match.info?.participants || []).find(p => String(p.championId) === String(champId) && (!lane || LIVE_ROLE_MAP[p.teamPosition] === lane));
          if (!part) continue;
          const primaryStyle = part.perks?.styles?.[0] || {};
          const secondaryStyle = part.perks?.styles?.[1] || {};
          samples.push({
            items: [part.item0, part.item1, part.item2, part.item3, part.item4, part.item5].filter(x => x > 0),
            primaryTree: primaryStyle.style,
            primaryRunes: (primaryStyle.selections || []).map(s => s.perk).slice(0,4),
            secondaryTree: secondaryStyle.style,
            secondaryRunes: (secondaryStyle.selections || []).map(s => s.perk).slice(0,2),
            spells: [part.summoner1Id, part.summoner2Id],
            win: part.win,
            cls: getChamp(champion)?.cls || "",
          });
          if (samples.length >= 12) break;
        }
      } catch {}
    }
    if (!samples.length) return null;

    const itemFreq = new Map();
    const spellFreq = new Map();
    const runePages = new Map();
    for (const s of samples) {
      for (const it of s.items) itemFreq.set(String(it), (itemFreq.get(String(it)) || 0) + 1);
      const spKey = s.spells.slice().sort((a,b)=>a-b).join("|");
      spellFreq.set(spKey, (spellFreq.get(spKey) || 0) + 1);
      const rKey = JSON.stringify({ p: s.primaryTree, pr: s.primaryRunes, s: s.secondaryTree, sr: s.secondaryRunes });
      runePages.set(rKey, (runePages.get(rKey) || 0) + 1);
    }
    const topItems = [...itemFreq.entries()].sort((a,b)=>b[1]-a[1]).map(([id])=>Number(id)).slice(0,6);
    const topSpellsKey = [...spellFreq.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0] || "4|14";
    const [sp1, sp2] = topSpellsKey.split("|");
    const topRuneKey = [...runePages.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
    const rp = topRuneKey ? JSON.parse(topRuneKey) : null;
    const buildItems = await ensureBuildItems(getChamp(champion), topItems, enemies);
    const runes = rp ? {
      primaryTree: await resolveRune(rp.p, true),
      secondaryTree: await resolveRune(rp.s, true),
      primary: (await Promise.all((rp.pr || []).slice(0,4).map(x => resolveRune(x)))).filter(Boolean),
      secondary: (await Promise.all((rp.sr || []).slice(0,2).map(x => resolveRune(x)))).filter(Boolean),
      shards: ["Adaptive Force", "Adaptive Force", getChamp(champion)?.cls === "tank" ? "Health Scaling" : "Armor"],
    } : await normalizeRunePage(getChamp(champion)?.runes || {});

    const result = {
      source: "riot-high-elo",
      patch: dd.patch,
      champion: findChamp(champion)?.name || champion,
      championKey: champKey,
      championIcon: currentChampionIcon(champKey, dd.patch),
      role: lane || getChamp(champion)?.role || "",
      cls: getChamp(champion)?.cls || "",
      starter: getChamp(champion)?.ini || "",
      spells: [dd.spellById[String(sp1)], dd.spellById[String(sp2)]].filter(Boolean),
      runes,
      build: buildItems,
      notes: (getChamp(champion)?.d || []).slice(0, 4),
      sampleCount: samples.length,
    };
    return cSet(cacheKey, result, TTL.riotBuild);
  } catch {
    return null;
  }
}

// pick engine from dataset only
const POOL = {
  top:["aatrox","camille","darius","fiora","garen","gnar","gwen","irelia","jax","jayce","kayle","kennen","ksante","mordekaiser","ornn","renekton","riven","rumble","sett","shen","sion","trundle","urgot","volibear","wukong","yorick","ambessa"],
  jungle:["amumu","belveth","briar","diana","elise","evelynn","fiddlesticks","graves","hecarim","ivern","jarvaniv","kayn","khazix","kindred","leesin","lillia","masteryi","nidalee","nocturne","nunu","reksai","rengar","sejuani","shaco","taliyah","udyr","vi","viego","warwick","wukong","xinzhao","zac","karthus"],
  mid:["ahri","akali","akshan","anivia","annie","aurelionsol","aurora","azir","cassiopeia","corki","ekko","fizz","galio","hwei","kassadin","katarina","leblanc","lissandra","lux","malzahar","mel","naafiri","neeko","orianna","qiyana","ryze","syndra","sylas","talon","twistedfate","veigar","vel","vex","viktor","vladimir","xerath","yasuo","yone","zed","ziggs","zoe"],
  adc:["aphelios","ashe","caitlyn","draven","ezreal","jhin","jinx","kaisa","kalista","kogmaw","lucian","misfortune","nilah","samira","sivir","smolder","tristana","twitch","varus","vayne","xayah","yunara","zeri"],
  support:["alistar","bard","blitzcrank","brand","braum","janna","karma","leona","lulu","milio","morgana","nami","nautilus","pyke","rakan","rell","renata","seraphine","sona","soraka","tahm","taric","thresh","yuumi","zilean","zyra","swain","senna"],
};
const COMP_REGEX = {
  engage_duro:/malphite|amumu|jarvaniv|sejuani|leona|nautilus|blitzcrank|alistar|rell|wukong/,
  poke:/jayce|zoe|syndra|xerath|vel|nidalee|ezreal|corki|karma|lux|caitlyn/,
  assassino:/zed|talon|rengar|khazix|akali|diana|leblanc|fizz|katarina|nocturne|evelynn/,
  split_push:/camille|fiora|jax|tryndamere|yorick|nasus|riven|irelia/,
  teamfight:/orianna|azir|amumu|malphite|zyra|rumble|kennen|jarvaniv|wukong/,
  cura_pesada:/soraka|yuumi|nami|sona|lulu|mundo|aatrox|warwick|sylas|swain|olaf|gwen/,
  escudos:/lulu|janna|karma|renata|seraphine|shen|orianna/,
  carry_ad:/jinx|caitlyn|jhin|draven|vayne|tristana|twitch|ezreal|kaisa|xayah/,
  carry_ap:/syndra|leblanc|veigar|ahri|zoe|orianna|azir|cassiopeia/,
  cc_pesado:/malzahar|nautilus|blitzcrank|leona|amumu|morgana|alistar|thresh|sion|sejuani/,
};
const COMP_SCORE = {
  engage_duro:{ malphite:5, kennen:4, rumble:4, lissandra:4, janna:5, morgana:4, yasuo:5, yone:4, vex:4 },
  poke:{ vladimir:4, kassadin:4, mordekaiser:4, diana:3, fizz:3, vex:3, zed:3, akali:3 },
  assassino:{ malzahar:5, lissandra:4, galio:4, leona:3, nautilus:3, vex:4, lulu:4 },
  cura_pesada:{ veigar:3, karthus:3, zed:3 },
  teamfight:{ orianna:5, azir:4, amumu:4, malphite:5, kennen:4, fiddlesticks:5, wukong:4 },
  split_push:{ shen:5, twistedfate:4, nocturne:4 },
};
function calcMatchupScore(champKey, enemyKeys) {
  const champData = D[champKey];
  if (!champData?.vs || enemyKeys.length === 0) return { avg: 50, worst: 50 };
  const wrs = enemyKeys.map(ek => champData.vs[ek] || champData.vs[Object.keys(champData.vs).find(k => normalizeKey(k) === ek)] || 50);
  return { avg: wrs.reduce((a,b)=>a+b,0)/wrs.length, worst: Math.min(...wrs) };
}
function calcSynergyBonus(champKey, allyKeys) {
  const data = D[champKey];
  if (!data?.syn) return 0;
  let b = 0;
  for (const ally of allyKeys) {
    if (data.syn[ally]) b += data.syn[ally];
    const ad = D[ally];
    if (ad?.syn?.[champKey]) b += ad.syn[champKey];
  }
  return Math.min(b, 10);
}
function calcCompBonus(champKey, enemies) {
  let b=0; const e = enemies.toLowerCase();
  for (const [tipo,regex] of Object.entries(COMP_REGEX)) if (regex.test(e) && COMP_SCORE[tipo]?.[champKey]) b += COMP_SCORE[tipo][champKey];
  return Math.min(b, 10);
}
function formatChampName(key) { return findChamp(key)?.name || key.charAt(0).toUpperCase() + key.slice(1); }
function calcularMelhorPick({ role = "mid", allies = "", enemies = "", bans = "" }) {
  const lane = ROLE_MAP[role] || "mid";
  const pool = POOL[lane] || POOL.mid;
  const enemyKeys = parseList(enemies).map(normalizeKey).slice(0,5);
  const allyKeys = parseList(allies).map(normalizeKey).slice(0,4);
  const banKeys = parseList(bans).map(normalizeKey);
  const out = [];
  for (const champKey of pool) {
    if (banKeys.includes(champKey) || enemyKeys.includes(champKey)) continue;
    const data = D[champKey];
    if (!data) continue;
    const { avg, worst } = calcMatchupScore(champKey, enemyKeys);
    const score = avg * 0.7 + worst * 0.3 + calcSynergyBonus(champKey, allyKeys) + calcCompBonus(champKey, enemies);
    out.push({ champ: formatChampName(champKey), champKey, role: lane, score: Math.round(score), avgWR: Math.round(avg), worstWR: Math.round(worst), synergy: calcSynergyBonus(champKey, allyKeys), compBonus: calcCompBonus(champKey, enemies), data });
  }
  return out.sort((a,b)=>b.score-a.score).slice(0,3);
}

async function resolveBuild(champion, role, allies, enemies) {
  return await riotChampionBuild(champion, role, enemies, allies) || await datasetBuildForChampion(champion, role, allies, enemies);
}

function computeLiveRecommendation(live, min, champion, buildInfo) {
  if (!live) {
    return {
      acao: min < 3 ? "Lane with discipline" : min < 14 ? "Play for next objective" : "Group before contesting",
      urgencia: min < 6 ? "baixa" : "media",
      detalhes: `Minute ${min}: use waves and vision before fighting.`,
      observacoes: ["No live client data. Using fallback context.", buildInfo ? `Current build source: ${buildInfo.source}` : "Manual champion build available.", min >= 14 ? "Track dragon/baron setup." : "Track jungle pathing and recalls."],
      fonte: "fallback",
    };
  }
  const activeName = live.activePlayer?.riotIdGameName || live.activePlayer?.summonerName;
  const active = (live.allPlayers || []).find(p => p.summonerName === activeName || p.riotIdGameName === activeName) || null;
  const events = live.events?.Events || [];
  const recent = events.slice(-5).map(e => e.EventName || "");
  const kills = active?.scores?.kills || 0;
  const deaths = active?.scores?.deaths || 0;
  const assists = active?.scores?.assists || 0;
  const gold = live.activePlayer?.currentGold || 0;
  const itemCount = (active?.items || []).filter(Boolean).length;
  const cs = active?.scores?.creepScore || 0;
  const teamAdv = (live.allPlayers || []).reduce((n,p)=>n + ((p.isDead?0:1) * (p.team === active?.team ? 1 : -1)),0);

  let acao = "Farm and hold tempo";
  let urgencia = "baixa";
  let detalhes = `KDA ${kills}/${deaths}/${assists} · ${cs} CS · ${gold} gold.`;
  const observacoes = [];

  if (active?.isDead) {
    acao = "Respawn then reset vision";
    urgencia = "media";
    observacoes.push("Você está morto — evite planejar fight imediata.");
  } else if (gold >= 1300 && min > 3) {
    acao = "Recall and spend gold";
    urgencia = "media";
    observacoes.push(`Gold alto (${gold}) — power spike parado.`);
  } else if (recent.includes("DragonKill") || (min >= 5 && min < 21 && min % 5 <= 1)) {
    acao = "Set vision for dragon";
    urgencia = "alta";
    observacoes.push("Janela de dragão — jogue pelo lado do objetivo.");
  } else if (min >= 20 && (recent.includes("BaronKill") || min % 6 <= 1)) {
    acao = "Control Baron area";
    urgencia = "alta";
    observacoes.push("Baron é o ponto central do mapa agora.");
  } else if (teamAdv < 0) {
    acao = "Avoid even-number fights";
    urgencia = "media";
    observacoes.push("Seu time parece em desvantagem no mapa agora.");
  } else if (itemCount < 2 && min >= 8) {
    acao = "Farm safely to next item";
    urgencia = "media";
    observacoes.push("Você ainda não fechou core cedo o bastante.");
  } else if (kills >= 3 && deaths <= 1) {
    acao = "Push lead on side first";
    urgencia = "media";
    observacoes.push("Você está forte — force wave, then move.");
  }

  if (buildInfo?.build?.length) observacoes.push(`Next item path: ${buildInfo.build.slice(0, Math.min(3, buildInfo.build.length)).map(i => i.name).join(" → ")}`);
  if (!observacoes.length) observacoes.push("Jogue com visão antes de entrar em range de engage.");
  return { acao, urgencia, detalhes, observacoes: observacoes.slice(0,4), fonte: "liveclient" };
}

app.use(express.static(__dirname));
app.get("/", (req,res) => res.sendFile(path.join(__dirname, "nexus-oracle-live.html")));
app.get("/status", async (req, res) => {
  const patch = await getPatch();
  const live = await getLiveClient();
  res.json({ status: "online", patch, dataset: `${CHAMP_COUNT} champions`, liveClient: !!live, language: "UI pt-BR / build+runes English" });
});
app.get("/manifest", async (req,res)=>{
  const dd = await getDDragon();
  res.json({ patch: dd.patch });
});
app.post("/pick", async (req,res)=>{
  const { role = "mid", allies = "", enemies = "", bans = "" } = req.body || {};
  const picks = await Promise.all(calcularMelhorPick({ role, allies, enemies, bans }).map(async p => ({ ...p, buildInfo: await datasetBuildForChampion(p.champ, p.role, allies, enemies) })));
  res.json({ picks: picks.map(p => ({ champ: p.champ, champKey: p.buildInfo?.championKey || "", championIcon: p.buildInfo?.championIcon || "", role: p.role, score: p.score, avgWR: p.avgWR, worstWR: p.worstWR, synergy: p.synergy, compBonus: p.compBonus, data: { cls: p.data?.cls || "", runes: p.buildInfo?.runes || null, build: p.buildInfo?.build || [], starter: p.buildInfo?.starter || "", spells: p.buildInfo?.spells || [] } })) });
});
app.post("/resolve-build", async (req,res)=>{
  const { champion = "", role = "", allies = "", enemies = "" } = req.body || {};
  if (!champion) return res.status(400).json({ error: "champion required" });
  const build = await resolveBuild(champion, role, allies, enemies);
  if (!build) return res.status(404).json({ error: "champion not found" });
  res.json(build);
});
app.post("/oracle", async (req,res)=>{
  try {
    const { question = "", context = {} } = req.body || {};
    const { champion = "", role = "", allies = "", enemies = "", bans = "" } = context;
    const picks = calcularMelhorPick({ role, allies, enemies, bans });
    const build = champion ? await resolveBuild(champion, role, allies, enemies) : null;
    if (!GROQ_KEY) {
      return res.json({ text: champion ? `Build for ${build?.champion || champion}: ${build?.build?.map(x=>x.name).join(", ")}` : `Top picks: ${picks.map(p=>p.champ).join(", ")}`, picks_calculados: picks.map(p => ({ champ: p.champ, score: p.score, avgWR: p.avgWR })) });
    }
    const prompt = [
      `Question: ${question}`,
      `Top 3 picks: ${picks.map(p => `${p.champ} (score ${p.score}, WR ${p.avgWR}%)`).join(" | ")}`,
      build ? `Current build source: ${build.source}\nChampion: ${build.champion} (${build.role})\nPrimary: ${build.runes.primary.map(r=>r.name).join(" / ")}\nSecondary: ${build.runes.secondary.map(r=>r.name).join(" / ")}\nShards: ${build.runes.shards.join(" / ")}\nBuild: ${build.build.map(i=>i.name).join(" -> ")}` : "",
      `Allies: ${allies}`,
      `Enemies: ${enemies}`,
    ].filter(Boolean).join("\n\n");
    const text = await axios.post("https://api.groq.com/openai/v1/chat/completions", { model: "llama-3.3-70b-versatile", temperature: 0.1, max_tokens: 700, messages: [{ role: "system", content: "You are a League of Legends coach. Use only provided data. Do not invent items or runes. Reply in Brazilian Portuguese." }, { role: "user", content: prompt }] }, { headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" }, timeout: 25000 }).then(r=>r.data.choices[0].message.content);
    res.json({ text, picks_calculados: picks.map(p => ({ champ: p.champ, score: p.score, avgWR: p.avgWR })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post("/analyze", async (req,res)=>{
  try {
    const { context = {}, gameTime = 0 } = req.body || {};
    const { champion = "", role = "", allies = "", enemies = "", bans = "" } = context;
    const live = await getLiveClient();
    const picks = await Promise.all(calcularMelhorPick({ role, allies, enemies, bans }).map(async p => ({ ...p, buildInfo: await datasetBuildForChampion(p.champ, p.role, allies, enemies) })));
    const activeChamp = champion || live?.activePlayer?.championStats ? ((live.allPlayers || []).find(p => p.riotIdGameName === live.activePlayer?.riotIdGameName || p.summonerName === live.activePlayer?.summonerName)?.championName || champion) : champion;
    const build = activeChamp ? await resolveBuild(activeChamp, role, allies, enemies) : (picks[0]?.buildInfo || null);
    const rec = computeLiveRecommendation(live, parseInt(gameTime) || Math.floor((live?.gameData?.gameTime || 0)/60), activeChamp, build);
    res.json({ ...rec, pick: picks[0]?.champ || "", picks, currentBuild: build, liveClient: !!live });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

(async () => {
  const patch = await getPatch();
  console.log(`Dataset carregado: ${CHAMP_COUNT} campeões`);
  console.log(`Servidor na porta 3000`);
  console.log(`Nexus Oracle LCK Pro | patch ${patch} | dataset ${CHAMP_COUNT}`);
})();
app.listen(3000);
