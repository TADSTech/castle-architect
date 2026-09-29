import Phaser from 'phaser';
import { BUILDINGS } from '../config/buildings.js';
import { CELL, BOARD_X, BOARD_Y, GRID, C } from '../config/palette.js';

export function cellCenter(cx, cy) {
  return { x: BOARD_X + cx * CELL + CELL / 2, y: BOARD_Y + cy * CELL + CELL / 2 };
}

export default class Building {
  /**
   * @param {import('../scenes/GameScene.js').default} scene
   * @param {string} key  BUILDINGS key
   * @param {number} cx   top-left column
   * @param {number} cy   top-left row
   */
  constructor(scene, key, cx, cy) {
    this.scene = scene;
    this.key = key;
    this.def = BUILDINGS[key];
    this.cx = cx;
    this.cy = cy;
    this.size = key === 'keep' ? 2 : 1;
    this.cells = [];
    for (let y = 0; y < this.size; y++)
      for (let x = 0; x < this.size; x++)
        this.cells.push((cy + y) * GRID + (cx + x));

    this.maxHp = this.def.hp;
    this.hp = this.def.hp;
    this.tier = 1;

    // synergy flags (recomputed by scene.evaluateSynergies)
    this.reinforced = false;
    this.emplaced = false;
    this.braced = false;
    this.plated = false;

    this.fireTimer = 0;
    this.flashT = 0;
    this.dead = false;

    const w = this.size * CELL;
    const c = cellCenter(cx + this.size / 2 - 0.5, cy + this.size / 2 - 0.5);
    this.x = c.x;
    this.y = c.y;

    const texKey = this.textureKey();
    this.sprite = scene.add.image(this.x, this.y, texKey).setDepth(10);
    this.sprite.setDisplaySize(w, w);

    this.tierBadge = scene.add.rectangle(this.x + w * 0.32, this.y - w * 0.32, 14, 14, C.gold, 1)
      .setStrokeStyle(1.5, 0x000000).setDepth(16).setVisible(false);

    this.shadow = scene.add.ellipse(this.x, this.y + w * 0.34, w * 0.86, w * 0.3, 0x000000, 0.35).setDepth(9);

    // small hp pip shown only once damaged
    this.hpBg = scene.add.rectangle(this.x, this.y + w * 0.44, w * 0.8, 7, 0x0b0a12, 0.85).setDepth(14).setVisible(false);
    this.hpFg = scene.add.rectangle(this.x - w * 0.4, this.y + w * 0.44, w * 0.8, 5, C.green, 1).setOrigin(0, 0.5).setDepth(15).setVisible(false);

    // synergy sparkle (hidden mechanic tell)
    this.ring = scene.add.image(this.x, this.y, 'ring').setDepth(12).setAlpha(0).setDisplaySize(w * 1.1, w * 1.1);

    // pop-in
    const targetScaleY = this.sprite.scaleY;
    this.sprite.setScale(this.sprite.scaleX, Math.max(0.02, targetScaleY * 0.15));
    scene.tweens.add({ targets: this.sprite, scaleY: targetScaleY, duration: 260, ease: 'Back.Out' });
  }

  upgradeToTier2(upgradedDef) {
    if (this.tier >= 2 || !upgradedDef) return false;
    this.tier = 2;
    this.upgradedDef = upgradedDef;
    const hpBoost = upgradedDef.hp - this.def.hp;
    this.maxHp = Math.max(this.maxHp, upgradedDef.hp);
    this.hp = Math.min(this.maxHp, this.hp + Math.max(20, hpBoost));
    this.tierBadge.setVisible(true);
    this.updateHpBar();
    return true;
  }

  textureKey() {
    if (this.key === 'wall') return this.reinforced ? 'b_wall2' : 'b_wall';
    if (this.key === 'cannon') return this.emplaced ? 'b_cannon' : 'b_cannon_idle';
    if (this.key === 'keep') return 'b_keep';
    return 'b_' + this.key;
  }

  refreshTexture() {
    const k = this.textureKey();
    if (this.sprite.texture.key !== k) this.sprite.setTexture(k);
  }

  get center() {
    return { x: this.x, y: this.y };
  }

  damage(amount, cause = 'hit') {
    if (this.dead) return;
    let actualAmount = amount;
    if (this.key === 'keep' && (this.scene.chaosAegis || 0) > 0) {
      const absorb = Math.min(this.scene.chaosAegis, actualAmount);
      this.scene.chaosAegis -= absorb;
      actualAmount -= absorb;
      this.scene.fx.burst(this.x, this.y, 0x1abc9c, 12, { speed: 140, life: 300 });
      if (actualAmount <= 0) return;
    }
    const wasAlive = this.hp > 0;
    this.hp -= actualAmount;
    this.flashT = 0.12;
    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    if (!this.hpBg.visible) { this.hpBg.setVisible(true); this.hpFg.setVisible(true); }
    this.updateHpBar();
    this.scene.onBuildingHit(this, actualAmount, cause);
    if (this.hp <= 0 && wasAlive) this.scene.destroyBuilding(this);
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.updateHpBar();
    if (this.hp >= this.maxHp) { this.hpBg.setVisible(false); this.hpFg.setVisible(false); }
  }

  updateHpBar() {
    const w = this.size * CELL * 0.8;
    const r = Math.max(0, this.hp / this.maxHp);
    this.hpFg.setSize(Math.max(1, w * r), 5);
    const col = r > 0.55 ? C.green : r > 0.25 ? C.gold : C.red;
    this.hpFg.setFillStyle(col, 1);
  }

  update(dt) {
    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashT <= 0) this.sprite.clearTint();
    }
    if (this.ring.alpha > 0) this.ring.alpha = Math.max(0, this.ring.alpha - dt * 1.6);
  }

  pulseSynergy() {
    this.ring.setAlpha(0.85);
  }

  /** Position enemies should stand at to melee this piece. */
  meleeSpots() {
    const spots = [];
    const s = this.size;
    for (let i = 0; i < s; i++) {
      spots.push([this.cx + i, this.cy - 1]);
      spots.push([this.cx + i, this.cy + s]);
      spots.push([this.cx - 1, this.cy + i]);
      spots.push([this.cx + s, this.cy + i]);
    }
    return spots;
  }

  destroy(quiet = false) {
    if (this.dead) return;
    this.dead = true;
    this.scene.rubbleBurst(this.x, this.y, this.key);
    this.scene.tweens.add({
      targets: [this.sprite, this.shadow, this.hpBg, this.hpFg, this.ring, this.tierBadge],
      alpha: 0, scale: '+=0.25', angle: (Math.random() - 0.5) * 40, duration: 300,
      ease: 'Quad.In', onComplete: () => {
        [this.sprite, this.shadow, this.hpBg, this.hpFg, this.ring, this.tierBadge].forEach((o) => o?.destroy?.());
      },
    });
  }
}
