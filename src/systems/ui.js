import Phaser from 'phaser';
import { C, CHROME, FONT, FONT_DISPLAY } from '../config/palette.js';
import { SFX } from './audio.js';

const DPR = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2;

// Hard offset shadow values — never blurred, never a gradient (design.md §5.1).
const SHADOW = CHROME.SHADOW;
const SHADOW_HOVER = CHROME.SHADOW_HOVER;
const BORDER = CHROME.BORDER;

const HEX_INK = hexStr(C.ink);
const HEX_PAPER = hexStr(C.paper);
const HEX_PAPER2 = hexStr(C.paper2);
const HEX_INK_SOFT = hexStr(C.inkSoft);
const HEX_MUTED = hexStr(C.muted);
const HEX_RULE = hexStr(C.rule);

// Accepts a Scene, a GameObjectFactory (`scene.add`), a GameObject, or a Container.
function asScene(a) {
  if (!a) return a;
  if (a.add && typeof a.add.rectangle === 'function') return a;   // Scene
  if (a.scene) return a.scene;                                  // factory / gameobject / container
  return a;
}

function srgbToLin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }

export function relLuminance(hex) {
  const v = hex >>> 0;
  const r = srgbToLin((v >> 16) & 255);
  const g = srgbToLin((v >> 8) & 255);
  const b = srgbToLin(v & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const l1 = relLuminance(a), l2 = relLuminance(b);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Pick label ink for a given fill so no call site can ship invisible text
 * (design.md §6). Light fills get ink; dark fills get paper.
 */
export function readableOn(fill) {
  return relLuminance(fill) > 0.42 ? C.ink : C.paper;
}

function hexStr(n) {
  if (typeof n === 'string') return n;
  return '#' + (n >>> 0).toString(16).padStart(6, '0');
}
export { hexStr as hex };

/* ------------------------------------------------------------------
   Keyboard focus registry.
   F6 cycles · ENTER activates · ring is INSTANT (design.md §7 state 3).
   F6 (not TAB) because TAB is already the game's "cycle piece" key —
   documented in the HOW TO PLAY screen, so it must not be hijacked.
   ------------------------------------------------------------------ */
const registries = new WeakMap();

function registryFor(scene) {
  let r = registries.get(scene);
  if (r) return r;
  r = { buttons: [], index: -1 };
  registries.set(scene, r);

  const kb = scene.input && scene.input.keyboard;
  if (kb) {
    kb.on('keydown-F6', (event) => {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      const live = r.buttons.filter((b) => isShown(b) && !b._api.disabled);
      if (!live.length) return;
      r.index = (r.index + (event && event.shiftKey ? -1 : 1) + live.length) % live.length;
      r.buttons.forEach((b) => { if (b._state === 'focus') b.setState('default'); });
      live[r.index].setState('focus');
    });
    kb.on('keydown-ENTER', () => {
      const live = r.buttons.filter((b) => isShown(b) && !b._api.disabled);
      const cur = live[r.index];
      if (!cur || cur._state !== 'focus') return;
      if (cur._onClick) { SFX.tap(); cur._onClick(cur._api); }
    });
  }
  return r;
}

function isShown(b) {
  let o = b;
  while (o) {
    if (o.visible === false) return false;
    o = o.parentContainer;
  }
  return b.active !== false;
}

export function hasFocusedButton(scene) {
  const r = registries.get(asScene(scene));
  if (!r) return false;
  const live = r.buttons.filter((b) => isShown(b) && !b._api.disabled);
  const cur = live[r.index];
  return !!cur && cur._state === 'focus';
}

export function clearButtonFocus(scene) {
  const r = registries.get(asScene(scene));
  if (!r) return;
  r.buttons.forEach((b) => { if (b._state === 'focus') b.setState('default'); });
  r.index = -1;
}

/* ------------------------------------------------------------------
   BUTTON — flat fill + 3px ink border + 6px hard offset shadow.
   8 states: default · hover · focus · active · disabled · loading
             · error · success
   ------------------------------------------------------------------ */
/* Shrink-to-fit: tracking first (tracking is the cheap knob), then size.
   A button label must never be wider than its plate (design.md §5.3). */
function fitText(t, maxW, size, minSize) {
  if (!t || !(t.width > 0) || !(maxW > 0)) return;
  let ls = Number(t.letterSpacing) || 0;
  let guard = 48;
  while (t.width > maxW && ls > 0 && guard-- > 0) { ls -= 1; t.setLetterSpacing(ls); }
  while (t.width > maxW && size > minSize && guard-- > 0) { size -= 1; t.setFontSize(`${size}px`); }
}

export function button(scene, opts) {
  scene = asScene(scene);
  const {
    x, y, w, h, label, sub = '', onClick = null, icon = null,
    fill = C.paper2, stroke = C.ink,
    fontSize = Math.round(h * 0.34), disabled = false,
  } = opts;

  let textColor = opts.textColor != null ? opts.textColor : readableOn(fill);
  const cont = scene.add.container(x, y);

  // 1. hard shadow — sits behind, offset down-right, never blurred.
  const shadow = scene.add.rectangle(SHADOW, SHADOW, w, h, C.ink, 1);
  // 2. plate — flat fill, heavy ink border, radius 0.
  const plate = scene.add.rectangle(0, 0, w, h, fill, 1).setStrokeStyle(BORDER, stroke, 1);
  // 3. focus ring — drawn outside the plate, toggled, no transition.
  const ring = scene.add.rectangle(0, 0, w + 8, h + 8)
    .setStrokeStyle(3, C.ink, 1).setVisible(false);
  // 4. semantic accent strip (left edge) for error/loading/success states.
  const accent = scene.add.rectangle(-w / 2 + 7, 0, 6, h - 8, C.crimson, 1).setVisible(false);
  cont.add([shadow, ring, plate, accent]);

  const hasLabel = label != null && String(label).length > 0;
  const hasIcon = !!(icon && scene.textures.exists(icon));

  let iconImg = null;
  if (hasIcon) {
    // Icon-only buttons centre the glyph; labelled buttons stack it above.
    const s = hasLabel ? Math.min(w * 0.42, h * 0.44) : Math.min(w * 0.62, h * 0.64);
    iconImg = scene.add.image(0, hasLabel ? -h * 0.24 : 0, icon).setDisplaySize(s, s);
    cont.add(iconImg);
  }

  const hasSub = hasLabel && !!sub && sub.length > 0;
  const txtY = hasIcon && hasLabel ? h * 0.16 : (hasSub ? -h * 0.14 : 0);
  let txt = null;
  if (hasLabel) {
    txt = scene.add.text(0, txtY, String(label).toUpperCase(), {
      fontFamily: FONT, fontSize: `${fontSize}px`, color: hexStr(textColor),
      align: 'center', fontStyle: 'bold',
      letterSpacing: Math.max(1, Math.round(fontSize * 0.08)),
      resolution: DPR,
    }).setOrigin(0.5);
    cont.add(txt);
    fitText(txt, w - 24, fontSize, 11);
  }

  let subTxt = null;
  if (hasSub) {
    // Sub is always the smaller partner: never more than half the title.
    const subSize = opts.subFontSize || Math.max(9, Math.round(Math.min(h * 0.2, fontSize * 0.5)));
    subTxt = scene.add.text(0, h * (hasIcon ? 0.37 : 0.22), String(sub).toUpperCase(), {
      fontFamily: FONT, fontSize: `${subSize}px`,
      color: hexStr(textColor === C.ink ? C.inkSoft : C.paper2),
      align: 'center', fontStyle: 'bold',
      letterSpacing: Math.max(0.5, Math.round(subSize * 0.08)),
      resolution: DPR,
    }).setOrigin(0.5);
    cont.add(subTxt);
    fitText(subTxt, w - 20, subSize, 9);
  }

  let baseFill = fill;
  let baseStroke = stroke;
  const api = { disabled: !!disabled };
  const onClickFn = onClick;

  const applyColors = (v) => {
    if (txt) txt.setColor(hexStr(v ? textColor : C.muted));
    if (subTxt) subTxt.setColor(hexStr(v ? (textColor === C.ink ? C.inkSoft : C.paper2) : C.muted));
    if (iconImg) iconImg.setAlpha(v ? 1 : 0.45);
    cont.setAlpha(v ? 1 : 0.9);
  };

  const setState = (state) => {
    cont._state = state;
    api.state = state;
    scene.tweens.killTweensOf([cont, plate, shadow, ring]);
    ring.setVisible(false);
    accent.setVisible(false);
    cont.setPosition(x, y);

    switch (state) {
      case 'focus':
        // Instant — focus is never animated (design.md §7).
        ring.setVisible(true);
        plate.setFillStyle(baseFill, 1).setStrokeStyle(BORDER, baseStroke, 1);
        shadow.setSize(w, h).setPosition(SHADOW_HOVER, SHADOW_HOVER);
        applyColors(true);
        break;

      case 'hover':
        scene.tweens.add({ targets: cont, y: y - 2, duration: 100, ease: 'Cubic.Out' });
        shadow.setPosition(SHADOW_HOVER, SHADOW_HOVER);
        plate.setFillStyle(baseFill, 1).setStrokeStyle(BORDER, baseStroke, 1);
        applyColors(true);
        break;

      case 'active':
        // Press: the plate translates ONTO its shadow (offset collapses). No squash.
        scene.tweens.add({ targets: cont, x: x + SHADOW, y: y + SHADOW, duration: 70, ease: 'Quad.Out' });
        shadow.setPosition(SHADOW, SHADOW);
        plate.setFillStyle(baseFill, 1).setStrokeStyle(BORDER, baseStroke, 1);
        applyColors(true);
        break;

      case 'disabled':
        plate.setFillStyle(C.paperEdge, 1).setStrokeStyle(BORDER, C.rule, 1);
        shadow.setSize(w, h).setAlpha(0);
        applyColors(false);
        break;

      case 'loading':
        plate.setFillStyle(C.paper2, 1).setStrokeStyle(BORDER, C.ink, 1);
        shadow.setAlpha(1).setPosition(SHADOW, SHADOW);
        accent.setVisible(true).setFillStyle(C.ink, 1);
        applyColors(true);
        break;

      case 'error':
        plate.setFillStyle(C.crimson, 1).setStrokeStyle(BORDER, C.ink, 1);
        shadow.setAlpha(1).setPosition(SHADOW, SHADOW);
        accent.setVisible(true).setFillStyle(C.ink, 1);
        applyColors(true);
        if (txt) txt.setColor(HEX_PAPER);
        if (subTxt) subTxt.setColor(HEX_PAPER);
        scene.tweens.add({ targets: cont, x: x + 2, duration: 40, yoyo: true, repeat: 2, ease: 'Quad.InOut' });
        break;

      case 'success':
        plate.setFillStyle(C.green, 1).setStrokeStyle(BORDER, C.ink, 1);
        shadow.setAlpha(1).setPosition(SHADOW, SHADOW);
        accent.setVisible(true).setFillStyle(C.ink, 1);
        applyColors(true);
        if (txt) txt.setColor(HEX_INK);
        if (subTxt) subTxt.setColor(HEX_INK);
        break;

      default: // 'default'
        cont.setPosition(x, y);
        shadow.setAlpha(1).setSize(w, h).setPosition(SHADOW, SHADOW);
        plate.setFillStyle(baseFill, 1).setStrokeStyle(BORDER, baseStroke, 1);
        applyColors(true);
    }
  };

  cont.setEnabled = (v) => setState(v ? 'default' : 'disabled');
  cont.setState = setState;
  // Re-role the button at runtime (fill/stroke/text). Mutates the BASE used by
  // every state, so a hover/pointerout cannot snap it back to the old colours.
  // Callers never need to touch text colour themselves — it re-derives from
  // readableOn(fill), which is the whole text<->surface contract (design.md §6).
  cont.setBase = (o = {}) => {
    if (o.fill !== undefined) baseFill = o.fill;
    if (o.stroke !== undefined) baseStroke = o.stroke;
    if (o.fill !== undefined || o.textColor !== undefined) {
      textColor = o.textColor !== undefined ? o.textColor : readableOn(baseFill);
    }
    setState(api.disabled ? 'disabled' : (cont._state === 'focus' ? 'focus' : 'default'));
  };
  // Swap the glyph on an icon-only button (toggle on/off states).
  cont.setIcon = (key) => {
    if (iconImg && key && scene.textures.exists(key)) iconImg.setTexture(key);
    return cont;
  };
  cont._api = api;
  cont._onClick = onClickFn;
  cont._state = 'default';

  plate.setInteractive({ useHandCursor: true });
  plate.on('pointerdown', (p) => {
    if (p.event && typeof p.event.button === 'number' && p.event.button !== 0) return;
    if (api.disabled) { SFX.deny(); return; }
    SFX.tap();
    setState('active');
    if (onClickFn) onClickFn(api);
  });
  plate.on('pointerover', () => { if (!api.disabled) setState('hover'); });
  plate.on('pointerout', () => { if (!api.disabled) setState('default'); });
  plate.on('pointerup', () => { if (!api.disabled && cont._state === 'active') setState('default'); });

  setState(disabled ? 'disabled' : 'default');

  const reg = registryFor(scene);
  reg.buttons.push(cont);
  cont.on('destroy', () => {
    const i = reg.buttons.indexOf(cont);
    if (i >= 0) { reg.buttons.splice(i, 1); if (reg.index >= reg.buttons.length) reg.index = reg.buttons.length - 1; }
  });

  cont.plate = plate;
  cont.label = txt;
  cont.subLabel = subTxt;
  cont.shadowRect = shadow;
  return cont;
}

/* ------------------------------------------------------------------
   HELPER — Checks if a string contains emojis or surrogate pairs
   ------------------------------------------------------------------ */
function hasEmojiGlyph(str) {
  if (typeof str !== 'string') return false;
  return /[\uD800-\uDFFF]/.test(str) || /\p{Extended_Pictographic}/u.test(str);
}

/* ------------------------------------------------------------------
   LABEL — Archivo, tracked when uppercase is requested.
   ------------------------------------------------------------------ */
export function label(scene, x, y, text, size = 22, color = HEX_PAPER, origin = [0.5, 0.5]) {
  scene = asScene(scene);
  const isUpper = typeof text === 'string' && text === text.toUpperCase() && text.length > 1 && /[A-Z]/.test(text);
  const withEmoji = hasEmojiGlyph(text);
  return scene.add.text(x, y, text, {
    fontFamily: FONT, fontSize: `${size}px`, color: hexStr(color), align: 'center',
    letterSpacing: (isUpper && !withEmoji) ? Math.max(1, Math.round(size * 0.08)) : 0,
    resolution: DPR,
  }).setOrigin(origin[0], origin[1]);
}

/* ------------------------------------------------------------------
   DISPLAY LABEL — Cinzel 700, display-only (design.md §4).
   Roman caps only, no italics, tracked slightly wider than UI labels.
   ------------------------------------------------------------------ */
export function displayLabel(scene, x, y, text, size = 42, color = HEX_INK, origin = [0.5, 0.5]) {
  scene = asScene(scene);
  const withEmoji = hasEmojiGlyph(text);
  return scene.add.text(x, y, text, {
    fontFamily: FONT_DISPLAY, fontSize: `${size}px`, color: hexStr(color), align: 'center',
    fontStyle: 'bold',
    letterSpacing: withEmoji ? 0 : Math.max(1, Math.round(size * 0.05)),
    resolution: DPR,
  }).setOrigin(origin[0], origin[1]);
}

/* ------------------------------------------------------------------
   PANEL SLAB — the shared chrome fingerprint (design.md §5.3).
   [ hard ink shadow (offset, never blurred) , plate , stroke , header ]
   Returns an array ready for `container.add([...])` / `scene.add([...])`.
   ------------------------------------------------------------------ */
export function panelSlab(x, y, w, h, opts = {}) {
  const {
    fill = C.paper,
    stroke = C.ink,
    border = CHROME.BORDER_LG,
    shadow = CHROME.SHADOW,
    shadowColor = C.ink,
    alpha = 1,
    header = null,          // string -> crimson header bar with Cinzel label
    headerFill = C.crimson,
    headerColor = C.paper,
    headerSize = 24,
  } = opts;

  const out = [];
  if (shadow > 0) out.push({ type: 'shadow', x: x + shadow, y: y + shadow, w, h, fill: shadowColor, alpha });
  const plate = { type: 'plate', x, y, w, h, fill, alpha, stroke, border };
  out.push(plate);

  if (header) {
    const hh = Math.min(46, Math.round(h * 0.34));
    const hy = y - h / 2 + border + hh / 2;
    out.push({ type: 'header', x, y: hy, w: w - border * 2, h: hh, fill: headerFill, alpha });
    out.push({ type: 'headerText', x, y: hy, text: header, size: headerSize, color: headerColor });
  }
  return out;
}

/* Instantiate panelSlab() output into real objects and add them to `target`
   (a Scene, a GameObjectFactory, or a Container). */
export function addPanel(target, x, y, w, h, opts = {}) {
  const scene = asScene(target);
  const parts = panelSlab(x, y, w, h, opts);
  const objs = [];
  for (const p of parts) {
    if (p.type === 'shadow') objs.push(scene.add.rectangle(p.x, p.y, p.w, p.h, p.fill, p.alpha));
    else if (p.type === 'plate') {
      const r = scene.add.rectangle(p.x, p.y, p.w, p.h, p.fill, p.alpha);
      if (p.stroke != null) r.setStrokeStyle(p.border, p.stroke, 1);
      objs.push(r);
    } else if (p.type === 'header') objs.push(scene.add.rectangle(p.x, p.y, p.w, p.h, p.fill, p.alpha));
    else if (p.type === 'headerText') {
      const t = displayLabel(scene, p.x, p.y + 1, p.text, p.size, p.color);
      if (!hasEmojiGlyph(p.text) && t.setLetterSpacing) {
        t.setLetterSpacing(Math.max(1, Math.round(p.size * 0.12)));
      }
      objs.push(t);
    }
  }
  if (target && Array.isArray(target.list) && typeof target.add === 'function') {
    target.add(objs);
  }
  return objs;
}

/* ------------------------------------------------------------------
   TOAST — parchment sticker, 3px ink border, 4px hard shadow,
   semantic accent bar. NO text outline (the slab separates it).
   Enters Cubic.Out, never Back.Out (design.md §5.5, §8).
   ------------------------------------------------------------------ */
function toastAccent(color) {
  if (typeof color === 'number') {
    if (color === C.crimson) return C.crimson;
    if (color === C.lapis) return C.lapis;
    if (color === C.green) return C.green;
    if (color === C.gold || color === C.goldInk) return C.goldInk;
    if (color === C.ink || color === C.rule) return C.rule;
    return C.goldInk;
  }
  const c = String(color || '').toLowerCase();
  if (c.includes('d9483b') || c.includes('e53e3e') || c.includes('ff386c')) return C.crimson;
  if (c.includes('66c07a') || c.includes('4ea3c9') || c.includes('dd6b20')) return C.green;
  if (c.includes('7b5cd6') || c.includes('9b59b6') || c.includes('805ad5')) return C.lapis;
  if (c.includes('d5d0e6') || c.includes('cfc9de') || c.includes('9a94b5')) return C.rule;
  return C.goldInk;
}

export function toast(scene, x, y, text, color = C.gold, size = 26) {
  scene = asScene(scene);
  if (!scene || !scene.add) return null;

  if (!scene._activeToasts) scene._activeToasts = [];
  // Clean up any stale destroyed toasts
  scene._activeToasts = scene._activeToasts.filter((t) => t.cont && t.cont.active && t.cont.scene);

  const txt = scene.add.text(0, 0, text, {
    fontFamily: FONT, fontSize: `${size}px`, color: HEX_INK, align: 'center',
    fontStyle: 'bold', letterSpacing: Math.max(1, Math.round(size * 0.06)),
    lineSpacing: 4, resolution: DPR,
  }).setOrigin(0.5);

  const padX = 26;
  const padY = 16;
  const barW = 8;
  const boxW = Math.ceil(txt.displayWidth) + padX * 2 + barW;
  const boxH = Math.ceil(txt.displayHeight) + padY * 2;

  const cont = scene.add.container(x, y).setDepth(500);
  const shadow = scene.add.rectangle(4, 4, boxW, boxH, C.ink, 1);
  const slab = scene.add.rectangle(0, 0, boxW, boxH, C.paper, 1).setStrokeStyle(3, C.ink, 1);
  const bar = scene.add.rectangle(-boxW / 2 + barW / 2 + 3, 0, barW, boxH - 6, toastAccent(color), 1);
  txt.setX(barW / 2 + 2);
  cont.add([shadow, slab, bar, txt]);

  cont.setAlpha(0);
  cont.y = y + 18;

  // Push existing overlapping/nearby toasts upward to make room
  const spacing = 12;
  const shiftAmount = boxH + spacing;
  for (const prev of scene._activeToasts) {
    if (Math.abs(prev.x - x) < 220) {
      prev.targetY -= shiftAmount;
      scene.tweens.add({
        targets: prev.cont,
        y: prev.targetY,
        duration: 200,
        ease: 'Cubic.Out',
      });
      // If pushed too high (offscreen or near header), expedite fadeout
      if (prev.targetY < 70) {
        scene.tweens.add({ targets: prev.cont, alpha: 0, duration: 180, onComplete: () => prev.cont.destroy() });
      }
    }
  }

  // Cap maximum concurrent stacked toasts to 4
  if (scene._activeToasts.length >= 4) {
    const oldest = scene._activeToasts.shift();
    if (oldest && oldest.cont && oldest.cont.active) {
      scene.tweens.add({ targets: oldest.cont, alpha: 0, duration: 150, onComplete: () => oldest.cont.destroy() });
    }
  }

  const toastEntry = { cont, x, targetY: y, boxH };
  scene._activeToasts.push(toastEntry);

  // Entrance
  scene.tweens.add({ targets: cont, alpha: 1, y, duration: 180, ease: 'Cubic.Out' });

  // Lifespan & Exit
  const lifeMs = Math.max(1600, 1200 + String(text).length * 28);
  scene.tweens.add({
    targets: cont,
    alpha: 0,
    duration: 350,
    delay: lifeMs,
    ease: 'Quad.In',
    onComplete: () => {
      if (cont && cont.destroy) cont.destroy();
      if (scene._activeToasts) {
        scene._activeToasts = scene._activeToasts.filter((t) => t.cont !== cont);
      }
    },
  });

  return cont;
}

