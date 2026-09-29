# Castle Architect — Siege Lab · Neobrutalist Medieval Design System

> **HALLMARK / redesign · v1 · locked 2026-09-29**
> This document is the contract. Nothing in `src/` is restyled unless it maps to a rule below.
> Version: `nb-medieval@1.0.0`

---

## 0. Why a genre had to be declared

Hallmark's four palette routes — **SaaS-clean / brutalist / editorial / playful** — are web-UI genres.
This product is a **game HUD inside a Phaser canvas**. No route fits:

- SaaS-clean → soft, rounded, low-contrast. Wrong for a castle siege.
- brutalist → correct energy, but the pure BW/a primary route has no heraldry.
- editorial → serif + white space; a 8×8 build grid has no editorial column.
- playful → candy colour; the fiction is a besieged realm.

**Declared genre: `neobrutalist-medieval`.**
Neobrutalism's fingerprint (flat fills, heavy borders, hard offset shadows, no gradients,
no glass, uppercase tracked labels) *is already* the visual language of heraldic print —
shields, woodcut broadsides, enamel plaques. The genre is not a compromise; it's the
natural join between the brief and the fiction.

**Theme route: custom (tuned).** No catalog theme is close enough to tune.

---

## 1. Scope — what ships

| In scope | Out of scope |
|---|---|
| `src/config/palette.js` — token layer | Gameplay sprites in `textures.js` (buildings, enemies, projectiles, coins) |
| `src/systems/ui.js` — button / label / toast | Sprite palette keys (`stone*`, `wood*`, `gold*`, `red`, `green`, `bone`, `water*`, `moss`) |
| `src/scenes/MenuScene.js` — 5 panels | `WheelOfChaos` **slice** colours (`CHAOS_WHEEL_SLICES` — gameplay read) |
| `src/scenes/GameScene.js` — all GUI sections | Audio, gameplay logic, `save.js`, `config/*.js` beyond palette |
| `src/systems/WheelOfChaos.js` — modal chrome | |
| `src/scenes/BootScene.js` — (expect no change) | |
| `index.html` + `src/main.js` — page chrome & fonts | |
| Board **backdrop** (`bg`, `bgDeep`, `groundA/B`, `gridLine`, `sky`, `ridgeFar/Near`, `cityLine`, `groundBase/Edge`) | |

**Rule (Hallmark non-destructive):** no files are deleted. Everything below is an *edit* of
existing code, reached from the surface-first sweep in `REDESIGN.md`.

---

## 2. Six-axis critique of the *before* state

| Axis | Finding (evidence) | Severity |
|---|---|---|
| **Layout** | Orientation branches are correct and complete (`isLandscape` in every builder). No axis failure. | pass |
| **Type** | `FONT = "Trebuchet MS"` — a rounded humanist sans, 0 character, no display face, no uppercase tracking discipline. Title `CASTLE / ARCHITECT` set in the same face as body copy. | **fail** |
| **Colour** | One flat purple-black family: `bg 0x12101c`, `panel 0x1c1930`, `line 0x3a3358`, `groundA 0x221f36`. Accent `C.gold 0xe8b73a` used everywhere → no hierarchy. 35 inline hexes in `WheelOfChaos` alone, incl. a stray `0x805ad5` violet that appears in no token. | **fail** |
| **Text on surface** | GUI slabs are near-black (`0x0d0b16`) with `#ffffff` text. When `C.panel` changes value, `#ffffff` (1.15:1) and `#dcd7eb` (1.2:1) go **invisible**. Every text colour must be swept with its surface. | **fail** |
| **Components** | One `button()` shared by 40+ call sites, but no state model: hover = gold *sheen* (glass), press = `scaleX 0.94` tween, disabled = a 6th ad-hoc fill. No focus ring, no loading, no error/success. | **fail** |
| **Motion** | `toast()` enters with `ease: 'Back.Out'` — **overshoot**, banned by Hallmark. Press = squash tween (also overshoot-adjacent). Everything else is static. | **fail** |

Axis summary: **layout passes, four axes fail.** The redesign is type + colour + component + motion.

---

## 3. Locked tokens

All values computed OKLCH↔hex with a script; contrast measured, not guessed.

### 3.1 Parchment + ink (the surface)

| Token | Hex | OKLCH | Role |
|---|---|---|---|
| `paper` | `#EFE3C8` | `oklch(0.918 0.038 87)` | primary parchment panel fill |
| `paper2` | `#E2D3AF` | `oklch(0.870 0.051 88)` | raised / secondary slab, default button fill |
| `paperEdge` | `#CFBE97` | `oklch(0.806 0.056 87)` | **disabled** slab, muted plate |
| `ink` | `#17130E` | `oklch(0.190 0.012 73)` | 3–4px borders, hard shadows, body text on parchment |
| `inkSoft` | `#2E2820` | `oklch(0.281 0.017 75)` | secondary text on parchment |
| `muted` | `#6B5F4A` | — | tertiary / locked / caption text on parchment |
| `rule` | `#4A423A` | `oklch(0.385 0.017 67)` | hairline on **dark**, disabled border |

### 3.2 Backdrop (warm ink — the page / battlefield)

| Token | Hex | OKLCH | Replaces |
|---|---|---|---|
| `bg` | `#191410` | `oklch(0.196 0.011 61)` | `0x12101c` purple |
| `bgDeep` | `#100D08` | `oklch(0.161 0.011 81)` | `0x0b0a12` purple-black |
| `groundA` | `#2A2318` | `oklch(0.261 0.022 79)` | `0x221f36` |
| `groundB` | `#312A1C` | `oklch(0.288 0.026 84)` | `0x262341` |
| `gridLine` | `#463B29` | `oklch(0.359 0.033 80)` | `0x322c4e` |
| `sky` | `#241A12` | `oklch(0.228 0.022 60)` | `0x1a1730` dusk-purple |
| `ridgeFar` | `#402E1C` | — | skyline far peaks (was inline in `textures.js`) |
| `ridgeNear` | `#2A1E11` | — | skyline near hills (was inline) |
| `cityLine` | `#3A2A19` | — | skyline block silhouettes (was inline) |
| `groundBase` | `#221909` | — | ground strip base (was inline) |
| `groundEdge` | `#2B2010` | — | ground strip scallop (was inline) |

### 3.3 Heraldic accents

| Token | Hex | OKLCH | Role |
|---|---|---|---|
| `crimson` | `#C0362C` | `oklch(0.540 0.176 29)` | primary accent, header bars, **destructive** |
| `crimsonDeep` | `#94231C` | `oklch(0.441 0.150 28)` | crimson text on parchment (6.55:1) |
| `lapis` | `#2F4E9E` | `oklch(0.446 0.135 265)` | secondary accent — Chaos / Wheel only |
| `goldInk` | `#9A7218` | `oklch(0.577 0.111 82)` | gold **text on parchment**, ≥16px bold only (3.44:1) |
| `gold` | `#E8B73A` | `oklch(0.803 0.146 86)` | coin fill, gold **on dark** (9.92:1), banners |
| `green` | `#66C07A` | — | unchanged (HP / success) |
| `red` | `#D9483B` | — | unchanged (danger metric) |

### 3.4 Legacy aliases (kept so existing call sites keep working)

`panel → paper`, `panelHi → paper2`, `line → ink`.
Every existing `C.panel` / `C.line` usage therefore becomes parchment+ink **for free** —
but only because §6 guarantees every surface those tokens touch is converted.

### 3.5 Sprite keys — LOCKED, value must not change

`stone`, `stoneDark`, `stoneLight`, `stoneChain`, `wood`, `woodDark`, `gold`, `goldDim`,
`red`, `redDeep`, `water`, `waterHi`, `moss`, `bone`, `white`, `shadow`, `purple`.
Changing any of these repaints gameplay sprites. Not allowed in this redesign.

### 3.6 Measured contrast (accepted / rejected)

**On `paper #EFE3C8`** → `ink` 14.52 ✅ · `rule` 7.74 ✅ · `crimsonDeep` 6.55 ✅ ·
`lapis` 6.10 ✅ · `crimson` 4.33 ⚠ *large/bold ≥18px only* · `goldInk` 3.44 ⚠ *≥16px bold only*.

**On `ink #17130E`** → `paper` 14.52 ✅ · `paper2` 12.47 ✅ · `gold` 9.92 ✅ ·
`crimson` 3.35 ⚠ large only · `lapis` 2.38 ❌ **never as text on dark — fill/border only.**

**Rejected by measurement:** `goldInk` on `paper2` = 2.96 ❌ — gold text is banned on the
raised slab; use `ink` there.

---

## 4. Type

| Role | Face | Setting |
|---|---|---|
| **Display** | **Cinzel** 700 (roman only) | Titles, modal headers, panel header bars, banner. `letter-spacing: 0.04em`. Max 2 lines. |
| **UI / body** | **Archivo** 400 / 600 / 700 | Labels, buttons, body, captions. |

**Rules**
- Button / label / eyebrow text: **uppercase**, `letter-spacing: 0.08em`, `font-weight: 700`.
- Body / blurb / help lines: sentence case, Archivo 400, `lineSpacing 2–6`.
- **No italic headers anywhere** (Hallmark gate).
- Display sizes are fixed steps: `56 / 42 / 34 / 28 / 22` px — never fluid.
- `FONT` token: `'Cinzel', 'Archivo', system-ui, sans-serif` for display;
  a second export `FONT_UI` for body. Existing `FONT` import sites get `FONT_UI` behaviour
  (Archivo) so no call site breaks; display call sites opt into `FONT_DISPLAY`.

Loaded in `index.html` via Google Fonts, `display=swap`, and awaited in `main.js`
(`document.fonts.load`) before `new Phaser.Game()` so the canvas never renders fallback.

---

## 5. Chrome — the fingerprint

Every GUI element is built from **three primitives**: a flat fill, a heavy ink border, and a
**hard offset shadow** (no blur — a solid rectangle behind, offset by a constant).

### 5.1 Constants

| Name | Value |
|---|---|
| `BORDER_SM` | `2` px (badges, dividers-in-card) |
| `BORDER` | `3` px (buttons) |
| `BORDER_LG` | `4` px (panels, modals) |
| `SHADOW_SM` | `4` px offset |
| `SHADOW` | `6` px offset (buttons) |
| `SHADOW_LG` | `8` px offset (panels, modals) |
| Radius | **`0`** — no rounded corners anywhere |

### 5.2 Button

```
[shadow rect  ink, 6px offset, behind]
[plate  fill (per role) | stroke 3px ink]
[label  Archivo 700 uppercase, tracked]
```

| Role | Fill | Label | Border | Use |
|---|---|---|---|---|
| **primary** | `gold #E8B73A` | `ink` (9.92:1) | `ink` | forward CTAs: PLAY, START SIEGE, START BUILDING, REBUILD |
| **standard** | `paper2` | `ink` (12.47:1) | `ink` | WORKSHOP, BACK, HOW TO PLAY, MENU, CANCEL, CLOSE |
| **chaos** | `lapis` | `paper` (6.10:1) | `ink` | WHEEL OF CHAOS, SPIN THE WHEEL |
| **danger** | `crimson` | `#FFFFFF` (4.9:1) | `ink` | RESET SAVE, WIPE, YES LEAVE, BEG FOR MERCY, SELL |
| **affirm** | `green` | `ink` | `ink` | REPAIR |
| **disabled** | `paperEdge` | `muted` | `rule` | **no shadow** |

Press mechanic (replaces squash tween): the **shadow collapses to 0 and the plate translates
onto it** — 70 ms `Quad.Out`, yoyo back on release. Feels like a physical key, no overshoot.

### 5.3 Panel / modal card

```
[shadow rect ink, 8px offset]
[plate  fill paper | stroke 4px ink]
[optional header bar  h=44, fill crimson | label Cinzel 700, paper, tracked]
[content]
```
Backdrop scrim: flat `bgDeep` at `0.90` (never `0.93`+ with blur — there is no blur).

### 5.4 Bars (HP, wave, keep)

Flat fill + `2px ink` stroke + `2px ink` shadow rect. **Track fill `ink`** —
never `paperEdge` (paperEdge vs `green` = 1.15:1, the progress would vanish);
progress fill `green` / `gold` / `red`. No gradient, no glow.
Implemented in `GameScene.js` (`keepBarBg`, `waveBarBg` = `C.ink`); the
per-building HP track is the ink-family dark plate in `Building.js`.

### 5.5 Toast

Parchment slab, `3px ink` stroke, `4px` ink shadow, **no** text outline stroke
(the slab provides separation). Enters `y+18 → 0`, `alpha 0→1`, `Cubic.Out`, 160 ms.
Exits `alpha→0`, 900 ms hold. **No `Back.Out` anywhere.**

### 5.6 Divider

`2–3px solid ink` on parchment; `1px solid rule` on dark. Never a gradient rule.

### 5.7 Card hover (menu mode cards / workshop cards)

Shadow `6 → 9 px`, plate `y -2 px`, 120 ms `Cubic.Out`. **No scale, no bounce.**

---

## 6. Text ↔ surface contract

**This is the rule that prevents invisible text.** Sweeping a surface requires sweeping
every string drawn on it in the same edit.

| Surface | Title | Body / secondary | Accent word |
|---|---|---|---|
| parchment (`paper`/`paper2`) | `ink` | `inkSoft`, `muted` | `crimsonDeep` or `goldInk` (size-gated) |
| dark backdrop (`bg`/`bgDeep`) | `paper` | `paper2` | `gold` |
| `crimson` fill | `#FFFFFF` | `#FFFFFF` | `paper` |
| `lapis` fill | `paper` | `paper` | `paper` |
| `gold` fill | `ink` | `ink` | `ink` |

Forbidden: `#ffffff` on parchment · `#dcd7eb` on parchment · `#ffd56b` on parchment ·
`lapis` as text on dark.

**Hex migration map (inline literals → tokens)**

| Old | New |
|---|---|
| `0x0d0b16`, `0x141024`, `0x241f3a`, `0x1d2238`, `0x241f4a`, `0x1d2438` | `C.paper2` (card) / `C.paper` (panel) |
| `0x2a1a1a`, `0x3a1818`, `0x4a1818` | `C.crimson` (danger) |
| `0x17261c`, `0x1d4d29` | `C.green` (affirm) |
| `0x3a2f18`, `0x2e2516`, `0x5a3e14` | `C.gold` (primary) |
| `0x3a245a`, `0x4a236e`, `0x5a3e14` | `C.lapis` (chaos) |
| `0x805ad5`, `0x9b59b6` | `C.lapis` |
| `0xd69e2e`, `0xffe89e`, `0xffd56b`, `0xe8b73a` | `C.gold` (on dark) / `C.goldInk` (on parchment) |
| `0x6b3030` | `C.crimsonDeep` |
| `0x2f6b3f` | `C.green` |
| `0x4e6fc9` | `C.lapis` |
| `0x2a2740`, `0x191627` | `C.paperEdge` / `C.rule` |
| `0x0b0a12`, `0x07060d`, `0x05040a` | `C.bgDeep` |
| `#ffffff` (on parchment) | `#17130E` |
| `#dcd7eb`, `#d5d0e6`, `#cfc9de`, `#b8b2d1` (on parchment) | `#2E2820` |
| `#ffd56b` (on parchment) | `#9A7218` (≥16px bold) / `#C0362C` |
| `#6f6a8c`, `#726d8f`, `#8882a8` (on parchment) | `#6B5F4A` |

---

## 7. Component states — 8, mandatory

`button()` gains an additive **`setState(name)`**. Existing `setEnabled(bool)` keeps working
(`true → 'default'`, `false → 'disabled'`) so all 40+ call sites are untouched.

| # | State | Appearance | Trigger |
|---|---|---|---|
| 1 | `default` | role fill, `3px ink`, `6px` shadow | — |
| 2 | `hover` | shadow `6→8px`, plate `y-2`, 100 ms `Cubic.Out` | pointerover |
| 3 | `focus` | **`3px` ink ring, 2px outside the plate, instant (0 ms)** | `focus-visible` (keyboard) |
| 4 | `active` | shadow → `0`, plate `+6px`, 70 ms `Quad.Out` | pointerdown |
| 5 | `disabled` | `paperEdge` fill, `rule` border, `muted` label, **no shadow** | `setEnabled(false)` |
| 6 | `loading` | fill `paper2`, label replaced by `…` ticker (3-frame), plate `ink` border | `setState('loading')` |
| 7 | `error` | fill `crimson`, label `#FFFFFF`, `3px ink`, shadow `6px` held **shaking 2px ×3, 240 ms** | `setState('error')` |
| 8 | `success` | fill `green`, label `ink`, check glyph prefix | `setState('success')` |

Focus ring must be **instant** — no transition on focus (Hallmark: focus is not decorative).

---

## 8. Motion

| Event | Change | Duration | Easing |
|---|---|---|---|
| button hover | shadow 6→8, plate y −2 | 100 ms | `Cubic.Out` |
| button press | shadow →0, plate y +6 | 70 ms | `Quad.Out` |
| card hover | shadow 6→9, plate y −2 | 120 ms | `Cubic.Out` |
| toast in | y +18→0, alpha 0→1 | 160 ms | `Cubic.Out` |
| toast out | alpha →0 | 400 ms | `Quad.In` (after 900 ms hold) |
| modal scrim | alpha 0→0.90 | 140 ms | `Quad.Out` |
| banner in | alpha 0→1, y −14→0 | 180 ms | `Cubic.Out` |
| wheel spin | (existing) | 3200 ms | `Cubic.Out` |

**Banned:** `Back.*`, `Elastic.*`, `Bounce.*`, any scale-squash, any spring.
Hallmark gate: *no overshoot, ever.*

---

## 9. Responsive contract

The canvas is `Phaser.Scale.FIT` — a fixed 1280×720 or 720×1280 design space scaled to fit.
Therefore **DOM breakpoints do not apply**; the equivalent verification is two viewports:

| Viewport | Aspect | Layout branch |
|---|---|---|
| **1280 × 720** | landscape | `isLandscape === true` — right column at `x=660`, `sw=580` |
| **720 × 1280** | portrait | `isLandscape === false` — full-width stacks |

Every section built by `buildHUD`, `buildInfoBar`, `buildSiegePanel`, `buildRoster`,
`buildPalette`, `buildActionBar`, `buildOverlays`, `buildRoot`, `buildModeSelect`,
`buildWorkshop`, `buildResetConfirm`, `buildHelp`, `WheelOfChaos.build{Landscape,Portrait}Layout`
**must be exercised in both.** A fix landed in only one branch is not done.

Safe margin: `28px` landscape / `16px` portrait (already the code's convention — preserved).
No element may cross `x < 0` or `y < 0` in either branch.

---

## 10. Honest copy (Hallmark gate)

The redesign must not invent product claims. Existing strings are **kept verbatim**;
only *styling* changes. Specifically:

- `START SIEGE`, `ROYAL AID`, `WHEEL OF CHAOS`, `REBUILD`, `MAIN MENU` — unchanged.
- `4 QUICK RULES TO SURVIVE THE SIEGE` — the guide shows exactly 4 steps. **True. ✅**
- `Spin to draft defenses and trigger chaotic anomalies!` — the wheel does draft + mutate. **True. ✅**
- `siege N` locked captions match `def.unlockAt`. **True. ✅**
- No new marketing language is introduced anywhere.

---

## 11. Tier-A enrichment (optional, only if the base sweep lands clean)

Flat Graphics-only motifs, drawn in code, **no external assets**:

1. **Header bar notch** — a 12px triangular notch cut into the crimson panel header
   (heraldic banner tail). Pure `Graphics.fillPoints`.
2. **Corner rivets** — 4 × 4px `ink` squares at panel corners, 8px inset.
3. **Board frame** — replace the `C.gold 0.45` stroke on the board surround with a
   `4px ink` stroke + `2px gold` inner hairline (double-rule, like a woodcut plate).
4. **Shield silhouette** behind the KEEP HP readout (5-point polygon, `paperEdge`).

Rule: each is a *flat fill + ink border*, must not introduce a gradient, blur, or radius.

---

## 12. Pre-emit critique (six axes, v1)

| Axis | v1 risk found | Mitigation applied to this document |
|---|---|---|
| **Layout** | Portrait guide modal is `guideH = 960` inside `H = 1280` with `guideY = H/2` → top at y=160, bottom at y=1120. Tight but fits; steps at `guideY-265 + i*135` → last card bottom = `640-265+405+60 = 840` ✅. | Verified arithmetic before writing §9. |
| **Type** | Cinzel has **no italic** and only weights 400–900; loading 400 *and* 700 would double the payload for a face that's only used bold. | Load Cinzel **700 only**. Archivo 400/600/700. |
| **Colour** | `goldInk` at 3.44:1 invites misuse as a small caption colour. | §3.6 states the size gate explicitly; §6 forbids `goldInk` on `paper2`. |
| **Text-on-surface** | `refreshSiegePanel()` and `refreshPalette()` **re-`setColor()` at runtime** (lines 501, 503, 519, 1338) — a static sweep of literals would be reverted on the next frame. | Runtime `setColor` call sites listed explicitly in §6's migration map and must be edited too. |
| **Components** | `button()` is called with positional `fill`/`stroke` from 40+ sites; adding a required param breaks all of them. | Params stay optional and in the same order; new `setState()` is additive. |
| **Motion** | The wheel's pointer tick `setScale(1.25, 0.85)` is a squash — but it's a *needle wobble on a physical wheel*, not a UI overshoot, and is `Quad`-less (instant + `60ms` return). | Allowed as gameplay feedback; **UI** overshoot remains banned. |

---

## 13. Definition of done

- [ ] `design.md` + `tokens.css` exist and agree (§3 ↔ tokens.css, hex values identical).
- [ ] Every colour in `src/` resolves to `C.<token>` — **zero** inline hex in GUI files.
- [ ] No `#ffffff` / `#dcd7eb` / `#ffd56b` drawn on any parchment surface.
- [ ] No `Back.*` / `Elastic.*` / `Bounce.*` easing in any UI tween.
- [ ] All 8 button states reachable; `setEnabled` still works at every existing call site.
- [ ] Cinzel + Archivo load before `new Phaser.Game()`.
- [ ] **Both** 1280×720 and 720×1280 verified with screenshots — every section visible.
- [ ] `bun run build` exits 0.
- [ ] `.hallmark/log.json` records the run.
