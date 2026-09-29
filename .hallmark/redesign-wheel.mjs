// Hallmark redesign — WheelOfChaos.js: modal chrome → parchment/ink + token sweep.
import fs from 'node:fs';

const P = 'C:/Users/TADS/WORK/hackathon/gamejam/src/systems/WheelOfChaos.js';
let s = fs.readFileSync(P, 'utf8');
const pairs = [];
const add = (o, n, tag) => pairs.push({ o: Array.isArray(o) ? o.join('\n') : o, n: Array.isArray(n) ? n.join('\n') : n, tag });

/* import hex */
add("import { button, label, toast } from './ui.js';",
    "import { button, label, toast, displayLabel, hex } from './ui.js';",
    'import');

/* backdrop */
add("this.backdrop = sc.add.rectangle(W / 2, H / 2, W, H, 0x05040a, 0.94).setInteractive();",
    'this.backdrop = sc.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9).setInteractive();',
    'backdrop');

/* --- landscape modal frame --- */
add([
  '    const frame = sc.add.rectangle(W / 2, H / 2, modalW, modalH, C.panel, 0.98).setStrokeStyle(3, 0x805ad5, 1);',
  '    const topGlow = sc.add.rectangle(W / 2, H / 2 - modalH / 2 + 5, modalW - 20, 5, 0xd69e2e, 0.9);',
  '    this.container.add([frame, topGlow]);',
  '',
  '    // === LEFT COLUMN: THE WHEEL ===',
], [
  '    const frameShadow = sc.add.rectangle(W / 2 + 10, H / 2 + 10, modalW, modalH, C.ink, 1);',
  '    const frame = sc.add.rectangle(W / 2, H / 2, modalW, modalH, C.paper, 1).setStrokeStyle(4, C.ink, 1);',
  '    const topGlow = sc.add.rectangle(W / 2, H / 2 - modalH / 2 + 6, modalW - 24, 5, C.crimson, 1);',
  '    this.container.add([frameShadow, frame, topGlow]);',
  '',
  '    // === LEFT COLUMN: THE WHEEL ===',
], 'frame ls');

/* --- landscape right column --- */
add([
  "    const title = label(sc.add, rightX, H / 2 - 240, '\ud83c\udfb2 WHEEL OF CHAOS \ud83c\udfb2', 32, '#ffd56b').setFontStyle('bold');",
  "    const sub = label(sc.add, rightX, H / 2 - 200, 'Spin to draft defenses and trigger chaotic anomalies!', 15, '#dcd7eb');",
].join('\n'), [
  "    const title = displayLabel(sc.add, rightX, H / 2 - 240, '\ud83c\udfb2 WHEEL OF CHAOS \ud83c\udfb2', 32, C.ink).setFontStyle('bold');",
  "    const sub = label(sc.add, rightX, H / 2 - 200, 'Spin to draft defenses and trigger chaotic anomalies!', 15, C.inkSoft);",
].join('\n'), 'title ls');

add([
  '    this.prizeCardBg = sc.add.rectangle(rightX, H / 2 - 90, 480, 130, 0x141024, 0.95).setStrokeStyle(2, 0xd69e2e, 0.8);',
  "    this.prizeTitle = label(sc.add, rightX, H / 2 - 120, 'READY TO SPIN', 24, '#ffd56b').setFontStyle('bold');",
  "    this.prizeDesc = sc.add.text(rightX, H / 2 - 75, 'Click SPIN below to draw your fortress reinforcements!', {",
  "      fontFamily: FONT, fontSize: '15px', color: '#d5d0e6', align: 'center', wordWrap: { width: 440 }, lineSpacing: 3,",
], [
  '    this.prizeCardBg = sc.add.rectangle(rightX, H / 2 - 90, 480, 130, C.ink, 1).setStrokeStyle(3, C.crimson, 1);',
  "    this.prizeTitle = label(sc.add, rightX, H / 2 - 120, 'READY TO SPIN', 24, C.gold).setFontStyle('bold');",
  "    this.prizeDesc = sc.add.text(rightX, H / 2 - 75, 'Click SPIN below to draw your fortress reinforcements!', {",
  "      fontFamily: FONT, fontSize: '15px', color: hex(C.paper2), align: 'center', wordWrap: { width: 440 }, lineSpacing: 3,",
], 'prize ls');

add([
  '    this.spinsBadgeBg = sc.add.rectangle(rightX, H / 2 + 10, 480, 42, 0x241f3a, 1).setStrokeStyle(1.5, C.line);',
  "    this.spinsCountLabel = label(sc.add, rightX, H / 2 + 10, '', 18, '#ffd56b').setFontStyle('bold');",
], [
  '    this.spinsBadgeBg = sc.add.rectangle(rightX, H / 2 + 10, 480, 42, C.ink, 1).setStrokeStyle(2, C.crimson, 1);',
  "    this.spinsCountLabel = label(sc.add, rightX, H / 2 + 10, '', 18, C.gold).setFontStyle('bold');",
], 'badge ls');

/* --- portrait modal frame --- */
add([
  '    const frame = sc.add.rectangle(W / 2, H / 2, modalW, modalH, C.panel, 0.98).setStrokeStyle(3, 0x805ad5, 1);',
  '    const topGlow = sc.add.rectangle(W / 2, H / 2 - modalH / 2 + 5, modalW - 20, 5, 0xd69e2e, 0.9);',
  '    this.container.add([frame, topGlow]);',
].join('\n'), [
  '    const frameShadow = sc.add.rectangle(W / 2 + 10, H / 2 + 10, modalW, modalH, C.ink, 1);',
  '    const frame = sc.add.rectangle(W / 2, H / 2, modalW, modalH, C.paper, 1).setStrokeStyle(4, C.ink, 1);',
  '    const topGlow = sc.add.rectangle(W / 2, H / 2 - modalH / 2 + 6, modalW - 24, 5, C.crimson, 1);',
  '    this.container.add([frameShadow, frame, topGlow]);',
].join('\n'), 'frame pt');

add([
  "    const title = label(sc.add, W / 2, H / 2 - 485, '\ud83c\udfb2 WHEEL OF CHAOS \ud83c\udfb2', 30, '#ffd56b').setFontStyle('bold');",
  "    const sub = label(sc.add, W / 2, H / 2 - 450, 'Spin to draft defenses & trigger anomalies!', 15, '#dcd7eb');",
].join('\n'), [
  "    const title = displayLabel(sc.add, W / 2, H / 2 - 485, '\ud83c\udfb2 WHEEL OF CHAOS \ud83c\udfb2', 30, C.ink).setFontStyle('bold');",
  "    const sub = label(sc.add, W / 2, H / 2 - 450, 'Spin to draft defenses & trigger anomalies!', 15, C.inkSoft);",
].join('\n'), 'title pt');

add([
  '    this.prizeCardBg = sc.add.rectangle(W / 2, H / 2 + 125, 590, 110, 0x141024, 0.95).setStrokeStyle(2, 0xd69e2e, 0.8);',
  "    this.prizeTitle = label(sc.add, W / 2, H / 2 + 100, 'READY TO SPIN', 22, '#ffd56b').setFontStyle('bold');",
  "    this.prizeDesc = sc.add.text(W / 2, H / 2 + 140, 'Tap SPIN THE WHEEL below to draft fortifications!', {",
  "      fontFamily: FONT, fontSize: '14.5px', color: '#d5d0e6', align: 'center', wordWrap: { width: 550 }, lineSpacing: 2,",
], [
  '    this.prizeCardBg = sc.add.rectangle(W / 2, H / 2 + 125, 590, 110, C.ink, 1).setStrokeStyle(3, C.crimson, 1);',
  "    this.prizeTitle = label(sc.add, W / 2, H / 2 + 100, 'READY TO SPIN', 22, C.gold).setFontStyle('bold');",
  "    this.prizeDesc = sc.add.text(W / 2, H / 2 + 140, 'Tap SPIN THE WHEEL below to draft fortifications!', {",
  "      fontFamily: FONT, fontSize: '14.5px', color: hex(C.paper2), align: 'center', wordWrap: { width: 550 }, lineSpacing: 2,",
], 'prize pt');

add([
  '    this.spinsBadgeBg = sc.add.rectangle(W / 2, H / 2 + 205, 580, 44, 0x241f3a, 1).setStrokeStyle(1.5, C.line);',
  "    this.spinsCountLabel = label(sc.add, W / 2, H / 2 + 205, '', 19, '#ffd56b').setFontStyle('bold');",
], [
  '    this.spinsBadgeBg = sc.add.rectangle(W / 2, H / 2 + 205, 580, 44, C.ink, 1).setStrokeStyle(2, C.crimson, 1);',
  "    this.spinsCountLabel = label(sc.add, W / 2, H / 2 + 205, '', 19, C.gold).setFontStyle('bold');",
], 'badge pt');

/* --- button roles --- */
add("label: 'SPIN THE WHEEL', fontSize: 23, fill: 0x4a236e, stroke: 0xd69e2e,",
    "label: 'SPIN THE WHEEL', fontSize: 23, fill: C.lapis, stroke: C.ink,", 'spin ls');
add("label: 'SPIN THE WHEEL', fontSize: 25, fill: 0x4a236e, stroke: 0xd69e2e,",
    "label: 'SPIN THE WHEEL', fontSize: 25, fill: C.lapis, stroke: C.ink,", 'spin pt');
add("label: `\ud83e\ude99 BUY SPIN (${cost} GOLD)`, fontSize: 20, fill: 0x5a3e14, stroke: 0xd69e2e,",
    "label: `\ud83e\ude99 BUY SPIN (${cost} GOLD)`, fontSize: 20, fill: C.gold, stroke: C.ink,", 'buy ls');
add("label: `\ud83e\ude99 BUY EXTRA SPIN (${cost} GOLD)`, fontSize: 22, fill: 0x5a3e14, stroke: 0xd69e2e,",
    "label: `\ud83e\ude99 BUY EXTRA SPIN (${cost} GOLD)`, fontSize: 22, fill: C.gold, stroke: C.ink,", 'buy pt');
add("label: 'RETURN TO CASTLE BOARD', fontSize: 19, fill: 0x1d2238, stroke: C.line,",
    "label: 'RETURN TO CASTLE BOARD', fontSize: 19, fill: C.paper2, stroke: C.ink,", 'done ls');
add("label: 'RETURN TO CASTLE BOARD', fontSize: 20, fill: 0x1d2238, stroke: C.line,",
    "label: 'RETURN TO CASTLE BOARD', fontSize: 20, fill: C.paper2, stroke: C.ink,", 'done pt');

/* --- wheel graphics (the wheel itself stays gold-on-dark) --- */
add('this.slicesGraphics.lineStyle(6, slice.accentColor || 0xd69e2e, 0.9);',
    'this.slicesGraphics.lineStyle(6, slice.accentColor || C.gold, 0.9);', 'slice accent');
add('this.slicesGraphics.lineStyle(2, 0x120e24, 1);',
    'this.slicesGraphics.lineStyle(2, C.ink, 1);', 'slice divider');
add("color: isDisaster ? '#ffd2d2' : '#ffffff',", 'color: hex(isDisaster ? C.paper : C.white),', 'slice label');
add("stroke: '#000000',", 'stroke: hex(C.shadow),', 'slice label stroke');
add('this.outerRim.lineStyle(10, 0xd69e2e, 1);', 'this.outerRim.lineStyle(10, C.gold, 1);', 'rim');
add('this.outerRim.lineStyle(3, 0xffe89e, 0.8);', 'this.outerRim.lineStyle(3, C.paper, 0.8);', 'rim highlight');
add('const bulb = sc.add.circle(sx, sy, 4, 0xffffff, 0.95);',
    'const bulb = sc.add.circle(sx, sy, 4, C.white, 0.95);', 'bulb');
add('      0xd9483b,\n      1\n    ).setStrokeStyle(3, 0xffd56b, 1);',
    '      C.red,\n      1\n    ).setStrokeStyle(3, C.gold, 1);', 'pointer');
add('this.centerHubOuter = sc.add.circle(this.wheelX, this.wheelY, 42, 0xd69e2e, 1).setStrokeStyle(3, 0xffe89e, 1);',
    'this.centerHubOuter = sc.add.circle(this.wheelX, this.wheelY, 42, C.gold, 1).setStrokeStyle(3, C.paper, 1);', 'hub outer');
add('this.centerHubInner = sc.add.circle(this.wheelX, this.wheelY, 34, 0x1d1430, 1).setStrokeStyle(2, 0x805ad5, 1);',
    'this.centerHubInner = sc.add.circle(this.wheelX, this.wheelY, 34, C.bgDeep, 1).setStrokeStyle(2, C.lapis, 1);', 'hub inner');
add("this.centerHubText = label(sc.add, this.wheelX, this.wheelY, 'SPIN', 17, '#ffd56b').setFontStyle('bold');",
    "this.centerHubText = label(sc.add, this.wheelX, this.wheelY, 'SPIN', 17, C.gold).setFontStyle('bold');", 'hub text');

/* --- runtime colours --- */
add("this.spinsCountLabel.setColor(count > 0 ? '#ffd56b' : '#ff9999');",
    'this.spinsCountLabel.setColor(count > 0 ? hex(C.gold) : hex(C.red));', 'spins state');
add("this.prizeTitle.setColor('#ffd56b');", 'this.prizeTitle.setColor(hex(C.gold));', 'prize reset');
add("this.prizeTitle.setColor('#e53e3e');", 'this.prizeTitle.setColor(hex(C.red));', 'prize disaster');
add("this.prizeTitle.setColor('#66c07a');", 'this.prizeTitle.setColor(hex(C.green));', 'prize win');

/* --- fx --- */
add('sc.fx.burst(this.wheelX, this.wheelY, 0xffd56b, 25, { speed: 190, life: 550 });',
    'sc.fx.burst(this.wheelX, this.wheelY, C.gold, 25, { speed: 190, life: 550 });', 'fx buy');
add('sc.fx.burst(this.wheelX, this.wheelY, isDisaster ? 0xd9483b : 0xffd56b, 35, { speed: 220, life: 600 });',
    'sc.fx.burst(this.wheelX, this.wheelY, isDisaster ? C.red : C.gold, 35, { speed: 220, life: 600 });', 'fx result');

/* --- toasts: 4th arg only drives the accent bar, text is ink-on-parchment --- */
add("`, `#d9483b`, 22);", '`, hex(C.crimson), 22);', 'toast need gold');
add("`, '#d9483b', 24);", '`, hex(C.crimson), 24);', 'toast no spins');
add("`, '#66c07a', 24);", '`, hex(C.green), 24);', 'toast bought');
add("`, '#ffd56b', 26);", '`, hex(C.gold), 26);', 'toast bonus');
add("`🎉 ${slice.header || slice.label.replace('\\n', ' ')} AWARDED!`, isDisaster ? '#e53e3e' : '#ffd56b', 26);",
    "`🎉 ${slice.header || slice.label.replace('\\n', ' ')} AWARDED!`, isDisaster ? hex(C.crimson) : hex(C.gold), 26);",
    'toast result');

const misses = [];
let hits = 0;
for (const p of pairs) {
  const n = s.split(p.o).length - 1;
  if (n === 0) { misses.push(p.tag); continue; }
  hits += n;
  s = s.split(p.o).join(p.n);
}
fs.writeFileSync(P, s);

console.log(`wheel pairs=${pairs.length} replacements=${hits} misses=${misses.length}`);
if (misses.length) console.log('MISS:', misses.join(' | '));
const lh = s.match(/'#[0-9a-fA-F]{6}'/g) || [];
const l0 = s.match(/0x[0-9a-fA-F]{6}/g) || [];
console.log("leftover '#hex':", lh.length, [...new Set(lh)].join(' '));
console.log('leftover 0x:', l0.length, [...new Set(l0)].join(' '));
console.log("bare color string:", (s.match(/color: '#/g) || []).length, "stroke: '#", (s.match(/stroke: '#/g) || []).length);
