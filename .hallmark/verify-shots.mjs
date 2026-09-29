import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:4173';
const OUT = 'C:/Users/TADS/WORK/hackathon/gamejam/.hallmark/shots';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { w: 1280, h: 720, name: 'land' },
  { w: 720, h: 1280, name: 'port' },
];

const errors = [];

async function clickLogical(page, lx, ly, w, h) {
  const box = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  if (!box) throw new Error('no canvas');
  await page.mouse.click(box.x + (lx * box.w) / w, box.y + (ly * box.h) / h);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${vp.name}] console: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${vp.name}] pageerror: ${e.message}`));

  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('canvas', { timeout: 20000 });
  await page.waitForTimeout(2200); // font boot + menu entrance tweens

  await page.screenshot({ path: `${OUT}/01-menu-${vp.name}.png` });

  // HOW TO / CONTROLS modal
  if (vp.name === 'land') await clickLogical(page, 940, 555, 1280, 720);
  else await clickLogical(page, 360, 1010, 720, 1280);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/02-help-${vp.name}.png` });

  // back to root, then into the siege
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/03-menu-back-${vp.name}.png` });

  await clickLogical(page, vp.name === 'land' ? 940 : 360, vp.name === 'land' ? 190 : 560, vp.w, vp.h);
  await page.waitForTimeout(900);

  const active = await page.evaluate(() => {
    const g = window.__game;
    if (!g) return 'no-game';
    return g.scene.getScenes(true).map((s) => s.scene.key).join(',') || 'none';
  });
  if (!active.includes('game')) {
    errors.push(`[${vp.name}] expected GameScene, got: ${active} — starting directly`);
    await page.evaluate(() => window.__game.scene.getScene('menu').scene.start('game', { fresh: true, mode: 'story' }));
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${OUT}/04-game-${vp.name}.png` });

  // let the first siege banner play out, then capture the steady HUD
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/05-hud-${vp.name}.png` });

  await ctx.close();
}

await browser.close();

console.log('shots:', fs.readdirSync(OUT).join(' '));
console.log('errors:', errors.length);
errors.forEach((e) => console.log('  ' + e));
