import { WORKSHOP_CONFIG } from '../config/balance.js';

const KEY = 'castle_architect_save_v1';

const DEFAULT = {
  legacy: 0,            // meta currency, spent in the workshop
  totalWaves: 0,        // cumulative waves survived (drives unlocks)
  bestWave: 0,          // best single-run wave
  runs: 0,
  upgrades: {},         // { masonry: lvl, powder: lvl, ... }
  discovered: {},       // synergy key -> times the player has seen it happen
  sound: true,
  music: true,
  seenTutorial: false,
  hasSeenFirstTimeGuide: false,
  storyCompleted: false,
  hasLostAtLevel10: false,
  selectedMode: 'story',
  unlockedModes: { story: true, survival: false, chaos: false },
  bestStoryWave: 0,
  bestSurvivalWave: 0,
  konamiTotalUses: 0,
  konamiDisabled: false,
};

export const UPGRADES = WORKSHOP_CONFIG;

let cache = null;

export function loadSave() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT, upgrades: {}, discovered: {} };
  } catch {
    cache = { ...DEFAULT, upgrades: {}, discovered: {} };
  }
  return cache;
}

export function writeSave() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache || loadSave()));
  } catch {
    /* private mode / quota — the game still plays, it just won't remember. */
  }
}

export function resetSave(preserveKonami = false) {
  const currentUses = cache?.konamiTotalUses || 0;
  const currentDisabled = !!cache?.konamiDisabled;
  cache = {
    ...DEFAULT,
    upgrades: {},
    discovered: {},
    konamiTotalUses: preserveKonami ? currentUses : 0,
    konamiDisabled: preserveKonami ? currentDisabled : false,
  };
  writeSave();
}

export function upgradeLevel(key) {
  return loadSave().upgrades[key] || 0;
}

export function buyUpgrade(key) {
  const s = loadSave();
  const def = UPGRADES.find((u) => u.key === key);
  if (!def) return false;
  const lvl = s.upgrades[key] || 0;
  if (lvl >= def.max || s.legacy < def.cost) return false;
  s.legacy -= def.cost;
  s.upgrades[key] = lvl + 1;
  writeSave();
  return true;
}

// Unlocks are earned by cumulative waves across ALL runs or active wave in current run
export function unlockedBuildings(currentWave = 1) {
  const s = loadSave();
  return Math.max(s.totalWaves || 0, Math.max(0, (currentWave || 1) - 1));
}

export function recordDiscovered(key) {
  const s = loadSave();
  s.discovered[key] = (s.discovered[key] || 0) + 1;
  writeSave();
  return s.discovered[key];
}
