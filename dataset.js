export const D = {
  ahri: {
    name: 'Ahri', role: 'mid', cls: 'mago',
    vs: { akali: 52, yasuo: 53, zed: 51, syndra: 50, vex: 49, lissandra: 48, akshan: 50 },
    syn: { vi: 5, nautilus: 4, leona: 4, wukong: 3, jarvaniv: 4, sejuani: 4, orianna: 2 },
    tags: { engage: 1, peel: 1, poke: 2, scaling: 2, lanePrio: 3, roam: 3, sideLane: 1, teamfight: 2, pick: 3, antiDive: 1, execution: 2 },
    damage: { ap: 3, ad: 0, true: 0 },
    profile: { blind: 3, counterpick: 2, safe: 3, snowball: 2 },
    runes: { key: 'Electrocute', p: 'Domination', r1: 'Taste of Blood', r2: 'Eyeball Collection', r3: 'Treasure Hunter', s: 'Sorcery', s1: 'Nimbus Cloak', s2: 'Transcendence', sh: ['Adaptive Force','Adaptive Force','Magic Resist'] },
    build: ["Sorcerer's Shoes", 'Luden\'s Companion', 'Shadowflame', "Zhonya's Hourglass", 'Rabadon\'s Deathcap', 'Void Staff'],
    ini: "Doran's Ring + Health Potion", f: ['Flash','Ignite'],
    d: ['Use early push to create roam windows', 'Play for pick setup with jungle before objectives', 'Charm can disengage as well as start fights']
  },
  akali: {
    name: 'Akali', role: 'mid', cls: 'assassino_ap',
    vs: { ahri: 48, yasuo: 50, zed: 52, syndra: 51, vex: 47, lissandra: 45, akshan: 49 },
    syn: { vi: 4, wukong: 3, sejuani: 4, rell: 3, rakan: 2 },
    tags: { engage: 2, peel: 0, poke: 0, scaling: 2, lanePrio: 1, roam: 2, sideLane: 3, teamfight: 1, pick: 3, antiDive: 0, execution: 3 },
    damage: { ap: 3, ad: 0, true: 0 },
    profile: { blind: 1, counterpick: 3, safe: 1, snowball: 3 },
    runes: { key: 'Conqueror', p: 'Precision', r1: 'Presence of Mind', r2: 'Legend: Haste', r3: 'Last Stand', s: 'Resolve', s1: 'Second Wind', s2: 'Overgrowth', sh: ['Adaptive Force','Adaptive Force','Armor'] },
    build: ["Sorcerer's Shoes", 'Lich Bane', "Zhonya's Hourglass", 'Shadowflame', 'Rabadon\'s Deathcap', 'Void Staff'],
    ini: "Doran's Shield + Health Potion", f: ['Flash','Ignite'],
    d: ['Respect lane control until key cooldowns are down', 'Look for side-lane picks after level 6', 'Do not force first objective if you cannot flank']
  },
  akshan: {
    name: 'Akshan', role: 'mid', cls: 'assassino_ad',
    vs: { ahri: 50, akali: 51, yasuo: 48, zed: 49, syndra: 53, vex: 52, lissandra: 46 },
    syn: { jarvaniv: 3, vi: 2, nautilus: 3, renataglasc: 2 },
    tags: { engage: 0, peel: 0, poke: 2, scaling: 1, lanePrio: 3, roam: 3, sideLane: 2, teamfight: 1, pick: 2, antiDive: 0, execution: 2 },
    damage: { ap: 0, ad: 3, true: 0 },
    profile: { blind: 2, counterpick: 2, safe: 1, snowball: 3 },
    runes: { key: 'Press the Attack', p: 'Precision', r1: 'Presence of Mind', r2: 'Legend: Alacrity', r3: 'Coup de Grace', s: 'Resolve', s1: 'Bone Plating', s2: 'Overgrowth', sh: ['Attack Speed','Adaptive Force','Armor'] },
    build: ["Berserker's Greaves", 'Statikk Shiv', 'Infinity Edge', 'Lord Dominik\'s Regards', 'Rapid Firecannon', 'Guardian Angel'],
    ini: "Doran's Blade + Health Potion", f: ['Flash','Ignite'],
    d: ['Use lane priority to move first to river fights', 'Punish low-range mages with repeated short trades', 'Snowball windows matter more than pure scaling']
  },
  lissandra: {
    name: 'Lissandra', role: 'mid', cls: 'mago',
    vs: { ahri: 52, akali: 55, yasuo: 54, zed: 56, syndra: 49, vex: 50, akshan: 52 },
    syn: { vi: 5, sejuani: 5, wukong: 4, rell: 4, nautilus: 4, orianna: 2 },
    tags: { engage: 3, peel: 2, poke: 0, scaling: 2, lanePrio: 2, roam: 2, sideLane: 0, teamfight: 3, pick: 3, antiDive: 3, execution: 1 },
    damage: { ap: 3, ad: 0, true: 0 },
    profile: { blind: 2, counterpick: 3, safe: 3, snowball: 1 },
    runes: { key: 'Aftershock', p: 'Resolve', r1: 'Demolish', r2: 'Second Wind', r3: 'Overgrowth', s: 'Inspiration', s1: 'Biscuit Delivery', s2: 'Cosmic Insight', sh: ['Adaptive Force','Adaptive Force','Armor'] },
    build: ["Sorcerer's Shoes", 'Malignance', "Zhonya's Hourglass", 'Shadowflame', 'Rabadon\'s Deathcap', 'Void Staff'],
    ini: "Doran's Ring + Health Potion", f: ['Flash','Teleport'],
    d: ['Excellent answer into dive and melee-heavy comps', 'Coordinate your engage with jungle/support timing', 'You trade some carry ceiling for much higher draft stability']
  },
  syndra: {
    name: 'Syndra', role: 'mid', cls: 'mago',
    vs: { ahri: 50, akali: 49, yasuo: 46, zed: 47, vex: 52, lissandra: 51, akshan: 48 },
    syn: { vi: 4, jarvaniv: 3, nautilus: 3, rell: 3 },
    tags: { engage: 0, peel: 1, poke: 3, scaling: 3, lanePrio: 3, roam: 1, sideLane: 0, teamfight: 2, pick: 2, antiDive: 1, execution: 2 },
    damage: { ap: 3, ad: 0, true: 0 },
    profile: { blind: 3, counterpick: 2, safe: 2, snowball: 2 },
    runes: { key: 'First Strike', p: 'Inspiration', r1: 'Magical Footwear', r2: 'Biscuit Delivery', r3: 'Cosmic Insight', s: 'Sorcery', s1: 'Manaflow Band', s2: 'Transcendence', sh: ['Adaptive Force','Adaptive Force','Magic Resist'] },
    build: ["Sorcerer's Shoes", 'Luden\'s Companion', 'Shadowflame', 'Rabadon\'s Deathcap', 'Void Staff', "Zhonya's Hourglass"],
    ini: "Doran's Ring + Health Potion", f: ['Flash','Teleport'],
    d: ['Play for lane control and objective setup', 'Keep track of flash timers for burst windows', 'High value when your comp already has frontline']
  },
  vex: {
    name: 'Vex', role: 'mid', cls: 'mago',
    vs: { ahri: 51, akali: 54, yasuo: 53, zed: 52, syndra: 48, lissandra: 49, akshan: 51 },
    syn: { vi: 4, sejuani: 3, wukong: 3, nautilus: 3 },
    tags: { engage: 2, peel: 1, poke: 1, scaling: 2, lanePrio: 2, roam: 2, sideLane: 0, teamfight: 2, pick: 2, antiDive: 2, execution: 1 },
    damage: { ap: 3, ad: 0, true: 0 },
    profile: { blind: 2, counterpick: 2, safe: 2, snowball: 2 },
    runes: { key: 'Electrocute', p: 'Domination', r1: 'Taste of Blood', r2: 'Eyeball Collection', r3: 'Ultimate Hunter', s: 'Sorcery', s1: 'Manaflow Band', s2: 'Transcendence', sh: ['Adaptive Force','Adaptive Force','Armor'] },
    build: ["Sorcerer's Shoes", 'Luden\'s Companion', 'Shadowflame', "Zhonya's Hourglass", 'Rabadon\'s Deathcap', 'Void Staff'],
    ini: "Doran's Ring + Health Potion", f: ['Flash','Ignite'],
    d: ['Very strong versus dash-heavy enemies', 'Look for fear resets around skirmishes', 'Safer than most assassins when your comp lacks peel']
  },
  yasuo: {
    name: 'Yasuo', role: 'mid', cls: 'lutador',
    vs: { ahri: 47, akali: 50, syndra: 54, vex: 46, lissandra: 45, akshan: 52, zed: 50 },
    syn: { malphite: 6, wukong: 5, rakan: 4, nautilus: 3, gragas: 4, diana: 4, jarvaniv: 4 },
    tags: { engage: 2, peel: 0, poke: 0, scaling: 2, lanePrio: 2, roam: 2, sideLane: 2, teamfight: 2, pick: 1, antiDive: 0, execution: 3 },
    damage: { ap: 0, ad: 3, true: 0 },
    profile: { blind: 1, counterpick: 3, safe: 1, snowball: 3 },
    runes: { key: 'Conqueror', p: 'Precision', r1: 'Triumph', r2: 'Legend: Alacrity', r3: 'Last Stand', s: 'Resolve', s1: 'Second Wind', s2: 'Unflinching', sh: ['Attack Speed','Adaptive Force','Armor'] },
    build: ["Berserker's Greaves", 'Blade of the Ruined King', 'Infinity Edge', 'Immortal Shieldbow', 'Death\'s Dance', 'Guardian Angel'],
    ini: "Doran's Blade + Health Potion", f: ['Flash','Ignite'],
    d: ['Requires setup or comp synergy to be premium', 'Punishes projectile and range-reliant mids hard', 'Execution burden is high, especially in blind spots of draft']
  },
  zed: {
    name: 'Zed', role: 'mid', cls: 'assassino_ad',
    vs: { ahri: 49, akali: 48, syndra: 53, vex: 47, lissandra: 44, akshan: 51, yasuo: 50 },
    syn: { sejuani: 2, vi: 4, jarvaniv: 4, nautilus: 3, pyke: 3 },
    tags: { engage: 1, peel: 0, poke: 1, scaling: 1, lanePrio: 2, roam: 3, sideLane: 3, teamfight: 1, pick: 3, antiDive: 0, execution: 3 },
    damage: { ap: 0, ad: 3, true: 0 },
    profile: { blind: 1, counterpick: 3, safe: 1, snowball: 3 },
    runes: { key: 'Electrocute', p: 'Domination', r1: 'Sudden Impact', r2: 'Eyeball Collection', r3: 'Ultimate Hunter', s: 'Sorcery', s1: 'Nimbus Cloak', s2: 'Transcendence', sh: ['Adaptive Force','Adaptive Force','Armor'] },
    build: ['Ionian Boots of Lucidity', 'Profane Hydra', 'Serylda\'s Grudge', 'Edge of Night', 'Opportunity', 'Guardian Angel'],
    ini: "Long Sword + Refillable Potion", f: ['Flash','Ignite'],
    d: ['Value rises when enemy draft lacks peel', 'Excellent tempo in solo queue, riskier in structured comps', 'Do not blind into point-click lockdown unless comfort is high']
  },
  vi: { name: 'Vi', role: 'jungle', cls: 'lutador', tags: { engage: 3, peel: 1, poke: 0, scaling: 1, lanePrio: 0, roam: 3, sideLane: 0, teamfight: 2, pick: 3, antiDive: 1, execution: 1 }, damage:{ad:3, ap:0, true:0}, profile:{blind:2,counterpick:1,safe:2,snowball:2}, runes:{}, build:[], ini:'', f:[], d:[] },
  nautilus: { name: 'Nautilus', role: 'support', cls: 'sup_engage', tags: { engage: 3, peel: 2, poke: 0, scaling: 1, lanePrio: 0, roam: 2, sideLane: 0, teamfight: 2, pick: 3, antiDive: 2, execution: 1 }, damage:{ad:0, ap:1, true:0}, profile:{blind:3,counterpick:1,safe:3,snowball:1}, runes:{}, build:[], ini:'', f:[], d:[] },
  sejuani: { name: 'Sejuani', role: 'jungle', cls: 'tank', tags: { engage: 3, peel: 2, poke: 0, scaling: 2, lanePrio: 0, roam: 2, sideLane: 0, teamfight: 3, pick: 2, antiDive: 2, execution: 1 }, damage:{ad:0, ap:1, true:0}, profile:{blind:3,counterpick:1,safe:3,snowball:1}, runes:{}, build:[], ini:'', f:[], d:[] },
  orianna: { name: 'Orianna', role: 'mid', cls: 'mago', tags: { engage: 1, peel: 2, poke: 2, scaling: 3, lanePrio: 2, roam: 1, sideLane: 0, teamfight: 3, pick: 1, antiDive: 2, execution: 2 }, damage:{ap:3, ad:0, true:0}, profile:{blind:3,counterpick:2,safe:3,snowball:1}, runes:{}, build:[], ini:'', f:[], d:[] },
  jarvaniv: { name: 'Jarvan IV', role: 'jungle', cls: 'lutador', tags: { engage: 3, peel: 1, poke: 0, scaling: 1, lanePrio: 0, roam: 3, sideLane: 0, teamfight: 2, pick: 2, antiDive: 1, execution: 1 }, damage:{ad:3, ap:0, true:0}, profile:{blind:3,counterpick:1,safe:2,snowball:2}, runes:{}, build:[], ini:'', f:[], d:[] },
  wukong: { name: 'Wukong', role: 'jungle', cls: 'lutador', tags: { engage: 3, peel: 1, poke: 0, scaling: 2, lanePrio: 0, roam: 2, sideLane: 1, teamfight: 3, pick: 2, antiDive: 1, execution: 1 }, damage:{ad:3, ap:0, true:0}, profile:{blind:2,counterpick:2,safe:2,snowball:2}, runes:{}, build:[], ini:'', f:[], d:[] },
  leona: { name: 'Leona', role: 'support', cls: 'sup_engage', tags: { engage: 3, peel: 1, poke: 0, scaling: 1, lanePrio: 0, roam: 2, sideLane: 0, teamfight: 2, pick: 3, antiDive: 2, execution: 1 }, damage:{ad:0, ap:0, true:0}, profile:{blind:3,counterpick:1,safe:3,snowball:1}, runes:{}, build:[], ini:'', f:[], d:[] }
};

export const ALIASES = {
  ahri: 'ahri', akali: 'akali', akshan: 'akshan', lissandra: 'lissandra', syndra: 'syndra', vex: 'vex', yasuo: 'yasuo', zed: 'zed',
  vi: 'vi', nautilus: 'nautilus', sejuani: 'sejuani', orianna: 'orianna', jarvaniv: 'jarvaniv', jarvan4: 'jarvaniv', jarvan: 'jarvaniv', wukong: 'wukong', leona: 'leona'
};

export function findChamp(name='') {
  const key = String(name).toLowerCase().replace(/[^a-z0-9]/g,'');
  const alias = ALIASES[key] || key;
  return D[alias] || null;
}
