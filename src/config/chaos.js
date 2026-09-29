/**
 * ==============================================================================
 * CHAOS MODE CONFIGURATION & WHEEL DEFINITIONS
 * ==============================================================================
 */

export const CHAOS_CONFIG = {
  /** Initial wheel spins awarded when starting a new Chaos Mode run */
  startingSpins: 5,

  /** Bonus wheel spins awarded after successfully clearing each wave */
  spinsPerWaveClear: 2,

  /** Wave intervals for periodic random chaos calamities (e.g. Wave 3, 6, 9, 12...) */
  anomalyIntervalWaves: 3,

  /** Gold cost to purchase +1 extra Wheel Spin */
  spinPurchaseCostGold: 200,
};

export const CHAOS_WHEEL_SLICES = [
  {
    id: 'walls_3',
    label: '+3\nWALLS',
    header: '+3 STONE WALLS',
    sub: 'Adds 3 Stone Walls to your Chaos Reserve',
    color: 0x333d47,
    accentColor: 0x627d98,
    icon: 'b_wall',
    type: 'draft',
    buildings: { wall: 3 },
  },
  {
    id: 'quake',
    label: 'DISASTER:\nQUAKE',
    header: '🌋 DISASTER: EARTHQUAKE',
    sub: 'Violent tremors! A random wall takes 45 damage (or Keep takes 25 damage).',
    color: 0x742a2a,
    accentColor: 0xe53e3e,
    icon: null,
    type: 'disaster',
    apply: (sc) => sc.applyChaosQuake(),
  },
  {
    id: 'towers',
    label: '+2\nTOWERS',
    header: '+2 ARROW TOWERS',
    sub: 'Adds 2 Arrow Towers to your Chaos Reserve',
    color: 0x44307a,
    accentColor: 0x9f7aea,
    icon: 'b_tower',
    type: 'draft',
    buildings: { tower: 2 },
  },
  {
    id: 'sabotage',
    label: 'DISASTER:\nSABOTAGE',
    header: '🌪️ DISASTER: GREMLIN SABOTAGE',
    sub: 'Mischief! Sneaky gremlins steal 1 defense from your reserve tray!',
    color: 0x652b19,
    accentColor: 0xdd6b20,
    icon: null,
    type: 'disaster',
    apply: (sc) => sc.applyChaosSabotage(),
  },
  {
    id: 'cannon',
    label: '+1\nCANNON',
    header: '+1 HEAVY CANNON',
    sub: 'Adds 1 Heavy Cannon to your Chaos Reserve',
    color: 0x822424,
    accentColor: 0xf56565,
    icon: 'b_cannon_idle',
    type: 'draft',
    buildings: { cannon: 1 },
  },
  {
    id: 'gate_trap',
    label: 'GATE &\nTRAP',
    header: 'GATE & TRAP',
    sub: 'Adds 1 Portcullis Gate and 1 Spike Trap to Reserve',
    color: 0x1d4044,
    accentColor: 0x38b2ac,
    icon: 'b_gate',
    type: 'draft',
    buildings: { gate: 1, trap: 1 },
  },
  {
    id: 'frenzy',
    label: 'DISASTER:\nFRENZY',
    header: '🧪 DISASTER: HORDE FRENZY',
    sub: 'Blood Frenzy! Next wave of enemies attacks with +35% movement speed!',
    color: 0x5b2148,
    accentColor: 0xd53f8c,
    icon: null,
    type: 'disaster',
    apply: (sc) => sc.applyChaosHordeFrenzy(),
  },
  {
    id: 'walls_2',
    label: '+2\nWALLS',
    header: '+2 STONE WALLS',
    sub: 'Adds 2 Stone Walls to your Chaos Reserve',
    color: 0x2d3748,
    accentColor: 0x4a5568,
    icon: 'b_wall',
    type: 'draft',
    buildings: { wall: 2 },
  },
  {
    id: 'jackpot',
    label: '★ JACKPOT ★\nDRAFT',
    header: '★ JACKPOT DRAFT ★',
    sub: 'Jackpot! +1 Wall, +1 Tower, +1 Gate, +1 Trap!',
    color: 0x975a16,
    accentColor: 0xf6e05e,
    icon: 'b_tower',
    type: 'draft',
    buildings: { wall: 1, tower: 1, gate: 1, trap: 1 },
  },
  {
    id: 'overcharge',
    label: 'SPEED\nFRENZY',
    header: '⚡ OVERCHARGE',
    sub: 'Towers and Cannons fire 60% faster this wave!',
    color: 0x23426b,
    accentColor: 0x63b3ed,
    icon: null,
    type: 'buff',
    apply: (sc) => {
      sc.chaosOvercharge = true;
    },
  },
  {
    id: 'gremlin_upg',
    label: 'GREMLIN\nTECH',
    header: '🔨 GREMLIN UPGRADE',
    sub: 'Gremlins upgrade 1 random defense to Tier 2 and restore 100% board HP!',
    color: 0x1c4431,
    accentColor: 0x48bb78,
    icon: null,
    type: 'event',
    apply: (sc) => sc.applyChaosGremlinUpgrade(),
  },
  {
    id: 'extra_spins',
    label: 'EXTRA\nSPINS',
    header: '🎰 EXTRA SPINS',
    sub: 'Lucky roll! Gain bonus Wheel Spins! (Diminishes 3 -> 2 -> 1 per siege)',
    color: 0x5f370e,
    accentColor: 0xd69e2e,
    icon: null,
    type: 'spins',
    apply: (sc) => {
      const bonus = sc.chaosExtraSpinsBonus ?? 3;
      sc.chaosSpins = (sc.chaosSpins || 0) + bonus;
      sc.chaosExtraSpinsBonus = Math.max(1, bonus - 1);
    },
  },
];

export const CHAOS_ANOMALIES = [
  {
    title: '⚡ THUNDERSTORM ANOMALY',
    desc: 'Static charges the atmosphere! Lightning strikes random grid cells every 2.8s.',
    apply: (sc) => {
      sc.chaosLightningStorm = true;
    },
  },
  {
    title: '🌋 MAGMA SURGE',
    desc: 'The ground splits with boiling magma! All moats deal triple fire damage.',
    apply: (sc) => {
      sc.chaosMagma = true;
    },
  },
  {
    title: '⚔️ TIME DISTORTION',
    desc: 'Towers fire at double speed, but fast runners move in unpredictable bursts!',
    apply: (sc) => {
      sc.chaosOvercharge = true;
      sc.enemySpeedBuff = (sc.enemySpeedBuff || 1) * 1.2;
    },
  },
  {
    title: '🏰 LIVING GRANITE',
    desc: 'Ancient earth spirits bolster your defenses: All walls gain +150 Max HP!',
    apply: (sc) => {
      for (const b of sc.buildings) {
        if (b.key === 'wall') {
          b.maxHp += 150;
          b.hp += 150;
        }
      }
    },
  },
  {
    title: '🎲 GREMLIN FEAST',
    desc: 'Mischievous gremlins tinker with your fortifications: 2 random defenses upgraded to Tier 2!',
    apply: (sc) => {
      sc.applyChaosGremlinUpgrade();
      sc.applyChaosGremlinUpgrade();
    },
  },
  {
    title: '🎰 FORTUNE WHEEL OVERDRIVE',
    desc: 'The Mad King rewards chaos! +3 Extra Wheel Spins awarded!',
    apply: (sc) => {
      sc.chaosSpins = (sc.chaosSpins || 0) + 3;
    },
  },
];
