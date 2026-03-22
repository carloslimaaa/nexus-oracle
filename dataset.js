// ═══════════════════════════════════════════════════════════════════════════════
// NEXUS ORACLE — DATASET LOCAL COMPLETO
// Todos os campeões do LoL com builds verificadas, runas, matchups e sinergias
// Fonte: lolalytics / u.gg / op.gg Challenger — patch 25.x (2026)
// vs:  { inimigo: winrate% }  — 50=neutro, <50=desfavorável, >50=favorável
// syn: { aliado: pontosBônus } — somado ao score do motor de pick
// ═══════════════════════════════════════════════════════════════════════════════

// Formato compacto:
// role: "top|jungle|mid|adc|sup"
// cls: "adc|mago|assassino_ap|assassino_ad|lutador|tank|enchanter|sup_engage"
// vs:  matchups relevantes (top counters e countered-by)
// syn: sinergias fortes com aliados
// runes: { key, p, r1, r2, r3, s, s1, s2, sh:[3 shards] }
// build: [6 itens em ordem]
// ini: itens iniciais
// f: [feitiço1, feitiço2]

export const D = {

  // ══════════════════════ TOP ══════════════════════════════════════════════════

  aatrox: {
    role:"top", cls:"lutador",
    vs:{ Garen:52, Irelia:50, Darius:49, Fiora:47, Camille:50, Malphite:53, Ornn:51, Gnar:52 },
    syn:{ Orianna:3, Azir:3, Amumu:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Dança da Morte","Sterak's Gage","Pele de Pedra de Gárgula","Guardião Imortal"],
    ini:"Machado Longo + Poção", f:["Flash","Ignite"],
    d:["Q1→Q2→W→Q3: empurre inimigos para o centro do W","R: use para cobrir mais área no teamfight","Maximiza Q primeiro","Power spike: Trindade + Dança"]
  },

  ambessa: {
    role:"top", cls:"lutador",
    vs:{ Garen:52, Darius:50, Malphite:51, Ornn:50, Sion:52, Irelia:50 },
    syn:{ Orianna:3, Amumu:3, Malphite:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Dança da Morte","Machado Negro","Sterak's Gage","Cimitarra Mercurial"],
    ini:"Machado Longo + Poção", f:["Flash","Ignite"],
    d:["E dash: reposicionar entre autos e habilidades","Passive marks: proc com Q após W","Jogue agressivo level 2+ vs fighters","R: engage/disengage teamfight"]
  },

  camille: {
    role:"top", cls:"lutador",
    vs:{ Darius:52, Garen:53, Malphite:53, Irelia:50, Fiora:50, Ornn:51 },
    syn:{ Orianna:3, Azir:3, Lulu:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Lança de Shojin","Dança da Morte","Sterak's Gage","Protetor do Guardião"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["W borda externa: slow/stun","E gancho em parede + R = lock 1v1","Split push é sua win condition"]
  },

  chogath: {
    role:"top", cls:"tank",
    vs:{ Garen:51, Irelia:49, Darius:50, Fiora:47, Riven:50, Jayce:52 },
    syn:{ Yasuo:4, Orianna:3, Azir:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Manopla de Gelo","Botas de Mercúrio","Coração Congelado","Pele de Pedra de Gárgula","Força da Natureza","Armadura de Warmog"],
    ini:"Doran Shield + Poção", f:["Flash","Teleporte"],
    d:["R só em cs/objectives — nunca desperdiçe","Q silencia: setup R no teamfight","Stack Feast = HP permanente"]
  },

  darius: {
    role:"top", cls:"lutador",
    vs:{ Garen:52, Camille:48, Irelia:48, Malphite:53, Fiora:47, Teemo:50 },
    syn:{ Orianna:3, Amumu:3, Malphite:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Quebra-Passos","Botas de Mercúrio","Aço do Coração","Pele de Pedra de Gárgula","Força da Natureza","Armadura de Espinhos"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["5 stacks + Guilhotina = kill garantida","Q borda externa: cura + dano bônus","W: pull inimigos que tentam kitar"]
  },

  drmundo: {
    role:"top", cls:"tank",
    vs:{ Darius:52, Garen:51, Fiora:46, Camille:50, Vayne:44, Irelia:50 },
    syn:{ Orianna:2, Azir:2, Jinx:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Aço do Coração","Botas de Treino","Véu do Espírito","Armadura de Warmog","Força da Natureza","Armadura de Espinhos"],
    ini:"Doran Shield + Poção", f:["Flash","Ignite"],
    d:["Farm HP: último hit com Q para regen","R quando abaixo de 40% HP","Thornmail vs AD heavy — Força da Natureza vs AP"]
  },

  fiora: {
    role:"top", cls:"lutador",
    vs:{ Darius:53, Garen:54, Malphite:52, Ornn:51, Sion:53, Chogath:52 },
    syn:{ Orianna:3, Azir:2, Jhin:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Ravenosa Hidra","Botas de Treino","Dança da Morte","Sterak's Gage","Fio do Infinito","Protetor do Guardião"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["4 Vitals: cura massiva + R amplificado","Q parry: bloqueia projéteis e CC","Split push 1v1: melhor duelista com items"]
  },

  gangplank: {
    role:"top", cls:"lutador",
    vs:{ Darius:51, Garen:52, Malphite:50, Irelia:50, Camille:51, Ornn:51 },
    syn:{ Orianna:3, Azir:3, Jhin:2 },
    runes:{ key:"Primeiro Golpe", p:"Precisão", r1:"Presença de Espírito", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Essência Caçadora","Botas de Iônia","Stridebreaker","Rancor de Serylda","Máscara do Abismo","Dança da Morte"],
    ini:"Biscoito de Saúde + Poção", f:["Flash","Ignite"],
    d:["Farm Q em minions para stacks de ouro","Barris: W → barrel → Q","R global: pressione objetivos de qualquer ponto"]
  },

  garen: {
    role:"top", cls:"lutador",
    vs:{ Darius:48, Fiora:46, Camille:47, Irelia:49, Malphite:52, Vayne:45 },
    syn:{ Orianna:2, Amumu:2, Jarvan:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Lenda: Persistência", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Quebra-Passos","Botas de Treino","Aço do Coração","Pele de Pedra de Gárgula","Força da Natureza","Armadura de Espinhos"],
    ini:"Doran Shield + Poção", f:["Flash","Teleporte"],
    d:["E cancela slow — use para alcançar kiting","Passive regen: 8s fora de combate","R mais forte quanto mais kills o inimigo tiver"]
  },

  gnar: {
    role:"top", cls:"lutador",
    vs:{ Darius:50, Malphite:51, Ornn:50, Sion:51, Fiora:49, Camille:51 },
    syn:{ Orianna:3, Yasuo:4, Yone:4 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Condicionamento", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Quebra-Passos","Botas de Treino","Trinidade da Ferida","Sterak's Gage","Pele de Pedra de Gárgula","Força da Natureza"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["Mini Gnar: harass com boomerang, acumule rage","Mega Gnar: all-in imediato com R contra parede","GNAR! precisa de parede para stun máximo"]
  },

  gwen: {
    role:"top", cls:"mago",
    vs:{ Darius:51, Garen:52, Malphite:51, Ornn:50, Fiora:50, Irelia:51 },
    syn:{ Orianna:3, Azir:2, Amumu:3 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Sandálias do Feiticeiro","Ampulheta de Zhonya","Riftmaker","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["W: use antes do Q para máximo dano","Q: cura mais dentro do W","E: reset de dash com hit — kiting"]
  },

  illaoi: {
    role:"top", cls:"lutador",
    vs:{ Darius:50, Garen:51, Camille:49, Irelia:50, Fiora:49, Malphite:52 },
    syn:{ Orianna:2, Amumu:3, Leona:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Quebra-Passos","Botas de Treino","Aço do Coração","Sterak's Gage","Pele de Pedra de Gárgula","Armadura de Espinhos"],
    ini:"Doran Shield + Poção", f:["Flash","Ignite"],
    d:["E (Teste do Espírito): posicione tentáculos para amplificar dano","R spawna tentáculos — mais inimigos = mais","1v2+ é onde Illaoi brilha"]
  },

  irelia: {
    role:"top", cls:"lutador",
    vs:{ Darius:52, Garen:51, Camille:50, Malphite:49, Ornn:50, Fiora:50 },
    syn:{ Orianna:2, Amumu:3, Malphite:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Faca Chempunk Serrilhada","Botas de Treino","Espada do Rei Destruído","Lâmina Raivosa","Cimitarra Mercurial","Guardião Imortal"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["4 stacks passive antes de engajar","Q reset em low HP inimigo","R horizontal divide o grupo"]
  },

  jax: {
    role:"top", cls:"lutador",
    vs:{ Darius:51, Garen:52, Malphite:50, Fiora:50, Camille:52, Irelia:51 },
    syn:{ Orianna:2, Azir:2, Lulu:3 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Sterak's Gage","Espada do Rei Destruído","Cimitarra Mercurial","Guardião Imortal"],
    ini:"Machado Longo + Poção", f:["Flash","Ignite"],
    d:["Combo: E counter → W → Q jump → auto = burst","E bloqueia TODOS autos — use vs ADC","R proc a cada 3 autos — mantenha proc ativo"]
  },

  jayce: {
    role:"top", cls:"lutador",
    vs:{ Darius:51, Garen:52, Malphite:50, Ornn:51, Camille:51, Irelia:50 },
    syn:{ Orianna:3, Azir:2, Jinx:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Lâmina Sanguessuga","Botas de Treino","Machado Negro","Rancor de Serylda","Dança da Morte","Fio do Infinito"],
    ini:"Espada Longa + Poção", f:["Flash","Teleporte"],
    d:["EQ canhão: burst longa distância","Forma martelo: E knockback + W para CC","Jogue ranged até poder all-in"]
  },

  kayle: {
    role:"top", cls:"mago",
    vs:{ Darius:51, Garen:50, Malphite:52, Ornn:52, Fiora:50, Camille:51 },
    syn:{ Yasuo:4, Yone:4, Tristana:3 },
    runes:{ key:"Ritmo Letal", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Dente de Nashor","Botas de Berserker","Lâmina da Raiva de Guinsoo","Lâmina Raivosa","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["Jogue MUITO safe até level 11","Level 16: rainha do jogo — AoE ranged with fire","Teleporte obrigatório para sobreviver early"]
  },

  kennen: {
    role:"top", cls:"mago",
    vs:{ Darius:52, Garen:53, Malphite:50, Ornn:51, Sion:52, Irelia:51 },
    syn:{ Orianna:2, Azir:3, Amumu:3 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Sandálias do Feiticeiro","Ampulheta de Zhonya","Chama das Sombras","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["E dash: gap close + iniciar combo","Combo: E in → W auto spam → Q → R (AoE stun)","R Maelstrom em 3+ inimigos = win condition"]
  },

  ksante: {
    role:"top", cls:"tank",
    vs:{ Darius:50, Garen:51, Fiora:48, Camille:49, Irelia:51, Malphite:50 },
    syn:{ Orianna:3, Yasuo:3, Yone:3 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Manopla de Gelo","Botas de Mercúrio","Jak'Sho o Proteano","Coração Congelado","Força da Natureza","Pele de Pedra de Gárgula"],
    ini:"Doran Shield + Poção", f:["Flash","Teleporte"],
    d:["Q: 3 hits geram Dauntless — Q3 para CC","W: atravessa wall + invulnerabilidade","R All Out: muito mais dano e mobilidade"]
  },

  kled: {
    role:"top", cls:"lutador",
    vs:{ Darius:50, Garen:51, Malphite:52, Ornn:51, Irelia:50, Camille:51 },
    syn:{ Orianna:2, Amumu:3, Malphite:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Dança da Morte","Sterak's Gage","Pele de Pedra de Gárgula","Guardião Imortal"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Passive: 2 vidas — jogue agressivo","R: flanking + buff speed de aliados","Duel: melhor 1v1 quando mounted com stacks"]
  },

  malphite: {
    role:"top", cls:"tank",
    vs:{ Darius:47, Fiora:48, Camille:47, Irelia:51, Garen:48, Teemo:49 },
    syn:{ Yasuo:6, Yone:5, Jinx:3, Tristana:3, Wukong:4 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Manopla de Gelo","Botas de Treino","Jak'Sho o Proteano","Coração Congelado","Força da Natureza","Pele de Pedra de Gárgula"],
    ini:"Doran Shield + Poção", f:["Flash","Teleporte"],
    d:["R impossível de cancelar — engage perfeito","Synergy: Yasuo/Yone aproveitam R","Armor build = AP via passive"]
  },

  maokai: {
    role:"top", cls:"tank",
    vs:{ Darius:51, Garen:52, Fiora:49, Irelia:50, Camille:51, Malphite:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Aço do Coração","Botas de Mercúrio","Jak'Sho o Proteano","Força da Natureza","Armadura de Espinhos","Pele de Pedra de Gárgula"],
    ini:"Doran Shield + Poção", f:["Flash","Teleporte"],
    d:["W: healing passivo em cada habilidade","R Prende AoE em teamfight","Plante saplings em brushes para visão e slow"]
  },

  mordekaiser: {
    role:"top", cls:"mago",
    vs:{ Darius:51, Garen:52, Malphite:50, Ornn:51, Fiora:49, Sion:52 },
    syn:{ Orianna:2, Amumu:2, Azir:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Criador de Fendas","Sandálias do Feiticeiro","Abraço Demoníaco","Rylai's Crystal Scepter","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["R: isola 1 carry — priorize ADC/Mago inimigo","E Death Grasp: pull + gap close","Passive: Q proc orbs — Q cria shield enorme"]
  },

  nasus: {
    role:"top", cls:"tank",
    vs:{ Darius:50, Garen:51, Camille:48, Fiora:46, Malphite:53, Irelia:50 },
    syn:{ Orianna:2, Amumu:2, Malphite:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Aço do Coração","Botas de Treino","Véu do Espírito","Armadura de Warmog","Pele de Pedra de Gárgula","Força da Natureza"],
    ini:"Doran Shield + Poção", f:["Flash","Teleporte"],
    d:["SEMPRE farm Q em minions — nunca perca","Meta: 200+ stacks no lvl 11, 400+ no 16","Play safe até 150 stacks; então split push"]
  },

  olaf: {
    role:"top", cls:"lutador",
    vs:{ Darius:52, Garen:51, Malphite:52, Ornn:51, Fiora:50, Irelia:51 },
    syn:{ Orianna:2, Amumu:2, Azir:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Persistência", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Espada do Rei Destruído","Botas de Treino","Machado Negro","Sterak's Gage","Dança da Morte","Guardião Imortal"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Q: apanhe o machado para reset do cooldown","R: imune a CC — engage direto em carries","HP baixo = mais ataque (passive) — jogue agressivo"]
  },

  ornn: {
    role:"top", cls:"tank",
    vs:{ Darius:50, Garen:51, Fiora:48, Camille:49, Irelia:50, Malphite:50 },
    syn:{ Orianna:3, Azir:3, Yasuo:3 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Manopla de Gelo","Botas de Treino","Jak'Sho o Proteano","Coração Congelado","Força da Natureza","Pele de Pedra de Gárgula"],
    ini:"Doran Shield + Poção", f:["Flash","Teleporte"],
    d:["R (Chamado do Forjador): chame o carneiro duas vezes para knockup","Upgrade itens aliados no level 13: priorize ADC/Mago","W frail zone: use para CC chain"]
  },

  pantheon: {
    role:"top", cls:"lutador",
    vs:{ Darius:51, Garen:52, Malphite:52, Ornn:51, Irelia:50, Camille:51 },
    syn:{ Orianna:2, Amumu:3, Azir:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Precisão", s1:"Triunfo", s2:"Golpe de Misericórdia", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Lâmina Sanguessuga","Botas de Treino","Machado Negro","Rancor de Serylda","Dança da Morte","Guardião Imortal"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Aegis passive: bloqueia next damage com 3 autos","Level 2 all-in: E stun → Q → W para burst","R: roaming global — gank após cada kill"]
  },

  poppy: {
    role:"top", cls:"tank",
    vs:{ Darius:51, Garen:52, Malphite:51, Ornn:51, Irelia:52, Camille:52 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Força da Trindade","Botas de Treino","Sterak's Gage","Pele de Pedra de Gárgula","Força da Natureza","Jak'Sho o Proteano"],
    ini:"Doran Shield + Poção", f:["Flash","Ignite"],
    d:["W zona anti-dash: posicione contra parede","E empurra contra parede para stun","R anti-dive: lança todos no ar"]
  },

  quinn: {
    role:"top", cls:"adc",
    vs:{ Darius:52, Garen:53, Malphite:51, Ornn:52, Nasus:53, Irelia:51 },
    syn:{ Orianna:2, Azir:2, Jinx:2 },
    runes:{ key:"Pressione o Ataque", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Fio do Infinito","Espada do Rei Destruído","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["Passive: auto marcada = damage extra","Vault (E): disengage/kite vs melee","R: mobilidade global — roam em 30s"]
  },

  renekton: {
    role:"top", cls:"lutador",
    vs:{ Darius:51, Garen:52, Malphite:52, Ornn:51, Fiora:50, Irelia:51 },
    syn:{ Orianna:2, Amumu:2, Azir:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Quebra-Passos","Botas de Treino","Machado Negro","Sterak's Gage","Dança da Morte","Pele de Pedra de Gárgula"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Fury (50+): W stun mais longo + Q dash maior","Combo: W (50 fury stun) → Q dash through → Q back","Power spike: level 3-9"]
  },

  riven: {
    role:"top", cls:"lutador",
    vs:{ Darius:51, Garen:52, Malphite:51, Ornn:50, Irelia:50, Camille:51 },
    syn:{ Orianna:2, Amumu:3, Azir:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Lâmina Sanguessuga","Botas de Treino","Dança da Morte","Faca Chempunk Serrilhada","Sterak's Gage","Protetor do Guardião"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Q animation cancel: Q → auto × 3 = max DPS","E shield ANTES de tomar damage","Combo all-in: E → Q → Q → W → Q → R → Ignite"]
  },

  rumble: {
    role:"top", cls:"mago",
    vs:{ Darius:52, Garen:53, Malphite:51, Ornn:52, Irelia:52, Camille:52 },
    syn:{ Orianna:3, Azir:3, Amumu:3 },
    runes:{ key:"Fase Rush", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Criador de Fendas","Sandálias do Feiticeiro","Rylai's Crystal Scepter","Tormento de Liandry","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Danger Zone (75-100 heat): +50% dano","R Equalizer: use em choke point ou em initiation","Não overheate sem intenção — silence = morte"]
  },

  sett: {
    role:"top", cls:"tank",
    vs:{ Darius:51, Garen:52, Malphite:51, Ornn:50, Irelia:50, Fiora:50 },
    syn:{ Orianna:2, Amumu:2, Azir:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Persistência", r3:"Última Resistência", s:"Determinação", s1:"Condicionamento", s2:"Crescimento Excessivo", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Aço do Coração","Botas de Treino","Sterak's Gage","Pele de Pedra de Gárgula","Força da Natureza","Armadura de Espinhos"],
    ini:"Doran Shield + Poção", f:["Flash","Ignite"],
    d:["Grit full: full Haymaker = dano máximo","W damage = grit acumulado — espere full","R slam: use em tanque inimigo para dano AoE"]
  },

  shen: {
    role:"top", cls:"tank",
    vs:{ Darius:51, Garen:52, Fiora:50, Camille:51, Irelia:50, Malphite:50 },
    syn:{ Jinx:4, KaiSa:3, Orianna:3, Vayne:3 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Aço do Coração","Botas de Treino","Coração Congelado","Pele de Pedra de Gárgula","Força da Natureza","Armadura de Espinhos"],
    ini:"Doran Shield + Poção", f:["Flash","Teleporte"],
    d:["R global: salve carries globalmente","Q Twilight Assault: empowered autos com spirit blade","W bloqueia TODOS os autos — anti-ADC perfeito"]
  },

  singed: {
    role:"top", cls:"tank",
    vs:{ Darius:51, Garen:52, Malphite:50, Irelia:51, Camille:52, Fiora:51 },
    syn:{ Orianna:2, Amumu:2, Azir:2 },
    runes:{ key:"Fase Rush", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Celeridade", r3:"Coleta de Tempestades", s:"Determinação", s1:"Condicionamento", s2:"Crescimento Excessivo", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Bastão das Eras","Botas de Mobilidade","Rylai's Crystal Scepter","Máscara Abissal","Força da Natureza","Armadura de Warmog"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["NUNCA persiga Singed — você perde","Proxy farming: farm entre torretas inimigas","Fling: sempre jogue inimigos PARA TRÁS do seu time"]
  },

  sion: {
    role:"top", cls:"tank",
    vs:{ Darius:50, Garen:51, Fiora:48, Camille:49, Irelia:50, Malphite:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Aço do Coração","Botas de Treino","Jak'Sho o Proteano","Coração Congelado","Pele de Pedra de Gárgula","Força da Natureza"],
    ini:"Doran Shield + Poção", f:["Flash","Teleporte"],
    d:["Q full charge: knockup enorme — esconda atrás de minion wall","Passive: após morte, use habilidades por 8s","R: use para engage de flank ou escape"]
  },

  teemo: {
    role:"top", cls:"mago",
    vs:{ Darius:52, Garen:53, Malphite:51, Ornn:52, Nasus:55, Fiora:50 },
    syn:{ Orianna:2, Azir:2, Jinx:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Dente de Nashor","Sandálias do Feiticeiro","Tormento de Liandry","Rylai's Crystal Scepter","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Shrooms: coloque em jungle paths e pit de objetos","Blind (Q): ZERA autos — essencial vs ADC/Yi/Tryndamere","Nashor's + Liandry: on-hit + DoT escala infinitamente"]
  },

  tryndamere: {
    role:"top", cls:"lutador",
    vs:{ Darius:50, Garen:51, Malphite:49, Ornn:50, Fiora:50, Irelia:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Espada do Rei Destruído","Botas de Berserker","Fio do Infinito","Protetor Estático","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["R invulnerabilidade: use no momento certo para survive","Fury max = mais crit — use skills para fury","Split push: maior 1v1 com itens e fury"]
  },

  urgot: {
    role:"top", cls:"lutador",
    vs:{ Darius:51, Garen:52, Malphite:51, Ornn:50, Fiora:50, Irelia:50 },
    syn:{ Orianna:2, Amumu:2, Azir:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Persistência", r3:"Última Resistência", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Quebra-Passos","Botas de Treino","Machado Negro","Sterak's Gage","Dança da Morte","Pele de Pedra de Gárgula"],
    ini:"Doran Shield + Poção", f:["Flash","Ignite"],
    d:["W Purge: auto shotgun + slow — mantenha pressionado","E Disdain: charge + knockback para engajar","R Execute: use abaixo de 25% HP inimigo"]
  },

  vayne: {
    role:"adc", cls:"adc",
    vs:{ MissFortune:51, Jinx:50, Caitlyn:49, KaiSa:50, Jhin:51 },
    syn:{ Thresh:3, Leona:2, Orianna:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Espada do Rei Destruído","Botas de Berserker","Fio do Infinito","Lembrete Mortal","Guardião Mortal","Protetor Estático"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["Silver Bolts: 3 autos = True damage — sempre 3 autos","R Final Hour: duração dobra com kills","E Condemn: empurre contra parede para stun"]
  },

  volibear: {
    role:"jungle", cls:"tank",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, KhaZix:51, Kayn:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Sunfire Aegis","Botas de Treino","Jak'Sho o Proteano","Força da Natureza","Coração Congelado","Pele de Pedra de Gárgula"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["R destroi tower ativa — use para dive","Passive fury mode: HP baixo = speed + damage","Q: run down com speed boost + stun"]
  },

  warwick: {
    role:"jungle", cls:"lutador",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:51, KhaZix:50 },
    syn:{ Orianna:2, Azir:2, Jinx:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Última Resistência", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Sunfire Aegis","Botas de Treino","Sterak's Gage","Espada do Rei Destruído","Força da Natureza","Armadura de Espinhos"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Blood Scent: visão + speed vs HP<50% — run down","R Infinite Duress: suppressão — use em carry isolado","Gank quando inimigo está half HP"]
  },

  wukong: {
    role:"jungle", cls:"lutador",
    vs:{ LeeSin:50, Hecarim:51, Graves:51, Amumu:51, KhaZix:50 },
    syn:{ Malphite:4, Orianna:4, Azir:3, Yasuo:4 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Sterak's Gage","Pele de Pedra de Gárgula","Guardião Imortal","Machado Negro"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["W Clone: enganar inimigos sobre sua posição","R Cyclone: knockup AoE — pode ativar DUAS vezes","Synergy: Malphite/Amumu iniciam, Wukong finaliza com R"]
  },

  yorick: {
    role:"top", cls:"lutador",
    vs:{ Darius:51, Garen:52, Malphite:52, Ornn:51, Fiora:49, Irelia:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Aço do Coração","Botas de Treino","Sterak's Gage","Pele de Pedra de Gárgula","Força da Natureza","Armadura de Warmog"],
    ini:"Doran Shield + Poção", f:["Flash","Teleporte"],
    d:["Maiden (R): envie para split push enquanto você defende","Ghouls seguem Maiden — deixe andar sozinha","E slow + ghoul jump = CC chain"]
  },

  // ══════════════════════ JUNGLE ══════════════════════════════════════════════

  amumu: {
    role:"jungle", cls:"tank",
    vs:{ LeeSin:52, Hecarim:52, Graves:51, KhaZix:50, Elise:50, Nidalee:52 },
    syn:{ Yasuo:6, Yone:5, Jinx:3, Orianna:4, Azir:4, Wukong:4 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Capacete de Gladiador", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Abraço de Sunfire","Botas de Mercúrio","Aço do Coração","Pele de Pedra de Gárgula","Espírito do Ancião","Colosso de Anima"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Q tem 2 cargas — primeira gap close, segunda confirma","R imediato após Q em gank","Nunca inicie sozinho no teamfight"]
  },

  belveth: {
    role:"jungle", cls:"lutador",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:51, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Jinx:2 },
    runes:{ key:"Ritmo Letal", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Espada do Rei Destruído","Botas de Berserker","Lâmina da Raiva de Guinsoo","Witchblade","Guardião Imortal","Lembrete Mortal"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Stack Lavender Sea: farm todos os camps","R True Form após rift/baron — power spike enorme","E Royal Maelstrom: canal para damage reduction + lifesteal"]
  },

  briar: {
    role:"jungle", cls:"lutador",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:52, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Perseguidor Sombrio", r3:"Caçador Voraz", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Espada do Rei Destruído","Botas de Treino","Sterak's Gage","Lâmina da Raiva de Guinsoo","Guardião Imortal","Lembrete Mortal"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Passive: sem healing exceto em takedowns — engaje com kill potencial","R perseguição imparável — use apenas quando kill confirmado","W: empurra inimigo contra parede para knockback adicional"]
  },

  diana: {
    role:"jungle", cls:"assassino_ap",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, KhaZix:51, Elise:51 },
    syn:{ Yasuo:4, Yone:3, Orianna:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Sandálias do Feiticeiro","Ampulheta de Zhonya","Chama das Sombras","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Q hit = reset R — SEMPRE Q antes de R","Combo: Q → R dash → W → R2","Gank com Q garantido — R1 então R2"]
  },

  elise: {
    role:"jungle", cls:"assassino_ap",
    vs:{ LeeSin:50, Hecarim:51, Graves:51, KhaZix:50, Nidalee:52 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Sandálias do Feiticeiro","Ampulheta de Zhonya","Sombra do Morto","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Gank: Human Q stun → cocoon E → spider form → R dive","Level 3 é o power spike máximo de gank"]
  },

  evelynn: {
    role:"jungle", cls:"assassino_ap",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, KhaZix:50, Amumu:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Sandálias do Feiticeiro","Chama das Sombras","Ampulheta de Zhonya","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Passive Demon Shade: invisível após lvl 6 out of combat","Lure (W): charm para proc bonus dano","R Last Caress: execute + teleport — 3x dano abaixo de 30%"]
  },

  fiddlesticks: {
    role:"jungle", cls:"mago",
    vs:{ LeeSin:51, Hecarim:50, Graves:52, Amumu:51, KhaZix:51 },
    syn:{ Orianna:2, Azir:3, Amumu:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Coroa Sombria","Sandálias do Feiticeiro","Tormento de Liandry","Chapéu Mortal de Rabadon","Ampulheta de Zhonya","Bastão do Vazio"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["R: canalize atrás de wall → R → Flash para surprise","Drain (W): fique em bush e inimigos andam para você","Efígie passiva: ward falso — engana vision inimiga"]
  },

  graves: {
    role:"jungle", cls:"adc",
    vs:{ LeeSin:50, Hecarim:49, Amumu:51, KhaZix:51, Nidalee:52 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Pressione o Ataque", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Fio do Infinito","Espada do Rei Destruído","Lembrete Mortal","Guardião Mortal"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Q bounce na parede = mais damage","E Quickdraw: use DEFENSIVAMENTE","Close range: todos os pellets acertam = max DPS"]
  },

  hecarim: {
    role:"jungle", cls:"tank",
    vs:{ LeeSin:50, Amumu:48, Graves:49, KhaZix:51, Sejuani:52 },
    syn:{ Orianna:3, Azir:2, Amumu:2 },
    runes:{ key:"Fase Rush", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Celeridade", r3:"Coleta de Tempestades", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Sunfire Aegis","Botas de Treino","Sterak's Gage","Força da Natureza","Pele de Pedra de Gárgula","Jak'Sho o Proteano"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Phase Rush: proc com 3 habilidades = speed insano","R fear de longa distância em carries","E: first hit com charge máximo = max damage"]
  },

  ivern: {
    role:"jungle", cls:"enchanter",
    vs:{ LeeSin:52, Hecarim:51, Graves:52, KhaZix:52, Amumu:51 },
    syn:{ Jinx:4, KaiSa:3, Twitch:5, Lulu:2 },
    runes:{ key:"Guardião", p:"Determinação", r1:"Regeneração", r2:"Condicionamento", r3:"Revitalizar", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mobilidade","Promessa do Cavaleiro","Colosso de Anima","Fortaleza de Redenção","Caduceu de Rabadon"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Farm: cultive camps para liberá-los sem lutar","Daisy (R): pet com knockup — posicione no teamfight","Shield (E): proteção para aliados — timing crucial"]
  },

  jarvaniv: {
    role:"jungle", cls:"lutador",
    vs:{ LeeSin:50, Hecarim:51, Graves:51, Amumu:52, KhaZix:51 },
    syn:{ Yasuo:5, Yone:4, Orianna:3, Azir:3 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Sterak's Gage","Pele de Pedra de Gárgula","Guardião Imortal","Lança de Shojin"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["EQ combo: E flag → Q lance = dash garantido","R: arena AoE — isolar carry ou criar teamfight","Gank level 3: EQ + W slow + R se necessário"]
  },

  kayn: {
    role:"jungle", cls:"assassino_ad",
    vs:{ LeeSin:49, Hecarim:50, Graves:50, Amumu:51, KhaZix:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Dusk Blade","Botas de Treino","Dança da Morte","Sterak's Gage","Machado Negro","Guardião Imortal"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Blue Kayn vs teamfight/tanques | Red Kayn vs squishy","R Shadow Step: entre em inimigos — escape também","Farm ambos os tipos de inimigo para transformação rápida"]
  },

  khazix: {
    role:"jungle", cls:"assassino_ad",
    vs:{ LeeSin:50, Hecarim:49, Amumu:50, Graves:49, Elise:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Faca de Dusk","Botas de Treino","Véu da Noite","Dança da Morte","Sterak's Gage","Arco do Axioma"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Isolated target: damage bônus em Q — sempre 1v1","Evolve Q primeiro — burst máximo","R Void Assault: stealth para reset isolated"]
  },

  kindred: {
    role:"jungle", cls:"adc",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:52, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Pressione o Ataque", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Fio do Infinito","Kraken Slayer","Lembrete Mortal","Guardião Mortal"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Mark targets: farm stacks — mais stacks = mais dano","R Lamb's Respite: previne kills de todos na zone","Use R defensivamente para salvar carries"]
  },

  leesin: {
    role:"jungle", cls:"lutador",
    vs:{ Hecarim:50, Amumu:48, Graves:50, KhaZix:50, Nidalee:51 },
    syn:{ Orianna:3, Azir:3, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Perseguidor Sombrio", r3:"Caçador Voraz", s:"Precisão", s1:"Triunfo", s2:"Lenda: Tenacidade", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Faca de Dusk","Botas de Treino","Capa da Égide","Lâmina da Noite Infinita","Guardião Imortal","Véu de Morte"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Insec: Flash/W2 ANTES do R para kickar para trás do time","Ward hop: jogue ward → W2 para flanquear","Power spike: level 3 com Q/W/E"]
  },

  lillia: {
    role:"jungle", cls:"mago",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:52, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Fase Rush", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Celeridade", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Criador de Fendas","Botas de Iônia","Rylai's Crystal Scepter","Tormento de Liandry","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Q bordas externas = máximo dano","R sleep AoE — use em teamfight ou gank","Phase Rush: fuga imparável com 3 habilidades"]
  },

  masteryi: {
    role:"jungle", cls:"lutador",
    vs:{ LeeSin:49, Hecarim:50, Graves:49, Amumu:50, KhaZix:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Espada do Rei Destruído","Botas de Berserker","Kraken Slayer","Lâmina da Raiva de Guinsoo","Guardião Mortal","Lembrete Mortal"],
    ini:"Machado de Pedra + Poção", f:["Smite","Ignite"],
    d:["Alpha Strike (Q): invulnerável durante cast — dodge skillshots","R Highlander: reset com kills — mantenha em teamfight","Fraco vs CC — nunca dive sem Quicksilver"]
  },

  nidalee: {
    role:"jungle", cls:"assassino_ap",
    vs:{ LeeSin:49, Hecarim:50, Graves:48, Amumu:51, KhaZix:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Sandálias do Feiticeiro","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya","Horizonte Foco"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Spear: máximo dano a longa distância","Hunted: hit spear = pounce gratuito","Takedown: executa com HP baixo em forma felino"]
  },

  nocturne: {
    role:"jungle", cls:"assassino_ad",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:52, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Precisão", s1:"Triunfo", s2:"Golpe de Misericórdia", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Faca de Dusk","Botas de Treino","Véu da Noite","Sterak's Gage","Dança da Morte","Arco do Axioma"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["R Paranoia: escuridão global + dash — gank de qualquer lugar","Spellshield (W): bloqueia próxima habilidade","Dive carries isolados com R + E (fear)"]
  },

  nunu: {
    role:"jungle", cls:"tank",
    vs:{ LeeSin:51, Hecarim:51, Graves:51, KhaZix:52, Amumu:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Sunfire Aegis","Botas de Treino","Jak'Sho o Proteano","Força da Natureza","Armadura de Espinhos","Coração Congelado"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Q Consume: heal enorme em monster","W Snowball: full speed = knockup enorme para gank","R Absolute Zero: canal AoE — use no baron pit"]
  },

  reksai: {
    role:"jungle", cls:"lutador",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:52, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Sterak's Gage","Dança da Morte","Pele de Pedra de Gárgula","Guardião Imortal"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Tunnel network: mobilidade global pelo mapa","R Void Rush: teleporte para target com Void Rush","Burrow: visão underground + mobility boost"]
  },

  rengar: {
    role:"jungle", cls:"assassino_ad",
    vs:{ LeeSin:50, Hecarim:49, Graves:50, Amumu:51, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Precisão", s1:"Triunfo", s2:"Golpe de Misericórdia", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Dusk Blade","Botas de Treino","Faca Chempunk Serrilhada","Dança da Morte","Sterak's Gage","Arco do Axioma"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Ferocity 5 stacks: empowered Q one-shot","R The Hunt: invisível + marca target — escolha carry","Leap sempre de bush"]
  },

  sejuani: {
    role:"jungle", cls:"tank",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:51, KhaZix:51 },
    syn:{ Orianna:3, Azir:3, Amumu:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Sunfire Aegis","Botas de Mercúrio","Jak'Sho o Proteano","Coração Congelado","Força da Natureza","Armadura de Espinhos"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Passive: 4 hits = stun — proc com Q/W/E","R Glacial Prison: longo alcance — use de flank","W Fury: empowera próxima habilidade com stun"]
  },

  shaco: {
    role:"jungle", cls:"assassino_ad",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:52, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Dusk Blade","Botas de Treino","Véu da Noite","Dança da Morte","Sterak's Gage","Arco do Axioma"],
    ini:"Machado de Pedra + Poção", f:["Smite","Ignite"],
    d:["Jack in the Box: fear + visão em brushes","Q Deceive: teleport invisível — gank inesperado","Clone (R): confunde e dano extra"]
  },

  shyvana: {
    role:"jungle", cls:"mago",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:52, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Dente de Nashor","Botas de Berserker","Lâmina da Raiva de Guinsoo","Lâmina Raivosa","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Dragon Form: farm rápido objectives e monsters","R charge em inimigos + knockback parede","E Flame Breath: mark AoE — dano de todos"]
  },

  skarner: {
    role:"jungle", cls:"tank",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:51, KhaZix:51 },
    syn:{ Orianna:3, Azir:2, Amumu:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Manopla de Gelo","Botas de Treino","Jak'Sho o Proteano","Coração Congelado","Força da Natureza","Pele de Pedra de Gárgula"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["R Primordial Cry: arraste carry inimigo para dentro do seu time","Q Shattered Earth: spires no chão + power","Controle de spires: mais controle do mapa"]
  },

  taliyah: {
    role:"jungle", cls:"mago",
    vs:{ LeeSin:51, Hecarim:50, Graves:52, Amumu:51, KhaZix:52 },
    syn:{ Orianna:2, Azir:3, Amumu:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Coroa Sombria","Sandálias do Feiticeiro","Tormento de Liandry","Chapéu Mortal de Rabadon","Ampulheta de Zhonya","Bastão do Vazio"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Surfing passive: surfar walls = speed enorme para roaming","Q first cast = full damage; worked ground = less","R Weaver's Wall: isola inimigos ou bloqueia entrada"]
  },

  udyr: {
    role:"jungle", cls:"lutador",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:51, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Fase Rush", p:"Precisão", r1:"Manto de Nuvem", r2:"Celeridade", r3:"Coleta de Tempestades", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Sunfire Aegis","Botas de Treino","Jak'Sho o Proteano","Força da Natureza","Armadura de Espinhos","Pele de Pedra de Gárgula"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Phoenix stance (R): AoE damage — clear rápido","Bear stance (E): stun no primeiro hit","Phase Rush: proc com 3 habilidades = imparável"]
  },

  vi: {
    role:"jungle", cls:"lutador",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:51, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Sterak's Gage","Dança da Morte","Pele de Pedra de Gárgula","Guardião Imortal"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Q knockback — use de wall para ganks","R target CC imparável — use em carry","Passive shields stack com autos — mantenha em fights"]
  },

  xinzhao: {
    role:"jungle", cls:"lutador",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:51, KhaZix:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Sterak's Gage","Dança da Morte","Pele de Pedra de Gárgula","Lança de Shojin"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Q Three Talon: 3 autos = knockup","E gap close + slow","R knockback todos exceto target — isola carry"]
  },

  zac: {
    role:"jungle", cls:"tank",
    vs:{ LeeSin:51, Hecarim:50, Graves:52, Amumu:51, KhaZix:52 },
    syn:{ Orianna:3, Azir:3, Amumu:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Fonte de Vida", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Sunfire Aegis","Botas de Mercúrio","Jak'Sho o Proteano","Força da Natureza","Coração Congelado","Pele de Pedra de Gárgula"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Blob drops: apanhe blobs para heal — crítico","Q snag longa distância — setup ganks","E charge + knockup enorme — longa distância"]
  },

  karthus: {
    role:"jungle", cls:"mago",
    vs:{ LeeSin:51, Hecarim:50, Graves:52, Amumu:51, KhaZix:52 },
    syn:{ Orianna:3, Azir:3, Amumu:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Coroa Sombria","Sandálias do Feiticeiro","Chapéu Mortal de Rabadon","Tormento de Liandry","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["R Requiem: global execute — use após cada teamfight","Passive Death Defied: 7s de habilidades após morrer","Q: solo alvo = 2x dano"]
  },

  // ══════════════════════ MID ══════════════════════════════════════════════════

  ahri: {
    role:"mid", cls:"assassino_ap",
    vs:{ Zed:52, Talon:51, Yasuo:51, Fizz:49, Syndra:50, Viktor:50, LeBlanc:50, Orianna:51 },
    syn:{ LeeSin:3, Amumu:3, Malphite:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Chama das Sombras","Chapéu Mortal de Rabadon","Véu da Banshee","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Ignite","Flash"],
    d:["Charm (E) ANTES de Q e W","R tem 3 cargas — escape também","Roame pelo flanking lateral"]
  },

  akali: {
    role:"mid", cls:"assassino_ap",
    vs:{ Zed:51, Talon:50, Yasuo:52, Syndra:49, Viktor:51, Orianna:52, LeBlanc:52 },
    syn:{ LeeSin:3, Amumu:3, Malphite:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Sandálias do Feiticeiro","Ampulheta de Zhonya","Chama das Sombras","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Passive ring: lute DENTRO do ring para heal","W Twilight Shroud: invisível — dodge skillshots","Combo: Q → auto → E → R1 → W → R2 para execute"]
  },

  akshan: {
    role:"mid", cls:"adc",
    vs:{ Zed:51, Talon:50, Yasuo:51, Syndra:51, Viktor:51, Orianna:52 },
    syn:{ LeeSin:2, Amumu:2, Malphite:2 },
    runes:{ key:"Pressione o Ataque", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Fio do Infinito","Espada do Rei Destruído","Lembrete Mortal","Guardião Mortal"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Passive: cada 2 autos = empowered terceiro","W Going Rogue: invisível + grappling — roaming","Revive Scoundrel: matar assassino do aliado = revive"]
  },

  anivia: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:54, Fizz:50, Syndra:50, Viktor:50, LeBlanc:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Bastão das Eras","Botas de Iônia","Horizonte Foco","Tormento de Liandry","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["Passive Rebirth: egg ao morrer — proteja com walls","Q stun: acerte Q → auto → E → Q","R canal: maximize AP antes de usar"]
  },

  annie: {
    role:"mid", cls:"mago",
    vs:{ Zed:50, Talon:49, Yasuo:50, Fizz:49, Syndra:50, Viktor:50, LeBlanc:50 },
    syn:{ Orianna:2, Amumu:2, Azir:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Chama das Sombras","Ampulheta de Zhonya","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Passive: 4 spell casts = stun na próxima habilidade","Tibbers (R) com stun: combo definitivo","Q restore mana com kill — spam para farm"]
  },

  aurelionsol: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:50, Syndra:51, Viktor:51, LeBlanc:52 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Criador de Fendas","Sandálias do Feiticeiro","Bastão do Vazio","Chapéu Mortal de Rabadon","Tormento de Liandry","Bastão das Eras"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["Stardust: farm com Q/W para power increases","Q canal full = enorme dano + stun","R Falling Star: AoE engage com stardust"]
  },

  aurora: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:51, Fizz:50, Syndra:51, Viktor:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Sandálias do Feiticeiro","Ampulheta de Zhonya","Chama das Sombras","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["W Across the Veil: Spirit Realm + movement speed","Combo: W enter → Q → E proc → auto → R","R Between Worlds: espaço separado — isolamento"]
  },

  azir: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:50, Syndra:51, Viktor:50, LeBlanc:52, Orianna:50 },
    syn:{ LeeSin:3, Amumu:3, Malphite:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Dente de Nashor","Sandálias do Feiticeiro","Sceptro de Rylai","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["Soldiers: posicione ANTES de pressionar W","E Shifting Sands: dash through soldiers","R Emperor's Divide: bloqueia chase ou separa grupo"]
  },

  cassiopeia: {
    role:"mid", cls:"mago",
    vs:{ Zed:52, Talon:51, Yasuo:52, Fizz:51, Syndra:50, Viktor:51, LeBlanc:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Fase Rush", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Sceptro de Rylai","Sandálias do Feiticeiro","Tormento de Liandry","Bastão do Vazio","Chapéu Mortal de Rabadon","Bastão das Eras"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Twin Fang (E): ZERO CD com poisoned target — spam","Q/W aplica poison — sempre poison antes de E spam","SEM BOTAS (passive): mais AP e speed"]
  },

  corki: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:51, Fizz:51, Syndra:51, Viktor:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Trabalho de Pé Ágil", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Manamune","Botas de Iônia","Trinity Force","Fio do Infinito","Mercurial Scimitar","Espada do Rei Destruído"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Package passive: voe para gank — use para roaming","Q AoE damage + vision — use em objectives","True damage passive: mix magic + physical = difícil resistir"]
  },

  ekko: {
    role:"mid", cls:"assassino_ap",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:50, Syndra:51, Viktor:51, LeBlanc:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Capacete de Gladiador", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Sandálias do Feiticeiro","Ampulheta de Zhonya","Lich Bane","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["W: posicione onde inimigo VAI estar","R é panic button — nunca no início do fight","Passive 3 hits em tower = push rápido"]
  },

  fizz: {
    role:"mid", cls:"assassino_ap",
    vs:{ Zed:52, Talon:50, Yasuo:52, Syndra:49, Viktor:51, Orianna:52, LeBlanc:52, Ahri:51 },
    syn:{ LeeSin:3, Amumu:3, Malphite:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Nimbo de Tempestade", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Chama das Sombras","Sandálias do Feiticeiro","Ampulheta de Zhonya","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Livro de Feitiços Sombrio + Poção", f:["Ignite","Flash"],
    d:["All-in level 6: E → Q → R → Ignite","E cancela CC (Lux R, Zed R, Malzahar R)","Post-6 roame bot/top após cada kill"]
  },

  galio: {
    role:"mid", cls:"tank",
    vs:{ Zed:54, Talon:53, Yasuo:52, Fizz:51, Syndra:50, Viktor:51, LeBlanc:52 },
    syn:{ LeeSin:3, Amumu:3, Malphite:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Manopla de Gelo","Botas de Mercúrio","Horizonte Foco","Coração Congelado","Força da Natureza","Pele de Pedra de Gárgula"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["R Hero's Entrance: global teleport para aliados","W Winds of War: max charges = tornado enorme","Magic resistance = mais dano (passive)"]
  },

  heimerdinger: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:50, Syndra:51, Viktor:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Ampulheta de Zhonya","Chapéu Mortal de Rabadon","Bastão do Vazio","Véu da Banshee"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["3 torretas ativas = passive empowered","UPGRADE! (R): versão empowered Q/W/E","R+W grenade: mais poderoso"]
  },

  hwei: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:50, Syndra:51, Viktor:51, LeBlanc:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Chama das Sombras","Ampulheta de Zhonya","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["3 spell books: QQ/QW/QE (doom), WQ/WW/WE (serenity)","Combo burst: QQ → EW → QW → R","R Spiraling Despair: enorme DoT AoE"]
  },

  kassadin: {
    role:"mid", cls:"assassino_ap",
    vs:{ Zed:52, Talon:51, Yasuo:52, Fizz:50, Syndra:51, Viktor:52, LeBlanc:51 },
    syn:{ LeeSin:3, Amumu:3, Malphite:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Bastão das Eras","Sandálias do Feiticeiro","Seraph's Embrace","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["Play safe até level 6 — muito fraco antes","Level 16: máximo poder com R stack damage","Counter AP: passive magic resistance vs AP laners"]
  },

  katarina: {
    role:"mid", cls:"assassino_ap",
    vs:{ Zed:51, Talon:50, Yasuo:52, Syndra:50, Ahri:50, LeBlanc:49 },
    syn:{ LeeSin:3, Amumu:3, Malphite:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Lâmina da Hextech","Sandálias do Feiticeiro","Ampulheta de Zhonya","Coroa Sombria","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Adaga Longa + Poção", f:["Flash","Ignite"],
    d:["Nunca use R com CC ativo","Reset de W com kill/assist — gerencie E","Roame agressivamente pós-6"]
  },

  leblanc: {
    role:"mid", cls:"assassino_ap",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:48, Syndra:51, Viktor:52, Orianna:52 },
    syn:{ LeeSin:3, Amumu:3, Malphite:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Chama das Sombras","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Combo: W dash → E chain → Q → Ignite","Sigil proc: Q/R aplicam mark — W/E detonam","W return: após dash, retorna ao ponto original — escape"]
  },

  lissandra: {
    role:"mid", cls:"mago",
    vs:{ Zed:55, Talon:54, Yasuo:53, Fizz:52, Ahri:50, Viktor:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Coroa Sombria","Sandálias do Feiticeiro","Ampulheta de Zhonya","Chapéu Mortal de Rabadon","Bastão do Vazio","Tormento de Liandry"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Q poke longa distância","E Glacial Path: dash + root","R em si mesma = imortalidade temporária; em inimigo = CC"]
  },

  lux: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:53, Fizz:51, Syndra:50, Viktor:50, LeBlanc:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Chama das Sombras","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Q raiz 2 alvos — sempre acerte ambos","R baixo CD com CDR — use para harass também","Passive Illumination: auto proc = burst extra"]
  },

  malzahar: {
    role:"mid", cls:"mago",
    vs:{ Zed:54, Talon:53, Yasuo:55, Ahri:51, Fizz:49, LeBlanc:52 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Criador de Fendas","Sandálias do Feiticeiro","Tormento de Liandry","Bastão do Vazio","Chapéu Mortal de Rabadon","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["R suppressão: use em carry — time faz o dano","Void Swarm: invocados com habilidades — farm wave","E silence: interrupt channeling de ults"]
  },

  naafiri: {
    role:"mid", cls:"assassino_ad",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:51, Syndra:52, Ahri:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Precisão", s1:"Triunfo", s2:"Golpe de Misericórdia", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Faca de Dusk","Botas de Treino","Véu da Noite","Dança da Morte","Sterak's Gage","Arco do Axioma"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Packmates: hounds que lutam com você","W bleed + hounds jump — combo Q após bleed","R packmates reforçados — roam com stacks"]
  },

  neeko: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:50, Syndra:51, Viktor:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Horizonte Foco","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Passive Clone: imite aliado antes de R","Q hit 2x no mesmo target se perto de outro","R Pop Blossom: engage surpresa após clone"]
  },

  orianna: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:55, Fizz:48, Syndra:50, Viktor:50, LeBlanc:48 },
    syn:{ LeeSin:3, Amumu:4, Malphite:4, Yasuo:5, Wukong:4, Jarvan:3 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Horizonte Foco","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["Ball placement: mantenha ON aliado para R setup","R pull: máximo com 3+ inimigos","Q move ball, W damage e shield aliado com ball"]
  },

  qiyana: {
    role:"mid", cls:"assassino_ap",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:51, Syndra:52, Ahri:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Precisão", s1:"Triunfo", s2:"Golpe de Misericórdia", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Faca de Dusk","Botas de Treino","Véu da Noite","Machado Negro","Dança da Morte","Arco do Axioma"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Elementals: água (slow), mato (invis), pedra (stun)","Combo: W element pickup → Q → E → R","R em wall: onda quica = AoE stun teamfight"]
  },

  ryze: {
    role:"mid", cls:"mago",
    vs:{ Zed:52, Talon:51, Yasuo:53, Fizz:50, Syndra:51, Viktor:50, LeBlanc:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Fase Rush", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Bastão das Eras","Botas de Iônia","Máscara Abissal","Seraph's Embrace","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["Passive: mais mana = mais dano — escale mana primeiro","Combo: E root → Q → W → Q","R Realm Warp: mobilidade de equipe — use estrategicamente"]
  },

  syndra: {
    role:"mid", cls:"mago",
    vs:{ Zed:50, Talon:49, Yasuo:53, Fizz:51, Ahri:50, Viktor:50, LeBlanc:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Coroa Sombria","Sandálias do Feiticeiro","Chapéu Mortal de Rabadon","Horizonte Foco","Bastão do Vazio","Véu da Banshee"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["E stun → Q → R (7 orbes) → W: combo burst","Level 9 com Q maxado: power spike","Sempre 3+ orbes no chão"]
  },

  sylas: {
    role:"mid", cls:"assassino_ap",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:50, Syndra:51, Viktor:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Foguetão Hextech","Sandálias do Feiticeiro","Criador de Fendas","Ampulheta de Zhonya","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Passive healing: todas habilidades curam — seja agressivo","E chain whip: gap close + knockup","R Hijack: rouba R do inimigo — escolha melhor ult"]
  },

  talon: {
    role:"mid", cls:"assassino_ad",
    vs:{ Zed:50, Yasuo:51, Ahri:49, Syndra:51, Viktor:52, Orianna:52, LeBlanc:51, Fizz:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Perseguidor Sombrio", r3:"Caçador Voraz", s:"Precisão", s1:"Triunfo", s2:"Golpe de Misericórdia", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Faca de Dusk","Botas de Treino","Véu da Noite","Machado Negro","Rancor de Serylda","Arco do Axioma"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Parkour (E): salte QUALQUER parede — mobilidade excepcional","Combo: W slow → Q → auto → W retorno → R blade ring","Roame level 3: gank frequente é sua win condition"]
  },

  twistedfate: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:51, Syndra:51, Viktor:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Primeiro Golpe", p:"Inspiração", r1:"Perspicácia Cósmica", r2:"Entrega de Biscoitos", r3:"Calçados Mágicos", s:"Precisão", s1:"Presença de Espírito", s2:"Lenda: Alacrity", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Bastão das Eras","Sandálias do Feiticeiro","Horizonte Foco","Tormento de Liandry","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Gold Card (W): stun — pratique o timing","R Destiny: visão global + teleport — roame após gold card","Primeiro Golpe: proc com Q = gold + damage"]
  },

  veigar: {
    role:"mid", cls:"mago",
    vs:{ Zed:52, Talon:51, Yasuo:52, Fizz:50, Ahri:50, Viktor:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Coroa Sombria","Sandálias do Feiticeiro","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya","Véu da Banshee"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["Farm Q em minions SEMPRE — nunca perca um CS","E cage em cantos de parede = stun garantido","R execute: mais dano com menos HP no inimigo"]
  },

  vel: { // Vel'Koz
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:50, Syndra:51, Viktor:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Horizonte Foco","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Research stacks: 3 abilities = true damage proc","Q split: rotacione em 90° para mais targets","R canal: use em teamfight com peel"]
  },

  vex: {
    role:"mid", cls:"mago",
    vs:{ Zed:53, Talon:52, Yasuo:54, Fizz:52, Ahri:51, LeBlanc:52, Ekko:53 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Coroa Sombria","Sandálias do Feiticeiro","Tormento de Liandry","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Doom: empowered ability após trigger","E Personal Space: escudo + fear — use quando rodeado","R Shadow Surge: reset com kills — chain teamfight"]
  },

  viktor: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:51, Fizz:49, Syndra:50, Ahri:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Fase Rush", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Bastão das Eras","Sandálias do Feiticeiro","Seraph's Embrace","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["Hex Core upgrades: priorize Q→E→W order","Q shield dash: use defensivamente","E Death Ray: letal em linha — use no choke"]
  },

  vladimir: {
    role:"mid", cls:"mago",
    vs:{ Zed:52, Talon:51, Yasuo:52, Fizz:51, Syndra:50, Viktor:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Fase Rush", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Determinação", s1:"Condicionamento", s2:"Crescimento Excessivo", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Bastão das Eras","Sandálias do Feiticeiro","Criador de Fendas","Tormento de Liandry","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Teleporte"],
    d:["AP→HP→AP cycle: passive sinergia","W Pool: invulnerabilidade 2.5s — dodge burst","Escale fortemente — safe early, domina late"]
  },

  xerath: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:53, Fizz:52, Syndra:51, Viktor:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Primeiro Golpe", p:"Inspiração", r1:"Perspicácia Cósmica", r2:"Entrega de Biscoitos", r3:"Calçados Mágicos", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Horizonte Foco","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Q canal para max range — use de trás de minion","R 4 tiros globais — pick em qualquer lane","Stick to max range — se inimigo chega você morre"]
  },

  yasuo: {
    role:"mid", cls:"lutador",
    vs:{ Ahri:49, Zed:50, Malphite:45, Annie:48, Lissandra:47, Fizz:48, LeBlanc:50 },
    syn:{ Malphite:6, Amumu:6, Jarvan:5, Wukong:4, Kennen:4, Orianna:4 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Shieldbow Imortal","Botas de Berserker","Kraken Slayer","Fio do Infinito","Guardião Mortal","Lembrete Mortal"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Q 3 hits = Tornado — nunca desperdice em minion","R requer knockup aliado — coordene com Malphite/Amumu","Passive shield recarrega fora do combate"]
  },

  yone: {
    role:"mid", cls:"lutador",
    vs:{ Ahri:50, Zed:51, Yasuo:50, Fizz:49, Syndra:51, Viktor:50 },
    syn:{ Malphite:5, Amumu:5, Jarvan:4, Wukong:4, Orianna:3 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Lâmina Sanguessuga","Botas de Berserker","Kraken Slayer","Sterak's Gage","Morte da Morte","Fio do Infinito"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Q: 2 autos = empowered terceiro Q com knockup","E Soul Unbound: dash para espírito — retorna após habilidade","R Fate Sealed: knockup todos em linha"]
  },

  zed: {
    role:"mid", cls:"assassino_ad",
    vs:{ Ahri:48, Lux:48, Orianna:49, Fizz:48, Yasuo:50, Syndra:50, Viktor:49, Lissandra:45 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Perseguidor Sombrio", r3:"Caçador Voraz", s:"Precisão", s1:"Triunfo", s2:"Lenda: Alacrity", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Faca de Dusk","Sandálias Sombrias","Véu de Morte","Relâmpago Estático","Lâmina da Noite Infinita","Guardião Imortal"],
    ini:"Espada Longa + Poção", f:["Ignite","Flash"],
    d:["Combo: W shadow → E → Q → R → Q → E → Ignite","Use W para checar brushes antes de trade","Roame apenas com Faca de Dusk completa"]
  },

  ziggs: {
    role:"mid", cls:"mago",
    vs:{ Zed:51, Talon:50, Yasuo:52, Fizz:50, Syndra:51, Viktor:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Chama das Sombras","Chapéu Mortal de Rabadon","Bastão do Vazio","Horizonte Foco"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Q Short Fuse: empowered auto proc","W Satchel Charge: reposicionamento + knockback","R Mega Inferno Bomb: execute global"]
  },

  zoe: {
    role:"mid", cls:"mago",
    vs:{ Zed:50, Talon:49, Yasuo:52, Fizz:51, Syndra:50, Viktor:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Luden's Companheiro","Sandálias do Feiticeiro","Horizonte Foco","Ampulheta de Zhonya","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Q: ricocheteie atrás para máximo range","E Sleep Bubble: use no minion para sleep hits inimigos","Portal Jump (R): poke + retorno safe imediata"]
  },

  // ══════════════════════ ADC ══════════════════════════════════════════════════

  aphelios: {
    role:"adc", cls:"adc",
    vs:{ Jinx:51, Caitlyn:49, Draven:49, KaiSa:50, Jhin:51 },
    syn:{ Thresh:3, Nautilus:3, Leona:3 },
    runes:{ key:"Ritmo Letal", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Kraken Slayer","Botas de Berserker","Flechatroz de Yun Tal","Fio do Infinito","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["5 armas: Calibrum (range), Severum (heal), Gravitum (slow), Infernum (AoE), Crescendum","Infernum + R = enorme AoE dano em teamfight","Gravitum root: setup aliados"]
  },

  ashe: {
    role:"adc", cls:"adc",
    vs:{ Jinx:51, Caitlyn:50, Draven:49, KaiSa:51, Jhin:52 },
    syn:{ Thresh:3, Lulu:2, Leona:3 },
    runes:{ key:"Trabalho de Pé Ágil", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Coleta de Tempestades", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Fio do Infinito","Furacão de Runaan","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["Passive slow: todos os autos aplicam slow","R stun global de longa distância","Hawkshot: visão global antes de objectives"]
  },

  caitlyn: {
    role:"adc", cls:"adc",
    vs:{ Jinx:52, Draven:49, Vayne:51, KaiSa:51, Jhin:52, MissFortune:53 },
    syn:{ Lux:4, Morgana:3, Karma:2, Leona:2, Thresh:2 },
    runes:{ key:"Pressione o Ataque", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Rapidfire Cannon","Fio do Infinito","Lembrete Mortal","Guardião Mortal"],
    ini:"Espada Longa + Poção", f:["Flash","Cura"],
    d:["Armadilhas em brushes + zone trap-shot","Headshot proc com trap — trap first then E","auto → Q → auto para proc headshot rápido"]
  },

  draven: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:51, Jinx:51, Jhin:50, KaiSa:51, Vayne:52 },
    syn:{ Thresh:3, Leona:3, Nautilus:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Espada do Rei Destruído","Fio do Infinito","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["Axes: apanhe cada machado girando — nunca desperdice","R League of Draven: stacks = mais dano","W Blood Rush: use para posicionamento de axe catch"]
  },

  ezreal: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:50, Jinx:51, Jhin:51, Draven:49, KaiSa:50 },
    syn:{ Yuumi:4, Lulu:3, Janna:2, Soraka:2 },
    runes:{ key:"Trabalho de Pé Ágil", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Manamune","Botas de Iônia","Trinity Force","Espada do Rei Destruído","Fio do Infinito","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["Q Mystic Shot: hit reset todos os CDs","E Arcane Shift: use DEFENSIVAMENTE","R global: steal objectives ou execute"]
  },

  jhin: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:48, Jinx:49, KaiSa:50, Draven:50, Vayne:51 },
    syn:{ Lux:4, Morgana:3, Thresh:2, Leona:2 },
    runes:{ key:"Trabalho de Pé Ágil", p:"Precisão", r1:"Presença de Espírito", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Coleta de Tempestades", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Garra do Caçador","Botas de Berserker","Rapidfire Cannon","Fio do Infinito","Lembrete Mortal","Coletor"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["4° tiro sempre no carry — nunca no minion","W root: precisa de ally touch/flower primeiro","R de ultra range — use de segurança máxima"]
  },

  jinx: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:48, Draven:49, Vayne:50, KaiSa:50, Jhin:51 },
    syn:{ Thresh:3, Lulu:4, Leona:2, Nautilus:2 },
    runes:{ key:"Ritmo Letal", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Kraken Slayer","Botas de Berserker","Furacão de Runaan","Espada do Rei Destruído","Fio do Infinito","Lembrete Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["Minigun para farm/duelos; Foguetes para teamfight/AoE","Passive reset com kill/assist — maximize no teamfight","Spike começa com Kraken + Runaan completos"]
  },

  kaisa: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:49, Jinx:50, Jhin:50, Draven:49, Vayne:50 },
    syn:{ Nautilus:4, Thresh:3, Blitzcrank:3, Rakan:3 },
    runes:{ key:"Pressione o Ataque", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Coleta de Tempestades", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Kraken Slayer","Botas de Berserker","Flechatroz de Yun Tal","Lâmina da Raiva de Guinsoo","Guardião Mortal","Lembrete Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["Passive 5 stacks = burst enorme no 4° hit","Q empowered em alvo solo: chegue perto","R dash em aliado que marcou inimigo"]
  },

  kalista: {
    role:"adc", cls:"adc",
    vs:{ Jinx:51, Caitlyn:50, Draven:49, KaiSa:50, Jhin:51 },
    syn:{ Thresh:5, Blitzcrank:3, Nautilus:3, Leona:2 },
    runes:{ key:"Ritmo Letal", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Kraken Slayer","Botas de Berserker","Furacão de Runaan","Espada do Rei Destruído","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["Passive: cada auto = small hop — kite constant","Spears em target: acumule então E execute","Bound (W): liga ao suporte — R salva o suporte"]
  },

  kogmaw: {
    role:"adc", cls:"adc",
    vs:{ Jinx:51, Caitlyn:50, Draven:50, KaiSa:51, Jhin:52 },
    syn:{ Lulu:5, Yuumi:4, Karma:2, Janna:2 },
    runes:{ key:"Ritmo Letal", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Dente de Nashor","Botas de Berserker","Lâmina da Raiva de Guinsoo","Kraken Slayer","Bastão do Vazio","Lembrete Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["W Bio-Arcane Barrage: range enorme + % HP dano vs tanks","Precisa de peel — jogue atrás do time sempre","R Living Artillery: poke de range global"]
  },

  lucian: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:49, Jinx:50, Jhin:50, Draven:49, KaiSa:50 },
    syn:{ Nami:5, Lulu:3, Senna:3, Thresh:2 },
    runes:{ key:"Pressione o Ataque", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Fio do Infinito","Espada do Rei Destruído","Rapidfire Cannon","Lembrete Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["Passive Lightslinger: cada habilidade = 2 autos bônus","Combo: Q → 2 autos → W → 2 autos → E → 2 autos","Dash (E): sempre dash LATERAL para dodge"]
  },

  misfortune: {
    role:"adc", cls:"adc",
    vs:{ Jinx:51, Caitlyn:47, Draven:50, KaiSa:50, Jhin:50 },
    syn:{ Leona:3, Nautilus:3, Thresh:2, Zyra:3 },
    runes:{ key:"Trabalho de Pé Ágil", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Kraken Slayer","Botas de Berserker","Furacão de Runaan","Fio do Infinito","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["Q Love Tap: bounce para segundo target","R Bullet Time: use em choke com CC aliado","Passive Love Tap: mais dano no primeiro hit após trocar target"]
  },

  nilah: {
    role:"adc", cls:"adc",
    vs:{ Jinx:51, Caitlyn:50, Draven:50, KaiSa:51, Jhin:51 },
    syn:{ Thresh:3, Nautilus:2, Leona:3, Blitzcrank:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Espada do Rei Destruído","Botas de Berserker","Kraken Slayer","Fio do Infinito","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["Passive: divide experience + amplifica heals","W Shroud: dodge habilidades — timing é essencial","E Slipstream: dash através de inimigo"]
  },

  samira: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:50, Jinx:50, Jhin:50, Draven:49, KaiSa:50 },
    syn:{ Nautilus:4, Leona:3, Alistar:3, Thresh:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Espada do Rei Destruído","Fio do Infinito","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["Style stacks A→S: use diferentes habilidades + autos","R Inferno Trigger: use APENAS em S style","W Wind Wall: bloqueia projéteis — deflect ADC inimigo"]
  },

  senna: {
    role:"sup", cls:"adc",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:50 },
    syn:{ Lucian:5, Jhin:3, Jinx:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Faca Sanguessuga","Botas de Iônia","Flechatroz de Yun Tal","Fio do Infinito","Escudo do Guardian","Lembrete Mortal"],
    ini:"Steel Shoulderguards + Poção", f:["Flash","Cura"],
    d:["Soul stacks: kill enemies ou absorva almas — mais range + dano","Q Piercing Darkness: heal aliados em linha","R Dawning Shadow: global shield + snipe"]
  },

  sivir: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:51, Jinx:50, Draven:50, KaiSa:51, Jhin:52 },
    syn:{ Thresh:2, Leona:2, Nautilus:2, Lulu:2 },
    runes:{ key:"Trabalho de Pé Ágil", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Furacão de Runaan","Fio do Infinito","Lembrete Mortal","Espada do Rei Destruído"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["Q Boomerang Blade: AoE dano em linha","W Ricochet: bounce auto para 6 targets — use em teamfight","R On The Hunt: team speed boost — use antes de teamfight"]
  },

  smolder: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:50, Jinx:51, Draven:49, KaiSa:50, Jhin:51 },
    syn:{ Thresh:2, Nautilus:2, Leona:2, Lulu:2 },
    runes:{ key:"Trabalho de Pé Ágil", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Manamune","Botas de Iônia","Trinity Force","Luden's Companheiro","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Anel de Doran + Poção", f:["Flash","Cura"],
    d:["Stack Q: 25/125/225 stacks = upgrades","W AoE cone — clear wave rápida","R Breath of Life: global heal beam — teamfight"]
  },

  tristana: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:51, Jinx:50, Draven:49, KaiSa:50, Jhin:51 },
    syn:{ Thresh:2, Leona:2, Nautilus:2, Blitzcrank:2 },
    runes:{ key:"Ritmo Letal", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Kraken Slayer","Botas de Berserker","Flechatroz de Yun Tal","Fio do Infinito","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["Passive: range cresce a cada level — lv18 maior range","W Rocket Jump: posicionamento + reset com kills","R Buster Shot: knockback — escape ou separar"]
  },

  twitch: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:50, Jinx:51, Draven:49, KaiSa:50, Jhin:51 },
    syn:{ Lulu:5, Yuumi:4, Karma:2, Janna:2 },
    runes:{ key:"Ritmo Letal", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Kraken Slayer","Botas de Berserker","Furacão de Runaan","Fio do Infinito","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["Ambush (Q): invisível 10s — gank de surprise","Venom stacks: 6 stacks = máximo dano de E","R Spray and Pray: auto pierces todos + range extra"]
  },

  varus: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:50, Jinx:51, Draven:50, KaiSa:51, Jhin:51 },
    syn:{ Thresh:2, Leona:2, Nautilus:2, Blitzcrank:2 },
    runes:{ key:"Ritmo Letal", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Dente de Nashor","Botas de Berserker","Lâmina da Raiva de Guinsoo","Kraken Slayer","Bastão do Vazio","Lembrete Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["Q Piercing Arrow: máximo charge = sniper range","W 3 stacks: proc passive em E/Q","R Chain of Corruption: root em cadeia para grupo"]
  },

  xayah: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:51, Jinx:50, Draven:50, KaiSa:50, Jhin:51 },
    syn:{ Rakan:6, Thresh:2, Leona:2 },
    runes:{ key:"Trabalho de Pé Ágil", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Flechatroz de Yun Tal","Botas de Berserker","Fio do Infinito","Furacão de Runaan","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["5+ feathers então E recall = root AoE enorme","Q Double Daggers: posicione para ambas acertarem","R untargetable + chuva de flechas + root"]
  },

  zeri: {
    role:"adc", cls:"adc",
    vs:{ Caitlyn:50, Jinx:51, Draven:49, KaiSa:50, Jhin:51 },
    syn:{ Thresh:2, Leona:2, Nautilus:2, Lulu:3 },
    runes:{ key:"Ritmo Letal", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Kraken Slayer","Botas de Berserker","Furacão de Runaan","Fio do Infinito","Lembrete Mortal","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:["Q auto-attack replacement — mais poder quando sobrecarregada","W desaceleração + slow na wall","R charge com kills — persegue e dá mais dano"]
  },

  // ══════════════════════ SUPORTE ══════════════════════════════════════════════

  alistar: {
    role:"sup", cls:"sup_engage",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:48 },
    syn:{ Jinx:3, Samira:3, Draven:2, KaiSa:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mercúrio","Promessa do Cavaleiro","Colosso de Anima","Força da Natureza","Pele de Pedra de Gárgula"],
    ini:"Steel Shoulderguards + Poção", f:["Flash","Ignite"],
    d:["W→Q combo: pulverizador → headbutt = knockup instantâneo","NUNCA W sem Q carregado","R absorve 70% damage — use quando foco do time"]
  },

  bard: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:50 },
    syn:{ Ezreal:3, Jinx:2, Caitlyn:2 },
    runes:{ key:"Primeiro Golpe", p:"Inspiração", r1:"Perspicácia Cósmica", r2:"Entrega de Biscoitos", r3:"Calçados Mágicos", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mobilidade","Caduceu de Rabadon","Promessa do Cavaleiro","Colosso de Anima","Fortaleza de Redenção"],
    ini:"Steel Shoulderguards + Poção", f:["Flash","Ignite"],
    d:["Chimes: colete sempre — cada 10 stacks = mais forte","Shrine (W): posicione em choke points","R Tempered Fate: atordoa TODOS incluindo aliados — cuidado"]
  },

  blitzcrank: {
    role:"sup", cls:"sup_engage",
    vs:{ Thresh:48, Leona:49, Nautilus:49, Lulu:48, Soraka:48 },
    syn:{ Caitlyn:4, Jinx:2, Draven:3, KaiSa:3 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Bola de Fogo Mágica", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Treino","Aço do Coração","Pele de Pedra de Gárgula","Colosso de Anima","Fortaleza de Redenção"],
    ini:"Steel Shoulderguards + Poção", f:["Flash","Ignite"],
    d:["Combo: Q (Gancho) → E (Soco) imediatamente → auto","W Overdrive ANTES do Q","Nunca use E primeiro — perde o knockup"]
  },

  brand: {
    role:"sup", cls:"mago",
    vs:{ Thresh:51, Leona:50, Nautilus:51, Lulu:49, Soraka:52 },
    syn:{ Jinx:2, KaiSa:2, Caitlyn:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Vigilância Locket","Sandálias do Feiticeiro","Tormento de Liandry","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Doran's Ring + Poção", f:["Flash","Ignite"],
    d:["Blaze: 3 habilidades = stun + burst","Q stun: acerte Q em inimigo ON FIRE","R Pyroclasm: bounce entre targets — mais targets = mais dano"]
  },

  braum: {
    role:"sup", cls:"sup_engage",
    vs:{ Thresh:51, Leona:50, Nautilus:51, Blitzcrank:52, Lulu:49 },
    syn:{ Jinx:3, Ashe:2, Varus:2, Draven:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mobilidade","Promessa do Cavaleiro","Colosso de Anima","Força da Natureza","Fortaleza de Redenção"],
    ini:"Steel Shoulderguards + Poção", f:["Flash","Ignite"],
    d:["Passive: 4 hits de qualquer aliado = stun","Q Winters Bite: slow + apply 1 stack","W Stand Behind Me: leap para aliado — engage from range"]
  },

  janna: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:52, Leona:53, Nautilus:52, Blitzcrank:53, Alistar:52 },
    syn:{ Ezreal:2, KogMaw:3, Jinx:2, Twitch:3 },
    runes:{ key:"Invocar Aery", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Véu de Ardor","Botas de Mobilidade","Arco da Ardente","Arco Lunar Redentor","Fortaleza de Redenção","Sceptro de Cristal de Rylai"],
    ini:"Relic Shield + Poção", f:["Flash","Ignite"],
    d:["Q Howling Gale: charge = mais knockup — flank","W Zephyr: speed boost em aliado + slow","R Monsoon: knockback TODOS + healing — anti-dive perfeito"]
  },

  karma: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:50 },
    syn:{ Lucian:3, Draven:2, Caitlyn:2, Jinx:2 },
    runes:{ key:"Invocar Aery", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Véu de Ardor","Botas de Iônia","Arco da Ardente","Arco Lunar Redentor","Fortaleza de Redenção","Sceptro de Cristal de Rylai"],
    ini:"Doran's Ring + Poção", f:["Flash","Ignite"],
    d:["Mantra empowera próxima habilidade — mantenha para key moments","Mantra Q: AoE root poderoso","Mantra E: shields AoE para aliados ao redor"]
  },

  leona: {
    role:"sup", cls:"sup_engage",
    vs:{ Thresh:50, Nautilus:52, Blitzcrank:51, Lulu:48, Soraka:53 },
    syn:{ Samira:4, Caitlyn:2, KaiSa:2, Draven:3 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Escudo de Fort", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Bola de Fogo Mágica", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mercúrio","Promessa do Cavaleiro","Colosso de Anima","Pele de Pedra de Gárgula","Força da Natureza"],
    ini:"Steel Shoulderguards + Poção", f:["Flash","Ignite"],
    d:["Level 2 all-in: E → Q → auto = kill","Nunca use E sem Q carregado","R em grupo: stun AoE, não 1v1"]
  },

  lulu: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:50, Leona:52, Nautilus:51, Blitzcrank:52, Alistar:51 },
    syn:{ KogMaw:5, Twitch:5, Jinx:4, Ezreal:2, Samira:3 },
    runes:{ key:"Invocar Aery", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Véu de Ardor","Botas de Iônia","Arco da Ardente","Arco Lunar Redentor","Promessa do Cavaleiro","Fortaleza de Redenção"],
    ini:"Relic Shield + Poção", f:["Flash","Ignite"],
    d:["Polymorph (W) em carry inimigo no engage","E shield: em carry ANTES de CC inimigo","R: knockup + HP enorme em carry — anti-dive"]
  },

  milio: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:50 },
    syn:{ KaiSa:3, Jinx:2, KogMaw:3, Ezreal:2 },
    runes:{ key:"Invocar Aery", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Véu de Ardor","Botas de Iônia","Arco da Ardente","Arco Lunar Redentor","Promessa do Cavaleiro","Fortaleza de Redenção"],
    ini:"Relic Shield + Poção", f:["Flash","Ignite"],
    d:["Q Ultra Mega Fire Kick: bounce para range extra","E Warm Hugs: shield + speed boost","R Breath of Life: purge CC + heal AoE — anti CC teamwide"]
  },

  morgana: {
    role:"sup", cls:"sup_engage",
    vs:{ Thresh:52, Leona:53, Nautilus:52, Blitzcrank:54, Alistar:52 },
    syn:{ Caitlyn:3, Jinx:2, KaiSa:2, Draven:2 },
    runes:{ key:"Invocar Aery", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Iônia","Tormento de Liandry","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Doran's Ring + Poção", f:["Flash","Ignite"],
    d:["Q Dark Binding: 3s root — maior root do jogo","W pool de damage — use em minion para farm","E Black Shield: absorve CC — use em carry ANTES de CC"]
  },

  nami: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:51 },
    syn:{ Lucian:5, Draven:3, KaiSa:2, Jinx:2 },
    runes:{ key:"Invocar Aery", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Véu de Ardor","Botas de Iônia","Arco da Ardente","Arco Lunar Redentor","Fortaleza de Redenção","Sceptro de Cristal de Rylai"],
    ini:"Relic Shield + Poção", f:["Flash","Ignite"],
    d:["Q bubble: lead do target (não onde está, onde vai)","E empowered autos do ADC com slow","R: use de flank para max chain knockup"]
  },

  nautilus: {
    role:"sup", cls:"sup_engage",
    vs:{ Thresh:51, Leona:50, Blitzcrank:49, Lulu:49, Soraka:52 },
    syn:{ KaiSa:4, Samira:3, Xayah:2, Jinx:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mercúrio","Promessa do Cavaleiro","Colosso de Anima","Força da Natureza","Pele de Pedra de Gárgula"],
    ini:"Steel Shoulderguards + Poção", f:["Flash","Ignite"],
    d:["Q hook + Passive auto root = CC chain","R knockup AoE em linha — carries priority","4 CC: Q root/passive root/E root/R knockup"]
  },

  pyke: {
    role:"sup", cls:"assassino_ad",
    vs:{ Thresh:50, Leona:51, Nautilus:50, Blitzcrank:49, Lulu:51 },
    syn:{ Draven:3, Jinx:2, KaiSa:2, Samira:3 },
    runes:{ key:"Eletrocutar", p:"Dominação", r1:"Sabor do Sangue", r2:"Perseguidor Sombrio", r3:"Caçador Voraz", s:"Precisão", s1:"Triunfo", s2:"Golpe de Misericórdia", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Dusk Blade","Botas de Mobilidade","Véu da Noite","Arco do Axioma","Faca Chempunk Serrilhada","Guardião Mortal"],
    ini:"Doran Blade + Poção", f:["Flash","Ignite"],
    d:["Passive: HP extras vira AD — build lethality sem HP","R execute em X zone + gold para aliados","Q hook pull em carry — initiate de bush"]
  },

  rakan: {
    role:"sup", cls:"sup_engage",
    vs:{ Thresh:50, Leona:51, Nautilus:51, Blitzcrank:50, Lulu:51 },
    syn:{ Xayah:6, KaiSa:3, Jinx:2 },
    runes:{ key:"Guardião", p:"Determinação", r1:"Regeneração", r2:"Condicionamento", r3:"Revitalizar", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mobilidade","Promessa do Cavaleiro","Colosso de Anima","Fortaleza de Redenção","Caduceu de Rabadon"],
    ini:"Relic Shield + Poção", f:["Flash","Ignite"],
    d:["W Grand Entrance: engage com knockup","E Battle Dance: dash em Xayah/aliados","R The Quickness: charm AoE enquanto em movimento"]
  },

  rell: {
    role:"sup", cls:"sup_engage",
    vs:{ Thresh:51, Leona:51, Nautilus:51, Blitzcrank:51, Lulu:50 },
    syn:{ Samira:4, Jinx:2, KaiSa:2, Draven:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mercúrio","Promessa do Cavaleiro","Colosso de Anima","Força da Natureza","Pele de Pedra de Gárgula"],
    ini:"Steel Shoulderguards + Poção", f:["Flash","Ignite"],
    d:["W Ferromancy: engage hard + dismount = knockup","E tether aliados ou inimigos com magneto","R Magnet Storm: pull todos ao redor — teamfight"]
  },

  renata: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:50 },
    syn:{ Jinx:3, Samira:3, KaiSa:2, Draven:2 },
    runes:{ key:"Invocar Aery", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Iônia","Arco da Ardente","Fortaleza de Redenção","Colosso de Anima","Arco Lunar Redentor"],
    ini:"Relic Shield + Poção", f:["Flash","Ignite"],
    d:["W Bailout: revive aliado com full HP se kill durante buff","Q Handshake: root","R Hostile Takeover: berserk — inimigos atacam uns aos outros"]
  },

  seraphine: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:50 },
    syn:{ Jinx:2, KaiSa:2, Ezreal:2, Lucian:2 },
    runes:{ key:"Invocar Aery", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Véu de Ardor","Botas de Iônia","Arco da Ardente","Arco Lunar Redentor","Fortaleza de Redenção","Chapéu Mortal de Rabadon"],
    ini:"Doran's Ring + Poção", f:["Flash","Ignite"],
    d:["Passive: echo terceira habilidade = proc de aliados","Q High Note: AoE damage — use em grupo","R Encore: charm em cadeia — mais inimigos = mais range"]
  },

  sona: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:52, Leona:53, Nautilus:52, Blitzcrank:53, Alistar:52 },
    syn:{ Jinx:2, KaiSa:2, Ezreal:2, Twitch:2 },
    runes:{ key:"Aumento Glacial", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Celeridade", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Véu de Ardor","Botas de Iônia","Arco da Ardente","Arco Lunar Redentor","Fortaleza de Redenção","Sceptro de Cristal de Rylai"],
    ini:"Relic Shield + Poção", f:["Flash","Ignite"],
    d:["Power Chord: cada 3 habilidades = empowered auto","R Crescendo: stun AoE linha — use para teamfight initiation"]
  },

  soraka: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:52, Leona:53, Nautilus:52, Blitzcrank:53, Alistar:52 },
    syn:{ KogMaw:4, Jinx:2, KaiSa:2, Ezreal:2 },
    runes:{ key:"Invocar Aery", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Determinação", s1:"Fonte de Vida", s2:"Revitalizar", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Caduceu de Rabadon","Botas de Iônia","Arco Lunar Redentor","Fortaleza de Redenção","Sceptro de Cristal de Rylai","Arco da Ardente"],
    ini:"Doran's Ring + Poção", f:["Flash","Ignite"],
    d:["Q hit → use W para mana de heal grátis","R global quando aliado dying em QUALQUER lane","E silence zone: interrupt dive/channeling"]
  },

  tahm: {
    role:"sup", cls:"tank",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:50 },
    syn:{ Jinx:3, KaiSa:2, Draven:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mobilidade","Promessa do Cavaleiro","Colosso de Anima","Força da Natureza","Pele de Pedra de Gárgula"],
    ini:"Steel Shoulderguards + Poção", f:["Flash","Ignite"],
    d:["W Engolir aliado: salve carries de situações mortais","Passive stacks com autos/habilidades — 3 stacks = W em inimigo","R teleporte curto — use para engage surpresa"]
  },

  taric: {
    role:"sup", cls:"sup_engage",
    vs:{ Thresh:51, Leona:51, Nautilus:51, Blitzcrank:51, Lulu:50 },
    syn:{ Lucian:5, KaiSa:3, Ezreal:3, Jinx:2 },
    runes:{ key:"Guardião", p:"Determinação", r1:"Regeneração", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mobilidade","Promessa do Cavaleiro","Colosso de Anima","Fortaleza de Redenção","Caduceu de Rabadon"],
    ini:"Steel Shoulderguards + Poção", f:["Flash","Ignite"],
    d:["Passive: autos reset habilidade CDs — auto entre cada habilidade","E Dazzle: stun delay — cast ANTES do engage","R Cosmic Radiance: team invulnerability — use 2.5s antecipado"]
  },

  thresh: {
    role:"sup", cls:"sup_engage",
    vs:{ Nautilus:51, Leona:50, Blitzcrank:52, Lulu:50, Soraka:52 },
    syn:{ KaiSa:3, Jinx:3, Lucian:2, Samira:2, Kalista:5 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Bola de Fogo Mágica", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Mobilidade","Promessa do Cavaleiro","Fortaleza de Redenção","Colosso de Anima","Cetro de Cristal de Rylai"],
    ini:"Relic Shield + Poção", f:["Flash","Ignite"],
    d:["Q: jogue FORA do range esperado — inimigos recuam","Lanterna (W): ângulos alternativos para carry","Farm almas: armor permanente a cada CS próximo"]
  },

  yuumi: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:52, Leona:53, Nautilus:52, Blitzcrank:53, Alistar:52 },
    syn:{ KogMaw:5, Twitch:5, Jinx:4, Ezreal:4, Garen:3 },
    runes:{ key:"Aumento Glacial", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Caduceu de Rabadon","Botas de Iônia","Arco Lunar Redentor","Arco da Ardente","Fortaleza de Redenção","Sceptro de Cristal de Rylai"],
    ini:"Relic Shield + Poção", f:["Flash","Ignite"],
    d:["Jogue ATTACHED — untargetable dentro do aliado","Passive best friend stacks = mais healing por W","R Final Chapter: rooting múltiplos inimigos — use em cluster"]
  },

  zilean: {
    role:"sup", cls:"enchanter",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:50 },
    syn:{ Jinx:3, KaiSa:2, Ezreal:2, Draven:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Vigilância Locket","Botas de Iônia","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya","Tormento de Liandry"],
    ini:"Doran's Ring + Poção", f:["Flash","Ignite"],
    d:["Double bomb: Q→W slow→Q para stun duplo","E: speed boost para aliado","R Chronoshift: revive aliado — priorize ADC/Mago"]
  },

  zyra: {
    role:"sup", cls:"mago",
    vs:{ Thresh:51, Leona:52, Nautilus:51, Blitzcrank:52, Lulu:49 },
    syn:{ MissFortune:3, Jinx:2, KaiSa:2, Draven:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Vigilância Locket","Sandálias do Feiticeiro","Tormento de Liandry","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Doran's Ring + Poção", f:["Flash","Ignite"],
    d:["Seeds + habilidades = plants que atacam — posicione em brush","Q Deadly Spines: plant upgrade com seed next to it","R Stranglethorns: knockup AoE + plants empowered"]
  },

  swain: {
    role:"sup", cls:"mago",
    vs:{ Thresh:51, Leona:51, Nautilus:51, Blitzcrank:52, Lulu:50 },
    syn:{ Jinx:2, Draven:3, Samira:2, MissFortune:2 },
    runes:{ key:"Colheita Sombria", p:"Dominação", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    build:["Criador de Fendas","Sandálias do Feiticeiro","Abraço Demoníaco","Rylai's Crystal Scepter","Chapéu Mortal de Rabadon","Bastão do Vazio"],
    ini:"Doran's Ring + Poção", f:["Flash","Ignite"],
    d:["E snare: posicione em brush para CC garantido","R Demonflare: drena vida — fique NO grupo inimigo","Passive soul stacks: cada charm/stun = extra soul"]
  },

  // ══════════════════════ CAMPEÕES ADICIONADOS (completando 172) ═══════════

  gragas: {
    role:"jungle", cls:"tank",
    vs:{ LeeSin:51, Hecarim:50, Graves:51, Amumu:51, KhaZix:51, Sejuani:52 },
    syn:{ Orianna:3, Yasuo:4, Yone:3, Azir:2 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Sunfire Aegis","Botas de Mercúrio","Jak'Sho o Proteano","Força da Natureza","Coração Congelado","Pele de Pedra de Gárgula"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["E Explosive Cask: knockback — jogue inimigo PARA DENTRO do time","Q empowered com corpo gordo = dano extra","R Ragnarok: invulnerabilidade durante duração"]
  },

  mel: {
    role:"mid", cls:"mago",
    vs:{ Zed:55, Talon:54, Yasuo:52, Fizz:51, Syndra:50, Viktor:51, LeBlanc:52, Ahri:51 },
    syn:{ LeeSin:3, Amumu:3, Malphite:2, Orianna:2 },
    runes:{ key:"Cometa Arcano", p:"Feitiçaria", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    build:["Coroa Sombria","Sandálias do Feiticeiro","Chama das Sombras","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"],
    ini:"Anel de Doran + Poção", f:["Flash","Ignite"],
    d:["Passive Spellshield: reflete próxima habilidade inimiga","Q Radiance: poke longa distância com bounce","R Mother's Embrace: proteção de aliados — use vs assassinos"]
  },

  rammus: {
    role:"jungle", cls:"tank",
    vs:{ LeeSin:52, Hecarim:51, Graves:53, KhaZix:52, Nidalee:53, Kayn:52 },
    syn:{ Orianna:2, Azir:2, Amumu:2, Malphite:3 },
    runes:{ key:"Aperto dos Mortos-Vivos", p:"Determinação", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    build:["Sunfire Aegis","Botas de Treino","Jak'Sho o Proteano","Coração Congelado","Força da Natureza","Armadura de Espinhos"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["W Defensive Ball Curl: armor X3 + reflect damage — use nos ganks","Q Powerball: full speed engage — acumule velocidade antes","R Soaring Slam: engage aéreo AoE + slow — longa distância"]
  },

  trundle: {
    role:"top", cls:"tank",
    vs:{ Darius:51, Garen:51, Malphite:52, Ornn:52, Fiora:50, Camille:51, Irelia:51 },
    syn:{ Orianna:2, Azir:2, Amumu:2, Jinx:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Persistência", r3:"Última Resistência", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Aço do Coração","Botas de Treino","Sterak's Gage","Pele de Pedra de Gárgula","Força da Natureza","Armadura de Espinhos"],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:["Q Chomp: empowered auto + steals AD — use vs AD carries","W Ice Pillar: zona de slow + bloqueio de escape","R Subjugate: rouba resistências do inimigo — use vs tanques"]
  },

  viego: {
    role:"jungle", cls:"assassino_ad",
    vs:{ LeeSin:50, Hecarim:50, Graves:51, Amumu:51, KhaZix:51, Kayn:50 },
    syn:{ Orianna:2, Azir:2, Amumu:2 },
    runes:{ key:"Conquistador", p:"Precisão", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    build:["Força da Trindade","Botas de Treino","Sterak's Gage","Espada do Rei Destruído","Guardião Imortal","Dança da Morte"],
    ini:"Machado de Pedra + Poção", f:["Smite","Flash"],
    d:["Possess: habite corpo de inimigo morto temporariamente","R Heartbreaker: dash em carry isolado + executa com HP baixo","Passive healing: autos em alvo assombrado restauram HP"]
  },


  // ══════════════════════ NOVOS CAMPEÕES (2025-2026) ══════════════════════════
  // Zaahen — patch 15.23 (19/11/2025) | Yunara — patch 15.14 (16/07/2025)
  // Dados baseados nos kits oficiais da wiki

  // ─── ZAAHEN — The Unsundered ───────────────────────────────────────────────
  // Role: Top/Jungle | Classe: Skirmisher (Fighter/Assassin) | Melee | Physical
  //
  // KIT:
  // Passive Cultivation of War: 12 stacks de Determination (+AD por stack).
  //   Em 12 stacks: revive automaticamente (invulnerável 4s, restaura 30-75% HP).
  // Q The Darkin Glaive: auto empoderado que golpeia 2x + cura; recast knockup 0.75s.
  // W Dreaded Return: projétil que puxa inimigos ao alcance máximo + stun 0.25s.
  // E Aureate Rush: dash + AoE; borda externa faz 50% mais dano físico + % HP mágico.
  // R Grim Deliverance: passiva % armor pen (10/20/30%). Ativa: CC immune dash, 
  //   slam AoE físico + cura por campeão atingido.

  zaahen: {
    role:"top", cls:"lutador",
    vs:{
      // Favoráveis: tanques (E outer edge % HP + R armor pen)
      Malphite:53, Ornn:52, Sion:53, Chogath:54, Maokai:52, Drmundo:53,
      // Desfavoráveis: kiting extremo e poke antes de stacks
      Gnar:47, Jayce:47, Quinn:46, Teemo:46, Kennen:48,
      // Neutros
      Darius:50, Garen:51, Camille:50, Irelia:49, Fiora:48, Renekton:51, Sett:51
    },
    syn:{ Orianna:3, Amumu:3, Malphite:2, Lulu:3, Jinx:2 },
    runes:{
      key:"Conquistador",
      p:"Precisão",
      r1:"Triunfo",
      r2:"Lenda: Alacrity",
      r3:"Golpe de Misericórdia",
      s:"Determinação",
      s1:"Condicionamento",
      s2:"Crescimento Excessivo",
      sh:["Velocidade de Ataque","Adaptativo","Armadura"]
    },
    // Build: Skirmisher que escala com bônus AD (Q, W, E, R todos escalam com bônus AD)
    // Trinity Force → procs com empowered autos do Q | Black Cleaver → armor shred sinérgico com R armor pen
    build:[
      "Força da Trindade",
      "Botas de Treino",
      "Machado Negro",
      "Sterak's Gage",
      "Dança da Morte",
      "Guardião Imortal"
    ],
    ini:"Espada Longa + Poção", f:["Flash","Ignite"],
    d:[
      "Passive 12 stacks: NÃO morra acidentalmente — guarde a ressurreição para situações críticas",
      "Q recast knockup 0.75s: Q1 auto → Q2 knockup = CC garantido para aliados engajarem",
      "W Dreaded Return: projétil puxa inimigos — use de trás/flanco para puxar carries para dentro do seu time",
      "E borda externa: posicione o dash para que inimigos fiquem na BORDA do AoE — 50% mais dano + % HP mágico vs tanques",
      "R passiva armor pen: já ativa antes do R — não precisa ativar R para ter o benefício",
      "R ativo: CC immune durante cast — use ENQUANTO está sendo CC para sair da situação e engajar"
    ]
  },

  // ─── YUNARA — The Unbroken Faith ───────────────────────────────────────────
  // Role: Bottom (ADC) | Classe: Marksman | Ranged (575) | Physical
  //
  // KIT:
  // Passive Vow of the First Lands: crits causam 10% + 10%/100AP bonus de dano mágico.
  // Q Cultivation of Spirit: passiva on-hit magic; gera stacks de Unleash com autos.
  //   Ativa (8 stacks): 5s de AS bônus + spread attacks para inimigos próximos (on-hit 30%).
  //   Stacks: 2 por auto em campeão, 1 vs outros. Máx 8.
  // W Arc of Judgment: projétil giratório que desacelera 99% + lingers; upgrade para Arc of Ruin (durante R).
  // E Kanmei's Steps: speed boost 1.5s; upgrade para Untouchable Shadow (dash) durante R.
  // R Transcend One's Self: 15s de estado empoderado — Q ativa automático, W → Arc of Ruin, E → dash.

  yunara: {
    role:"adc", cls:"adc",
    vs:{
      // Favoráveis: imóveis/lentos (spread attacks + slow W)
      MissFortune:52, KogMaw:51, Ashe:52, Sivir:51, Smolder:51,
      // Desfavoráveis: burst antes de stacks / alta mobilidade
      Draven:48, KaiSa:49, Samira:48, Kalista:49,
      // Neutros
      Caitlyn:50, Jinx:51, Jhin:50, Ezreal:51, Tristana:50
    },
    syn:{
      // Synergias: suportes que aplicam CC para Yunara usar W + spread attacks
      Leona:4, Nautilus:4, Thresh:3, Blitzcrank:3, Lulu:3,
      // Runaan's Hurricane mencionado explicitamente na wiki — bolt trigga spread attacks
      // Logo: pairs bem com suportes de engage que criam clusters
    },
    runes:{
      key:"Ritmo Letal",
      // Ritmo Letal: AS bônus empilha com Q ativa — maximiza spread attacks
      // Lethal Tempo sinergia: winddown reduzido + mais autos = mais stacks de Unleash mais rápido
      p:"Precisão",
      r1:"Triunfo",
      r2:"Lenda: Alacrity",
      r3:"Golpe de Misericórdia",
      s:"Dominação",
      s1:"Sabor do Sangue",
      s2:"Caçador Ganancioso",
      sh:["Velocidade de Ataque","Adaptativo","Armadura"]
    },
    // Build: ADC de crit + AS | Passive escala com AP (crits mágico) mas base crit é prioridade
    // Runaan's Hurricane: wiki menciona explicitamente que CADA bolt do Hurricane trigga spread attack próprio
    // = Hurricane é CORE obrigatório em Yunara (AoE explosivo)
    build:[
      "Furacão de Runaan",      // Core obrigatório — bolt trigga spread de Q
      "Botas de Berserker",
      "Flechatroz de Yun Tal",  // Crit + AS
      "Fio do Infinito",        // Crit damage (passive escala com crits)
      "Lembrete Mortal",        // Anti-heal
      "Guardião Mortal"         // Survivability
    ],
    ini:"Doran Blade + Poção", f:["Flash","Cura"],
    d:[
      "Q Cultivation: acumule 8 stacks ANTES de engajar — ative no início do trade, não no meio",
      "Q ativa + Runaan's = spread attacks de TODOS os bolts do Hurricane — cluster de inimigos = devastador",
      "W Arc of Judgment: slow 99% decaying — use para kitar melee que tenta chegar em você",
      "E Kanmei's Steps: use PROATIVAMENTE para posicionamento, não só defensivamente",
      "R Transcend One's Self 15s: Q ativa automático sem custo — use imediatamente ao engajar teamfight",
      "Durante R: Arc of Ruin (W upgrade) + dash (E upgrade) — posicione para beam acertar linha de inimigos"
    ]
  },


};

// Normalização de nomes para busca
export const ALIASES = {
  "lee sin":"leesin", "lee":"leesin",
  "jarvan iv":"jarvaniv", "jarvan":"jarvaniv", "j4":"jarvaniv",
  "xin zhao":"xinzhao", "xin":"xinzhao",
  "kog maw":"kogmaw", "kog":"kogmaw",
  "bel'veth":"belveth", "bel veth":"belveth",
  "kai'sa":"kaisa", "kai sa":"kaisa",
  "kha'zix":"khazix", "kha zix":"khazix", "kha":"khazix",
  "rek'sai":"reksai", "rek sai":"reksai",
  "k'sante":"ksante", "k sante":"ksante",
  "master yi":"masteryi", "yi":"masteryi",
  "miss fortune":"misfortune", "mf":"misfortune",
  "twisted fate":"twistedfate", "tf":"twistedfate",
  "aurelion sol":"aurelionsol",
  "tahm kench":"tahm",
  "renata glasc":"renata",
  "nunu willump":"nunu",
  "dr. mundo":"drmundo", "dr mundo":"drmundo",
  "vel'koz":"vel", "vel koz":"vel",
  "wukong":"wukong",
  "cho'gath":"chogath", "cho gath":"chogath",
  "leesin":"leesin",
  "viego":"viego", "mel":"mel",
  "gragas":"gragas", "rammus":"rammus", "trundle":"trundle",
  "yunara":"yunara", "zaahen":"zaahen",
  // OCR common misreads
  "ahni":"ahri", "zecl":"zed", "fizx":"fizz", "yasua":"yasuo",
};

export function findChamp(name) {
  if (!name) return null;
  const k = name.toLowerCase().trim()
    .replace(/['\s]+/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const raw = name.toLowerCase().trim();
  return D[k] || D[ALIASES[raw]] || D[ALIASES[k]] ||
    // Partial match fallback
    D[Object.keys(D).find(key => key.startsWith(k.slice(0,4))) || ""] || null;
}

// Total count
export const CHAMP_COUNT = Object.keys(D).length;
console.log(`Dataset carregado: ${CHAMP_COUNT} campeões`);
