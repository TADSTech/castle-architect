import Phaser from 'phaser';
import {
  C, W, H, FONT, GRID, CELL, BOARD_X, BOARD_Y,
  INFO_Y, PAL_Y, BTN_W, BTN_H, ACT_Y, getLayout,
} from '../config/palette.js';
import { BUILDINGS, UPGRADED_BUILDINGS, PALETTE_ORDER, SYNERGIES } from '../config/buildings.js';
import { waveFor, ENEMIES } from '../config/enemies.js';
import { DECREES } from '../config/decrees.js';
import { ECONOMY_CONFIG, DIFFICULTY_CONFIG, COMBAT_CONFIG } from '../config/balance.js';
import { CHAOS_CONFIG, CHAOS_ANOMALIES } from '../config/chaos.js';
import Building, { cellCenter } from '../entities/Building.js';
import Enemy from '../entities/Enemy.js';
import WheelOfChaos from '../systems/WheelOfChaos.js';
import { button, label, toast, displayLabel, hex, hasFocusedButton } from '../systems/ui.js';
import { SFX, setMusicState } from '../systems/audio.js';
import { loadSave, writeSave, upgradeLevel, recordDiscovered, unlockedBuildings, UPGRADES, resetSave } from '../systems/save.js';

const DIR4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const AID_COOLDOWN = COMBAT_CONFIG.royalAidCooldownSeconds;

export default class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  // ---------------------------------------------------------------- lifecycle
  init(data) {
    this.SFX = SFX;
    this.phase = 'build';
    this.gameMode = data?.mode || (loadSave().selectedMode || 'story');
    this.speedMultiplier = 1;
    this.selectedBuildingForUpgrade = null;
    this.aidDisabledThisWave = false;
    this.sapperPowerBuff = 1;
    this.enemySpeedBuff = 1;
    this.runKonamiUses = 0;
    this.chaosOvercharge = false;
    this.chaosMagma = false;
    this.chaosAegis = 0;
    this.chaosLightningStorm = false;
    this.chaosStormTimer = 0;
    const fresh = !data || data.fresh !== false;

    if (fresh) {
      const s = loadSave();
      this.gold = ECONOMY_CONFIG.startingGold + upgradeLevel('chest') * ECONOMY_CONFIG.startingGoldPerChestLevel;
      this.wave = 1;
      this.wavesCleared = 0;
      this.grid = new Array(GRID * GRID).fill(null);
      this.buildings = [];
      this.keep = null;
      this.runGoldEarned = 0;
      this.seenThisRun = {};
      this.aidCooldown = 0;
      this.aidArmed = false;
      this.placeCount = 0;
      this.tutorialStep = 0;
      this.newlyUnlocked = [];
      this.lastLegacy = 0;
      this.cursor = { cx: 3, cy: 5 };
      this.usedKeyboard = false;
      this.chaosSpins = CHAOS_CONFIG.startingSpins || 6;
      this.chaosExtraSpinsBonus = 3;
      this.chaosInventory = { wall: 0, tower: 0, cannon: 0, moat: 0, trap: 0, gate: 0 };
    }

    this.phase = 'build';
    this.enemies = [];
    this.projectiles = [];
    this.spawnQueue = [];
    this.spawnIdx = 0;
    this.elapsed = 0;
    this.gridVersion = (this.gridVersion || 0) + 1;
    this.selected = 'wall';
    this.tool = 'build';
    this.hover = null;
    this.resultShown = false;
    this.bannerQueue = [];
  }

  create() {
    this.SFX = SFX;
    this.now = () => this.time.now;
    this.L = getLayout(this);
    this.brokenThisWave = 0;
    this.lastKeepPos = null;
    this.buildBackdrop();
    this.buildBoard();
    this.buildHUD();
    this.buildInfoBar();
    this.buildSiegePanel();
    this.buildPalette();
    this.buildActionBar();
    this.buildOverlays();
    this.wheelOfChaos = new WheelOfChaos(this);
    this.setupKeyboard();

    this.input.mouse?.disableContextMenu();

    this.recomputeGoals();
    this.evaluateSynergies(false);
    this.refreshHUD();
    this.refreshPalette();
    this.refreshInfo();
    this.showTutorial();

    if (this.gameMode === 'chaos') {
      this.time.delayedCall(450, () => {
        this.wheelOfChaos.open();
      });
    }

    this.events.once('shutdown', () => { this.stopAllTweens(); });
  }

  // ------------------------------------------------------------------ layout
  buildBackdrop() {
    const { W, H, BOARD_Y, isLandscape } = this.L;
    if (isLandscape) {
      this.add.image(W / 2, 200, 'skyline').setDisplaySize(W, 400).setAlpha(0.65).setDepth(0);
      this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.45).setDepth(0);
      this.add.image(40 + 296, BOARD_Y - 4, 'ground').setDisplaySize(620, 60).setOrigin(0.5, 1).setDepth(1).setAlpha(0.9);
    } else {
      this.add.image(W / 2, 120, 'skyline').setAlpha(0.65).setDepth(0);
      this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.45).setDepth(0);
      this.add.image(W / 2, BOARD_Y - 4, 'ground').setOrigin(0.5, 1).setDepth(1).setAlpha(0.9);
    }
  }

  buildBoard() {
    const { GRID, CELL, BOARD_X, BOARD_Y, isLandscape } = this.L;
    const boardW = GRID * CELL;
    const boardCenterX = BOARD_X + boardW / 2;
    const boardCenterY = BOARD_Y + boardW / 2;

    this.boardDepth = 2;
    this.add.rectangle(boardCenterX, boardCenterY, boardW + 16, boardW + 16, C.ink, 1)
      .setStrokeStyle(4, C.gold, 0.45).setDepth(2);

    this.tiles = [];
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const t = this.add.image(
          BOARD_X + x * CELL + CELL / 2, BOARD_Y + y * CELL + CELL / 2,
          (x + y) % 2 ? 'tile_a' : 'tile_b'
        ).setDisplaySize(CELL, CELL).setDepth(3);
        this.tiles.push(t);
      }
    }

    // Sacred Ritual Execution Overlay (Wave 10 Rows 3 & 4)
    this.ritualOverlay = this.add.container(0, 0).setDepth(3.5).setVisible(false).setAlpha(0);
    for (let y = 3; y <= 4; y++) {
      for (let x = 0; x < GRID; x++) {
        const rx = BOARD_X + x * CELL + CELL / 2;
        const ry = BOARD_Y + y * CELL + CELL / 2;
        const rTile = this.add.rectangle(rx, ry, CELL - 4, CELL - 4, C.crimson, 0.32).setStrokeStyle(2, C.crimsonDeep, 0.9);
        const rTxt = label(this.add, rx, ry, 'ᚱ', 24, C.paper, [0.5, 0.5]).setAlpha(0.85);
        this.ritualOverlay.add([rTile, rTxt]);
      }
    }

    // spawn strip above the board
    this.add.rectangle(boardCenterX, BOARD_Y - 22, boardW, 6, C.red, 0.55).setDepth(4);
    for (let x = 0; x < GRID; x++) {
      this.add.triangle(
        BOARD_X + x * CELL + CELL / 2, BOARD_Y - 22, 0, 0, 12, 0, 6, 9, C.red, 0.75
      ).setDepth(4);
    }

    // keyboard cursor + placement ghost
    this.cursorBox = this.add.rectangle(0, 0, CELL - 4, CELL - 4)
      .setStrokeStyle(3, C.gold, 0.95).setDepth(30).setVisible(false);
    this.ghost = this.add.rectangle(0, 0, CELL, CELL, C.white, 0.16)
      .setStrokeStyle(2, C.white, 0.5).setDepth(29).setVisible(false);
    this.rangeRing = this.add.circle(0, 0, 100, C.white, 0.05)
      .setStrokeStyle(2, C.gold, 0.5).setDepth(28).setVisible(false);

    this.boardHit = this.add.rectangle(
      boardCenterX, boardCenterY, boardW, boardW
    ).setDepth(40).setInteractive();
    this.boardHit.on('pointermove', (p) => this.onBoardMove(p));
    this.boardHit.on('pointerout', () => { this.hover = null; this.ghost.setVisible(false); this.rangeRing.setVisible(false); });
    this.boardHit.on('pointerdown', (p) => this.onBoardDown(p));
  }

  buildHUD() {
    const { W, isLandscape } = this.L;
    const g = this.add.container(0, 0).setDepth(60);
    const s = loadSave();
    const speedAllowed = this.gameMode === 'survival' || s.storyCompleted || s.hasLostAtLevel10 || (s.unlockedModes && s.unlockedModes.survival);
    if (!speedAllowed) this.speedMultiplier = 1;

    if (isLandscape) {
      const sx = 660, sy = 10, sw = 580, sh = 88;
      g.add(this.add.rectangle(sx + sw / 2 + 8, sy + sh / 2 + 8, sw, sh, C.ink, 1));
      g.add(this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, C.paper, 1).setStrokeStyle(3, C.ink, 1));

      g.add(this.add.circle(sx + 34, sy + 20, 13, C.gold, 1).setStrokeStyle(2, C.ink, 1));
      g.add(this.add.circle(sx + 34, sy + 20, 8, C.goldDim, 1));
      this.goldText = label(this.add, sx + 58, sy + 20, '120', 25, C.goldInk, [0, 0.5]).setFontStyle('bold');
      g.add(this.goldText);

      this.waveText = label(this.add, sx + sw / 2 - 25, sy + 20, 'BUILD PHASE', 20, C.ink).setFontStyle('bold');
      g.add(this.waveText);

      if (speedAllowed) {
        this.speedBtn = button(this, {
          x: sx + sw - 86, y: sy + 18, w: 58, h: 26, label: '» 1X', fontSize: 13,
          onClick: () => this.toggleSpeed(),
        });
        this.menuBtn = button(this, {
          x: sx + sw - 28, y: sy + 18, w: 42, h: 26, label: '☰', fontSize: 18,
          onClick: () => this.confirmExit(),
        });
        g.add([this.speedBtn, this.menuBtn]);
      } else {
        this.speedBtn = null;
        this.menuBtn = button(this, {
          x: sx + sw - 32, y: sy + 18, w: 48, h: 26, label: '☰', fontSize: 18,
          onClick: () => this.confirmExit(),
        });
        g.add(this.menuBtn);
      }

      g.add(label(this.add, sx + 20, sy + 48, '♥', 24, C.crimson, [0, 0.5]).setFontStyle('bold'));
      this.keepBarBg = this.add.rectangle(sx + 70, sy + 48, sw - 140, 16, C.ink, 1).setOrigin(0, 0.5);
      this.keepBarFg = this.add.rectangle(sx + 70, sy + 48, sw - 140, 12, C.green, 1).setOrigin(0, 0.5);
      g.add([this.keepBarBg, this.keepBarFg]);
      this.keepBarText = label(this.add, sx + sw - 20, sy + 48, '', 14, C.ink, [1, 0.5]).setFontStyle('bold');
      g.add(this.keepBarText);

      this.statusText = label(this.add, sx + 20, sy + 70, '', 16, C.crimsonDeep, [0, 0.5]).setFontStyle('bold');
      this.expandSlotBtn = button(this, {
        x: sx + 215, y: sy + 70, w: 124, h: 22, label: '+1 SLOT (1000G)', fontSize: 10, fill: C.gold, stroke: C.ink,
        onClick: () => this.buyExtraPlacementSlot(),
      });
      this.statusRight = label(this.add, sx + sw - 20, sy + 70, '', 16, C.ink, [1, 0.5]).setFontStyle('bold');
      g.add([this.statusText, this.expandSlotBtn, this.statusRight]);
    } else {
      g.add(this.add.rectangle(W / 2 + 8, 71, W, 126, C.ink, 1));
      g.add(this.add.rectangle(W / 2, 63, W, 126, C.paper, 1).setStrokeStyle(3, C.ink, 1));
      g.add(this.add.rectangle(W / 2, 124, W - 6, 3, C.crimson, 1));

      g.add(this.add.circle(44, 28, 15, C.gold, 1).setStrokeStyle(2, C.ink, 1));
      g.add(this.add.circle(44, 28, 9, C.goldDim, 1));
      this.goldText = label(this.add, 70, 28, '120', 28, C.goldInk, [0, 0.5]).setFontStyle('bold');
      g.add(this.goldText);

      this.waveText = label(this.add, W / 2 - 35, 28, 'BUILD PHASE', 21, C.ink).setFontStyle('bold');
      g.add(this.waveText);

      if (speedAllowed) {
        this.speedBtn = button(this, {
          x: W - 106, y: 28, w: 64, h: 28, label: '» 1X', fontSize: 14,
          onClick: () => this.toggleSpeed(),
        });
        this.menuBtn = button(this, {
          x: W - 44, y: 28, w: 46, h: 28, label: '☰', fontSize: 19,
          onClick: () => this.confirmExit(),
        });
        g.add([this.speedBtn, this.menuBtn]);
      } else {
        this.speedBtn = null;
        this.menuBtn = button(this, {
          x: W - 48, y: 28, w: 52, h: 28, label: '☰', fontSize: 19,
          onClick: () => this.confirmExit(),
        });
        g.add(this.menuBtn);
      }

      g.add(label(this.add, 30, 68, '♥', 26, C.crimson, [0, 0.5]).setFontStyle('bold'));
      this.keepBarBg = this.add.rectangle(90, 68, W - 170, 18, C.ink, 1).setOrigin(0, 0.5);
      this.keepBarFg = this.add.rectangle(90, 68, W - 170, 14, C.green, 1).setOrigin(0, 0.5);
      g.add([this.keepBarBg, this.keepBarFg]);
      this.keepBarText = label(this.add, W - 40, 68, '', 15, C.ink, [1, 0.5]).setFontStyle('bold');
      g.add(this.keepBarText);

      this.statusText = label(this.add, 30, 102, '', 18, C.crimsonDeep, [0, 0.5]).setFontStyle('bold');
      this.expandSlotBtn = button(this, {
        x: W / 2 + 15, y: 102, w: 136, h: 26, label: '+1 SLOT (1000G)', fontSize: 11, fill: C.gold, stroke: C.ink,
        onClick: () => this.buyExtraPlacementSlot(),
      });
      this.statusRight = label(this.add, W - 30, 102, '', 18, C.ink, [1, 0.5]).setFontStyle('bold');
      g.add([this.statusText, this.expandSlotBtn, this.statusRight]);
    }
  }

  buildInfoBar() {
    const { W, isLandscape } = this.L;
    const g = this.add.container(0, 0).setDepth(60);

    if (isLandscape) {
      const sx = 660, sy = 104, sw = 580, sh = 94;
      g.add(this.add.rectangle(sx + sw / 2 + 8, sy + sh / 2 + 8, sw, sh, C.ink, 1));
      g.add(this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, C.paper, 1).setStrokeStyle(3, C.ink, 1));
      
      this.infoTitle = this.add.text(sx + 16, sy + 15, '', {
        fontFamily: FONT, fontSize: '19px', color: hex(C.ink), fontStyle: 'bold',
        wordWrap: { width: 340 }, resolution: 2,
      }).setOrigin(0, 0.5);
      this.infoBody = this.add.text(sx + 16, sy + 54, '', {
        fontFamily: FONT, fontSize: '13px', color: hex(C.inkSoft),
        wordWrap: { width: 340 }, lineSpacing: 2, resolution: 2,
      }).setOrigin(0, 0.5);
      g.add([this.infoTitle, this.infoBody]);

      this.upgradeBtn = button(this, {
        x: sx + sw - 156, y: sy + 25, w: 90, h: 32, label: 'UPGRADE', fontSize: 13,
        fill: C.gold, stroke: C.ink,
        onClick: () => this.upgradeSelectedBuilding(),
      });
      this.relocateBtn = button(this, {
        x: sx + sw - 58, y: sy + 25, w: 90, h: 32, label: 'MOVE', fontSize: 13,
        fill: C.lapis, stroke: C.ink,
        onClick: () => this.moveKeep(),
      });
      this.sellBtn = button(this, {
        x: sx + sw - 156, y: sy + 65, w: 90, h: 32, label: 'SELL', fontSize: 13, fill: C.crimson, stroke: C.ink,
        onClick: () => this.setTool(this.tool === 'sell' ? 'build' : 'sell'),
      });
      this.repairBtn = button(this, {
        x: sx + sw - 58, y: sy + 65, w: 90, h: 32, label: 'REPAIR', fontSize: 13, fill: C.green, stroke: C.ink,
        onClick: () => this.setTool(this.tool === 'repair' ? 'build' : 'repair'),
      });
      g.add([this.upgradeBtn, this.relocateBtn, this.sellBtn, this.repairBtn]);
    } else {
      g.add(this.add.rectangle(W / 2 + 8, INFO_Y + 56, W - 28, 96, C.ink, 1));
      g.add(this.add.rectangle(W / 2, INFO_Y + 48, W - 28, 96, C.paper, 1).setStrokeStyle(3, C.ink, 1));
      
      this.infoTitle = this.add.text(24, INFO_Y + 22, '', {
        fontFamily: FONT, fontSize: '18px', color: hex(C.ink), fontStyle: 'bold',
        wordWrap: { width: W - 245 }, resolution: 2,
      }).setOrigin(0, 0.5);
      this.infoBody = this.add.text(24, INFO_Y + 58, '', {
        fontFamily: FONT, fontSize: '13px', color: hex(C.inkSoft),
        wordWrap: { width: W - 245 }, lineSpacing: 2, resolution: 2,
      }).setOrigin(0, 0.5);
      g.add([this.infoTitle, this.infoBody]);

      this.upgradeBtn = button(this, {
        x: W - 168, y: INFO_Y + 26, w: 92, h: 32, label: 'UPGRADE', fontSize: 13,
        fill: C.gold, stroke: C.ink,
        onClick: () => this.upgradeSelectedBuilding(),
      });
      this.relocateBtn = button(this, {
        x: W - 68, y: INFO_Y + 26, w: 92, h: 32, label: 'MOVE', fontSize: 13,
        fill: C.lapis, stroke: C.ink,
        onClick: () => this.moveKeep(),
      });
      this.sellBtn = button(this, {
        x: W - 168, y: INFO_Y + 66, w: 92, h: 32, label: 'SELL', fontSize: 13, fill: C.crimson, stroke: C.ink,
        onClick: () => this.setTool(this.tool === 'sell' ? 'build' : 'sell'),
      });
      this.repairBtn = button(this, {
        x: W - 68, y: INFO_Y + 66, w: 92, h: 32, label: 'REPAIR', fontSize: 13, fill: C.green, stroke: C.ink,
        onClick: () => this.setTool(this.tool === 'repair' ? 'build' : 'repair'),
      });
      g.add([this.upgradeBtn, this.relocateBtn, this.sellBtn, this.repairBtn]);
    }
    this.infoGroup = g;
  }

  buildSiegePanel() {
    const { W, isLandscape } = this.L;
    const g = this.add.container(0, 0).setDepth(60).setVisible(false);

    if (isLandscape) {
      const sx = 660, sy = 206, sw = 580, sh = 348;
      g.add(this.add.rectangle(sx + sw / 2 + 8, sy + sh / 2 + 8, sw, sh, C.ink, 1));
g.add(this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, C.paper, 1).setStrokeStyle(3, C.ink, 1));

      g.add(label(this.add, sx + 20, sy + 24, 'THE FIELD', 17, C.ink, [0, 0.5]).setFontStyle('bold'));
      this.siegeRemain = label(this.add, sx + sw - 20, sy + 24, '', 17, C.crimsonDeep, [1, 0.5]).setFontStyle('bold');
      g.add(this.siegeRemain);

      this.waveBarBg = this.add.rectangle(sx + 20, sy + 54, sw - 40, 16, C.ink, 1).setOrigin(0, 0.5);
      this.waveBarFg = this.add.rectangle(sx + 20, sy + 54, sw - 40, 16, C.red, 1).setOrigin(0, 0.5);
      g.add([this.waveBarBg, this.waveBarFg]);

      this.waveBarText = label(this.add, sx + 20, sy + 82, '', 16, C.ink, [0, 0.5]).setFontStyle('bold');
      this.waveBarRight = label(this.add, sx + sw - 20, sy + 82, '', 16, C.inkSoft, [1, 0.5]);
      g.add([this.waveBarText, this.waveBarRight]);

      this.rosterRow = this.add.container(0, 0);
      g.add(this.rosterRow);

      g.add(this.add.rectangle(sx + sw / 2, sy + 180, sw - 40, 2, C.ink, 1));

      this.siegeStats = label(this.add, sx + 20, sy + 210, '', 17, C.ink, [0, 0.5]);
      this.siegeSyn = label(this.add, sx + 20, sy + 245, '', 16, C.muted, [0, 0.5]);
      this.siegeHelp = label(this.add, sx + 20, sy + 280, 'Tap ROYAL AID, then tap the field to drop a volley.', 16, C.inkSoft, [0, 0.5]);
      g.add([this.siegeStats, this.siegeSyn, this.siegeHelp]);
    } else {
      g.add(this.add.rectangle(W / 2 + 8, 948, W - 32, 336, C.ink, 1));
g.add(this.add.rectangle(W / 2, 940, W - 32, 336, C.paper, 1).setStrokeStyle(3, C.ink, 1));

      g.add(label(this.add, 48, 798, 'THE FIELD', 18, C.ink, [0, 0.5]).setFontStyle('bold'));
      this.siegeRemain = label(this.add, W - 48, 798, '', 18, C.crimsonDeep, [1, 0.5]).setFontStyle('bold');
      g.add(this.siegeRemain);

      this.waveBarBg = this.add.rectangle(48, 830, W - 96, 16, C.ink, 1).setOrigin(0, 0.5);
      this.waveBarFg = this.add.rectangle(48, 830, W - 96, 16, C.red, 1).setOrigin(0, 0.5);
      g.add([this.waveBarBg, this.waveBarFg]);

      this.waveBarText = label(this.add, 48, 862, '', 17, C.ink, [0, 0.5]).setFontStyle('bold');
      this.waveBarRight = label(this.add, W - 48, 862, '', 17, C.inkSoft, [1, 0.5]);
      g.add([this.waveBarText, this.waveBarRight]);

      this.rosterRow = this.add.container(0, 0);
      g.add(this.rosterRow);

      g.add(this.add.rectangle(W / 2, 962, W - 96, 2, C.ink, 1));

      this.siegeStats = label(this.add, 48, 994, '', 18, C.ink, [0, 0.5]);
      this.siegeSyn = label(this.add, 48, 1026, '', 17, C.muted, [0, 0.5]);
      this.siegeHelp = label(this.add, 48, 1058, 'Tap ROYAL AID, then tap the field to drop a volley.', 17, C.inkSoft, [0, 0.5]);
      g.add([this.siegeStats, this.siegeSyn, this.siegeHelp]);
    }

    this.siegePanel = g;
  }

  buildRoster() {
    const { W, isLandscape } = this.L;
    this.rosterRow.removeAll(true);
    this.rosterSlots = [];

    // Aggregate counts by unique enemy type
    const totalsByType = {};
    for (const [type, count] of this.waveDef.spawns) {
      totalsByType[type] = (totalsByType[type] || 0) + count;
    }

    const ORDER = ['warlord', 'raider', 'runner', 'brute', 'sapper', 'harpy'];
    const uniqueTypes = Object.keys(totalsByType).sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const groups = uniqueTypes.map((t) => ({ type: t, total: totalsByType[t] }));

    if (isLandscape) {
      const sx = 660, sy = 206, sw = 580;
      const count = Math.max(1, groups.length);
      const slotW = Math.min(105, (sw - 40) / count);
      const totalUsedW = count * slotW;
      const startX = sx + 20 + (sw - 40 - totalUsedW) / 2;

      groups.forEach((grp, i) => {
        const cx = startX + (i + 0.5) * slotW;
        const cy = sy + 132;
        const def = ENEMIES[grp.type];
        const d = def.boss ? 42 : 32;

        const cardBg = this.add.rectangle(cx, cy, slotW - 6, 64, C.paper2, 1).setStrokeStyle(2, C.ink, 1);
        const icon = this.add.image(cx - (slotW > 75 ? 20 : 14), cy - 6, 'e_' + grp.type).setDisplaySize(d, d);
        const txt = label(this.add, cx + (slotW > 75 ? 16 : 12), cy - 6, `×${grp.total}`, 16, C.crimsonDeep, [0.5, 0.5]).setFontStyle('bold');
        const name = label(this.add, cx, cy + 20, def.name, 12, C.inkSoft, [0.5, 0.5]);

        this.rosterRow.add([cardBg, icon, txt, name]);
        this.rosterSlots.push({ type: grp.type, total: grp.total, icon, txt, cardBg, name });
      });
    } else {
      const count = Math.max(1, groups.length);
      const slotW = Math.min(125, (W - 96) / count);
      const totalUsedW = count * slotW;
      const startX = 48 + (W - 96 - totalUsedW) / 2;

      groups.forEach((grp, i) => {
        const cx = startX + (i + 0.5) * slotW;
        const cy = 925;
        const def = ENEMIES[grp.type];
        const d = def.boss ? 46 : 36;

        const cardBg = this.add.rectangle(cx, cy, slotW - 6, 68, C.paper2, 1).setStrokeStyle(2, C.ink, 1);
        const icon = this.add.image(cx - (slotW > 85 ? 22 : 16), cy - 6, 'e_' + grp.type).setDisplaySize(d, d);
        const txt = label(this.add, cx + (slotW > 85 ? 18 : 14), cy - 6, `×${grp.total}`, 18, C.crimsonDeep, [0.5, 0.5]).setFontStyle('bold');
        const name = label(this.add, cx, cy + 22, def.name, 13, C.inkSoft, [0.5, 0.5]);

        this.rosterRow.add([cardBg, icon, txt, name]);
        this.rosterSlots.push({ type: grp.type, total: grp.total, icon, txt, cardBg, name });
      });
    }
  }

  refreshSiegePanel() {
    const total = this.spawnQueue.length;
    const leftByType = {};
    for (let i = this.spawnIdx; i < this.spawnQueue.length; i++) {
      const t = this.spawnQueue[i].type;
      leftByType[t] = (leftByType[t] || 0) + 1;
    }
    let alive = 0;
    for (const e of this.enemies) {
      if (e.dead) continue;
      alive++;
      const t = e.def.key;
      leftByType[t] = (leftByType[t] || 0) + 1;
    }
    const remaining = (total - this.spawnIdx) + alive;
    const defeated = Math.max(0, Math.min(total, total - remaining));
    const pct = total ? defeated / total : 0;

    const { isLandscape, W } = this.L;
    const barW = isLandscape ? 540 : (W - 96);
    this.waveBarFg.setSize(Math.max(1, barW * pct), 16);
    this.waveBarFg.setFillStyle(pct >= 0.66 ? C.green : pct >= 0.33 ? C.gold : C.red, 1);
    this.waveBarText.setText(`${defeated} of ${total} fallen`);
    this.waveBarRight.setText(`${remaining} still coming`);
    this.siegeRemain.setText(`${this.waveDef.label.toUpperCase()} · ${total} FOES`);

    for (const s of this.rosterSlots) {
      const left = leftByType[s.type] || 0;
      s.txt.setText(left > 0 ? `×${left}` : '0');
      s.txt.setColor(left > 0 ? hex(C.crimsonDeep) : hex(C.muted));
      s.icon.setAlpha(left > 0 ? 1 : 0.35);
      if (s.name) s.name.setColor(left > 0 ? hex(C.inkSoft) : hex(C.muted));
      if (s.cardBg) s.cardBg.setAlpha(left > 0 ? 0.9 : 0.4);
    }

    this.siegeStats.setText(
      `Slain ${this.killsThisWave}    ·    Broken ${this.brokenThisWave}    ·    Gold +${Math.floor(this.goldThisWave)}`
    );

    const act = [];
    if (this.buildings.some((b) => b.key === 'wall' && b.reinforced)) act.push('stones lock');
    if (this.buildings.some((b) => b.key === 'tower' && b.braced)) act.push('braced emplacement');
    if (this.buildings.some((b) => b.key === 'cannon' && b.emplaced)) act.push('cannon mounted');
    if (this.keep && this.keep.plated) act.push('court walled');
    if (this.lastStand) act.push('last stand');
    let syn = act.length ? `Active — ${act.join(' · ')}` : 'No synergies yet — flank walls with walls.';
    if (syn.length > 74) syn = syn.slice(0, 73) + '…';
    this.siegeSyn.setText(syn).setColor(act.length ? hex(C.crimsonDeep) : hex(C.muted));
  }

  buildPalette() {
    const { W, isLandscape } = this.L;
    this.paletteGroup = this.add.container(0, 0).setDepth(60);
    this.paletteSlots = [];

    if (isLandscape) {
      const sx = 660, sy = 206, sw = 580, sh = 348;
      const btnW = 136, btnH = 162, gap = 8;
      const x0 = sx + (sw - (4 * btnW + 3 * gap)) / 2 + btnW / 2;

      PALETTE_ORDER.forEach((key, i) => {
        const col = i % 4, row = (i / 4) | 0;
        const x = x0 + col * (btnW + gap);
        const y = sy + row * (btnH + gap) + btnH / 2;
        const def = BUILDINGS[key];
        const isChaos = this.gameMode === 'chaos';
        const sub = isChaos ? (key === 'keep' ? 'free' : `x${this.chaosInventory[key] || 0}`) : (key === 'keep' ? 'free' : `${def.cost} gold`);
        const b = button(this, {
          x, y, w: btnW, h: btnH, label: def.name, sub,
          fontSize: 19, icon: 'b_' + (key === 'cannon' ? 'cannon_idle' : key),
          onClick: () => { this.selectPiece(key); },
        });
        this.paletteSlots.push({ key, btn: b });
        this.paletteGroup.add(b);
      });

      this.toolSlot = button(this, {
        x: x0 + 3 * (btnW + gap), y: sy + (btnH + gap) + btnH / 2,
        w: btnW, h: btnH, label: 'TOOL', sub: 'place', fontSize: 19,
        fill: C.paper2, stroke: C.ink,
        onClick: () => {
          const order = ['build', 'sell', 'repair'];
          this.setTool(order[(order.indexOf(this.tool) + 1) % order.length]);
        },
      });
      this.paletteGroup.add(this.toolSlot);
    } else {
      const gap = 8;
      const totalW = 4 * BTN_W + 3 * gap;
      const x0 = (W - totalW) / 2 + BTN_W / 2;

      PALETTE_ORDER.forEach((key, i) => {
        const col = i % 4, row = (i / 4) | 0;
        const x = x0 + col * (BTN_W + gap);
        const y = PAL_Y + row * (BTN_H + gap) + BTN_H / 2;
        const def = BUILDINGS[key];
        const isChaos = this.gameMode === 'chaos';
        const sub = isChaos ? (key === 'keep' ? 'free' : `x${this.chaosInventory[key] || 0}`) : (key === 'keep' ? 'free' : `${def.cost} gold`);
        const b = button(this, {
          x, y, w: BTN_W, h: BTN_H, label: def.name, sub,
          fontSize: 21, icon: 'b_' + (key === 'cannon' ? 'cannon_idle' : key),
          onClick: () => { this.selectPiece(key); },
        });
        this.paletteSlots.push({ key, btn: b });
        this.paletteGroup.add(b);
      });

      this.toolSlot = button(this, {
        x: x0 + 3 * (BTN_W + gap), y: PAL_Y + (BTN_H + gap) + BTN_H / 2,
        w: BTN_W, h: BTN_H, label: 'TOOL', sub: 'place', fontSize: 21,
        fill: C.paper2, stroke: C.ink,
        onClick: () => {
          const order = ['build', 'sell', 'repair'];
          this.setTool(order[(order.indexOf(this.tool) + 1) % order.length]);
        },
      });
      this.paletteGroup.add(this.toolSlot);
    }
  }

  buildActionBar() {
    const { W, isLandscape } = this.L;
    this.actionGroup = this.add.container(0, 0).setDepth(60);

    if (isLandscape) {
      const sx = 660, sy = 560, sw = 580, sh = 150;
      if (this.gameMode === 'chaos') {
        const btnW = (sw - 12) / 2;
        this.spinWheelBtn = button(this, {
          x: sx + btnW / 2, y: sy + 82, w: btnW, h: 90, label: 'WHEEL OF CHAOS',
          sub: `${this.chaosSpins || 0} spins left`, fontSize: 20, fill: C.lapis, stroke: C.ink,
          onClick: () => this.wheelOfChaos.open(),
        });
        this.startBtn = button(this, {
          x: sx + sw - btnW / 2, y: sy + 82, w: btnW, h: 90, label: 'START SIEGE',
          sub: 'the enemy is coming', fontSize: 24, fill: C.gold, stroke: C.ink,
          onClick: () => this.startSiege(),
        });
        this.actionGroup.add([this.spinWheelBtn, this.startBtn]);
      } else {
        this.spinWheelBtn = null;
        this.startBtn = button(this, {
          x: sx + sw / 2, y: sy + 82, w: sw, h: 90, label: 'START SIEGE',
          sub: 'the enemy is coming', fontSize: 32, fill: C.gold, stroke: C.ink,
          onClick: () => this.startSiege(),
        });
        this.actionGroup.add(this.startBtn);
      }

      this.aidBtn = button(this, {
        x: sx + sw / 2, y: sy + 82, w: sw, h: 90, label: 'ROYAL AID',
        sub: 'ready', fontSize: 32, fill: C.lapis, stroke: C.ink,
        onClick: () => this.armAid(),
      }).setVisible(false);
      this.actionGroup.add(this.aidBtn);

      this.siegeInfo = label(this.add, sx + 20, sy + 18, '', 17, C.paper, [0, 0.5]).setVisible(false);
      this.actionGroup.add(this.siegeInfo);

      this.hintText = this.add.text(sx + sw / 2, sy + 18, '', {
        fontFamily: FONT, fontSize: '13.5px', color: hex(C.gold), fontStyle: 'bold',
        align: 'center', wordWrap: { width: sw - 20 }, resolution: 2,
      }).setOrigin(0.5);
      this.actionGroup.add(this.hintText);
    } else {
      if (this.gameMode === 'chaos') {
        const btnW = 270;
        this.spinWheelBtn = button(this, {
          x: W / 2 - 142, y: ACT_Y + 76, w: btnW, h: 104, label: 'WHEEL OF CHAOS',
          sub: `${this.chaosSpins || 0} spins left`, fontSize: 21, fill: C.lapis, stroke: C.ink,
          onClick: () => this.wheelOfChaos.open(),
        });
        this.startBtn = button(this, {
          x: W / 2 + 142, y: ACT_Y + 76, w: btnW, h: 104, label: 'START SIEGE',
          sub: 'the enemy is coming', fontSize: 24, fill: C.gold, stroke: C.ink,
          onClick: () => this.startSiege(),
        });
        this.actionGroup.add([this.spinWheelBtn, this.startBtn]);
      } else {
        this.spinWheelBtn = null;
        this.startBtn = button(this, {
          x: W / 2, y: ACT_Y + 76, w: 560, h: 104, label: 'START SIEGE',
          sub: 'the enemy is coming', fontSize: 34, fill: C.gold, stroke: C.ink,
          onClick: () => this.startSiege(),
        });
        this.actionGroup.add(this.startBtn);
      }

      this.aidBtn = button(this, {
        x: W / 2, y: ACT_Y + 76, w: 560, h: 104, label: 'ROYAL AID',
        sub: 'ready', fontSize: 34, fill: C.lapis, stroke: C.ink,
        onClick: () => this.armAid(),
      }).setVisible(false);
      this.actionGroup.add(this.aidBtn);

      this.siegeInfo = label(this.add, 48, ACT_Y + 12, '', 18, C.paper, [0, 0.5]).setVisible(false);
      this.actionGroup.add(this.siegeInfo);

      this.hintText = this.add.text(W / 2, ACT_Y + 12, '', {
        fontFamily: FONT, fontSize: '14.5px', color: hex(C.gold), fontStyle: 'bold',
        align: 'center', wordWrap: { width: W - 40 }, resolution: 2,
      }).setOrigin(0.5);
      this.actionGroup.add(this.hintText);
    }
  }

  buildOverlays() {
    const { W, H, isLandscape } = this.L;
    this.toastLayer = this.add.container(0, 0).setDepth(500);

    const bannerX = isLandscape ? 336 : W / 2;
    const bannerY = isLandscape ? 366 : 470;
    this.banner = this.add.container(bannerX, bannerY).setDepth(520).setAlpha(0);
    this.bannerShadow = this.add.rectangle(8, 8, 620, 150, C.ink, 1);
    this.bannerPlate = this.add.rectangle(0, 0, 620, 150, C.paper, 1).setStrokeStyle(4, C.ink, 1);
    this.bannerTitle = displayLabel(this.add, 0, -26, '', 42, C.ink).setFontStyle('bold');
    this.bannerSub = label(this.add, 0, 30, '', 22, C.inkSoft);
    this.banner.add([this.bannerShadow, this.bannerPlate, this.bannerTitle, this.bannerSub]);

    this.overlay = this.add.container(0, 0).setDepth(600).setVisible(false);
    this.overlay.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));
    this.resultTitle = displayLabel(this.add, W / 2, isLandscape ? 150 : 300, '', 56, C.gold).setFontStyle('bold');
    this.resultBody = label(this.add, W / 2, isLandscape ? 230 : 400, '', 24, C.paper);
    this.resultStats = label(this.add, W / 2, isLandscape ? 330 : 520, '', 22, C.paper2);
    this.resultLegacy = displayLabel(this.add, W / 2, isLandscape ? 400 : 590, '', 26, C.gold);
    this.overlay.add([this.resultTitle, this.resultBody, this.resultStats, this.resultLegacy]);

    this.overlayBtnA = button(this, {
      x: W / 2, y: isLandscape ? 500 : 740, w: 520, h: isLandscape ? 90 : 116, label: 'REBUILD', fontSize: 36, fill: C.gold, stroke: C.ink,
      onClick: () => this.continueRun(),
    });
    this.overlayBtnB = button(this, {
      x: W / 2, y: isLandscape ? 610 : 880, w: 520, h: isLandscape ? 80 : 100, label: 'MAIN MENU', fontSize: 30,
      onClick: () => this.scene.start('menu'),
    });
    this.overlay.add([this.overlayBtnA, this.overlayBtnB]);

    this.exitConfirm = this.add.container(0, 0).setDepth(700).setVisible(false);
    this.exitConfirm.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));
    const exW = isLandscape ? 620 : 600;
    const exTop = isLandscape ? 168 : 428;
    const exBot = isLandscape ? 548 : 852;
    const exH = exBot - exTop;
    this.exitConfirm.add(this.add.rectangle(W / 2 + 8, exTop + exH / 2 + 8, exW, exH, C.ink, 1));
    this.exitConfirm.add(this.add.rectangle(W / 2, exTop + exH / 2, exW, exH, C.paper, 1).setStrokeStyle(4, C.ink, 1));
    this.exitConfirm.add(this.add.rectangle(W / 2, exTop + 6, exW - 24, 5, C.crimson, 1));
    this.exitConfirm.add(displayLabel(this.add, W / 2, isLandscape ? 232 : 492, 'ABANDON THIS CASTLE?', 34, C.ink).setFontStyle('bold'));
    this.exitConfirm.add(label(this.add, W / 2, isLandscape ? 286 : 544, 'Progress this run is lost.', 20, C.inkSoft));
    this.exitConfirm.add(button(this, {
      x: W / 2, y: isLandscape ? 380 : 660, w: 420, h: isLandscape ? 86 : 104, label: 'YES, LEAVE', fontSize: 30, fill: C.crimson, stroke: C.ink,
      onClick: () => { this.exitConfirm.setVisible(false); this.scene.start('menu'); },
    }));
    this.exitConfirm.add(button(this, {
      x: W / 2, y: isLandscape ? 490 : 790, w: 420, h: isLandscape ? 80 : 100, label: 'STAY', fontSize: 28,
      onClick: () => this.exitConfirm.setVisible(false),
    }));

    // Custom Repair Confirmation Modal
    this.repairConfirm = this.add.container(0, 0).setDepth(700).setVisible(false);
    this.repairConfirm.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));

    const cardW = isLandscape ? 480 : 580;
    const cardH = isLandscape ? 320 : 380;
    const cardY = isLandscape ? H / 2 : 620;
    this.repairConfirm.add(this.add.rectangle(W / 2 + 8, cardY + 8, cardW, cardH, C.ink, 1));
    this.repairConfirm.add(this.add.rectangle(W / 2, cardY, cardW, cardH, C.paper, 1).setStrokeStyle(4, C.ink, 1));
    this.repairConfirm.add(this.add.rectangle(W / 2, cardY - cardH / 2 + 6, cardW - 24, 5, C.crimson, 1));

    this.repairConfirmTitle = displayLabel(this.add, W / 2, cardY - (isLandscape ? 100 : 120), 'CONFIRM REPAIR', 28, C.ink).setFontStyle('bold');
    this.repairConfirmPiece = label(this.add, W / 2, cardY - (isLandscape ? 55 : 65), '', 22, C.ink).setFontStyle('bold');
    this.repairConfirmHp = label(this.add, W / 2, cardY - (isLandscape ? 15 : 20), '', 18, C.inkSoft);
    this.repairConfirmCost = label(this.add, W / 2, cardY + (isLandscape ? 25 : 30), '', 21, C.crimsonDeep).setFontStyle('bold');
    this.repairConfirm.add([this.repairConfirmTitle, this.repairConfirmPiece, this.repairConfirmHp, this.repairConfirmCost]);

    this.repairConfirmBtn = button(this, {
      x: W / 2 - (isLandscape ? 105 : 125), y: cardY + (isLandscape ? 90 : 110),
      w: isLandscape ? 190 : 220, h: isLandscape ? 62 : 72,
      label: 'REPAIR', fontSize: 22, fill: C.green, stroke: C.ink,
      onClick: () => this.executePendingRepair(),
    });
    this.repairCancelBtn = button(this, {
      x: W / 2 + (isLandscape ? 105 : 125), y: cardY + (isLandscape ? 90 : 110),
      w: isLandscape ? 190 : 220, h: isLandscape ? 62 : 72,
      label: 'CANCEL', fontSize: 22, fill: C.paper2, stroke: C.ink,
      onClick: () => this.cancelRepairConfirm(),
    });
    this.repairConfirm.add([this.repairConfirmBtn, this.repairCancelBtn]);

    // First-Time Architect Instructions Modal
    this.firstTimeModal = this.add.container(0, 0).setDepth(800).setVisible(false);
    this.firstTimeModal.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));

    const guideW = isLandscape ? 1040 : 660;
    const guideH = isLandscape ? 580 : 960;
    const guideY = H / 2;

    this.firstTimeModal.add(this.add.rectangle(W / 2 + 8, guideY + 8, guideW, guideH, C.ink, 1));
    this.firstTimeModal.add(this.add.rectangle(W / 2, guideY, guideW, guideH, C.paper, 1).setStrokeStyle(4, C.ink, 1));
    this.firstTimeModal.add(this.add.rectangle(W / 2, guideY - guideH / 2 + 6, guideW - 24, 5, C.crimson, 1));

    const titleY = isLandscape ? guideY - 240 : guideY - 420;
    const subY = isLandscape ? guideY - 200 : guideY - 375;
    this.firstTimeModal.add(displayLabel(this.add, W / 2, titleY, 'WELCOME, ARCHITECT!', isLandscape ? 34 : 32, C.ink).setFontStyle('bold'));
    this.firstTimeModal.add(label(this.add, W / 2, subY, '4 QUICK RULES TO SURVIVE THE SIEGE', isLandscape ? 18 : 17, C.crimsonDeep).setFontStyle('bold'));

    const steps = [
      { num: '1', title: 'PLACE YOUR KEEP (2×2)', desc: 'The Keep is your heart. Place it first on the lower grid. If your Keep falls, the realm falls!' },
      { num: '2', title: 'FORTIFY & SYNERGIZE', desc: 'Walls block enemies. Flank walls with walls to DOUBLE their HP! Place towers next to walls for bonus range.' },
      { num: '3', title: 'HOLD THE LINE', desc: 'Press START SIEGE when ready. Use ROYAL AID during battle to drop devastating lightning volleys on clusters.' },
      { num: '4', title: 'REPAIR & EXPAND', desc: 'Patch up damaged walls between sieges. Clear waves to earn gold and spend legacy in the Workshop.' },
    ];

    if (isLandscape) {
      steps.forEach((st, i) => {
        const col = i % 2;
        const row = (i / 2) | 0;
        const cx = W / 2 + (col === 0 ? -245 : 245);
        const cy = guideY - 110 + row * 130;
        const cardPlate = this.add.rectangle(cx + 6, cy + 6, 470, 115, C.ink, 1);
        const cardPlateFace = this.add.rectangle(cx, cy, 470, 115, C.paper2, 1).setStrokeStyle(3, C.ink, 1);
        const circle = this.add.circle(cx - 195, cy, 22, C.crimson).setStrokeStyle(3, C.ink, 1);
        const numTxt = label(this.add, cx - 195, cy, st.num, 20, C.white).setFontStyle('bold');
        const titTxt = label(this.add, cx - 155, cy - 24, st.title, 17, C.ink, [0, 0.5]).setFontStyle('bold');
        const descTxt = this.add.text(cx - 155, cy + 14, st.desc, {
          fontFamily: FONT, fontSize: '13.5px', color: hex(C.inkSoft),
          wordWrap: { width: 330 }, lineSpacing: 2, resolution: 2,
        }).setOrigin(0, 0.5);
        this.firstTimeModal.add([cardPlate, cardPlateFace, circle, numTxt, titTxt, descTxt]);
      });

      const ctrlTxt = label(this.add, W / 2, guideY + 155,
        'CONTROLS: Mouse/Touch to build · F6 cycles buttons · Enter activates · Keys 1-7 pick piece · Space place · R repair · X sell · Esc menu', 14, C.crimsonDeep);
      this.firstTimeModal.add(ctrlTxt);

      const gotItBtn = button(this, {
        x: W / 2, y: guideY + 225, w: 320, h: 64, label: 'START BUILDING', fontSize: 24,
        fill: C.gold, stroke: C.ink,
        onClick: () => this.closeFirstTimeGuide(),
      });
      this.firstTimeModal.add(gotItBtn);
    } else {
      steps.forEach((st, i) => {
        const cx = W / 2;
        const cy = guideY - 265 + i * 135;
        const cardPlate = this.add.rectangle(cx + 6, cy + 6, 600, 120, C.ink, 1);
        const cardPlateFace = this.add.rectangle(cx, cy, 600, 120, C.paper2, 1).setStrokeStyle(3, C.ink, 1);
        const circle = this.add.circle(cx - 245, cy, 24, C.crimson).setStrokeStyle(3, C.ink, 1);
        const numTxt = label(this.add, cx - 245, cy, st.num, 22, C.white).setFontStyle('bold');
        const titTxt = label(this.add, cx - 205, cy - 24, st.title, 19, C.ink, [0, 0.5]).setFontStyle('bold');
        const descTxt = this.add.text(cx - 205, cy + 16, st.desc, {
          fontFamily: FONT, fontSize: '14px', color: hex(C.inkSoft),
          wordWrap: { width: 430 }, lineSpacing: 2, resolution: 2,
        }).setOrigin(0, 0.5);
        this.firstTimeModal.add([cardPlate, cardPlateFace, circle, numTxt, titTxt, descTxt]);
      });

      const ctrlTxt = label(this.add, W / 2, guideY + 310,
        'Mouse/Touch · F6 buttons · Enter activate · 1-7 pick · Space place · R repair · X sell · Esc menu', 15, C.crimsonDeep);
      this.firstTimeModal.add(ctrlTxt);

      const gotItBtn = button(this, {
        x: W / 2, y: guideY + 395, w: 420, h: 84, label: 'START BUILDING', fontSize: 28,
        fill: C.gold, stroke: C.ink,
        onClick: () => this.closeFirstTimeGuide(),
      });
      this.firstTimeModal.add(gotItBtn);
    }

    // God Mode Cheat Console (Konami Code)
    this.godModeModal = this.add.container(0, 0).setDepth(900).setVisible(false);
    this.godModeModal.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));

    const godW = isLandscape ? 740 : 640;
    const godH = isLandscape ? 490 : 720;
    this.godModeModal.add(this.add.rectangle(W / 2 + 8, H / 2 + 8, godW, godH, C.ink, 1));
    this.godModeModal.add(this.add.rectangle(W / 2, H / 2, godW, godH, C.paper, 1).setStrokeStyle(4, C.ink, 1));
    this.godModeModal.add(this.add.rectangle(W / 2, H / 2 - godH / 2 + 6, godW - 24, 5, C.crimson, 1));
    this.godModeModal.add(displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 195 : 300), '👑 GOD MODE CONSOLE 👑', 28, C.ink).setFontStyle('bold'));
    this.godModeModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 155 : 260), 'DEV CHEAT MENU (KONAMI CODE UNLOCKED)', 15, C.crimsonDeep));

    const godActions = [
      { label: '+1000 GOLD', sub: 'instant treasury', fill: C.gold, stroke: C.ink, act: () => { this.gold += 1000; this.refreshHUD(); SFX.gold(); toast(this, W / 2, 400, '+1000 Gold Added!', hex(C.gold), 24); } },
      { label: '+500 LEGACY', sub: 'workshop funds', fill: C.lapis, stroke: C.ink, act: () => { const s = loadSave(); s.legacy += 500; writeSave(); SFX.gold(); toast(this, W / 2, 400, '+500 Legacy Added!', hex(C.gold), 24); } },
      { label: 'NUKE FOES', sub: 'kill active wave', fill: C.crimson, stroke: C.ink, act: () => { for (const e of [...this.enemies]) e.die('nuke'); SFX.boom(); toast(this, W / 2, 400, 'All Foes Obliterated!', hex(C.crimson), 24); } },
      { label: 'HEAL KEEP', sub: 'restore 100% HP', fill: C.green, stroke: C.ink, act: () => { if (this.keep) { this.keep.heal(this.keep.maxHp); this.refreshHUD(); SFX.repair(); toast(this, W / 2, 400, 'Keep Fully Restored!', hex(C.green), 24); } } },
      { label: 'UNLOCK ALL', sub: 'all modes & pieces', fill: C.lapis, stroke: C.ink, act: () => { const s = loadSave(); s.storyCompleted = true; s.unlockedModes = { story: true, survival: true, chaos: true }; s.totalWaves = 20; writeSave(); SFX.synergy(); toast(this, W / 2, 400, 'All Modes & Content Unlocked!', hex(C.green), 24); } },
      { label: '5x SPEED', sub: 'overdrive toggle', fill: C.gold, stroke: C.ink, act: () => { this.speedMultiplier = this.speedMultiplier === 5 ? 1 : 5; this.speedBtn.label.setText(`» ${this.speedMultiplier}X`); toast(this, W / 2, 400, `Speed Set to ${this.speedMultiplier}x!`, hex(C.gold), 24); } },
    ];

    if (isLandscape) {
      godActions.forEach((ga, i) => {
        const col = i % 3, row = (i / 3) | 0;
        const gx = W / 2 - 210 + col * 210;
        const gy = H / 2 - 70 + row * 95;
        this.godModeModal.add(button(this, {
          x: gx, y: gy, w: 195, h: 72, label: ga.label, sub: ga.sub, fontSize: 18,
          fill: ga.fill, stroke: ga.stroke, onClick: ga.act,
        }));
      });
      this.godModeModal.add(button(this, {
        x: W / 2, y: H / 2 + 180, w: 240, h: 58, label: '✕', fontSize: 34,
        onClick: () => this.closeGodMode(),
      }));
    } else {
      godActions.forEach((ga, i) => {
        const col = i % 2, row = (i / 2) | 0;
        const gx = W / 2 - 135 + col * 270;
        const gy = H / 2 - 160 + row * 105;
        this.godModeModal.add(button(this, {
          x: gx, y: gy, w: 250, h: 84, label: ga.label, sub: ga.sub, fontSize: 20,
          fill: ga.fill, stroke: ga.stroke, onClick: ga.act,
        }));
      });
      this.godModeModal.add(button(this, {
        x: W / 2, y: H / 2 + 250, w: 300, h: 74, label: '✕', fontSize: 40,
        onClick: () => this.closeGodMode(),
      }));
    }

    // Story Mode Victory Ending Modal
    this.storyVictoryModal = this.add.container(0, 0).setDepth(850).setVisible(false);
    this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));

    const vicW = isLandscape ? 820 : 660;
    const vicH = isLandscape ? 520 : 800;
    this.storyVictoryModal.add(this.add.rectangle(W / 2 + 8, H / 2 + 8, vicW, vicH, C.ink, 1));
    this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2, vicW, vicH, C.paper, 1).setStrokeStyle(4, C.ink, 1));
    this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2 - vicH / 2 + 6, vicW - 24, 5, C.crimson, 1));

    this.storyVictoryModal.add(displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 190 : 280), 'VICTORY — REALM LIBERATED!', isLandscape ? 34 : 30, C.ink).setFontStyle('bold'));
    this.storyVictoryModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 140 : 220), 'The High Warlord has fallen. The Mad King awards you the Crown!', isLandscape ? 18 : 16, C.inkSoft).setFontStyle('bold'));

    const unlPlate = this.add.rectangle(W / 2, H / 2 - (isLandscape ? 30 : 60), vicW - 80, isLandscape ? 140 : 200, C.paper2, 1).setStrokeStyle(3, C.ink, 1);
    const unlT1 = displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 70 : 120), '🏆 NEW MODES UNLOCKED 🏆', 22, C.crimsonDeep).setFontStyle('bold');
    const unlT2 = label(this.add, W / 2, H / 2 - (isLandscape ? 35 : 65), '⚔️ SURVIVAL MODE: Endless escalating sieges + Fast-Forward', 16, C.ink);
    const unlT3 = label(this.add, W / 2, H / 2 + (isLandscape ? 0 : -10), '🎲 CHAOS MODE: Wild draft rules & randomized mutators', 16, C.ink);
    this.storyVictoryModal.add([unlPlate, unlT1, unlT2, unlT3]);

    this.storyVictoryModal.add(button(this, {
      x: W / 2 - (isLandscape ? 160 : 0), y: H / 2 + (isLandscape ? 150 : 160),
      w: isLandscape ? 280 : 420, h: isLandscape ? 72 : 84,
      label: 'PLAY SURVIVAL', fontSize: 24, fill: C.gold, stroke: C.ink,
      onClick: () => {
        this.storyVictoryModal.setVisible(false);
        this.scene.start('game', { fresh: true, mode: 'survival' });
      },
    }));

    this.storyVictoryModal.add(button(this, {
      x: W / 2 + (isLandscape ? 160 : 0), y: H / 2 + (isLandscape ? 150 : 260),
      w: isLandscape ? 280 : 420, h: isLandscape ? 72 : 84,
      label: 'MAIN MENU', fontSize: 24, fill: C.paper2, stroke: C.ink,
      onClick: () => {
        this.storyVictoryModal.setVisible(false);
        this.scene.start('menu');
      },
    }));

    // Troll Punishment Modal (Mad King Cheat Detector / Greed Trap)
    this.trollModal = this.add.container(0, 0).setDepth(950).setVisible(false);
    this.trollModal.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));

    const trW = isLandscape ? 780 : 640;
    const trH = isLandscape ? 490 : 680;
    this.trollModal.add(this.add.rectangle(W / 2 + 8, H / 2 + 8, trW, trH, C.ink, 1));
    this.trollModal.add(this.add.rectangle(W / 2, H / 2, trW, trH, C.paper, 1).setStrokeStyle(4, C.crimson, 1));
    this.trollModal.add(this.add.rectangle(W / 2, H / 2 - trH / 2 + 5, trW - 24, 5, C.crimson, 1));

    this.trollTitle = displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 175 : 250), '🤡 HAHAHAHA! CHEATER! 🤡', isLandscape ? 32 : 28, C.ink).setFontStyle('bold');
    this.trollSub = label(this.add, W / 2, H / 2 - (isLandscape ? 125 : 190), 'THE MAD KING CAUGHT YOU IN THE ACT!', isLandscape ? 17 : 16, C.crimsonDeep).setFontStyle('bold');
    this.trollBody = this.add.text(W / 2, H / 2 - (isLandscape ? 15 : 45), '', {
      fontFamily: FONT, fontSize: isLandscape ? '16px' : '17px', color: hex(C.inkSoft),
      align: 'center', wordWrap: { width: trW - 60 }, lineSpacing: 6, resolution: 2,
    }).setOrigin(0.5);

    this.trollModal.add([this.trollTitle, this.trollSub, this.trollBody]);

    this.trollModal.add(button(this, {
      x: W / 2, y: H / 2 + (isLandscape ? 160 : 225), w: 340, h: isLandscape ? 66 : 80,
      label: 'BEG FOR MERCY', fontSize: 24, fill: C.crimson, stroke: C.ink,
      onClick: () => {
        this.trollModal.setVisible(false);
        this.scene.start('menu');
      },
    }));
  }

  handleKonamiCode() {
    const s = loadSave();
    const { W } = this.L;

    if (s.konamiDisabled || (s.konamiTotalUses || 0) >= 20) {
      SFX.deny();
      toast(this, W / 2, 360, '🚫 THE ANCIENT CODE IS EXHAUSTED (20/20 uses limit reached)!', hex(C.crimson), 24);
      return;
    }

    s.konamiTotalUses = (s.konamiTotalUses || 0) + 1;
    if (s.konamiTotalUses >= 20) s.konamiDisabled = true;
    writeSave();

    if (this.gameMode === 'story') {
      this.triggerTrollPunishment('story');
      return;
    }

    this.runKonamiUses = (this.runKonamiUses || 0) + 1;
    if (this.runKonamiUses > 3) {
      this.triggerTrollPunishment('greed');
      return;
    }

    this.openGodMode();
  }

  triggerTrollPunishment(type) {
    SFX.lose();
    SFX.boom();
    this.shake(0.8, 0.025);

    // Explode all placed structures into rubble
    for (const b of [...this.buildings]) {
      this.rubbleBurst(b.x, b.y, b.key);
      b.destroy();
    }
    this.buildings = [];
    this.grid.fill(null);
    this.keep = null;
    this.gold = 0;
    this.wave = 1;
    this.wavesCleared = 0;
    this.refreshHUD();

    // WIPE ENTIRE GAME PROGRESS (Save data, legacy, workshop upgrades, unlocks, records)
    resetSave(true);

    if (type === 'story') {
      this.trollTitle.setText('🤡 HAHAHAHA! CHEATER! 🤡');
      this.trollSub.setText('THE MAD KING CAUGHT YOU IN THE ACT!');
      this.trollBody.setText(
        '“Did you truly believe you could deceive the Royal Court with cheap mortal incantations?!”\n\n' +
        'The Mad King is laughing hysterically on his throne.\n' +
        'Your gold is gone, your Workshop upgrades demolished, and your ENTIRE save file wiped clean!'
      );
    } else {
      this.trollTitle.setText('💀 GREED HAS CONSUMED YOU! 💀');
      this.trollSub.setText('EXCEEDED THE 3-WISH THRESHOLD!');
      this.trollBody.setText(
        '“Three divine boons were permitted. On the 4th, the ancient gods grew wrathful!”\n\n' +
        'Your excessive reliance on the cheat console triggered a cataclysmic rift.\n' +
        'Your entire game save and treasury have been incinerated!'
      );
    }
    this.trollModal.setVisible(true);
  }

  toggleSpeed() {
    const speeds = [1, 2, 3];
    const nextIdx = (speeds.indexOf(this.speedMultiplier) + 1) % speeds.length;
    this.speedMultiplier = speeds[nextIdx];
    this.speedBtn.label.setText(`» ${this.speedMultiplier}X`);
    SFX.tap();
  }

  moveKeep() {
    if (!this.keep || this.keep.dead || this.phase !== 'build') { SFX.deny(); return; }
    const oldKeep = this.keep;
    this.removeBuilding(oldKeep, false);
    this.keep = null;
    this.selected = 'keep';
    this.tool = 'build';
    const { W } = this.L;
    toast(this, W / 2, 600, 'Tap lower board to relocate Keep', hex(C.gold), 24);
    SFX.place();
    this.refreshHUD();
    this.refreshPalette();
    this.refreshInfo();
  }

  upgradeSelectedBuilding() {
    let target = null;
    if (this.hover) target = this.grid[this.hover.cy * GRID + this.hover.cx];
    if (!target && this.cursor) target = this.grid[this.cursor.cy * GRID + this.cursor.cx];
    if (!target) {
      target = this.buildings.find(b => b.tier < 2 && UPGRADED_BUILDINGS[b.key]);
    }
    const { W } = this.L;
    if (!target || target.tier >= 2 || !UPGRADED_BUILDINGS[target.key]) {
      SFX.deny();
      toast(this, W / 2, 600, 'Tap a piece on the board to upgrade', hex(C.paper2), 22);
      return;
    }
    const upDef = UPGRADED_BUILDINGS[target.key];
    if (this.gold < upDef.cost) {
      SFX.deny();
      toast(this, target.x, target.y - 45, `Needs ${upDef.cost}g to upgrade`, hex(C.crimson), 22);
      return;
    }
    this.gold -= upDef.cost;
    target.upgradeToTier2(upDef);
    SFX.repair();
    this.fx.burst(target.x, target.y, C.gold, 20, { speed: 140, life: 500 });
    toast(this, target.x, target.y - 45, `${upDef.name.toUpperCase()} (+${upDef.hp - target.def.hp} HP)!`, hex(C.gold), 24);
    this.refreshHUD();
    this.refreshPalette();
    this.refreshInfo();
  }

  openGodMode() {
    const s = loadSave();
    this.godModeModal.setVisible(true);
    SFX.synergy();
    const { W } = this.L;
    toast(this, W / 2, 300, `👑 GOD MODE UNLOCKED (${this.runKonamiUses}/3 run uses | ${s.konamiTotalUses}/20 total)`, hex(C.gold), 24);
  }

  closeGodMode() {
    this.godModeModal.setVisible(false);
    SFX.tap();
  }

  storyVictory() {
    const s = loadSave();
    s.storyCompleted = true;
    s.unlockedModes = s.unlockedModes || {};
    s.unlockedModes.survival = true;
    s.unlockedModes.chaos = true;
    writeSave();
    this.storyVictoryModal.setVisible(true);
    SFX.win();
  }

  confirmExit() {
    if (this.phase === 'build' && this.wavesCleared === 0 && this.placeCount === 0) {
      this.scene.start('menu');
      return;
    }
    this.exitConfirm.setVisible(true);
    SFX.tap();
  }

  // ------------------------------------------------------------------ tutorial
  showTutorial() {
    const s = loadSave();
    if (!s.hasSeenFirstTimeGuide) {
      this.firstTimeModal.setVisible(true);
      SFX.tap();
    }
    this.tutorialStep = 0;
    this.updateHint();
  }

  closeFirstTimeGuide() {
    const s = loadSave();
    s.hasSeenFirstTimeGuide = true;
    writeSave();
    this.firstTimeModal.setVisible(false);
    SFX.place();
    this.updateHint();
  }

  pulseRitualGlow() {
    if (!this.ritualOverlay) return;
    this.ritualOverlay.setVisible(true).setAlpha(0);
    this.tweens.killTweensOf(this.ritualOverlay);
    this.tweens.add({
      targets: this.ritualOverlay,
      alpha: { from: 0, to: 0.85 },
      duration: 550,
      yoyo: true,
      repeat: 2, // 3 pulses total
      ease: 'Sine.InOut',
      onComplete: () => {
        if (this.ritualOverlay) this.ritualOverlay.setVisible(false).setAlpha(0);
      },
    });
  }

  updateHint() {
    if (this.gameMode === 'story' && this.wave === 10) {
      if (!this.pulsedWave10) {
        this.pulsedWave10 = true;
        this.pulseRitualGlow();
      }
    } else {
      this.pulsedWave10 = false;
      if (this.ritualOverlay && !this.tweens.isTweening(this.ritualOverlay)) {
        this.ritualOverlay.setVisible(false).setAlpha(0);
      }
    }
    if (this.phase !== 'build') { this.hintText.setText(''); return; }
    if (this.hintLockUntil && this.now() < this.hintLockUntil) return;
    const s = loadSave();
    let msg;
    if (!this.keep) {
      msg = '1 · pick KEEP, then tap the lower grid';
    } else if (this.gameMode === 'story' && DECREES[this.wave]) {
      const dec = DECREES[this.wave];
      msg = dec.hint ? `👑 ${dec.title}: ${dec.hint}` : '';
    } else if (this.placeCount < 3) {
      msg = '2 · add walls and towers — tap a piece, tap a square';
    } else if (!s.seenTutorial) {
      msg = '3 · press START SIEGE and watch what they break';
    } else {
      msg = this.gameMode === 'survival' ? `Endless Survival · Wave ${this.wave} · Speed Toggle Available` : 'Fortify your castle for the siege';
    }
    this.hintText.setText(msg);
  }

  // ------------------------------------------------------------------- helpers
  baseMaxHp(key) {
    const def = BUILDINGS[key];
    let m = def.hp;
    if (key === 'wall') m *= 1 + 0.2 * upgradeLevel('masonry');
    if (key === 'keep') m *= 1 + 0.25 * upgradeLevel('bulwark');
    if (key === 'tower' || key === 'cannon' || key === 'keep') m *= 1; // (damage upgrades live elsewhere)
    return Math.round(m);
  }

  pieceLimit() {
    const base = Math.min(
      DIFFICULTY_CONFIG.maxPieceLimitCap,
      DIFFICULTY_CONFIG.basePieceLimit + this.wavesCleared * DIFFICULTY_CONFIG.pieceLimitGainPerWave
    );
    return base + (this.purchasedPlacementSlots || 0);
  }

  buyExtraPlacementSlot() {
    const cost = 1000;
    if (this.gold < cost) {
      SFX.deny();
      toast(this, this.L.W / 2, 400, 'Need 1,000 Gold to Expand Placement!', hex(C.crimson), 22);
      return;
    }
    this.gold -= cost;
    this.purchasedPlacementSlots = (this.purchasedPlacementSlots || 0) + 1;
    SFX.gold();
    SFX.upgrade();
    this.fx.ring(this.L.W / 2, 400, C.gold, 220);
    this.fx.burst(this.L.W / 2, 400, C.gold, 16, { speed: 180, life: 400 });
    toast(this, this.L.W / 2, 400, `🏰 CASTLE EXPANDED! Capacity is now ${this.pieceLimit()} pieces!`, hex(C.green), 24);
    this.refreshHUD();
    this.refreshPaletteCounts();
  }

  countPieces() {
    return this.buildings.length;
  }

  neighboursOf(b) {
    const out = new Set();
    for (const c of b.cells) {
      const cx = c % GRID, cy = (c / GRID) | 0;
      for (const [dx, dy] of DIR4) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        const nb = this.grid[ny * GRID + nx];
        if (nb && nb !== b) out.add(nb);
      }
    }
    return [...out];
  }

  recomputeGoals() {
    this.goalAll = [];
    this.goalFree = [];
    if (!this.keep || this.keep.dead) {
      this.goalAllSet = new Set();
      this.goalFreeSet = new Set();
      return;
    }
    const seen = new Set();
    for (const c of this.keep.cells) {
      const cx = c % GRID, cy = (c / GRID) | 0;
      for (const [dx, dy] of DIR4) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
        const i = ny * GRID + nx;
        if (seen.has(i)) continue;
        seen.add(i);
        this.goalAll.push(i);
        const b = this.grid[i];
        if (!b || b.def.walkable) this.goalFree.push(i);
      }
    }
    this.goalAllSet = new Set(this.goalAll);
    this.goalFreeSet = new Set(this.goalFree);
  }

  evaluateSynergies(announce = true) {
    this.recomputeGoals();
    const newly = [];
    for (const b of this.buildings) {
      const nb = this.neighboursOf(b);
      const walls = nb.filter((n) => n.key === 'wall');

      if (b.key === 'wall') {
        const want = walls.length >= 2;
        if (want !== b.reinforced) {
          b.reinforced = want;
          if (want) newly.push(b);
        }
        const base = this.baseMaxHp('wall');
        b.maxHp = want ? base * 2 : base;
        b.hp = Math.min(b.hp, b.maxHp);
        b.refreshTexture();
        b.updateHpBar();
      }

      if (b.key === 'tower') {
        const want = walls.length >= 1;
        if (want !== b.braced) { b.braced = want; if (want) newly.push(b); }
        b.rangeMul = want ? 1.3 : 1;
        b.rateMul = want ? 0.77 : 1;
      }

      if (b.key === 'cannon') {
        const want = nb.some((n) => n.key === 'wall' || n.key === 'tower');
        if (want !== b.emplaced) { b.emplaced = want; if (want) newly.push(b); }
        b.refreshTexture();
      }

      if (b.key === 'keep') {
        const want = walls.length >= 2;
        if (want !== b.plated) { b.plated = want; if (want) newly.push(b); }
        const base = this.baseMaxHp('keep');
        b.maxHp = want ? Math.round(base * 1.3) : base;
        b.hp = Math.min(b.hp, b.maxHp);
        b.updateHpBar();
      }
    }

    // last stand is a global state, not a per-piece flag
    if (this.keep && !this.keep.dead) {
      const low = this.keep.hp / this.keep.maxHp < 0.35;
      if (low && !this.lastStand) {
        this.lastStand = true;
        newly.push({ synergyKey: 'laststand', x: this.keep.x, y: this.keep.y });
      } else if (!low) this.lastStand = false;
    }

    if (announce && newly.length) {
      for (const b of newly) this.announceSynergy(b);
    }
  }

  announceSynergy(b) {
    const map = { wall: 'chain', tower: 'embrasure', cannon: 'mount', keep: 'heartwall' };
    const key = b.synergyKey || map[b.key];
    if (!key) return;
    this.fireSynergy(key, b.x ?? (this.keep ? this.keep.x : W / 2), b.y ?? (this.keep ? this.keep.y : 600));
  }

  fireSynergy(key, x, y) {
    if (this.seenThisRun[key]) return;
    this.seenThisRun[key] = true;
    const info = SYNERGIES[key];
    if (!info) return;
    const times = recordDiscovered(key);
    toast(this, x, y - 60, info.name, hex(C.gold), 24);
    SFX.synergy();
    if (times === 1) {
      // the explainer rides the hint line at the bottom, clear of the castle
      const token = (this.hintToken = {});
      this.hintLockUntil = this.now() + 3800;
      this.hintText.setText(info.text).setColor(hex(C.gold));
      this.time.delayedCall(3800, () => {
        if (this.hintToken !== token) return;
        this.hintToken = null;
        this.hintLockUntil = 0;
        this.hintText.setColor(hex(C.paper2)).setAlpha(0.65);
        this.updateHint();
      });
    }
  }

  // ------------------------------------------------------------------ palette
  selectPiece(key) {
    const def = BUILDINGS[key];
    if (unlockedBuildings(this.wave) < def.unlockAt) { SFX.deny(); return; }
    this.tool = 'build';
    this.selected = key;
    SFX.tap();
    this.refreshPalette();
    this.refreshInfo();
  }

  setTool(t) {
    this.tool = t;
    SFX.tap();
    this.refreshPalette();
    this.refreshInfo();
  }

  refreshPalette() {
    const unlocked = unlockedBuildings(this.wave);
    for (const slot of this.paletteSlots) {
      const def = BUILDINGS[slot.key];
      const isUnlocked = unlocked >= def.unlockAt;
      const selected = this.tool === 'build' && this.selected === slot.key;
      slot.btn.setEnabled(isUnlocked);
      slot.btn.setBase({ stroke: selected ? C.crimson : (isUnlocked ? C.ink : C.rule) });
      if (!isUnlocked) {
        slot.btn.label.setText('LOCKED');
        if (slot.btn.subLabel) slot.btn.subLabel.setText(`siege ${def.unlockAt}`);
      } else {
        slot.btn.label.setText(def.name);
        if (this.gameMode === 'chaos') {
          const qty = slot.key === 'keep' ? 'free' : `x${this.chaosInventory[slot.key] || 0}`;
          if (slot.btn.subLabel) slot.btn.subLabel.setText(qty);
          if (slot.key !== 'keep' && (this.chaosInventory[slot.key] || 0) === 0) {
            slot.btn.plate.setAlpha(0.65);
          } else {
            slot.btn.plate.setAlpha(1);
          }
        } else {
          if (slot.btn.subLabel) slot.btn.subLabel.setText(slot.key === 'keep' ? 'free' : `${def.cost}g`);
        }
      }
    }
    const toolNames = { build: 'place', sell: this.gameMode === 'chaos' ? 'recycle' : `sell ${Math.round(ECONOMY_CONFIG.sellRefundRatio * 100)}%`, repair: 'patch up' };
    const toolFill = { build: C.paper2, sell: C.crimson, repair: C.green };
    this.toolSlot.label.setText(this.tool === 'build' ? 'TOOL' : this.tool.toUpperCase());
    if (this.toolSlot.subLabel) this.toolSlot.subLabel.setText(toolNames[this.tool]);
    this.toolSlot.setBase({ fill: toolFill[this.tool], stroke: C.ink });
    const isBuildPhase = this.phase === 'build';
    this.sellBtn.setEnabled(isBuildPhase);
    this.repairBtn.setEnabled(isBuildPhase);

    const isSelling = this.tool === 'sell';
    const isRepairing = this.tool === 'repair';
    this.sellBtn.setBase({ fill: isSelling ? C.ink : C.crimson, stroke: C.ink });
    this.repairBtn.setBase({ fill: isRepairing ? C.ink : C.green, stroke: C.ink });
  }

  refreshPaletteCounts() {
    this.refreshPalette();
    if (this.spinWheelBtn && this.spinWheelBtn.subLabel) {
      this.spinWheelBtn.subLabel.setText(`${this.chaosSpins || 0} spins left`);
    }
  }

  refreshInfo() {
    if (this.phase !== 'build') {
      this.infoTitle.setText(this.waveDef ? `SIEGE ${this.wave} · ${this.waveDef.label}` : '');
      this.infoBody.setText('Tap ROYAL AID, then tap the field to call a volley.');
      return;
    }
    if (this.tool === 'sell') {
      this.infoTitle.setText('SELL MODE');
      this.infoBody.setText(this.gameMode === 'chaos' ? 'Tap a placed piece to recycle it back into your Chaos Reserve.' : `Tap a piece to tear it down. ${Math.round(ECONOMY_CONFIG.sellRefundRatio * 100)}% of the gold comes back.`);
      return;
    }
    if (this.tool === 'repair') {
      this.infoTitle.setText('REPAIR MODE');
      this.infoBody.setText('Tap a damaged piece to check cost and confirm repair.');
      return;
    }
    const def = BUILDINGS[this.selected];
    if (this.gameMode === 'chaos') {
      const count = this.selected === 'keep' ? '1' : (this.chaosInventory[this.selected] || 0);
      this.infoTitle.setText(`${def.name} — ${count} in Reserve`);
      this.infoBody.setText(`${def.blurb} (Drafted from Wheel of Chaos)`);
    } else {
      this.infoTitle.setText(`${def.name} — ${def.cost} gold`);
      this.infoBody.setText(def.blurb);
    }
  }

  // --------------------------------------------------------------------- HUD
  refreshHUD() {
    this.goldText.setText(`${Math.floor(this.gold)}`);
    const k = this.keep;
    const { isLandscape, W } = this.L;
    const barWidth = isLandscape ? (580 - 140) : (W - 170);

    if (k && !k.dead) {
      const r = Math.max(0, k.hp / k.maxHp);
      this.keepBarFg.setSize(Math.max(1, barWidth * r), 14);
      this.keepBarFg.setFillStyle(r > 0.55 ? C.green : r > 0.25 ? C.gold : C.red, 1);
      this.keepBarText.setText(`${Math.ceil(k.hp)}`);
      this.keepBarText.setColor(hex(C.ink));
      setMusicState(r < 0.2 ? 'critical' : r < 0.5 ? 'low' : 'calm');
    } else {
      this.keepBarFg.setSize(1, 14);
      this.keepBarText.setText('');
      // Keep destroyed (or not placed yet): hold the darkest track through
      // the results screen, calm when there is simply no Keep on the board.
      setMusicState(k && k.dead ? 'critical' : 'calm');
    }
    this.statusText.setText(`PIECES ${this.countPieces()}/${this.pieceLimit()}`);
    if (this.expandSlotBtn) {
      this.expandSlotBtn.setVisible(this.phase === 'build');
    }
    if (this.phase === 'build') {
      this.waveText.setText(`SIEGE ${this.wave}`);
      this.statusRight.setText(`cleared ${this.wavesCleared}`);
      this.startBtn.setEnabled(!!this.keep && this.keep.dead === false);
      if (this.keep && !this.keep.dead) this.startBtn.label.setText('START SIEGE');
      else this.startBtn.label.setText('PLACE YOUR KEEP');
    } else if (this.phase === 'siege') {
      this.waveText.setText(`SIEGE ${this.wave} · ${this.waveDef.label}`);
      this.statusRight.setText(this.aidCooldown > 0 ? `aid ${this.aidCooldown.toFixed(1)}s` : 'aid ready');
      this.refreshSiegePanel();
    }
  }

  // --------------------------------------------------------------- build input
  cellFromPointer(p) {
    const x = p.x - BOARD_X;
    const y = p.y - BOARD_Y;
    if (x < 0 || y < 0 || x >= GRID * CELL || y >= GRID * CELL) return null;
    return { cx: (x / CELL) | 0, cy: (y / CELL) | 0 };
  }

  onBoardMove(p) {
    const c = this.cellFromPointer(p);
    this.hover = c;
    if (!c) { this.ghost.setVisible(false); this.rangeRing.setVisible(false); return; }
    if (this.phase === 'siege' && this.aidArmed) {
      this.ghost.setPosition(...this.centerOf(c.cx, c.cy)).setVisible(true).setFillStyle(C.gold, 0.25);
      return;
    }
    if (this.phase !== 'build') { this.ghost.setVisible(false); return; }
    this.updateGhost(c.cx, c.cy);
  }

  centerOf(cx, cy) {
    return [BOARD_X + cx * CELL + CELL / 2, BOARD_Y + cy * CELL + CELL / 2];
  }

  updateGhost(cx, cy) {
    const [x, y] = this.centerOf(cx, cy);
    this.ghost.setVisible(true).setFillStyle(C.white, 0.16);
    this.rangeRing.setVisible(false);
    if (this.tool !== 'build') {
      const b = this.grid[cy * GRID + cx];
      this.ghost.setPosition(x, y);
      this.ghost.setSize(CELL, CELL);
      if (b) {
        if (this.tool === 'repair') {
          const isDamaged = b.hp < b.maxHp;
          const cost = isDamaged ? Math.max(1, Math.round((b.maxHp - b.hp) * ECONOMY_CONFIG.repairCostPerMissingHp)) : 0;
          this.ghost.setFillStyle(isDamaged ? C.green : C.stone, 0.25);
          this.infoTitle.setText(`${b.def.name.toUpperCase()} · ${Math.ceil(b.hp)}/${b.maxHp} HP`);
          this.infoBody.setText(isDamaged ? `Tap to repair for ${cost} gold` : 'Structure is at full health');
        } else {
          this.ghost.setFillStyle(C.red, 0.25);
          const back = Math.round(b.def.cost * ECONOMY_CONFIG.sellRefundRatio);
          this.infoTitle.setText(`SELL ${b.def.name.toUpperCase()}`);
          this.infoBody.setText(b.key === 'keep' ? 'The Keep cannot be sold' : `Tap to sell for +${back} gold (${Math.round(ECONOMY_CONFIG.sellRefundRatio * 100)}% refund)`);
        }
        if (b.def.range) {
          const r = b.def.range * (b.rangeMul || 1);
          this.rangeRing.setPosition(b.x, b.y).setRadius(r).setVisible(true);
        }
      } else {
        if (this.tool === 'repair') {
          this.infoTitle.setText('REPAIR MODE');
          this.infoBody.setText('Tap any damaged piece to inspect cost & confirm repair.');
        } else {
          this.infoTitle.setText('SELL MODE');
          this.infoBody.setText('Tap a piece to tear it down. Half the gold comes back.');
        }
      }
      return;
    }
    const def = BUILDINGS[this.selected];
    const size = this.selected === 'keep' ? 2 : 1;
    this.ghost.setSize(CELL * size, CELL * size);
    this.ghost.setPosition(x + (size - 1) * CELL / 2, y + (size - 1) * CELL / 2);
    const ok = this.canPlace(this.selected, cx, cy).ok;
    this.ghost.setFillStyle(ok ? C.green : C.red, 0.18);
    if (ok && def.range) this.rangeRing.setPosition(x, y).setRadius(def.range).setVisible(true);
    if (ok && this.selected === 'tower') this.rangeRing.setPosition(x, y).setRadius(def.range * 1.3).setVisible(true);
  }

  onBoardDown(p) {
    if (p.event && typeof p.event.button === 'number' && p.event.button !== 0) {
      const c = this.cellFromPointer(p);
      if (c && this.phase === 'build') this.sellAt(c.cx, c.cy);
      return;
    }
    const c = this.cellFromPointer(p);
    if (!c) return;

    if (this.phase === 'siege') {
      if (this.aidArmed) this.callAid(c.cx, c.cy);
      return;
    }
    if (this.phase !== 'build') return;

    if (this.tool === 'sell') return this.sellAt(c.cx, c.cy);
    if (this.tool === 'repair') return this.repairAt(c.cx, c.cy);
    this.placeAt(this.selected, c.cx, c.cy);
  }

  canPlace(key, cx, cy) {
    const def = BUILDINGS[key];
    const size = key === 'keep' ? 2 : 1;
    if (unlockedBuildings(this.wave) < def.unlockAt) return { ok: false, why: 'locked' };
    if (cx + size > GRID || cy + size > GRID) return { ok: false, why: 'edge' };
    if (key === 'keep' && this.keep && !this.keep.dead) return { ok: false, why: 'have keep' };
    if (key !== 'keep' && (!this.keep || this.keep.dead)) return { ok: false, why: 'keep first' };
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (this.grid[(cy + y) * GRID + (cx + x)]) return { ok: false, why: 'occupied' };
    if (key !== 'keep') {
      if (this.gameMode === 'chaos') {
        if ((this.chaosInventory[key] || 0) <= 0) return { ok: false, why: 'no_chaos' };
      } else {
        if (this.gold < def.cost) return { ok: false, why: 'gold' };
      }
      if (this.countPieces() >= this.pieceLimit()) return { ok: false, why: 'limit' };
    }
    return { ok: true };
  }

  placeAt(key, cx, cy) {
    const check = this.canPlace(key, cx, cy);
    if (!check.ok) {
      SFX.deny();
      const [x, y] = this.centerOf(cx, cy);
      if (check.why === 'gold') toast(this, x, y - 40, 'not enough gold', hex(C.crimson), 20);
      else if (check.why === 'no_chaos') toast(this, x, y - 40, '0 in Reserve! Spin Wheel of Chaos', hex(C.crimson), 20);
      else if (check.why === 'limit') toast(this, x, y - 40, 'Castle full! (+1 slot: 1000g)', hex(C.crimson), 20);
      else if (check.why === 'keep first') toast(this, W / 2, 700, 'place your Keep first', hex(C.gold), 24);
      else if (check.why === 'edge') toast(this, x, y - 40, 'no room', hex(C.crimson), 20);
      this.refreshHUD();
      return false;
    }
    const def = BUILDINGS[key];
    const b = new Building(this, key, cx, cy);
    b.maxHp = this.baseMaxHp(key);
    b.hp = b.maxHp;
    this.buildings.push(b);
    for (const c of b.cells) this.grid[c] = b;
    if (key === 'keep') this.keep = b;

    if (key !== 'keep') {
      if (this.gameMode === 'chaos') {
        this.chaosInventory[key] = Math.max(0, (this.chaosInventory[key] || 0) - 1);
      } else {
        this.gold -= def.cost;
        this.runSpend = (this.runSpend || 0) + def.cost;
      }
    }
    this.placeCount++;
    SFX.place();
    this.shake(0.12, 0.004);
    this.fx.burst(b.x, b.y, C.stoneLight, 8, { speed: 90, life: 380 });

    this.evaluateSynergies(true);
    this.recomputeGoals();
    this.refreshHUD();
    this.refreshPaletteCounts();
    this.updateHint();
    return true;
  }

  sellAt(cx, cy) {
    const b = this.grid[cy * GRID + cx];
    if (!b) { SFX.deny(); return; }
    if (b.key === 'keep') { SFX.deny(); toast(this, b.x, b.y - 50, 'the Keep cannot be moved', hex(C.crimson), 20); return; }
    if (this.gameMode === 'chaos') {
      this.chaosInventory[b.key] = (this.chaosInventory[b.key] || 0) + 1;
      this.removeBuilding(b, false);
      SFX.sell();
      toast(this, b.x, b.y - 40, `+1 ${b.def.name} to Reserve`, hex(C.green), 24);
      this.refreshHUD(); this.refreshPaletteCounts();
    } else {
      const back = Math.round(b.def.cost * ECONOMY_CONFIG.sellRefundRatio);
      this.gold += back;
      this.removeBuilding(b, false);
      SFX.sell();
      toast(this, b.x, b.y - 40, `+${back}`, hex(C.green), 24);
      this.refreshHUD(); this.refreshPalette();
    }
  }

  repairAt(cx, cy) {
    const b = this.grid[cy * GRID + cx];
    if (!b) { SFX.deny(); return; }
    if (b.hp >= b.maxHp) { SFX.deny(); toast(this, b.x, b.y - 40, 'already sound', hex(C.rule), 20); return; }
    const cost = Math.max(1, Math.round((b.maxHp - b.hp) * ECONOMY_CONFIG.repairCostPerMissingHp));

    this.pendingRepair = { building: b, cost, cx, cy };
    this.repairConfirmPiece.setText(b.def.name.toUpperCase());
    this.repairConfirmHp.setText(`Integrity: ${Math.ceil(b.hp)} / ${b.maxHp} HP  (+${Math.ceil(b.maxHp - b.hp)} HP)`);
    this.repairConfirmCost.setText(`Cost: ${cost} Gold  (Available: ${Math.floor(this.gold)}g)`);

    if (this.gold < cost) {
      this.repairConfirmBtn.setEnabled(false);
      this.repairConfirmBtn.label.setText('NEED GOLD');
    } else {
      this.repairConfirmBtn.setEnabled(true);
      this.repairConfirmBtn.label.setText(`PAY ${cost}G`);
    }
    this.repairConfirm.setVisible(true);
    SFX.tap();
  }

  executePendingRepair() {
    if (!this.pendingRepair) return;
    const { building: b, cost } = this.pendingRepair;
    this.repairConfirm.setVisible(false);
    this.pendingRepair = null;
    if (!b || !b.sprite || b.dead) { SFX.deny(); return; }
    if (this.gold < cost) { SFX.deny(); toast(this, b.x, b.y - 40, `needs ${cost}g`, hex(C.crimson), 20); return; }
    this.gold -= cost;
    b.heal(b.maxHp - b.hp);
    SFX.repair();
    this.fx.burst(b.x, b.y, C.green, 10, { speed: 70, life: 420 });
    toast(this, b.x, b.y - 40, `Repaired (-${cost}g)`, hex(C.green), 22);
    this.refreshHUD();
    this.refreshPalette();
    this.refreshInfo();
  }

  cancelRepairConfirm() {
    this.repairConfirm.setVisible(false);
    this.pendingRepair = null;
    SFX.tap();
  }

  removeBuilding(b, destroyed = true) {
    for (const c of b.cells) if (this.grid[c] === b) this.grid[c] = null;
    const i = this.buildings.indexOf(b);
    if (i >= 0) this.buildings.splice(i, 1);
    if (b === this.keep) { this.lastKeepPos = { x: b.x, y: b.y }; this.keep = null; }
    if (destroyed && b.key !== 'trap') this.brokenThisWave = (this.brokenThisWave || 0) + 1;
    b.destroy();
    this.gridVersion++;
    this.evaluateSynergies(false);
    this.recomputeGoals();
  }

  destroyBuilding(b) {
    const wasKeep = b.key === 'keep';
    this.removeBuilding(b, true);
    if (wasKeep) this.gameOver();
    this.refreshHUD();
  }

  // --------------------------------------------------------------- siege input
  armAid() {
    if (this.phase !== 'siege') { SFX.deny(); return; }
    if (this.aidCooldown > 0) { SFX.deny(); return; }
    this.aidArmed = !this.aidArmed;
    SFX.tap();
    if (this.aidArmed) toast(this, W / 2, 700, 'tap the field', hex(C.lapis), 26);
    this.refreshAction();
  }

  callAid(cx, cy) {
    this.aidArmed = false;
    this.aidCooldown = Math.max(1, COMBAT_CONFIG.royalAidCooldownSeconds - upgradeLevel('drums') * 3.5);
    const [x, y] = this.centerOf(cx, cy);
    SFX.ability();
    this.shake(0.3, 0.01);
    this.fx.ring(x, y, C.purple);
    const count = COMBAT_CONFIG.royalAidBoltsCount || 7;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const tx = x + Math.cos(ang) * (i ? 46 : 0);
      const ty = y + Math.sin(ang) * (i ? 46 : 0);
      this.time.delayedCall(i * 55, () => {
        this.projectiles.push({
          sprite: this.add.image(W / 2, -40, 'p_bolt').setDepth(50),
          x: W / 2, y: -40, tx, ty,
          speed: COMBAT_CONFIG.royalAidProjectileSpeed || 900,
          dmg: COMBAT_CONFIG.royalAidDamage || 34,
          splash: COMBAT_CONFIG.royalAidSplashRadius || 66,
          color: C.purple, kind: 'aid', target: null, life: 3,
        });
      });
    }
    this.refreshAction();
  }

  // ------------------------------------------------------------------- sieges
  startSiege() {
    if (this.phase !== 'build') return;
    if (!this.keep || this.keep.dead) { SFX.deny(); toast(this, W / 2, 700, 'place your Keep first', hex(C.gold), 26); return; }
    if (this.countPieces() < 1) { SFX.deny(); return; }

    const s = loadSave();
    if (!s.seenTutorial) { s.seenTutorial = true; writeSave(); }

    this.phase = 'siege';
    this.waveDef = waveFor(this.wave);
    this.buildSpawnQueue();
    this.spawnIdx = 0;
    this.elapsed = 0;
    this.aidCooldown = 0;
    this.aidArmed = false;
    this.killsThisWave = 0;
    this.goldThisWave = 0;
    this.brokenThisWave = 0;
    this.lastStand = false;
    this.seenThisRun = {};

    this.paletteGroup.setVisible(false);
    this.infoGroup.setVisible(false);
    this.startBtn.setVisible(false);
    this.aidBtn.setVisible(true);
    this.siegePanel.setVisible(true);
    this.buildRoster();

    // Reset temporary wave modifiers
    this.sapperPowerBuff = 1;
    this.enemySpeedBuff = 1;
    this.enemyDmgBuff = 1;
    this.enemyHpBuff = 1;

    // Check Mad King Decrees in Story Mode
    if (this.gameMode === 'story' && DECREES[this.wave]) {
      const dec = DECREES[this.wave];
      const { W } = this.L;
      if (typeof dec.check === 'function') {
        const passed = dec.check(this);
        if (!passed) {
          SFX.deny();
          toast(this, W / 2, 380, '⚠️ ROYAL DECREE DISOBEYED: The King is wrathful! ⚠️', hex(C.crimson), 22);
          if (this.wave === 1) {
            this.enemyDmgBuff = 1.5;
          } else if (this.wave === 2) {
            const wall = this.buildings.find(b => b.key === 'wall');
            if (wall) {
              this.rubbleBurst(wall.x, wall.y, 'wall');
              this.removeBuilding(wall, true);
            }
          } else if (this.wave === 3) {
            this.gold = Math.max(0, this.gold - ECONOMY_CONFIG.decreeTaxPenaltyGold);
          } else if (this.wave === 4) {
            this.aidCooldown = 9999;
          } else if (this.wave === 5) {
            this.enemyHpBuff = 1.4;
          } else if (this.wave === 6) {
            this.enemySpeedBuff = 1.35;
          } else if (this.wave === 7) {
            this.sapperPowerBuff = 2;
          } else if (this.wave === 8) {
            this.trebuchetBarrage();
          } else if (this.wave === 9) {
            this.enemySpeedBuff = 1.25;
            this.enemyDmgBuff = 1.25;
          }
        } else {
          this.gold += ECONOMY_CONFIG.decreeObeyedBountyGold;
          toast(this, W / 2, 380, `ROYAL DECREE OBEYED: +${ECONOMY_CONFIG.decreeObeyedBountyGold}g Royal Bounty!`, hex(C.green), 22);
          SFX.gold();
        }
      }
    }

    this.shake(0.4, 0.012);
    SFX.wave();
    this.showBanner(`SIEGE ${this.wave}`, this.waveDef.label);
    this.updateHint();
    this.refreshHUD();
    this.refreshAction();
    this.gridVersion++;
    for (const e of this.enemies) e.pathVer = -1;
  }

  trebuchetBarrage() {
    const { W } = this.L;
    toast(this, W / 2, 320, '⚠️ ENEMY TREBUCHETS SHELL YOUR LINES! ⚠️', hex(C.crimson), 24);
    SFX.boom();
    this.shake(0.6, 0.018);
    const targets = this.buildings.filter(b => b.key !== 'keep');
    const selected = targets.length > 0 ? targets.sort(() => 0.5 - Math.random()).slice(0, 3) : [this.keep].filter(Boolean);
    selected.forEach((b, i) => {
      this.time.delayedCall(400 + i * 350, () => {
        if (b.dead || !b.sprite) return;
        this.fx.ring(b.x, b.y, C.red, 90);
        this.fx.burst(b.x, b.y, C.red, 16, { speed: 180, life: 400 });
        SFX.boom();
        this.shake(0.3, 0.01);
        b.damage(50, 'trebuchet');
      });
    });
  }

  buildSpawnQueue() {
    const q = [];
    let t = 900;   // brief breath before the first foe appears
    for (const [type, count, interval] of this.waveDef.spawns) {
      for (let i = 0; i < count; i++) {
        q.push({ type, at: t });
        t += interval;
      }
      t += 400;
    }
    this.spawnQueue = q;
  }

  pickSpawnCol() {
    const freeTop = [];
    const blockedTop = [];
    for (let x = 0; x < GRID; x++) {
      const b = this.grid[x];
      if (!b) freeTop.push(x);
      else blockedTop.push(x);
    }
    const anchor = this.keep ? this.keep.cx + 0.5 : GRID / 2;
    if (freeTop.length) {
      freeTop.sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor));
      return freeTop[Math.floor(Math.random() * Math.min(3, freeTop.length))];
    }
    if (blockedTop.length) {
      blockedTop.sort((a, b) => (this.grid[a].hp / this.grid[a].maxHp) - (this.grid[b].hp / this.grid[b].maxHp));
      return blockedTop[0];
    }
    return 0;
  }

  spawnEnemy(type) {
    const col = this.pickSpawnCol();
    const e = new Enemy(this, type, col, this.waveDef.hpScale || 1, this.waveDef.dmgScale || 1);
    this.enemies.push(e);
    this.fx.burst(e.x, e.y, e.def.color, 6, { speed: 70, life: 320 });
    return e;
  }

  // ------------------------------------------------------------------- combat
  markEnemy(e) {
    if (this.now() >= e.markedUntil - 40) {
      e.markedUntil = this.now() + 3000;
      this.fx.ring(e.x, e.y, C.gold);
      toast(this, e.x, e.y - 46, 'marked', hex(C.gold), 17);
    }
  }

  springTrap(trap, enemy) {
    if (trap.dead || trap.pending) return;
    trap.pending = true;
    this.tweens.add({ targets: trap.sprite, scale: trap.sprite.scaleX * 0.8, duration: 120, yoyo: true });
    this.time.delayedCall(220, () => this.detonateTrap(trap, 0));
  }

  detonateTrap(trap, depth) {
    if (trap.dead) return;
    const r = trap.def.radius * (depth ? 0.8 : 1);
    SFX.trap();
    this.shake(0.25, 0.008);
    this.fx.ring(trap.x, trap.y, C.red);
    this.fx.burst(trap.x, trap.y, C.red, 18, { speed: 240, life: 520 });
    for (const e of [...this.enemies]) {
      if (e.dead) continue;
      const d = Phaser.Math.Distance.Between(e.x, e.y, trap.x, trap.y);
      if (d <= r) e.damage(trap.def.damage, trap);
    }
    trap.pending = false;
    trap.uses = (trap.uses || 1) - 1;
    if (trap.uses <= 0) this.removeBuilding(trap, true);
    else {
      trap.hp = trap.maxHp;
      trap.updateHpBar();
    }
    if (depth < 3) {
      for (const other of this.buildings) {
        if (other.key !== 'trap' || other === trap || other.pending || other.dead) continue;
        if (Phaser.Math.Distance.Between(other.x, other.y, trap.x, trap.y) <= r + CELL * 0.7) {
          other.pending = true;
          this.time.delayedCall(260, () => this.detonateTrap(other, depth + 1));
          this.fireSynergy('domino', other.x, other.y);
        }
      }
    }
  }

  nearestBlockingNeighbour(cell, flyer) {
    if (flyer) return null;
    const cx = cell % GRID, cy = (cell / GRID) | 0;
    let best = null, bestScore = -Infinity;
    for (const [dx, dy] of DIR4) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
      const b = this.grid[ny * GRID + nx];
      if (!b || b.def.walkable || b.dead) continue;
      const score = b.def.aggro * 100 - (b.hp / b.maxHp) * 10;
      if (score > bestScore) { bestScore = score; best = b; }
    }
    return best;
  }

  fireProjectile(from, target, cfg) {
    const tex = cfg.kind === 'cannon' ? 'p_ball' : cfg.kind === 'aid' ? 'p_bolt' : 'p_arrow';
    const img = this.add.image(from.x, from.y, tex).setDepth(45);
    if (cfg.kind === 'arrow') img.setRotation(Math.atan2(target.y - from.y, target.x - from.x));
    this.projectiles.push({
      sprite: img, x: from.x, y: from.y,
      tx: target.x, ty: target.y, target: cfg.kind === 'arrow' ? target : null,
      speed: cfg.speed, dmg: cfg.dmg, splash: cfg.splash || 0,
      kind: cfg.kind, color: cfg.color, life: 3.5, from: cfg.from || null,
    });
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.target && !p.target.dead) { p.tx = p.target.x; p.ty = p.target.y; }
      else if (p.target) p.target = null;

      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      const step = p.speed * dt;
      if (d <= step || p.life <= 0) {
        this.impact(p);
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
      p.sprite.setPosition(p.x, p.y);
      if (p.kind === 'arrow') p.sprite.setRotation(Math.atan2(dy, dx));
    }
  }

  impact(p) {
    if (p.splash > 0) {
      this.fx.ring(p.tx, p.ty, p.color || C.gold, p.splash);
      this.fx.burst(p.tx, p.ty, p.color || C.gold, 12, { speed: 200, life: 420 });
      this.shake(0.2, 0.006);
      for (const e of [...this.enemies]) {
        if (e.dead) continue;
        const d = Phaser.Math.Distance.Between(e.x, e.y, p.tx, p.ty);
        if (d <= p.splash) {
          let dmg = p.dmg;
          if (p.kind === 'cannon' && (e.slow || 1) < 1) { dmg *= 1.6; this.fireSynergy('deep', e.x, e.y); }
          e.damage(dmg, p);
        }
      }
      if (p.kind === 'cannon') SFX.cannon();
      return;
    }
    if (p.target && !p.target.dead) {
      p.target.damage(p.dmg, p);
      this.fx.burst(p.tx, p.ty, p.color || C.bone, 5, { speed: 130, life: 260 });
      SFX.hit();
    }
  }

  onEnemyHit(e, amount) {
    if (Math.random() < 0.4) this.fx.burst(e.x, e.y, C.white, 3, { speed: 110, life: 220 });
  }

  onEnemyDeath(e, source) {
    if (this.gameMode === 'story' && this.wave === 10 && e.boss) {
      const cy = Math.floor((e.y - this.L.BOARD_Y) / this.L.CELL);
      if (cy !== 3 && cy !== 4) {
        this.warlordResurrectTroll(e);
        return;
      }
    }

    this.killsThisWave++;
    const alchemyMul = 1 + 0.20 * upgradeLevel('alchemy');
    const g = Math.round(e.def.gold * (DIFFICULTY_CONFIG.globalEnemyGoldRewardMultiplier || 1) * alchemyMul);
    this.gold += g;
    this.goldThisWave += g;
    this.runGoldEarned += g;
    SFX.death();
    this.fx.burst(e.x, e.y, e.def.color, e.boss ? 26 : 12, { speed: e.boss ? 320 : 200, life: 520 });
    if (e.boss) {
      this.shake(0.7, 0.02);
      this.showBanner('SACRED RITUAL COMPLETE', 'The High Warlord has fallen forever!');
    }
    const t = this.add.text(e.x, e.y - 16, `+${g}`, {
      fontFamily: FONT, fontSize: '20px', color: hex(C.gold), fontStyle: 'bold',
      stroke: hex(C.bgDeep), strokeThickness: 4, resolution: 2,
    }).setOrigin(0.5).setDepth(300);
    this.tweens.add({ targets: t, y: e.y - 60, alpha: 0, duration: 750, ease: 'Cubic.Out', onComplete: () => t.destroy() });

    if (e.def.deathBurst) {
      const b = e.def.deathBurst;
      this.fx.ring(e.x, e.y, C.green, b.radius);
      this.shake(0.45, 0.014);
      SFX.cannon();
      const blastMult = this.sapperPowerBuff || 1;
      for (const bd of [...this.buildings]) {
        const d = Phaser.Math.Distance.Between(bd.x, bd.y, e.x, e.y);
        if (d <= b.radius) bd.damage((b.damage * blastMult) * (1 - d / b.radius) + 20, 'sapper');
      }
    }
    this.refreshHUD();
  }

  warlordResurrectTroll(e) {
    const { W } = this.L;
    this.phase = 'resurrecting';
    this.resultShown = true;
    this.spawnQueue = [];
    this.spawnIdx = 0;
    this.pulsedWave10 = false;

    this.shake(1.2, 0.035);
    SFX.lose();
    SFX.boom();
    this.fx.burst(e.x, e.y, C.red, 40, { speed: 380, life: 800 });
    this.fx.ring(e.x, e.y, C.red, 220);

    // Roll back to wave 8
    this.wave = 8;
    this.wavesCleared = 7;
    this.gold = Math.max(30, this.gold - 50);

    this.showBanner('THE SOUL REFUSES TO DEPART', 'Dark magic twists the threads of time...');
    toast(this, W / 2, 420, '☠️ "Death is merely a doorway, mortal..." ☠️', hex(C.crimson), 24);

    // Clean up active foes and projectiles safely
    for (const en of [...this.enemies]) {
      en.dead = true;
      en.remove();
    }
    this.enemies = [];
    for (const p of [...this.projectiles]) {
      if (p.sprite && p.sprite.destroy) p.sprite.destroy();
    }
    this.projectiles = [];

    this.time.delayedCall(2200, () => {
      this.wave = 8;
      this.wavesCleared = 7;
      this.phase = 'build';
      this.resultShown = false;
      this.waveDef = null;
      this.lastStand = false;
      this.seenThisRun = {};
      this.aidCooldown = 0;
      this.chaosExtraSpinsBonus = 3;

      this.paletteGroup.setVisible(true);
      this.infoGroup.setVisible(true);
      this.startBtn.setVisible(true);
      this.aidBtn.setVisible(false);
      this.siegeInfo.setVisible(false);
      this.siegePanel.setVisible(false);
      if (this.ritualOverlay) this.ritualOverlay.setVisible(false).setAlpha(0);

      this.refreshHUD();
      this.refreshPalette();
      this.refreshInfo();
      this.refreshAction();
      this.updateHint();
    });
  }

  onBuildingHit(b, amount, cause) {
    this.fx.burst(b.x, b.y, C.stoneLight, 4, { speed: 120, life: 280 });
    if (amount > 18) this.shake(0.18, 0.005);
    if (!b.dead && b.hp > 0) {
      this.tweens.add({ targets: b.sprite, x: b.x + (Math.random() - 0.5) * 5, duration: 60, yoyo: true, onComplete: () => b.sprite.setX(b.x) });
    }
    this.refreshHUD();
    if (b.key === 'keep') this.evaluateSynergies(true);
  }

  rubbleBurst(x, y, key) {
    this.fx.burst(x, y, key === 'moat' ? C.water : C.stone, 22, { speed: 260, life: 700, grav: 500 });
    this.shake(0.4, 0.012);
    SFX.boom();
  }

  shake(dur, amp) {
    this.cameras.main.shake(Math.max(1, dur * 1000), amp);
  }

  // ----------------------------------------------------------------- fx layer
  get fx() {
    if (this._fx) return this._fx;
    const scene = this;
    this._fx = {
      burst(x, y, color, count = 10, o = {}) {
        const em = scene.add.particles(x, y, 'dot', {
          speed: { min: (o.speed || 120) * 0.35, max: o.speed || 120 },
          angle: { min: 0, max: 360 },
          lifespan: o.life || 400,
          scale: { start: (o.size || 0.5), end: 0 },
          alpha: { start: 0.95, end: 0 },
          gravityY: o.grav || 260,
          quantity: 1,
          tint: color,
          emitting: false,
          maxParticles: 60,
        }).setDepth(200);
        em.explode(count);
        scene.time.delayedCall((o.life || 400) + 400, () => em.destroy());
      },
      ring(x, y, color, radius = 70) {
        const r = scene.add.image(x, y, 'ring').setDepth(190).setTint(color).setDisplaySize(20, 20).setAlpha(0.9);
        scene.tweens.add({
          targets: r, displayWidth: radius * 2, displayHeight: radius * 2, alpha: 0,
          duration: 420, ease: 'Cubic.Out', onComplete: () => r.destroy(),
        });
      },
      splash(x, y) { this.burst(x, y, C.waterHi, 6, { speed: 90, life: 340, grav: -80 }); },
    };
    return this._fx;
  }

  // ----------------------------------------------------------------- banner/UI
  showBanner(title, sub) {
    this.bannerTitle.setText(title);
    this.bannerSub.setText(sub);
    const y0 = this.bannerY0 == null ? this.banner.y : this.bannerY0;
    this.bannerY0 = y0;
    this.banner.setAlpha(0).setY(y0 + 14);
    this.tweens.add({ targets: this.banner, alpha: 1, y: y0, duration: 180, ease: 'Cubic.Out' });
    this.tweens.add({ targets: this.banner, alpha: 0, duration: 400, delay: 1400, ease: 'Quad.In' });
  }

  refreshAction() {
    if (this.phase === 'siege') {
      this.aidBtn.setEnabled(this.aidCooldown <= 0);
      if (this.aidCooldown > 0) {
        this.aidBtn.label.setText('ROYAL AID');
        if (this.aidBtn.subLabel) this.aidBtn.subLabel.setText(`${this.aidCooldown.toFixed(1)}s`);
      } else {
        this.aidBtn.label.setText(this.aidArmed ? 'TAP FIELD' : 'ROYAL AID');
        if (this.aidBtn.subLabel) this.aidBtn.subLabel.setText(this.aidArmed ? 'aiming…' : 'ready');
      }
    }
  }

  // -------------------------------------------------------------------- phases
  clearWave() {
    if (this.resultShown) return;
    this.resultShown = true;
    this.phase = 'cleared';
    const bonus = ECONOMY_CONFIG.waveClearBaseGold + this.wave * ECONOMY_CONFIG.waveClearGoldPerWave;
    this.gold += bonus;
    this.runGoldEarned += bonus;
    this.goldThisWave += bonus;
    SFX.win();

    const s = loadSave();
    const before = s.totalWaves;
    s.totalWaves += 1;
    s.bestWave = Math.max(s.bestWave, this.wave);
    if (this.gameMode === 'survival') {
      s.bestSurvivalWave = Math.max(s.bestSurvivalWave || 0, this.wave);
    }
    writeSave();
    const newUnlocks = Object.keys(BUILDINGS)
      .filter((k) => BUILDINGS[k].unlockAt > before && BUILDINGS[k].unlockAt <= s.totalWaves);

    this.showBanner('SIEGE HELD', `+${bonus} gold · ${this.killsThisWave} slain · ${this.brokenThisWave} broken`);

    if (this.gameMode === 'chaos') {
      const bonusSpins = CHAOS_CONFIG.spinsPerWaveClear || 3;
      this.chaosSpins = (this.chaosSpins || 0) + bonusSpins;
      toast(this, this.L.W / 2, 420, `🎲 CHAOS SURGE: +${bonusSpins} WHEEL SPINS EARNED!`, hex(C.gold), 24);
    }

    if (this.gameMode === 'story' && this.wave >= 10) {
      this.time.delayedCall(1600, () => {
        this.storyVictory();
      });
      return;
    }

    this.time.delayedCall(1500, () => {
      this.wavesCleared++;
      this.wave++;
      this.phase = 'build';
      this.resultShown = false;
      this.waveDef = null;
      this.lastStand = false;
      this.seenThisRun = {};
      this.chaosOvercharge = false;
      this.chaosMagma = false;
      this.chaosLightningStorm = false;
      this.chaosExtraSpinsBonus = 3;

      // repair-by-reward: a sliver of Keep health returns after every hold
      if (this.keep && !this.keep.dead) {
        this.keep.heal(this.keep.maxHp * (ECONOMY_CONFIG.keepRepairOnWaveClearRatio || 0.12));
      }
      this.aidCooldown = 0;

      this.paletteGroup.setVisible(true);
      this.infoGroup.setVisible(true);
      this.startBtn.setVisible(true);
      if (this.spinWheelBtn) this.spinWheelBtn.setVisible(true);
      this.aidBtn.setVisible(false);
      this.siegeInfo.setVisible(false);
      this.siegePanel.setVisible(false);

      this.refreshHUD(); this.refreshPaletteCounts(); this.refreshInfo(); this.refreshAction(); this.updateHint();

      if (newUnlocks.length) {
        const k = newUnlocks[newUnlocks.length - 1];
        toast(this, this.L.W / 2, 430, `NEW PIECE: ${BUILDINGS[k].name.toUpperCase()}`, hex(C.green), 30);
        this.time.delayedCall(900, () => toast(this, this.L.W / 2, 500, BUILDINGS[k].blurb, hex(C.paper2), 20));
        SFX.synergy();
      }

      // Check periodic Chaos Anomaly every few waves
      if (this.gameMode === 'chaos' && this.wave > 1 && (this.wave - 1) % (CHAOS_CONFIG.anomalyIntervalWaves || 3) === 0) {
        const anomaly = Phaser.Utils.Array.GetRandom(CHAOS_ANOMALIES);
        if (anomaly) {
          this.time.delayedCall(1100, () => {
            toast(this, this.L.W / 2, 380, `⚡ CHAOS CALAMITY!\n${anomaly.title}\n${anomaly.desc}`, hex(C.gold), 22);
            SFX.boom();
            this.fx.ring(this.L.W / 2, 400, C.gold, 300);
            anomaly.apply(this);
            this.refreshPaletteCounts();
            this.refreshHUD();
          });
        }
      }

      // a small pile of legacy for the workshop, earned as you go
      s.legacy += (ECONOMY_CONFIG.legacyPerWaveClearBase || 4) + this.wavesCleared * (ECONOMY_CONFIG.legacyPerWaveClearMultiplier || 2);
      writeSave();
    });
  }

  gameOver() {
    if (this.phase === 'over') return;
    this.phase = 'over';
    this.aidArmed = false;
    SFX.lose();
    const k = this.lastKeepPos || { x: this.L.W / 2, y: BOARD_Y + 160 };
    this.shake(1.0, 0.028);
    this.fx.burst(k.x, k.y, C.red, 40, { speed: 340, life: 900, grav: 420 });
    this.fx.ring(k.x, k.y, C.red, 220);

    const legacy = this.wavesCleared * (ECONOMY_CONFIG.gameOverLegacyPerWave || 8) +
      Math.floor(this.gold * (ECONOMY_CONFIG.gameOverLegacyGoldRatio || 0.4)) +
      (ECONOMY_CONFIG.gameOverLegacyBase || 6);
    this.lastLegacy = legacy;
    const s = loadSave();
    s.legacy += legacy;
    s.runs += 1;
    s.bestWave = Math.max(s.bestWave, this.wave);
    if (this.gameMode === 'story' && this.wave === 10) {
      s.hasLostAtLevel10 = true;
    }
    writeSave();

    this.showBanner('THE KEEP HAS FALLEN', '');

    this.time.delayedCall(1700, () => {
      this.overlay.setVisible(true);
      this.resultTitle.setText('THE KEEP HAS FALLEN');
      this.resultTitle.setColor(hex(C.crimson));
      this.resultBody.setText('Every wall has a side the enemy finds.');
      this.resultStats.setText(
        `sieges held ${this.wavesCleared}   ·   best ${s.bestWave}   ·   gold ${Math.floor(this.gold)}`
      );
      this.resultLegacy.setText(`+${legacy} legacy`);
      this.overlayBtnA.label.setText('NEW CASTLE');
      this.overlayBtnB.label.setText('MAIN MENU');
      this.tweens.add({ targets: this.overlay, alpha: { from: 0, to: 1 }, duration: 300 });
      SFX.lose();
    });
  }

  continueRun() {
    this.scene.restart({ fresh: true });
  }

  stopAllTweens() {
    this.tweens.killAll();
  }

  // ------------------------------------------------------------------- update
  update(time, rawDelta) {
    const mult = this.speedMultiplier || 1;
    const delta = rawDelta * mult;
    const dt = Math.min(0.05 * mult, delta / 1000);

    for (const b of this.buildings) b.update(dt);

    if (this.phase === 'siege') {
      this.elapsed += delta;
      while (this.spawnIdx < this.spawnQueue.length && this.elapsed >= this.spawnQueue[this.spawnIdx].at) {
        this.spawnEnemy(this.spawnQueue[this.spawnIdx].type);
        this.spawnIdx++;
      }

      for (const e of [...this.enemies]) {
        e.update(dt);
        if (e.removed) this.enemies.splice(this.enemies.indexOf(e), 1);
      }

      this.updateProjectiles(dt);
      this.updateDefenders(dt);

      if (this.chaosLightningStorm) {
        this.chaosStormTimer = (this.chaosStormTimer || 0) + dt;
        if (this.chaosStormTimer >= 2.8) {
          this.chaosStormTimer = 0;
          const aliveFoes = this.enemies.filter(e => !e.dead);
          if (aliveFoes.length > 0) {
            const foe = Phaser.Utils.Array.GetRandom(aliveFoes);
            foe.damage(65, 'chaos_storm', true);
            this.fx.burst(foe.x, foe.y, C.gold, 15, { speed: 200, life: 400 });
            SFX.boom();
          }
        }
      }

      if (this.aidCooldown > 0) {
        this.aidCooldown = Math.max(0, this.aidCooldown - dt);
        if (this.aidCooldown === 0) SFX.gold();
        this.refreshAction();
      }

      if (this.spawnIdx >= this.spawnQueue.length && this.enemies.length === 0) this.clearWave();
      if (this.keep && this.keep.hp <= 0 && this.phase === 'siege') this.gameOver();
      this.refreshHUD();
    } else {
      this.updateProjectiles(dt);
    }

    this.updateCursor();
  }

  updateDefenders(dt) {
    const dmgMul = 1 + 0.15 * upgradeLevel('powder');
    for (const b of this.buildings) {
      const def = b.def;
      if (!def.range) continue;
      if (b.key === 'cannon' && !b.emplaced) continue;

      b.fireTimer -= dt;
      if (b.fireTimer > 0) continue;

      const range = def.range * (b.rangeMul || 1);
      let best = null, bestD = Infinity;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = Phaser.Math.Distance.Between(b.x, b.y, e.x, e.y);
        if (d > range) continue;
        if (d < bestD) { bestD = d; best = e; }
      }
      if (!best) { b.fireTimer = 0.12; continue; }

      let interval = def.cooldown * (b.rateMul || 1);
      if (this.lastStand) interval *= 0.67;
      if (this.chaosOvercharge) interval *= 0.625;
      if (b.key === 'cannon' && best.slow && best.slow < 1) interval *= 0.9;
      b.fireTimer = interval / 1000;

      this.fireProjectile(
        { x: b.x, y: b.y - 10 }, best,
        {
          kind: b.key === 'cannon' ? 'cannon' : 'arrow',
          speed: b.key === 'cannon' ? def.projectileSpeed : 700,
          dmg: def.damage * dmgMul,
          splash: b.key === 'cannon' ? def.splash : 0,
          color: b.key === 'cannon' ? C.gold : C.bone,
        }
      );
      if (b.key === 'cannon') { SFX.shot(); b.sprite.setScale(1.06, 0.94); this.time.delayedCall(90, () => !b.dead && b.sprite.setScale(1)); }
      else SFX.shot();

      this.tweens.add({ targets: b.sprite, scaleY: b.sprite.scaleY * 0.94, duration: 70, yoyo: true });
      if (b.braced) b.pulseSynergy();
    }
  }

  applyChaosGremlinUpgrade() {
    const tier1s = this.buildings.filter(b => b.key !== 'keep' && b.tier === 1);
    if (tier1s.length > 0) {
      const b = Phaser.Utils.Array.GetRandom(tier1s);
      b.upgradeToTier2(UPGRADED_BUILDINGS[b.key]);
      this.fx.burst(b.x, b.y, C.green, 20, { speed: 180, life: 500 });
      toast(this, b.x, b.y - 40, `🔨 GREMLIN UPGRADE: ${b.def.name}!`, hex(C.green), 22);
    } else {
      this.chaosInventory.wall = (this.chaosInventory.wall || 0) + 2;
      toast(this, this.L.W / 2, 400, '🔨 GREMLIN GIFT: +2 Walls to Reserve!', hex(C.green), 22);
    }
    for (const b of this.buildings) {
      b.hp = b.maxHp;
      b.updateHpBar();
    }
    this.refreshHUD();
  }

  applyChaosShift() {
    const swappable = this.buildings.filter(b => b.key !== 'keep');
    if (swappable.length >= 2) {
      const b1 = Phaser.Utils.Array.GetRandom(swappable);
      const remaining = swappable.filter(b => b !== b1);
      const b2 = Phaser.Utils.Array.GetRandom(remaining);

      const tempCx = b1.cx, tempCy = b1.cy, tempCells = [...b1.cells];
      b1.cx = b2.cx; b1.cy = b2.cy; b1.cells = [...b2.cells];
      b2.cx = tempCx; b2.cy = tempCy; b2.cells = tempCells;

      for (const c of b1.cells) this.grid[c] = b1;
      for (const c of b2.cells) this.grid[c] = b2;

      const p1 = cellCenter(b1.cx, b1.cy);
      const p2 = cellCenter(b2.cx, b2.cy);
      b1.x = p1.x; b1.y = p1.y;
      b2.x = p2.x; b2.y = p2.y;
      if (b1.sprite) b1.sprite.setPosition(b1.x, b1.y);
      if (b2.sprite) b2.sprite.setPosition(b2.x, b2.y);
      b1.updateHpBar();
      b2.updateHpBar();

      this.fx.burst(b1.x, b1.y, C.red, 16, { speed: 150, life: 400 });
      this.fx.burst(b2.x, b2.y, C.red, 16, { speed: 150, life: 400 });
      toast(this, this.L.W / 2, 400, `🌪️ CHAOS SHIFT: Swapped ${b1.def.name} & ${b2.def.name}!`, hex(C.green), 22);
    }
    if (this.keep && !this.keep.dead) {
      this.keep.heal(150);
    }
    this.gridVersion++;
    this.evaluateSynergies(true);
    this.refreshHUD();
  }

  applyChaosQuake() {
    const walls = this.buildings.filter(b => b.key === 'wall');
    if (walls.length > 0) {
      const w = Phaser.Utils.Array.GetRandom(walls);
      w.damage(45, 'quake');
      this.shake(0.35, 0.012);
      this.fx.burst(w.x, w.y, C.red, 18, { speed: 160, life: 400 });
      toast(this, w.x, w.y - 40, '🌋 EARTHQUAKE: Wall damaged -45 HP!', hex(C.crimson), 22);
    } else if (this.keep && !this.keep.dead) {
      this.keep.damage(25, 'quake');
      this.shake(0.35, 0.012);
      toast(this, this.keep.x, this.keep.y - 40, '🌋 EARTHQUAKE: Keep took 25 damage!', hex(C.crimson), 22);
    }
    this.refreshHUD();
  }

  applyChaosHordeFrenzy() {
    this.enemySpeedBuff = (this.enemySpeedBuff || 1) * 1.35;
    toast(this, this.L.W / 2, 400, '🧪 HORDE FRENZY: Enemies are +35% faster next wave!', hex(C.crimson), 22);
  }

  applyChaosSabotage() {
    const availableKeys = Object.keys(this.chaosInventory).filter(k => (this.chaosInventory[k] || 0) > 0);
    if (availableKeys.length > 0) {
      const key = Phaser.Utils.Array.GetRandom(availableKeys);
      this.chaosInventory[key] = Math.max(0, this.chaosInventory[key] - 1);
      toast(this, this.L.W / 2, 400, `🌪️ SABOTAGE: Gremlins stole 1 ${BUILDINGS[key]?.name || key}!`, hex(C.crimson), 22);
    } else {
      toast(this, this.L.W / 2, 400, '🌪️ SABOTAGE: Gremlins ransacked reserve but found nothing!', hex(C.gold), 22);
    }
    this.refreshPaletteCounts();
  }

  updateCursor() {
    const aiming = this.phase === 'siege' && this.aidArmed;
    const show = this.phase === 'build' || aiming;
    const c = this.hover || (this.usedKeyboard ? this.cursor : null);
    if (!show || !c) {
      this.cursorBox.setVisible(false);
      if (this.phase === 'build') this.ghost.setVisible(false);
      return;
    }
    const [x, y] = this.centerOf(c.cx, c.cy);
    this.cursorBox.setPosition(x, y).setVisible(true);
    this.cursorBox.setAlpha(this.hover ? 0.35 : 1);
    if (this.phase === 'build') this.updateGhost(c.cx, c.cy);
  }

  // ------------------------------------------------------------------ keyboard
  setupKeyboard() {
    const kb = this.input.keyboard;
    if (!kb) return;
    const on = (key, fn) => kb.on(`keydown-${key}`, fn);

    // Konami Code detector (Up Up Down Down Left Right Left Right B A)
    const konamiSeq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIdx = 0;
    this.input.keyboard.on('keydown', (event) => {
      const k = event.key;
      if (k && k.toLowerCase() === konamiSeq[konamiIdx].toLowerCase()) {
        konamiIdx++;
        if (konamiIdx === konamiSeq.length) {
          konamiIdx = 0;
          this.handleKonamiCode();
        }
      } else {
        konamiIdx = (k && k.toLowerCase() === konamiSeq[0].toLowerCase()) ? 1 : 0;
      }
    });

    on('ESC', () => {
      if (this.firstTimeModal && this.firstTimeModal.visible) {
        this.closeFirstTimeGuide();
      } else if (this.trollModal && this.trollModal.visible) {
        this.trollModal.setVisible(false);
        this.scene.start('menu');
      } else if (this.godModeModal && this.godModeModal.visible) {
        this.closeGodMode();
      } else if (this.repairConfirm && this.repairConfirm.visible) {
        this.cancelRepairConfirm();
      } else if (this.exitConfirm.visible) {
        this.exitConfirm.setVisible(false);
      } else {
        this.confirmExit();
      }
    });
    on('B', () => this.startSiege());
    on('M', () => this.moveKeep());
    on('U', () => this.upgradeSelectedBuilding());
    on('X', () => this.setTool(this.tool === 'sell' ? 'build' : 'sell'));
    on('R', () => this.setTool(this.tool === 'repair' ? 'build' : 'repair'));
    on('TAB', (e) => { e.originalEvent?.preventDefault?.(); this.cyclePiece(1); });
    on('Q', () => this.cyclePiece(-1));
    on('E', () => this.cyclePiece(1));

    const move = (dx, dy) => {
      this.usedKeyboard = true;
      this.hover = null;
      this.cursor.cx = Phaser.Math.Clamp(this.cursor.cx + dx, 0, GRID - 1);
      this.cursor.cy = Phaser.Math.Clamp(this.cursor.cy + dy, 0, GRID - 1);
      SFX.tap();
      if (this.phase === 'build') this.updateGhost(this.cursor.cx, this.cursor.cy);
    };
    on('LEFT', () => move(-1, 0));
    on('RIGHT', () => move(1, 0));
    on('UP', () => move(0, -1));
    on('DOWN', () => move(0, 1));
    on('A', () => move(-1, 0));
    on('D', () => move(1, 0));
    on('W', () => move(0, -1));
    on('S', () => move(0, 1));

    const act = () => {
      if (hasFocusedButton(this)) return;
      if (this.firstTimeModal && this.firstTimeModal.visible) {
        this.closeFirstTimeGuide();
        return;
      }
      if (this.repairConfirm && this.repairConfirm.visible) {
        this.executePendingRepair();
        return;
      }
      if (this.phase === 'siege' && this.aidArmed) { this.callAid(this.cursor.cx, this.cursor.cy); return; }
      if (this.phase !== 'build') return;
      const { cx, cy } = this.cursor;
      if (this.tool === 'sell') this.sellAt(cx, cy);
      else if (this.tool === 'repair') this.repairAt(cx, cy);
      else this.placeAt(this.selected, cx, cy);
    };
    on('SPACE', act);
    on('ENTER', act);
    on('ONE', () => this.pick(0));
    on('TWO', () => this.pick(1));
    on('THREE', () => this.pick(2));
    on('FOUR', () => this.pick(3));
    on('FIVE', () => this.pick(4));
    on('SIX', () => this.pick(5));
    on('SEVEN', () => this.pick(6));
  }

  pick(i) {
    const key = PALETTE_ORDER[i];
    if (!key) return;
    this.usedKeyboard = true;
    this.selectPiece(key);
  }

  cyclePiece(dir) {
    const unlocked = unlockedBuildings(this.wave);
    const avail = PALETTE_ORDER.filter((k) => BUILDINGS[k].unlockAt <= unlocked);
    let i = avail.indexOf(this.selected);
    i = (i + dir + avail.length) % avail.length;
    this.usedKeyboard = true;
    this.selectPiece(avail[i]);
  }
}
