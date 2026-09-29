import { C, CELL, GRID } from '../config/palette.js';
import { BUILDINGS } from '../config/buildings.js';
import { ENEMIES } from '../config/enemies.js';

// Every texture is drawn at boot from Phaser Graphics — zero external art files.
export function makeTextures(scene) {
  const g = scene.make.graphics({ add: false });

  const tex = (key, w, h, draw) => {
    g.clear();
    draw(g);
    g.generateTexture(key, w, h);
  };

  // ---- generic particles -------------------------------------------------
  tex('px', 4, 4, (g) => { g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 4, 4); });
  tex('dot', 16, 16, (g) => {
    for (let i = 7; i >= 0; i--) {
      g.fillStyle(0xffffff, (7 - i) * 0.06 + 0.08);
      g.fillCircle(8, 8, i + 1);
    }
  });
  tex('spark', 10, 10, (g) => { g.fillStyle(0xffffff, 1); g.fillTriangle(5, 0, 10, 5, 5, 10); g.fillTriangle(5, 0, 0, 5, 5, 10); });
  tex('chunk', 12, 12, (g) => {
    g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 7, 6); g.fillStyle(0xffffff, 0.7); g.fillRect(6, 5, 6, 7);
  });
  tex('ring', 64, 64, (g) => { g.lineStyle(4, 0xffffff, 1); g.strokeCircle(32, 32, 28); });

  // ---- buildings ---------------------------------------------------------
  const S = CELL;

  tex('b_keep', S * 2, S * 2, (g) => {
    const w = S * 2;
    // plinth
    g.fillStyle(0x14121f, 0.85); g.fillRoundedRect(6, 26, w - 12, w - 34, 10);
    // body
    g.fillStyle(C.stoneDark, 1); g.fillRoundedRect(14, 34, w - 28, w - 52, 8);
    g.fillStyle(C.stone, 1); g.fillRoundedRect(20, 40, w - 40, w - 66, 6);
    // crenellations
    const top = 40, bw = w - 40, x0 = 20;
    for (let i = 0; i < 5; i++) {
      g.fillStyle(i % 2 ? C.stoneLight : C.stone, 1);
      g.fillRect(x0 + i * (bw / 5), top - 14, bw / 5 - 5, 18);
    }
    // banner
    g.fillStyle(C.red, 1); g.fillRect(w / 2 - 4, 62, 8, 46);
    g.fillStyle(C.gold, 1); g.fillRect(w / 2 - 12, 56, 24, 10);
    // gate arch
    g.fillStyle(0x241f36, 1); g.fillRoundedRect(w / 2 - 22, w - 66, 44, 46, { tl: 22, tr: 22, bl: 4, br: 4 });
    g.fillStyle(C.goldDim, 1); g.fillRect(w / 2 - 22, w - 66, 44, 5);
    // windows
    g.fillStyle(0xffcf6a, 0.9);
    g.fillRect(w / 2 - 34, 78, 12, 16); g.fillRect(w / 2 + 22, 78, 12, 16);
    // stone seams
    g.lineStyle(2, 0x000000, 0.14);
    for (let y = 56; y < w - 40; y += 18) g.lineBetween(20, y, w - 20, y);
  });

  const drawWall = (g, reinforced) => {
    g.fillStyle(0x14121f, 0.8); g.fillRect(4, 14, S - 8, S - 20);
    g.fillStyle(reinforced ? C.stoneChain : C.stoneDark, 1); g.fillRect(6, 10, S - 12, S - 20);
    g.fillStyle(reinforced ? 0x676d8a : C.stone, 1); g.fillRect(6, 10, S - 12, S - 30);
    // crenellations
    for (let i = 0; i < 3; i++) {
      g.fillStyle(reinforced ? 0x868dab : C.stoneLight, 1);
      g.fillRect(8 + i * 22, 4, 16, 12);
    }
    // bricks
    g.lineStyle(2, 0x000000, 0.2);
    for (let y = 22; y < S - 12; y += 14) g.lineBetween(6, y, S - 6, y);
    g.lineBetween(S / 2, 22, S / 2, S - 12);
    g.lineBetween(6, 36, S - 6, 36);
    if (reinforced) {
      g.fillStyle(C.gold, 0.9);
      g.fillRect(10, 30, 8, 8); g.fillRect(S - 18, 30, 8, 8);
      g.fillRect(S / 2 - 4, 44, 8, 8);
      g.lineStyle(3, C.goldDim, 0.85);
      g.strokeRoundedRect(6, 10, S - 12, S - 20, 3);
    }
  };
  tex('b_wall', S, S, (g) => drawWall(g, false));
  tex('b_wall2', S, S, (g) => drawWall(g, true));

  tex('b_tower', S, S, (g) => {
    g.fillStyle(0x14121f, 0.8); g.fillRect(8, 16, S - 16, S - 22);
    g.fillStyle(C.stoneDark, 1); g.fillRect(14, 14, S - 28, S - 30);
    g.fillStyle(C.stone, 1); g.fillRect(18, 18, S - 36, S - 38);
    // platform
    g.fillStyle(C.stoneLight, 1); g.fillRect(12, 12, S - 24, 14);
    for (let i = 0; i < 3; i++) { g.fillStyle(C.stoneLight, 1); g.fillRect(14 + i * 18, 4, 12, 12); }
    // arrow slit + flag
    g.fillStyle(0x241f36, 1); g.fillRect(S / 2 - 3, 34, 6, 20);
    g.fillStyle(C.gold, 1); g.fillRect(S / 2 - 2, 0, 4, 8);
    g.fillStyle(C.red, 1); g.fillTriangle(S / 2 + 2, 0, S / 2 + 20, 7, S / 2 + 2, 14);
    g.lineStyle(2, 0x000000, 0.16);
    for (let y = 32; y < S - 14; y += 12) g.lineBetween(14, y, S - 14, y);
  });

  tex('b_cannon', S, S, (g) => {
    g.fillStyle(0x14121f, 0.8); g.fillRect(6, 18, S - 12, S - 24);
    g.fillStyle(C.stoneDark, 1); g.fillRoundedRect(8, 20, S - 16, S - 30, 5);
    g.fillStyle(C.stone, 1); g.fillRoundedRect(10, 22, S - 20, S - 36, 4);
    // barrel
    g.fillStyle(0x2f2c40, 1); g.fillRect(S / 2 - 7, 26, 14, 34);
    g.fillStyle(0x45415e, 1); g.fillRect(S / 2 - 7, 26, 6, 34);
    g.fillStyle(0x1a1828, 1); g.fillCircle(S / 2, 28, 8);
    g.fillStyle(C.gold, 1); g.fillRect(S / 2 - 8, 52, 16, 5);
    // wheels
    g.fillStyle(C.woodDark, 1); g.fillCircle(22, S - 26, 11); g.fillCircle(S - 22, S - 26, 11);
    g.fillStyle(C.wood, 1); g.fillCircle(22, S - 26, 7); g.fillCircle(S - 22, S - 26, 7);
  });
  tex('b_cannon_idle', S, S, (g) => {
    g.fillStyle(0x14121f, 0.6); g.fillRect(6, 18, S - 12, S - 24);
    g.fillStyle(0x3a3550, 1); g.fillRoundedRect(8, 26, S - 16, S - 38, 5);
    g.fillStyle(0x241f36, 1); g.fillRect(S / 2 - 6, 30, 12, 22);
    g.fillStyle(0x55506e, 1); g.fillRect(S / 2 - 6, 30, 5, 22);
    g.fillStyle(C.woodDark, 0.9); g.fillCircle(22, S - 26, 10); g.fillCircle(S - 22, S - 26, 10);
  });

  tex('b_moat', S, S, (g) => {
    g.fillStyle(C.water, 1); g.fillRect(0, 0, S, S);
    g.fillStyle(0x255a78, 1); g.fillRect(0, 0, S, 8); g.fillRect(0, S - 8, S, 8);
    g.lineStyle(3, C.waterHi, 0.55);
    g.lineBetween(8, 24, 34, 24); g.lineBetween(44, 44, 70, 44); g.lineBetween(14, 60, 40, 60);
    g.lineStyle(2, 0xffffff, 0.18);
    g.lineBetween(20, 34, 46, 34); g.lineBetween(50, 66, 72, 66);
    g.fillStyle(0x1d4a63, 0.7); g.fillRect(0, 0, 6, S); g.fillRect(S - 6, 0, 6, S);
  });

  tex('b_trap', S, S, (g) => {
    g.fillStyle(0x1a1729, 1); g.fillCircle(S / 2, S / 2, 26);
    g.fillStyle(0x0d0b16, 1); g.fillCircle(S / 2, S / 2, 20);
    g.lineStyle(4, C.redDeep, 1); g.strokeCircle(S / 2, S / 2, 22);
    g.fillStyle(C.stone, 1);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = S / 2 + Math.cos(a) * 14, y = S / 2 + Math.sin(a) * 14;
      g.fillTriangle(x - 4, y - 4, x + 4, y + 4, x + Math.cos(a) * 9, y + Math.sin(a) * 9);
    }
    g.fillStyle(C.gold, 1); g.fillCircle(S / 2, S / 2, 5);
  });

  tex('b_gate', S, S, (g) => {
    // opening with the portcullis hoisted
    g.fillStyle(0x1a1729, 1); g.fillRect(6, 8, S - 12, S - 14);
    g.fillStyle(C.woodDark, 1); g.fillRect(4, 4, 14, S - 8); g.fillRect(S - 18, 4, 14, S - 8);
    g.fillStyle(C.wood, 1); g.fillRect(7, 4, 8, S - 8); g.fillRect(S - 15, 4, 8, S - 8);
    // raised grid
    g.lineStyle(3, 0x8b8ba0, 1);
    for (let x = 24; x <= S - 24; x += 14) g.lineBetween(x, 6, x, 30);
    g.lineBetween(22, 12, S - 22, 12); g.lineBetween(22, 22, S - 22, 22);
    g.fillStyle(C.wood, 1); g.fillRect(2, 0, S - 4, 10);
    g.fillStyle(C.gold, 1); g.fillCircle(S / 2, 6, 7);
    // threshold glow
    g.fillStyle(C.goldDim, 0.35); g.fillRect(18, S - 16, S - 36, 8);
  });

  // ---- enemies -----------------------------------------------------------
  const drawRaider = (g, s) => {
    const cx = s, cy = s;
    // Ground drop shadow
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(cx, cy + s * 0.75, s * 1.3, s * 0.35);

    // Legs / Boots
    g.fillStyle(0x1a1510, 1);
    g.fillRect(cx - s * 0.45, cy + s * 0.35, s * 0.35, s * 0.45);
    g.fillRect(cx + s * 0.1, cy + s * 0.35, s * 0.35, s * 0.45);

    // Body / Crimson Tunic & Studded Leather
    g.fillStyle(0xc9563f, 1);
    g.fillRoundedRect(cx - s * 0.5, cy - s * 0.15, s * 1.0, s * 0.7, 3);
    // Crossed Leather Baldric / Straps
    g.lineStyle(2, 0x4a2810, 1);
    g.lineBetween(cx - s * 0.4, cy - s * 0.1, cx + s * 0.4, cy + s * 0.5);
    g.lineBetween(cx + s * 0.4, cy - s * 0.1, cx - s * 0.4, cy + s * 0.5);
    // Iron Belt & Gold Buckle
    g.fillStyle(0x1a1510, 1);
    g.fillRect(cx - s * 0.5, cy + s * 0.25, s * 1.0, s * 0.15);
    g.fillStyle(0xe8b73a, 1);
    g.fillRect(cx - s * 0.15, cy + s * 0.22, s * 0.3, s * 0.2);

    // Steel Kettle / Normannic Helm
    g.fillStyle(0x3a3f52, 1);
    g.fillCircle(cx, cy - s * 0.3, s * 0.48);
    g.fillStyle(0x6b7089, 1);
    g.fillRoundedRect(cx - s * 0.45, cy - s * 0.45, s * 0.9, s * 0.4, 2);
    // Helm Rim / Brim
    g.fillStyle(0x9aa0b4, 1);
    g.fillRect(cx - s * 0.6, cy - s * 0.2, s * 1.2, s * 0.12);
    // Steel Nasal Guard
    g.fillRect(cx - s * 0.08, cy - s * 0.2, s * 0.16, s * 0.3);
    // Glowing Fierce Visor Eyes
    g.fillStyle(0xffd56b, 1);
    g.fillRect(cx - s * 0.3, cy - s * 0.12, s * 0.16, s * 0.08);
    g.fillRect(cx + s * 0.14, cy - s * 0.12, s * 0.16, s * 0.08);

    // Left Arm: Round Oak Shield with Iron Boss
    g.fillStyle(0x5d3b21, 1);
    g.fillCircle(cx - s * 0.55, cy + s * 0.1, s * 0.38);
    g.lineStyle(2, 0x9aa0b4, 1);
    g.strokeCircle(cx - s * 0.55, cy + s * 0.1, s * 0.38);
    g.fillStyle(0xe8b73a, 1);
    g.fillCircle(cx - s * 0.55, cy + s * 0.1, s * 0.12);

    // Right Arm: Iron Broadsword
    g.fillStyle(0x9aa0b4, 1);
    g.fillRect(cx + s * 0.45, cy - s * 0.4, s * 0.14, s * 0.7);
    g.fillTriangle(cx + s * 0.45, cy - s * 0.4, cx + s * 0.59, cy - s * 0.4, cx + s * 0.52, cy - s * 0.62);
    // Crossguard & Pommel
    g.fillStyle(0xe8b73a, 1);
    g.fillRect(cx + s * 0.35, cy + s * 0.15, s * 0.34, s * 0.08);
    g.fillCircle(cx + s * 0.52, cy + s * 0.36, s * 0.08);
  };

  const drawRunner = (g, s) => {
    const cx = s, cy = s;
    // Ground drop shadow (stretched for high speed)
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + s * 0.75, s * 1.4, s * 0.3);

    // Dynamic Sprinting Legs
    g.fillStyle(0x2a2114, 1);
    g.fillRect(cx - s * 0.5, cy + s * 0.3, s * 0.28, s * 0.45);
    g.fillRect(cx + s * 0.2, cy + s * 0.25, s * 0.28, s * 0.5);

    // Amber/Gold Leather Tunic (agile & sleek)
    g.fillStyle(0xe8b73a, 1);
    g.fillRoundedRect(cx - s * 0.45, cy - s * 0.15, s * 0.9, s * 0.65, 3);
    g.fillStyle(0x9b7c2a, 1);
    g.fillRect(cx - s * 0.4, cy + s * 0.15, s * 0.8, s * 0.12);

    // Bandit Cowl & Shadowy Assassin Mask
    g.fillStyle(0x7a5b18, 1);
    g.fillCircle(cx, cy - s * 0.3, s * 0.44);
    // Flowing Hood Tail / Scarf
    g.fillStyle(0xe8b73a, 1);
    g.fillTriangle(cx - s * 0.2, cy - s * 0.2, cx - s * 0.7, cy - s * 0.05, cx - s * 0.3, cy + s * 0.1);
    // Mask
    g.fillStyle(0x17130e, 1);
    g.fillRoundedRect(cx - s * 0.35, cy - s * 0.25, s * 0.7, s * 0.32, 2);
    // Glowing Keen Assassin Eyes
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - s * 0.26, cy - s * 0.22, s * 0.18, s * 0.08);
    g.fillRect(cx + s * 0.08, cy - s * 0.22, s * 0.18, s * 0.08);
    g.fillStyle(0x00ffff, 0.85);
    g.fillRect(cx - s * 0.22, cy - s * 0.22, s * 0.08, s * 0.08);
    g.fillRect(cx + s * 0.12, cy - s * 0.22, s * 0.08, s * 0.08);

    // Dual Forward-Angled Obsidian Daggers
    g.fillStyle(0x2f3640, 1);
    g.fillTriangle(cx - s * 0.45, cy + s * 0.1, cx - s * 0.75, cy - s * 0.35, cx - s * 0.35, cy - s * 0.05);
    g.fillTriangle(cx + s * 0.45, cy + s * 0.1, cx + s * 0.75, cy - s * 0.35, cx + s * 0.35, cy - s * 0.05);
    // Dagger Gleam
    g.fillStyle(0x00ffcc, 0.9);
    g.fillRect(cx - s * 0.65, cy - s * 0.25, 2, 6);
    g.fillRect(cx + s * 0.65, cy - s * 0.25, 2, 6);
  };

  const drawBrute = (g, s) => {
    const cx = s, cy = s;
    // Heavy deep shadow
    g.fillStyle(0x000000, 0.45);
    g.fillEllipse(cx, cy + s * 0.8, s * 1.6, s * 0.4);

    // Thick Armored Tree-Trunk Legs
    g.fillStyle(0x1a1524, 1);
    g.fillRect(cx - s * 0.65, cy + s * 0.35, s * 0.5, s * 0.5);
    g.fillRect(cx + s * 0.15, cy + s * 0.35, s * 0.5, s * 0.5);
    // Iron Greaves & Spikes
    g.fillStyle(0x4b2f80, 1);
    g.fillRect(cx - s * 0.6, cy + s * 0.45, s * 0.4, s * 0.35);
    g.fillRect(cx + s * 0.2, cy + s * 0.45, s * 0.4, s * 0.35);

    // Massive Armored Torso / Purple Iron Plate
    g.fillStyle(0x2b1e42, 1);
    g.fillRoundedRect(cx - s * 0.75, cy - s * 0.25, s * 1.5, s * 0.75, 4);
    g.fillStyle(0x5a3d8a, 1);
    g.fillRoundedRect(cx - s * 0.65, cy - s * 0.2, s * 1.3, s * 0.6, 3);
    // Plate Rivets
    g.fillStyle(0xc3c8d8, 1);
    g.fillCircle(cx - s * 0.5, cy - s * 0.1, 2);
    g.fillCircle(cx + s * 0.5, cy - s * 0.1, 2);
    g.fillCircle(cx - s * 0.5, cy + s * 0.2, 2);
    g.fillCircle(cx + s * 0.5, cy + s * 0.2, 2);

    // Massive Spiked Pauldrons (Shoulder Armor)
    g.fillStyle(0x382854, 1);
    g.fillRoundedRect(cx - s * 0.95, cy - s * 0.4, s * 0.45, s * 0.45, 3);
    g.fillRoundedRect(cx + s * 0.5, cy - s * 0.4, s * 0.45, s * 0.45, 3);
    // Shoulder Spikes
    g.fillStyle(0x9aa0b4, 1);
    g.fillTriangle(cx - s * 0.95, cy - s * 0.3, cx - s * 0.75, cy - s * 0.6, cx - s * 0.55, cy - s * 0.3);
    g.fillTriangle(cx + s * 0.55, cy - s * 0.3, cx + s * 0.75, cy - s * 0.6, cx + s * 0.95, cy - s * 0.3);

    // Horned Iron Greathelm
    g.fillStyle(0x191424, 1);
    g.fillRoundedRect(cx - s * 0.45, cy - s * 0.6, s * 0.9, s * 0.5, 3);
    // Bull Horns on Greathelm
    g.fillStyle(0xdcd7eb, 1);
    g.fillTriangle(cx - s * 0.4, cy - s * 0.45, cx - s * 0.8, cy - s * 0.75, cx - s * 0.2, cy - s * 0.55);
    g.fillTriangle(cx + s * 0.4, cy - s * 0.45, cx + s * 0.8, cy - s * 0.75, cx + s * 0.2, cy - s * 0.55);
    // Slit Visor with Glowing Red Battle Eyes
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - s * 0.35, cy - s * 0.42, s * 0.7, s * 0.12);
    g.fillStyle(0xff2b2b, 1);
    g.fillRect(cx - s * 0.28, cy - s * 0.4, s * 0.2, s * 0.08);
    g.fillRect(cx + s * 0.08, cy - s * 0.4, s * 0.2, s * 0.08);

    // Massive Iron Spiked Warclub / Siege Mace
    g.fillStyle(0x17130e, 1);
    g.fillRect(cx + s * 0.65, cy - s * 0.7, s * 0.2, s * 1.1);
    g.fillStyle(0x3a3f52, 1);
    g.fillCircle(cx + s * 0.75, cy - s * 0.65, s * 0.32);
    // Mace Spikes
    g.fillStyle(0x9aa0b4, 1);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      g.fillTriangle(
        cx + s * 0.75 + Math.cos(a) * (s * 0.2), cy - s * 0.65 + Math.sin(a) * (s * 0.2),
        cx + s * 0.75 + Math.cos(a + 0.5) * (s * 0.2), cy - s * 0.65 + Math.sin(a + 0.5) * (s * 0.2),
        cx + s * 0.75 + Math.cos(a + 0.25) * (s * 0.48), cy - s * 0.65 + Math.sin(a + 0.25) * (s * 0.48)
      );
    }
  };

  const drawSapper = (g, s) => {
    const cx = s, cy = s;
    // Shadow
    g.fillStyle(0x000000, 0.35);
    g.fillEllipse(cx, cy + s * 0.75, s * 1.3, s * 0.35);

    // Goblin Green Legs / Tattered Boots
    g.fillStyle(0x1d3824, 1);
    g.fillRect(cx - s * 0.45, cy + s * 0.35, s * 0.35, s * 0.45);
    g.fillRect(cx + s * 0.1, cy + s * 0.35, s * 0.35, s * 0.45);

    // Green Goblin Torso with Straps
    g.fillStyle(0x489658, 1);
    g.fillRoundedRect(cx - s * 0.45, cy - s * 0.1, s * 0.9, s * 0.55, 3);
    g.fillStyle(0x2f6b3f, 1);
    g.fillRect(cx - s * 0.4, cy + s * 0.2, s * 0.8, s * 0.14);

    // Back-Strapped Giant Powder Keg / Bomb
    g.fillStyle(0x5a2d12, 1);
    g.fillRoundedRect(cx - s * 0.7, cy - s * 0.35, s * 0.55, s * 0.65, 3);
    // Iron Barrel Hoops
    g.fillStyle(0x17130e, 1);
    g.fillRect(cx - s * 0.7, cy - s * 0.3, s * 0.55, s * 0.08);
    g.fillRect(cx - s * 0.7, cy + s * 0.1, s * 0.55, s * 0.08);
    // Skull Stamp on Barrel
    g.fillStyle(0xe8b73a, 1);
    g.fillCircle(cx - s * 0.42, cy - s * 0.08, s * 0.1);
    g.fillRect(cx - s * 0.46, cy - s * 0.02, s * 0.08, s * 0.06);

    // Sputtering Burning Fuse on Powder Keg
    g.lineStyle(2, 0xdcd7eb, 1);
    g.beginPath();
    g.moveTo(cx - s * 0.42, cy - s * 0.35);
    g.lineTo(cx - s * 0.35, cy - s * 0.6);
    g.strokePath();
    // Flame & Spark
    g.fillStyle(0xff3838, 1);
    g.fillCircle(cx - s * 0.35, cy - s * 0.6, 4);
    g.fillStyle(0xffd56b, 1);
    g.fillCircle(cx - s * 0.35, cy - s * 0.6, 2.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - s * 0.32, cy - s * 0.63, 1.2);

    // Goblin Head with Long Ears & Tinkerer Goggles
    g.fillStyle(0x66c07a, 1);
    g.fillCircle(cx + s * 0.1, cy - s * 0.25, s * 0.38);
    // Pointy Goblin Ears
    g.fillTriangle(cx - s * 0.1, cy - s * 0.25, cx - s * 0.45, cy - s * 0.45, cx + s * 0.05, cy - s * 0.15);
    g.fillTriangle(cx + s * 0.25, cy - s * 0.25, cx + s * 0.6, cy - s * 0.45, cx + s * 0.1, cy - s * 0.15);
    // Brass Tinkerer Goggles with Cyan Glass
    g.fillStyle(0xe8b73a, 1);
    g.fillCircle(cx - s * 0.02, cy - s * 0.25, s * 0.18);
    g.fillCircle(cx + s * 0.28, cy - s * 0.25, s * 0.18);
    g.fillStyle(0x00e5ff, 1);
    g.fillCircle(cx - s * 0.02, cy - s * 0.25, s * 0.11);
    g.fillCircle(cx + s * 0.28, cy - s * 0.25, s * 0.11);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - s * 0.05, cy - s * 0.28, 1.5);
    g.fillCircle(cx + s * 0.25, cy - s * 0.28, 1.5);
  };

  const drawHarpy = (g, s) => {
    const cx = s, cy = s;
    // Aerial Floating Shadow below
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(cx, cy + s * 0.85, s * 1.5, s * 0.25);

    // Large Majestic Cyan/Lapis Wings
    // Left Wing
    g.fillStyle(0x1f5b75, 1);
    g.fillTriangle(cx - s * 0.2, cy - s * 0.1, cx - s * 1.3, cy - s * 0.6, cx - s * 0.4, cy + s * 0.4);
    g.fillStyle(0x4ea3c9, 1);
    g.fillTriangle(cx - s * 0.2, cy - s * 0.1, cx - s * 1.15, cy - s * 0.45, cx - s * 0.35, cy + s * 0.25);
    g.fillStyle(0x90cdf4, 1);
    g.fillTriangle(cx - s * 0.2, cy - s * 0.05, cx - s * 0.95, cy - s * 0.3, cx - s * 0.3, cy + s * 0.15);

    // Right Wing
    g.fillStyle(0x1f5b75, 1);
    g.fillTriangle(cx + s * 0.2, cy - s * 0.1, cx + s * 1.3, cy - s * 0.6, cx + s * 0.4, cy + s * 0.4);
    g.fillStyle(0x4ea3c9, 1);
    g.fillTriangle(cx + s * 0.2, cy - s * 0.1, cx + s * 1.15, cy - s * 0.45, cx + s * 0.35, cy + s * 0.25);
    g.fillStyle(0x90cdf4, 1);
    g.fillTriangle(cx + s * 0.2, cy - s * 0.05, cx + s * 0.95, cy - s * 0.3, cx + s * 0.3, cy + s * 0.15);

    // Feathered Torso
    g.fillStyle(0x194559, 1);
    g.fillRoundedRect(cx - s * 0.35, cy - s * 0.2, s * 0.7, s * 0.65, 3);
    g.fillStyle(0x3582a3, 1);
    g.fillRoundedRect(cx - s * 0.25, cy - s * 0.15, s * 0.5, s * 0.5, 2);

    // Razor Iron Talons (Curved)
    g.fillStyle(0x17130e, 1);
    g.fillTriangle(cx - s * 0.3, cy + s * 0.4, cx - s * 0.35, cy + s * 0.7, cx - s * 0.15, cy + s * 0.45);
    g.fillTriangle(cx + s * 0.3, cy + s * 0.4, cx + s * 0.35, cy + s * 0.7, cx + s * 0.15, cy + s * 0.45);
    g.fillStyle(0xdcd7eb, 1);
    g.fillRect(cx - s * 0.35, cy + s * 0.6, 2, 4);
    g.fillRect(cx + s * 0.33, cy + s * 0.6, 2, 4);

    // Avian Feathered Crest & Head
    g.fillStyle(0x236585, 1);
    g.fillCircle(cx, cy - s * 0.35, s * 0.4);
    // Head Feather Crest (3 plumage tips)
    g.fillStyle(0x4ea3c9, 1);
    g.fillTriangle(cx, cy - s * 0.4, cx - s * 0.3, cy - s * 0.8, cx - s * 0.1, cy - s * 0.45);
    g.fillTriangle(cx, cy - s * 0.4, cx, cy - s * 0.9, cx + s * 0.15, cy - s * 0.45);
    g.fillTriangle(cx, cy - s * 0.4, cx + s * 0.3, cy - s * 0.8, cx + s * 0.1, cy - s * 0.45);

    // Golden Curved Raptor Beak
    g.fillStyle(0xe8b73a, 1);
    g.fillTriangle(cx - s * 0.12, cy - s * 0.3, cx + s * 0.12, cy - s * 0.3, cx, cy - s * 0.1);

    // Piercing Glowing Eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - s * 0.16, cy - s * 0.36, 2.5);
    g.fillCircle(cx + s * 0.16, cy - s * 0.36, 2.5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - s * 0.16, cy - s * 0.36, 1.2);
    g.fillCircle(cx + s * 0.16, cy - s * 0.36, 1.2);
  };

  const drawWarlord = (g, s) => {
    const cx = s, cy = s;
    // Deep Colossal Shadow
    g.fillStyle(0x000000, 0.5);
    g.fillEllipse(cx, cy + s * 0.85, s * 1.7, s * 0.38);

    // Heavy Plated Leg Greaves
    g.fillStyle(0x15121b, 1);
    g.fillRect(cx - s * 0.6, cy + s * 0.35, s * 0.45, s * 0.5);
    g.fillRect(cx + s * 0.15, cy + s * 0.35, s * 0.45, s * 0.5);
    // Gold Inlaid Greave Trim
    g.fillStyle(0xe8b73a, 1);
    g.fillRect(cx - s * 0.55, cy + s * 0.4, s * 0.35, s * 0.1);
    g.fillRect(cx + s * 0.2, cy + s * 0.4, s * 0.35, s * 0.1);

    // Full Gothic Plate Body & Royal Crimson Tabard
    g.fillStyle(0x231c2b, 1);
    g.fillRoundedRect(cx - s * 0.7, cy - s * 0.25, s * 1.4, s * 0.75, 5);
    // Crimson Heraldic Tabard
    g.fillStyle(0xc0362c, 1);
    g.fillRect(cx - s * 0.35, cy - s * 0.2, s * 0.7, s * 0.7);
    // Golden Heraldic Cross / Lion Rune
    g.fillStyle(0xe8b73a, 1);
    g.fillRect(cx - s * 0.08, cy - s * 0.1, s * 0.16, s * 0.45);
    g.fillRect(cx - s * 0.22, cy + s * 0.02, s * 0.44, s * 0.12);

    // Heavy Spiked Gold Pauldrons
    g.fillStyle(0x3d3049, 1);
    g.fillRoundedRect(cx - s * 0.95, cy - s * 0.42, s * 0.45, s * 0.45, 4);
    g.fillRoundedRect(cx + s * 0.5, cy - s * 0.42, s * 0.45, s * 0.45, 4);
    g.fillStyle(0xe8b73a, 1);
    g.strokeRoundedRect(cx - s * 0.95, cy - s * 0.42, s * 0.45, s * 0.45, 4);
    g.strokeRoundedRect(cx + s * 0.5, cy - s * 0.42, s * 0.45, s * 0.45, 4);

    // Left Hand: Massive Heraldic Tower Shield
    g.fillStyle(0x17130e, 1);
    g.fillRoundedRect(cx - s * 0.98, cy - s * 0.15, s * 0.48, s * 0.85, 3);
    g.fillStyle(0xc0362c, 1);
    g.fillRoundedRect(cx - s * 0.94, cy - s * 0.11, s * 0.4, s * 0.77, 2);
    // Gold Boss & Rim on Shield
    g.fillStyle(0xe8b73a, 1);
    g.strokeRoundedRect(cx - s * 0.94, cy - s * 0.11, s * 0.4, s * 0.77, 2);
    g.fillCircle(cx - s * 0.74, cy + s * 0.27, s * 0.1);

    // Right Hand: Flaming Zweihander Greatsword
    g.fillStyle(0xc3c8d8, 1);
    g.fillRect(cx + s * 0.65, cy - s * 0.85, s * 0.16, s * 1.15);
    g.fillTriangle(cx + s * 0.65, cy - s * 0.85, cx + s * 0.81, cy - s * 0.85, cx + s * 0.73, cy - s * 1.05);
    // Fiery Rune Glow on Blade
    g.fillStyle(0xff5500, 0.9);
    g.fillRect(cx + s * 0.68, cy - s * 0.75, s * 0.1, s * 0.8);
    g.fillStyle(0xffd56b, 1);
    g.fillRect(cx + s * 0.71, cy - s * 0.7, s * 0.04, s * 0.65);
    // Gold Crossguard & Pommel
    g.fillStyle(0xe8b73a, 1);
    g.fillRect(cx + s * 0.52, cy + s * 0.15, s * 0.42, s * 0.1);
    g.fillCircle(cx + s * 0.73, cy + s * 0.4, s * 0.09);

    // Warlord Greathelm & 3-Pointed Golden Crown
    g.fillStyle(0x191424, 1);
    g.fillRoundedRect(cx - s * 0.42, cy - s * 0.62, s * 0.84, s * 0.52, 3);
    // Flowing Crimson Plume on Helm
    g.fillStyle(0xc0362c, 1);
    g.fillTriangle(cx - s * 0.15, cy - s * 0.62, cx - s * 0.45, cy - s * 0.95, cx + s * 0.15, cy - s * 0.62);
    // 3-Pointed Golden Spiked Crown
    g.fillStyle(0xe8b73a, 1);
    g.fillTriangle(cx - s * 0.4, cy - s * 0.6, cx - s * 0.35, cy - s * 0.88, cx - s * 0.15, cy - s * 0.6);
    g.fillTriangle(cx - s * 0.18, cy - s * 0.6, cx, cy - s * 0.95, cx + s * 0.18, cy - s * 0.6);
    g.fillTriangle(cx + s * 0.15, cy - s * 0.6, cx + s * 0.35, cy - s * 0.88, cx + s * 0.4, cy - s * 0.6);

    // Sinister Glowing Demon Slit Visor
    g.fillStyle(0x0a0810, 1);
    g.fillRect(cx - s * 0.34, cy - s * 0.45, s * 0.68, s * 0.12);
    g.fillStyle(0xff2222, 1);
    g.fillRect(cx - s * 0.28, cy - s * 0.44, s * 0.22, s * 0.09);
    g.fillRect(cx + s * 0.06, cy - s * 0.44, s * 0.22, s * 0.09);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx - s * 0.2, cy - s * 0.43, 2, 3);
    g.fillRect(cx + s * 0.14, cy - s * 0.43, 2, 3);
  };

  const drawEnemy = (g, e, s) => {
    if (e.key === 'raider') drawRaider(g, s);
    else if (e.key === 'runner') drawRunner(g, s);
    else if (e.key === 'brute') drawBrute(g, s);
    else if (e.key === 'sapper') drawSapper(g, s);
    else if (e.key === 'harpy') drawHarpy(g, s);
    else if (e.key === 'warlord') drawWarlord(g, s);
  };

  for (const e of Object.values(ENEMIES)) {
    const s = e.size;
    tex('e_' + e.key, s * 2, s * 2, (g) => drawEnemy(g, e, s));
  }

  // ---- projectiles / fx ---------------------------------------------------
  tex('p_arrow', 22, 8, (g) => {
    g.fillStyle(C.bone, 1); g.fillRect(2, 3, 16, 2);
    g.fillStyle(C.stoneLight, 1); g.fillTriangle(18, 1, 22, 4, 18, 7);
    g.fillStyle(C.red, 1); g.fillTriangle(2, 1, 7, 4, 2, 7);
  });
  tex('p_ball', 20, 20, (g) => {
    g.fillStyle(0x15131f, 1); g.fillCircle(10, 10, 9);
    g.fillStyle(0x4a4560, 1); g.fillCircle(7, 7, 4);
    g.fillStyle(C.gold, 0.75); g.fillCircle(13, 4, 2.5);
  });
  tex('p_bolt', 14, 14, (g) => {
    g.fillStyle(C.gold, 1); g.fillTriangle(7, 0, 14, 7, 7, 14);
    g.fillTriangle(7, 0, 0, 7, 7, 14);
    g.fillStyle(0xffffff, 1); g.fillCircle(7, 7, 3);
  });

  g.destroy();

  // ---- board tiles -------------------------------------------------------
  const t = scene.make.graphics({ add: false });
  t.clear(); t.fillStyle(C.groundA, 1); t.fillRect(0, 0, CELL, CELL);
  t.lineStyle(2, C.gridLine, 1); t.strokeRect(1, 1, CELL - 2, CELL - 2);
  t.generateTexture('tile_a', CELL, CELL);
  t.clear(); t.fillStyle(C.groundB, 1); t.fillRect(0, 0, CELL, CELL);
  t.lineStyle(2, C.gridLine, 1); t.strokeRect(1, 1, CELL - 2, CELL - 2);
  t.generateTexture('tile_b', CELL, CELL);

  // soft radial glow for range rings / warning
  t.clear();
  for (let i = 24; i >= 0; i--) {
    t.fillStyle(0xffffff, 0.02 + (24 - i) * 0.004);
    t.fillCircle(24, 24, i);
  }
  t.generateTexture('glow', 48, 48);
  t.destroy();

  // skyline / terrain band used behind the board
  const bg = scene.make.graphics({ add: false });
  bg.clear();
  bg.fillStyle(C.sky, 1); bg.fillRect(0, 0, 1280, 400);
  bg.fillStyle(C.ridgeFar, 1);
  bg.fillTriangle(0, 400, 200, 200, 450, 400);
  bg.fillTriangle(300, 400, 600, 150, 900, 400);
  bg.fillTriangle(800, 400, 1050, 220, 1280, 400);
  bg.fillStyle(C.ridgeNear, 1);
  bg.fillTriangle(0, 400, 160, 280, 360, 400);
  bg.fillTriangle(500, 400, 780, 240, 1080, 400);
  bg.fillStyle(C.cityLine, 1);
  for (let i = 0; i < 13; i++) {
    const x = 40 + i * 95, hh = 40 + ((i * 53) % 60);
    bg.fillRect(x, 400 - hh, 30, hh);
    bg.fillTriangle(x - 6, 400 - hh, x + 15, 400 - hh - 22, x + 36, 400 - hh);
  }
  bg.generateTexture('skyline', 1280, 400);
  bg.destroy();

  // decorative ground strip under the board
  const gr = scene.make.graphics({ add: false });
  gr.clear();
  gr.fillStyle(C.groundBase, 1); gr.fillRect(0, 0, 1280, 60);
  gr.fillStyle(C.groundEdge, 1);
  for (let x = 0; x < 1280; x += 40) gr.fillCircle(x + 20, 60, 24);
  gr.generateTexture('ground', 1280, 60);
  gr.destroy();

  // ---- UI toggle icons (menu chrome) --------------------------------------
  // 64px, chunky 5-7px strokes, drawn in the same ink/parchment language as
  // the GUI slabs. Off variants swap ink -> muted and carry a crimson slash.
  const UI = 64;
  const ig = scene.make.graphics({ add: false });
  const itex = (key, w, h, draw) => { ig.clear(); draw(ig); ig.generateTexture(key, w, h); };

  const notePair = (g, color) => {
    g.fillStyle(color, 1);
    g.fillEllipse(16, 46, 21, 16);
    g.fillEllipse(44, 40, 21, 16);
    g.lineStyle(5, color, 1);
    g.lineBetween(25, 45, 25, 15);
    g.lineBetween(53, 39, 53, 9);
    g.fillPoints([{ x: 25, y: 15 }, { x: 53, y: 9 }, { x: 53, y: 20 }, { x: 25, y: 26 }], true);
  };
  const speaker = (g, color) => {
    g.fillStyle(color, 1);
    g.fillRect(8, 26, 15, 14);
    g.fillPoints([{ x: 21, y: 26 }, { x: 40, y: 11 }, { x: 40, y: 55 }, { x: 21, y: 40 }], true);
  };
  const slash = (g) => {
    g.lineStyle(7, C.crimson, 1);
    g.lineBetween(12, 56, 56, 12);
  };

  itex('ui_music_on', UI, UI, (g) => notePair(g, C.ink));
  itex('ui_music_off', UI, UI, (g) => { notePair(g, C.muted); slash(g); });

  itex('ui_sound_on', UI, UI, (g) => {
    speaker(g, C.ink);
    g.lineStyle(5, C.ink, 1);
    g.beginPath(); g.arc(42, 33, 11, -1.05, 1.05); g.strokePath();
    g.beginPath(); g.arc(42, 33, 20, -0.9, 0.9); g.strokePath();
  });
  itex('ui_sound_off', UI, UI, (g) => { speaker(g, C.muted); slash(g); });

  // "?" — hook arc + stem + dot.
  const R = 11, CX = 32, CY = 22;
  const pt = (deg) => ({
    x: CX + R * Math.cos((deg * Math.PI) / 180),
    y: CY + R * Math.sin((deg * Math.PI) / 180),
  });
  const hookEnd = pt(40);
  itex('ui_help', UI, UI, (g) => {
    g.lineStyle(6, C.ink, 1);
    g.beginPath();
    g.arc(CX, CY, R, (200 * Math.PI) / 180, (400 * Math.PI) / 180, false);
    g.strokePath();
    g.lineBetween(hookEnd.x, hookEnd.y, CX, 38);
    g.lineBetween(CX, 38, CX, 44);
    g.fillStyle(C.ink, 1);
    g.fillCircle(CX, 53, 4);
  });
  ig.destroy();

  return { grid: GRID, cell: CELL, buildingKeys: Object.keys(BUILDINGS) };
}
