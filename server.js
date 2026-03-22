
import express from "express";
import axios from "axios";
import cors from "cors";
import https from "https";
import { D, findChamp, ALIASES, CHAMP_COUNT } from "./dataset.js";

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(cors());

const GROQ_KEY = process.env.GROQ_KEY || "";
const LIVE_AGENT = new https.Agent({ rejectUnauthorized: false });

// ──────────────────────────────────────────────────────────────────────────────
// Cache
// ──────────────────────────────────────────────────────────────────────────────
const CACHE = new Map();
const TTL = {
  patch: 6 * 60 * 60 * 1000,
  ddragon: 6 * 60 * 60 * 1000,
  live: 1500,
};
function cGet(k) {
  const v = CACHE.get(k);
  return v && Date.now() - v.ts < v.ttl ? v.value : null;
}
function cSet(k, value, ttl) {
  CACHE.set(k, { value, ts: Date.now(), ttl });
  return value;
}

// ──────────────────────────────────────────────────────────────────────────────
// Utils
// ──────────────────────────────────────────────────────────────────────────────
function normalizeName(name = "") {
  const k = String(name).toLowerCase().trim().replace(/['\s\-_.]+/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ALIASES[String(name).toLowerCase().trim()] || ALIASES[k] || k;
}
function parseList(str) {
  if (!str || str === "não informado") return [];
  return String(str).split(/[,;/|]+/).map(s => s.trim()).filter(Boolean);
}
function uniq(arr) {
  return [...new Set(arr)];
}
function titleCaseChampionKey(key) {
  const data = D[key];
  if (data?.name) return data.name;
  const aliasSpecial = {
    leesin: 'Lee Sin',
    masteryi: 'Master Yi',
    missfortune: 'Miss Fortune',
    twistefate: 'Twisted Fate',
    jarvaniv: 'Jarvan IV',
    khazix: "Kha'Zix",
    chogath: "Cho'Gath",
    reksai: "Rek'Sai",
    aurelionsol: 'Aurelion Sol',
    tahm: 'Tahm Kench',
    kaisa: "Kai'Sa",
    kogmaw: "Kog'Maw",
    vel: "Vel'Koz",
    zaahen: 'Zaahen',
    yunara: 'Yunara'
  };
  if (aliasSpecial[key]) return aliasSpecial[key];
  return key.charAt(0).toUpperCase() + key.slice(1);
}
function getChamp(name) {
  const key = normalizeName(name);
  return D[key] || findChamp(name);
}

// ──────────────────────────────────────────────────────────────────────────────
// Data Dragon current patch, items, runes, champions, spells
// ──────────────────────────────────────────────────────────────────────────────
async function getPatch() {
  const c = cGet('patch');
  if (c) return c;
  try {
    const r = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json', { timeout: 5000 });
    return cSet('patch', r.data[0], TTL.patch);
  } catch {
    return cGet('patch') || '15.6.1';
  }
}
async function getDDragon(lang = 'en_US') {
  const patch = await getPatch();
  const key = `dd:${patch}:${lang}`;
  const cached = cGet(key);
  if (cached) return cached;
  const [itemsR, runesR, champsR, spellsR] = await Promise.all([
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/${lang}/item.json`, { timeout: 8000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/${lang}/runesReforged.json`, { timeout: 8000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/${lang}/champion.json`, { timeout: 8000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/${lang}/summoner.json`, { timeout: 8000 }),
  ]);
  const itemMap = {};
  const itemNameSet = new Set();
  for (const [id, it] of Object.entries(itemsR.data.data || {})) {
    itemMap[id] = it.name;
    itemNameSet.add(it.name);
  }
  const championMap = {};
  for (const [k, v] of Object.entries(champsR.data.data || {})) {
    championMap[normalizeName(k)] = v.name;
    championMap[normalizeName(v.name)] = v.name;
  }
  const spells = {};
  for (const v of Object.values(spellsR.data.data || {})) spells[v.name] = true;

  const runeNameSet = new Set();
  const runeTreeNameSet = new Set();
  for (const tree of runesR.data || []) {
    runeTreeNameSet.add(tree.name);
    runeNameSet.add(tree.name);
    for (const slot of tree.slots || []) {
      for (const rune of slot.runes || []) runeNameSet.add(rune.name);
    }
  }

  return cSet(key, {
    patch,
    itemMap,
    itemNameSet,
    runeNameSet,
    runeTreeNameSet,
    championMap,
    spells,
  }, TTL.ddragon);
}

// ──────────────────────────────────────────────────────────────────────────────
// Canonical build / rune resolution (current valid English names only)
// ──────────────────────────────────────────────────────────────────────────────
const ITEM_ALIASES = {
  // pt-br / legacy -> current / accepted English guesses
  'fiodoinfinito': 'Infinity Edge',
  'fio do infinito': 'Infinity Edge',
  'infinityedge': 'Infinity Edge',
  'rapidfirecannon': 'Rapid Firecannon',
  'canhaorapidodefogo': 'Rapid Firecannon',
  'rapidfire': 'Rapid Firecannon',
  'krakenslayer': 'Kraken Slayer',
  'matadoradekraken': 'Kraken Slayer',
  'kraken': 'Kraken Slayer',
  'mortalreminder': 'Mortal Reminder',
  'lembretemortal': 'Mortal Reminder',
  'lorddominik': "Lord Dominik's Regards",
  'dominiks': "Lord Dominik's Regards",
  'lorddominiksregards': "Lord Dominik's Regards",
  'guardiaoanjo': 'Guardian Angel',
  'guardianangel': 'Guardian Angel',
  'coletor': 'The Collector',
  'thecollector': 'The Collector',
  'essencereaver': 'Essence Reaver',
  'ceifadoressencia': 'Essence Reaver',
  'yuntal': 'Yun Tal Wildarrows',
  'flechatrozdeyuntal': 'Yun Tal Wildarrows',
  'yuntalwildarrows': 'Yun Tal Wildarrows',
  'botaasdeberserker': "Berserker's Greaves",
  'botasdeberserker': "Berserker's Greaves",
  'berserkersgreaves': "Berserker's Greaves",
  'mercurialscimitar': 'Mercurial Scimitar',
  'cimitarramercurial': 'Mercurial Scimitar',
  'bloodthirster': 'Bloodthirster',
  'sedenta por sangue': 'Bloodthirster',
  'ie': 'Infinity Edge',
  'ldr': "Lord Dominik's Regards",
  'bork': 'Blade of the Ruined King',
  'espadadoreidestruido': 'Blade of the Ruined King',
  'bladeoftheruinedking': 'Blade of the Ruined King',
  'nashorstooth': "Nashor's Tooth",
  'dentedenashor': "Nashor's Tooth",
  'voidstaff': 'Void Staff',
  'bastaodovazio': 'Void Staff',
  'rabadonsdeathcap': "Rabadon's Deathcap",
  'chapeumortaldorabadon': "Rabadon's Deathcap",
  'zhonyashourglass': "Zhonya's Hourglass",
  'ampulhetadezhonya': "Zhonya's Hourglass",
  'liandrystorment': "Liandry's Torment",
  'tormentodeliandry': "Liandry's Torment",
  'morellonomicon': 'Morellonomicon',
  'ludenscompanion': "Luden's Companion",
  'companheirodeluden': "Luden's Companion",
  'stormsurge': 'Stormsurge',
  'shadowflame': 'Shadowflame',
  'chamadasombras': 'Shadowflame',
  'riftmaker': 'Riftmaker',
  'criadorfendas': 'Riftmaker',
  'rylaiscrystalscepter': "Rylai's Crystal Scepter",
  'cetrodecristalderylai': "Rylai's Crystal Scepter",
  'blackcleaver': 'Black Cleaver',
  'machadonegro': 'Black Cleaver',
  'steraksgage': "Sterak's Gage",
  'esteraksgage': "Sterak's Gage",
  'deathsdance': "Death's Dance",
  'dancadamorte': "Death's Dance",
  'trinityforce': 'Trinity Force',
  'forcadatrindade': 'Trinity Force',
  'sunderedsky': 'Sundered Sky',
  'profanedhydra': 'Profane Hydra',
  'titanichydra': 'Titanic Hydra',
  'ravenoushydra': 'Ravenous Hydra',
  'ravenosahidra': 'Ravenous Hydra',
  'eclipse': 'Eclipse',
  'youmuusghostblade': "Youmuu's Ghostblade",
  'lamadoserak?': "Sterak's Gage",
  'seryldasgrudge': "Serylda's Grudge",
  'rancordeserylda': "Serylda's Grudge",
  'serpentsfang': "Serpent's Fang",
  'facachempunkserrilhada': 'Chempunk Chainsword',
  'chempunkchainsword': 'Chempunk Chainsword',
  'thornmail': 'Thornmail',
  'armaduradeespinhos': 'Thornmail',
  'forceofnature': 'Force of Nature',
  'forcadanatureza': 'Force of Nature',
  'warmogsarmor': "Warmog's Armor",
  'armaduradewarmog': "Warmog's Armor",
  'frozenheart': 'Frozen Heart',
  'coracaocongelado': 'Frozen Heart',
  'spiritvisage': 'Spirit Visage',
  'veudospirito': 'Spirit Visage',
  'jakshotheprotean': "Jak'Sho, The Protean",
  'jakshootheprotean': "Jak'Sho, The Protean",
  'iceborngauntlet': 'Iceborn Gauntlet',
  'manopladegelo': 'Iceborn Gauntlet',
  'heartsteel': 'Heartsteel',
  'acodocoracao': 'Heartsteel',
  'sundered': 'Sundered Sky'
};
const RUNE_ALIASES = {
  'conquistador': 'Conqueror',
  'eletrocutar': 'Electrocute',
  'ritmoletal': 'Lethal Tempo',
  'primeirogolpe': 'First Strike',
  'apertodosmortosvivos': 'Grasp of the Undying',
  'faserush': 'Phase Rush',
  'colheitasombria': 'Dark Harvest',
  'pressioneoataque': 'Press the Attack',
  'invocaraery': 'Summon Aery',
  'triunfo': 'Triumph',
  'lendaalacrity': 'Legend: Alacrity',
  'lendapersistencia': 'Legend: Haste',
  'lendatenacidade': 'Legend: Tenacity',
  'golpedemisericordia': 'Coup de Grace',
  'ultimaresistencia': 'Last Stand',
  'presencadeespirito': 'Presence of Mind',
  'demolir': 'Demolish',
  'condicionamento': 'Conditioning',
  'inabalavel': 'Unflinching',
  'crescimentoexcessivo': 'Overgrowth',
  'sangordosangue': 'Taste of Blood',
  'sabordosangue': 'Taste of Blood',
  'coletadeglobosoculares': 'Eyeball Collection',
  'cacadorganancioso': 'Treasure Hunter',
  'mantodenuvem': 'Nimbus Cloak',
  'transcendencia': 'Transcendence',
  'coletadetempestades': 'Gathering Storm',
  'calcadosmagicos': 'Magical Footwear',
  'perspicaciacosmica': 'Cosmic Insight',
  'precisao': 'Precision',
  'dominacao': 'Domination',
  'feiticaria': 'Sorcery',
  'determinacao': 'Resolve',
  'inspiracao': 'Inspiration',
  'adaptativo': 'Adaptive Force',
  'armadura': 'Armor',
  'resistenciamagica': 'Magic Resist',
  'velocidadedeataque': 'Attack Speed',
  'velocidadedehabilidade': 'Ability Haste'
};

const CLASS_BUILD_TEMPLATES = {
  adc: {
    runes: {
      key: 'Fleet Footwork', primary: 'Precision', primaryRunes: ['Presence of Mind', 'Legend: Bloodline', 'Cut Down'],
      secondary: 'Inspiration', secondaryRunes: ['Magical Footwear', 'Biscuit Delivery'], shards: ['Attack Speed', 'Adaptive Force', 'Health']
    },
    items: ['Berserker\'s Greaves', 'Infinity Edge', 'Rapid Firecannon', 'Lord Dominik\'s Regards', 'Bloodthirster', 'Guardian Angel'],
    starter: 'Doran\'s Blade + Health Potion'
  },
  mago: {
    runes: {
      key: 'Electrocute', primary: 'Domination', primaryRunes: ['Taste of Blood', 'Eyeball Collection', 'Ultimate Hunter'],
      secondary: 'Sorcery', secondaryRunes: ['Manaflow Band', 'Transcendence'], shards: ['Adaptive Force', 'Adaptive Force', 'Health']
    },
    items: ['Sorcerer\'s Shoes', 'Luden\'s Companion', 'Shadowflame', 'Zhonya\'s Hourglass', 'Rabadon\'s Deathcap', 'Void Staff'],
    starter: 'Doran\'s Ring + Health Potion'
  },
  assassino_ap: {
    runes: {
      key: 'Electrocute', primary: 'Domination', primaryRunes: ['Sudden Impact', 'Eyeball Collection', 'Treasure Hunter'],
      secondary: 'Sorcery', secondaryRunes: ['Nimbus Cloak', 'Transcendence'], shards: ['Adaptive Force', 'Adaptive Force', 'Health']
    },
    items: ['Sorcerer\'s Shoes', 'Lich Bane', 'Shadowflame', 'Zhonya\'s Hourglass', 'Rabadon\'s Deathcap', 'Void Staff'],
    starter: 'Doran\'s Ring + Health Potion'
  },
  assassino_ad: {
    runes: {
      key: 'Electrocute', primary: 'Domination', primaryRunes: ['Sudden Impact', 'Eyeball Collection', 'Treasure Hunter'],
      secondary: 'Precision', secondaryRunes: ['Triumph', 'Coup de Grace'], shards: ['Adaptive Force', 'Adaptive Force', 'Health']
    },
    items: ['Youmuu\'s Ghostblade', 'Opportunity', 'Serylda\'s Grudge', 'Edge of Night', 'Guardian Angel', 'Maw of Malmortius'],
    starter: 'Long Sword + Refillable Potion'
  },
  lutador: {
    runes: {
      key: 'Conqueror', primary: 'Precision', primaryRunes: ['Triumph', 'Legend: Haste', 'Last Stand'],
      secondary: 'Resolve', secondaryRunes: ['Second Wind', 'Overgrowth'], shards: ['Attack Speed', 'Adaptive Force', 'Health']
    },
    items: ['Plated Steelcaps', 'Black Cleaver', 'Sundered Sky', 'Sterak\'s Gage', 'Death\'s Dance', 'Guardian Angel'],
    starter: 'Doran\'s Blade + Health Potion'
  },
  tank: {
    runes: {
      key: 'Grasp of the Undying', primary: 'Resolve', primaryRunes: ['Demolish', 'Second Wind', 'Overgrowth'],
      secondary: 'Precision', secondaryRunes: ['Triumph', 'Legend: Haste'], shards: ['Attack Speed', 'Health', 'Health']
    },
    items: ['Mercury\'s Treads', 'Heartsteel', 'Iceborn Gauntlet', 'Thornmail', 'Force of Nature', 'Jak\'Sho, The Protean'],
    starter: 'Doran\'s Shield + Health Potion'
  },
  enchanter: {
    runes: {
      key: 'Summon Aery', primary: 'Sorcery', primaryRunes: ['Manaflow Band', 'Transcendence', 'Scorch'],
      secondary: 'Resolve', secondaryRunes: ['Bone Plating', 'Revitalize'], shards: ['Adaptive Force', 'Health', 'Health']
    },
    items: ['Ionian Boots of Lucidity', 'Moonstone Renewer', 'Ardent Censer', 'Staff of Flowing Water', 'Redemption', 'Mikael\'s Blessing'],
    starter: 'World Atlas + 2 Health Potions'
  },
  sup_engage: {
    runes: {
      key: 'Aftershock', primary: 'Resolve', primaryRunes: ['Font of Life', 'Bone Plating', 'Unflinching'],
      secondary: 'Inspiration', secondaryRunes: ['Hextech Flashtraption', 'Cosmic Insight'], shards: ['Attack Speed', 'Health', 'Health']
    },
    items: ['Mercury\'s Treads', 'Locket of the Iron Solari', 'Knight\'s Vow', 'Zeke\'s Convergence', 'Redemption', 'Trailblazer'],
    starter: 'World Atlas + 2 Health Potions'
  }
};

const CHAMP_OVERRIDES = {
  jhin: {
    runes: {
      key: 'Fleet Footwork', primary: 'Precision', primaryRunes: ['Presence of Mind', 'Legend: Bloodline', 'Coup de Grace'],
      secondary: 'Sorcery', secondaryRunes: ['Absolute Focus', 'Gathering Storm'], shards: ['Attack Speed', 'Adaptive Force', 'Health']
    },
    items: ['Berserker\'s Greaves', 'Infinity Edge', 'Rapid Firecannon', 'The Collector', 'Lord Dominik\'s Regards', 'Guardian Angel'],
    starter: 'Doran\'s Blade + Health Potion'
  },
  aphelios: {
    runes: {
      key: 'Fleet Footwork', primary: 'Precision', primaryRunes: ['Overheal', 'Legend: Bloodline', 'Cut Down'],
      secondary: 'Inspiration', secondaryRunes: ['Magical Footwear', 'Biscuit Delivery'], shards: ['Attack Speed', 'Adaptive Force', 'Health']
    },
    items: ['Berserker\'s Greaves', 'Infinity Edge', 'Runaan\'s Hurricane', 'Lord Dominik\'s Regards', 'Bloodthirster', 'Guardian Angel'],
    starter: 'Doran\'s Blade + Health Potion'
  },
  yasuo: {
    runes: {
      key: 'Lethal Tempo', primary: 'Precision', primaryRunes: ['Triumph', 'Legend: Alacrity', 'Last Stand'],
      secondary: 'Resolve', secondaryRunes: ['Second Wind', 'Overgrowth'], shards: ['Attack Speed', 'Adaptive Force', 'Health']
    },
    items: ['Berserker\'s Greaves', 'Blade of the Ruined King', 'Infinity Edge', 'Immortal Shieldbow', 'Mortal Reminder', 'Guardian Angel'],
    starter: 'Doran\'s Blade + Health Potion'
  },
  zed: {
    runes: {
      key: 'Electrocute', primary: 'Domination', primaryRunes: ['Sudden Impact', 'Eyeball Collection', 'Treasure Hunter'],
      secondary: 'Sorcery', secondaryRunes: ['Nimbus Cloak', 'Transcendence'], shards: ['Adaptive Force', 'Adaptive Force', 'Health']
    },
    items: ['Youmuu\'s Ghostblade', 'Opportunity', 'Serylda\'s Grudge', 'Edge of Night', 'Guardian Angel', 'Maw of Malmortius'],
    starter: 'Long Sword + Refillable Potion'
  },
  ahri: {
    runes: {
      key: 'Electrocute', primary: 'Domination', primaryRunes: ['Taste of Blood', 'Eyeball Collection', 'Ultimate Hunter'],
      secondary: 'Sorcery', secondaryRunes: ['Manaflow Band', 'Transcendence'], shards: ['Adaptive Force', 'Adaptive Force', 'Health']
    },
    items: ['Sorcerer\'s Shoes', 'Luden\'s Companion', 'Shadowflame', 'Zhonya\'s Hourglass', 'Rabadon\'s Deathcap', 'Void Staff'],
    starter: 'Doran\'s Ring + Health Potion'
  }
};

function closestValidName(name, validSet, aliases = {}) {
  if (!name) return null;
  const raw = String(name).trim();
  const normalized = normalizeName(raw);
  const fromAlias = aliases[normalized] || aliases[raw.toLowerCase().trim()];
  if (fromAlias && validSet.has(fromAlias)) return fromAlias;
  for (const v of validSet) {
    if (normalizeName(v) === normalized) return v;
  }
  // loose substring pass
  for (const v of validSet) {
    const nv = normalizeName(v);
    if (nv.includes(normalized) || normalized.includes(nv)) return v;
  }
  return null;
}
function canonicalizeItemArray(items, itemNameSet, champClass) {
  const out = [];
  for (const it of items || []) {
    const c = closestValidName(it, itemNameSet, ITEM_ALIASES);
    if (c && !out.includes(c)) out.push(c);
  }
  // patch gaps with class template if too short
  const clsTemplate = CLASS_BUILD_TEMPLATES[champClass]?.items || [];
  for (const it of clsTemplate) {
    const c = closestValidName(it, itemNameSet, ITEM_ALIASES);
    if (c && !out.includes(c)) out.push(c);
    if (out.length >= 6) break;
  }
  return out.slice(0, 6);
}
function canonicalizeRunes(runes, runeNameSet, runeTreeNameSet, champClass) {
  const tpl = runes || CLASS_BUILD_TEMPLATES[champClass]?.runes || {};
  const key = closestValidName(tpl.key, runeNameSet, RUNE_ALIASES) || CLASS_BUILD_TEMPLATES[champClass]?.runes?.key || 'Conqueror';
  const primary = closestValidName(tpl.p || tpl.primary, runeTreeNameSet, RUNE_ALIASES) || CLASS_BUILD_TEMPLATES[champClass]?.runes?.primary || 'Precision';
  const secondary = closestValidName(tpl.s || tpl.secondary, runeTreeNameSet, RUNE_ALIASES) || CLASS_BUILD_TEMPLATES[champClass]?.runes?.secondary || 'Resolve';
  const primaryRunes = uniq([tpl.r1, tpl.r2, tpl.r3, ...(tpl.primaryRunes || [])].filter(Boolean).map(v => closestValidName(v, runeNameSet, RUNE_ALIASES)).filter(Boolean)).slice(0,3);
  const secondaryRunes = uniq([tpl.s1, tpl.s2, ...(tpl.secondaryRunes || [])].filter(Boolean).map(v => closestValidName(v, runeNameSet, RUNE_ALIASES)).filter(Boolean)).slice(0,2);
  const shards = uniq([...(tpl.sh || tpl.shards || [])].map(v => closestValidName(v, runeNameSet, RUNE_ALIASES) || v).filter(Boolean)).slice(0,3);
  return { key, primary, primaryRunes, secondary, secondaryRunes, shards };
}

async function resolveChampionSetup(champName, enemies = '', allies = '') {
  const champ = getChamp(champName);
  if (!champ) return null;
  const dd = await getDDragon('en_US');
  const key = normalizeName(champName);
  const override = CHAMP_OVERRIDES[key] || {};
  const base = CLASS_BUILD_TEMPLATES[champ.cls] || CLASS_BUILD_TEMPLATES.lutador;
  let items = canonicalizeItemArray(override.items || champ.build || base.items, dd.itemNameSet, champ.cls);
  let runes = canonicalizeRunes(override.runes || champ.runes || base.runes, dd.runeNameSet, dd.runeTreeNameSet, champ.cls);

  const enemyStr = enemies.toLowerCase();
  const situational = [];
  if (/soraka|yuumi|nami|sona|lulu|aatrox|warwick|fiora|swain|vladimir/.test(enemyStr)) {
    const antiMap = {
      adc: 'Mortal Reminder', mago: 'Morellonomicon', assassino_ap: 'Morellonomicon', assassino_ad: 'Chempunk Chainsword', lutador: 'Chempunk Chainsword', tank: 'Thornmail', enchanter: 'Morellonomicon', sup_engage: 'Thornmail'
    };
    const anti = antiMap[champ.cls];
    if (anti && dd.itemNameSet.has(anti) && !items.includes(anti)) situational.push(anti);
  }
  if ((enemyStr.match(/malphite|ornn|sion|zac|sejuani|rammus|poppy|nautilus|leona|alistar/g) || []).length >= 2) {
    const pen = ['Lord Dominik\'s Regards', 'Void Staff'];
    const pickPen = ['adc','lutador','assassino_ad'].includes(champ.cls) ? pen[0] : pen[1];
    if (dd.itemNameSet.has(pickPen) && !items.includes(pickPen)) situational.push(pickPen);
  }
  if (/zed|talon|rengar|khazix|nocturne/.test(enemyStr)) {
    const def = ['mago','assassino_ap'].includes(champ.cls) ? "Zhonya's Hourglass" : champ.cls === 'adc' ? 'Guardian Angel' : null;
    if (def && dd.itemNameSet.has(def) && !items.includes(def)) situational.push(def);
  }
  if ((enemyStr.match(/syndra|veigar|lux|ahri|zoe|orianna|azir|cassiopeia|brand/g) || []).length >= 2) {
    const mr = ['adc','lutador','tank'].includes(champ.cls) ? 'Force of Nature' : null;
    if (mr && dd.itemNameSet.has(mr) && !items.includes(mr)) situational.push(mr);
  }
  for (const s of situational) {
    if (!items.includes(s)) items[items.length < 6 ? items.length : 5] = s;
  }
  items = uniq(items).slice(0, 6);

  return {
    champion: titleCaseChampionKey(key),
    championKey: key,
    role: champ.role,
    cls: champ.cls,
    spells: champ.f || ['Flash', 'Teleport'],
    starter: champ.ini || base.starter,
    build: items,
    runes,
    tips: (champ.d || []).slice(0, 4),
    patch: dd.patch,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Pick engine based on local matchup/synergy dataset
// ──────────────────────────────────────────────────────────────────────────────
const LANE_MAP = { top:'top', jungle:'jungle', mid:'mid', adc:'adc', bot:'adc', sup:'support', support:'support', suporte:'support' };
const POOL = {
  top:     ['aatrox','camille','darius','fiora','garen','gnar','gwen','irelia','jax','jayce','kayle','kennen','ksante','mordekaiser','ornn','renekton','riven','rumble','sett','shen','sion','trundle','urgot','volibear','wukong','yorick','zaahen','ambessa'],
  jungle:  ['amumu','belveth','briar','diana','elise','evelynn','fiddlesticks','gragas','graves','hecarim','ivern','jarvaniv','kayn','khazix','kindred','leesin','lillia','masteryi','nidalee','nocturne','nunu','rammus','reksai','rengar','sejuani','shaco','taliyah','udyr','vi','viego','volibear','warwick','wukong','xinzhao','zaahen','zac','karthus'],
  mid:     ['ahri','akali','akshan','anivia','annie','aurelionsol','aurora','azir','cassiopeia','corki','ekko','fizz','galio','heimerdinger','hwei','kassadin','katarina','leblanc','lissandra','lux','malzahar','mel','naafiri','neeko','orianna','qiyana','ryze','syndra','sylas','talon','twistedfate','veigar','vel','vex','viktor','vladimir','xerath','yasuo','yone','zed','ziggs','zoe'],
  adc:     ['aphelios','ashe','caitlyn','draven','ezreal','jhin','jinx','kaisa','kalista','kogmaw','lucian','misfortune','nilah','samira','sivir','smolder','tristana','twitch','varus','vayne','xayah','yunara','zeri'],
  support: ['alistar','bard','blitzcrank','brand','braum','janna','karma','leona','lulu','milio','morgana','nami','nautilus','pyke','rakan','rell','renata','seraphine','sona','soraka','tahm','taric','thresh','yuumi','zilean','zyra','swain','senna'],
};
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
const COMP_SCORE = {
  engage_duro:  { malphite:5, kennen:4, rumble:4, lissandra:4, janna:5, morgana:4, yasuo:5, yone:4, vex:4, zac:3, fiddlesticks:3 },
  poke:         { vladimir:4, kassadin:4, mordekaiser:4, diana:3, fizz:3, vex:3, zed:3, akali:3 },
  assassino:    { malzahar:5, lissandra:4, galio:4, leona:3, nautilus:3, vex:4, lulu:4, soraka:3 },
  cura_pesada:  { veigar:3, karthus:3, zed:3, katarina:2, draven:2 },
  teamfight:    { orianna:5, azir:4, amumu:4, malphite:5, kennen:4, fiddlesticks:5, wukong:4, jarvaniv:3 },
  split_push:   { shen:5, twistedfate:4, nocturne:4, gangplank:3 },
  carry_ad:     { malphite:4, leona:3, nautilus:3, alistar:3 },
  carry_ap:     { galio:4, kassadin:4, ksante:3, malphite:3 },
  cc_pesado:    { olaf:5, gangplank:4, kaisa:3, garen:3 },
  escudos:      { veigar:3, kaisa:3, zed:3, draven:3 },
};
function calcCompBonus(champKey, enemies, allies = '') {
  const e = enemies.toLowerCase();
  let bonus = 0;
  for (const [tipo, regex] of Object.entries(COMP_REGEX)) {
    if (regex.test(e) && COMP_SCORE[tipo]?.[champKey]) bonus += COMP_SCORE[tipo][champKey];
  }
  return Math.min(bonus, 8);
}
function calcSynergyBonus(champKey, allies) {
  const champData = D[champKey];
  if (!champData?.syn) return 0;
  let bonus = 0;
  for (const ally of allies) {
    const allyKey = normalizeName(ally);
    if (champData.syn[allyKey]) bonus += champData.syn[allyKey];
    const allyData = D[allyKey];
    if (allyData?.syn?.[champKey]) bonus += allyData.syn[champKey];
  }
  return Math.min(bonus, 10);
}
function calcMatchupScore(champKey, enemyKeys) {
  const champData = D[champKey];
  if (!champData?.vs || enemyKeys.length === 0) return { avg: 50, worst: 50, fromLocal: false };
  const wrs = enemyKeys.map(ek => champData.vs[ek] || champData.vs[Object.keys(champData.vs).find(k => normalizeName(k) === ek)] || 50);
  return { avg: wrs.reduce((a,b)=>a+b,0)/wrs.length, worst: Math.min(...wrs), fromLocal: wrs.some(v=>v!==50) };
}
function calcularMelhorPick({ role, allies, enemies, bans = '' }) {
  const lane = LANE_MAP[role?.toLowerCase()] || 'mid';
  const pool = POOL[lane] || POOL.mid;
  const enemyKeys = parseList(enemies).map(normalizeName).slice(0,5);
  const allyKeys = parseList(allies).map(normalizeName).slice(0,4);
  const banKeys = parseList(bans).map(normalizeName);
  const results = [];
  for (const champKey of pool) {
    if (banKeys.includes(champKey)) continue;
    const champData = D[champKey];
    if (!champData) continue;
    const { avg, worst, fromLocal } = calcMatchupScore(champKey, enemyKeys);
    const baseScore = avg*0.7 + worst*0.3;
    const synergy = calcSynergyBonus(champKey, allyKeys);
    const compBonus = calcCompBonus(champKey, enemies, allies);
    const score = Math.round((baseScore + synergy + compBonus)*10)/10;
    results.push({
      champ: titleCaseChampionKey(champKey), champKey, score,
      avgWR: Math.round(avg*10)/10, worstWR: Math.round(worst*10)/10,
      synergy, compBonus, hasMatchupData: fromLocal, role: lane, data: champData
    });
  }
  return results.sort((a,b)=>b.score-a.score).slice(0,5);
}

// ──────────────────────────────────────────────────────────────────────────────
// Live Client API (LCK Pro realtime)
// ──────────────────────────────────────────────────────────────────────────────
async function liveGet(path) {
  const key = `live:${path}`;
  const cached = cGet(key);
  if (cached) return cached;
  try {
    const r = await axios.get(`https://127.0.0.1:2999${path}`, { httpsAgent: LIVE_AGENT, timeout: 800 });
    return cSet(key, r.data, TTL.live);
  } catch {
    return null;
  }
}
async function getLiveSnapshot() {
  const [all, playerName, gameStats, events] = await Promise.all([
    liveGet('/liveclientdata/allgamedata'),
    liveGet('/liveclientdata/activeplayername'),
    liveGet('/liveclientdata/gamestats'),
    liveGet('/liveclientdata/eventdata'),
  ]);
  if (!all) return null;
  const activeName = typeof playerName === 'string' ? playerName : (all.activePlayer?.riotIdGameName || all.activePlayer?.summonerName || '');
  const activePlayer = (all.allPlayers || []).find(p => [p.riotId, p.riotIdGameName, p.summonerName].filter(Boolean).includes(activeName)) || null;
  return { all, activePlayer, activeName, gameStats: gameStats || all.gameData || {}, events: events?.Events || all.events?.Events || [] };
}
function buildRealtimeAdvice(snapshot, fallbackContext = {}) {
  const gameTime = Math.floor(snapshot?.gameStats?.gameTime || 0);
  const min = Math.floor(gameTime / 60);
  const active = snapshot?.activePlayer;
  const allPlayers = snapshot?.all?.allPlayers || [];
  const events = snapshot?.events || [];
  const team = active?.team;
  const allies = team ? allPlayers.filter(p => p.team === team) : [];
  const enemies = team ? allPlayers.filter(p => p.team !== team) : [];
  const me = active;
  const myItems = (me?.items || []).map(i => i.displayName).filter(Boolean);
  const myChampion = me?.championName || fallbackContext.champion || '';
  const myGold = snapshot?.all?.activePlayer?.currentGold || 0;
  const myHP = snapshot?.all?.activePlayer?.championStats?.currentHealth || 0;
  const maxHP = snapshot?.all?.activePlayer?.championStats?.maxHealth || 1;
  const hpPct = maxHP ? myHP / maxHP : 1;
  const myScore = me?.scores || {};
  const enemyFed = enemies.map(p => ({ name:p.championName, kills:p.scores?.kills||0, deaths:p.scores?.deaths||0, assists:p.scores?.assists||0, items:p.items||[] }))
    .sort((a,b)=>(b.kills*2+b.assists)- (a.kills*2+a.assists))[0];
  const recent = events.slice(-6).map(e=>e.EventName || '').join(',');

  let acao = 'Play for next wave';
  let urgencia = 'baixa';
  let detalhes = `Minute ${min}: stable map state.`;
  const observacoes = [];

  if (hpPct < 0.28) {
    acao = 'Reset now'; urgencia = 'alta'; detalhes = `Low HP (${Math.round(hpPct*100)}%). Do not contest blind.`;
    observacoes.push('Spend gold and return with tempo.');
  }
  if (myGold >= 1500) observacoes.push(`You are sitting on ${Math.round(myGold)} gold.`);
  if (/DragonKill/.test(recent) || (min >= 5 && min <= 6)) { acao = 'Secure dragon vision'; urgencia = urgencia === 'alta' ? 'alta' : 'media'; detalhes = `Minute ${min}: dragon side matters now.`; }
  if (min >= 20) { acao = 'Control Baron area'; urgencia = urgencia === 'alta' ? 'alta' : 'media'; detalhes = `Minute ${min}: Baron is the main objective.`; }
  if ((myScore.deaths || 0) >= 2 && (myScore.kills || 0) === 0 && min < 12) observacoes.push('Stop forcing. Play wave, reset vision, contest only with numbers.');
  if (enemyFed && enemyFed.kills >= 4) observacoes.push(`${enemyFed.name} is the main threat (${enemyFed.kills}/${enemyFed.deaths}).`);
  if (myItems.length) observacoes.push(`Current items: ${myItems.slice(0,3).join(', ')}.`);

  return { acao, urgencia, detalhes, observacoes: observacoes.slice(0,4), champion: myChampion, minute: min, live: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// Prompt formatting
// ──────────────────────────────────────────────────────────────────────────────
function formatResolvedSetup(setup) {
  if (!setup) return '';
  return [
    `Champion: ${setup.champion} | Role: ${setup.role} | Class: ${setup.cls}`,
    `Spells: ${setup.spells.join(' + ')}`,
    `Starter: ${setup.starter}`,
    'Runes:',
    `  Keystone: ${setup.runes.key}`,
    `  Primary: ${setup.runes.primary} -> ${setup.runes.primaryRunes.join(' / ')}`,
    `  Secondary: ${setup.runes.secondary} -> ${setup.runes.secondaryRunes.join(' / ')}`,
    `  Shards: ${setup.runes.shards.join(' | ')}`,
    'Build order:',
    ...setup.build.map((it, i) => `  ${i+1}. ${it}`),
    setup.tips?.length ? `Tips:\n${setup.tips.map((t,i)=>`  ${i+1}. ${t}`).join('\n')}` : ''
  ].filter(Boolean).join('\n');
}

async function callGroq(systemMsg, userMsg, maxTokens = 700) {
  if (!GROQ_KEY) return 'Groq key not configured.';
  const resp = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: 'llama-3.3-70b-versatile', temperature: 0.1, max_tokens: maxTokens,
    messages: [{ role:'system', content: systemMsg }, { role:'user', content: userMsg }]
  }, { headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type':'application/json' }, timeout: 25000 });
  return resp.data.choices[0].message.content;
}

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────
app.get('/', async (_req, res) => {
  const patch = await getPatch();
  const live = await getLiveSnapshot();
  res.json({ status: 'Nexus Oracle LCK Pro online', patch, dataset: `${CHAMP_COUNT} champions`, liveClient: !!live, language: 'English build/runes' });
});

app.get('/meta', async (_req, res) => {
  const dd = await getDDragon('en_US');
  res.json({ patch: dd.patch, champions: Object.keys(D).map(k => ({ key:k, name:titleCaseChampionKey(k) })) });
});

app.post('/pick', async (req, res) => {
  const { role='mid', allies='', enemies='', bans='' } = req.body || {};
  if (!enemies) return res.status(400).json({ error: 'enemies is required' });
  const picks = calcularMelhorPick({ role, allies, enemies, bans });
  const enriched = [];
  for (const p of picks.slice(0,3)) {
    const setup = await resolveChampionSetup(p.champKey, enemies, allies);
    enriched.push({ ...p, setup });
  }
  res.json({ picks: enriched });
});

app.post('/champ', async (req, res) => {
  const { name='', enemies='', allies='' } = req.body || {};
  const setup = await resolveChampionSetup(name, enemies, allies);
  if (!setup) return res.status(404).json({ error: `Champion not found: ${name}` });
  res.json({ setup });
});

app.post('/oracle', async (req, res) => {
  try {
    const { question, context = {} } = req.body;
    if (!question) return res.status(400).json({ error:'question missing' });
    const { champion='', role='', allies='', enemies='', bans='' } = context;
    const patch = await getPatch();
    const picks = enemies ? calcularMelhorPick({ role, allies, enemies, bans }).slice(0,3) : [];
    const topSetup = picks[0] ? await resolveChampionSetup(picks[0].champKey, enemies, allies) : null;
    const manualSetup = champion ? await resolveChampionSetup(champion, enemies, allies) : null;
    const system = [
      'You are Nexus Oracle, a League of Legends coach at LCK/LPL level.',
      'Never invent items, runes, spells, or champions.',
      'Use only the structured data provided by the system.',
      'If a champion setup is provided, explain it; do not alter it.',
      'If top 3 picks are provided, recommend the #1 pick and mention #2/#3 as alternatives.',
      'Answer in Brazilian Portuguese, but keep item and rune names in English exactly as given.'
    ].join(' ');
    const dataBlock = [
      `Patch: ${patch}`,
      `Role: ${role || 'unknown'}`,
      `Allies: ${allies || 'unknown'}`,
      `Enemies: ${enemies || 'unknown'}`,
      `Bans: ${bans || 'unknown'}`,
      manualSetup ? `MANUAL CHAMPION SETUP\n${formatResolvedSetup(manualSetup)}` : '',
      picks.length ? 'TOP 3 PICKS\n' + (await Promise.all(picks.map(async (p,idx)=> `${idx+1}. ${p.champ} | Score ${p.score} | Avg WR ${p.avgWR}%\n${formatResolvedSetup(await resolveChampionSetup(p.champKey,enemies,allies)).split('\n').slice(0,10).join('\n')}`))).join('\n\n') : ''
    ].filter(Boolean).join('\n\n');
    const text = await callGroq(system, `${dataBlock}\n\nQuestion: ${question}`);
    res.json({ text, patch, top3: picks.map(p=>({ champ:p.champ, score:p.score, avgWR:p.avgWR })) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

let lastDeep = 0;
let lastDeepCache = null;
const DEEP_MS = 7000;
app.post('/analyze', async (req, res) => {
  try {
    const { context = {}, gameTime = 0, mode = 'fast' } = req.body || {};
    const patch = await getPatch();
    const live = await getLiveSnapshot();
    const minute = live ? Math.floor((live.gameStats?.gameTime || 0)/60) : parseInt(gameTime || 0, 10) || 0;
    const enemies = context.enemies || '';
    const allies = context.allies || '';
    const role = context.role || 'mid';
    const bans = context.bans || '';
    const champion = live?.activePlayer?.championName || context.champion || '';
    const picks = enemies ? calcularMelhorPick({ role, allies, enemies, bans }).slice(0,3) : [];
    const top3 = [];
    for (const p of picks) top3.push({ champ:p.champ, score:p.score, avgWR:p.avgWR, worstWR:p.worstWR });

    const setup = champion ? await resolveChampionSetup(champion, enemies, allies) : null;
    const baseAdvice = live ? buildRealtimeAdvice(live, { champion }) : {
      acao: minute < 10 ? 'Lane with discipline' : minute < 20 ? 'Play for next objective' : 'Group before objective',
      urgencia: minute >= 20 ? 'media' : 'baixa',
      detalhes: `Minute ${minute}: use waves and vision before fighting.`,
      observacoes: ['No live client data. Using fallback context.'],
      champion,
      minute,
      live: false,
    };

    const now = Date.now();
    const canDeep = (now - lastDeep) >= DEEP_MS;
    if (mode === 'fast' || !canDeep || !GROQ_KEY) {
      return res.json({
        ...baseAdvice,
        top3,
        build: setup?.build || [],
        runes: setup?.runes || null,
        starter: setup?.starter || '',
        champion: setup?.champion || champion || '',
        patch,
        source: live ? 'liveclient-fast' : 'fallback-fast',
        nextDeepIn: canDeep ? 0 : Math.max(0, Math.ceil((DEEP_MS - (now - lastDeep))/1000))
      });
    }

    lastDeep = now;
    const system = 'You are a League of Legends macro coach. Reply with valid JSON only. Do not invent items or runes. Keep item and rune names in English.';
    const user = [
      `Patch: ${patch}`,
      `Champion: ${setup?.champion || champion || 'unknown'}`,
      `Minute: ${baseAdvice.minute}`,
      `Top 3 picks: ${top3.map((p,i)=>`${i+1}.${p.champ}(${p.avgWR}%)`).join(', ') || 'n/a'}`,
      setup ? `Current recommended setup\n${formatResolvedSetup(setup)}` : '',
      `Current advice baseline: ${baseAdvice.acao} | ${baseAdvice.urgencia} | ${baseAdvice.detalhes}`,
      `Observations: ${(baseAdvice.observacoes||[]).join(' | ')}`,
      'Return JSON: {"acao":"...","urgencia":"alta|media|baixa","detalhes":"...","observacoes":["...","..."],"callouts":["..."],"pick":"..."}'
    ].filter(Boolean).join('\n\n');
    let deep;
    try {
      const raw = await callGroq(system, user, 250);
      const m = raw.match(/\{[\s\S]*\}/);
      deep = JSON.parse(m ? m[0] : raw);
    } catch {
      deep = null;
    }
    const payload = {
      ...(deep || baseAdvice),
      top3,
      build: setup?.build || [],
      runes: setup?.runes || null,
      starter: setup?.starter || '',
      champion: setup?.champion || champion || '',
      patch,
      source: live ? 'liveclient-deep' : 'fallback-deep'
    };
    lastDeepCache = payload;
    res.json(payload);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

getPatch().then(p => console.log(`Nexus Oracle LCK Pro | patch ${p} | dataset ${CHAMP_COUNT}`)).catch(()=>{});
app.listen(3000, () => console.log('Servidor na porta 3000'));
