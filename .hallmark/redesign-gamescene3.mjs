// Hallmark redesign — GameScene.js pass 3: last two GUI blocks + particle token sweep.
import fs from 'node:fs';

const P = 'C:/Users/TADS/WORK/hackathon/gamejam/src/scenes/GameScene.js';
let s = fs.readFileSync(P, 'utf8');
const pairs = [];
const add = (o, n, tag) => pairs.push({ o: Array.isArray(o) ? o.join('\n') : o, n: Array.isArray(n) ? n.join('\n') : n, tag });

/* --- HUD portrait head (6-space) --- */
add([
  '      g.add(this.add.rectangle(W / 2, 63, W, 126, 0x0d0b16, 0.94));',
  '      g.add(this.add.rectangle(W / 2, 125, W, 3, C.gold, 0.5));',
  '',
  '      g.add(this.add.circle(44, 34, 15, C.gold, 1));',
  '      g.add(this.add.circle(44, 34, 9, C.goldDim, 1));',
  "      this.goldText = label(this.add, 70, 34, '120', 30, '#ffd56b', [0, 0.5]).setFontStyle('bold');",
  '      g.add(this.goldText);',
  '',
  "      this.waveText = label(this.add, W / 2 - 35, 34, 'BUILD PHASE', 22, '#ffffff').setFontStyle('bold');",
  '      g.add(this.waveText);',
], [
  '      g.add(this.add.rectangle(8, 71, W, 126, C.ink, 1));',
  '      g.add(this.add.rectangle(0, 63, W, 126, C.paper, 1).setStrokeStyle(3, C.ink, 1));',
  '      g.add(this.add.rectangle(W / 2, 124, W - 6, 3, C.crimson, 1));',
  '',
  '      g.add(this.add.circle(44, 34, 15, C.gold, 1).setStrokeStyle(2, C.ink, 1));',
  '      g.add(this.add.circle(44, 34, 9, C.goldDim, 1));',
  "      this.goldText = label(this.add, 70, 34, '120', 30, C.goldInk, [0, 0.5]).setFontStyle('bold');",
  '      g.add(this.goldText);',
  '',
  "      this.waveText = label(this.add, W / 2 - 35, 34, 'BUILD PHASE', 22, C.ink).setFontStyle('bold');",
  '      g.add(this.waveText);',
], 'HUD pt head');

/* --- guide head, split around the const titleY/subY lines --- */
add([
  '    this.firstTimeModal.add(this.add.rectangle(W / 2, guideY, guideW, guideH, C.panel, 0.98).setStrokeStyle(3, C.gold, 0.9));',
  '    this.firstTimeModal.add(this.add.rectangle(W / 2, guideY - guideH / 2 + 6, guideW - 24, 4, C.gold, 0.7));',
], [
  '    this.firstTimeModal.add(this.add.rectangle(W / 2 + 8, guideY + 8, guideW, guideH, C.ink, 1));',
  '    this.firstTimeModal.add(this.add.rectangle(W / 2, guideY, guideW, guideH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  '    this.firstTimeModal.add(this.add.rectangle(W / 2, guideY - guideH / 2 + 6, guideW - 24, 5, C.crimson, 1));',
], 'guide plate');
add([
  "    this.firstTimeModal.add(label(this.add, W / 2, titleY, 'WELCOME, ARCHITECT!', isLandscape ? 34 : 32, '#ffd56b').setFontStyle('bold'));",
  "    this.firstTimeModal.add(label(this.add, W / 2, subY, '4 QUICK RULES TO SURVIVE THE SIEGE', isLandscape ? 18 : 17, '#ffffff').setFontStyle('bold'));",
], [
  "    this.firstTimeModal.add(displayLabel(this.add, W / 2, titleY, 'WELCOME, ARCHITECT!', isLandscape ? 34 : 32, C.ink).setFontStyle('bold'));",
  "    this.firstTimeModal.add(label(this.add, W / 2, subY, '4 QUICK RULES TO SURVIVE THE SIEGE', isLandscape ? 18 : 17, C.crimsonDeep).setFontStyle('bold'));",
], 'guide titles');

/* --- rune glyph on the aid-range tile --- */
add("label(this.add, rx, ry, '\u16b1', 24, '#ff9ebb', [0.5, 0.5]).setAlpha(0.65);",
    "label(this.add, rx, ry, '\u16b1', 24, C.paper, [0.5, 0.5]).setAlpha(0.85);",
    'rune glyph');

/* --- particle / VFX colours → exact palette tokens (no hue invented) --- */
const sweep = [
  ['0xffffff', 'C.white'],
  ['0xc3c8d8', 'C.stoneLight'],
  ['0x66c07a', 'C.green'],
  ['0xd9483b', 'C.red'],
  ['0x4ea3c9', 'C.waterHi'],
  ['0x8d92a6', 'C.stone'],
  ['0x8882a8', 'C.stone'],
  ['0xffd56b', 'C.gold'],
  ['0xd69e2e', 'C.gold'],
  ['0xdd6b20', 'C.red'],
];
const sweepTag = [];
for (const [o, n] of sweep) {
  const re = new RegExp(o, 'g');
  const c = (s.match(re) || []).length;
  if (c) { s = s.replace(re, n); sweepTag.push(`${o}->${n}:${c}`); }
}

const misses = [];
let hits = 0;
for (const p of pairs) {
  const n = s.split(p.o).length - 1;
  if (n === 0) { misses.push(p.tag); continue; }
  hits += n;
  s = s.split(p.o).join(p.n);
}
fs.writeFileSync(P, s);

console.log(`pass3 pairs=${pairs.length} replacements=${hits} misses=${misses.length}`);
if (misses.length) console.log('MISS:', misses.join(' | '));
console.log('sweep:', sweepTag.join(' '));
const lh = s.match(/'#[0-9a-fA-F]{6}'/g) || [];
const l0 = s.match(/0x[0-9a-fA-F]{6}/g) || [];
console.log("leftover '#hex':", lh.length, [...new Set(lh)].join(' '));
console.log('leftover 0x:', l0.length, [...new Set(l0)].join(' '));
console.log('Back./Elastic./Bounce.:', (s.match(/Back\.|Elastic\.|Bounce\./g) || []).join(' ') || 'none');
console.log('hasFocusedButton:', (s.match(/hasFocusedButton/g) || []).length,
            'displayLabel:', (s.match(/displayLabel/g) || []).length,
            'setBase:', (s.match(/setBase/g) || []).length);
