/**
 * ==============================================================================
 * CASTLE ARCHITECT: SIEGE LAB - MASTER GAMEPLAY & DIFFICULTY CONFIGURATION
 * ==============================================================================
 *
 * Customize all game balance, economy, rewards, costs, and difficulty settings
 * here. All modifications in this file instantly propagate across gameplay logic,
 * calculations, and game UI.
 */

// ==============================================================================
// 1. ECONOMY & TREASURY CONFIG
// ==============================================================================
export const ECONOMY_CONFIG = {
  /** Starting treasury gold when beginning a new run */
  startingGold: 120,

  /** Bonus starting gold awarded per level of the 'War Chest' workshop upgrade */
  startingGoldPerChestLevel: 20,

  /** Fraction of building cost returned when deconstructing (0.5 = 50% refund) */
  sellRefundRatio: 0.5,

  /** Multiplier for repairing damaged pieces (cost = missingHP * repairCostMultiplier) */
  repairCostPerMissingHp: 0.35,

  /** Base gold bounty awarded immediately upon clearing any siege */
  waveClearBaseGold: 20,

  /** Extra gold scaling awarded per wave number cleared (bonus = base + wave * perWave) */
  waveClearGoldPerWave: 6,

  /** Fraction of Keep max HP restored automatically between held sieges (0.12 = 12%) */
  keepRepairOnWaveClearRatio: 0.12,

  /** Royal gold bounty awarded when successfully following the Mad King's Decree */
  decreeObeyedBountyGold: 35,

  /** Gold confiscated if the Royal Toll decree is violated on Wave 3 */
  decreeTaxPenaltyGold: 40,

  // --- Workshop Metagame Currency (Legacy) ---
  /** Base legacy currency earned after clearing a siege */
  legacyPerWaveClearBase: 4,

  /** Scaling legacy earned per wave survived */
  legacyPerWaveClearMultiplier: 2,

  /** Base legacy awarded upon defeat (Game Over) */
  gameOverLegacyBase: 6,

  /** Legacy awarded per cleared wave upon defeat */
  gameOverLegacyPerWave: 8,

  /** Fraction of unspent treasury gold converted into legacy upon defeat */
  gameOverLegacyGoldRatio: 0.4,
};

// ==============================================================================
// 2. DIFFICULTY & ENEMY SCALING CONFIG
// ==============================================================================
export const DIFFICULTY_CONFIG = {
  /**
   * Master difficulty multipliers. Adjust these to easily tune global challenge:
   *  - 0.75 : Casual / Story focus
   *  - 1.00 : Standard intended jam balance
   *  - 1.35+: Veteran / Hardcore siege challenge
   */
  globalEnemyHpMultiplier: 1.0,
  globalEnemyDmgMultiplier: 1.0,
  globalEnemySpeedMultiplier: 1.0,
  globalEnemyGoldRewardMultiplier: 1.0,

  /** Health scaling increment per wave across standard story waves */
  waveHpScalingPerLevel: 0.08,

  /** Health scaling increment per wave in endless/survival mode */
  endlessHpScalingPerLevel: 0.085,

  /** Damage scaling increment per wave in endless/survival mode */
  endlessDmgScalingPerLevel: 0.04,

  // --- Piece Capacity & Board Limits ---
  /** Starting piece limit on the castle board */
  basePieceLimit: 14,

  /** Extra piece placement slots unlocked per wave cleared */
  pieceLimitGainPerWave: 2,

  /** Maximum absolute default piece limit cap (25 to accompany Keep + 24 pieces) */
  maxPieceLimitCap: 25,
};

// ==============================================================================
// 3. COMBAT & ROYAL AID CONFIG
// ==============================================================================
export const COMBAT_CONFIG = {
  /** Cooldown in seconds between Royal Aid lightning volleys */
  royalAidCooldownSeconds: 14,

  /** Falling speed of Royal Aid projectile bolts */
  royalAidProjectileSpeed: 900,

  /** Direct damage dealt per Royal Aid lightning bolt */
  royalAidDamage: 34,

  /** Blast radius (AoE) for each Royal Aid bolt impact */
  royalAidSplashRadius: 66,

  /** Total number of lightning strikes in a single Royal Aid salvo */
  royalAidBoltsCount: 7,
};

// ==============================================================================
// 4. STRUCTURE STATS & BASE COSTS
// ==============================================================================
export const STRUCTURE_COSTS = {
  keep: { cost: 0, hp: 360 },
  wall: { cost: 10, hp: 70 },
  tower: { cost: 25, hp: 55, range: 195, damage: 10, cooldown: 760 },
  moat: { cost: 14, hp: 9999 },
  trap: { cost: 20, hp: 24, damage: 62, radius: 104 },
  gate: { cost: 18, hp: 60 },
  cannon: { cost: 45, hp: 50, range: 300, damage: 40, cooldown: 2300, splash: 74 },
};

// ==============================================================================
// 5. TIER 2 UPGRADE COSTS & STATS
// ==============================================================================
export const TIER2_UPGRADE_COSTS = {
  wall: { cost: 16, hp: 160 },
  tower: { cost: 32, hp: 95, range: 250, damage: 24, cooldown: 560 },
  cannon: { cost: 50, hp: 90, range: 350, damage: 70, cooldown: 1900, splash: 115 },
  moat: { cost: 20, hp: 9999 },
  gate: { cost: 24, hp: 140 },
  trap: { cost: 24, hp: 30, damage: 125, radius: 125 },
};

// ==============================================================================
// 6. ENEMY BASE REWARDS & HEALTH
// ==============================================================================
export const ENEMY_BASE_STATS = {
  raider: { hp: 72, speed: 64, damage: 12, gold: 6 },
  runner: { hp: 44, speed: 124, damage: 7, gold: 5 },
  brute: { hp: 215, speed: 46, damage: 26, gold: 16 },
  sapper: { hp: 96, speed: 70, damage: 9, gold: 12, deathBurstDmg: 110, deathBurstRadius: 96 },
  harpy: { hp: 60, speed: 98, damage: 14, gold: 10 },
  warlord: { hp: 820, speed: 40, damage: 44, gold: 70 },
};

// ==============================================================================
// 7. WORKSHOP METAPROGRESSION COSTS & PERKS
// ==============================================================================
export const WORKSHOP_CONFIG = [
  { key: 'masonry', name: 'Masonry', cost: 40, max: 3, hpBonusPerLevel: 0.20, blurb: '+20% wall plating per mark' },
  { key: 'powder', name: 'Powder Charge', cost: 50, max: 3, dmgBonusPerLevel: 0.15, blurb: '+15% tower & cannon damage' },
  { key: 'chest', name: 'War Chest', cost: 45, max: 3, goldBonusPerLevel: 20, blurb: '+20 starting gold per siege' },
  { key: 'bulwark', name: 'Bulwark', cost: 60, max: 2, keepHpBonusPerLevel: 0.25, blurb: '+25% Keep integrity' },
  { key: 'alchemy', name: 'Siege Alchemy', cost: 55, max: 3, goldDropBonusPerLevel: 0.20, blurb: '+20% enemy gold bounty' },
  { key: 'drums', name: 'War Drums', cost: 50, max: 2, cooldownReductionSec: 3.5, blurb: '-3.5s Royal Aid cooldown' },
];
