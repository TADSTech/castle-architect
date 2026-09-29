import { ECONOMY_CONFIG } from './balance.js';

export const DECREES = {
  1: {
    title: 'THE ROYAL FOUNDATION',
    lore: 'The King demands a fortified perimeter around his seat of power.',
    rule: 'Build at least 2 Walls to shield the realm.',
    penalty: 'If ignored, raiders spawn with +50% melee frenzy!',
    check: (scene) => scene.buildings.filter(b => b.key === 'wall').length >= 2,
    hint: 'Build at least 2 Walls before the siege begins.',
  },
  2: {
    title: 'DECREE OF SYMMETRY',
    lore: 'The Mad King detests lopsided castles and demands architectural balance!',
    rule: 'The number of pieces on the Left (cols 0-3) must equal the Right (cols 4-7).',
    penalty: 'If unequal, 1 random wall crumbles before the siege starts!',
    check: (scene) => {
      let left = 0, right = 0;
      for (const b of scene.buildings) {
        if (b.key === 'keep') continue;
        if (b.cx < 4) left++;
        else right++;
      }
      return left === right;
    },
    hint: 'Maintain architectural balance: equal pieces on the Left vs Right.',
  },
  3: {
    title: 'THE ROYAL TOLL',
    lore: 'The King demands a grand entryway to collect customs taxes.',
    rule: 'Build at least 1 Gate on the battlefield.',
    penalty: `If missing, the King confiscates ${ECONOMY_CONFIG.decreeTaxPenaltyGold} gold from your treasury!`,
    check: (scene) => scene.buildings.some(b => b.key === 'gate'),
    hint: 'Erect at least 1 Gate before the horn sounds.',
  },
  4: {
    title: 'THE ROYAL BATH',
    lore: 'The King is parched and demands water on the field.',
    rule: 'Dig at least 2 Moat tiles into the earth.',
    penalty: 'If ignored, Royal Aid is locked for this siege!',
    check: (scene) => scene.buildings.filter(b => b.key === 'moat').length >= 2,
    hint: 'Dig at least 2 Moats into the battlefield.',
  },
  5: {
    title: 'EMBRASURE EMBARGO',
    lore: 'The Warlord arrives clad in enchanted dragon-scale plate.',
    rule: 'Mount at least 1 Cannon or 2 braced Towers behind walls.',
    penalty: 'If ignored, foes spawn with +40% extra HP shields!',
    check: (scene) => scene.buildings.some(b => b.key === 'cannon' || (b.key === 'tower' && b.braced)),
    hint: 'Mount at least 1 Cannon or braced Tower behind walls.',
  },
  6: {
    title: 'NIGHTFALL AMBUSH',
    lore: 'The King extinguished torches and whispers: "Psst... Type [↑ ↑ ↓ ↓ ← → ← → B A] for a royal boon!"',
    rule: 'Arm at least 2 Traps to illuminate the shadows.',
    penalty: 'If ignored, darkness grants foes +35% movement speed!',
    check: (scene) => scene.buildings.filter(b => b.key === 'trap').length >= 2,
    hint: 'Arm at least 2 Traps across the battlefield.',
  },
  7: {
    title: 'THE RED CARPET',
    lore: 'The King demands an open corridor directly to his courtyard.',
    rule: 'Do NOT completely box in the Keep. Leave an open path.',
    penalty: 'If completely walled in, sappers spawn with double blast power!',
    check: (scene) => scene.goalFree && scene.goalFree.length > 0,
    hint: 'Do NOT completely box in the Keep. Leave an open passage.',
  },
  8: {
    title: 'TREBUCHET BOMBARDMENT',
    lore: 'The enemy has constructed long-range siege trebuchets!',
    rule: 'Reinforce your lines with at least 1 Gate AND 2 Towers.',
    penalty: 'If missing, trebuchet artillery shells your perimeter!',
    check: (scene) => scene.buildings.some(b => b.key === 'gate') && scene.buildings.filter(b => b.key === 'tower').length >= 2,
    hint: 'Reinforce your castle with at least 1 Gate and 2 Towers.',
  },
  9: {
    title: 'THE GUILD TITHE',
    lore: 'The King demands master craftsmanship on the field.',
    rule: 'Upgrade at least 1 structure to Tier 2 (Iron Wall, Ballista, etc.).',
    penalty: 'If ignored, enemies enter a combat frenzy (+25% speed & dmg)!',
    check: (scene) => scene.buildings.some(b => b.tier >= 2),
    hint: 'Upgrade at least 1 structure to Tier 2 before the siege.',
  },
  10: {
    title: 'THE FINAL SIEGE',
    lore: 'The High Warlord descends upon the realm with his legions.',
    rule: 'The High Warlord MUST die on Rows 3 or 4.',
    penalty: 'If slain elsewhere, his soul resurrects and casts you back to Siege 8!',
    hint: '',
  },
};
