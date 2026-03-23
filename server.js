import express from 'express';
import cors from 'cors';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { D, ALIASES, findChamp } from './dataset.js';

const app = express();
app.use(cors());
app.use(express.json({ limit:'2mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIVE_AGENT = process.env.NODE_ENV === 'development'
  ? new https.Agent({ rejectUnauthorized:false })
  : undefined;

const roles = ['top','jungle','mid','adc','support','sup'];

function norm(s=''){
  return String(s).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
}
function champKey(name=''){
  const key = norm(name);
  return ALIASES[key] || key;
}
function title(k=''){
  return D[k]?.name || k;
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
  const comfortMap = raw?.playerProfile?.comfort && typeof raw.playerProfile.comfort === 'object' ? raw.playerProfile.comfort : {};
  const comfort = Object.fromEntries(Object.entries(comfortMap).map(([k,v])=>[champKey(k), clamp(Number(v)||0,0,1000)]));
  return { role, allies, enemies, bans, queueMode, playerProfile:{ comfort } };
}

function getTag(champ, tag){ return D[champ]?.tags?.[tag] || 0; }
function getProfile(champ, key){ return D[champ]?.profile?.[key] || 0; }
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
  return { engage, antiDive, scaling };
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
  if (dmg.ap === 0 && dmg.ad === 0) score += ap >= ad ? 10 : 10;
  return clamp(score,0,100);
}
function calcEngageFit(champ, allies=[], enemies=[]){
  const need = teamNeeds(allies);
  const enemy = enemyShape(enemies);
  let score = 50;
  if (need.needsEngage) score += getTag(champ,'engage') * 7;
  if (enemy.engage >= 6) score += getTag(champ,'antiDive') * 8 + getTag(champ,'peel') * 4;
  if (enemy.antiDive >= 5) score += getTag(champ,'poke') * 4;
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
  let conf = metrics.meta*0.25 + metrics.matchup*0.25 + metrics.synergy*0.2 + metrics.comp*0.2 + metrics.comfort*0.1;
  if (ctx.enemies.length < 2) conf -= 10;
  if (ctx.allies.length < 2) conf -= 5;
  if (metrics.comfort > 70) conf += 5;
  if (metrics.matchup > 70) conf += 5;
  if (ctx.enemies.length < 1) conf -= 10;
  return clamp(conf, 0, 100);
}
function categoryScores(champ, metrics){
  return {
    blind: clamp(metrics.comp*0.3 + metrics.meta*0.2 + metrics.riskInverse*0.3 + metrics.lanePrio*0.2, 0, 100),
    punish: clamp(metrics.matchup*0.45 + metrics.pick*0.2 + metrics.synergy*0.15 + metrics.lanePrio*0.2, 0, 100),
    comfort: clamp(metrics.comfort*0.5 + metrics.matchup*0.2 + metrics.meta*0.15 + metrics.riskInverse*0.15, 0, 100),
    compFit: clamp(metrics.comp*0.4 + metrics.damageFit*0.2 + metrics.engageFit*0.2 + metrics.synergy*0.2, 0, 100)
  };
}
function whyReasons(champ, metrics, ctx){
  const out=[];
  if (metrics.matchup >= 55) out.push(`Matchup favorável contra draft revelado (${Math.round(metrics.matchup)})`);
  if (metrics.synergy >= 58) out.push(`Sinergia forte com aliados (${Math.round(metrics.synergy)})`);
  if (metrics.comp >= 58) out.push('Corrige necessidades da composição aliada');
  if (metrics.damageFit >= 58) out.push('Melhora o perfil de dano do time');
  if (metrics.engageFit >= 58) out.push('Se encaixa bem no padrão de engage/disengage');
  if (!out.length) out.push('Pick estável para o estado atual do draft');
  return out.slice(0,3);
}
function riskText(champ, metrics){
  if (metrics.risk >= 20) return 'Alto risco de execução e punição em blind.';
  if (metrics.risk >= 12) return 'Risco moderado: precisa de disciplina em tempo de engage.';
  return 'Baixo risco relativo para o draft atual.';
}
function plan10(champ, metrics){
  const tips = D[champ]?.d || [];
  const base = tips[0] || 'Jogue pelos primeiros objetivos com disciplina de wave.';
  if (metrics.lanePrio >= 65) return `${base} Priorize pressão de lane e primeiro movimento para rio.`;
  if (metrics.matchup < 48) return `${base} Respeite prioridade inimiga e jogue por reset/visão.`;
  return `${base} Procure skirmishes só com informação e tempo de wave.`;
}

function scoreCandidate(champ, ctx){
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
    champ: D[champ]?.name || champ,
    role: D[champ]?.role || ctx.role,
    score: Math.round(score),
    confidence: Math.round(conf),
    avgWR: Math.round(matchup),
    worstWR: Math.round(matchup),
    labels,
    reasons: whyReasons(champ, metrics, ctx),
    risk: riskText(champ, metrics),
    plan10: plan10(champ, metrics),
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

function filterCandidates(ctx){
  return Object.keys(D).filter(k => D[k].role === ctx.role && !ctx.bans.includes(k));
}
function topBy(results, key){
  return [...results].sort((a,b)=>b.categoryScores[key]-a.categoryScores[key]).slice(0,3);
}
function buildPayloadForChamp(champKey){
  const c = D[champKey];
  if (!c) return null;
  return {
    champion: c.name,
    role: c.role,
    cls: c.cls,
    spells: c.f || [],
    starter: c.ini || '',
    runes: c.runes || {},
    build: c.build || [],
    notes: c.d || []
  };
}

app.use(express.static(__dirname));
app.get('/', (req,res)=>res.sendFile(path.join(__dirname, 'nexus-oracle-live.html')));
app.get('/index.html', (req,res)=>res.sendFile(path.join(__dirname, 'index.html')));
app.get('/status', (req,res)=>res.json({ ok:true, mode:'deterministic-dataset', liveClient: !!LIVE_AGENT }));
app.get('/champions', (req,res)=>res.json(Object.keys(D).map(k=>D[k].name).sort()));

app.post('/analyze', (req,res)=>{
  const ctx = validateContext(req.body || {});
  const candidates = filterCandidates(ctx);
  const scored = candidates.map(ch=>scoreCandidate(ch, ctx)).sort((a,b)=>b.score-a.score);
  const picks = scored.slice(0,3);
  const categories = {
    blind: topBy(scored,'blind'),
    punish: topBy(scored,'punish'),
    comfort: topBy(scored,'comfort'),
    compFit: topBy(scored,'compFit')
  };
  const selected = req.body?.selectedPick ? champKey(req.body.selectedPick) : picks[0]?.champKey;
  res.json({
    ctx,
    picks,
    categories,
    selectedBuild: buildPayloadForChamp(selected),
    recommendation: {
      urgency: picks[0]?.confidence >= 70 ? 'media' : 'baixa',
      action: picks[0] ? `Lock ${picks[0].champ} com confiança` : 'Complete o draft',
      details: picks[0]?.plan10 || 'Revele mais picks para aumentar a confiança.'
    }
  });
});

app.listen(3000, ()=>console.log('Nexus Oracle rodando em http://localhost:3000'));
