// Hallmark redesign — GameScene.js palette + chrome + icon sweep.
// Explicit ordered [old, new] pairs. Reports MISS for anything unmatched.
import fs from 'node:fs';

const P = 'C:/Users/TADS/WORK/hackathon/gamejam/src/scenes/GameScene.js';
let s = fs.readFileSync(P, 'utf8');
const pairs = [];
const add = (o, n, tag) => pairs.push({ o: Array.isArray(o) ? o.join('\n') : o, n: Array.isArray(n) ? n.join('\n') : n, tag });

/* ---------------------------------------------------------------- 0. imports */
add(
  "import { button, label, toast } from '../systems/ui.js';",
  "import { button, label, toast, displayLabel, hex, hasFocusedButton } from '../systems/ui.js';",
  'import');

/* --------------------------------------------------- 1. board mat + aid range */
add('boardW + 16, boardW + 16, 0x0d0b16, 1)', 'boardW + 16, boardW + 16, C.ink, 1)', 'board mat');
add(
  'const rTile = this.add.rectangle(rx, ry, CELL - 4, CELL - 4, 0x7a1844, 0.45).setStrokeStyle(2, 0xff386c, 0.85);',
  'const rTile = this.add.rectangle(rx, ry, CELL - 4, CELL - 4, C.crimson, 0.32).setStrokeStyle(2, C.crimsonDeep, 0.9);',
  'aid range tile');

/* --------------------------------------------------------- 2. HUD — landscape */
add([
  'g.add(this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, 0x0d0b16, 0.94).setStrokeStyle(2, C.line));',
  '',
  'g.add(this.add.circle(sx + 34, sy + 22, 13, C.gold, 1));',
  'g.add(this.add.circle(sx + 34, sy + 22, 8, C.goldDim, 1));',
  "this.goldText = label(this.add, sx + 58, sy + 22, '120', 25, '#ffd56b', [0, 0.5]).setFontStyle('bold');",
  'g.add(this.goldText);',
  '',
  "this.waveText = label(this.add, sx + sw / 2 - 10, sy + 22, 'BUILD PHASE', 21, '#ffffff').setFontStyle('bold');",
  'g.add(this.waveText);',
].join('\n'), [
  'g.add(this.add.rectangle(sx + sw / 2 + 8, sy + sh / 2 + 8, sw, sh, C.ink, 1));',
  'g.add(this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, C.paper, 1).setStrokeStyle(3, C.ink, 1));',
  '',
  'g.add(this.add.circle(sx + 34, sy + 22, 13, C.gold, 1).setStrokeStyle(2, C.ink, 1));',
  'g.add(this.add.circle(sx + 34, sy + 22, 8, C.goldDim, 1));',
  "this.goldText = label(this.add, sx + 58, sy + 22, '120', 25, C.goldInk, [0, 0.5]).setFontStyle('bold');",
  'g.add(this.goldText);',
  '',
  "this.waveText = label(this.add, sx + sw / 2 - 10, sy + 22, 'BUILD PHASE', 21, C.ink).setFontStyle('bold');",
  'g.add(this.waveText);',
].join('\n'), 'HUD landscape head');

add(
  "x: sx + sw - 144, y: sy + 22, w: 82, h: 36, label: '1x SPD', fontSize: 15,",
  "x: sx + sw - 144, y: sy + 22, w: 82, h: 36, label: '\u00bb 1X', fontSize: 22,",
  'speed btn ls');
add([
  "x: sx + sw - 50, y: sy + 22, w: 82, h: 36, label: 'MENU', fontSize: 16,",
  '  onClick: () => this.confirmExit(),',
  '});',
  'g.add([this.speedBtn, this.menuBtn]);',
].join('\n'), [
  "x: sx + sw - 50, y: sy + 22, w: 82, h: 36, label: '\u2630', fontSize: 26,",
  '  onClick: () => this.confirmExit(),',
  '});',
  'g.add([this.speedBtn, this.menuBtn]);',
].join('\n'), 'menu btn ls A');
add(
  "x: sx + sw - 56, y: sy + 22, w: 92, h: 36, label: 'MENU', fontSize: 16,",
  "x: sx + sw - 56, y: sy + 22, w: 92, h: 36, label: '\u2630', fontSize: 26,",
  'menu btn ls B');

add([
  "g.add(label(this.add, sx + 20, sy + 48, 'KEEP', 15, '#dcd7eb', [0, 0.5]).setFontStyle('bold'));",
  'this.keepBarBg = this.add.rectangle(sx + 70, sy + 48, sw - 140, 16, 0x241f3a, 1).setOrigin(0, 0.5);',
  'this.keepBarFg = this.add.rectangle(sx + 70, sy + 48, sw - 140, 12, C.green, 1).setOrigin(0, 0.5);',
  'g.add([this.keepBarBg, this.keepBarFg]);',
  "this.keepBarText = label(this.add, sx + sw - 20, sy + 48, '', 14, '#ffffff', [1, 0.5]).setFontStyle('bold');",
  'g.add(this.keepBarText);',
  '',
  "this.statusText = label(this.add, sx + 20, sy + 70, '', 16, '#ffd56b', [0, 0.5]).setFontStyle('bold');",
  "this.statusRight = label(this.add, sx + sw - 20, sy + 70, '', 16, '#ffffff', [1, 0.5]).setFontStyle('bold');",
].join('\n'), [
  "g.add(label(this.add, sx + 20, sy + 48, '\u2665', 24, C.crimson, [0, 0.5]).setFontStyle('bold'));",
  'this.keepBarBg = this.add.rectangle(sx + 70, sy + 48, sw - 140, 16, C.ink, 1).setOrigin(0, 0.5);',
  'this.keepBarFg = this.add.rectangle(sx + 70, sy + 48, sw - 140, 12, C.green, 1).setOrigin(0, 0.5);',
  'g.add([this.keepBarBg, this.keepBarFg]);',
  "this.keepBarText = label(this.add, sx + sw - 20, sy + 48, '', 14, C.ink, [1, 0.5]).setFontStyle('bold');",
  'g.add(this.keepBarText);',
  '',
  "this.statusText = label(this.add, sx + 20, sy + 70, '', 16, C.crimsonDeep, [0, 0.5]).setFontStyle('bold');",
  "this.statusRight = label(this.add, sx + sw - 20, sy + 70, '', 16, C.ink, [1, 0.5]).setFontStyle('bold');",
].join('\n'), 'HUD landscape body');

/* ---------------------------------------------------------- 3. HUD — portrait */
add([
  'g.add(this.add.rectangle(W / 2, 63, W, 126, 0x0d0b16, 0.94));',
  'g.add(this.add.rectangle(W / 2, 125, W, 3, C.gold, 0.5));',
  '',
  'g.add(this.add.circle(44, 34, 15, C.gold, 1));',
  'g.add(this.add.circle(44, 34, 9, C.goldDim, 1));',
  "this.goldText = label(this.add, 70, 34, '120', 30, '#ffd56b', [0, 0.5]).setFontStyle('bold');",
  'g.add(this.goldText);',
  '',
  "this.waveText = label(this.add, W / 2 - 35, 34, 'BUILD PHASE', 22, '#ffffff').setFontStyle('bold');",
  'g.add(this.waveText);',
].join('\n'), [
  'g.add(this.add.rectangle(8, 71, W, 126, C.ink, 1));',
  'g.add(this.add.rectangle(0, 63, W, 126, C.paper, 1).setStrokeStyle(3, C.ink, 1));',
  'g.add(this.add.rectangle(W / 2, 124, W - 6, 3, C.crimson, 1));',
  '',
  'g.add(this.add.circle(44, 34, 15, C.gold, 1).setStrokeStyle(2, C.ink, 1));',
  'g.add(this.add.circle(44, 34, 9, C.goldDim, 1));',
  "this.goldText = label(this.add, 70, 34, '120', 30, C.goldInk, [0, 0.5]).setFontStyle('bold');",
  'g.add(this.goldText);',
  '',
  "this.waveText = label(this.add, W / 2 - 35, 34, 'BUILD PHASE', 22, C.ink).setFontStyle('bold');",
  'g.add(this.waveText);',
].join('\n'), 'HUD portrait head');

add(
  "x: W - 140, y: 34, w: 84, h: 50, label: '1x SPD', fontSize: 17,",
  "x: W - 140, y: 34, w: 84, h: 50, label: '\u00bb 1X', fontSize: 26,",
  'speed btn portrait');
add([
  "x: W - 50, y: 34, w: 84, h: 50, label: 'MENU', fontSize: 17,",
  '  onClick: () => this.confirmExit(),',
  '});',
  'g.add([this.speedBtn, this.menuBtn]);',
].join('\n'), [
  "x: W - 50, y: 34, w: 84, h: 50, label: '\u2630', fontSize: 30,",
  '  onClick: () => this.confirmExit(),',
  '});',
  'g.add([this.speedBtn, this.menuBtn]);',
].join('\n'), 'menu btn portrait A');
add(
  "x: W - 60, y: 34, w: 100, h: 50, label: 'MENU', fontSize: 18,",
  "x: W - 60, y: 34, w: 100, h: 50, label: '\u2630', fontSize: 30,",
  'menu btn portrait B');

add([
  "g.add(label(this.add, 30, 74, 'KEEP', 16, '#dcd7eb', [0, 0.5]).setFontStyle('bold'));",
  'this.keepBarBg = this.add.rectangle(90, 74, W - 120, 18, 0x241f3a, 1).setOrigin(0, 0.5);',
  'this.keepBarFg = this.add.rectangle(90, 74, W - 120, 14, C.green, 1).setOrigin(0, 0.5);',
  'g.add([this.keepBarBg, this.keepBarFg]);',
  "this.keepBarText = label(this.add, W - 40, 74, '', 15, '#ffffff', [1, 0.5]).setFontStyle('bold');",
  'g.add(this.keepBarText);',
  '',
  "this.statusText = label(this.add, 30, 106, '', 18, '#ffd56b', [0, 0.5]).setFontStyle('bold');",
  'g.add(this.statusText);',
  "this.statusRight = label(this.add, W - 30, 106, '', 18, '#ffffff', [1, 0.5]).setFontStyle('bold');",
].join('\n'), [
  "g.add(label(this.add, 30, 74, '\u2665', 26, C.crimson, [0, 0.5]).setFontStyle('bold'));",
  'this.keepBarBg = this.add.rectangle(90, 74, W - 170, 18, C.ink, 1).setOrigin(0, 0.5);',
  'this.keepBarFg = this.add.rectangle(90, 74, W - 170, 14, C.green, 1).setOrigin(0, 0.5);',
  'g.add([this.keepBarBg, this.keepBarFg]);',
  "this.keepBarText = label(this.add, W - 40, 74, '', 15, C.ink, [1, 0.5]).setFontStyle('bold');",
  'g.add(this.keepBarText);',
  '',
  "this.statusText = label(this.add, 30, 106, '', 18, C.crimsonDeep, [0, 0.5]).setFontStyle('bold');",
  "this.statusRight = label(this.add, W - 30, 106, '', 18, C.ink, [1, 0.5]).setFontStyle('bold');",
].join('\n'), 'HUD portrait body');

add(
  'const barWidth = isLandscape ? (580 - 140) : (W - 120);',
  'const barWidth = isLandscape ? (580 - 140) : (W - 170);',
  'keep bar width');

/* ------------------------------------------------------------- 4. panel plates */
// L284 + L357 are byte-identical (info bar + siege panel, landscape).
add([
  'g.add(this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, C.panel, 0.96).setStrokeStyle(2, C.line));',
].join('\n'), [
  'g.add(this.add.rectangle(sx + sw / 2 + 8, sy + sh / 2 + 8, sw, sh, C.ink, 1));',
  'g.add(this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, C.paper, 1).setStrokeStyle(3, C.ink, 1));',
].join('\n'), 'panel plate ls (x2)');
add(
  'g.add(this.add.rectangle(W / 2, INFO_Y + 48, W - 28, 96, C.panel, 0.96).setStrokeStyle(2, C.line));',
  [
    'g.add(this.add.rectangle(W / 2 + 8, INFO_Y + 56, W - 28, 96, C.ink, 1));',
    'g.add(this.add.rectangle(W / 2, INFO_Y + 48, W - 28, 96, C.paper, 1).setStrokeStyle(3, C.ink, 1));',
  ].join('\n'),
  'info plate portrait');
add(
  'g.add(this.add.rectangle(W / 2, 940, W - 32, 336, C.panel, 0.96).setStrokeStyle(2, C.line));',
  [
    'g.add(this.add.rectangle(W / 2 + 8, 948, W - 32, 336, C.ink, 1));',
    'g.add(this.add.rectangle(W / 2, 940, W - 32, 336, C.paper, 1).setStrokeStyle(3, C.ink, 1));',
  ].join('\n'),
  'siege plate portrait');

/* ------------------------------------------------------- 5. shared text styles */
add("fontSize: '19px', color: '#ffffff', fontStyle: 'bold',",
    "fontSize: '19px', color: hex(C.ink), fontStyle: 'bold',", 'infoTitle x2');
add("fontSize: '13px', color: '#d5d0e6',", "fontSize: '13px', color: hex(C.inkSoft),", 'infoBody ls');
add("fontSize: '13.5px', color: '#d5d0e6',", "fontSize: '13.5px', color: hex(C.inkSoft),", 'infoBody pt');

/* --------------------------------------------------------- 6. siege panel text */
add(
  "g.add(label(this.add, sx + 20, sy + 24, 'THE FIELD', 17, '#ffffff', [0, 0.5]).setFontStyle('bold'));",
  "g.add(label(this.add, sx + 20, sy + 24, 'THE FIELD', 17, C.ink, [0, 0.5]).setFontStyle('bold'));",
  'THE FIELD ls');
add(
  "g.add(label(this.add, 48, 798, 'THE FIELD', 18, '#ffffff', [0, 0.5]).setFontStyle('bold'));",
  "g.add(label(this.add, 48, 798, 'THE FIELD', 18, C.ink, [0, 0.5]).setFontStyle('bold'));",
  'THE FIELD pt');

add(
  "this.siegeRemain = label(this.add, sx + sw - 20, sy + 24, '', 17, '#ffd56b', [1, 0.5]).setFontStyle('bold');",
  "this.siegeRemain = label(this.add, sx + sw - 20, sy + 24, '', 17, C.crimsonDeep, [1, 0.5]).setFontStyle('bold');",
  'siegeRemain ls');
add(
  "this.siegeRemain = label(this.add, W - 48, 798, '', 18, '#ffd56b', [1, 0.5]).setFontStyle('bold');",
  "this.siegeRemain = label(this.add, W - 48, 798, '', 18, C.crimsonDeep, [1, 0.5]).setFontStyle('bold');",
  'siegeRemain pt');

add(
  'this.waveBarBg = this.add.rectangle(sx + 20, sy + 54, sw - 40, 16, 0x241f3a, 1).setOrigin(0, 0.5);',
  'this.waveBarBg = this.add.rectangle(sx + 20, sy + 54, sw - 40, 16, C.ink, 1).setOrigin(0, 0.5);',
  'waveBarBg ls');
add(
  'this.waveBarBg = this.add.rectangle(48, 830, W - 96, 16, 0x241f3a, 1).setOrigin(0, 0.5);',
  'this.waveBarBg = this.add.rectangle(48, 830, W - 96, 16, C.ink, 1).setOrigin(0, 0.5);',
  'waveBarBg pt');

add(
  "this.waveBarText = label(this.add, sx + 20, sy + 82, '', 16, '#ffffff', [0, 0.5]).setFontStyle('bold');",
  "this.waveBarText = label(this.add, sx + 20, sy + 82, '', 16, C.ink, [0, 0.5]).setFontStyle('bold');",
  'waveBarText ls');
add(
  "this.waveBarRight = label(this.add, sx + sw - 20, sy + 82, '', 16, '#d5d0e6', [1, 0.5]);",
  "this.waveBarRight = label(this.add, sx + sw - 20, sy + 82, '', 16, C.inkSoft, [1, 0.5]);",
  'waveBarRight ls');
add(
  "this.waveBarText = label(this.add, 48, 862, '', 17, '#ffffff', [0, 0.5]).setFontStyle('bold');",
  "this.waveBarText = label(this.add, 48, 862, '', 17, C.ink, [0, 0.5]).setFontStyle('bold');",
  'waveBarText pt');
add(
  "this.waveBarRight = label(this.add, W - 48, 862, '', 17, '#d5d0e6', [1, 0.5]);",
  "this.waveBarRight = label(this.add, W - 48, 862, '', 17, C.inkSoft, [1, 0.5]);",
  'waveBarRight pt');

add(
  'g.add(this.add.rectangle(sx + sw / 2, sy + 180, sw - 40, 2, C.line, 0.9));',
  'g.add(this.add.rectangle(sx + sw / 2, sy + 180, sw - 40, 2, C.ink, 1));',
  'divider ls');
add(
  'g.add(this.add.rectangle(W / 2, 962, W - 96, 2, C.line, 0.9));',
  'g.add(this.add.rectangle(W / 2, 962, W - 96, 2, C.ink, 1));',
  'divider pt');

add(
  "this.siegeStats = label(this.add, sx + 20, sy + 210, '', 17, '#ffffff', [0, 0.5]);",
  "this.siegeStats = label(this.add, sx + 20, sy + 210, '', 17, C.ink, [0, 0.5]);",
  'siegeStats ls');
add(
  "this.siegeSyn = label(this.add, sx + 20, sy + 245, '', 16, '#ffd56b', [0, 0.5]);",
  "this.siegeSyn = label(this.add, sx + 20, sy + 245, '', 16, C.muted, [0, 0.5]);",
  'siegeSyn ls');
add(
  "this.siegeHelp = label(this.add, sx + 20, sy + 280, 'Tap ROYAL AID, then tap the field to drop a volley.', 16, '#d5d0e6', [0, 0.5]);",
  "this.siegeHelp = label(this.add, sx + 20, sy + 280, 'Tap ROYAL AID, then tap the field to drop a volley.', 16, C.inkSoft, [0, 0.5]);",
  'siegeHelp ls');
add(
  "this.siegeStats = label(this.add, 48, 994, '', 18, '#ffffff', [0, 0.5]);",
  "this.siegeStats = label(this.add, 48, 994, '', 18, C.ink, [0, 0.5]);",
  'siegeStats pt');
add(
  "this.siegeSyn = label(this.add, 48, 1026, '', 17, '#ffd56b', [0, 0.5]);",
  "this.siegeSyn = label(this.add, 48, 1026, '', 17, C.muted, [0, 0.5]);",
  'siegeSyn pt');
add(
  "this.siegeHelp = label(this.add, 48, 1058, 'Tap ROYAL AID, then tap the field to drop a volley.', 17, '#d5d0e6', [0, 0.5]);",
  "this.siegeHelp = label(this.add, 48, 1058, 'Tap ROYAL AID, then tap the field to drop a volley.', 17, C.inkSoft, [0, 0.5]);",
  'siegeHelp pt');

/* ---------------------------------------------------------------- 7. roster */
add(
  'const cardBg = this.add.rectangle(cx, cy, slotW - 6, 64, 0x141024, 0.85).setStrokeStyle(1, C.line, 0.6);',
  'const cardBg = this.add.rectangle(cx, cy, slotW - 6, 64, C.paper2, 1).setStrokeStyle(2, C.ink, 1);',
  'roster card ls');
add(
  'const cardBg = this.add.rectangle(cx, cy, slotW - 6, 68, 0x141024, 0.85).setStrokeStyle(1, C.line, 0.6);',
  'const cardBg = this.add.rectangle(cx, cy, slotW - 6, 68, C.paper2, 1).setStrokeStyle(2, C.ink, 1);',
  'roster card pt');
add(
  "const txt = label(this.add, cx + (slotW > 75 ? 16 : 12), cy - 6, `×${grp.total}`, 16, '#ffffff', [0.5, 0.5]).setFontStyle('bold');",
  "const txt = label(this.add, cx + (slotW > 75 ? 16 : 12), cy - 6, `×${grp.total}`, 16, C.crimsonDeep, [0.5, 0.5]).setFontStyle('bold');",
  'roster txt ls');
add(
  "const name = label(this.add, cx, cy + 20, def.name, 12, '#d5d0e6', [0.5, 0.5]);",
  'const name = label(this.add, cx, cy + 20, def.name, 12, C.inkSoft, [0.5, 0.5]);',
  'roster name ls');
add(
  "const txt = label(this.add, cx + (slotW > 85 ? 18 : 14), cy - 6, `×${grp.total}`, 18, '#ffffff', [0.5, 0.5]).setFontStyle('bold');",
  "const txt = label(this.add, cx + (slotW > 85 ? 18 : 14), cy - 6, `×${grp.total}`, 18, C.crimsonDeep, [0.5, 0.5]).setFontStyle('bold');",
  'roster txt pt');
add(
  "const name = label(this.add, cx, cy + 22, def.name, 13, '#d5d0e6', [0.5, 0.5]);",
  'const name = label(this.add, cx, cy + 22, def.name, 13, C.inkSoft, [0.5, 0.5]);',
  'roster name pt');

add(
  "s.txt.setColor(left > 0 ? '#ffd56b' : '#6f6a8c');",
  's.txt.setColor(left > 0 ? hex(C.crimsonDeep) : hex(C.muted));',
  'roster live count');
add(
  "if (s.name) s.name.setColor(left > 0 ? '#d5d0e6' : '#6f6a8c');",
  'if (s.name) s.name.setColor(left > 0 ? hex(C.inkSoft) : hex(C.muted));',
  'roster live name');
add(
  "this.siegeSyn.setText(syn).setColor(act.length ? '#ffd56b' : '#b8b2d1');",
  'this.siegeSyn.setText(syn).setColor(act.length ? hex(C.crimsonDeep) : hex(C.muted));',
  'synergy line');

/* ------------------------------------------------------------ 8. button roles */
add("label: 'CANCEL', fontSize: 22, fill: 0x2a1a1a, stroke: 0x6b3030,",
    "label: 'CANCEL', fontSize: 22, fill: C.paper2, stroke: C.ink,", 'btn cancel');
add('fill: 0x3a2f18, stroke: C.gold,', 'fill: C.gold, stroke: C.ink,', 'btn primary xN');
add('fill: 0x2e2516, stroke: C.gold,', 'fill: C.gold, stroke: C.ink,', 'btn god speed');
add('fill: 0x241f4a, stroke: C.purple,', 'fill: C.lapis, stroke: C.ink,', 'btn aid x3');
add('fill: 0x3a245a, stroke: 0x9b59b6,', 'fill: C.lapis, stroke: C.ink,', 'btn wheel x2');
add('fill: 0x1d2238, stroke: 0x4e6fc9,', 'fill: C.lapis, stroke: C.ink,', 'btn move x3');
add('fill: 0x2a1a1a, stroke: 0x6b3030,', 'fill: C.crimson, stroke: C.ink,', 'btn sell x3');
add('fill: 0x17261c, stroke: 0x2f6b3f,', 'fill: C.green, stroke: C.ink,', 'btn repair x4');
add('fill: 0x4a1818, stroke: 0x9b2a2a,', 'fill: C.crimson, stroke: C.ink,', 'btn nuke');
add('fill: 0x3a1818, stroke: 0xd9483b,', 'fill: C.crimson, stroke: C.ink,', 'btn beg mercy');
add('fill: 0x241f3a, stroke: C.line,', 'fill: C.paper2, stroke: C.ink,', 'btn tool/menu');

/* ---------------------------------------------------------- 9. action bar text */
add(
  "this.siegeInfo = label(this.add, sx + 20, sy + 18, '', 17, '#ffffff', [0, 0.5]).setVisible(false);",
  "this.siegeInfo = label(this.add, sx + 20, sy + 18, '', 17, C.paper, [0, 0.5]).setVisible(false);",
  'siegeInfo ls');
add(
  "this.siegeInfo = label(this.add, 48, ACT_Y + 12, '', 18, '#ffffff', [0, 0.5]).setVisible(false);",
  "this.siegeInfo = label(this.add, 48, ACT_Y + 12, '', 18, C.paper, [0, 0.5]).setVisible(false);",
  'siegeInfo pt');
add("fontSize: '13.5px', color: '#ffd56b', fontStyle: 'bold',",
    "fontSize: '13.5px', color: hex(C.gold), fontStyle: 'bold',", 'hint ls');
add("fontSize: '14.5px', color: '#ffd56b', fontStyle: 'bold',",
    "fontSize: '14.5px', color: hex(C.gold), fontStyle: 'bold',", 'hint pt');

/* ------------------------------------------------------------- 10. banner */
add([
  'this.bannerPlate = this.add.rectangle(0, 0, 620, 150, 0x0d0b16, 0.95).setStrokeStyle(3, C.gold, 0.8);',
  "this.bannerTitle = label(this.add, 0, -26, '', 42, '#e8b73a').setFontStyle('bold');",
  "this.bannerSub = label(this.add, 0, 30, '', 22, '#cfc9de');",
  'this.banner.add([this.bannerPlate, this.bannerTitle, this.bannerSub]);',
].join('\n'), [
  'this.bannerShadow = this.add.rectangle(8, 8, 620, 150, C.ink, 1);',
  'this.bannerPlate = this.add.rectangle(0, 0, 620, 150, C.paper, 1).setStrokeStyle(4, C.ink, 1);',
  "this.bannerTitle = displayLabel(this.add, 0, -26, '', 42, C.ink).setFontStyle('bold');",
  "this.bannerSub = label(this.add, 0, 30, '', 22, C.inkSoft);",
  'this.banner.add([this.bannerShadow, this.bannerPlate, this.bannerTitle, this.bannerSub]);',
].join('\n'), 'banner');

add([
  '  showBanner(title, sub) {',
  '    this.bannerTitle.setText(title);',
  '    this.bannerSub.setText(sub);',
  '    this.banner.setAlpha(0).setScale(0.85);',
  "    this.tweens.add({ targets: this.banner, alpha: 1, scale: 1, duration: 240, ease: 'Back.Out' });",
  "    this.tweens.add({ targets: this.banner, alpha: 0, duration: 300, delay: 1400, ease: 'Cubic.In' });",
  '  }',
].join('\n'), [
  '  showBanner(title, sub) {',
  '    this.bannerTitle.setText(title);',
  '    this.bannerSub.setText(sub);',
  '    const y0 = this.bannerY0 == null ? this.banner.y : this.bannerY0;',
  '    this.bannerY0 = y0;',
  '    this.banner.setAlpha(0).setY(y0 + 14);',
  "    this.tweens.add({ targets: this.banner, alpha: 1, y: y0, duration: 180, ease: 'Cubic.Out' });",
  "    this.tweens.add({ targets: this.banner, alpha: 0, duration: 400, delay: 1400, ease: 'Quad.In' });",
  '  }',
].join('\n'), 'showBanner motion');

/* ------------------------------------------------------- 11. results overlay */
add("this.overlay.add(this.add.rectangle(W / 2, H / 2, W, H, 0x0b0a12, 0.93));",
    'this.overlay.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));', 'scrim results');
add([
  "this.resultTitle = label(this.add, W / 2, isLandscape ? 150 : 300, '', 56, '#e8b73a').setFontStyle('bold');",
  "this.resultBody = label(this.add, W / 2, isLandscape ? 230 : 400, '', 24, '#cfc9de');",
  "this.resultStats = label(this.add, W / 2, isLandscape ? 330 : 520, '', 22, '#9a94b5');",
  "this.resultLegacy = label(this.add, W / 2, isLandscape ? 400 : 590, '', 26, '#e8b73a');",
].join('\n'), [
  "this.resultTitle = displayLabel(this.add, W / 2, isLandscape ? 150 : 300, '', 56, C.gold).setFontStyle('bold');",
  "this.resultBody = label(this.add, W / 2, isLandscape ? 230 : 400, '', 24, C.paper);",
  "this.resultStats = label(this.add, W / 2, isLandscape ? 330 : 520, '', 22, C.paper2);",
  "this.resultLegacy = displayLabel(this.add, W / 2, isLandscape ? 400 : 590, '', 26, C.gold);",
].join('\n'), 'result text');

/* ---------------------------------------------------------- 12. exit confirm */
add([
  'this.exitConfirm = this.add.container(0, 0).setDepth(700).setVisible(false);',
  'this.exitConfirm.add(this.add.rectangle(W / 2, H / 2, W, H, 0x0b0a12, 0.93));',
  "this.exitConfirm.add(label(this.add, W / 2, isLandscape ? 220 : 480, 'ABANDON THIS CASTLE?', 34, '#e8b73a').setFontStyle('bold'));",
  "this.exitConfirm.add(label(this.add, W / 2, isLandscape ? 280 : 540, 'Progress this run is lost.', 20, '#9a94b5'));",
].join('\n'), [
  'this.exitConfirm = this.add.container(0, 0).setDepth(700).setVisible(false);',
  'this.exitConfirm.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));',
  'const exW = isLandscape ? 620 : 600;',
  'const exTop = isLandscape ? 168 : 428;',
  'const exBot = isLandscape ? 548 : 852;',
  'const exH = exBot - exTop;',
  'this.exitConfirm.add(this.add.rectangle(W / 2 + 8, exTop + exH / 2 + 8, exW, exH, C.ink, 1));',
  'this.exitConfirm.add(this.add.rectangle(W / 2, exTop + exH / 2, exW, exH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  'this.exitConfirm.add(this.add.rectangle(W / 2, exTop + 6, exW - 24, 5, C.crimson, 1));',
  "this.exitConfirm.add(displayLabel(this.add, W / 2, isLandscape ? 232 : 492, 'ABANDON THIS CASTLE?', 34, C.ink).setFontStyle('bold'));",
  "this.exitConfirm.add(label(this.add, W / 2, isLandscape ? 286 : 544, 'Progress this run is lost.', 20, C.inkSoft));",
].join('\n'), 'exit confirm modal');

/* -------------------------------------------------------- 13. repair confirm */
add("this.repairConfirm.add(this.add.rectangle(W / 2, H / 2, W, H, 0x0b0a12, 0.88));",
    'this.repairConfirm.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));', 'scrim repair');
add([
  'this.repairConfirm.add(this.add.rectangle(W / 2, cardY, cardW, cardH, C.panel, 0.98).setStrokeStyle(3, C.gold, 0.9));',
  'this.repairConfirm.add(this.add.rectangle(W / 2, cardY - cardH / 2 + 6, cardW - 20, 4, C.gold, 0.6));',
  '',
  "this.repairConfirmTitle = label(this.add, W / 2, cardY - (isLandscape ? 100 : 120), 'CONFIRM REPAIR', 28, '#ffd56b').setFontStyle('bold');",
  "this.repairConfirmPiece = label(this.add, W / 2, cardY - (isLandscape ? 55 : 65), '', 22, '#ffffff').setFontStyle('bold');",
  "this.repairConfirmHp = label(this.add, W / 2, cardY - (isLandscape ? 15 : 20), '', 18, '#d5d0e6');",
  "this.repairConfirmCost = label(this.add, W / 2, cardY + (isLandscape ? 25 : 30), '', 21, '#66c07a').setFontStyle('bold');",
].join('\n'), [
  'this.repairConfirm.add(this.add.rectangle(W / 2 + 8, cardY + 8, cardW, cardH, C.ink, 1));',
  'this.repairConfirm.add(this.add.rectangle(W / 2, cardY, cardW, cardH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  'this.repairConfirm.add(this.add.rectangle(W / 2, cardY - cardH / 2 + 6, cardW - 24, 5, C.crimson, 1));',
  '',
  "this.repairConfirmTitle = displayLabel(this.add, W / 2, cardY - (isLandscape ? 100 : 120), 'CONFIRM REPAIR', 28, C.ink).setFontStyle('bold');",
  "this.repairConfirmPiece = label(this.add, W / 2, cardY - (isLandscape ? 55 : 65), '', 22, C.ink).setFontStyle('bold');",
  "this.repairConfirmHp = label(this.add, W / 2, cardY - (isLandscape ? 15 : 20), '', 18, C.inkSoft);",
  "this.repairConfirmCost = label(this.add, W / 2, cardY + (isLandscape ? 25 : 30), '', 21, C.crimsonDeep).setFontStyle('bold');",
].join('\n'), 'repair confirm body');

/* ------------------------------------------------------- 14. first-time guide */
add("this.firstTimeModal.add(this.add.rectangle(W / 2, H / 2, W, H, 0x07060d, 0.94));",
    'this.firstTimeModal.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));', 'scrim guide');
add([
  'this.firstTimeModal.add(this.add.rectangle(W / 2, guideY, guideW, guideH, C.panel, 0.98).setStrokeStyle(3, C.gold, 0.9));',
  'this.firstTimeModal.add(this.add.rectangle(W / 2, guideY - guideH / 2 + 6, guideW - 24, 4, C.gold, 0.7));',
  '',
  "this.firstTimeModal.add(label(this.add, W / 2, titleY, 'WELCOME, ARCHITECT!', isLandscape ? 34 : 32, '#ffd56b').setFontStyle('bold'));",
  "this.firstTimeModal.add(label(this.add, W / 2, subY, '4 QUICK RULES TO SURVIVE THE SIEGE', isLandscape ? 18 : 17, '#ffffff').setFontStyle('bold'));",
].join('\n'), [
  'this.firstTimeModal.add(this.add.rectangle(W / 2 + 8, guideY + 8, guideW, guideH, C.ink, 1));',
  'this.firstTimeModal.add(this.add.rectangle(W / 2, guideY, guideW, guideH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  'this.firstTimeModal.add(this.add.rectangle(W / 2, guideY - guideH / 2 + 6, guideW - 24, 5, C.crimson, 1));',
  '',
  "this.firstTimeModal.add(displayLabel(this.add, W / 2, titleY, 'WELCOME, ARCHITECT!', isLandscape ? 34 : 32, C.ink).setFontStyle('bold'));",
  "this.firstTimeModal.add(label(this.add, W / 2, subY, '4 QUICK RULES TO SURVIVE THE SIEGE', isLandscape ? 18 : 17, C.crimsonDeep).setFontStyle('bold'));",
].join('\n'), 'guide head');

add([
  'const cardPlate = this.add.rectangle(cx, cy, 470, 115, 0x141024, 0.95).setStrokeStyle(2, C.line);',
  'const circle = this.add.circle(cx - 195, cy, 22, C.panelHi).setStrokeStyle(2, C.gold, 0.8);',
  "const numTxt = label(this.add, cx - 195, cy, st.num, 20, '#ffd56b').setFontStyle('bold');",
  "const titTxt = label(this.add, cx - 155, cy - 24, st.title, 17, '#ffffff', [0, 0.5]).setFontStyle('bold');",
  'const descTxt = this.add.text(cx - 155, cy + 14, st.desc, {',
  "  fontFamily: FONT, fontSize: '13.5px', color: '#dcd7eb',",
].join('\n'), [
  'const cardPlate = this.add.rectangle(cx + 6, cy + 6, 470, 115, C.ink, 1);',
  'const cardPlateFace = this.add.rectangle(cx, cy, 470, 115, C.paper2, 1).setStrokeStyle(3, C.ink, 1);',
  'const circle = this.add.circle(cx - 195, cy, 22, C.crimson).setStrokeStyle(3, C.ink, 1);',
  "const numTxt = label(this.add, cx - 195, cy, st.num, 20, C.white).setFontStyle('bold');",
  "const titTxt = label(this.add, cx - 155, cy - 24, st.title, 17, C.ink, [0, 0.5]).setFontStyle('bold');",
  'const descTxt = this.add.text(cx - 155, cy + 14, st.desc, {',
  "  fontFamily: FONT, fontSize: '13.5px', color: hex(C.inkSoft),",
].join('\n'), 'guide card ls');
add(
  'this.firstTimeModal.add([cardPlate, circle, numTxt, titTxt, descTxt]);',
  'this.firstTimeModal.add([cardPlate, cardPlateFace, circle, numTxt, titTxt, descTxt]);',
  'guide card add ls');
add(
  "'CONTROLS: Mouse/Touch to build · Keys 1-7 pick piece · Space/Enter place · R repair · X sell · Esc menu', 14, '#ffd56b');",
  "'CONTROLS: Mouse/Touch to build · F6 cycles buttons · Enter activates · Keys 1-7 pick piece · Space place · R repair · X sell · Esc menu', 14, C.crimsonDeep);",
  'guide controls ls');

add([
  'const cardPlate = this.add.rectangle(cx, cy, 600, 120, 0x141024, 0.95).setStrokeStyle(2, C.line);',
  'const circle = this.add.circle(cx - 245, cy, 24, C.panelHi).setStrokeStyle(2, C.gold, 0.8);',
  "const numTxt = label(this.add, cx - 245, cy, st.num, 22, '#ffd56b').setFontStyle('bold');",
  "const titTxt = label(this.add, cx - 205, cy - 24, st.title, 19, '#ffffff', [0, 0.5]).setFontStyle('bold');",
  'const descTxt = this.add.text(cx - 205, cy + 16, st.desc, {',
  "  fontFamily: FONT, fontSize: '14px', color: '#dcd7eb',",
].join('\n'), [
  'const cardPlate = this.add.rectangle(cx + 6, cy + 6, 600, 120, C.ink, 1);',
  'const cardPlateFace = this.add.rectangle(cx, cy, 600, 120, C.paper2, 1).setStrokeStyle(3, C.ink, 1);',
  'const circle = this.add.circle(cx - 245, cy, 24, C.crimson).setStrokeStyle(3, C.ink, 1);',
  "const numTxt = label(this.add, cx - 245, cy, st.num, 22, C.white).setFontStyle('bold');",
  "const titTxt = label(this.add, cx - 205, cy - 24, st.title, 19, C.ink, [0, 0.5]).setFontStyle('bold');",
  'const descTxt = this.add.text(cx - 205, cy + 16, st.desc, {',
  "  fontFamily: FONT, fontSize: '14px', color: hex(C.inkSoft),",
].join('\n'), 'guide card pt');
add(
  "'Mouse/Touch · Keys 1-7 pick · Space place · R repair · X sell · Esc menu', 15, '#ffd56b');",
  "'Mouse/Touch · F6 buttons · Enter activate · 1-7 pick · Space place · R repair · X sell · Esc menu', 15, C.crimsonDeep);",
  'guide controls pt');

/* ------------------------------------------------------------- 15. god mode */
add("this.godModeModal.add(this.add.rectangle(W / 2, H / 2, W, H, 0x05040a, 0.95));",
    'this.godModeModal.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));', 'scrim god');
add([
  'this.godModeModal.add(this.add.rectangle(W / 2, H / 2, godW, godH, C.panel, 0.98).setStrokeStyle(3, C.gold, 1));',
  "this.godModeModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 195 : 300), '👑 GOD MODE CONSOLE 👑', 28, '#ffd56b').setFontStyle('bold'));",
  "this.godModeModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 155 : 260), 'DEV CHEAT MENU (KONAMI CODE UNLOCKED)', 15, '#dcd7eb'));",
].join('\n'), [
  'this.godModeModal.add(this.add.rectangle(W / 2 + 8, H / 2 + 8, godW, godH, C.ink, 1));',
  'this.godModeModal.add(this.add.rectangle(W / 2, H / 2, godW, godH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  'this.godModeModal.add(this.add.rectangle(W / 2, H / 2 - godH / 2 + 6, godW - 24, 5, C.crimson, 1));',
  "this.godModeModal.add(displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 195 : 300), '👑 GOD MODE CONSOLE 👑', 28, C.ink).setFontStyle('bold'));",
  "this.godModeModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 155 : 260), 'DEV CHEAT MENU (KONAMI CODE UNLOCKED)', 15, C.inkSoft));",
].join('\n'), 'god console');
add(
  "x: W / 2, y: H / 2 + 180, w: 240, h: 58, label: 'CLOSE', fontSize: 22,",
  "x: W / 2, y: H / 2 + 180, w: 240, h: 58, label: '\u2715', fontSize: 34,",
  'close ls');
add(
  "x: W / 2, y: H / 2 + 250, w: 300, h: 74, label: 'CLOSE', fontSize: 24,",
  "x: W / 2, y: H / 2 + 250, w: 300, h: 74, label: '\u2715', fontSize: 40,",
  'close pt');

/* ------------------------------------------------------- 16. story victory */
add("this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2, W, H, 0x05040a, 0.95));",
    'this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));', 'scrim victory');
add([
  'this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2, vicW, vicH, C.panel, 0.98).setStrokeStyle(3, C.gold, 1));',
  'this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2 - vicH / 2 + 6, vicW - 24, 5, C.gold, 0.8));',
  '',
  "this.storyVictoryModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 190 : 280), 'VICTORY — REALM LIBERATED!', isLandscape ? 34 : 30, '#ffd56b').setFontStyle('bold'));",
  "this.storyVictoryModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 140 : 220), 'The High Warlord has fallen. The Mad King awards you the Crown!', isLandscape ? 18 : 16, '#ffffff').setFontStyle('bold'));",
  '',
  "const unlPlate = this.add.rectangle(W / 2, H / 2 - (isLandscape ? 30 : 60), vicW - 80, isLandscape ? 140 : 200, 0x141024, 0.9).setStrokeStyle(2, C.line);",
  "const unlT1 = label(this.add, W / 2, H / 2 - (isLandscape ? 70 : 120), '🏆 NEW MODES UNLOCKED 🏆', 22, '#ffd56b').setFontStyle('bold');",
  "const unlT2 = label(this.add, W / 2, H / 2 - (isLandscape ? 35 : 65), '⚔️ SURVIVAL MODE: Endless escalating sieges + Fast-Forward', 16, '#ffffff');",
  "const unlT3 = label(this.add, W / 2, H / 2 + (isLandscape ? 0 : -10), '🎲 CHAOS MODE: Wild draft rules & randomized mutators', 16, '#ffffff');",
].join('\n'), [
  'this.storyVictoryModal.add(this.add.rectangle(W / 2 + 8, H / 2 + 8, vicW, vicH, C.ink, 1));',
  'this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2, vicW, vicH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  'this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2 - vicH / 2 + 6, vicW - 24, 5, C.crimson, 1));',
  '',
  "this.storyVictoryModal.add(displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 190 : 280), 'VICTORY — REALM LIBERATED!', isLandscape ? 34 : 30, C.ink).setFontStyle('bold'));",
  "this.storyVictoryModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 140 : 220), 'The High Warlord has fallen. The Mad King awards you the Crown!', isLandscape ? 18 : 16, C.inkSoft).setFontStyle('bold'));",
  '',
  'const unlPlate = this.add.rectangle(W / 2, H / 2 - (isLandscape ? 30 : 60), vicW - 80, isLandscape ? 140 : 200, C.paper2, 1).setStrokeStyle(3, C.ink, 1);',
  "const unlT1 = label(this.add, W / 2, H / 2 - (isLandscape ? 70 : 120), '🏆 NEW MODES UNLOCKED 🏆', 22, C.crimsonDeep).setFontStyle('bold');",
  "const unlT2 = label(this.add, W / 2, H / 2 - (isLandscape ? 35 : 65), '⚔️ SURVIVAL MODE: Endless escalating sieges + Fast-Forward', 16, C.ink);",
  "const unlT3 = label(this.add, W / 2, H / 2 + (isLandscape ? 0 : -10), '🎲 CHAOS MODE: Wild draft rules & randomized mutators', 16, C.ink);",
].join('\n'), 'victory body');

/* --------------------------------------------------------------- 17. troll */
add("this.trollModal.add(this.add.rectangle(W / 2, H / 2, W, H, 0x05040a, 0.96));",
    'this.trollModal.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));', 'scrim troll');
add([
  'this.trollModal.add(this.add.rectangle(W / 2, H / 2, trW, trH, C.panel, 0.98).setStrokeStyle(3, 0xd9483b, 1));',
  'this.trollModal.add(this.add.rectangle(W / 2, H / 2 - trH / 2 + 5, trW - 20, 5, 0xd9483b, 0.8));',
  '',
  "this.trollTitle = label(this.add, W / 2, H / 2 - (isLandscape ? 175 : 250), '🤡 HAHAHAHA! CHEATER! 🤡', isLandscape ? 32 : 28, '#d9483b').setFontStyle('bold');",
  "this.trollSub = label(this.add, W / 2, H / 2 - (isLandscape ? 125 : 190), 'THE MAD KING CAUGHT YOU IN THE ACT!', isLandscape ? 17 : 16, '#ffd56b').setFontStyle('bold');",
  'this.trollBody = this.add.text(W / 2, H / 2 - (isLandscape ? 15 : 45), \'\', {',
  "  fontFamily: FONT, fontSize: isLandscape ? '16px' : '17px', color: '#ffffff',",
].join('\n'), [
  'this.trollModal.add(this.add.rectangle(W / 2 + 8, H / 2 + 8, trW, trH, C.ink, 1));',
  'this.trollModal.add(this.add.rectangle(W / 2, H / 2, trW, trH, C.paper, 1).setStrokeStyle(4, C.crimson, 1));',
  'this.trollModal.add(this.add.rectangle(W / 2, H / 2 - trH / 2 + 5, trW - 24, 5, C.crimson, 1));',
  '',
  "this.trollTitle = displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 175 : 250), '🤡 HAHAHAHA! CHEATER! 🤡', isLandscape ? 32 : 28, C.ink).setFontStyle('bold');",
  "this.trollSub = label(this.add, W / 2, H / 2 - (isLandscape ? 125 : 190), 'THE MAD KING CAUGHT YOU IN THE ACT!', isLandscape ? 17 : 16, C.crimsonDeep).setFontStyle('bold');",
  'this.trollBody = this.add.text(W / 2, H / 2 - (isLandscape ? 15 : 45), \'\', {',
  "  fontFamily: FONT, fontSize: isLandscape ? '16px' : '17px', color: hex(C.inkSoft),",
].join('\n'), 'troll body');

/* --------------------------------------------------------- 18. runtime colours */
add("this.hintText.setText(info.text).setColor('#e8b73a');",
    'this.hintText.setText(info.text).setColor(hex(C.gold));', 'hint active');
add("this.hintText.setColor('#6f6a8c');",
    'this.hintText.setColor(hex(C.paper2)).setAlpha(0.65);', 'hint idle');
add("this.keepBarText.setColor('#0b0a12');",
    'this.keepBarText.setColor(hex(C.ink));', 'keep bar value');
add("this.resultTitle.setColor('#d9483b');",
    'this.resultTitle.setColor(hex(C.crimson));', 'result defeat');
add(
  "this.speedBtn.label.setText(`${this.speedMultiplier}x SPD`);",
  'this.speedBtn.label.setText(`\u00bb ${this.speedMultiplier}X`);',
  'speed set x2');

/* ------------------------------------------------------ 19. refreshPalette */
add(
  'slot.btn.plate.setStrokeStyle(selected ? 4 : 3, selected ? C.gold : (isUnlocked ? C.line : 0x2a2740), 1);',
  'slot.btn.setBase({ stroke: selected ? C.crimson : (isUnlocked ? C.ink : C.rule) });',
  'palette select');
add(
  'const toolFill = { build: 0x241f3a, sell: 0x2a1a1a, repair: 0x17261c };',
  'const toolFill = { build: C.paper2, sell: C.crimson, repair: C.green };',
  'tool fill');
add([
  'this.toolSlot.plate.setStrokeStyle(3, this.tool === \'build\' ? C.line : C.gold, 1);',
  'this.toolSlot.plate.setFillStyle(toolFill[this.tool], 1);',
].join('\n'), [
  'this.toolSlot.setBase({ fill: toolFill[this.tool], stroke: this.tool === \'build\' ? C.ink : C.ink });',
].join('\n'), 'tool base');
add([
  'const isSelling = this.tool === \'sell\';',
  'const isRepairing = this.tool === \'repair\';',
  'this.sellBtn.plate.setStrokeStyle(isSelling ? 4 : 2, isSelling ? C.gold : 0x6b3030, 1);',
  'this.sellBtn.plate.setFillStyle(isSelling ? 0x5a1e1e : 0x2a1a1a, 1);',
  'this.repairBtn.plate.setStrokeStyle(isRepairing ? 4 : 2, isRepairing ? C.gold : 0x2f6b3f, 1);',
  'this.repairBtn.plate.setFillStyle(isRepairing ? 0x1d4d29 : 0x17261c, 1);',
].join('\n'), [
  'const isSelling = this.tool === \'sell\';',
  'const isRepairing = this.tool === \'repair\';',
  'this.sellBtn.setBase({ fill: C.crimson, stroke: isSelling ? C.ink : C.crimsonDeep });',
  'this.repairBtn.setBase({ fill: C.green, stroke: isRepairing ? C.ink : C.moss });',
].join('\n'), 'sell/repair base');

/* -------------------------------------------------------- 20. floating damage */
add([
  "fontFamily: FONT, fontSize: '20px', color: '#e8b73a', fontStyle: 'bold',",
  "stroke: '#0b0a12', strokeThickness: 4,",
].join('\n'), [
  'fontFamily: FONT, fontSize: \'20px\', color: hex(C.gold), fontStyle: \'bold\',',
  'stroke: hex(C.bgDeep), strokeThickness: 4,',
].join('\n'), 'damage text');

/* ------------------------------------------------------------- 21. act guard */
add([
  '    const act = () => {',
  '      if (this.firstTimeModal && this.firstTimeModal.visible) {',
].join('\n'), [
  '    const act = () => {',
  '      if (hasFocusedButton(this)) return;',
  '      if (this.firstTimeModal && this.firstTimeModal.visible) {',
].join('\n'), 'act focus guard');

/* --------------------------------------------------------------- 22. toasts */
const TOAST_MAP = {
  '#d9483b': 'C.crimson',
  '#66c07a': 'C.green',
  '#ffd56b': 'C.gold',
  '#e8b73a': 'C.gold',
  '#d5d0e6': 'C.paper2',
  '#cfc9de': 'C.paper2',
  '#9a94b5': 'C.rule',
  '#b8b2d1': 'C.rule',
  '#7b5cd6': 'C.lapis',
  '#dd6b20': 'C.green',
};
let toastHits = 0;
s = s.replace(/toast\(([^;\n]*?), '(#[0-9a-fA-F]{6})', (\d+)\)/g, (m, args, hexv, size) => {
  const tok = TOAST_MAP[hexv.toLowerCase()] || TOAST_MAP[hexv] || null;
  if (!tok) return m;
  toastHits++;
  return `toast(${args}, hex(${tok}), ${size})`;
});

/* ------------------------------------------------------------------ apply */
const misses = [];
let hits = 0;
for (const p of pairs) {
  const n = s.split(p.o).length - 1;
  if (n === 0) { misses.push(p.tag); continue; }
  hits += n;
  s = s.split(p.o).join(p.n);
}

fs.writeFileSync(P, s);

console.log(`pairs=${pairs.length} replacements=${hits} toasts=${toastHits} misses=${misses.length}`);
if (misses.length) console.log('MISS:', misses.join(' | '));

const leftoverHash = s.match(/'#[0-9a-fA-F]{6}'/g) || [];
const leftover0x = s.match(/0x[0-9a-fA-F]{6}/g) || [];
console.log("leftover '#hex':", leftoverHash.length, leftoverHash.join(' '));
console.log('leftover 0x:', leftover0x.length, [...new Set(leftover0x)].join(' '));
