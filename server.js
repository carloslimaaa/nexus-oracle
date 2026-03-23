
import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { D, ALIASES } from './dataset.js';

const app = express();
app.use(cors());
app.use(express.json({ limit:'2mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIVE_AGENT = process.env.NODE_ENV === 'development'
  ? new https.Agent({ rejectUnauthorized:false })
  : undefined;

// Local LCU must always skip cert validation because Riot ships self-signed local certs.
const LCU_AGENT = new https.Agent({ rejectUnauthorized:false, keepAlive:true, maxSockets:4 });

const roles = ['top','jungle','mid','adc','support','sup'];


const PICK_CACHE = new Map();
const CACHE_TTL_MS = 10_000;

function stableStringify(obj){
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}
function cacheGet(key){
  const hit = PICK_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS){ PICK_CACHE.delete(key); return null; }
  return hit.value;
}
function cacheSet(key, value){
  PICK_CACHE.set(key, { ts: Date.now(), value });
  if (PICK_CACHE.size > 200){
    const first = PICK_CACHE.keys().next().value;
    if (first) PICK_CACHE.delete(first);
  }
}

const stats = {
  startedAt: new Date().toISOString(),
  analyzeCount: 0,
  analyzeErrors: 0,
  avgAnalyzeMs: 0,
  lastAnalyzeMs: 0,
  concurrentAnalyze: 0,
  maxConcurrentAnalyze: 0,
  autoContextHits: 0,
  autoContextMisses: 0
};

function norm(s=''){
  return String(s).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
}
function champKey(name=''){
  const key = norm(name);
  return ALIASES[key] || key;
}
function title(k=''){
  return D[k]?.name || k.charAt(0).toUpperCase() + k.slice(1);
}
function parseList(input){
  if (Array.isArray(input)) return input.map(champKey).filter(Boolean);
  return String(input||'').split(/[,;/|]+/).map(champKey).filter(Boolean);
}
function uniq(arr){ return [...new Set(arr)]; }
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function avg(arr, fallback=50){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : fallback; }

function validateContext(raw={}){
  const role = roles.includes(raw.role) ? (raw.role==='sup'?'support':raw.role) : 'mid';
  const allies = uniq(parseList(raw.allies)).filter(k=>D[k]).slice(0,5);
  const enemies = uniq(parseList(raw.enemies)).filter(k=>D[k]).slice(0,5);
  const bans = uniq(parseList(raw.bans)).filter(k=>D[k]).slice(0,10);
  const queueMode = raw.queueMode === 'competitive' ? 'competitive' : 'solo';
  const side = raw.side === 'red' ? 'red' : 'blue';
  const pickOrder = clamp(Number(raw.pickOrder)||3, 1, 10);
  const comfortMap = raw?.playerProfile?.comfort && typeof raw.playerProfile.comfort === 'object' ? raw.playerProfile.comfort : {};
  const comfort = Object.fromEntries(Object.entries(comfortMap).map(([k,v])=>[champKey(k), clamp(Number(v)||0,0,1000)]));
  return { role, allies, enemies, bans, queueMode, side, pickOrder, playerProfile:{ comfort } };
}

function getTag(champ, tag){ return D[champ]?.tags?.[tag] || 0; }
function getProfile(champ, key){ return D[champ]?.profile?.[key] || 0; }
function champProfile(champ){ return D[champ]?.profile || { blind:0, counterpick:0, safe:0, snowball:0 }; }
function damageProfile(champs=[]){
  return champs.reduce((acc,k)=>{
    acc.ap += D[k]?.damage?.ap || 0;
    acc.ad += D[k]?.damage?.ad || 0;
    return acc;
  }, { ap:0, ad:0 });
}
function teamNeeds(allies=[]){
  const engage = allies.reduce((s,k)=>s+getTag(k,'engage'),0);
  const peel = allies.reduce((s,k)=>s+getTag(k,'peel'),0);
  const scaling = allies.reduce((s,k)=>s+getTag(k,'scaling'),0);
  const lanePrio = allies.reduce((s,k)=>s+getTag(k,'lanePrio'),0);
  const dmg = damageProfile(allies);
  return {
    needsEngage: engage < 4,
    needsPeel: peel < 3,
    needsScaling: scaling < 4,
    needsLanePrio: lanePrio < 4,
    needsAP: dmg.ap <= dmg.ad,
    needsAD: dmg.ad < dmg.ap
  };
}
function enemyShape(enemies=[]){
  const engage = enemies.reduce((s,k)=>s+getTag(k,'engage'),0);
  const antiDive = enemies.reduce((s,k)=>s+getTag(k,'antiDive'),0);
  const scaling = enemies.reduce((s,k)=>s+getTag(k,'scaling'),0);
  const poke = enemies.reduce((s,k)=>s+getTag(k,'poke'),0);
  return { engage, antiDive, scaling, poke };
}

function detectEnemyWinCondition(enemies=''){
  const enemyKeys = Array.isArray(enemies) ? enemies.map(champKey) : parseList(enemies).map(champKey);
  const tagsAgg = enemyKeys.reduce((acc,k)=>{
    acc.engage += getTag(k,'engage');
    acc.peel += getTag(k,'peel');
    acc.poke += getTag(k,'poke');
    acc.scaling += getTag(k,'scaling');
    acc.sideLane += getTag(k,'sideLane');
    acc.teamfight += getTag(k,'teamfight');
    acc.pick += getTag(k,'pick');
    acc.antiDive += getTag(k,'antiDive');
    return acc;
  }, {engage:0,peel:0,poke:0,scaling:0,sideLane:0,teamfight:0,pick:0,antiDive:0});

  let label = 'balanced';
  let explanation = 'Comp inimiga equilibrada; respeite visão e power spikes.';
  if (tagsAgg.engage >= 7 && tagsAgg.pick >= 5) {
    label = 'dive / pick';
    explanation = 'A comp inimiga quer encontrar pick e acelerar fight curta em carry sem flash.';
  } else if (tagsAgg.poke >= 7) {
    label = 'poke / siege';
    explanation = 'A comp inimiga quer desgastar antes do objetivo e forçar entrada ruim.';
  } else if (tagsAgg.scaling >= 7 && tagsAgg.teamfight >= 6) {
    label = 'scale / teamfight';
    explanation = 'A comp inimiga quer alongar o jogo e lutar 5v5 em objetivos maiores.';
  } else if (tagsAgg.sideLane >= 6) {
    label = 'side lane';
    explanation = 'A comp inimiga quer pressão lateral e quebrar a estrutura do mapa.';
  }
  return { label, explanation, tags: tagsAgg };
}

function draftStage(ctx){
  const revealed = (ctx.allies?.length || 0) + (ctx.enemies?.length || 0);
  if (revealed <= 2) return 'early';
  if (revealed <= 6) return 'mid';
  return 'late';
}

function calcMatchupScore(champ, enemies=[]){
  const vals = enemies.map(e => D[champ]?.vs?.[e] ?? 50);
  return avg(vals, 50);
}
function calcSynergyScore(champ, allies=[]){
  const vals = allies.map(a => D[champ]?.syn?.[a] ?? 0);
  const raw = vals.reduce((s,v)=>s+v,0);
  return clamp(50 + raw * 6, 0, 100);
}
function calcTeamCompFit(champ, allies=[]){
  const need = teamNeeds(allies);
  let score = 50;
  if (need.needsEngage) score += getTag(champ,'engage') * 8;
  if (need.needsPeel) score += getTag(champ,'peel') * 6;
  if (need.needsScaling) score += getTag(champ,'scaling') * 5;
  if (need.needsLanePrio) score += getTag(champ,'lanePrio') * 5;
  if (need.needsAP) score += (D[champ]?.damage?.ap || 0) * 8;
  if (need.needsAD) score += (D[champ]?.damage?.ad || 0) * 8;
  return clamp(score, 0, 100);
}
function calcDamageFit(champ, allies=[]){
  const dmg = damageProfile(allies);
  const ap = D[champ]?.damage?.ap || 0;
  const ad = D[champ]?.damage?.ad || 0;
  let score = 50;
  if (dmg.ad > dmg.ap) score += ap * 10;
  if (dmg.ap > dmg.ad) score += ad * 10;
  if (dmg.ap === 0 && dmg.ad === 0) score += 10;
  return clamp(score,0,100);
}
function calcEngageFit(champ, allies=[], enemies=[]){
  const need = teamNeeds(allies);
  const enemy = enemyShape(enemies);
  let score = 50;
  if (need.needsEngage) score += getTag(champ,'engage') * 7;
  if (enemy.engage >= 6) score += getTag(champ,'antiDive') * 8 + getTag(champ,'peel') * 4;
  if (enemy.antiDive >= 5 || enemy.poke >= 6) score += getTag(champ,'poke') * 4;
  return clamp(score,0,100);
}
function calcLanePriorityScore(champ){
  return clamp(40 + getTag(champ,'lanePrio') * 15 + getTag(champ,'roam') * 5, 0, 100);
}
function calcComfortScore(champ, profile={comfort:{}}){
  const raw = profile.comfort?.[champ] || 0;
  return clamp(40 + Math.log10(raw + 1) * 20, 0, 100);
}
function calcMetaConfidence(champ){
  const hasVs = Object.keys(D[champ]?.vs || {}).length;
  const hasSyn = Object.keys(D[champ]?.syn || {}).length;
  const hasRunes = D[champ]?.runes?.key ? 1 : 0;
  const hasBuild = Array.isArray(D[champ]?.build) ? D[champ].build.length : 0;
  return clamp(35 + hasVs*2 + hasSyn*2 + hasRunes*12 + hasBuild*3, 0, 100);
}
function calcRiskPenalty(champ, enemies=[]){
  let risk = 0;
  risk += getTag(champ,'execution') * 6;
  risk -= getProfile(champ,'safe') * 3;
  if (enemies.length >= 4 && getProfile(champ,'blind') <= 1) risk += 5;
  return clamp(risk, 0, 30);
}
function computeConfidence(metrics, ctx){
  let conf = metrics.meta*0.22 + metrics.matchup*0.25 + metrics.synergy*0.16 + metrics.comp*0.18 + metrics.comfort*0.10 + metrics.lanePrio*0.09;
  const stage = draftStage(ctx);
  if (stage === 'early') conf -= 12;
  else if (stage === 'mid') conf -= 5;
  if (ctx.enemies.length < 2) conf -= 8;
  if (ctx.allies.length < 2) conf -= 4;
  if (metrics.comfort > 75) conf += 5;
  if (metrics.matchup > 70) conf += 5;
  if (ctx.enemies[0] && metrics.matchup > 60) conf += 4;
  if (ctx.pickOrder >= 8 && metrics.comp > 60) conf += 3;
  return clamp(conf, 0, 100);
}
function categoryScores(champ, metrics){
  const profile = champProfile(champ);
  return {
    blind: clamp(metrics.comp*0.28 + metrics.meta*0.18 + metrics.riskInverse*0.28 + metrics.lanePrio*0.16 + (profile.safe||0)*4, 0, 100),
    punish: clamp(metrics.matchup*0.42 + metrics.pick*0.18 + metrics.synergy*0.10 + metrics.lanePrio*0.10 + (profile.counterpick||0)*5, 0, 100),
    comfort: clamp(metrics.comfort*0.50 + metrics.matchup*0.15 + metrics.meta*0.10 + metrics.riskInverse*0.10 + (profile.safe||0)*5, 0, 100),
    compFit: clamp(metrics.comp*0.40 + metrics.damageFit*0.18 + metrics.engageFit*0.18 + metrics.synergy*0.14 + (40 + getTag(champ,'teamfight')*20)*0.10, 0, 100)
  };
}
function whyReasons(champ, metrics, ctx){
  const enemyWin = detectEnemyWinCondition(ctx.enemies);
  const out=[];
  if (metrics.matchup >= 55) out.push(`Tem matchup favorável contra os picks revelados (${Math.round(metrics.matchup)})`);
  if (metrics.synergy >= 58) out.push(`Conecta bem com seus aliados (${Math.round(metrics.synergy)})`);
  if (metrics.comp >= 58) out.push('Corrige necessidades da composição aliada');
  if (metrics.damageFit >= 58) out.push('Melhora o perfil de dano do time');
  if (enemyWin.label === 'dive / pick' && (getTag(champ,'antiDive') >= 2 || getTag(champ,'peel') >= 2)) out.push('Ajuda a travar a condição de vitória inimiga de dive/pick');
  if (enemyWin.label === 'poke / siege' && getTag(champ,'engage') >= 2) out.push('Cria janela de engage para quebrar poke/siege');
  if (!out.length) out.push('Pick estável para o estado atual do draft');
  return out.slice(0,3);
}
function riskText(champ, metrics){
  if (metrics.risk >= 20) return 'Alto risco de execução e punição em blind.';
  if (metrics.risk >= 12) return 'Risco moderado: precisa de disciplina em tempo de engage.';
  return 'Baixo risco relativo para o draft atual.';
}
function counterWinConditionPlan(enemyWin, ctx={}, pickKey=''){
  const cls = D[pickKey]?.cls || '';
  switch(enemyWin?.label){
    case 'dive / pick':
      return {
        title: 'Neutralizar dive / pick',
        why: 'O inimigo quer achar pick em fog e forçar engage curto antes de você responder.',
        bullets: [
          'Jogue com visão profunda antes de avançar side lane.',
          'Segure recursos para counter-engage e peel do carry principal.',
          cls.includes('mago') || cls.includes('adc') ? 'Respeite flank sem flash; lute front-to-back.' : 'Marque o iniciador inimigo antes da fight abrir.'
        ]
      };
    case 'poke / siege':
      return {
        title: 'Quebrar poke / siege',
        why: 'O inimigo quer te desgastar antes do objetivo e te obrigar a entrar sem HP.',
        bullets: [
          'Evite perder HP antes do objetivo; reset cedo e volte agrupado.',
          'Busque flank, pick ou engage curto em janela de cooldown inimiga.',
          'Empurre wave lateral antes de contestar para não entrar em choke ruim.'
        ]
      };
    case 'scale / teamfight':
      return {
        title: 'Punir scaling inimigo',
        why: 'O inimigo fica mais forte quanto mais organizado o 5v5 e quanto mais o jogo alonga.',
        bullets: [
          'Jogue por tempo e prioridade de lane nos primeiros 10 minutos.',
          'Acelere dragões/torres e procure pick antes do 5v5 ideal deles.',
          'Evite lutas longas e organizadas qu&&o eles estiverem em spike.'
        ]
      };
    case 'side lane':
      return {
        title: 'Responder side lane',
        why: 'O inimigo quer quebrar sua estrutura lateral e forçar reação tardia no mapa.',
        bullets: [
          'Controle visão nas laterais e não perca tempo reagindo tarde.',
          'Force objetivo no lado oposto qu&&o o split estiver mostrado.',
          'Mantenha wave states estáveis para não ceder torre de graça.'
        ]
      };
    default:
      return {
        title: 'Plano geral de draft',
        why: 'A comp inimiga não expõe uma condição única forte ainda.',
        bullets: [
          'Jogue por informação e tempo de wave.',
          'Priorize objetivo qu&&o tiver número ou visão melhor.',
          'Não force luta sem condição clara de engage ou pick.'
        ]
      };
  }
}
function plan10(champ, metrics, ctx){
  const tips = D[champ]?.d || [];
  const enemyWin = detectEnemyWinCondition(ctx.enemies || []);
  const base = tips[0] || 'Jogue pelos primeiros objetivos com disciplina de wave.';
  if (enemyWin.label === 'dive / pick') {
    return `${base} Jogue a lane de forma controlada, guarde feitiços para responder engage e priorize visão profunda antes de contestar rio.`;
  }
  if (enemyWin.label === 'poke / siege') {
    return `${base} Preserve HP, entre em objetivo com wave empurrada e procure flank ou pick antes da fight frontal.`;
  }
  if (enemyWin.label === 'scale / teamfight') {
    return `${base} Acelere prio de lane e tente criar janela de pick antes da comp inimiga chegar no 5v5 ideal.`;
  }
  if (enemyWin.label === 'side lane') {
    return `${base} Controle sides cedo, responda visão lateral e force objetivos qu&&o o split estiver mostrado.`;
  }
  if (metrics.lanePrio >= 65) return `${base} Priorize pressão de lane e primeiro movimento para rio.`;
  if (metrics.matchup < 48) return `${base} Respeite prioridade inimiga e jogue por reset/visão.`;
  return `${base} Procure skirmishes só com informação e tempo de wave.`;
}
function whyThisWinsGame(champ, metrics, ctx){
  const enemyWin = detectEnemyWinCondition(ctx.enemies || []);
  if (enemyWin.label === 'dive / pick' && (getTag(champ,'antiDive') >= 2 || getTag(champ,'peel') >= 2)) {
    return 'Ganha jogo porque reduz o valor do engage inimigo e força fights mais longas e previsíveis.';
  }
  if (enemyWin.label === 'poke / siege' && getTag(champ,'engage') >= 2) {
    return 'Ganha jogo porque cria janela de engage ou flank antes do setup inimigo ficar perfeito.';
  }
  if (enemyWin.label === 'scale / teamfight' && (metrics.lanePrio >= 60 || metrics.matchup >= 55)) {
    return 'Ganha jogo porque acelera o mapa antes da comp inimiga chegar no pico ideal de 5v5.';
  }
  if (enemyWin.label === 'side lane' && (getTag(champ,'pick') >= 2 || getTag(champ,'roam') >= 2)) {
    return 'Ganha jogo porque responde pressão lateral com prioridade e ameaça de collapse.';
  }
  return 'Ganha jogo porque melhora seu draft em matchup, sinergia e execução prática do plano.';
}

function scoreC&&idate(champ, ctx){
  const matchup = calcMatchupScore(champ, ctx.enemies);
  const synergy = calcSynergyScore(champ, ctx.allies);
  const comp = calcTeamCompFit(champ, ctx.allies);
  const damageFit = calcDamageFit(champ, ctx.allies);
  const engageFit = calcEngageFit(champ, ctx.allies, ctx.enemies);
  const lanePrio = calcLanePriorityScore(champ);
  const comfort = calcComfortScore(champ, ctx.playerProfile);
  const meta = calcMetaConfidence(champ);
  const risk = calcRiskPenalty(champ, ctx.enemies);
  const riskInverse = 100 - risk * 3;
  const pick = clamp(40 + getTag(champ,'pick')*15, 0, 100);

  const weights = ctx.queueMode === 'competitive'
    ? { matchup:0.20, synergy:0.20, comp:0.25, damageFit:0.10, engageFit:0.10, lanePrio:0.10, comfort:0.05, meta:0.05 }
    : { matchup:0.35, synergy:0.10, comp:0.10, damageFit:0.05, engageFit:0.05, lanePrio:0.15, comfort:0.20, meta:0.10 };

  const score =
    matchup*weights.matchup +
    synergy*weights.synergy +
    comp*weights.comp +
    damageFit*weights.damageFit +
    engageFit*weights.engageFit +
    lanePrio*weights.lanePrio +
    comfort*weights.comfort +
    meta*weights.meta - risk;

  const metrics = { matchup, synergy, comp, damageFit, engageFit, lanePrio, comfort, meta, risk, riskInverse, pick };
  const conf = computeConfidence(metrics, ctx);
  const cats = categoryScores(champ, metrics);

  const labels = [];
  if (cats.blind >= 65) labels.push('Blind');
  if (cats.punish >= 65) labels.push('Punish');
  if (cats.comfort >= 65) labels.push('Comfort');
  if (cats.compFit >= 65) labels.push('Comp Fit');

  return {
    champKey: champ,
    champ: D[champ]?.name || title(champ),
    role: D[champ]?.role || ctx.role,
    score: Math.round(score),
    confidence: Math.round(conf),
    avgWR: Math.round(matchup),
    worstWR: Math.round(matchup),
    labels,
    reasons: whyReasons(champ, metrics, ctx),
    whyWins: whyThisWinsGame(champ, metrics, ctx),
    risk: riskText(champ, metrics),
    plan10: plan10(champ, metrics, ctx),
    breakdown: {
      matchup: Math.round(matchup),
      synergy: Math.round(synergy),
      comp: Math.round(comp),
      damageFit: Math.round(damageFit),
      engageFit: Math.round(engageFit),
      lanePrio: Math.round(lanePrio),
      comfort: Math.round(comfort),
      meta: Math.round(meta),
      risk: -Math.round(risk)
    },
    categoryScores: Object.fromEntries(Object.entries(cats).map(([k,v])=>[k, Math.round(v)]))
  };
}

function filterC&&idates(ctx){
  return Object.keys(D).filter(k => D[k].role === ctx.role && !ctx.bans.includes(k));
}
function topBy(results, key){
  return [...results].sort((a,b)=>b.categoryScores[key]-a.categoryScores[key]).slice(0,3);
}
function buildPayloadForChamp(champKey){
  const c = D[champKey];
  if (!c) return null;
  return {
    champion: c.name || title(champKey),
    role: c.role,
    cls: c.cls || '',
    spells: c.f || [],
    starter: c.ini || '',
    runes: c.runes || {},
    build: c.build || [],
    notes: c.d || []
  };
}

// ---- Stability / performance helpers ----
const PERF = {
  llSourceEnabled: false,
  requestCount: 0,
  errors: 0
};
function withAnalyzeMetrics(fn){
  return async (req,res)=>{
    const start = Date.now();
    stats.concurrentAnalyze += 1;
    stats.maxConcurrentAnalyze = Math.max(stats.maxConcurrentAnalyze, stats.concurrentAnalyze);
    PERF.requestCount += 1;
    try {
      await fn(req,res);
    } catch (err) {
      stats.analyzeErrors += 1;
      PERF.errors += 1;
      res.status(500).json({ error: err?.message || 'internal_error' });
    } finally {
      const ms = Date.now() - start;
      stats.analyzeCount += 1;
      stats.lastAnalyzeMs = ms;
      stats.avgAnalyzeMs = stats.avgAnalyzeMs
        ? Math.round(((stats.avgAnalyzeMs * (stats.analyzeCount - 1)) + ms) / stats.analyzeCount)
        : ms;
      stats.concurrentAnalyze -= 1;
    }
  };
}

// ---- Automatic champ select detection via local LCU ----
function c&&idateLockfilePaths(){
  const home = os.homedir();
  return [
    path.join(home, 'AppData', 'Local', 'Riot Games', 'Riot Client', 'Config', 'lockfile'),
    'C:\\Riot Games\\League of Legends\\lockfile',
    'D:\\Riot Games\\League of Legends\\lockfile',
    path.join(home, 'Riot Games', 'League of Legends', 'lockfile')
  ];
}
function readLockfile(){
  for (const p of c&&idateLockfilePaths()){
    try{
      if (fs.existsSync(p)){
        const raw = fs.readFileSync(p,'utf8').trim();
        const [name,pid,port,password,protocol] = raw.split(':');
        if (port && password) return { path:p, name, pid, port, password, protocol };
      }
    }catch{}
  }
  return null;
}
async function lcuGet(lock, endpoint){
  const auth = Buffer.from(`riot:${lock.password}`).toString('base64');
  const url = `${lock.protocol || 'https'}://127.0.0.1:${lock.port}${endpoint}`;
  return await new Promise((resolve,reject)=>{
    const req = https.request(url, {
      method:'GET',
      headers:{ Authorization:`Basic ${auth}` },
      agent: LCU_AGENT
    }, res=>{
      let buf='';
      res.on('data', c=>buf += c);
      res.on('end', ()=>{
        try{
          if (res.statusCode >= 200 && res.statusCode < 300){
            resolve(buf ? JSON.parse(buf) : null);
          }else reject(new Error(`LCU_${res.statusCode}`));
        }catch(e){ reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}
async function getChampionIdMap(){
  const out = {};
  for (const [k,v] of Object.entries(D)) {
    if (v?.name) out[v.name.toLowerCase()] = k;
  }
  return out;
}
function positionToRole(pos=''){
  const p = String(pos).toLowerCase();
  if (p.includes('top')) return 'top';
  if (p.includes('jungle')) return 'jungle';
  if (p.includes('middle') || p.includes('mid')) return 'mid';
  if (p.includes('bottom') || p.includes('adc')) return 'adc';
  if (p.includes('utility') || p.includes('support') || p.includes('sup')) return 'support';
  return 'mid';
}
async function autoDetectChampSelectContext(){
  const lock = readLockfile();
  if (!lock) return { available:false, reason:'lockfile_not_found' };

  try{
    const [session, summoner] = await Promise.all([
      lcuGet(lock, '/lol-champ-select/v1/session'),
      lcuGet(lock, '/lol-summoner/v1/current-summoner')
    ]);
    if (!session) return { available:false, reason:'session_not_found' };
    const cellId = session.localPlayerCellId;
    const myCell = [...(session.myTeam||[]), ...(session.theirTeam||[])].find(x=>x.cellId === cellId) || null;
    const myTeam = (session.myTeam||[]).map(x=>x.championId).filter(Boolean);
    const enemyTeam = (session.theirTeam||[]).map(x=>x.championId).filter(Boolean);
    const bans = [
      ...((session.bans?.myTeamBans)||[]),
      ...((session.bans?.theirTeamBans)||[])
    ].filter(Boolean);

    // current dataset keys are minimal; map champion names if known, else ignore.
    // Session only gives ids. Without external map, expose ids too.
    const ctx = {
      available:true,
      phase: session.timer?.phase || 'UNKNOWN',
      source: 'LCU',
      role: positionToRole(myCell?.assignedPosition || myCell?.position || ''),
      side: (myCell && myCell.cellId <= 4) ? 'blue' : 'red',
      pickOrder: (myCell?.cellId ?? 2) + 1,
      allies: [],
      enemies: [],
      bans: [],
      rawChampionIds: { allies: myTeam, enemies: enemyTeam, bans },
      localCellId: cellId,
      summoner: summoner?.displayName || ''
    };
    return ctx;
  } catch (e){
    return { available:false, reason:'lcu_unavailable', error:String(e.message||e) };
  }
}

app.use(express.static(__dirname));
app.get('/', (req,res)=>res.sendFile(path.join(__dirname, 'nexus-oracle-live.html')));
app.get('/index.html', (req,res)=>res.sendFile(path.join(__dirname, 'index.html')));
app.get('/status', async (req,res)=>{
  const auto = await autoDetectChampSelectContext();
  res.json({
    ok:true,
    mode:'deterministic-dataset',
    liveClient: !!LIVE_AGENT,
    autoDetect: auto.available,
    autoPhase: auto.phase || null,
    llSourceEnabled: PERF.llSourceEnabled,
    metrics: {
      analyzeCount: stats.analyzeCount,
      avgAnalyzeMs: stats.avgAnalyzeMs,
      lastAnalyzeMs: stats.lastAnalyzeMs,
      concurrentAnalyze: stats.concurrentAnalyze,
      maxConcurrentAnalyze: stats.maxConcurrentAnalyze,
      errors: stats.analyzeErrors
    }
  });
});
app.get('/metrics', (req,res)=>res.json({ ok:true, stats, perf: PERF }));
app.get('/champions', (req,res)=>res.json(Object.keys(D).map(k=>D[k].name || title(k)).sort()));
app.get('/auto-context', withAnalyzeMetrics(async (req,res)=>{
  const auto = await autoDetectChampSelectContext();
  if (auto.available) stats.autoContextHits += 1; else stats.autoContextMisses += 1;
  res.json(auto);
}));

app.post('/analyze', withAnalyzeMetrics(async (req,res)=>{
  const auto = req.body?.autoDetect ? await autoDetectChampSelectContext() : { available:false };
  const merged = auto.available ? {
    ...req.body,
    role: req.body.role || auto.role,
    side: req.body.side || auto.side,
    pickOrder: req.body.pickOrder || auto.pickOrder,
    allies: req.body.allies || '',
    enemies: req.body.enemies || '',
    bans: req.body.bans || ''
  } : req.body;
  const ctx = validateContext(merged || {});
  const c&&idates = filterC&&idates(ctx);
  const scored = c&&idates.map(ch=>scoreC&&idate(ch, ctx)).sort((a,b)=>b.score-a.score);
  const picks = scored.slice(0,3);
  const categories = {
    blind: topBy(scored,'blind'),
    punish: topBy(scored,'punish'),
    comfort: topBy(scored,'comfort'),
    compFit: topBy(scored,'compFit')
  };
  const selected = req.body?.selectedPick ? champKey(req.body.selectedPick) : picks[0]?.champKey;
  const enemyWinCondition = detectEnemyWinCondition(ctx.enemies);
  const counterPlan = counterWinConditionPlan(enemyWinCondition, ctx, selected);
  const topPick = picks[0];
  const recommendation = {
      urgency: topPick?.confidence >= 80 ? 'alta' : (topPick?.confidence >= 65 ? 'media' : 'baixa'),
      action: topPick ? `Lock ${topPick.champ} com confiança` : 'Complete o draft',
      details: topPick ? `${topPick.whyWins} ${topPick.plan10}` : 'Revele mais picks para aumentar a confiança.'
    };
  res.json({
    ctx,
    autoContext: auto,
    picks,
    categories,
    selectedBuild: buildPayloadForChamp(selected),
    recommendation,
    summary: { enemyWinCondition, counterPlan }
  });
}));

app.listen(3000, ()=>console.log('Nexus Oracle rod&&o em http://localhost:3000'));

app.post('/profile', (req,res)=>{
  const comfort = req.body?.comfort && typeof req.body.comfort === 'object' ? req.body.comfort : {};
  res.json({ ok:true, comfortKeys:Object.keys(comfort).length });
});
