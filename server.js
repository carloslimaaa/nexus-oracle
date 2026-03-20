import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

const GROQ_KEY = process.env.GROQ_KEY;

// ═══════════════════════════════════════════════════════════════════════════
// ESTRUTURA DO BANCO:
//   runas[]  → paths de runa com campo "quando" explicando a condição
//   builds[] → paths de build com campo "quando" explicando a condição
//   sit      → itens situacionais por situação de jogo
//   f[]      → feitiços padrão
//   d[]      → dicas mecânicas
// O Oracle recebe TODOS os paths e escolhe o melhor para o jogo atual
// ═══════════════════════════════════════════════════════════════════════════

const C = {

  // ─────────────────────────── MID ────────────────────────────────────────

  fizz: { nome:"Fizz", rota:"mid",
    runas:[
      { quando:"maioria dos jogos — inimigos frágeis/squishy (ADC, mago, assassino)", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Nimbo de Tempestade", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
      { quando:"vs time tanque/bruiser (3+ tanques) ou lane de poke (Zoe, Syndra, Xerath)", p:"Feitiçaria", k:"Fase Rush", r1:"Manto de Nuvem", r2:"Celeridade", r3:"Coleta de Tempestades", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"time inimigo frágil, 2+ carries para matar", items:["Foguetão Hextech","Chama das Sombras","Sandálias do Feiticeiro","Ampulheta de Zhonya","Chapéu Mortal de Rabadon","Bastão do Vazio"], ini:"Livro de Feitiços Sombrio + Poção" },
      { quando:"3+ tanques/bruisers, fights longas, muita cura inimiga", items:["Riftmaker","Sandálias do Feiticeiro","Tormento de Liandry","Rylai's Crystal Scepter","Chapéu Mortal de Rabadon","Bastão do Vazio"], ini:"Anel de Doran + Poção" },
    ],
    sit:"Morellonomicon 3° item vs Soraka/Yuumi/Mundo/Aatrox | Véu da Banshee vs Malzahar/Syndra/Veigar CC | Ampulheta de Zhonya vs Zed/Talon/Rengar",
    f:["Ignite","Flash"],
    d:["All-in level 6: E → Q → R → Ignite","E cancela CC (Lux R, Zed R, Malzahar R)","Nunca troque antes do 6","Post-6 roame bot/top após cada kill"] },

  ahri: { nome:"Ahri", rota:"mid",
    runas:[
      { quando:"assassinar carries isolados, snowball pesado", p:"Dominação", k:"Colheita Sombria", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
      { quando:"dano sustentado, time tanque ou lane segura para farmar", p:"Feitiçaria", k:"Cometa Arcano", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — frágeis/squishy no time inimigo", items:["Luden's Companheiro","Sandálias do Feiticeiro","Chama das Sombras","Chapéu Mortal de Rabadon","Véu da Banshee","Bastão do Vazio"], ini:"Anel de Doran + Poção" },
      { quando:"time tanque ou muito sustain inimigo", items:["Luden's Companheiro","Sandálias do Feiticeiro","Tormento de Liandry","Rylai's Crystal Scepter","Chapéu Mortal de Rabadon","Bastão do Vazio"], ini:"Anel de Doran + Poção" },
    ],
    sit:"Morellonomicon vs cura excessiva | Ampulheta de Zhonya vs Zed/assassinos AD | Véu da Banshee vs AP CC pesado",
    f:["Ignite","Flash"],
    d:["Charm (E) ANTES de Q e W para amplificar dano","R tem 3 cargas — use para escape também","Roame pelo flanking lateral"] },

  syndra: { nome:"Syndra", rota:"mid",
    runas:[
      { quando:"poke e dano sustentado na lane (maioria dos jogos)", p:"Feitiçaria", k:"Cometa Arcano", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
      { quando:"vs assassino ou burst pesado (precisa de all-in)", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"dano burst máximo (inimigos frágeis)", items:["Coroa Sombria","Sandálias do Feiticeiro","Chapéu Mortal de Rabadon","Horizonte Foco","Bastão do Vazio","Véu da Banshee"], ini:"Anel de Doran + Poção" },
      { quando:"vs time tanque ou inimigos com muita MR", items:["Coroa Sombria","Sandálias do Feiticeiro","Tormento de Liandry","Bastão do Vazio","Chapéu Mortal de Rabadon","Ampulheta de Zhonya"], ini:"Anel de Doran + Poção" },
    ],
    sit:"Morellonomicon vs cura | Ampulheta de Zhonya vs Zed/Talon | Véu da Banshee vs Malzahar/Veigar",
    f:["Flash","Teleporte"],
    d:["E stun → Q → R (7 orbes) → W: combo burst total","Level 9 com Q maxado é o power spike","Sempre mantenha 3+ orbes no chão"] },

  zed: { nome:"Zed", rota:"mid",
    runas:[
      { quando:"snowball pesado, inimigos squishy ou sem peel", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Perseguidor Sombrio", r3:"Caçador Voraz", s:"Precisão", s1:"Triunfo", s2:"Lenda: Alacrity", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"vs poke heavy ou precisa de sustain (Karma, Lulu, Soraka como suporte)", p:"Precisão", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Voraz", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"assassinar carries isolados (padrão)", items:["Faca de Dusk","Sandálias Sombrias","Véu de Morte","Relâmpago Estático","Lâmina da Noite Infinita","Guardião Imortal"], ini:"Espada Longa + Poção" },
      { quando:"time com tank frontal ou precisa de sustain em fights longas", items:["Faca de Dusk","Botas de Treino","Serpentine Fang","Dança da Morte","Relâmpago Estático","Guardião Imortal"], ini:"Espada Longa + Poção" },
    ],
    sit:"Serpentine Fang vs escudos (Lulu/Janna/Karma) | Dança da Morte vs tanques | Guardião Imortal vs burst pesado",
    f:["Ignite","Flash"],
    d:["Combo: W shadow → E → Q → R → Q → E → Ignite","Use W para checar brushes antes de trade","Roame apenas com Faca de Dusk completa"] },

  katarina: { nome:"Katarina", rota:"mid",
    runas:[
      { quando:"burst e one-shot (maioria dos jogos)", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
      { quando:"vs time tanque/bruiser (3+ frontline) ou precisa de damage sustentado", p:"Precisão", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Adaptativo","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"inimigos frágeis, 2+ carries para resetar", items:["Lâmina da Hextech","Sandálias do Feiticeiro","Ampulheta de Zhonya","Coroa Sombria","Chapéu Mortal de Rabadon","Bastão do Vazio"], ini:"Adaga Longa + Poção" },
      { quando:"vs tanques/bruisers ou muito CC inimigo", items:["Riftmaker","Sandálias do Feiticeiro","Tormento de Liandry","Cimitarra Mercurial","Chapéu Mortal de Rabadon","Bastão do Vazio"], ini:"Adaga Longa + Poção" },
    ],
    sit:"Cimitarra Mercurial vs muito CC (Malzahar/Alistar) | Morellonomicon vs cura | Véu da Banshee vs burst AP",
    f:["Flash","Ignite"],
    d:["Nunca use R com CC ativo","Reset de W com kill/assist — gerencie E cuidadosamente","Roame agressivamente pós-6"] },

  yasuo: { nome:"Yasuo", rota:"mid",
    runas:[
      { quando:"fights longas, teamfight, inimigos com tanques/bruisers", p:"Precisão", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"duelos 1v1, lane de assassino ou snowball rápido", p:"Precisão", k:"Pressione o Ataque", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — teamfight e dano sustentado", items:["Shieldbow Imortal","Botas de Berserker","Kraken Slayer","Fio do Infinito","Guardião Mortal","Lembrete Mortal"], ini:"Espada Longa + Poção" },
      { quando:"vs time frágil puro ou 2+ carries squishy", items:["Fio do Infinito","Botas de Berserker","Shieldbow Imortal","Kraken Slayer","Lembrete Mortal","Guardião Mortal"], ini:"Espada Longa + Poção" },
    ],
    sit:"Cimitarra Mercurial vs muito CC ou Malzahar | Guardião Mortal vs tanques | Lembrete Mortal vs tanques AP",
    f:["Flash","Ignite"],
    d:["Q 3 hits = Tornado — nunca desperdice em minion","R requer knockup aliado — coordene com Malphite/Amumu","Passive shield recarrega fora do combate"] },

  ekko: { nome:"Ekko", rota:"mid",
    runas:[
      { quando:"assassinar carries isolados, one-shot potential", p:"Dominação", k:"Colheita Sombria", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Capacete de Gladiador", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
      { quando:"vs time tanque ou lane contra bruiser", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"inimigos frágeis, assassinar carries", items:["Foguetão Hextech","Sandálias do Feiticeiro","Ampulheta de Zhonya","Lich Bane","Chapéu Mortal de Rabadon","Bastão do Vazio"], ini:"Anel de Doran + Poção" },
      { quando:"vs time tanque ou sustain", items:["Riftmaker","Sandálias do Feiticeiro","Tormento de Liandry","Ampulheta de Zhonya","Chapéu Mortal de Rabadon","Bastão do Vazio"], ini:"Anel de Doran + Poção" },
    ],
    sit:"Morellonomicon vs cura | Véu da Banshee vs AP CC | Ampulheta de Zhonya vs AD assassinos",
    f:["Flash","Ignite"],
    d:["W: posicione onde o inimigo VAI estar, não onde está","R é panic button — nunca use no início do fight","Passive 3 hits em tower = push rápido"] },

  veigar: { nome:"Veigar", rota:"mid",
    runas:[
      { quando:"dano crescente com AP — maioria dos jogos", p:"Feitiçaria", k:"Cometa Arcano", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
      { quando:"vs assassino que vai te matar antes de ter AP (Zed/Talon/Akali)", p:"Feitiçaria", k:"Fase Rush", r1:"Manto de Nuvem", r2:"Celeridade", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"burst e execute (padrão)", items:["Coroa Sombria","Sandálias do Feiticeiro","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya","Véu da Banshee"], ini:"Anel de Doran + Poção" },
      { quando:"vs time tanque ou múltiplos bruisers", items:["Coroa Sombria","Sandálias do Feiticeiro","Tormento de Liandry","Bastão do Vazio","Chapéu Mortal de Rabadon","Ampulheta de Zhonya"], ini:"Anel de Doran + Poção" },
    ],
    sit:"Véu da Banshee vs assassinos que te one-shotam | Ampulheta de Zhonya vs AD | Morellonomicon vs cura",
    f:["Flash","Teleporte"],
    d:["Farm Q em minions SEMPRE — nunca perca um CS","E cage em cantos de parede = stun garantido","R execute: mais dano com menos HP no inimigo"] },

  lux: { nome:"Lux", rota:"mid",
    runas:[
      { quando:"poke e dano de burst (maioria dos jogos)", p:"Feitiçaria", k:"Cometa Arcano", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
      { quando:"vs time dive pesado — precisa de damage + CC mais frequente", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"burst máximo (squishy inimigos)", items:["Luden's Companheiro","Sandálias do Feiticeiro","Chama das Sombras","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"], ini:"Anel de Doran + Poção" },
      { quando:"vs time tanque — need penetração", items:["Coroa Sombria","Sandálias do Feiticeiro","Tormento de Liandry","Bastão do Vazio","Chapéu Mortal de Rabadon","Ampulheta de Zhonya"], ini:"Anel de Doran + Poção" },
    ],
    sit:"Morellonomicon vs cura | Véu da Banshee vs AP CC | Ampulheta de Zhonya vs AD dive",
    f:["Flash","Ignite"],
    d:["Q raiz 2 alvos — sempre acerte ambos","R baixo CD com CDR — use para harass também","Passive Illumination: auto proc = burst extra"] },

  orianna: { nome:"Orianna", rota:"mid",
    runas:[
      { quando:"poke e teamfight (maioria dos jogos)", p:"Feitiçaria", k:"Cometa Arcano", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
      { quando:"vs assassino pesado (Zed/Akali/Katarina) — precisa de survivabilidade", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    ],
    builds:[
      { quando:"padrão", items:["Luden's Companheiro","Sandálias do Feiticeiro","Horizonte Foco","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"], ini:"Anel de Doran + Poção" },
      { quando:"vs time tanque/sustain", items:["Coroa Sombria","Sandálias do Feiticeiro","Tormento de Liandry","Bastão do Vazio","Chapéu Mortal de Rabadon","Ampulheta de Zhonya"], ini:"Anel de Doran + Poção" },
    ],
    sit:"Morellonomicon vs cura | Véu da Banshee vs CC/assassinos | Ampulheta de Zhonya vs Zed",
    f:["Flash","Teleporte"],
    d:["Ball placement: mantenha ON aliado para R setup","R pull: máximo com 3+ inimigos","Q move ball, W damage e shield aliado com ball"] },

  malzahar: { nome:"Malzahar", rota:"mid",
    runas:[
      { quando:"controle de carry com R (maioria dos jogos)", p:"Feitiçaria", k:"Cometa Arcano", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
      { quando:"vs dive pesado ou jungler aggressivo — precisa de dano rápido", p:"Dominação", k:"Colheita Sombria", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — controle e dano DoT", items:["Criador de Fendas","Sandálias do Feiticeiro","Tormento de Liandry","Bastão do Vazio","Chapéu Mortal de Rabadon","Ampulheta de Zhonya"], ini:"Anel de Doran + Poção" },
      { quando:"vs time tanque — penetração máxima", items:["Criador de Fendas","Sandálias do Feiticeiro","Bastão do Vazio","Tormento de Liandry","Chapéu Mortal de Rabadon","Ampulheta de Zhonya"], ini:"Anel de Doran + Poção" },
    ],
    sit:"Morellonomicon vs cura | Passive spellshield: use com cuidado contra Q/E inimigo",
    f:["Flash","Ignite"],
    d:["R (suppressão): use em carry — time faz o dano","Void Swarm (passive): invocados com habilidades — farm wave","E silence: interrupt channeling de ults inimigos"] },

  leblanc: { nome:"LeBlanc", rota:"mid",
    runas:[
      { quando:"burst e one-shot de carries (maioria dos jogos)", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
      { quando:"vs lane tankona ou bruiser que anula burst", p:"Feitiçaria", k:"Fase Rush", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"burst puro — squishy inimigos", items:["Luden's Companheiro","Sandálias do Feiticeiro","Chama das Sombras","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"], ini:"Anel de Doran + Poção" },
      { quando:"vs time tanque", items:["Criador de Fendas","Sandálias do Feiticeiro","Tormento de Liandry","Chapéu Mortal de Rabadon","Bastão do Vazio","Ampulheta de Zhonya"], ini:"Anel de Doran + Poção" },
    ],
    sit:"Ampulheta de Zhonya vs Zed/assassinos AD | Véu da Banshee vs AP CC",
    f:["Flash","Ignite"],
    d:["Combo: W dash → E chain → Q → Ignite","W return após dash = escape seguro","Clone (R) confunde inimigos — use em chase"] },

  // ─────────────────────────── TOP ────────────────────────────────────────

  darius: { nome:"Darius", rota:"top",
    runas:[
      { quando:"brigas longas, inimigos que ficam na lane (maioria dos jogos)", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"vs time full AD ou muito poke ranged na top", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Demolir", r2:"Osso Revestido", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Ataque","Armadura","Armadura"] },
    ],
    builds:[
      { quando:"padrão — bruiser com penetração", items:["Quebra-Passos","Botas de Mercúrio","Aço do Coração","Pele de Pedra de Gárgula","Força da Natureza","Armadura de Espinhos"], ini:"Espada Longa + Poção" },
      { quando:"vs full AP ou 3+ AP inimigos", items:["Quebra-Passos","Botas de Mercúrio","Força da Natureza","Pele de Pedra de Gárgula","Aço do Coração","Armadura de Espinhos"], ini:"Doran Shield + Poção" },
    ],
    sit:"Armadura de Espinhos vs Warwick/Mundo/cura pesada | Botas de Mercúrio vs CC pesado | Força da Natureza obrigatória vs 3+ AP",
    f:["Flash","Ignite"],
    d:["5 stacks hemorragia + Guilhotina = kill garantida","Q borda externa: cura + dano bônus","W: pull inimigos que tentam kitar"] },

  garen: { nome:"Garen", rota:"top",
    runas:[
      { quando:"brigas sustentadas, split push (maioria dos jogos)", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Precisão", s1:"Triunfo", s2:"Lenda: Persistência", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"vs ranged top (Teemo/Quinn/Jayce) — precisa de sustain extra", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Demolir", r2:"Osso Revestido", r3:"Crescimento Excessivo", s:"Precisão", s1:"Triunfo", s2:"Última Resistência", sh:["Velocidade de Ataque","Armadura","Armadura"] },
    ],
    builds:[
      { quando:"padrão", items:["Quebra-Passos","Botas de Treino","Aço do Coração","Pele de Pedra de Gárgula","Força da Natureza","Armadura de Espinhos"], ini:"Doran Shield + Poção" },
      { quando:"vs full AP", items:["Quebra-Passos","Botas de Mercúrio","Força da Natureza","Pele de Pedra de Gárgula","Aço do Coração","Armadura de Espinhos"], ini:"Doran Shield + Poção" },
    ],
    sit:"Armadura de Espinhos vs cura pesada | Força da Natureza obrigatória vs 3+ AP | Botas de Mercúrio vs CC pesado",
    f:["Flash","Teleporte"],
    d:["E cancela slow — use para alcançar kiting","Passive regen: 8s fora de combate","R mais forte quanto mais kills o inimigo tiver"] },

  irelia: { nome:"Irelia", rota:"top",
    runas:[
      { quando:"duelos 1v1, snowball (maioria dos jogos)", p:"Precisão", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"vs time full AP ou much range", p:"Precisão", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Tenacidade", r3:"Última Resistência", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Armadura","Resistência Mágica"] },
    ],
    builds:[
      { quando:"padrão — anti-cura e dano físico", items:["Faca Chempunk Serrilhada","Botas de Treino","Espada do Rei Destruído","Lâmina Raivosa","Cimitarra Mercurial","Guardião Imortal"], ini:"Espada Longa + Poção" },
      { quando:"vs AP heavy ou CC pesado (stuns longos)", items:["Faca Chempunk Serrilhada","Botas de Mercúrio","Cimitarra Mercurial","Espada do Rei Destruído","Guardião Imortal","Força da Natureza"], ini:"Espada Longa + Poção" },
    ],
    sit:"Cimitarra Mercurial obrigatória vs CC pesado | Armadura de Espinhos vs Fiora/cura | Faca Chempunk vs qualquer cura relevante",
    f:["Flash","Ignite"],
    d:["4 stacks passive antes de engajar","Q reset em low HP inimigo","R horizontal divide o grupo"] },

  camille: { nome:"Camille", rota:"top",
    runas:[
      { quando:"brigas longas, split push (maioria dos jogos)", p:"Precisão", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"vs squishy que você one-shot (Teemo/mago top)", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Precisão", s1:"Triunfo", s2:"Golpe de Misericórdia", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão", items:["Força da Trindade","Botas de Treino","Lança de Shojin","Dança da Morte","Sterak's Gage","Protetor do Guardião"], ini:"Espada Longa + Poção" },
      { quando:"vs full AP ou muito CC", items:["Força da Trindade","Botas de Mercúrio","Lança de Shojin","Cimitarra Mercurial","Sterak's Gage","Força da Natureza"], ini:"Espada Longa + Poção" },
    ],
    sit:"Cimitarra Mercurial vs CC pesado | Lembrete Mortal vs tanques com HP | Dança da Morte vs poison/DoT",
    f:["Flash","Ignite"],
    d:["W borda externa: slow/stun","E gancho em parede + R = lock 1v1 garantido","Split push é sua win condition"] },

  jayce: { nome:"Jayce", rota:"top",
    runas:[
      { quando:"brigas longas com forma martelo (maioria dos jogos)", p:"Precisão", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
      { quando:"poke dominante na lane (inimigo que não consegue te alcançar)", p:"Precisão", k:"Primeiro Golpe", r1:"Presença de Espírito", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"all-in e burst físico", items:["Lâmina Sanguessuga","Botas de Treino","Machado Negro","Rancor de Serylda","Dança da Morte","Fio do Infinito"], ini:"Espada Longa + Poção" },
      { quando:"vs tanques — need penetração de armor", items:["Lâmina Sanguessuga","Botas de Treino","Rancor de Serylda","Lembrete Mortal","Dança da Morte","Fio do Infinito"], ini:"Espada Longa + Poção" },
    ],
    sit:"Rancor de Serylda obrigatório vs tanques | Serpentine Fang vs escudos | Lembrete Mortal vs regeneração",
    f:["Flash","Teleporte"],
    d:["EQ canhão: burst longa distância","Forma martelo: E knockback + W","Jogue ranged até poder all-in com martelo"] },

  // ─────────────────────────── JUNGLE ─────────────────────────────────────

  leesin: { nome:"Lee Sin", rota:"jungle",
    runas:[
      { quando:"assassinar carries, plays de impacto (maioria dos jogos)", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Perseguidor Sombrio", r3:"Caçador Voraz", s:"Precisão", s1:"Triunfo", s2:"Lenda: Tenacidade", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"vs time tanque ou precisa de mais sustain para lutar longo", p:"Precisão", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Voraz", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — assassino com peel", items:["Faca de Dusk","Botas de Treino","Capa da Égide do Assassino","Lâmina da Noite Infinita","Guardião Imortal","Véu de Morte"], ini:"Machado de Pedra + Poção" },
      { quando:"vs time tanque ou precisa de mais bruiser", items:["Força da Trindade","Botas de Treino","Sterak's Gage","Dança da Morte","Pele de Pedra de Gárgula","Guardião Imortal"], ini:"Machado de Pedra + Poção" },
    ],
    sit:"Serpentine Fang vs Lulu/Janna/Karma (escudos) | Guardião Imortal vs burst pesado | Lembrete Mortal vs tanques",
    f:["Smite","Flash"],
    d:["Insec: Flash/W2 ANTES do R para kickar para trás do time","Ward hop: jogue ward → W2 para flanquear","Power spike: level 3 com Q/W/E"] },

  hecarim: { nome:"Hecarim", rota:"jungle",
    runas:[
      { quando:"engage rápido e fear em carries (maioria dos jogos)", p:"Feitiçaria", k:"Fase Rush", r1:"Manto de Nuvem", r2:"Celeridade", r3:"Coleta de Tempestades", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
      { quando:"vs time frágil puro que você vai esmagar (3+ squishy)", p:"Precisão", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — tank com engage", items:["Sunfire Aegis","Botas de Treino","Sterak's Gage","Força da Natureza","Pele de Pedra de Gárgula","Jak'Sho o Proteano"], ini:"Machado de Pedra + Poção" },
      { quando:"vs full AP — precisa de resistência mágica", items:["Sunfire Aegis","Botas de Mercúrio","Força da Natureza","Jak'Sho o Proteano","Pele de Pedra de Gárgula","Coração Congelado"], ini:"Machado de Pedra + Poção" },
    ],
    sit:"Força da Natureza obrigatória vs 3+ AP | Coração Congelado vs AD pesado | Botas de Mercúrio vs CC pesado",
    f:["Smite","Flash"],
    d:["Phase Rush: proc com 3 habilidades = speed imparável","R fear em carries de longa distância","E: primeiro hit com charge máximo = mais damage"] },

  amumu: { nome:"Amumu", rota:"jungle",
    runas:[
      { quando:"engage tank (maioria dos jogos)", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Capacete de Gladiador", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
      { quando:"vs time com muita cura/lifesteal e precisa de dano mágico", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Habilidade","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — tank engage", items:["Abraço de Sunfire","Botas de Mercúrio","Aço do Coração","Pele de Pedra de Gárgula","Espírito do Ancião","Colosso de Anima"], ini:"Machado de Pedra + Poção" },
      { quando:"vs full AD ou muito dano físico", items:["Abraço de Sunfire","Botas de Treino","Coração Congelado","Pele de Pedra de Gárgula","Armadura de Espinhos","Jak'Sho o Proteano"], ini:"Machado de Pedra + Poção" },
    ],
    sit:"Armadura de Espinhos vs lifesteal pesado | Coração Congelado vs AD | Botas de Mercúrio vs CC/AP heavy",
    f:["Smite","Flash"],
    d:["Q tem 2 cargas — primeira gap close, segunda confirma","R imediato após Q em gank","Nunca inicie sozinho no teamfight"] },

  kayn: { nome:"Kayn", rota:"jungle",
    runas:[
      { quando:"padrão para ambas as formas", p:"Dominação", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Condicionamento", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"Blue Kayn (Darkin) — vs time com muita CC ou carries frágeis para duelar", items:["Lâmina Sanguessuga","Botas de Treino","Dança da Morte","Sterak's Gage","Machado Negro","Guardião Imortal"], ini:"Machado de Pedra + Poção" },
      { quando:"Red Kayn (Shadow Assassin) — vs squishy pesado, 3+ carries para one-shot", items:["Dusk Blade","Botas de Treino","Véu da Noite","Dança da Morte","Sterak's Gage","Guardião Imortal"], ini:"Machado de Pedra + Poção" },
    ],
    sit:"Blue vs teamfight/tanques | Red vs squishy/carries | Serpentine Fang vs escudos (Lulu/Janna)",
    f:["Smite","Flash"],
    d:["Escolha forma baseado no time inimigo (Red=squishy, Blue=tanque/CC)","R Shadow Step: entre em inimigos — use para escape também","Farm ambos os tipos de inimigo para transformação rápida"] },

  khazix: { nome:"Kha'Zix", rota:"jungle",
    runas:[
      { quando:"one-shot carries isolados (maioria dos jogos)", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
      { quando:"vs time com muita visão ou suporte com CC (Thresh/Leona) — precisa de mais kite", p:"Dominação", k:"Colheita Sombria", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Adaptativo","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — one-shot lethality", items:["Faca de Dusk","Botas de Treino","Véu da Noite","Dança da Morte","Sterak's Gage","Arco do Axioma"], ini:"Machado de Pedra + Poção" },
      { quando:"vs escudos/peel pesado (Lulu/Janna/Karma suporte)", items:["Faca de Dusk","Botas de Treino","Serpentine Fang","Dança da Morte","Sterak's Gage","Guardião Imortal"], ini:"Machado de Pedra + Poção" },
    ],
    sit:"Serpentine Fang vs escudos obrigatório | Dança da Morte vs tanques | Evoluir Q primeiro",
    f:["Smite","Flash"],
    d:["Isolated target = damage bônus em Q — sempre 1v1","Evolve Q primeiro","R Void Assault: stealth para reset isolated"] },

  graves: { nome:"Graves", rota:"jungle",
    runas:[
      { quando:"duelos e burst físico (maioria dos jogos)", p:"Precisão", k:"Pressione o Ataque", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"vs time tankão — need dano sustentado", p:"Precisão", k:"Conquistador", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Dominação", s1:"Sabor do Sangue", s2:"Caçador Ganancioso", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — crit e ataque físico", items:["Flechatroz de Yun Tal","Botas de Berserker","Fio do Infinito","Espada do Rei Destruído","Lembrete Mortal","Guardião Mortal"], ini:"Machado de Pedra + Poção" },
      { quando:"vs tanques — need lethality ou penetração", items:["Flechatroz de Yun Tal","Botas de Berserker","Rancor de Serylda","Lembrete Mortal","Fio do Infinito","Guardião Mortal"], ini:"Machado de Pedra + Poção" },
    ],
    sit:"Lembrete Mortal vs lifesteal/tanques | Guardião Mortal vs carries AP pesados | Rancor de Serylda vs armor stackers",
    f:["Smite","Flash"],
    d:["Q bounce na parede = mais damage","E Quickdraw: use DEFENSIVAMENTE","Close range: todos os pellets acertam = max DPS"] },

  // ─────────────────────────── ADC ────────────────────────────────────────

  jinx: { nome:"Jinx", rota:"adc",
    runas:[
      { quando:"fights longas com AS (maioria dos jogos)", p:"Precisão", k:"Ritmo Letal", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"vs poke de engage pesado (Blitz/Leona) — precisa de burst rápido na lane", p:"Precisão", k:"Pressione o Ataque", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Determinação", s1:"Demolir", s2:"Inabalável", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — teamfight e AoE", items:["Kraken Slayer","Botas de Berserker","Furacão de Runaan","Espada do Rei Destruído","Fio do Infinito","Lembrete Mortal"], ini:"Doran Blade + Poção" },
      { quando:"vs time full tanque — need % HP dano", items:["Kraken Slayer","Botas de Berserker","Fio do Infinito","Espada do Rei Destruído","Lembrete Mortal","Guardião Mortal"], ini:"Doran Blade + Poção" },
    ],
    sit:"Lembrete Mortal vs lifesteal/Soraka/Mundo | Guardião Mortal vs tanques AP | Furacão de Runaan para push e AoE teamfight",
    f:["Flash","Cura"],
    d:["Minigun para farm/duelos; Foguetes para teamfight/AoE","Passive reset com kill/assist — maximize no teamfight","Não troque levels 1-2 — spike começa com Kraken+Runaan"] },

  caitlyn: { nome:"Caitlyn", rota:"adc",
    runas:[
      { quando:"bully e lane dominante (maioria dos jogos)", p:"Precisão", k:"Pressione o Ataque", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"vs engage pesado (Leona/Blitz/Nautilus) — precisa de escape", p:"Precisão", k:"Trabalho de Pé Ágil", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — crit e range bully", items:["Flechatroz de Yun Tal","Botas de Berserker","Rapidfire Cannon","Fio do Infinito","Lembrete Mortal","Guardião Mortal"], ini:"Espada Longa + Poção" },
      { quando:"vs tanques — need Kraken e penetração", items:["Kraken Slayer","Botas de Berserker","Flechatroz de Yun Tal","Fio do Infinito","Lembrete Mortal","Guardião Mortal"], ini:"Espada Longa + Poção" },
    ],
    sit:"Lembrete Mortal vs lifesteal/Mundo/Aatrox | Guardião Mortal vs tanques AP | Rapidfire para range máxima em sieges",
    f:["Flash","Cura"],
    d:["Armadilhas em brushes + zone trap-shot (E)","Headshot proc com trap — trap first, then E","auto → Q → auto para proc headshot rápido"] },

  ezreal: { nome:"Ezreal", rota:"adc",
    runas:[
      { quando:"poke e kiting (maioria dos jogos)", p:"Precisão", k:"Trabalho de Pé Ágil", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
      { quando:"vs engage pesado — precisa de mobility e disengage", p:"Feitiçaria", k:"Fase Rush", r1:"Manto de Nuvem", r2:"Celeridade", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — burst e kiting", items:["Manamune","Botas de Iônia","Trinity Force","Espada do Rei Destruído","Fio do Infinito","Guardião Mortal"], ini:"Doran Blade + Poção" },
      { quando:"vs tanques — need penetração física", items:["Manamune","Botas de Iônia","Trinity Force","Rancor de Serylda","Lembrete Mortal","Guardião Mortal"], ini:"Doran Blade + Poção" },
    ],
    sit:"Lembrete Mortal vs lifesteal | Rancor de Serylda vs armor stackers | E defensivamente — nunca gaste em ataque",
    f:["Flash","Cura"],
    d:["Q Mystic Shot: hit reset todos os CDs","E Arcane Shift: use DEFENSIVAMENTE","R global: steal objectives ou execute"] },

  jhin: { nome:"Jhin", rota:"adc",
    runas:[
      { quando:"kiting, poke e burst (maioria dos jogos)", p:"Precisão", k:"Trabalho de Pé Ágil", r1:"Presença de Espírito", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Coleta de Tempestades", sh:["Adaptativo","Adaptativo","Armadura"] },
      { quando:"vs engage pesado — precisa de escape (Leona/Blitz/Alistar)", p:"Precisão", k:"Trabalho de Pé Ágil", r1:"Presença de Espírito", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Inspiração", s1:"Calçados Mágicos", s2:"Perspicácia Cósmica", sh:["Adaptativo","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — lethality e crit", items:["Garra do Caçador","Botas de Berserker","Rapidfire Cannon","Fio do Infinito","Lembrete Mortal","Coletor"], ini:"Doran Blade + Poção" },
      { quando:"vs tanques — need armor pen", items:["Garra do Caçador","Botas de Berserker","Fio do Infinito","Lembrete Mortal","Guardião Mortal","Rancor de Serylda"], ini:"Doran Blade + Poção" },
    ],
    sit:"Lembrete Mortal vs lifesteal/Mundo/Soraka | Guardião Mortal vs tanques AP | 4° tiro nunca desperdice em minion",
    f:["Flash","Cura"],
    d:["4° tiro sempre no carry — nunca no minion","W root: precisa de ally touch/flower primeiro","R de ultra range — use de segurança máxima"] },

  kaisa: { nome:"Kai'Sa", rota:"adc",
    runas:[
      { quando:"on-hit e burst (maioria dos jogos)", p:"Precisão", k:"Pressione o Ataque", r1:"Triunfo", r2:"Lenda: Alacrity", r3:"Golpe de Misericórdia", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Coleta de Tempestades", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
      { quando:"vs time engage pesado — precisa de burst rápido para eliminar antes de ser CCed", p:"Dominação", k:"Eletrocutar", r1:"Sabor do Sangue", r2:"Coleta de Globos Oculares", r3:"Caçador Ganancioso", s:"Precisão", s1:"Triunfo", s2:"Golpe de Misericórdia", sh:["Velocidade de Ataque","Adaptativo","Armadura"] },
    ],
    builds:[
      { quando:"padrão — on-hit burst", items:["Kraken Slayer","Botas de Berserker","Flechatroz de Yun Tal","Lâmina da Raiva de Guinsoo","Guardião Mortal","Lembrete Mortal"], ini:"Doran Blade + Poção" },
      { quando:"vs tanques pesados — AS com % HP dano", items:["Kraken Slayer","Botas de Berserker","Lâmina da Raiva de Guinsoo","Espada do Rei Destruído","Lembrete Mortal","Guardião Mortal"], ini:"Doran Blade + Poção" },
    ],
    sit:"Lembrete Mortal vs lifesteal/cura pesada | Guardião Mortal vs AP | Void Staff vs MR stackers",
    f:["Flash","Cura"],
    d:["Passive 5 stacks = burst enorme no 4° hit","Q empowered em alvo solo: chegue perto","R dash em aliado que marcou inimigo"] },

  // ─────────────────────────── SUPORTE ────────────────────────────────────

  thresh: { nome:"Thresh", rota:"sup",
    runas:[
      { quando:"engage e CC (maioria dos jogos)", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Bola de Fogo Mágica", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
      { quando:"vs poke pesado de range — precisa de sustain para manter ADC vivo", p:"Determinação", k:"Guardião", r1:"Regeneração", r2:"Condicionamento", r3:"Revitalizar", s:"Inspiração", s1:"Bola de Fogo Mágica", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    ],
    builds:[
      { quando:"padrão — engage tank", items:["Vigilância Locket","Botas de Mobilidade","Promessa do Cavaleiro","Fortaleza de Redenção","Colosso de Anima","Cetro de Cristal de Rylai"], ini:"Relic Shield + Poção" },
      { quando:"vs pokeadores ou need mais CC/AP", items:["Vigilância Locket","Botas de Iônia","Promessa do Cavaleiro","Fortaleza de Redenção","Colosso de Anima","Chapéu Mortal de Rabadon"], ini:"Relic Shield + Poção" },
    ],
    sit:"Botas de Mobilidade padrão | Botas de Mercúrio vs CC muito pesado | Cetro de Rylai vs mobile carries",
    f:["Flash","Ignite"],
    d:["Q: jogue fora do range esperado — inimigos recuam","Lanterna (W): ângulos alternativos para carry","Farm almas: armor permanente a cada CS próximo"] },

  leona: { nome:"Leona", rota:"sup",
    runas:[
      { quando:"engage e all-in pesado (maioria dos jogos)", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Escudo de Fort", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Bola de Fogo Mágica", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
      { quando:"vs pokeadores pesados (Caitlyn/Jinx/Jhin) — precisa de mais shield/healing", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Escudo de Fort", r2:"Osso Revestido", r3:"Revitalizar", s:"Inspiração", s1:"Bola de Fogo Mágica", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Armadura"] },
    ],
    builds:[
      { quando:"padrão — engage tank", items:["Vigilância Locket","Botas de Mercúrio","Promessa do Cavaleiro","Colosso de Anima","Pele de Pedra de Gárgula","Força da Natureza"], ini:"Steel Shoulderguards + Poção" },
      { quando:"vs full AP ou muito CC mágico", items:["Vigilância Locket","Botas de Mercúrio","Força da Natureza","Promessa do Cavaleiro","Jak'Sho o Proteano","Pele de Pedra de Gárgula"], ini:"Steel Shoulderguards + Poção" },
    ],
    sit:"Botas de Mercúrio obrigatórias vs AP heavy | Força da Natureza vs 3+ AP | Armadura de Espinhos vs lifesteal",
    f:["Flash","Ignite"],
    d:["Level 2 all-in: E → Q → auto = kill","Nunca use E sem Q carregado — você fica preso","R em grupo: stun AoE, não 1v1"] },

  blitzcrank: { nome:"Blitzcrank", rota:"sup",
    runas:[
      { quando:"engage e pick pesado (maioria dos jogos)", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Bola de Fogo Mágica", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    ],
    builds:[
      { quando:"padrão", items:["Vigilância Locket","Botas de Treino","Aço do Coração","Pele de Pedra de Gárgula","Colosso de Anima","Fortaleza de Redenção"], ini:"Steel Shoulderguards + Poção" },
      { quando:"vs full AP ou muito dano mágico", items:["Vigilância Locket","Botas de Mercúrio","Força da Natureza","Pele de Pedra de Gárgula","Colosso de Anima","Fortaleza de Redenção"], ini:"Steel Shoulderguards + Poção" },
    ],
    sit:"Botas de Mercúrio vs AP/CC pesado | Força da Natureza vs 3+ AP | Armadura de Espinhos vs lifesteal",
    f:["Flash","Ignite"],
    d:["Combo: Q (Gancho) → E (Soco) imediatamente → auto","W Overdrive ANTES do Q para chegar no range","Jogue brushes para forçar o gancho","Nunca use E primeiro — perde o knockup"] },

  nautilus: { nome:"Nautilus", rota:"sup",
    runas:[
      { quando:"engage e CC chain (maioria dos jogos)", p:"Determinação", k:"Aperto dos Mortos-Vivos", r1:"Demolir", r2:"Condicionamento", r3:"Inabalável", s:"Inspiração", s1:"Perspicácia Cósmica", s2:"Calçados Mágicos", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    ],
    builds:[
      { quando:"padrão", items:["Vigilância Locket","Botas de Mercúrio","Promessa do Cavaleiro","Colosso de Anima","Força da Natureza","Pele de Pedra de Gárgula"], ini:"Steel Shoulderguards + Poção" },
      { quando:"vs full AD", items:["Vigilância Locket","Botas de Treino","Coração Congelado","Promessa do Cavaleiro","Armadura de Espinhos","Pele de Pedra de Gárgula"], ini:"Steel Shoulderguards + Poção" },
    ],
    sit:"Botas de Mercúrio vs AP heavy | Coração Congelado vs AD | Armadura de Espinhos vs lifesteal",
    f:["Flash","Ignite"],
    d:["Q hook + Passive auto root = CC chain","R knockup AoE em linha","4 CC disponíveis: Q root/passive root/E root/R knockup"] },

  lulu: { nome:"Lulu", rota:"sup",
    runas:[
      { quando:"proteger carry e buffs (maioria dos jogos)", p:"Feitiçaria", k:"Invocar Aery", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
      { quando:"vs engage pesado — precisa de mais defesas para você mesma", p:"Determinação", k:"Guardião", r1:"Regeneração", r2:"Condicionamento", r3:"Revitalizar", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    ],
    builds:[
      { quando:"padrão — enchanter", items:["Véu de Ardor","Botas de Iônia","Arco da Ardente","Arco Lunar Redentor","Promessa do Cavaleiro","Fortaleza de Redenção"], ini:"Relic Shield + Poção" },
      { quando:"vs dive — need mais tankiness para sobreviver e proteger", items:["Vigilância Locket","Botas de Mobilidade","Promessa do Cavaleiro","Arco da Ardente","Fortaleza de Redenção","Colosso de Anima"], ini:"Relic Shield + Poção" },
    ],
    sit:"Promessa do Cavaleiro obrigatória vs dive | W polymorph em carry inimigo no engage | R em carry ALIADO vs dive",
    f:["Flash","Ignite"],
    d:["Polymorph (W) em carry inimigo no engage","E shield: em carry ANTES de CC inimigo","R: knockup + HP enorme em carry — anti-dive perfeito"] },

  soraka: { nome:"Soraka", rota:"sup",
    runas:[
      { quando:"healing máximo e sustain (maioria dos jogos)", p:"Feitiçaria", k:"Invocar Aery", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Determinação", s1:"Fonte de Vida", s2:"Revitalizar", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
      { quando:"vs poke pesado — precisa de mais sustain para si mesma", p:"Determinação", k:"Guardião", r1:"Regeneração", r2:"Condicionamento", r3:"Revitalizar", s:"Feitiçaria", s1:"Manto de Nuvem", s2:"Transcendência", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    ],
    builds:[
      { quando:"padrão — heal máximo", items:["Caduceu de Rabadon","Botas de Iônia","Arco Lunar Redentor","Fortaleza de Redenção","Sceptro de Cristal de Rylai","Arco da Ardente"], ini:"Doran's Ring + Poção" },
      { quando:"vs dive — precisa sobreviver engages", items:["Caduceu de Rabadon","Botas de Mobilidade","Promessa do Cavaleiro","Arco Lunar Redentor","Fortaleza de Redenção","Colosso de Anima"], ini:"Doran's Ring + Poção" },
    ],
    sit:"Morellonomicon INIMIGO vs você — buy Redemption/Ardent early | Promessa do Cavaleiro vs dive | Caduceu de Rabadon primeiro sempre",
    f:["Flash","Ignite"],
    d:["Q hit → use W para mana de heal grátis","R global quando aliado dying em QUALQUER lane","E silence zone: interrupt dive/channeling"] },

  nami: { nome:"Nami", rota:"sup",
    runas:[
      { quando:"poke e sustain (maioria dos jogos)", p:"Feitiçaria", k:"Invocar Aery", r1:"Manto de Nuvem", r2:"Transcendência", r3:"Coleta de Tempestades", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
      { quando:"vs engage pesado (Leona/Blitz/Alistar) — precisa de mais defesa", p:"Determinação", k:"Guardião", r1:"Regeneração", r2:"Condicionamento", r3:"Revitalizar", s:"Inspiração", s1:"Entrega de Biscoitos", s2:"Perspicácia Cósmica", sh:["Velocidade de Habilidade","Armadura","Resistência Mágica"] },
    ],
    builds:[
      { quando:"padrão — enchanter", items:["Véu de Ardor","Botas de Iônia","Arco da Ardente","Arco Lunar Redentor","Fortaleza de Redenção","Sceptro de Cristal de Rylai"], ini:"Relic Shield + Poção" },
      { quando:"vs dive — need Locket + tankiness", items:["Vigilância Locket","Botas de Mobilidade","Arco da Ardente","Promessa do Cavaleiro","Fortaleza de Redenção","Arco Lunar Redentor"], ini:"Relic Shield + Poção" },
    ],
    sit:"Promessa do Cavaleiro vs dive | Sceptro de Rylai vs mobile carries | E: empowered autos do ADC = slow",
    f:["Flash","Ignite"],
    d:["Q bubble: lead do target (não onde está, onde vai)","E empowered autos do ADC com slow","R: use de flank para max chain knockup"] },
};

// ═══════════════════════════════════════════════════════════════════════════
// REGRAS ADAPTATIVAS GLOBAIS — aplica a QUALQUER campeão
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// CLASSE DE CADA CAMPEÃO — determina quais itens situacionais fazem sentido
// ═══════════════════════════════════════════════════════════════════════════
const CLASSE = {
  // AD carries (dano físico, itens de crit/AS — NUNCA AP)
  adc: ["jinx","caitlyn","jhin","ezreal","draven","varus","ashe","sivir","tristana",
        "twitch","kogmaw","xayah","kalista","aphelios","samira","nilah","zeri","smolder","graves","quinn"],
  // On-hit ADC (similar a adc mas com Guinsoo/Kraken)
  adc_onhit: ["kaisa","varus","kog maw","kogmaw","vayne"],
  // Magos (dano mágico — NUNCA itens AD como Lembrete Mortal)
  mago: ["lux","syndra","orianna","veigar","ahri","zoe","vel","xerath","anivia","annie",
         "malzahar","heimerdinger","neeko","ziggs","azir","viktor","cassiopeia","taliyah",
         "aurelionsol","hwei","ryze","lissandra","swain","brand","seraphine","karma",
         "morgana","zyra","sona","zilean"],
  // Assassinos AP (dano mágico mas burst — itens como Zhonya, nunca Lembrete Mortal)
  assassino_ap: ["fizz","ekko","katarina","akali","diana","evelynn","leblanc","qiyana",
                 "sylas","shaco","zed_ap","talon_ap"],
  // Assassinos AD (dano físico — NUNCA Morellonomicon)
  assassino_ad: ["zed","talon","khazix","rengar","nocturne","naafiri","kayn_red","akshan"],
  // Lutadores AD (bruisers físicos — anti-cura = Faca Chempunk ou Thornmail, NUNCA Morellonomicon)
  lutador: ["darius","garen","irelia","camille","fiora","jax","riven","renekton","tryndamere",
            "ambessa","aatrox","volibear","warwick","wukong","xinzhao","vi","jarvaniv",
            "kled","olaf","urgot","sett","yorick","illaoi","mordekaiser","gwen",
            "trundle","leesin","briar","belveth","nilah","yasuo","yone"],
  // Magos/Lutadores top (mistura — verificar caso a caso)
  mago_top: ["gwen","kennen","rumble","teemo","heimerdinger","singed","mordekaiser","swain"],
  // Tanks (compram armor/MR — anti-cura = Thornmail, NUNCA Morellonomicon)
  tank: ["malphite","maokai","ornn","chogath","sion","nautilus","leona","rell","amumu",
         "zac","sejuani","poppy","rammus","hecarim","udyr","nunu","skarner",
         "drmundo","nasus","tahm","volibear","garen","alistar","braum","blitzcrank"],
  // Enchanters (suporte heal/shield — itens de suporte, NUNCA Morellonomicon)
  enchanter: ["lulu","soraka","nami","janna","karma","sona","yuumi","milio","seraphine",
              "zilean","renata","bard","ivern"],
  // Suportes tank/engage
  sup_tank: ["thresh","leona","nautilus","blitzcrank","alistar","braum","rell","rakan",
             "pyke","morgana","brand","zyra","swain"],
};

// Retorna a classe do campeão
function getClasse(champName) {
  if (!champName) return null;
  const n = champName.toLowerCase().replace(/['\s]+/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  for (const [classe, lista] of Object.entries(CLASSE)) {
    if (lista.some(x => n.includes(x) || x.includes(n))) return classe;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESOLVER DE ITENS SITUACIONAIS — baseado em classe + time inimigo
// Calcula server-side para garantir que a IA não erre por ignorância de classe
// ═══════════════════════════════════════════════════════════════════════════
function resolverSituacionais(classe, enemies, allies) {
  const e = (enemies||"").toLowerCase();
  const situacionais = [];
  const alertas = [];

  // ── detectar ameaças no time inimigo ──
  const temCura = /soraka|yuumi|nami|sona|lulu|mundo|aatrox|warwick|irelia|sylas|swain|vladimir|olaf|gwen/.test(e);
  const temTanques = (e.match(/malphite|maokai|ornn|chogath|sion|zac|sejuani|poppy|rammus|leona|nautilus|blitzcrank|alistar|thresh|amumu|garen|nasus|drmundo/g)||[]).length >= 1;
  const muitosTanques = (e.match(/malphite|maokai|ornn|chogath|sion|zac|sejuani|poppy|rammus|leona|nautilus|blitzcrank|alistar|thresh|amumu|garen|nasus|drmundo/g)||[]).length >= 2;
  const temEscudos = /lulu|janna|karma|renata|seraphine|shen|orianna/.test(e);
  const temAssassinoAD = /zed|talon|rengar|khazix|kha.zix|nocturne|naafiri/.test(e);
  const temAssassinoAP = /fizz|leblanc|akali|diana|evelynn|katarina/.test(e);
  const temAPPesado = /malzahar|veigar|syndra|lux|orianna|xerath|vel.koz|anivia|annie/.test(e);
  const temCCLongo = /malzahar|nautilus|blitzcrank|leona|amumu|morgana|alistar/.test(e);
  const temFullAD = !/syndra|lux|orianna|xerath|vel|annie|veigar|malzahar|anivia|azir|cassio|aurelion|viktor|ziggs|hwei|ryze|zoe|neeko|rumble|mordekaiser|karma|brand|zyra|sona/.test(e);
  const temFullAP = !/darius|garen|zed|talon|jinx|caitlyn|jhin|ezreal|draven|graves|irelia|jax|riven|fiora|aatrox|ambessa|olaf|renekton|wukong|xinzhao|vi|jarvan|tryndamere|yasuo|yone|urgot|sett/.test(e);

  // ── regras por CLASSE ──
  if (["adc","adc_onhit"].includes(classe)) {
    // ADCs: dano físico — anti-cura é SEMPRE Lembrete Mortal (nunca Morellonomicon)
    if (temCura)
      situacionais.push("⚠️ ANTI-CURA: **Lembrete Mortal** (slot 4-5) — inimigos com cura pesada. NUNCA Morellonomicon pois você é AD");
    if (muitosTanques)
      situacionais.push("🛡️ ANTI-TANQUE: **Kraken Slayer** (se ainda não tem) + **Lembrete Mortal** para % HP dano");
    if (temEscudos)
      situacionais.push("🔰 ANTI-ESCUDO: **Serpentine Fang** (slot 3-4) vs Lulu/Janna/Karma no time inimigo");
    if (temAPPesado || temCCLongo)
      situacionais.push("🔵 VS AP PESADO: **Guardião Mortal** (slot 5-6) para resistência mágica");
    if (temFullAP)
      situacionais.push("🔵 TIME FULL AP: **Mercurial Scimitar** para tenacidade + MR + cleanse de CC");
    if (temAssassinoAD)
      situacionais.push("🗡️ VS ASSASSINO AD (Zed/Talon): jogue atrás do time, **Guardião Mortal** se levando muito burst");

  } else if (["mago","assassino_ap","mago_top"].includes(classe)) {
    // Magos/Assassinos AP: dano mágico — anti-cura é SEMPRE Morellonomicon (nunca Lembrete Mortal)
    if (temCura)
      situacionais.push("⚠️ ANTI-CURA: **Morellonomicon** (slot 3-4) — reduz cura de Soraka/Mundo/Aatrox. NUNCA Lembrete Mortal pois você é AP");
    if (muitosTanques)
      situacionais.push("🛡️ ANTI-TANQUE: **Bastão do Vazio** obrigatório vs 2+ tanques (penetração mágica %)");
    if (temEscudos)
      situacionais.push("🔰 ANTI-ESCUDO: **Anathema's Chains** não se aplica para magos — foco em dano raw com Bastão do Vazio");
    if (temAssassinoAD)
      situacionais.push("🗡️ VS ASSASSINO AD (Zed/Talon/Rengar): **Ampulheta de Zhonya** obrigatória, compre no 3° slot");
    if (temAPPesado || temCCLongo)
      situacionais.push("🔵 VS AP CC PESADO: **Véu da Banshee** (slot 4-5) bloqueia a primeira habilidade inimiga");
    if (temFullAD)
      situacionais.push("⚔️ TIME FULL AD: **Ampulheta de Zhonya** early pois o burst físico vai te matar");

  } else if (["assassino_ad"].includes(classe)) {
    // Assassinos AD: físico — anti-cura = Faca Chempunk (NUNCA Morellonomicon)
    if (temCura)
      situacionais.push("⚠️ ANTI-CURA: **Faca Chempunk Serrilhada** ou **Lembrete Mortal** — você é AD, NUNCA Morellonomicon");
    if (muitosTanques)
      situacionais.push("🛡️ ANTI-TANQUE: **Rancor de Serylda** para slow + armor pen vs tanques");
    if (temEscudos)
      situacionais.push("🔰 ANTI-ESCUDO: **Serpentine Fang** quebra shields de Lulu/Janna/Karma");
    if (temAPPesado || temCCLongo)
      situacionais.push("🔵 VS AP PESADO: **Véu de Morte** (para Zed) ou **Cimitarra Mercurial** para cleanse");
    if (temCCLongo)
      situacionais.push("🔵 VS CC LONGO: **Cimitarra Mercurial** para limpar suppressão/root");

  } else if (["lutador"].includes(classe)) {
    // Lutadores AD/mistura: anti-cura = Faca Chempunk ou Armadura de Espinhos
    if (temCura)
      situacionais.push("⚠️ ANTI-CURA: **Faca Chempunk Serrilhada** (slot 2-3) ou **Armadura de Espinhos** se você é tank — NUNCA Morellonomicon");
    if (muitosTanques)
      situacionais.push("🛡️ ANTI-TANQUE: **Lembrete Mortal** se você ataca de longe, **Faca Chempunk** se melee");
    if (temEscudos)
      situacionais.push("🔰 ANTI-ESCUDO: **Serpentine Fang** vs Lulu/Janna/Karma suporte");
    if (temAPPesado)
      situacionais.push("🔵 VS AP PESADO: **Força da Natureza** (slot 3-4) + **Botas de Mercúrio**");
    if (temCCLongo)
      situacionais.push("🔵 VS CC LONGO: **Cimitarra Mercurial** para cleanse ou **Botas de Mercúrio** para tenacidade");

  } else if (["tank"].includes(classe)) {
    // Tanks: anti-cura = Armadura de Espinhos (NUNCA Morellonomicon ou Lembrete Mortal)
    if (temCura)
      situacionais.push("⚠️ ANTI-CURA: **Armadura de Espinhos** — você é tank, este item reduz cura de quem te ataca. NUNCA Morellonomicon ou Lembrete Mortal");
    if (temFullAP)
      situacionais.push("🔵 TIME FULL AP: **Força da Natureza** + **Botas de Mercúrio** obrigatórios");
    if (temFullAD)
      situacionais.push("⚔️ TIME FULL AD: **Coração Congelado** + **Armadura de Espinhos** para armor máximo");
    if (temAPPesado)
      situacionais.push("🔵 VS MAGO PESADO: **Força da Natureza** + **Véu da Banshee** para sobreviver burst mágico");

  } else if (["enchanter","sup_tank"].includes(classe)) {
    // Suportes
    if (temCura && classe === "sup_tank")
      situacionais.push("⚠️ ANTI-CURA: **Executioner's Calling** (item barato) → upgradar para **Mortal Reminder** ou **Serpentine Fang** se AD suporte");
    if (muitosTanques)
      situacionais.push("🛡️ ANTI-TANQUE: **Fortaleza de Redenção** + **Sceptro de Rylai** para slow/damage extra");
    if (temAssassinoAD && classe === "enchanter")
      situacionais.push("🗡️ VS ASSASSINO: **Vigilância Locket** obrigatório para proteger você e o ADC");
  }

  // ── alertas de runa baseados na composição ──
  if (muitosTanques && !["tank","enchanter","sup_tank"].includes(classe))
    alertas.push("📌 RUNA: Prefira **Conquistador** sobre Eletrocutar vs 2+ tanques (dano sustentado > burst)");
  if (temCCLongo && !["tank"].includes(classe))
    alertas.push("📌 RUNA SECUNDÁRIA: Considere **Lenda: Tenacidade** vs muito CC inimigo");
  if (temAssassinoAD && ["mago","assassino_ap"].includes(classe))
    alertas.push("📌 RUNA: Considere **Manto de Nuvem** (secundária) vs assassino AD para 10s de invulnerabilidade");

  return { situacionais, alertas };
}

// Aliases de busca
const ALIASES = {
  "lee sin":"leesin","lee":"leesin","kata":"katarina","blitz":"blitzcrank",
  "cait":"caitlyn","yas":"yasuo","mf":"misfortune","miss fortune":"misfortune",
  "tf":"twistedfate","twisted fate":"twistedfate","j4":"jarvaniv","jarvan":"jarvaniv",
  "xin":"xinzhao","xin zhao":"xinzhao","kog":"kogmaw","kog maw":"kogmaw",
  "vel koz":"vel","velkoz":"vel","aurelion":"aurelionsol","aurelion sol":"aurelionsol",
  "dr mundo":"drmundo","dr. mundo":"drmundo","kha":"khazix","kha zix":"khazix",
  "rek sai":"reksai","k sante":"ksante","kai sa":"kaisa","tahm kench":"tahm",
  "bel veth":"belveth","cho gath":"chogath","cho":"chogath","renata glasc":"renata",
  "twisted":"twistedfate","master yi":"masteryi","yi":"masteryi","ww":"warwick",
  "heimer":"heimerdinger","dinger":"heimerdinger","karth":"karthus","nunu":"nunu",
  "leona":"leona","thresh":"thresh","jinx":"jinx","ahri":"ahri","zed":"zed",
  "katarina":"katarina","syndra":"syndra","veigar":"veigar","ekko":"ekko",
  "yasuo":"yasuo","fizz":"fizz","caitlyn":"caitlyn","ezreal":"ezreal","jhin":"jhin",
  "kaisa":"kaisa","leesin":"leesin","amumu":"amumu","graves":"graves",
  "khazix":"khazix","hecarim":"hecarim","kayn":"kayn","lulu":"lulu",
  "soraka":"soraka","nami":"nami","blitzcrank":"blitzcrank","nautilus":"nautilus",
};

function findChamp(name) {
  if (!name) return null;
  const raw = name.toLowerCase().trim();
  const k = raw.replace(/['\s]+/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return C[k] || C[ALIASES[raw]] || C[ALIASES[k]] || null;
}

function formatChamp(ch) {
  const lines = [`CAMPEÃO: ${ch.nome} | ROTA: ${ch.rota.toUpperCase()}`];
  lines.push("\n── PATHS DE RUNA (escolha conforme o time inimigo) ──");
  ch.runas.forEach((r,i) => {
    lines.push(`\nOPÇÃO ${i+1} [usar quando: ${r.quando}]`);
    lines.push(`  Primária: ${r.p} | Keystone: ${r.k}`);
    lines.push(`  Slot 1: ${r.r1} | Slot 2: ${r.r2} | Slot 3: ${r.r3}`);
    lines.push(`  Secundária: ${r.s} | ${r.s1} | ${r.s2}`);
    lines.push(`  Shards: ${r.sh.join(" | ")}`);
  });
  lines.push("\n── PATHS DE BUILD (escolha conforme o time inimigo) ──");
  ch.builds.forEach((b,i) => {
    lines.push(`\nBUILD ${i+1} [usar quando: ${b.quando}]`);
    b.items.forEach((item,idx) => lines.push(`  ${idx+1}. ${item}`));
    lines.push(`  Iniciais: ${b.ini}`);
  });
  lines.push(`\n── ITENS SITUACIONAIS ──\n  ${ch.sit}`);
  lines.push(`\nFEITIÇOS PADRÃO: ${ch.f.join(" + ")}`);
  lines.push(`\nDICAS MECÂNICAS:\n${ch.d.map(d=>"• "+d).join("\n")}`);
  return lines.join("\n");
}

let ddVer = "atual", ddLast = 0;
async function getPatch() {
  if (ddVer !== "atual" && Date.now()-ddLast < 6*3600000) return ddVer;
  try {
    const r = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json",{timeout:6000});
    ddVer = r.data[0]; ddLast = Date.now();
  } catch {}
  return ddVer;
}

app.get("/", async (req,res) => {
  const patch = await getPatch();
  res.json({ status:"Nexus Oracle online", patch, campeoes_com_multiplos_builds: Object.keys(C).length });
});

// ── POST /oracle — análise adaptativa baseada no time inimigo ──
app.post("/oracle", async (req,res) => {
  try {
    const { question, context={} } = req.body;
    if (!question) return res.status(400).json({ error:"question ausente" });
    const { champion="", role="", allies="não informado", enemies="não informado", bans="não informado" } = context;
    const patch = await getPatch();

    let champKey = champion.toLowerCase().replace(/['\s]+/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    if (!C[champKey]) {
      const lower = question.toLowerCase();
      champKey = Object.keys(C).find(k => lower.includes(k))
        || (Object.keys(ALIASES).find(k=>lower.includes(k)) ? ALIASES[Object.keys(ALIASES).find(k=>lower.includes(k))] : "")
        || "";
    }
    const champData = findChamp(champKey) || findChamp(champion);

    // ── Detecta classe e calcula itens situacionais corretos ANTES da IA ──
    const classe = getClasse(champData?.nome || champion);
    const { situacionais, alertas } = resolverSituacionais(classe, enemies, allies);

    const isBestPick = /melhor pick|melhor campe|qual pick|counter|composição|composicao|what pick|best pick/i.test(question);

    const champBlock = champData
      ? formatChamp(champData)
      : `Campeão "${champion||"não especificado"}" não está no banco local. Classe detectada: ${classe||"desconhecida"}. Use conhecimento do patch ${patch}.`;

    const situBlock = situacionais.length
      ? `\n═══ ITENS SITUACIONAIS PRÉ-CALCULADOS (USE EXATAMENTE ESTES) ═══\nClasse do campeão: ${classe||"desconhecida"}\n${situacionais.join("\n")}\n${alertas.length ? "\nALERTAS DE RUNA:\n"+alertas.join("\n") : ""}\n\nIMPORTANTE: Os itens acima foram calculados especificamente para a CLASSE deste campeão. Não sugira itens de outra classe (ex: nunca Morellonomicon para AD, nunca Lembrete Mortal para AP).`
      : `\nClasse do campeão: ${classe||"desconhecida"}\nNenhuma ameaça crítica detectada — use a build padrão do banco.`;

    const bestPickInstructions = isBestPick ? `
═══ FORMATO PARA MELHOR PICK ═══
Responda com este formato destacado:

🏆 MELHOR PICK PARA ESSA COMPOSIÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**[CAMPEÃO RECOMENDADO]** — [Rota]

✅ POR QUÊ É O MELHOR:
• [razão 1 conectada ao time aliado]
• [razão 2 conectada aos inimigos]
• [sinergia com aliados]

⚔️ COMO VENCE OS INIMIGOS:
• [matchup vs inimigo principal]
• [como lida com a ameaça maior]

🔄 ALTERNATIVAS (se o pick principal for banido):
• 2° opção: [campeão] — [motivo breve]
• 3° opção: [campeão] — [motivo breve]

❌ EVITE: [campeões que não funcionam nessa comp] — [motivo]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : "";

    const prompt = `Você é um coach Challenger de League of Legends no patch ${patch}.

═══ DADOS DO CAMPEÃO ═══
${champBlock}

${situBlock}

${bestPickInstructions}

═══ CONTEXTO DA PARTIDA ═══
Rota: ${role||"n/a"}
Meu time: ${allies}
Time INIMIGO: ${enemies}
Bans: ${bans}

═══ SUA TAREFA ═══
1. Analise o time INIMIGO acima
2. Identifique ameaças (tanques? carries? cura? CC? assassinos? poke? escudos?)
3. Escolha O MELHOR path de runa e build para ESSA partida
4. Use os itens situacionais PRÉ-CALCULADOS acima — eles já estão corretos para a classe do campeão
5. Explique BREVEMENTE por que cada escolha se aplica aos inimigos listados

Responda em português brasileiro.
Pergunta: ${question}`;

    const resp = await axios.post("https://api.groq.com/openai/v1/chat/completions",
      { model:"llama-3.3-70b-versatile", max_tokens:1100, temperature:0.15,
        messages:[
          { role:"system", content:`Coach Challenger de LoL. REGRA CRÍTICA: respeite sempre a classe do campeão ao sugerir itens situacionais. Classe "${classe||"desconhecida"}": ${
            classe==="adc"||classe==="adc_onhit" ? "campeão AD — anti-cura = Lembrete Mortal, NUNCA Morellonomicon" :
            classe==="mago"||classe==="assassino_ap"||classe==="mago_top" ? "campeão AP — anti-cura = Morellonomicon, NUNCA Lembrete Mortal" :
            classe==="assassino_ad" ? "assassino AD — anti-cura = Faca Chempunk/Lembrete Mortal, NUNCA Morellonomicon" :
            classe==="lutador" ? "lutador físico — anti-cura = Faca Chempunk ou Thornmail, NUNCA Morellonomicon" :
            classe==="tank" ? "tank — anti-cura = Armadura de Espinhos, NUNCA Morellonomicon ou Lembrete Mortal" :
            "respeite a classe ao sugerir itens"
          }. Responda em português brasileiro.` },
          { role:"user", content:prompt }
        ] },
      { headers:{ Authorization:`Bearer ${GROQ_KEY}`, "Content-Type":"application/json" }, timeout:30000 }
    );
    res.json({ text: resp.data.choices[0].message.content, patch, classe });
  } catch(e) {
    const d = e.response?.data||e.message;
    console.log("ERRO /oracle:", JSON.stringify(d));
    res.status(500).json({ error: JSON.stringify(d) });
  }
});

// ── POST /analyze — visão ao vivo ──
app.post("/analyze", async (req,res) => {
  try {
    const { image, context={}, gameTime } = req.body;
    if (!image) return res.status(400).json({ error:"image ausente" });
    const { allies="", enemies="", champion="" } = context;
    const patch = await getPatch();
    const min = parseInt(gameTime)||0;

    const tips = [];
    if (min>=1&&min<=2) tips.push("Plante sentinela no tribush ou rio lateral");
    if (min>=3&&min<=4) tips.push("Jungle inimigo pode estar no camp vermelho — ward no rio");
    if (min>=5&&min<=6) tips.push("Primeiro dragão disponível — pressione bot ou prepare vision");
    if (min>=8&&min<=10) tips.push("Segundo drag em breve — roaming jungle provável");
    if (min>=14&&min<=16) tips.push("Dragão da Alma disponível — prioridade máxima de objetivo");
    if (min>=20) tips.push("Barão Nashor ativo — ward pixel brush e entrada do pit");
    if (min>=25) tips.push("Late game: não ande sozinho sem vision, agrupe para objetivos");

    const prompt = `Coach Challenger analisando screenshot ao vivo. Patch ${patch}. Campeão: ${champion}. Aliados: ${allies}. Inimigos: ${enemies}. Minuto: ${min}.
${tips.length?"\nDICAS PARA ESSE MINUTO:\n"+tips.map(t=>"• "+t).join("\n"):""}

Analise o screenshot e retorne APENAS JSON:
{"acao":"instrução em até 7 palavras","urgencia":"alta|media|baixa","detalhes":"1 frase do que você viu na tela","observacoes":["dica1","dica2"]}
Urgência: alta=vida<30% ou inimigo atacando|media=objetivo disponível|baixa=estável`;

    const resp = await axios.post("https://api.groq.com/openai/v1/chat/completions",
      { model:"meta-llama/llama-4-scout-17b-16e-instruct", max_tokens:220, temperature:0.1,
        messages:[{role:"user",content:[{type:"text",text:prompt},{type:"image_url",image_url:{url:`data:image/jpeg;base64,${image}`}}]}] },
      { headers:{ Authorization:`Bearer ${GROQ_KEY}`, "Content-Type":"application/json" }, timeout:12000 }
    );

    const raw = resp.data.choices[0].message.content;
    let parsed;
    try { const m = raw.match(/\{[\s\S]*\}/); parsed = JSON.parse(m?m[0]:raw); }
    catch { parsed = { acao:"Analisando...", urgencia:"baixa", detalhes:raw.slice(0,150), observacoes:[] }; }
    res.json(parsed);
  } catch(e) {
    const d = e.response?.data||e.message;
    console.log("ERRO /analyze:", JSON.stringify(d));
    res.status(500).json({ error: JSON.stringify(d) });
  }
});

getPatch().catch(()=>{});
app.listen(3000, ()=>console.log("Nexus Oracle rodando"));
