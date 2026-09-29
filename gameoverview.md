# Castle Architect: Siege Lab — Game Overview & Developer Guide

> **A tactical roguelite fortress defense game built with Phaser 3, Vite, and high-definition neobrutalist heraldry.**
> *Last Updated: September 2026*

---

## 1. Executive Summary & Core Gameplay Loop

**Castle Architect: Siege Lab** merges grid-based medieval fortress design with physics-inspired tower defense and chaotic roguelite draft mechanics.

```
       ┌──────────────────────────────┐
       │      1. BUILD PHASE          │
       │  - Place / Repair Structures │
       │  - Upgrade to Tier 2 (Spikes)│
       │  - Relocate the Keep         │
       │  - Expand Capacity (1000g)   │
       └──────────────┬───────────────┘
                      │ (Start Siege)
                      ▼
       ┌──────────────────────────────┐
       │      2. SIEGE PHASE          │
       │  - Enemies Path & Breach     │
       │  - Towers / Cannons Defend   │
       │  - Trigger Traps & Chokepoints│
       │  - Cast Royal Aid (Salvos)   │
       └──────────────┬───────────────┘
                      │ (Wave Cleared)
                      ▼
       ┌──────────────────────────────┐
       │     3. REWARD & DRAFT        │
       │  - Gold & Legacy Bounty      │
       │  - Wheel of Chaos Draft      │
       │  - Random Calamity Anomaly   │
       │  - Mad King Decree Obeyed?   │
       └──────────────┬───────────────┘
                      │ (Repeat / Scale)
                      ▼
              [Next Escalation]
```

### Game Modes
1. **Story Campaign (10 Sieges)**: Handcrafted escalation culminating in the **High Warlord Boss Encounter** on Wave 10. (Defeating the boss requires executing the Sacred Runic Ritual on Rows 3–4!).
2. **Endless Survival**: Procedurally scaled wave generation with exponential HP/Damage buffs and endless leaderboards.
3. **Chaos Mode**: Start with zero basic building stock; draft all defensive pieces, buffs, wild gremlin events, and anomalies via the **Wheel of Chaos**!

---

## 2. Architecture & Codebase Map

```
c:\Users\TADS\WORK\hackathon\gamejam\
├── index.html                   # HTML entry with full SEO, OpenGraph, schema.org JSON-LD
├── tokens.css                   # Global Neobrutalist design tokens & font imports
├── vite.config.js               # Vite 6 bundler config with static asset bundling
├── public/
│   ├── logo.svg                 # High-resolution vector brand logo
│   ├── favicon.svg              # Browser tab badge icon
│   └── site.webmanifest         # PWA progressive web app manifest
└── src/
    ├── main.js                  # Game configuration, DPR scaling, resolution setup
    ├── config/
    │   ├── balance.js           # Master balance, economy, difficulty, workshop perks
    │   ├── buildings.js         # Base building definitions, costs, synergies, tiers
    │   ├── chaos.js             # Wheel of Chaos slices, anomalies, gremlin events
    │   ├── decrees.js           # Mad King’s Royal Decrees & toll modifiers
    │   ├── enemies.js           # Enemy stats, wave spawning rosters, scaling
    │   └── palette.js           # Medieval neobrutalist color palette & layout constants
    ├── entities/
    │   ├── Building.js          # Building entity, HP bars, synergies, repair, death
    │   └── Enemy.js             # Enemy entity, AI state machines, abilities, pathing
    ├── scenes/
    │   ├── BootScene.js         # Loads save state, renders procedural textures
    │   ├── MenuScene.js         # Title screen, mode select, legacy workshop, stats
    │   └── GameScene.js         # Core gameplay loop, HUD, input, combat, UI dialogs
    └── systems/
        ├── audio.js             # Procedural Web Audio synthesizer (zero audio files!)
        ├── pathfinding.js       # Grid A* pathfinder with dynamic hazard weighting
        ├── save.js              # LocalStorage persistence, migration, legacy currency
        ├── textures.js          # 100% procedural vector graphic generation
        ├── ui.js                # Neobrutalist UI components, non-overlapping toast stacker
        └── WheelOfChaos.js      # Animated canvas wheel physics, slice odds, draft UI
```

---

## 3. Key Systems & Mechanics

### 3.1. Intelligent AI & Pathfinding (`src/entities/Enemy.js`, `src/systems/pathfinding.js`)
- **Hazard Awareness & Dodging**:
  - Open path calculation applies weighted avoidance penalties: Traps ($+12$), Moats ($+8$), and Spiked Gates ($+6$). Enemies actively path around killzones if a clean alternate corridor exists.
  - Wall breach algorithm prioritizes breaking walls with lower trap density.
- **Flocking & Visual Dispersion**: Dynamic soft separation offset prevents enemies from collapsing into a 1D conga-line.
- **Special Tactical Subroutines**:
  - **Runner**: Seeks unfortified open flanks; triggers a $1.5\text{s}$ **Evasive Sprint** ($+35\%$ speed burst) on taking damage.
  - **Brute**: Deals $+25\%$ bonus damage against fortifications; roars every $3.2\text{s}$ while attacking to rally nearby infantry with $+25\%$ attack speed.
  - **Sapper**: At $\le 40\%$ HP or within $2.2$ tiles of Keep, enters **Suicide Charge Mode** ($+45\%$ speed + spark trails) and detonates on high-value targets.
  - **Harpy**: Flight unit with high-speed **Talon Dive** as it swoops toward the Keep.
  - **High Warlord Boss**: Emits battlefield rally horn (cleansing slows + boosting minion speed by $+35\%$), unleashes $1.5$-tile shockwave cleaves on structures, and enrages below $50\%$ HP (slow-immune, $+45\%$ attack speed).

### 3.2. Fortress Synergies (`src/config/buildings.js`)
When specific structures are placed adjacent to one another, they activate powerful passive synergies:
1. **Rampart (Wall + Wall)**: $+30\%$ maximum structural HP.
2. **Moat & Rampart (Moat + Wall)**: Enemies attack with $50\%$ less melee damage while standing in moats; attackers suffer $+40\%$ waterlogged damage.
3. **Iron Fortress (Tier 2 Reinforced Wall)**: Reflects $35\%$ of incoming melee damage back onto the attacker as physical spike damage.
4. **Killzone (Moat + Tower/Cannon)**: Cannon balls deal $+60\%$ bonus direct splash damage to targets currently slowed by water.
5. **Chain Reaction (Trap + Trap)**: Springing one trap triggers cascading detonations across adjacent armed traps within blast radius.

### 3.3. Placement Capacity & Expansion (`src/config/balance.js`, `src/scenes/GameScene.js`)
- **Base Limit**: Starts at 14, gaining $+2$ slots per wave cleared up to the default cap of **25 pieces** (Keep + 24 defensive structures).
- **Purchased Expansion**: Players can spend **$1,000\text{g}$** in the Build Phase via the HUD button to permanently add $+1$ slot beyond 25 with no upper ceiling.

### 3.4. Wheel of Chaos & Rogue Anomalies (`src/systems/WheelOfChaos.js`, `src/config/chaos.js`)
- **Dynamic Slice Probability**: Extra spin slices start at $+3$ bonus spins, dynamically diminishing to $+2 \to +1$ during consecutive rolls to prevent infinite spin loops.
- **Buying Extra Spins**: Players can buy additional spins during Chaos mode for $200\text{g}$.
- **Random Disasters & Anomaly Events**:
  - *Earthquake*: Damages existing walls and Keep.
  - *Gremlin Sabotage / Gift*: Gremlins steal a piece from reserve or upgrade a random wall for free!
  - *Horde Frenzy*: Next wave moves $+35\%$ faster.
  - *Magma Surge*: Moats ignite into bubbling lava dealing $3\times$ damage!

### 3.5. Non-Overlapping Toast Stacker (`src/systems/ui.js`)
- Calling `toast(scene, x, y, text, color, size)` dynamically tracks active banners on screen.
- When multiple events happen simultaneously (e.g. Wave Clear, Reward, Chaos Calamity, Gremlin Sabotage), existing active toasts smoothly glide upward (`Cubic.Out` tween) with calculated height + margin offsets so no text ever overlaps.

---

## 4. Master Balance & Economy Reference (`src/config/balance.js`)

| Key Parameter | Default Value | Description |
| :--- | :--- | :--- |
| `startingGold` | `120` | Starting treasury at Wave 1 |
| `startingGoldPerChestLevel` | `+20` | Bonus starting gold per workshop War Chest level |
| `sellRefundRatio` | `0.50` ($50\%$) | Gold refund ratio upon deconstructing pieces |
| `repairCostPerMissingHp` | `0.35` | Gold cost per missing point of structural HP |
| `waveClearBaseGold` | `20` | Base gold bounty after clearing a siege |
| `waveClearGoldPerWave` | `6` | Extra gold awarded per wave number |
| `keepRepairOnWaveClearRatio`| `0.12` ($12\%$) | Free Keep HP healed upon holding a siege |
| `decreeObeyedBountyGold` | `35` | Gold rewarded for following the Mad King's Decree |
| `maxPieceLimitCap` | `25` | Default highest placement limit |
| `expandSlotCost` | `1000` | Gold cost to buy $+1$ placement slot |
| `royalAidCooldownSeconds` | `14` | Base cooldown for Royal Aid lightning volleys |

---

## 5. Cheat Codes & Debugging

During gameplay, the following hidden Konami & debug codes can be triggered:

| Input Code | Effect |
| :--- | :--- |
| `↑ ↑ ↓ ↓ ← → ← → B A` (Konami) | **God Mode**: Unlocks all modes, $+500$ Legacy, and opens full sandbox tools. |
| `~` (Tilde) | Toggle Debug Inspector overlay with instant gold, nuke, full heal, and 5x speed buttons. |
| `1`, `2`, `3` | Toggle simulation speed ($1\times$, $2\times$, $3\times$). |
| `F6` / `Enter` | Keyboard accessible button navigation & activation. |

---

## 6. Future Development & Extension Roadmap

When resuming development after the gamejam, prioritize the following features:

1. **New Defense Classes**:
   - *Ballista Tower*: High single-target armor-piercing siege sniper (deals $3\times$ damage to Brutes/Warlords).
   - *Tar Pit*: Flammable ground hazard that ignites when struck by cannon shells or flaming arrows.
2. **Audio System Expansions**:
   - Add ambient wind/rain weather synthesis during sieges.
   - Dynamic per-faction battle music themes (e.g. tribal drums for Goblin Sappers).
3. **Endless Mode Modifiers**:
   - Boss rushes every 3rd wave.
   - Relic inventory system where players choose 1 of 3 passive artifacts after clearing boss sieges.
4. **Multiplayer / Challenge Lab**:
   - Asynchronous "Siege Challenge" sharing where players export and import castle blueprints via base64 strings!

---

## 7. Build & Deployment Commands

```bash
# Install dependencies
bun install

# Start local development server (with HMR)
bun run dev

# Run production build (outputs to dist/)
bun run build

# Preview production build locally
bun run preview
```
