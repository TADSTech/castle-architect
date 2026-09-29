import fs from 'node:fs';

const P = 'C:/Users/TADS/WORK/hackathon/gamejam/src/systems/WheelOfChaos.js';
let s = fs.readFileSync(P, 'utf8');

const pairs = [
  [", '#d9483b', 22);", ", hex(C.crimson), 22);", 'toast need gold'],
  [", '#d9483b', 24);", ", hex(C.crimson), 24);", 'toast no spins'],
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

const lh = s.match(/'#[0-9a-fA-F]{6}'/g) || [];
const l0 = s.match(/0x[0-9a-fA-F]{6}/g) || [];
console.log(`fix replacements=${hits} misses=${misses.length}`);
if (misses.length) console.log('MISS:', misses.join(' | '));
console.log("leftover '#hex':", lh.length, [...new Set(lh)].join(' '));
console.log('leftover 0x:', l0.length, [...new Set(l0)].join(' '));
