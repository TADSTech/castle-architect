import Phaser from 'phaser';
import { C, FONT } from '../config/palette.js';
import { CHAOS_CONFIG, CHAOS_WHEEL_SLICES } from '../config/chaos.js';
import { button, label, toast, displayLabel, hex } from './ui.js';

export default class WheelOfChaos {
  /**
   * @param {import('../scenes/GameScene.js').default} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.isSpinning = false;
    this.currentAngle = 0;
    this.container = null;
    this.slices = CHAOS_WHEEL_SLICES;
    this.lastLandedSlice = null;
    this.buildModal();
  }

  buildModal() {
    const sc = this.scene;
    const { W, H, isLandscape } = sc.L;

    this.container = sc.add.container(0, 0).setDepth(800).setVisible(false);

    // Dark blurred backdrop
    this.backdrop = sc.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9).setInteractive();
    this.container.add(this.backdrop);

    if (isLandscape) {
      this.buildLandscapeLayout();
    } else {
      this.buildPortraitLayout();
    }
  }

  buildLandscapeLayout() {
    const sc = this.scene;
    const { W, H } = sc.L;

    const modalW = 1180;
    const modalH = 640;

    // Main Modal Card
    const frameShadow = sc.add.rectangle(W / 2 + 10, H / 2 + 10, modalW, modalH, C.ink, 1);
    const frame = sc.add.rectangle(W / 2, H / 2, modalW, modalH, C.paper, 1).setStrokeStyle(4, C.ink, 1);
    const topGlow = sc.add.rectangle(W / 2, H / 2 - modalH / 2 + 6, modalW - 24, 5, C.crimson, 1);
    this.container.add([frameShadow, frame, topGlow]);

    // === LEFT COLUMN: THE WHEEL ===
    this.wheelX = W / 2 - 270;
    this.wheelY = H / 2 + 10;
    this.radius = 205;

    this.wheelGroup = sc.add.container(this.wheelX, this.wheelY);
    this.container.add(this.wheelGroup);

    this.drawWheelSlices();
    this.drawWheelRim();

    // === RIGHT COLUMN: CONTROLS & PRIZE SUMMARY ===
    const rightX = W / 2 + 270;

    // Title
    const title = displayLabel(sc.add, rightX, H / 2 - 240, '🎲 WHEEL OF CHAOS 🎲', 32, C.ink).setFontStyle('bold');
    const sub = label(sc.add, rightX, H / 2 - 200, 'Spin to draft defenses and trigger chaotic anomalies!', 15, C.inkSoft);
    this.container.add([title, sub]);

    // Prize Card (Shows landed reward)
    this.prizeCardBg = sc.add.rectangle(rightX, H / 2 - 90, 480, 130, C.ink, 1).setStrokeStyle(3, C.crimson, 1);
    this.prizeTitle = label(sc.add, rightX, H / 2 - 120, 'READY TO SPIN', 24, C.gold).setFontStyle('bold');
    this.prizeDesc = sc.add.text(rightX, H / 2 - 75, 'Click SPIN below to draw your fortress reinforcements!', {
      fontFamily: FONT, fontSize: '15px', color: hex(C.paper2), align: 'center', wordWrap: { width: 440 }, lineSpacing: 3, resolution: 2,
    }).setOrigin(0.5);
    this.container.add([this.prizeCardBg, this.prizeTitle, this.prizeDesc]);

    // Spin Counter Badge
    this.spinsBadgeBg = sc.add.rectangle(rightX, H / 2 + 10, 480, 42, C.ink, 1).setStrokeStyle(2, C.crimson, 1);
    this.spinsCountLabel = label(sc.add, rightX, H / 2 + 10, '', 18, C.gold).setFontStyle('bold');
    this.container.add([this.spinsBadgeBg, this.spinsCountLabel]);

    // Action Buttons
    this.spinBtn = button(sc, {
      x: rightX, y: H / 2 + 75, w: 480, h: 58,
      label: 'SPIN THE WHEEL', fontSize: 23, fill: C.lapis, stroke: C.ink,
      onClick: () => this.spin(),
    });

    const cost = CHAOS_CONFIG.spinPurchaseCostGold || 200;
    this.buySpinBtn = button(sc, {
      x: rightX, y: H / 2 + 145, w: 480, h: 54,
      label: `🪙 BUY SPIN (${cost} GOLD)`, fontSize: 20, fill: C.gold, stroke: C.ink,
      onClick: () => this.buySpin(),
    });

    this.doneBtn = button(sc, {
      x: rightX, y: H / 2 + 215, w: 480, h: 50,
      label: 'RETURN TO CASTLE BOARD', fontSize: 19, fill: C.paper2, stroke: C.ink,
      onClick: () => this.close(),
    });

    this.container.add([this.spinBtn, this.buySpinBtn, this.doneBtn]);
  }

  buildPortraitLayout() {
    const sc = this.scene;
    const { W, H } = sc.L;

    const modalW = 670;
    const modalH = 1080;

    // Main Modal Frame
    const frameShadow = sc.add.rectangle(W / 2 + 10, H / 2 + 10, modalW, modalH, C.ink, 1);
    const frame = sc.add.rectangle(W / 2, H / 2, modalW, modalH, C.paper, 1).setStrokeStyle(4, C.ink, 1);
    const topGlow = sc.add.rectangle(W / 2, H / 2 - modalH / 2 + 6, modalW - 24, 5, C.crimson, 1);
    this.container.add([frameShadow, frame, topGlow]);

    // Title (Pushed higher to give ample room for needle)
    const title = displayLabel(sc.add, W / 2, H / 2 - 485, '🎲 WHEEL OF CHAOS 🎲', 30, C.ink).setFontStyle('bold');
    const sub = label(sc.add, W / 2, H / 2 - 450, 'Spin to draft defenses & trigger anomalies!', 15, C.inkSoft);
    this.container.add([title, sub]);

    // Wheel Center (Y = H / 2 - 175)
    this.wheelX = W / 2;
    this.wheelY = H / 2 - 175;
    this.radius = 205;

    this.wheelGroup = sc.add.container(this.wheelX, this.wheelY);
    this.container.add(this.wheelGroup);

    this.drawWheelSlices();
    this.drawWheelRim();

    // Landed Prize Card
    this.prizeCardBg = sc.add.rectangle(W / 2, H / 2 + 125, 590, 110, C.ink, 1).setStrokeStyle(3, C.crimson, 1);
    this.prizeTitle = label(sc.add, W / 2, H / 2 + 100, 'READY TO SPIN', 22, C.gold).setFontStyle('bold');
    this.prizeDesc = sc.add.text(W / 2, H / 2 + 140, 'Tap SPIN THE WHEEL below to draft fortifications!', {
      fontFamily: FONT, fontSize: '14.5px', color: hex(C.paper2), align: 'center', wordWrap: { width: 550 }, lineSpacing: 2, resolution: 2,
    }).setOrigin(0.5);
    this.container.add([this.prizeCardBg, this.prizeTitle, this.prizeDesc]);

    // Spin Counter Badge
    this.spinsBadgeBg = sc.add.rectangle(W / 2, H / 2 + 205, 580, 44, C.ink, 1).setStrokeStyle(2, C.crimson, 1);
    this.spinsCountLabel = label(sc.add, W / 2, H / 2 + 205, '', 19, C.gold).setFontStyle('bold');
    this.container.add([this.spinsBadgeBg, this.spinsCountLabel]);

    // Action Buttons
    this.spinBtn = button(sc, {
      x: W / 2, y: H / 2 + 280, w: 580, h: 68,
      label: 'SPIN THE WHEEL', fontSize: 25, fill: C.lapis, stroke: C.ink,
      onClick: () => this.spin(),
    });

    const cost = CHAOS_CONFIG.spinPurchaseCostGold || 200;
    this.buySpinBtn = button(sc, {
      x: W / 2, y: H / 2 + 358, w: 580, h: 60,
      label: `🪙 BUY EXTRA SPIN (${cost} GOLD)`, fontSize: 22, fill: C.gold, stroke: C.ink,
      onClick: () => this.buySpin(),
    });

    this.doneBtn = button(sc, {
      x: W / 2, y: H / 2 + 432, w: 580, h: 54,
      label: 'RETURN TO CASTLE BOARD', fontSize: 20, fill: C.paper2, stroke: C.ink,
      onClick: () => this.close(),
    });

    this.container.add([this.spinBtn, this.buySpinBtn, this.doneBtn]);
  }

  drawWheelSlices() {
    const sc = this.scene;
    const sliceCount = this.slices.length;
    const sliceAngle = (Math.PI * 2) / sliceCount;

    this.slicesGraphics = sc.add.graphics();
    this.wheelGroup.add(this.slicesGraphics);

    this.slices.forEach((slice, i) => {
      const startA = i * sliceAngle;
      const endA = (i + 1) * sliceAngle;
      const midA = (startA + endA) / 2;

      // Draw wedge
      this.slicesGraphics.fillStyle(slice.color, 1);
      this.slicesGraphics.beginPath();
      this.slicesGraphics.moveTo(0, 0);
      this.slicesGraphics.arc(0, 0, this.radius, startA, endA);
      this.slicesGraphics.closePath();
      this.slicesGraphics.fillPath();

      // Outer edge accent band
      this.slicesGraphics.lineStyle(6, slice.accentColor || C.gold, 0.9);
      this.slicesGraphics.beginPath();
      this.slicesGraphics.arc(0, 0, this.radius - 3, startA, endA);
      this.slicesGraphics.strokePath();

      // Divider line
      this.slicesGraphics.lineStyle(2, C.ink, 1);
      this.slicesGraphics.beginPath();
      this.slicesGraphics.moveTo(0, 0);
      this.slicesGraphics.lineTo(Math.cos(startA) * this.radius, Math.sin(startA) * this.radius);
      this.slicesGraphics.strokePath();

      // 1. Icon placed inner/mid (dist = 0.44 * radius = ~90px, well clear of 40px center hub)
      const iconDist = this.radius * 0.42;
      const ix = Math.cos(midA) * iconDist;
      const iy = Math.sin(midA) * iconDist;

      if (slice.icon && sc.textures.exists(slice.icon)) {
        const img = sc.add.image(ix, iy, slice.icon).setDisplaySize(28, 28).setRotation(midA + Math.PI / 2);
        this.wheelGroup.add(img);
      } else {
        let sym = '🎲';
        if (slice.id === 'overcharge') sym = '⚡';
        else if (slice.id === 'gremlin_upg') sym = '🔨';
        else if (slice.id === 'quake') sym = '🌋';
        else if (slice.id === 'sabotage') sym = '🌪️';
        else if (slice.id === 'frenzy') sym = '🧪';
        else if (slice.id === 'extra_spins') sym = '🎰';
        const symTxt = sc.add.text(ix, iy, sym, { fontSize: '20px', resolution: 2 }).setOrigin(0.5).setRotation(midA + Math.PI / 2);
        this.wheelGroup.add(symTxt);
      }

      // 2. Text placed outer area (dist = 0.74 * radius = ~152px)
      const textDist = this.radius * 0.74;
      const tx = Math.cos(midA) * textDist;
      const ty = Math.sin(midA) * textDist;

      const isDisaster = slice.type === 'disaster';
      const txt = sc.add.text(tx, ty, slice.label, {
        fontFamily: FONT,
        fontSize: '11px',
        color: hex(isDisaster ? C.paper : C.white),
        fontStyle: 'bold',
        stroke: hex(C.shadow),
        strokeThickness: 3,
        align: 'center',
        lineSpacing: -2,
        resolution: 2,
      }).setOrigin(0.5, 0.5).setRotation(midA + Math.PI / 2);

      this.wheelGroup.add(txt);
    });
  }

  drawWheelRim() {
    const sc = this.scene;

    // Ornate outer bezel
    this.outerRim = sc.add.graphics();
    this.outerRim.lineStyle(10, C.gold, 1);
    this.outerRim.strokeCircle(this.wheelX, this.wheelY, this.radius + 5);
    this.outerRim.lineStyle(3, C.paper, 0.8);
    this.outerRim.strokeCircle(this.wheelX, this.wheelY, this.radius + 10);
    this.container.add(this.outerRim);

    // Glowing Bezel Studs / Bulbs
    const studCount = 16;
    for (let i = 0; i < studCount; i++) {
      const angle = (i / studCount) * Math.PI * 2;
      const sx = this.wheelX + Math.cos(angle) * (this.radius + 5);
      const sy = this.wheelY + Math.sin(angle) * (this.radius + 5);
      const bulb = sc.add.circle(sx, sy, 4, C.white, 0.95);
      this.container.add(bulb);
    }

    // Top Needle Pointer (Clean, compact golden & ruby arrow with clearance)
    this.pointer = sc.add.polygon(
      this.wheelX,
      this.wheelY - this.radius - 8,
      [
        { x: -14, y: -20 },
        { x: 14, y: -20 },
        { x: 0, y: 15 },
      ],
      C.red,
      1
    ).setStrokeStyle(3, C.gold, 1);
    this.container.add(this.pointer);

    // Center Hub (Golden Bezel + Ruby Gem)
    this.centerHubOuter = sc.add.circle(this.wheelX, this.wheelY, 42, C.gold, 1).setStrokeStyle(3, C.paper, 1);
    this.centerHubInner = sc.add.circle(this.wheelX, this.wheelY, 34, C.bgDeep, 1).setStrokeStyle(2, C.lapis, 1);
    this.centerHubText = label(sc.add, this.wheelX, this.wheelY, 'SPIN', 17, C.gold).setFontStyle('bold');
    this.container.add([this.centerHubOuter, this.centerHubInner, this.centerHubText]);

    this.centerHubInner.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.spin());
  }

  open() {
    const sc = this.scene;
    this.updateSpinsDisplay();
    this.container.setVisible(true);
    this.container.setAlpha(0);
    sc.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 220,
      ease: 'Quad.Out',
    });
  }

  close() {
    if (this.isSpinning) return;
    const sc = this.scene;
    sc.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 180,
      ease: 'Quad.In',
      onComplete: () => {
        this.container.setVisible(false);
        sc.refreshPaletteCounts();
        sc.refreshHUD();
      },
    });
  }

  updateSpinsDisplay() {
    const sc = this.scene;
    const count = sc.chaosSpins || 0;
    const gold = Math.floor(sc.gold || 0);
    const cost = CHAOS_CONFIG.spinPurchaseCostGold || 200;

    this.spinsCountLabel.setText(`🎡 SPINS: ${count}   |   💰 TREASURY: ${gold}g`);
    this.spinsCountLabel.setColor(count > 0 ? hex(C.gold) : hex(C.red));

    if (this.spinBtn && this.spinBtn.label) {
      this.spinBtn.label.setText(count > 0 ? `SPIN THE WHEEL (${count} LEFT)` : 'NO SPINS LEFT');
    }
    if (this.spinBtn) {
      this.spinBtn.setEnabled(count > 0 && !this.isSpinning);
    }
    if (this.buySpinBtn && this.buySpinBtn.label) {
      this.buySpinBtn.label.setText(`🪙 BUY EXTRA SPIN (${cost} GOLD)`);
    }
    if (this.buySpinBtn) {
      this.buySpinBtn.setEnabled(!this.isSpinning);
    }
  }

  buySpin() {
    if (this.isSpinning) return;
    const sc = this.scene;
    const cost = CHAOS_CONFIG.spinPurchaseCostGold || 200;
    const currentGold = Math.floor(sc.gold || 0);

    if (currentGold < cost) {
      if (sc.SFX && sc.SFX.deny) sc.SFX.deny();
      toast(sc, sc.L.W / 2, sc.L.isLandscape ? 360 : 480, `Need ${cost}g to buy a spin! (You have: ${currentGold}g)`, hex(C.crimson), 22);
      return;
    }

    sc.gold -= cost;
    sc.chaosSpins = (sc.chaosSpins || 0) + 1;
    if (sc.SFX && sc.SFX.gold) sc.SFX.gold();
    if (sc.fx && sc.fx.burst) {
      sc.fx.burst(this.wheelX, this.wheelY, C.gold, 25, { speed: 190, life: 550 });
    }
    this.updateSpinsDisplay();
    sc.refreshPaletteCounts();
    sc.refreshHUD();
    toast(sc, sc.L.W / 2, sc.L.isLandscape ? 360 : 480, `+1 Wheel Spin Purchased! (-${cost}g)`, hex(C.green), 24);
  }

  spin() {
    if (this.isSpinning) return;
    const sc = this.scene;
    if ((sc.chaosSpins || 0) <= 0) {
      toast(sc, sc.L.W / 2, 400, 'No Wheel Spins left! Clear sieges or buy with gold.', hex(C.crimson), 24);
      sc.SFX.deny();
      return;
    }

    sc.chaosSpins--;
    this.isSpinning = true;
    this.updateSpinsDisplay();
    sc.SFX.gold();

    // Reset card title to spinning status
    this.prizeTitle.setText('SPINNING THE WHEEL...');
    this.prizeTitle.setColor(hex(C.gold));
    this.prizeDesc.setText('The chaotic powers of the realm are aligning...');

    const sliceCount = this.slices.length;
    const sliceAngle = (Math.PI * 2) / sliceCount;
    const targetIndex = Phaser.Math.Between(0, sliceCount - 1);
    const chosenSlice = this.slices[targetIndex];

    // Pointer is located at top (-PI/2 or 270 deg)
    const targetMidAngle = (targetIndex + 0.5) * sliceAngle;
    const baseTargetAngle = (3 * Math.PI / 2) - targetMidAngle;

    const fullRotations = Phaser.Math.Between(4, 6) * Math.PI * 2;
    const finalAngle = this.currentAngle + fullRotations + (baseTargetAngle - (this.currentAngle % (Math.PI * 2)));

    let lastTickAngle = this.currentAngle;
    const tickInterval = sliceAngle;

    sc.tweens.add({
      targets: this,
      currentAngle: finalAngle,
      duration: 3200,
      ease: 'Cubic.Out',
      onUpdate: () => {
        if (this.wheelGroup && this.wheelGroup.active) {
          this.wheelGroup.setRotation(this.currentAngle);
        }

        if (Math.abs(this.currentAngle - lastTickAngle) >= tickInterval) {
          lastTickAngle = this.currentAngle;
          if (this.pointer && this.pointer.active) {
            this.pointer.setScale(1.25, 0.85);
            sc.tweens.add({ targets: this.pointer, scaleX: 1, scaleY: 1, duration: 60 });
          }
          if (sc.SFX && sc.SFX.tick) sc.SFX.tick();
          else if (sc.SFX && sc.SFX.tap) sc.SFX.tap();
        }
      },
      onComplete: () => {
        this.isSpinning = false;
        this.onSpinResult(chosenSlice);
      },
    });
  }

  onSpinResult(slice) {
    const sc = this.scene;
    const isDisaster = slice.type === 'disaster';

    if (sc.fx && sc.fx.burst) {
      sc.fx.burst(this.wheelX, this.wheelY, isDisaster ? C.red : C.gold, 35, { speed: 220, life: 600 });
    }
    if (isDisaster) {
      if (sc.SFX && sc.SFX.boom) sc.SFX.boom();
      this.prizeTitle.setText(slice.header || slice.label.replace('\n', ' '));
      this.prizeTitle.setColor(hex(C.red));
    } else {
      if (sc.SFX && sc.SFX.synergy) sc.SFX.synergy();
      this.prizeTitle.setText(`🎉 WON: ${slice.header || slice.label.replace('\n', ' ')}`);
      this.prizeTitle.setColor(hex(C.green));
    }

    if (slice.id === 'extra_spins') {
      const bonusAwarded = sc.chaosExtraSpinsBonus ?? 3;
      if (slice.apply) slice.apply(sc);
      const nextYield = sc.chaosExtraSpinsBonus ?? 1;
      this.prizeTitle.setText(`🎰 +${bonusAwarded} EXTRA SPINS!`);
      this.prizeTitle.setColor(hex(C.gold));
      this.prizeDesc.setText(`Fortune smiles! +${bonusAwarded} spins added to your reserve. (Next extra spin this siege: +${nextYield} spin${nextYield > 1 ? 's' : ''})`);
      toast(sc, sc.L.W / 2, sc.L.isLandscape ? 360 : 480, `🎰 +${bonusAwarded} EXTRA SPINS AWARDED!`, hex(C.gold), 26);
    } else {
      // Apply outcome
      if (slice.type === 'draft' && slice.buildings) {
        for (const [key, count] of Object.entries(slice.buildings)) {
          sc.chaosInventory[key] = (sc.chaosInventory[key] || 0) + count;
        }
      } else if (slice.apply) {
        slice.apply(sc);
      }
      toast(sc, sc.L.W / 2, sc.L.isLandscape ? 360 : 480, isDisaster ? `⚠️ ${slice.header || slice.label.replace('\n', ' ')}!` : `🎉 ${slice.header || slice.label.replace('\n', ' ')} AWARDED!`, isDisaster ? hex(C.crimson) : hex(C.gold), 26);
    }

    this.updateSpinsDisplay();
    sc.refreshPaletteCounts();
    sc.refreshHUD();
  }
}
