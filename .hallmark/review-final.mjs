import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = 'C:/Users/TADS/WORK/hackathon/gamejam/.hallmark/shots';
const b = await chromium.launch({ channel: 'chrome', headless: true });
const errs = [];

async function logical(page, lx, ly, w, h) {
  const box = await page.evaluate(() => {
    const c = document.querySelector('canvas'); if (!c) return null;
    const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await page.mouse.click(box.x + (lx * box.w) / w, box.y + (ly * box.h) / h);
}

async function run(vp, name, clicks, waitAfter = 0) {
  const p = await b.newPage({ viewport: vp });
  p.on('pageerror', (e) => errs.push(`${name}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(`${name} console: ${m.text()}`); });
  await p.goto('http://localhost:4173', { waitUntil: 'load' });
  await p.waitForSelector('canvas');
  await p.waitForTimeout(2600);
  for (const [x, y] of clicks) { await logical(p, x, y, vp.width, vp.height); await p.waitForTimeout(800); }
  if (waitAfter) await p.waitForTimeout(waitAfter);
  await p.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 70 });
  await p.close();
}

const land = { width: 1280, height: 720 };
const port = { width: 720, height: 1280 };
const stamp = Date.now();
await run(land, `rv${stamp}-menu-land`, []);
await run(land, `rv${stamp}-toggles-land`, [[760, 445], [1120, 445]]);
await run(land, `rv${stamp}-workshop-land`, [[940, 330]]);
await run(land, `rv${stamp}-game-land`, [[940, 190]], 4200);
await run(port, `rv${stamp}-menu-port`, []);
await run(port, `rv${stamp}-game-port`, [[360, 560]], 4200);
await b.close();
console.log('errors:', errs.length ? errs : 0);
