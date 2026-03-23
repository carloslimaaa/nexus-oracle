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
  return { engage, antiDive, scaling };
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


function counterStrategyFromWinCondition(enemyWin, bestPickKey='', ctx={}){
  const champ = D[bestPickKey] || {};
  const antiDive = getTag(bestPickKey,'antiDive');
  const peel = getTag(bestPickKey,'peel');
  const pick = getTag(bestPickKey,'pick');
  const scaling = getTag(bestPickKey,'scaling');
  const lanePrio = getTag(bestPickKey,'lanePrio');
  const engage = getTag(bestPickKey,'engage');

  if (enemyWin.label === 'dive / pick') {
    return {
      title: 'Counter dive / pick',
      pickPlan: antiDive >= 2 || peel >= 2 ? 'Peel first, punish overcommit, play around cooldowns.' : 'Do not side lane greedily; layer CC and keep spacing for counter-engage.',
      macro: 'Ward deep entries before objectives and group 15–20s earlier than usual.',
      avoid: 'Avoid isolated side lane waves without vision and flash tracking.'
    };
  }
  if (enemyWin.label === 'poke / siege') {
    return {
      title: 'Counter poke / siege',
      pickPlan: engage >= 2 ? 'Force faster windows after push timings and threaten flank angles.' : 'Hold HP bars, contest vision in 2-man groups, and avoid entering objective late.',
      macro: 'Secure side wave first, then move as a unit to deny setup.',
      avoid: 'Avoid face-checking chokes after enemy gets first vision control.'
    };
  }
  if (enemyWin.label === 'scale / teamfight') {
    return {
      title: 'Punish scaling comp',
      pickPlan: lanePrio >= 2 || pick >= 2 ? 'Accelerate early tempo with push, roam, and first objective setup.' or 'Trade faster windows and deny comfortable resets before major objectives.',
      macro: 'Use lane priority to create first move on river and force tempo before 2-item spikes.',
      avoid: 'Avoid passive neutral states where enemy comp scales for free.'
    };
  }
  if (enemyWin.label === 'side lane') {
    return {
      title: 'Control side lane pressure',
      pickPlan: scaling >= 2 ? 'Match side safely, then play for stronger 5v5 windows.' : 'Collapse first on overextended side laner with support/jungle timing.',
      macro: 'Track side waves 45–60s before objective and force them to choose between side pressure and setup.',
      avoid: 'Avoid chasing too deep on side while objective timers are spawning.'
    };
  }
  return {
    title: 'Balanced answer',
    pickPlan: 'Play around your strongest setup tool and contest vision before committing.',
    macro: 'Sync wave states with objective timers and move first with priority lanes.',
    avoid: 'Avoid coinflip fights without cooldown or wave advantage.'
  };
}

function adaptivePlaystyle(champKey, ctx={}){
  const safe = getProfile(champKey,'safe');
  const snowball = getProfile(champKey,'snowball');
  const scaling = getTag(champKey,'scaling');
  const lanePrio = getTag(champKey,'lanePrio');
  const enemy = enemyShape(ctx.enemies || []);
  if (snowball >= 3 && lanePrio >= 2 && enemy.scaling >= 5) return 'aggressive';
  if (safe >= 2 && scaling >= 2) return 'scaling';
  return 'control';
}

function dynamicGamePlan(champKey, ctx={}, enemyWin=null){
  const playstyle = adaptivePlaystyle(champKey, ctx);
  const roam = getTag(champKey,'roam');
  const lanePrio = getTag(champKey,'lanePrio');
  const scaling = getTag(champKey,'scaling');

  const early = playstyle === 'aggressive'
    ? (lanePrio >= 2 ? 'Push first waves, contest river timing, and look for first move with jungle.' : 'Trade around cooldowns and look for punish windows before enemy scales.')
    : playstyle === 'scaling'
      ? 'Protect HP and wave state early; avoid low-value skirmishes before key item spikes.'
      : 'Maintain mid control, preserve summoners, and use vision to deny enemy initiative.';

  const mid = enemyWin?.label === 'dive / pick'
    ? 'Group earlier around objectives, hold peel tools, and force enemies to enter your vision.'
    : enemyWin?.label === 'poke / siege'
      ? 'Take side wave first and flank or engage before enemy finishes siege setup.'
      : enemyWin?.label === 'scale / teamfight'
        ? 'Accelerate tempo through resets, objective setups, and picks on isolated targets.'
        : 'Use side pressure to create numbers advantage before neutral fights.';

  const late = scaling >= 2
    ? 'Prioritize clean front-to-back execution and objective discipline over coinflip flanks.'
    : 'Look for pick angles on key carries before committing to full 5v5.';

  const macro = [
    'Track objective timers 60 seconds ahead.',
    lanePrio >= 2 ? 'Crash the nearest wave before moving to river.' : 'Give up one wave if needed to arrive first to setup.',
    enemyWin?.label === 'side lane'
      ? 'Do not overchase side pressure when Baron/Dragon setup starts.'
      : 'Use vision denial to force enemy into your setup window.'
  ];

  return { playstyle, early, mid, late, macro };
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
function categoryScores(champ, metrics, ctx={}){
  const profile = champProfile(champ);
  const stage = draftStage(ctx);
  const lateDraftBonus = stage === 'late' ? 6 : 0;
  return {
    blind: clamp(metrics.comp*0.28 + metrics.meta*0.18 + metrics.riskInverse*0.28 + metrics.lanePrio*0.16 + (profile.safe||0)*4, 0, 100),
    punish: clamp(metrics.matchup*0.42 + metrics.pick*0.18 + metrics.synergy*0.10 + metrics.lanePrio*0.10 + lateDraftBonus + (profile.counterpick||0)*5, 0, 100),
    comfort: clamp(metrics.comfort*0.50 + metrics.matchup*0.15 + metrics.meta*0.10 + metrics.riskInverse*0.10 + (profile.safe||0)*5, 0, 100),
    compFit: clamp(metrics.comp*0.40 + metrics.damageFit*0.18 + metrics.engageFit*0.18 + metrics.synergy*0.14 + metrics.teamfight*0.10, 0, 100)
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
function plan10(champ, metrics, ctx={}){
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
    return `${base} Controle sides cedo, responda visão lateral e force objetivos quando o split estiver mostrado.`;
  }
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
  const cats = categoryScores(champ, metrics, ctx);

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


function counterWinConditionPlan(enemyWin, ctx={}, pickKey=''){
  const cls = D[pickKey]?.cls || '';
  switch(enemyWin?.label){
    case 'dive / pick':
      return {
        title: 'Neutralizar dive / pick',
        bullets: [
          'Jogue com visão profunda antes de avançar side lane.',
          'Segure recursos para counter-engage e peel do carry principal.',
          cls.includes('mago') || cls.includes('adc') ? 'Respeite flank sem flash; lute front-to-back.' : 'Procure marcar o iniciador inimigo antes da fight abrir.'
        ]
      };
    case 'poke / siege':
      return {
        title: 'Quebrar poke / siege',
        bullets: [
          'Evite perder HP antes do objetivo; reset cedo e volte agrupado.',
          'Busque flank, pick ou engage curto em janela de cooldown inimiga.',
          'Empurre wave lateral antes de contestar para não entrar em choke ruim.'
        ]
      };
    case 'scale / teamfight':
      return {
        title: 'Punir scaling inimigo',
        bullets: [
          'Jogue por tempo e prioridade de lane nos primeiros 10 minutos.',
          'Acelere dragões/torres e procure pick antes do 5v5 ideal deles.',
          'Evite lutas longas e organizadas quando eles estiverem em spike.'
        ]
      };
    case 'side lane':
      return {
        title: 'Responder side lane',
        bullets: [
          'Controle visão nas laterais e não perca tempo reagindo tarde.',
          'Force objetivo no lado oposto quando o split estiver mostrado.',
          'Mantenha wave states estáveis para não ceder torre de graça.'
        ]
      };
    default:
      return {
        title: 'Plano geral de draft',
        bullets: [
          'Jogue por informação e tempo de wave.',
          'Priorize objetivo quando tiver número ou visão melhor.',
          'Não force luta sem condição clara de engage ou pick.'
        ]
      };
  }
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
  const enemyWinCondition = detectEnemyWinCondition(ctx.enemies);
  const counterPlan = counterWinConditionPlan(enemyWinCondition, ctx, selected);
  const recommendation = {
      urgency: picks[0]?.confidence >= 78 ? 'alta' : (picks[0]?.confidence >= 60 ? 'media' : 'baixa'),
      action: picks[0] ? `Lock ${picks[0].champ} com confiança` : 'Complete o draft',
      details: picks[0]?.plan10 || 'Revele mais picks para aumentar a confiança.'
    };
  res.json({
    ctx,
    picks,
    categories,
    selectedBuild: buildPayloadForChamp(selected),
    recommendation,
    summary: { enemyWinCondition, counterPlan }
  });
});

app.listen(3000, ()=>console.log('Nexus Oracle rodando em http://localhost:3000'));


app.post('/profile', (req,res)=>{
  const comfort = req.body?.comfort && typeof req.body.comfort === 'object' ? req.body.comfort : {};
  res.json({ ok:true, comfortKeys:Object.keys(comfort).length });
});
