import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { D, ALIASES, findChamp, CHAMP_COUNT } from './dataset.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RIOT_KEY = process.env.RIOT_KEY || '';
const cache = new Map();
const cget = k => { const v = cache.get(k); return v && Date.now() - v.t < v.ttl ? v.v : null; };
const cset = (k,v,ttl=1000*60*30) => (cache.set(k,{v,t:Date.now(),ttl}), v);

function parseList(str='') {
  return String(str).split(/[,;/|]+/).map(s => s.trim()).filter(Boolean);
}

function normalizeName(name='') {
  const raw = String(name).toLowerCase().trim();
  const clean = raw.replace(/[.'’\s-]+/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return ALIASES[raw] || ALIASES[clean] || clean;
}

function getChamp(keyOrName='') {
  const key = normalizeName(keyOrName);
  return D[key] || findChamp(keyOrName);
}

function getChampKey(name='') {
  const key = normalizeName(name);
  return D[key] ? key : (findChamp(name) ? normalizeName(Object.keys(D).find(k => D[k] === findChamp(name)) || key) : key);
}

async function getPatch() {
  const cached = cget('patch');
  if (cached) return cached;
  try {
    const r = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json', { timeout: 5000 });
    return cset('patch', r.data[0], 1000 * 60 * 60 * 6);
  } catch {
    return cget('patch') || '16.6.1';
  }
}

async function getChampionMap() {
  const cached = cget('champMap');
  if (cached) return cached;
  const patch = await getPatch();
  const r = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion.json`, { timeout: 7000 });
  const map = {};
  for (const [id, info] of Object.entries(r.data.data || {})) {
    const keys = new Set([
      id.toLowerCase(),
      info.name.toLowerCase(),
      info.id.toLowerCase(),
      info.id.toLowerCase().replace(/[.'’\s-]+/g,''),
      info.name.toLowerCase().replace(/[.'’\s-]+/g,''),
    ]);
    for (const k of keys) map[k] = { id: info.id, name: info.name, square: `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${info.id}.png` };
  }
  return cset('champMap', map, 1000 * 60 * 60 * 6);
}

async function resolveChampionAsset(name='') {
  const map = await getChampionMap();
  const key = normalizeName(name);
  return map[key] || map[String(name).toLowerCase()] || { id: name, name, square: '' };
}

async function getDDragon() {
  const cached = cget('ddragon');
  if (cached) return cached;
  const patch = await getPatch();
  const [runesRes, spellsRes, itemsRes] = await Promise.all([
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/runesReforged.json`, { timeout: 8000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/summoner.json`, { timeout: 8000 }),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/item.json`, { timeout: 8000 })
  ]);

  const runeTrees = [];
  const runeByName = {};
  for (const tree of runesRes.data || []) {
    runeTrees.push({
      name: tree.name,
      icon: `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`,
      id: tree.id,
    });
    runeByName[tree.name.toLowerCase()] = { name: tree.name, icon: `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`, tree: tree.name };
    for (const slot of tree.slots || []) {
      for (const rune of slot.runes || []) {
        runeByName[rune.name.toLowerCase()] = { name: rune.name, icon: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`, tree: tree.name };
      }
    }
  }
  const spellByName = {};
  for (const info of Object.values(spellsRes.data.data || {})) {
    spellByName[info.name.toLowerCase()] = { name: info.name, icon: `https://ddragon.leagueoflegends.com/cdn/${patch}/img/spell/${info.image.full}` };
  }
  const itemByName = {};
  for (const [id, info] of Object.entries(itemsRes.data.data || {})) {
    itemByName[info.name.toLowerCase()] = { id, name: info.name, icon: `https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${id}.png` };
  }
  return cset('ddragon', { patch, runeByName, spellByName, itemByName, runeTrees }, 1000 * 60 * 60 * 6);
}

const RUNE_ALIASES = {
  'conquistador':'Conqueror','precisao':'Precision','precisão':'Precision','triunfo':'Triumph','lenda: alacrity':'Legend: Alacrity','lenda: persistencia':'Legend: Haste','lenda: persistência':'Legend: Haste','golpe de misericordia':'Coup de Grace','golpe de misericórdia':'Coup de Grace',
  'determinacao':'Resolve','determinação':'Resolve','demolir':'Demolish','inabalavel':'Unflinching','inabalável':'Unflinching','condicionamento':'Conditioning','crescimento excessivo':'Overgrowth',
  'dominacao':'Domination','dominação':'Domination','eletrocutar':'Electrocute','colheita sombria':'Dark Harvest','sabor do sangue':'Taste of Blood','coleta de globos oculares':'Eyeball Collection','cacador ganancioso':'Treasure Hunter','caçador ganancioso':'Treasure Hunter',
  'feiticaria':'Sorcery','feitiçaria':'Sorcery','manto de nuvem':'Nimbus Cloak','transcendencia':'Transcendence','transcendência':'Transcendence','coleta de tempestades':'Gathering Storm','chamuscar':'Scorch','invocar aery':'Summon Aery',
  'inspiracao':'Inspiration','inspiração':'Inspiration','perspicacia cosmica':'Cosmic Insight','perspicácia cósmica':'Cosmic Insight','calcados magicos':'Magical Footwear','calçados mágicos':'Magical Footwear',
  'flashtraption hextech':'Hextech Flashtraption','hextech flashtraption':'Hextech Flashtraption','tonico triplo':'Triple Tonic','tônico triplo':'Triple Tonic',
  'velocidade de habilidade':'Ability Haste','adaptativo':'Adaptive Force','armadura':'Armor','resistencia magica':'Magic Resist','resistência mágica':'Magic Resist','velocidade de ataque':'Attack Speed'
};

function normalizeAliasName(name='') {
  const low = String(name).toLowerCase().trim();
  return RUNE_ALIASES[low] || RUNE_ALIASES[low.normalize('NFD').replace(/[\u0300-\u036f]/g,'')] || name;
}

async function enrichRunes(runes={}) {
  const dd = await getDDragon();
  const mapRune = (name) => {
    const nm = normalizeAliasName(name || '');
    const r = dd.runeByName[nm.toLowerCase()];
    return r ? { name: r.name, icon: r.icon } : { name: nm, icon: '' };
  };
  const primary = [runes.key, runes.r1, runes.r2, runes.r3].filter(Boolean).map(mapRune);
  const secondary = [runes.s1, runes.s2].filter(Boolean).map(mapRune);
  const shards = (runes.sh || []).slice(0,3).map(s => ({ name: normalizeAliasName(s), icon: '' }));
  return {
    primaryTree: normalizeAliasName(runes.p || ''),
    secondaryTree: normalizeAliasName(runes.s || ''),
    primary,
    secondary,
    shards,
  };
}

async function enrichItems(items=[]) {
  const dd = await getDDragon();
  return items.filter(Boolean).map(it => {
    const key = normalizeAliasName(it).toLowerCase();
    const found = dd.itemByName[key];
    return found ? { name: found.name, icon: found.icon } : { name: normalizeAliasName(it), icon: '' };
  });
}

async function enrichSpells(spells=[]) {
  const dd = await getDDragon();
  return spells.filter(Boolean).map(sp => {
    const key = normalizeAliasName(sp).toLowerCase();
    const found = dd.spellByName[key];
    return found ? { name: found.name, icon: found.icon } : { name: normalizeAliasName(sp), icon: '' };
  });
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
  if (!champData?.vs || enemyKeys.length === 0) return { avg: 50, worst: 50 };
  const wrs = enemyKeys.map(ek => champData.vs[ek] || champData.vs[Object.keys(champData.vs).find(k => normalizeName(k) === ek)] || 50);
  return { avg: wrs.reduce((a,b) => a+b, 0)/wrs.length, worst: Math.min(...wrs) };
}

const COMP_REGEX = {
  tank: /malphite|ornn|sion|maokai|zac|rammus|sejuani|nautilus|leona|alistar|amumu|ksante|drmundo/,
  burst: /zed|talon|fizz|leblanc|syndra|annie|veigar|rengar|khazix|akali|qiyana/,
  cc: /malzahar|leona|nautilus|thresh|morgana|amumu|sejuani|alistar|lissandra|veigar/
};
function getEnemyTags(enemies='') {
  const e = enemies.toLowerCase();
  return Object.entries(COMP_REGEX).filter(([,r]) => r.test(e)).map(([k]) => k);
}
function calcCompBonus(champKey, enemies='') {
  const e = enemies.toLowerCase();
  let bonus = 0;
  if (COMP_REGEX.burst.test(e) && ['lissandra','galio','malzahar','vex'].includes(champKey)) bonus += 4;
  if (COMP_REGEX.tank.test(e) && ['vayne','cassiopeia','karthus','fiora','darius'].includes(champKey)) bonus += 4;
  if (COMP_REGEX.cc.test(e) && ['olaf','gangplank','milio','janna'].includes(champKey)) bonus += 3;
  return bonus;
}

function calcularMelhorPick({ role='', allies='', enemies='', bans='' }) {
  const lane = ({ top:'top', jungle:'jungle', mid:'mid', adc:'adc', bot:'adc', sup:'support', support:'support', suporte:'support' })[String(role).toLowerCase()] || 'mid';
  const pools = {
    top:['aatrox','camille','darius','fiora','gwen','jax','kennen','ksante','malphite','ornn','rumble','shen'],
    jungle:['amumu','diana','elise','graves','hecarim','jarvaniv','khazix','leesin','lillia','nocturne','sejuani','viego','zac'],
    mid:['ahri','akali','akshan','anivia','annie','azir','cassiopeia','fizz','galio','hwei','katarina','leblanc','lissandra','lux','malzahar','orianna','syndra','vex','viktor','yasuo','yone','zed'],
    adc:['aphelios','ashe','caitlyn','draven','ezreal','jhin','jinx','kaisa','lucian','samira','smolder','varus','xayah','zeri'],
    support:['alistar','bard','blitzcrank','braum','janna','karma','leona','lulu','milio','morgana','nami','nautilus','pyke','rakan','rell','thresh','yuumi','zyra']
  };
  const pool = pools[lane] || pools.mid;
  const enemyKeys = parseList(enemies).map(normalizeName);
  const allyKeys = parseList(allies).map(normalizeName);
  const banKeys = parseList(bans).map(normalizeName);
  return pool.filter(ch => !banKeys.includes(ch) && D[ch]).map(champKey => {
    const { avg, worst } = calcMatchupScore(champKey, enemyKeys);
    const synergy = calcSynergyBonus(champKey, allyKeys);
    const compBonus = calcCompBonus(champKey, enemies);
    const score = Math.round((avg * 0.7 + worst * 0.3 + synergy + compBonus) * 10) / 10;
    return { champKey, champ: D[champKey]?.label || champKey.charAt(0).toUpperCase()+champKey.slice(1), role: lane, avgWR: Math.round(avg), worstWR: Math.round(worst), synergy, compBonus, score, data: D[champKey] };
  }).sort((a,b) => b.score - a.score).slice(0,3);
}

function buildReason(tag) {
  return tag === 'tank' ? 'Anti-tank adaptation' : tag === 'burst' ? 'Anti-burst safety' : tag === 'cc' ? 'Anti-CC / Tenacity' : 'Balanced adaptation';
}

function uniqueItems(list) {
  const seen = new Set();
  return list.filter(x => {
    const k = normalizeAliasName(x).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function createAlternativeBuilds(data, enemies='') {
  const base = [...(data.build || [])];
  const tags = getEnemyTags(enemies);
  const out = [];
  if (tags.includes('tank')) {
    out.push({ key:'anti-tank', title:'Alternative A', badge:'ANTI-TANK', reason: buildReason('tank'), items: uniqueItems([...base.slice(0,2), 'Void Staff', ...base.slice(2)]).slice(0,6) });
  }
  if (tags.includes('burst')) {
    out.push({ key:'anti-burst', title:'Alternative B', badge:'ANTI-BURST', reason: buildReason('burst'), items: uniqueItems([...base.slice(0,1), 'Zhonya\'s Hourglass', ...base.slice(1)]).slice(0,6) });
  }
  if (tags.includes('cc') && out.length < 2) {
    out.push({ key:'anti-cc', title: out.length ? 'Alternative B' : 'Alternative A', badge:'ANTI-CC', reason: buildReason('cc'), items: uniqueItems([...base.slice(0,2), 'Banshee\'s Veil', ...base.slice(2)]).slice(0,6) });
  }
  while (out.length < 2) {
    out.push({ key:`alt-${out.length}`, title: out.length ? 'Alternative B' : 'Alternative A', badge:'BALANCED', reason:'Balanced alternative', items: uniqueItems([...base.slice(0,3).reverse(), ...base.slice(3)]).slice(0,6) });
  }
  return out.slice(0,2);
}

async function resolveBuildRunes(champion='', role='', enemies='', allies='') {
  const key = getChampKey(champion);
  const data = D[key];
  if (!data) return null;
  const patch = await getPatch();
  const champAsset = await resolveChampionAsset(champion || key);
  const runes = await enrichRunes(data.runes || {});
  const spells = await enrichSpells(data.f || []);
  const items = await enrichItems((data.build || []).slice(0, data.role === 'adc' ? 7 : 6));
  const alternativesRaw = createAlternativeBuilds(data, enemies);
  const alternatives = [];
  for (const alt of alternativesRaw) {
    alternatives.push({ ...alt, items: await enrichItems(alt.items) });
  }
  const tags = getEnemyTags(enemies);
  return {
    champion: champAsset.name || champion,
    championKey: key,
    role: data.role || role || '',
    cls: data.cls || '',
    championIcon: champAsset.square,
    source: RIOT_KEY ? 'Riot + Data Dragon + Draft similarity' : 'Data Dragon + Draft similarity',
    patch,
    tags,
    spells,
    starter: data.ini || '',
    runes,
    items,
    notes: data.d || [],
    alternatives,
  };
}

function recByMinute(min=0, enemies='') {
  const tags = getEnemyTags(enemies);
  if (min < 2) return { acao:'Lane with discipline', urgencia:'baixa', detalhes:'Minute 0: use waves and vision before fighting.' };
  if (min < 6) return { acao:'Track jungle and prio lane', urgencia:'media', detalhes:'Early game: get lane priority before contesting river.' };
  if (min < 14) return { acao:'Play around dragon setup', urgencia:'media', detalhes:'Mid-early game: establish vision and move first to objective.' };
  if (min < 22) return { acao:'Group for side objective', urgencia:'alta', detalhes:'Mid game: convert prio into dragon, herald or towers.' };
  const suffix = tags.includes('burst') ? ' Respect fog of war and hold defensive cooldowns.' : '';
  return { acao:'Play around vision and picks', urgencia:'alta', detalhes:'Late game: one mistake decides the map.' + suffix };
}

app.use(express.static(__dirname));

app.get('/', async (req, res) => {
  const accept = req.headers.accept || '';
  if (accept.includes('text/html')) return res.sendFile(path.join(__dirname, 'nexus-oracle-live.html'));
  const patch = await getPatch();
  res.json({ status:'Nexus Oracle UI Alt online', patch, riot_api: RIOT_KEY ? 'configurada' : 'não configurada', dataset:`${CHAMP_COUNT} champions` });
});

app.get('/status', async (req, res) => {
  const patch = await getPatch();
  res.json({ status:'ok', patch, riot_api: !!RIOT_KEY, dataset: CHAMP_COUNT });
});

app.post('/pick-data', async (req, res) => {
  try {
    const { context = {} } = req.body || {};
    const { role='', allies='', enemies='', bans='', champion='' } = context;
    const picks = calcularMelhorPick({ role, allies, enemies, bans });
    const picksFull = [];
    for (const p of picks) {
      const asset = await resolveChampionAsset(p.champKey);
      picksFull.push({ ...p, championIcon: asset.square, tags: getEnemyTags(enemies) });
    }
    const build = champion ? await resolveBuildRunes(champion, role, enemies, allies) : (picks[0] ? await resolveBuildRunes(picks[0].champKey, role, enemies, allies) : null);
    res.json({ picks: picksFull, build });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/analyze', async (req, res) => {
  try {
    const { context = {}, gameTime = 0 } = req.body || {};
    const { role='', allies='', enemies='', bans='', champion='' } = context;
    const picks = calcularMelhorPick({ role, allies, enemies, bans });
    const picksFull = [];
    for (const p of picks) {
      const asset = await resolveChampionAsset(p.champKey);
      picksFull.push({ ...p, championIcon: asset.square, tags: getEnemyTags(enemies) });
    }
    const build = champion ? await resolveBuildRunes(champion, role, enemies, allies) : (picks[0] ? await resolveBuildRunes(picks[0].champKey, role, enemies, allies) : null);
    const rec = recByMinute(Number(gameTime)||0, enemies);
    const observations = [
      picksFull[0] ? `Melhor pick: ${picksFull[0].champ} (${picksFull[0].avgWR}% WR)` : null,
      build ? `Origem build/runa: ${build.source}` : null,
      getEnemyTags(enemies).length ? `Leitura da comp: ${getEnemyTags(enemies).join(', ')}` : 'Sem live client. Usando contexto manual.'
    ].filter(Boolean);
    res.json({ ...rec, observacoes: observations, picks: picksFull, build, patch: await getPatch() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const port = 3000;
app.listen(port, async () => {
  console.log(`Servidor na porta ${port}`);
  console.log(`Nexus Oracle UI Alt | patch ${await getPatch()} | dataset ${CHAMP_COUNT}`);
});
