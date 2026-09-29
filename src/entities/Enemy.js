import Phaser from 'phaser';
import { ENEMIES } from '../config/enemies.js';
import { DIFFICULTY_CONFIG } from '../config/balance.js';
import { CELL, BOARD_X, BOARD_Y, GRID, C } from '../config/palette.js';
import { cellCenter } from './Building.js';
import { findPath, linePath } from '../systems/pathfinding.js';

export default class Enemy {
  /**
   * @param {import('../scenes/GameScene.js').default} scene
   * @param {string} type   ENEMIES key
   * @param {number} col    spawn column
   * @param {number} hpScale
   * @param {number} dmgScale
   */
  constructor(scene, type, col, hpScale = 1, dmgScale = 1) {
    this.scene = scene;
    this.key = type;
    this.def = ENEMIES[type] || ENEMIES.raider;
    const hpMul = (scene.enemyHpBuff || 1) * hpScale * (DIFFICULTY_CONFIG.globalEnemyHpMultiplier || 1);
    const dmgMul = (scene.enemyDmgBuff || 1) * dmgScale * (DIFFICULTY_CONFIG.globalEnemyDmgMultiplier || 1);
    this.maxHp = Math.round(this.def.hp * hpMul);
    this.hp = this.maxHp;
    this.speed = this.def.speed * (scene.enemySpeedBuff || 1) * (DIFFICULTY_CONFIG.globalEnemySpeedMultiplier || 1);
    this.damageToPlayer = this.def.damage * dmgMul;
    this.buildDmg = this.def.buildDmg * dmgMul;
    this.boss = !!this.def.boss;
    this.flyer = !!this.def.flyer;

    this.cell = col; // spawn cell index (row 0)
    const c = cellCenter(col, 0);
    this.x = c.x;
    this.y = BOARD_Y - 34;
    this.homeY = this.y;

    this.path = null;
    this.pi = 1;
    this.pathVer = -1;
    this.attackTimer = 0;
    this.markedUntil = 0;
    this.slowUntil = 0;
    this.slowMul = 1;
    this.dotTimer = 0;
    this.flashT = 0;
    this.dead = false;
    this.removed = false;
    this.bob = Math.random() * Math.PI * 2;
    this.lunge = 0;

    // Tactical AI state
    this.rallyUntil = 0;
    this.sprintUntil = 0;
    this.ignited = false;
    this.enraged = false;
    this.roarCooldown = 3.0;
    this.commandCooldown = 5.0;
    this.diveAttackDone = false;
    this.flockOffsetX = 0;
    this.flockOffsetY = 0;

    const s = this.def.size * 2;
    const barW = Math.max(34, s * 0.7);
    this.shadow = scene.add.ellipse(this.x, this.y + s * 0.42, s * 0.9, s * 0.32, 0x000000, 0.34).setDepth(11);
    this.sprite = scene.add.image(this.x, this.y, 'e_' + type).setDepth(20);
    this.hpBg = scene.add.rectangle(this.x, this.y - s * 0.58, barW, 5, 0x0b0a12, 0.9).setDepth(22).setVisible(false);
    this.hpFg = scene.add.rectangle(this.x - barW / 2, this.y - s * 0.58, barW, 3, C.red, 1).setOrigin(0, 0.5).setDepth(23).setVisible(false);

    this.sprite.setScale(0.1);
    scene.tweens.add({ targets: this.sprite, scale: 1, duration: 220, ease: 'Back.Out' });

    this.baseShadowW = s * 0.9;
    this.size = s;
    this.barW = barW;
  }

  get def() {
    return this._def || ENEMIES[this.key] || ENEMIES.raider;
  }

  set def(v) {
    this._def = v;
  }

  // ---- pathing ------------------------------------------------------------
  computePath() {
    const sc = this.scene;
    const g = sc.grid;
    const keep = sc.keep;

    if (!keep || keep.dead) { this.path = null; return; }

    if (this.flyer) {
      const keepSet = new Set(keep.cells);
      this.path = linePath(this.cell, keep.cells[0], (c) => keepSet.has(c));
      this.pi = 1;
      this.mode = 'fly';
      this.pathVer = sc.gridVersion;
      return;
    }

    const hx = keep.cx, hy = keep.cy + 1;
    const strictBlocked = (i) => { const b = g[i]; return !!b && !b.def.walkable; };

    // Intelligent hazard avoidance: Enemies prefer dodging lethal traps, burning/slow moats, and spiked gates
    if (sc.goalFree.length) {
      const goalSet = sc.goalFreeSet;
      const walkCost = (i) => {
        const b = g[i];
        if (!b) return 1;
        // Traps trigger lethal explosions -> heavy avoidance penalty
        if (b.key === 'trap') return 12;
        // Moats slow down & deal water/magma damage -> avoidance penalty
        if (b.key === 'moat') return 8;
        // Gates mark and slow enemies -> avoidance penalty
        if (b.key === 'gate') return 6;
        return 1;
      };
      const p = findPath(this.cell, (i) => goalSet.has(i), strictBlocked, walkCost, hx, hy);
      if (p) { this.path = p; this.pi = 1; this.mode = 'walk'; this.pathVer = sc.gridVersion; return; }
    }

    // Nothing get-through: break something.
    const keepSet = new Set(keep.cells);
    const breachBlocked = (i) => keepSet.has(i);
    const breachCost = (i) => {
      const b = g[i];
      if (!b) return 1;
      if (b.key === 'trap') return 14;
      if (b.key === 'moat') return 8;
      if (b.key === 'gate') return 6;
      if (b.def.walkable) return 1;
      // Brutes and Sappers target walls aggressively
      if (this.key === 'brute') return Math.max(1, 5 - b.def.aggro);
      if (this.key === 'sapper') return Math.max(1, 3 - b.def.aggro);
      return Math.max(3, 10 - b.def.aggro * 1.0);
    };
    const goalAll = sc.goalAllSet;
    const p = findPath(this.cell, (i) => goalAll.has(i), breachBlocked, breachCost, hx, hy);
    this.path = p;
    this.pi = 1;
    this.mode = p ? 'breach' : 'stuck';
    this.pathVer = sc.gridVersion;
  }

  currentCellIndex() {
    return this.cell;
  }

  // ---- per-frame ----------------------------------------------------------
  update(dt) {
    if (this.dead) return;
    const sc = this.scene;

    if (this.pathVer !== sc.gridVersion) this.computePath();

    this.bob += dt * (this.flyer ? 8 : 0);
    this.flashT = Math.max(0, this.flashT - dt);
    if (this.flashT <= 0 && this._tinted) {
      if (this.enraged) {
        this.sprite.setTint(0xff5544);
      } else if (this.ignited) {
        this.sprite.setTint(0xffaa22);
      } else {
        this.sprite.clearTint();
        this._tinted = false;
      }
    }

    // --- ground effects ---
    const here = sc.grid[this.cell];
    let slow = 1;
    if (here && here.key === 'moat') {
      slow = here.tier === 2 ? 0.32 : 0.42;
      this.dotTimer += dt;
      if (this.dotTimer >= 0.5) {
        this.dotTimer -= 0.5;
        const baseMoatDmg = here.tier === 2 ? 14 : 7;
        const moatDmg = sc.chaosMagma ? baseMoatDmg * 3 : baseMoatDmg;
        this.damage(moatDmg, 'moat', false);
        if (sc.chaosMagma) {
          sc.fx.burst(this.x, this.y, 0xd9483b, 8, { speed: 120, life: 400 });
        } else if (here.tier === 2) {
          sc.fx.burst(this.x, this.y, 0xe87a38, 4, { speed: 80, life: 300 });
        } else {
          sc.fx.splash(this.x, this.y);
        }
      }
    } else if (here && here.key === 'gate') {
      slow = here.tier === 2 ? 0.45 : 0.65;
    }
    if (sc.now() < this.slowUntil && !this.enraged) slow *= this.slowMul;
    this.slow = slow;

    // --- special AI abilities & triggers ---
    this.updateAIAbilities(dt, sc, here);

    // --- decide: attack keep / attack blocker / move ---
    let act = this.attackTarget();

    if (act) {
      // Sapper instant suicide blast on contact with target
      if (this.key === 'sapper') {
        this.detonateSapperOnContact(act, sc);
        return;
      }

      this.attackTimer -= dt;
      const isRallied = sc.now() < this.rallyUntil;
      const baseAttackInterval = this.boss ? (this.enraged ? 0.38 : 0.55) : (isRallied ? 0.52 : 0.7);

      if (this.attackTimer <= 0) {
        this.attackTimer = baseAttackInterval;
        this.lunge = 1;

        // Moat & Rampart tactical bonus: 50% less melee damage if enemy is standing in a moat
        let actualDmg = this.buildDmg;
        if (here && here.key === 'moat') actualDmg *= 0.5;
        if (this.key === 'brute') actualDmg *= 1.25; // Brute siege breaker bonus

        if (act === sc.keep) {
          sc.keep.damage(actualDmg, 'keep');
        } else {
          act.damage(actualDmg, 'enemy');
          // Iron Wall Tier 2 Spike counter-damage reflection
          if (act.tier === 2 && act.key === 'wall') {
            const reflect = Math.round(actualDmg * 0.35);
            this.damage(reflect, 'spikes', false);
            sc.fx.burst(this.x, this.y, 0xdcd7eb, 3, { speed: 100, life: 200 });
          }
        }

        // Warlord Shockwave Cleave to nearby buildings
        if (this.boss) {
          this.executeWarlordCleave(act, actualDmg * 0.4, sc);
        }

        sc.SFX.hurt();
      }
      // hold position while battering
      this.moveTowards(cellCenterOf(this.cell), dt, 0.35);
    } else {
      this.followPath(dt, slow);
    }

    if (this.lunge > 0) {
      this.lunge = Math.max(0, this.lunge - dt * 6);
      this.sprite.setScale(1 + this.lunge * 0.18, 1 - this.lunge * 0.12);
    } else if (Math.abs(this.sprite.scaleY - 1) > 0.01 && !this._scaling) {
      this.sprite.setScale(1);
    }

    // Soft flocking visual separation
    this.updateFlockingOffset(dt, sc);

    this.sprite.setPosition(this.x + this.flockOffsetX, this.y + this.flockOffsetY + (this.flyer ? Math.sin(this.bob) * 6 : 0));
    this.shadow.setPosition(this.x + this.flockOffsetX, this.y + this.size * 0.42);
    this.shadow.setScale(1, this.flyer ? 0.7 : 1);
    this.hpBg.setPosition(this.x, this.y - this.size * 0.58);
    this.hpFg.setPosition(this.x - this.barW / 2, this.y - this.size * 0.58);
    this.sprite.setDepth(20 + this.cell / GRID * 0.01);
  }

  updateAIAbilities(dt, sc, here) {
    const now = sc.now();

    // 1. Sapper Prime & Charge Mode
    if (this.key === 'sapper' && !this.ignited) {
      const hpPercent = this.hp / this.maxHp;
      const distToKeep = sc.keep ? Phaser.Math.Distance.Between(this.x, this.y, sc.keep.x, sc.keep.y) : 999;
      if (hpPercent <= 0.4 || distToKeep < CELL * 2.2) {
        this.ignited = true;
        this.speed *= 1.45;
        this.sprite.setTint(0xffaa22);
        this._tinted = true;
        sc.fx.burst(this.x, this.y, 0xff7700, 8, { speed: 110, life: 300 });
      }
    }
    if (this.ignited && Math.random() < 0.3) {
      sc.fx.burst(this.x, this.y - 10, 0xffaa00, 2, { speed: 60, life: 180 });
    }

    // 2. Brute Siege War Roar
    if (this.key === 'brute') {
      this.roarCooldown -= dt;
      if (this.roarCooldown <= 0 && this.attackTarget()) {
        this.roarCooldown = 3.2;
        sc.fx.ring(this.x, this.y, 0x8f5fd6, 110);
        sc.shake(0.15, 0.005);
        // Rally nearby ally infantry
        for (const e of sc.enemies) {
          if (e === this || e.dead) continue;
          if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= 120) {
            e.rallyUntil = now + 3000;
            sc.fx.burst(e.x, e.y, 0xe8b73a, 3, { speed: 80, life: 200 });
          }
        }
      }
    }

    // 3. Warlord High Commander Abilities
    if (this.boss) {
      // Phase Enrage at <50% HP
      if (!this.enraged && this.hp / this.maxHp <= 0.5) {
        this.enraged = true;
        this.slowUntil = 0; // cleanse slow
        this.speed *= 1.25;
        this.sprite.setTint(0xff3322);
        this._tinted = true;
        sc.shake(0.4, 0.015);
        sc.fx.ring(this.x, this.y, C.crimson, 160);
        sc.fx.burst(this.x, this.y, C.crimson, 20, { speed: 220, life: 500 });
      }

      // Warhorn Command: Boost all minions
      this.commandCooldown -= dt;
      if (this.commandCooldown <= 0) {
        this.commandCooldown = 5.5;
        sc.fx.ring(this.x, this.y, C.gold, 200);
        sc.SFX.boom();
        for (const e of sc.enemies) {
          if (e.dead) continue;
          e.slowUntil = 0; // cleanse slows
          e.sprintUntil = now + 2500;
          sc.fx.burst(e.x, e.y, C.gold, 4, { speed: 90, life: 250 });
        }
      }
    }

    // 4. Harpy Aerial Dive Bomb
    if (this.flyer && !this.diveAttackDone && sc.keep) {
      const d = Phaser.Math.Distance.Between(this.x, this.y, sc.keep.x, sc.keep.y);
      if (d < CELL * 2.2) {
        this.diveAttackDone = true;
        this.speed *= 1.35;
        sc.fx.burst(this.x, this.y, 0x4ea3c9, 8, { speed: 140, life: 300 });
      }
    }
  }

  updateFlockingOffset(dt, sc) {
    let targetOffsetX = 0;
    let targetOffsetY = 0;
    for (const other of sc.enemies) {
      if (other === this || other.dead) continue;
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < 20 * 20 && distSq > 0.01) {
        const d = Math.sqrt(distSq);
        const push = (20 - d) / 20;
        targetOffsetX += (dx / d) * push * 6;
        targetOffsetY += (dy / d) * push * 6;
      }
    }
    this.flockOffsetX += (targetOffsetX - this.flockOffsetX) * Math.min(1, dt * 6);
    this.flockOffsetY += (targetOffsetY - this.flockOffsetY) * Math.min(1, dt * 6);
  }

  detonateSapperOnContact(act, sc) {
    this.die('sapper_charge');
  }

  executeWarlordCleave(mainTarget, cleaveDmg, sc) {
    for (const b of sc.buildings) {
      if (b === mainTarget || b.dead) continue;
      if (Phaser.Math.Distance.Between(b.x, b.y, this.x, this.y) <= CELL * 1.5) {
        b.damage(cleaveDmg, 'warlord_cleave');
        sc.fx.burst(b.x, b.y, C.crimson, 4, { speed: 100, life: 250 });
      }
    }
  }

  attackTarget() {
    const sc = this.scene;
    const keep = sc.keep;
    if (!keep || keep.dead) return null;

    if (this.flyer) {
      const done = !this.path || this.pi >= this.path.length;
      if (done || keep.cells.includes(this.cell)) return keep;
      const next = this.path[this.pi];
      if (sc.grid[next] === keep) return keep;
      return null;
    }

    if (sc.goalAllSet && sc.goalAllSet.has(this.cell)) return keep;

    const p = this.path;
    if (!p || this.pi >= p.length) {
      // Stuck / arrived: look for a blocking neighbour to chew through.
      const b = sc.nearestBlockingNeighbour(this.cell, false);
      if (b) return b;
      return null;
    }
    const next = p[this.pi];
    const b = sc.grid[next];
    if (b && !b.def.walkable) return b;
    return null;
  }

  followPath(dt, slow) {
    const p = this.path;
    if (!p) return;
    if (this.pi >= p.length) {
      // try to continue once neighbours clear
      if (this.pathVer !== this.scene.gridVersion) this.computePath();
      return;
    }
    const target = p[this.pi];
    const pos = cellCenterOf(target);
    const sprintMul = this.scene.now() < this.sprintUntil ? 1.35 : 1.0;
    const step = this.speed * slow * sprintMul * dt;
    const dx = pos.x - this.x, dy = pos.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d <= step) {
      this.x = pos.x; this.y = pos.y;
      this.cell = target;
      this.pi++;
      this.afterEnterCell();
    } else {
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
      // Face travel direction
      if (Math.abs(dx) > 4) this.sprite.setFlipX(dx < 0);
    }
  }

  moveTowards(pos, dt, mul) {
    const sprintMul = this.scene.now() < this.sprintUntil ? 1.35 : 1.0;
    const step = this.speed * (this.slow || 1) * sprintMul * mul * dt;
    const dx = pos.x - this.x, dy = pos.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return;
    if (d <= step) { this.x = pos.x; this.y = pos.y; return; }
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
  }

  afterEnterCell() {
    const sc = this.scene;
    const b = sc.grid[this.cell];
    if (!b) return;
    if (b.key === 'gate') {
      sc.markEnemy(this, b.tier === 2 ? 5000 : 3000);
      if (b.tier === 2) {
        this.damage(35, 'gate', true);
        this.slowUntil = sc.now() + 2200;
        this.slowMul = 0.35;
        sc.fx.burst(this.x, this.y, 0x9b7c2a, 6, { speed: 90, life: 300 });
      }
    }
    if (b.key === 'trap') sc.springTrap(b, this);
    if (b.key === 'moat') sc.fx.splash(this.x, this.y);
  }

  // ---- damage -------------------------------------------------------------
  damage(amount, source = null, notify = true) {
    if (this.dead) return;
    let amt = amount;
    const here = this.scene.grid[this.cell];
    if (this.scene.now() < this.markedUntil) amt *= 1.5;
    if (here && here.key === 'moat' && source !== 'moat') amt *= 1.4; // Waterlogged vulnerability
    this.hp -= amt;
    this.flashT = 0.09;
    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this._tinted = true;
    this.hpBg.setVisible(true); this.hpFg.setVisible(true);
    const r = Math.max(0, this.hp / this.maxHp);
    this.hpFg.setSize(Math.max(1, (this.barW || 34) * r), 3);
    this.hpFg.setFillStyle(r > 0.5 ? C.gold : C.red, 1);

    // Runner evasive sprint trigger on taking damage
    if (this.key === 'runner' && this.hp > 0 && Math.random() < 0.6) {
      this.sprintUntil = this.scene.now() + 1500;
      this.scene.fx.burst(this.x, this.y, 0xe8b73a, 3, { speed: 90, life: 200 });
    }

    if (notify) this.scene.onEnemyHit(this, amt, source);
    if (this.hp <= 0) this.die(source);
  }

  die(source) {
    if (this.dead) return;
    this.dead = true;
    const sc = this.scene;
    sc.onEnemyDeath(this, source);
    this.sprite.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    sc.tweens.add({
      targets: [this.sprite, this.hpBg, this.hpFg],
      alpha: 0, scale: 1.6, duration: 260, ease: 'Quad.Out',
      onComplete: () => this.remove(),
    });
    this.shadow.setVisible(false);
  }

  remove() {
    if (this.removed) return;
    this.removed = true;
    [this.sprite, this.shadow, this.hpBg, this.hpFg].forEach((o) => { if (o && o.destroy) o.destroy(); });
  }

  destroy() {
    this.dead = true;
    this.remove();
  }
}

function cellCenterOf(i) {
  const cx = i % GRID;
  const cy = (i / GRID) | 0;
  return cellCenter(cx, cy);
}
