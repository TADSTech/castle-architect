import { STRUCTURE_COSTS, TIER2_UPGRADE_COSTS } from './balance.js';

// Castle pieces. `hidden` marks values the player is never told about directly.
export const BUILDINGS = {
  keep: {
    key: 'keep', name: 'Keep', glyph: 'K',
    cost: STRUCTURE_COSTS.keep.cost, hp: STRUCTURE_COSTS.keep.hp, walkable: false, aggro: 6,
    unlockAt: 0, tall: 3,
    blurb: 'Your seat of power. Lose it and the realm falls.',
  },
  wall: {
    key: 'wall', name: 'Wall', glyph: '#',
    cost: STRUCTURE_COSTS.wall.cost, hp: STRUCTURE_COSTS.wall.hp, walkable: false, aggro: 1,
    unlockAt: 0, tall: 1,
    blurb: 'Cheap. Stronger the more of them stand together.',
  },
  tower: {
    key: 'tower', name: 'Tower', glyph: 'T',
    cost: STRUCTURE_COSTS.tower.cost, hp: STRUCTURE_COSTS.tower.hp, walkable: false, aggro: 3,
    unlockAt: 0, tall: 2,
    range: STRUCTURE_COSTS.tower.range || 195, damage: STRUCTURE_COSTS.tower.damage || 10,
    cooldown: STRUCTURE_COSTS.tower.cooldown || 760, projectileSpeed: 620,
    blurb: 'Fires on anything that comes near.',
  },
  moat: {
    key: 'moat', name: 'Moat', glyph: '~',
    cost: STRUCTURE_COSTS.moat.cost, hp: STRUCTURE_COSTS.moat.hp, walkable: true, aggro: 0,
    unlockAt: 1, tall: 0,
    blurb: 'Flooded ground. Things cross it slowly, and bleed.',
  },
  trap: {
    key: 'trap', name: 'Trap', glyph: 'x',
    cost: STRUCTURE_COSTS.trap.cost, hp: STRUCTURE_COSTS.trap.hp, walkable: true, aggro: 0,
    unlockAt: 1, tall: 0, armMs: 350,
    damage: STRUCTURE_COSTS.trap.damage || 62, radius: STRUCTURE_COSTS.trap.radius || 104,
    blurb: 'Buried. Springs when something walks over it.',
  },
  gate: {
    key: 'gate', name: 'Gate', glyph: '=',
    cost: STRUCTURE_COSTS.gate.cost, hp: STRUCTURE_COSTS.gate.hp, walkable: true, aggro: 0,
    unlockAt: 2, tall: 1,
    blurb: 'An opening. They will choose it if you leave one.',
  },
  cannon: {
    key: 'cannon', name: 'Cannon', glyph: 'O',
    cost: STRUCTURE_COSTS.cannon.cost, hp: STRUCTURE_COSTS.cannon.hp, walkable: false, aggro: 4,
    unlockAt: 4, tall: 2,
    range: STRUCTURE_COSTS.cannon.range || 300, damage: STRUCTURE_COSTS.cannon.damage || 40,
    cooldown: STRUCTURE_COSTS.cannon.cooldown || 2300, projectileSpeed: 420,
    splash: STRUCTURE_COSTS.cannon.splash || 74,
    blurb: 'Devastating. Needs something solid to sit behind.',
  },
};

export const UPGRADED_BUILDINGS = {
  wall: {
    tier: 2, name: 'Iron Wall',
    cost: TIER2_UPGRADE_COSTS.wall.cost, hp: TIER2_UPGRADE_COSTS.wall.hp,
    blurb: 'Spiked iron reinforcement. Reflects 35% melee damage back to attackers.',
  },
  tower: {
    tier: 2, name: 'Ballista',
    cost: TIER2_UPGRADE_COSTS.tower.cost, hp: TIER2_UPGRADE_COSTS.tower.hp,
    range: TIER2_UPGRADE_COSTS.tower.range || 250, damage: TIER2_UPGRADE_COSTS.tower.damage || 24,
    cooldown: TIER2_UPGRADE_COSTS.tower.cooldown || 560, projectileSpeed: 850,
    blurb: 'Heavy piercing bolt that cuts through lines of enemies.',
  },
  cannon: {
    tier: 2, name: 'Cluster Mortar',
    cost: TIER2_UPGRADE_COSTS.cannon.cost, hp: TIER2_UPGRADE_COSTS.cannon.hp,
    range: TIER2_UPGRADE_COSTS.cannon.range || 350, damage: TIER2_UPGRADE_COSTS.cannon.damage || 70,
    cooldown: TIER2_UPGRADE_COSTS.cannon.cooldown || 1900, projectileSpeed: 480,
    splash: TIER2_UPGRADE_COSTS.cannon.splash || 115,
    blurb: 'High-arc explosive mortar shell with colossal splash radius.',
  },
  moat: {
    tier: 2, name: 'Burning Pitch',
    cost: TIER2_UPGRADE_COSTS.moat.cost, hp: TIER2_UPGRADE_COSTS.moat.hp,
    blurb: 'Boiling tar ditch. Ignites all crossing foes with heavy burning damage.',
  },
  gate: {
    tier: 2, name: 'Iron Portcullis',
    cost: TIER2_UPGRADE_COSTS.gate.cost, hp: TIER2_UPGRADE_COSTS.gate.hp,
    blurb: 'Heavy iron gate with murder-holes. Crushes intruders and slows them down to a crawl.',
  },
  trap: {
    tier: 2, name: 'Spike Pit',
    cost: TIER2_UPGRADE_COSTS.trap.cost, hp: TIER2_UPGRADE_COSTS.trap.hp,
    damage: TIER2_UPGRADE_COSTS.trap.damage || 125, radius: TIER2_UPGRADE_COSTS.trap.radius || 125,
    blurb: 'Deep spiked pit trap that obliterates heavy brutes and sappers.',
  },
};

// Palette slot order. Keep is always first (it is mandatory).
export const PALETTE_ORDER = ['keep', 'wall', 'tower', 'moat', 'trap', 'gate', 'cannon'];

// Hidden interactions. Never printed as a rules list — only as flavour toasts.
export const SYNERGIES = {
  chain: {
    name: 'The stones lock together.',
    text: 'A wall flanked by two or more walls doubles its plating.',
  },
  embrasure: {
    name: 'Braced emplacement.',
    text: 'A tower resting on a wall fires further and faster.',
  },
  mount: {
    name: 'The cannon awaits a mount.',
    text: 'A cannon with no wall or tower beside it is only a very expensive rock.',
  },
  funnel: {
    name: 'They march through your open gate.',
    text: 'Enemies crossing a gate are marked — they take half again as much damage.',
  },
  deep: {
    name: 'Dragged under.',
    text: 'Cannon fire splashes harder against anything slowed by the moat.',
  },
  domino: {
    name: 'Chain of sparks.',
    text: 'A detonating trap sets off every trap within reach.',
  },
  laststand: {
    name: 'The Keep’s last stand.',
    text: 'When the Keep is burning, every tower fights twice as hard.',
  },
  heartwall: {
    name: 'The court is walled.',
    text: 'A Keep hemmed in by two or more walls gains plating.',
  },
  exposed: {
    name: 'They came for the tall thing.',
    text: 'Towers and cannons are prioritised when a path has to be broken.',
  },
};
