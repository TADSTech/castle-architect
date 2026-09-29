// Visual identity — neobrutalist medieval. Mirrors tokens.css EXACTLY.
// LOCKS: no gradients, no blur, radius 0, surface+text swap together (design.md §6).
export const C = {
  // --- SURFACE · parchment + ink (GUI slabs) ---
  paper: 0xEFE3C8,
  paper2: 0xE2D3AF,
  paperEdge: 0xCFBE97,
  ink: 0x17130E,
  inkSoft: 0x2E2820,
  muted: 0x6B5F4A,
  rule: 0x4A423A,

  // --- BACKDROP · warm ink (page + battlefield) ---
  bg: 0x191410,
  bgDeep: 0x100D08,
  groundA: 0x2A2318,
  groundB: 0x312A1C,
  gridLine: 0x463B29,
  sky: 0x241A12,
  // skyline / ground band (textures.js 'skyline' + 'ground' textures)
  ridgeFar: 0x402E1C,
  ridgeNear: 0x2A1E11,
  cityLine: 0x3A2A19,
  groundBase: 0x221909,
  groundEdge: 0x2B2010,

  // --- LEGACY ALIASES (existing call sites keep working) ---
  panel: 0xEFE3C8,
  panelHi: 0xE2D3AF,
  line: 0x17130E,

  // --- ACCENT · heraldic ---
  crimson: 0xC0362C,
  crimsonDeep: 0x94231C,
  lapis: 0x2F4E9E,
  goldInk: 0x9A7218,
  gold: 0xE8B73A,

  // --- SPRITE KEYS · LOCKED (design.md §3.5) ---
  stone: 0x9aa0b4,
  stoneDark: 0x6b7089,
  stoneLight: 0xc3c8d8,
  stoneChain: 0x4d5168,

  wood: 0x8a5a33,
  woodDark: 0x5d3b21,
  goldDim: 0x9b7c2a,
  red: 0xd9483b,
  redDeep: 0x8f2b23,
  water: 0x2f6d8f,
  waterHi: 0x4ea3c9,
  moss: 0x3f7a4e,
  bone: 0xe6e0cf,
  purple: 0x7b5cd6,
  shadow: 0x0a0912,
  white: 0xffffff,
  green: 0x66c07a,
};

// Type — Archivo for UI/body, Cinzel (roman only, no italic) for display, with system emoji fallbacks.
export const FONT_UI = '"Archivo", system-ui, -apple-system, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Segoe UI", sans-serif';
export const FONT_DISPLAY = '"Cinzel", "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Times New Roman", serif';
export const FONT = FONT_UI;

// Chrome constants — the neobrutalist fingerprint (design.md §5.1).
export const CHROME = {
  BORDER_SM: 2,
  BORDER: 3,
  BORDER_LG: 4,
  SHADOW_SM: 4,
  SHADOW: 6,
  SHADOW_LG: 8,
  SHADOW_HOVER: 9,
  RADIUS: 0,
};

// Measured contrast helpers (hex pairs documented in design.md §3.6).
export const TEXT_ON = {
  onPaper: { title: 0x17130E, body: 0x2E2820, caption: 0x6B5F4A, accent: 0x94231C, gold: 0x9A7218 },
  onDark: { title: 0xEFE3C8, body: 0xE2D3AF, accent: 0xE8B73A },
  onGold: { title: 0x17130E, body: 0x17130E },
  onCrimson: { title: 0xffffff, body: 0xffffff },
  onLapis: { title: 0xEFE3C8, body: 0xEFE3C8 },
};

export function getInitDimensions() {
  const isLandscape = typeof window !== 'undefined' ? window.innerWidth >= window.innerHeight : true;
  return {
    isLandscape,
    W: isLandscape ? 1280 : 720,
    H: isLandscape ? 720 : 1280,
  };
}

export function getLayout(sceneOrWidth, height) {
  let w = typeof sceneOrWidth === 'number' ? sceneOrWidth : (sceneOrWidth?.scale?.width || 1280);
  let h = typeof height === 'number' ? height : (sceneOrWidth?.scale?.height || 720);
  const isLandscape = w > h;

  if (isLandscape) {
    const W = 1280;
    const H = 720;
    const GRID = 8;
    const CELL = 74;
    const BOARD_W = GRID * CELL; // 592
    const BOARD_X = 40;
    const BOARD_Y = 70;

    return {
      isLandscape: true,
      W, H, GRID, CELL, BOARD_W, BOARD_X, BOARD_Y,
      HUD: { x: 660, y: 12, w: 580, h: 78 },
      INFO: { x: 660, y: 98, w: 580, h: 100 },
      PAL: { x: 660, y: 206, w: 580, h: 348, cols: 4, btnW: 136, btnH: 162 },
      ACT: { x: 660, y: 562, w: 580, h: 146 },
    };
  } else {
    const W = 720;
    const H = 1280;
    const GRID = 8;
    const CELL = 78;
    const BOARD_W = GRID * CELL; // 624
    const BOARD_X = (W - BOARD_W) / 2; // 48
    const BOARD_Y = 134;

    return {
      isLandscape: false,
      W, H, GRID, CELL, BOARD_W, BOARD_X, BOARD_Y,
      HUD: { x: 0, y: 0, w: W, h: 126 },
      INFO: { x: 16, y: 766, w: W - 32, h: 90 },
      PAL: { x: 0, y: 864, w: W, h: 250, cols: 4, btnW: 156, btnH: 116 },
      ACT: { x: 0, y: 1128, w: W, h: 136 },
    };
  }
}

// Fallback static constants (used by default portrait or single stage reference)
const init = getInitDimensions();
export const W = init.W;
export const H = init.H;

export const GRID = 8;
export const CELL = init.isLandscape ? 74 : 78;
export const BOARD_W = GRID * CELL;
export const BOARD_X = init.isLandscape ? 40 : (W - BOARD_W) / 2;
export const BOARD_Y = init.isLandscape ? 70 : 134;

export const HUD_H = 126;
export const INFO_Y = init.isLandscape ? 98 : 766;
export const INFO_H = 90;
export const PAL_Y = init.isLandscape ? 206 : 864;
export const PAL_COLS = 4;
export const PAL_CELLS = 8;
export const BTN_W = init.isLandscape ? 136 : 156;
export const BTN_H = init.isLandscape ? 162 : 116;
export const ACT_Y = init.isLandscape ? 562 : 1128;
export const ACT_H = 136;

export const SPAWN_ROW = -1;
