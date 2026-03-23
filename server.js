import express from "express";
import axios from "axios";
import cors from "cors";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import { D, findChamp, ALIASES, CHAMP_COUNT } from "./dataset.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(cors());

const GROQ_KEY = process.env.GROQ_KEY || "";
const RIOT_KEY = process.env.RIOT_KEY || "";
const liveClientAgent = new https.Agent({ rejectUnauthorized: false });

// ----------------------- cache -----------------------
const MEM = new Map();
const now = () => Date.now();
function cget(k) { const e = MEM.get(k); return e && now() - e.t < e.ttl ? e.v : null; }
function cset(k, v, ttl) { MEM.set(k, { v, t: now(), ttl }); return v; }

// ----------------------- helpers -----------------------
function norm(s = "") {
  return String(s).toLowerCase().trim().replace(/[’'\s\-.]+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function titleCaseKey(k = "") {
  return k ? k.charAt(0).toUpperCase() + k.slice(1) : "";
}
function parseList(str) {
  if (!str || str === "não informado") return [];
  return String(str).split(/[,;/|]+/).map(s => s.trim()).filter(Boolean);
}
function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }
function getChamp(name) {
  const key = ALIASES[String(name || "").toLowerCase().trim()] || ALIASES[norm(name)] || norm(name);
  return D[key] || findChamp(name) || null;
}
function getChampKey(name) {
  const c = getChamp(name);
  if (!c) return "";
  return Object.keys(D).find(k => D[k] === c) || norm(name);
}
function safeInt(v, d = 0) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

// ----------------------- ddragon -----------------------
async function getPatch() {
  const k = "dd:patch";
  const cached = cget(k);
  if (cached) return cached;
  try {
    const r = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json", { timeout: 5000 });
    return cset(k, r.data[0], 6 * 3600_000);
  } catch {
    return cget(k) || "16.6.1";
  }
}

async function getChampionsDD() {
  const k = "dd:champs";
  const cached = cget(k);
  if (cached) return cached;
  const patch = await getPatch();
  const r = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion.json`, { timeout: 8000 });
  const out = {};
  for (const [key, val] of Object.entries(r.data.data || {})) {
    out[norm(key)] = {
      key,
      id: val.id,
      name: val.name,
      image: `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${val.image.full}`,
      square: `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${val.image.full}`,
    };
    out[norm(val.name)] = out[norm(key)];
  }
  return cset(k, out, 12 * 3600_000);
}

async function getItemsDD() {
  const k = "dd:items";
  const cached = cget(k);
  if (cached) return cached;
  const patch = await getPatch();
  const r = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/item.json`, { timeout: 8000 });
  const byId = {};
  const byName = {};
  for (const [id, item] of Object.entries(r.data.data || {})) {
    const entry = { id, name: item.name, image: `https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${id}.png`, stats: item.stats || {} };
    byId[id] = entry;
    byName[norm(item.name)] = entry;
  }
  return cset(k, { byId, byName }, 12 * 3600_000);
}

async function getRunesDD() {
  const k = "dd:runes";
  const cached = cget(k);
  if (cached) return cached;
  const patch = await getPatch();
  const r = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/runesReforged.json`, { timeout: 8000 });
  const byName = {};
  const trees = {};
  for (const tree of r.data || []) {
    trees[norm(tree.name)] = { name: tree.name, icon: `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}` };
    byName[norm(tree.name)] = { name: tree.name, icon: `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`, tree: tree.name };
    for (const slot of tree.slots || []) {
      for (const rune of slot.runes || []) {
        byName[norm(rune.name)] = { name: rune.name, icon: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`, tree: tree.name };
      }
    }
  }
  return cset(k, { byName, trees }, 12 * 3600_000);
}

async function getSummonerSpellsDD() {
  const k = "dd:spells";
  const cached = cget(k);
  if (cached) return cached;
  const patch = await getPatch();
  const r = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/summoner.json`, { timeout: 8000 });
  const byNorm = {};
  for (const [key, val] of Object.entries(r.data.data || {})) {
    const entry = { name: val.name, image: `https://ddragon.leagueoflegends.com/cdn/${patch}/img/spell/${val.image.full}` };
    byNorm[norm(val.name)] = entry;
    byNorm[norm(key)] = entry;
  }
  return cset(k, byNorm, 12 * 3600_000);
}

// ----------------------- translations / aliases -----------------------
const ITEM_ALIAS = {
  [norm("Força da Trindade")]: "Trinity Force",
  [norm("Botas de Treino")]: "Plated Steelcaps",
  [norm("Dança da Morte")]: "Death's Dance",
  [norm("Pele de Pedra de Gárgula")]: "Gargoyle Stoneplate",
  [norm("Guardião Imortal")]: "Guardian Angel",
  [norm("Machado Negro")]: "Black Cleaver",
  [norm("Cimitarra Mercurial")]: "Mercurial Scimitar",
  [norm("Manopla de Gelo")]: "Iceborn Gauntlet",
  [norm("Coração Congelado")]: "Frozen Heart",
  [norm("Força da Natureza")]: "Force of Nature",
  [norm("Armadura de Warmog")]: "Warmog's Armor",
  [norm("Quebra-Passos")]: "Stridebreaker",
  [norm("Aço do Coração")]: "Heartsteel",
  [norm("Armadura de Espinhos")]: "Thornmail",
  [norm("Véu do Espírito")]: "Spirit Visage",
  [norm("Ravenosa Hidra")]: "Ravenous Hydra",
  [norm("Fio do Infinito")]: "Infinity Edge",
  [norm("Protetor do Guardião")]: "Guardian Angel",
  [norm("Essência Caçadora")]: "Essence Reaver",
  [norm("Botas de Iônia")]: "Ionian Boots of Lucidity",
  [norm("Rancor de Serylda")]: "Serylda's Grudge",
  [norm("Dente de Nashor")]: "Nashor's Tooth",
  [norm("Botas de Berserker")]: "Berserker's Greaves",
  [norm("Lâmina da Raiva de Guinsoo")]: "Guinsoo's Rageblade",
  [norm("Lâmina Raivosa")]: "Guinsoo's Rageblade",
  [norm("Sandálias do Feiticeiro")]: "Sorcerer's Shoes",
  [norm("Foguetão Hextech")]: "Hextech Rocketbelt",
  [norm("Ampulheta de Zhonya")]: "Zhonya's Hourglass",
  [norm("Bastão do Vazio")]: "Void Staff",
  [norm("Criador de Fendas")]: "Riftmaker",
  [norm("Abraço Demoníaco")]: "Demonic Embrace",
  [norm("Bastão das Eras")]: "Rod of Ages",
  [norm("Botas de Mobilidade")]: "Boots of Mobility",
  [norm("Rylai's Crystal Scepter")]: "Rylai's Crystal Scepter",
  [norm("Máscara Abissal")]: "Abyssal Mask",
  [norm("Sunfire Aegis")]: "Sunfire Aegis",
  [norm("Jak'Sho o Proteano")]: "Jak'Sho, The Protean",
  [norm("Espada do Rei Destruído")]: "Blade of the Ruined King",
  [norm("Lembrete Mortal")]: "Mortal Reminder",
  [norm("Guardião Mortal")]: "Guardian Angel",
  [norm("Morellonomicon")]: "Morellonomicon",
  [norm("Executioner's Calling")]: "Executioner's Calling",
  [norm("Kraken Slayer")]: "Kraken Slayer",
  [norm("Rapidfire Cannon")]: "Rapid Firecannon",
  [norm("Furacão de Runaan")]: "Runaan's Hurricane",
  [norm("Shieldbow Imortal")]: "Immortal Shieldbow",
  [norm("Lâmina da Hextech")]: "Hextech Gunblade",
  [norm("Chapéu Mortal de Rabadon")]: "Rabadon's Deathcap",
  [norm("Chama das Sombras")]: "Shadowflame",
  [norm("Luden's Companheiro")]: "Luden's Companion",
  [norm("Véu da Banshee")]: "Banshee's Veil",
  [norm("Coletor")]: "The Collector",
  [norm("Lord Dominik's Regards")]: "Lord Dominik's Regards",
  [norm("Plated Steelcaps")]: "Plated Steelcaps",
  [norm("Mercury's Treads")]: "Mercury's Treads",
  [norm("Sorcerer's Shoes")]: "Sorcerer's Shoes",
  [norm("Berserker's Greaves")]: "Berserker's Greaves",
  [norm("Void Staff")]: "Void Staff",
  [norm("Lich Bane")]: "Lich Bane",
};

const RUNE_ALIAS = {
  [norm("Conquistador")]: "Conqueror",
  [norm("Precisão")]: "Precision",
  [norm("Triunfo")]: "Triumph",
  [norm("Lenda: Alacrity")]: "Legend: Alacrity",
  [norm("Golpe de Misericórdia")]: "Coup de Grace",
  [norm("Determinação")]: "Resolve",
  [norm("Demolir")]: "Demolish",
  [norm("Inabalável")]: "Unflinching",
  [norm("Condicionamento")]: "Conditioning",
  [norm("Dominação")]: "Domination",
  [norm("Sabor do Sangue")]: "Taste of Blood",
  [norm("Caçador Ganancioso")]: "Treasure Hunter",
  [norm("Caçador Supremo")]: "Ultimate Hunter",
  [norm("Coleta de Globos Oculares")]: "Eyeball Collection",
  [norm("Feitiçaria")]: "Sorcery",
  [norm("Manto de Nuvem")]: "Nimbus Cloak",
  [norm("Transcendência")]: "Transcendence",
  [norm("Calçados Mágicos")]: "Magical Footwear",
  [norm("Perspicácia Cósmica")]: "Cosmic Insight",
  [norm("Inspiração")]: "Inspiration",
  [norm("Eletrocutar")]: "Electrocute",
  [norm("Ritmo Letal")]: "Lethal Tempo",
  [norm("Pressione o Ataque")]: "Press the Attack",
  [norm("Aperto dos Mortos-Vivos")]: "Grasp of the Undying",
  [norm("Fase Rush")]: "Phase Rush",
  [norm("Colheita Sombria")]: "Dark Harvest",
  [norm("Primeiro Golpe")]: "First Strike",
  [norm("Presença de Espírito")]: "Presence of Mind",
  [norm("Lenda: Persistência")]: "Legend: Haste",
  [norm("Última Resistência")]: "Last Stand",
  [norm("Crescimento Excessivo")]: "Overgrowth",
  [norm("Coleta de Tempestades")]: "Gathering Storm",
};
const SHARD_ALIAS = {
  [norm("Adaptativo")]: "Adaptive Force",
  [norm("Armadura")]: "Armor",
  [norm("Resistência Mágica")]: "Magic Resist",
  [norm("Velocidade de Ataque")]: "Attack Speed",
  [norm("Velocidade de Habilidade")]: "Ability Haste",
};

async function resolveBuildAndRunes(champName, role) {
  const champ = getChamp(champName);
  if (!champ) return null;
  const itemsDD = await getItemsDD();
  const runesDD = await getRunesDD();
  const spellsDD = await getSummonerSpellsDD();
  const champsDD = await getChampionsDD();
  const champDD = champsDD[norm(champName)] || champsDD[norm(getChampKey(champName))];

  // best effort: current validated items
  let items = (champ.build || []).map(it => {
    const direct = itemsDD.byName[norm(it)];
    const alias = ITEM_ALIAS[norm(it)] ? itemsDD.byName[norm(ITEM_ALIAS[norm(it)])] : null;
    return direct || alias || null;
  }).filter(Boolean);
  items = uniq(items.map(i => i.id)).map(id => itemsDD.byId[id]).slice(0, 6);

  const fallbackByClass = {
    adc: ["Berserker's Greaves","Infinity Edge","Rapid Firecannon","Lord Dominik's Regards","Guardian Angel"],
    mago: ["Sorcerer's Shoes","Shadowflame","Zhonya's Hourglass","Void Staff","Rabadon's Deathcap"],
    assassino_ap: ["Sorcerer's Shoes","Lich Bane","Zhonya's Hourglass","Shadowflame","Void Staff"],
    assassino_ad: ["Mercury's Treads","The Collector","Lord Dominik's Regards","Guardian Angel","Death's Dance"],
    lutador: ["Plated Steelcaps","Black Cleaver","Death's Dance","Sterak's Gage","Guardian Angel"],
    tank: ["Plated Steelcaps","Thornmail","Frozen Heart","Force of Nature","Gargoyle Stoneplate"],
    enchanter: ["Ionian Boots of Lucidity","Redemption","Mikael's Blessing","Ardent Censer","Staff of Flowing Water"],
    sup_engage: ["Mercury's Treads","Locket of the Iron Solari","Knight's Vow","Zeke's Convergence","Redemption"],
  };
  if (items.length < 4) {
    const extra = (fallbackByClass[champ.cls] || []).map(n => itemsDD.byName[norm(n)]).filter(Boolean);
    for (const e of extra) if (!items.find(i => i.id === e.id)) items.push(e);
    items = items.slice(0, 6);
  }

  const resolveRune = r => runesDD.byName[norm(r)] || runesDD.byName[norm(RUNE_ALIAS[norm(r)] || r)] || null;
  const key = resolveRune(champ.runes?.key);
  const p = resolveRune(champ.runes?.p);
  const s = resolveRune(champ.runes?.s);
  const primary = [champ.runes?.r1, champ.runes?.r2, champ.runes?.r3].map(resolveRune).filter(Boolean);
  const secondary = [champ.runes?.s1, champ.runes?.s2].map(resolveRune).filter(Boolean);
  const shards = (champ.runes?.sh || []).map(x => SHARD_ALIAS[norm(x)] || x);
  const spells = (champ.f || []).map(sp => spellsDD[norm(sp)] || { name: sp, image: "" });

  return {
    champion: champName,
    role: role || champ.role,
    cls: champ.cls,
    championImage: champDD?.image || "",
    starter: champ.ini || "Doran's Ring + 2 Health Potions",
    spells,
    runes: { key, primaryTree: p, primary, secondaryTree: s, secondary, shards },
    items,
    notes: champ.d || [],
  };
}

// ----------------------- pick engine -----------------------
const LANE_MAP = { top:"top", jungle:"jungle", mid:"mid", adc:"adc", bot:"adc", sup:"support", support:"support", suporte:"support" };
const POOL = {
  top:["aatrox","camille","darius","fiora","garen","gnar","gwen","irelia","jax","jayce","kayle","kennen","ksante","mordekaiser","ornn","renekton","riven","rumble","sett","shen","sion","trundle","urgot","volibear","wukong","yorick","ambessa"],
  jungle:["amumu","belveth","briar","diana","elise","evelynn","fiddlesticks","gragas","graves","hecarim","ivern","jarvaniv","kayn","khazix","kindred","leesin","lillia","masteryi","nidalee","nocturne","nunu","rammus","reksai","rengar","sejuani","shaco","taliyah","udyr","vi","viego","warwick","wukong","xinzhao","zac","karthus"],
  mid:["ahri","akali","akshan","anivia","annie","aurelionsol","azir","cassiopeia","corki","ekko","fizz","galio","heimerdinger","hwei","kassadin","katarina","leblanc","lissandra","lux","malzahar","mel","naafiri","neeko","orianna","qiyana","ryze","syndra","sylas","talon","twistedfate","veigar","vex","viktor","vladimir","xerath","yasuo","yone","zed","ziggs","zoe"],
  adc:["aphelios","ashe","caitlyn","draven","ezreal","jhin","jinx","kaisa","kalista","kogmaw","lucian","missfortune","nilah","samira","sivir","smolder","tristana","twitch","varus","vayne","xayah","zeri"],
  support:["alistar","bard","blitzcrank","brand","braum","janna","karma","leona","lulu","milio","morgana","nami","nautilus","pyke","rakan","rell","renata","seraphine","sona","soraka","tahm","taric","thresh","yuumi","zilean","zyra","swain","senna"],
};
const COMP_REGEX = {
  engage_duro:/malphite|amumu|jarvaniv|sejuani|leona|nautilus|blitzcrank|alistar|rell|wukong/,
  poke:/jayce|zoe|syndra|xerath|nidalee|ezreal|corki|karma|lux|caitlyn/,
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
  cura_pesada:{ veigar:3, karthus:3, zed:3, katarina:2 },
  teamfight:{ orianna:5, azir:4, amumu:4, malphite:5, kennen:4, fiddlesticks:5, wukong:4, jarvaniv:3 },
  split_push:{ shen:5, twistedfate:4, nocturne:4 },
  carry_ad:{ malphite:4, leona:3, nautilus:3, alistar:3 },
  carry_ap:{ galio:4, kassadin:4, ksante:3, malphite:3 },
  cc_pesado:{ olaf:5, gangplank:4, garen:3 },
};
function calcCompBonus(champKey, enemies) {
  const e = String(enemies || "").toLowerCase();
  let b = 0;
  for (const [tipo, rx] of Object.entries(COMP_REGEX)) if (rx.test(e) && COMP_SCORE[tipo]?.[champKey]) b += COMP_SCORE[tipo][champKey];
  return Math.min(b, 8);
}
function calcSynergyBonus(champKey, allies) {
  const c = D[champKey]; if (!c?.syn) return 0;
  let b = 0;
  for (const ally of allies) {
    const akey = getChampKey(ally);
    if (c.syn[titleCaseKey(akey)] != null) b += c.syn[titleCaseKey(akey)];
    if (c.syn[akey] != null) b += c.syn[akey];
    const ad = D[akey];
    if (ad?.syn?.[titleCaseKey(champKey)] != null) b += ad.syn[titleCaseKey(champKey)];
    if (ad?.syn?.[champKey] != null) b += ad.syn[champKey];
  }
  return Math.min(b, 10);
}
function calcMatchupScore(champKey, enemyKeys) {
  const c = D[champKey];
  if (!c?.vs || !enemyKeys.length) return { avg: 50, worst: 50, hasData: false };
  const wrs = enemyKeys.map(ek => c.vs[titleCaseKey(ek)] ?? c.vs[ek] ?? 50);
  return { avg: wrs.reduce((a,b)=>a+b,0)/wrs.length, worst: Math.min(...wrs), hasData: wrs.some(v => v !== 50) };
}
function calcularMelhorPick({ role, allies, enemies, bans = "" }) {
  const lane = LANE_MAP[String(role || "").toLowerCase()] || "mid";
  const pool = POOL[lane] || POOL.mid;
  const enemyKeys = parseList(enemies).map(getChampKey).filter(Boolean).slice(0,5);
  const allyKeys = parseList(allies).map(getChampKey).filter(Boolean).slice(0,4);
  const banKeys = parseList(bans).map(getChampKey).filter(Boolean);
  const out = [];
  for (const champKey of pool) {
    if (banKeys.includes(champKey)) continue;
    const c = D[champKey]; if (!c) continue;
    const { avg, worst, hasData } = calcMatchupScore(champKey, enemyKeys);
    const score = avg * 0.7 + worst * 0.3 + calcSynergyBonus(champKey, allyKeys) + calcCompBonus(champKey, enemies);
    out.push({
      champKey,
      champ: titleCaseKey(champKey),
      role: lane,
      score: Math.round(score * 10) / 10,
      avgWR: Math.round(avg * 10) / 10,
      worstWR: Math.round(worst * 10) / 10,
      synergy: calcSynergyBonus(champKey, allyKeys),
      compBonus: calcCompBonus(champKey, enemies),
      hasMatchupData: hasData,
      data: c,
    });
  }
  return out.sort((a,b)=>b.score-a.score).slice(0,3);
}

async function enrichPicksWithAssets(picks) {
  const champsDD = await getChampionsDD();
  const spellsDD = await getSummonerSpellsDD();
  const runesDD = await getRunesDD();
  return picks.map(p => {
    const dd = champsDD[norm(p.champKey)] || champsDD[norm(p.champ)];
    const d = p.data || {};
    const key = runesDD.byName[norm(d.runes?.key)] || runesDD.byName[norm(RUNE_ALIAS[norm(d.runes?.key)] || d.runes?.key)] || null;
    return {
      ...p,
      image: dd?.image || "",
      data: {
        ...d,
        spells: (d.f || []).map(sp => spellsDD[norm(sp)] || { name: sp, image: "" }),
        runes: { ...(d.runes || {}), keyIcon: key?.icon || "", keyName: key?.name || d.runes?.key || "" },
      }
    };
  });
}

// ----------------------- live client -----------------------
async function getLiveClient() {
  try {
    const r = await axios.get("https://127.0.0.1:2999/liveclientdata/allgamedata", { httpsAgent: liveClientAgent, timeout: 1200 });
    return r.data;
  } catch {
    return null;
  }
}
function summarizeLiveClient(lc) {
  if (!lc) return null;
  const all = lc.allPlayers || [];
  const activeName = lc.activePlayer?.summonerName || lc.activePlayer?.riotIdGameName || "";
  const me = all.find(p => p.summonerName === activeName) || all.find(p => p.isBot === false && p.team === "ORDER") || all[0];
  const myTeam = me?.team || "ORDER";
  const allies = all.filter(p => p.team === myTeam && p.summonerName !== me?.summonerName).map(p => p.championName);
  const enemies = all.filter(p => p.team !== myTeam).map(p => p.championName);
  const enemyThreat = all.filter(p => p.team !== myTeam).sort((a,b)=>((b.scores?.kills||0)-(a.scores?.kills||0)) || ((b.scores?.creepScore||0)-(a.scores?.creepScore||0)))[0];
  return {
    gameTime: Math.floor(lc.gameData?.gameTime || 0),
    phase: lc.gameData?.gameMode || "CLASSIC",
    myChampion: me?.championName || "",
    mySummoner: me?.summonerName || "",
    myLevel: me?.level || 1,
    myGold: lc.activePlayer?.currentGold || 0,
    myItems: me?.items || [],
    myScores: me?.scores || {},
    allies,
    enemies,
    enemyThreat: enemyThreat ? { champ: enemyThreat.championName, kills: enemyThreat.scores?.kills || 0, deaths: enemyThreat.scores?.deaths || 0 } : null,
    events: (lc.events?.Events || []).slice(-8),
  };
}
function buildRecommendation({ minute, context, live }) {
  const champ = context.champion || live?.myChampion || "";
  const enemyText = context.enemies || (live?.enemies || []).join(", ");
  const alliesText = context.allies || (live?.allies || []).join(", ");
  const obs = [];
  let acao = "Farm safely and track map";
  let urgencia = "baixa";
  let detalhes = `Minute ${minute}: stabilize lane and prepare next wave/objective.`;

  const isJg = norm(context.role) === "jungle" || (champ && getChamp(champ)?.role === "jungle");
  if (minute < 3) {
    acao = isJg ? "Full clear toward prio" : "Play lane with discipline";
    detalhes = `Minute ${minute}: use waves and vision before fighting.`;
    obs.push("Respect early jungle pathing.");
  } else if (minute < 8) {
    acao = isJg ? "Contest river and reset" : "Crash wave then move";
    urgencia = "media";
    detalhes = `Early game: tempo around river and first neutral setup.`;
    obs.push("Track jungle position before extending.");
  } else if (minute < 14) {
    acao = "Set vision for dragon";
    urgencia = "media";
    detalhes = `Mid-early game: secure prio and move first to dragon side.`;
    obs.push("Push one more wave before grouping.");
  } else if (minute < 20) {
    acao = "Group for objective control";
    urgencia = "alta";
    detalhes = `Second/third objective window: don't trade side waves for free setup.`;
    obs.push("Reset earlier if you have gold.");
  } else {
    acao = "Control Baron vision";
    urgencia = "alta";
    detalhes = `Late game: vision denial and tempo matter more than side farm.`;
    obs.push("Never face-check alone.");
  }

  if (live) {
    const k = live.myScores?.kills || 0, d = live.myScores?.deaths || 0, a = live.myScores?.assists || 0;
    obs.unshift(`KDA ${k}/${d}/${a}. Gold ${Math.round(live.myGold || 0)}.`);
    if ((live.myGold || 0) >= 1300) {
      acao = "Reset and spend gold";
      urgencia = "media";
      detalhes = `You are holding ${Math.round(live.myGold)} gold. Your next buy is worth more than one extra wave.`;
    }
    const lastEvent = live.events?.[live.events.length - 1];
    if (lastEvent?.EventName === "ChampionKill") {
      urgencia = "alta";
      obs.unshift("Recent kill happened: expect rotation or cross-map response.");
    }
    if (live.enemyThreat?.kills >= 5) {
      obs.unshift(`${live.enemyThreat.champ} is fed (${live.enemyThreat.kills}/${live.enemyThreat.deaths}). Respect fog and itemize defensively.`);
    }
  } else {
    obs.push("Live Client not detected — using capture context and game timer.");
  }

  if (/malphite|amumu|wukong|nautilus|leona/.test(enemyText.toLowerCase())) obs.push("Enemy engage is strong — keep flash/spacing for first engage.");
  if (/soraka|yuumi|sona|swain|aatrox/.test(enemyText.toLowerCase())) obs.push("Anti-heal becomes valuable this game.");
  if (/jinx|caitlyn|jhin|kaisa|xayah/.test(alliesText.toLowerCase())) obs.push("Play around your carry's spike and don't force before setup.");

  return { acao, urgencia, detalhes, observacoes: obs.slice(0,5) };
}

// ----------------------- groq -----------------------
async function explainPickAndBuild({ question, picks, build }) {
  if (!GROQ_KEY) return "GROQ_KEY not configured. Structured data is still available above.";
  const p1 = picks?.[0];
  const prompt = [
    `Question: ${question}`,
    p1 ? `Top pick: ${p1.champ} (${p1.role}) | score ${p1.score} | avgWR ${p1.avgWR}%` : "",
    build ? `Champion: ${build.champion} | role ${build.role} | class ${build.cls}` : "",
    build ? `Runes: ${build.runes?.key?.name || build.runes?.keyName || ""} | ${build.runes?.primaryTree?.name || ""} | ${build.runes?.secondaryTree?.name || ""}` : "",
    build ? `Build: ${(build.items || []).map(i => i.name).join(" > ")}` : "",
    "Use ONLY the structured data. Do not invent items or runes. Answer in Portuguese, but keep item/rune names in English exactly as provided.",
  ].filter(Boolean).join("\n");
  const r = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_tokens: 500,
    messages: [
      { role: "system", content: "You are a professional League of Legends coach. Never invent game data." },
      { role: "user", content: prompt },
    ],
  }, { headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" }, timeout: 25000 });
  return r.data.choices?.[0]?.message?.content || "Sem resposta.";
}

// ----------------------- routes -----------------------
app.use(express.static(__dirname));
app.get("/", async (_req, res) => {
  res.sendFile(path.join(__dirname, "nexus-oracle-live.html"));
});
app.get("/status", async (_req, res) => {
  const patch = await getPatch();
  const live = summarizeLiveClient(await getLiveClient());
  res.json({
    status: "online",
    patch,
    dataset: `${CHAMP_COUNT} champions`,
    liveClient: !!live,
    liveChampion: live?.myChampion || "",
    language: "UI PT-BR · build/runes EN",
  });
});
app.get("/champions", async (_req, res) => {
  const champs = await getChampionsDD();
  const unique = uniq(Object.values(champs).map(c => c.id)).map(id => Object.values(champs).find(c => c.id === id));
  res.json(unique.sort((a,b)=>a.name.localeCompare(b.name)).map(c => ({ key: norm(c.id), name: c.name, image: c.image, role: D[norm(c.id)]?.role || "" })));
});
app.post("/resolve-build", async (req, res) => {
  try {
    const { champion = "", role = "" } = req.body || {};
    if (!champion) return res.status(400).json({ error: "champion required" });
    const build = await resolveBuildAndRunes(champion, role);
    if (!build) return res.status(404).json({ error: "champion not found" });
    res.json(build);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/oracle", async (req, res) => {
  try {
    const { question = "", context = {} } = req.body || {};
    const live = summarizeLiveClient(await getLiveClient());
    const ctx = {
      champion: context.champion || live?.myChampion || "",
      role: context.role || getChamp(context.champion || live?.myChampion || "")?.role || "mid",
      allies: context.allies || (live?.allies || []).join(", "),
      enemies: context.enemies || (live?.enemies || []).join(", "),
      bans: context.bans || "",
    };
    const picks = await enrichPicksWithAssets(calcularMelhorPick(ctx));
    const build = ctx.champion ? await resolveBuildAndRunes(ctx.champion, ctx.role) : (picks[0] ? await resolveBuildAndRunes(picks[0].champKey, picks[0].role) : null);
    const text = await explainPickAndBuild({ question, picks, build });
    const patch = await getPatch();
    res.json({ text, patch, picks_calculados: picks, build });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post("/analyze", async (req, res) => {
  try {
    const { context = {}, gameTime = 0 } = req.body || {};
    const live = summarizeLiveClient(await getLiveClient());
    const minute = Math.floor((live?.gameTime || safeInt(gameTime, 0)) / 60);
    const ctx = {
      champion: context.champion || live?.myChampion || "",
      role: context.role || getChamp(context.champion || live?.myChampion || "")?.role || "mid",
      allies: context.allies || (live?.allies || []).join(", "),
      enemies: context.enemies || (live?.enemies || []).join(", "),
      bans: context.bans || "",
    };
    const picks = await enrichPicksWithAssets(calcularMelhorPick(ctx));
    const selectedBuild = ctx.champion ? await resolveBuildAndRunes(ctx.champion, ctx.role) : (picks[0] ? await resolveBuildAndRunes(picks[0].champKey, picks[0].role) : null);
    const rec = buildRecommendation({ minute, context: ctx, live });
    const inferredRole = getChamp(ctx.champion)?.role || ctx.role || (picks[0]?.role || "");
    res.json({
      ...rec,
      minute,
      liveClient: !!live,
      context: { ...ctx, role: inferredRole },
      picks,
      build: selectedBuild,
      threat: live?.enemyThreat || null,
      mapAlerts: rec.observacoes,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = 3000;
getPatch().then(async p => {
  console.log(`Nexus Oracle LCK Pro | patch ${p} | dataset ${CHAMP_COUNT}`);
  await Promise.all([getChampionsDD().catch(()=>{}), getItemsDD().catch(()=>{}), getRunesDD().catch(()=>{}), getSummonerSpellsDD().catch(()=>{})]);
}).catch(()=>{});
app.listen(port, () => console.log(`Servidor na porta ${port}`));
