import fs from 'node:fs';

const P = 'C:/Users/TADS/WORK/hackathon/gamejam/src/systems/textures.js';
let s = fs.readFileSync(P, 'utf8');

const pairs = [
  // skyline: cool purple ridges -> warm ink, same relative lightness ladder
  ['  bg.fillStyle(0x241f3e, 1);\n  bg.fillTriangle(0, 400, 200, 200, 450, 400);',
   '  bg.fillStyle(0x402E1C, 1);\n  bg.fillTriangle(0, 400, 200, 200, 450, 400);', 'far ridge'],
  ['  bg.fillStyle(0x1a1730, 1);\n  bg.fillTriangle(0, 400, 160, 280, 360, 400);',
   '  bg.fillStyle(0x2A1E11, 1);\n  bg.fillTriangle(0, 400, 160, 280, 360, 400);', 'mid ridge'],
  ['  bg.fillStyle(0x2c2749, 1);', '  bg.fillStyle(0x3A2A19, 1);', 'city towers'],
  // decorative ground strip under the board
  ['  gr.fillStyle(0x1a1729, 1); gr.fillRect(0, 0, 1280, 60);',
   '  gr.fillStyle(0x221909, 1); gr.fillRect(0, 0, 1280, 60);', 'ground strip'],
  ['  gr.fillStyle(0x221f36, 1);', '  gr.fillStyle(0x2B2010, 1);', 'ground scallop'],
];

const misses = [];
let hits = 0;
for (const [o, n, tag] of pairs) {
  const c = s.split(o).length - 1;
  if (!c) { misses.push(tag); continue; }
  hits += c;
  s = s.split(o).join(n);
}
fs.writeFileSync(P, s);

console.log(`textures backdrop pairs=${pairs.length} replacements=${hits} misses=${misses.length}`);
if (misses.length) console.log('MISS:', misses.join(' | '));

// remaining hex, by line, so we can confirm only sprite work is left
const lines = s.split('\n');
lines.forEach((l, i) => {
  if (/0x[0-9a-fA-F]{3,8}|#[0-9a-fA-F]{6}/.test(l)) console.log(`${i + 1}: ${l.trim()}`);
});
