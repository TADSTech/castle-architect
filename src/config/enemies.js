import { ENEMY_BASE_STATS, DIFFICULTY_CONFIG } from './balance.js';

export const ENEMIES = {
  raider: {
    key: 'raider', name: 'Raider',
    hp: ENEMY_BASE_STATS.raider.hp, speed: ENEMY_BASE_STATS.raider.speed,
    damage: ENEMY_BASE_STATS.raider.damage, buildDmg: ENEMY_BASE_STATS.raider.damage,
    gold: ENEMY_BASE_STATS.raider.gold,
    size: 22, color: 0xc9563f, accent: 0x7d2f22, flyer: false,
    blurb: 'Rank and file. They die to a stiff breeze.',
  },
  runner: {
    key: 'runner', name: 'Runner',
    hp: ENEMY_BASE_STATS.runner.hp, speed: ENEMY_BASE_STATS.runner.speed,
    damage: ENEMY_BASE_STATS.runner.damage, buildDmg: ENEMY_BASE_STATS.runner.damage,
    gold: ENEMY_BASE_STATS.runner.gold,
    size: 18, color: 0xe8b73a, accent: 0x9b7c2a, flyer: false,
    blurb: 'Fast and fragile. Slows down nothing.',
  },
  brute: {
    key: 'brute', name: 'Brute',
    hp: ENEMY_BASE_STATS.brute.hp, speed: ENEMY_BASE_STATS.brute.speed,
    damage: ENEMY_BASE_STATS.brute.damage, buildDmg: Math.round(ENEMY_BASE_STATS.brute.damage * 1.15),
    gold: ENEMY_BASE_STATS.brute.gold,
    size: 28, color: 0x8f5fd6, accent: 0x4b2f80, flyer: false,
    blurb: 'Slow, patient, and very good at tearing stone.',
  },
  sapper: {
    key: 'sapper', name: 'Sapper',
    hp: ENEMY_BASE_STATS.sapper.hp, speed: ENEMY_BASE_STATS.sapper.speed,
    damage: ENEMY_BASE_STATS.sapper.damage, buildDmg: Math.round(ENEMY_BASE_STATS.sapper.damage * 4.2),
    gold: ENEMY_BASE_STATS.sapper.gold,
    size: 22, color: 0x66c07a, accent: 0x2f6b3f, flyer: false,
    deathBurst: {
      radius: ENEMY_BASE_STATS.sapper.deathBurstRadius || 96,
      damage: ENEMY_BASE_STATS.sapper.deathBurstDmg || 110,
    },
    blurb: 'Carries something that is about to be everyone’s problem.',
  },
  harpy: {
    key: 'harpy', name: 'Harpy',
    hp: ENEMY_BASE_STATS.harpy.hp, speed: ENEMY_BASE_STATS.harpy.speed,
    damage: ENEMY_BASE_STATS.harpy.damage, buildDmg: ENEMY_BASE_STATS.harpy.damage + 2,
    gold: ENEMY_BASE_STATS.harpy.gold,
    size: 24, color: 0x4ea3c9, accent: 0x1f5b75, flyer: true,
    blurb: 'It does not care about your walls.',
  },
  warlord: {
    key: 'warlord', name: 'Warlord',
    hp: ENEMY_BASE_STATS.warlord.hp, speed: ENEMY_BASE_STATS.warlord.speed,
    damage: ENEMY_BASE_STATS.warlord.damage, buildDmg: ENEMY_BASE_STATS.warlord.damage + 2,
    gold: ENEMY_BASE_STATS.warlord.gold,
    size: 36, color: 0xd9483b, accent: 0xe8b73a, flyer: false, boss: true,
    blurb: 'Comes every fifth wave. Brings the end with him.',
  },
};

// Wave table. [type, count, intervalMs]. Beyond the table, waves are generated.
export const WAVES = [
  { label: 'Scouts',      spawns: [['raider', 4, 1150]] },
  { label: 'The push',    spawns: [['raider', 6, 880], ['runner', 3, 560]] },
  { label: 'Runners',     spawns: [['runner', 8, 460], ['raider', 5, 700]] },
  { label: 'Sappers',     spawns: [['raider', 6, 720], ['sapper', 4, 900]] },
  { label: 'The Warlord', spawns: [['raider', 6, 700], ['warlord', 1, 0], ['runner', 5, 500]] },
  { label: 'Sky',         spawns: [['harpy', 7, 560], ['raider', 6, 700]] },
  { label: 'Brutes',      spawns: [['brute', 4, 1100], ['runner', 8, 420]] },
  { label: 'Everything',  spawns: [['raider', 8, 620], ['sapper', 4, 850], ['harpy', 5, 600]] },
  { label: 'Armour',      spawns: [['brute', 5, 950], ['sapper', 5, 800], ['raider', 8, 560]] },
  { label: 'The Warlord', spawns: [['warlord', 1, 0], ['brute', 4, 1000], ['runner', 10, 400]] },
];

const SCALING_TYPES = ['raider', 'runner', 'brute', 'sapper', 'harpy'];

// Generated waves past the handcrafted table keep the pressure rising.
export function waveFor(n) {
  if (n <= WAVES.length) {
    const w = WAVES[n - 1];
    return {
      label: w.label,
      spawns: w.spawns.map((s) => s.slice()),
      hpScale: 1 + (n - 1) * DIFFICULTY_CONFIG.waveHpScalingPerLevel,
    };
  }
  const i = n - WAVES.length;
  const boss = n % 5 === 0;
  const count = 8 + i * 2;
  const spawns = [];
  for (let k = 0; k < count; k++) {
    const type = SCALING_TYPES[(k + i) % SCALING_TYPES.length];
    spawns.push([type, 1, 420 + ((k * 137) % 380)]);
  }
  // squash into runs of the same type for readability
  const merged = [];
  for (const s of spawns) {
    const last = merged[merged.length - 1];
    if (last && last[0] === s[0]) last[1] += 1;
    else merged.push(s);
  }
  if (boss) merged.push(['warlord', 1, 0]);
  return {
    label: boss ? 'The Warlord' : 'Siege',
    spawns: merged,
    hpScale: 1 + (n - 1) * DIFFICULTY_CONFIG.endlessHpScalingPerLevel,
    dmgScale: 1 + (n - 1) * DIFFICULTY_CONFIG.endlessDmgScalingPerLevel,
  };
}
