import Phaser from 'phaser';
import { C, CHROME, W, H, FONT, TEXT_ON, getLayout } from '../config/palette.js';

const ON_CRIMSON = TEXT_ON.onCrimson.title;
import { button, label, displayLabel, toast, addPanel, hex } from '../systems/ui.js';
import { loadSave, writeSave, UPGRADES, buyUpgrade, resetSave } from '../systems/save.js';
import { SFX, startMusic, stopMusic, toggleSound, setMusicState } from '../systems/audio.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('menu'); }

  create() {
    this.save = loadSave();
    this.mode = 'root';
    this.L = getLayout(this);
    const { W, H, isLandscape } = this.L;
    setMusicState('ambience');

    if (isLandscape) {
      this.add.image(W / 2, 200, 'skyline').setDisplaySize(W, 400).setAlpha(0.75);
      this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.55);

      // --- title plate (left side) ---
      const tx = 340, ty = 300;
      addPanel(this, tx, ty, 560, 240, { border: CHROME.BORDER_LG, shadow: CHROME.SHADOW });
      this.add.rectangle(tx, ty - 92, 500, 4, C.crimson, 1);
      displayLabel(this.add, tx, ty - 40, 'CASTLE', 62, C.crimson);
      displayLabel(this.add, tx, ty + 32, 'ARCHITECT', 46, C.ink);
      label(this.add, tx, ty + 76, 'S I E G E   L A B', 17, C.inkSoft).setFontStyle('bold');

      addPanel(this, tx, ty + 164, 560, 56, { fill: C.paper2, border: CHROME.BORDER, shadow: CHROME.SHADOW_SM });
      this.statsText = this.add.text(tx, ty + 164, '', {
        fontFamily: FONT, fontSize: '15px', color: hex(C.ink), fontStyle: 'bold', align: 'center', lineSpacing: 4, resolution: 2,
      }).setOrigin(0.5);
    } else {
      this.add.image(W / 2, 300, 'skyline').setAlpha(0.75);
      this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.55);

      // --- title plate ---
      addPanel(this, W / 2, 250, 640, 210, { border: CHROME.BORDER_LG, shadow: CHROME.SHADOW });
      this.add.rectangle(W / 2, 164, 580, 4, C.crimson, 1);
      displayLabel(this.add, W / 2, 214, 'CASTLE', 66, C.crimson);
      displayLabel(this.add, W / 2, 288, 'ARCHITECT', 48, C.ink);
      label(this.add, W / 2, 332, 'S I E G E   L A B', 18, C.inkSoft).setFontStyle('bold');

      addPanel(this, W / 2, 408, 640, 56, { fill: C.paper2, border: CHROME.BORDER, shadow: CHROME.SHADOW_SM });
      this.statsText = this.add.text(W / 2, 408, '', {
        fontFamily: FONT, fontSize: '15px', color: hex(C.ink), fontStyle: 'bold', align: 'center', lineSpacing: 4, resolution: 2,
      }).setOrigin(0.5);
    }

    this.rootPanel = this.add.container(0, 0);
    this.modePanel = this.add.container(0, 0).setVisible(false);
    this.workshopPanel = this.add.container(0, 0).setVisible(false);
    this.helpPanel = this.add.container(0, 0).setVisible(false);
    this.resetConfirmModal = this.add.container(0, 0).setDepth(800).setVisible(false);

    this.buildRoot();
    this.buildModeSelect();
    this.buildWorkshop();
    this.buildHelp();
    this.buildResetConfirm();
    this.refreshStats();
    this.setupKonamiCode();

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.resetConfirmModal.visible) {
        this.closeResetConfirm();
      } else if (this.mode !== 'root') {
        this.show('root');
      }
    });
  }

  setupKonamiCode() {
    const konamiSeq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIdx = 0;
    this.input.keyboard?.on('keydown', (event) => {
      const k = event.key;
      if (k && k.toLowerCase() === konamiSeq[konamiIdx].toLowerCase()) {
        konamiIdx++;
        if (konamiIdx === konamiSeq.length) {
          konamiIdx = 0;
          const s = loadSave();
          const { W } = this.L;
          if (s.konamiDisabled || (s.konamiTotalUses || 0) >= 20) {
            SFX.deny();
            toast(this, W / 2, 300, '🚫 THE ANCIENT CODE IS DEPLETED (20/20 uses exhausted)!', C.crimson, 24);
            return;
          }
          s.konamiTotalUses = (s.konamiTotalUses || 0) + 1;
          if (s.konamiTotalUses >= 20) s.konamiDisabled = true;
          s.storyCompleted = true;
          s.unlockedModes = { story: true, survival: true, chaos: true };
          s.legacy += 500;
          s.totalWaves = Math.max(s.totalWaves, 20);
          writeSave();
          this.save = s;
          this.buildRoot();
          this.buildModeSelect();
          this.refreshStats();
          SFX.synergy();
          toast(this, W / 2, 300, `👑 GOD MODE UNLOCKED: All Modes Open (+500 Legacy) [${s.konamiTotalUses}/20]`, C.gold, 24);
        }
      } else {
        konamiIdx = (k && k.toLowerCase() === konamiSeq[0].toLowerCase()) ? 1 : 0;
      }
    });
  }

  refreshStats() {
    const s = loadSave();
    const surv = s.bestSurvivalWave ? `   ·   Survival: W${s.bestSurvivalWave}` : '';
    this.statsText.setText(
      `Legacy: ${s.legacy}   ·   Best Siege: W${s.bestWave}\nSieges Survived: ${s.totalWaves}${surv}`
    );
  }

  buildRoot() {
    const p = this.rootPanel;
    p.removeAll(true);
    const { W, isLandscape } = this.L;
    const s = loadSave();

    const canSelectModes = !!(s.storyCompleted || (s.unlockedModes && (s.unlockedModes.survival || s.unlockedModes.chaos)));

    if (isLandscape) {
      const rx = 940;
      p.add(button(this, {
        x: rx, y: 190, w: 520, h: 120,
        label: canSelectModes ? 'PLAY GAME' : 'BUILD YOUR CASTLE',
        sub: canSelectModes ? 'select campaign, survival, or chaos' : 'place pieces, then hold the line',
        fontSize: canSelectModes ? 34 : 36,
        fill: C.gold, stroke: C.ink, textColor: C.ink,
        onClick: () => {
          if (canSelectModes) {
            this.show('modes');
          } else {
            this.scene.start('game', { fresh: true, mode: 'story' });
          }
        },
      }));

      p.add(button(this, {
        x: rx, y: 330, w: 520, h: 96, label: 'WORKSHOP', sub: 'spend legacy on permanent upgrades',
        fontSize: 28, onClick: () => this.show('workshop'),
      }));

      this.musicBtn = button(this, {
        x: rx - 180, y: 445, w: 150, h: 86,
        icon: this.save.music ? 'ui_music_on' : 'ui_music_off',
        onClick: () => this.toggleMusic(),
      });
      this.helpBtn = button(this, {
        x: rx, y: 445, w: 150, h: 86, icon: 'ui_help',
        onClick: () => this.show('help'),
      });
      this.soundBtn = button(this, {
        x: rx + 180, y: 445, w: 150, h: 86,
        icon: this.save.sound ? 'ui_sound_on' : 'ui_sound_off',
        onClick: () => this.toggleSound(),
      });
      p.add([this.musicBtn, this.helpBtn, this.soundBtn]);

      p.add(button(this, {
        x: rx, y: 555, w: 520, h: 76, label: 'CONTROLS', fontSize: 22,
        onClick: () => { this.show('help'); },
      }));

      const h1 = label(this.add, rx, 630, 'Mouse / touch to build. Keys 1-7 pick pieces, arrows move, Space places.', 15, C.paper2);
      const h2 = label(this.add, rx, 655, 'Esc returns here from a siege. (Tip: Up Up Down Down...)', 15, C.paper2);
      p.add([h1, h2]);
    } else {
      p.add(button(this, {
        x: W / 2, y: 560, w: 540, h: 128,
        label: canSelectModes ? 'PLAY GAME' : 'BUILD YOUR CASTLE',
        sub: canSelectModes ? 'select campaign, survival, or chaos' : 'place pieces, then hold the line',
        fontSize: canSelectModes ? 38 : 40,
        fill: C.gold, stroke: C.ink, textColor: C.ink,
        onClick: () => {
          if (canSelectModes) {
            this.show('modes');
          } else {
            this.scene.start('game', { fresh: true, mode: 'story' });
          }
        },
      }));

      p.add(button(this, {
        x: W / 2, y: 712, w: 540, h: 104, label: 'WORKSHOP', sub: 'spend legacy on permanent upgrades',
        fontSize: 32, onClick: () => this.show('workshop'),
      }));

      this.musicBtn = button(this, {
        x: 132, y: 838, w: 216, h: 96,
        icon: this.save.music ? 'ui_music_on' : 'ui_music_off',
        onClick: () => this.toggleMusic(),
      });
      this.helpBtn = button(this, {
        x: W / 2, y: 838, w: 216, h: 96, icon: 'ui_help',
        onClick: () => this.show('help'),
      });
      this.soundBtn = button(this, {
        x: 588, y: 838, w: 216, h: 96,
        icon: this.save.sound ? 'ui_sound_on' : 'ui_sound_off',
        onClick: () => this.toggleSound(),
      });
      p.add([this.musicBtn, this.helpBtn, this.soundBtn]);

      p.add(button(this, {
        x: W / 2, y: 1010, w: 540, h: 84, label: 'CONTROLS', fontSize: 26,
        onClick: () => { this.show('help'); },
      }));

      label(this.add, W / 2, 1180,
        'Mouse / touch to build.  Keys 1-7 pick pieces, arrows move, Space places.',
        17, C.paper2).setName('hint');
      label(this.add, W / 2, 1212, 'Esc returns here from a siege. (Tip: Up Up Down Down...)', 17, C.paper2).setName('hint2');

      const h1 = this.children.getByName('hint'); const h2 = this.children.getByName('hint2');
      if (h1) p.add(h1); if (h2) p.add(h2);
    }
  }

  buildModeSelect() {
    const p = this.modePanel;
    p.removeAll(true);
    const { W, H, isLandscape } = this.L;
    const s = loadSave();
    const hasSurvival = s.storyCompleted || (s.unlockedModes && s.unlockedModes.survival);
    const hasChaos = s.storyCompleted || (s.unlockedModes && s.unlockedModes.chaos);

    p.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.96));
    p.add(displayLabel(this.add, W / 2, isLandscape ? 60 : 118, 'SELECT GAME MODE', 42, C.gold));
    p.add(label(this.add, W / 2, isLandscape ? 105 : 172, 'CHOOSE YOUR SIEGE CHALLENGE', 17, C.paper).setFontStyle('bold'));

    const modes = [
      {
        id: 'story',
        title: 'STORY CAMPAIGN',
        crown: '👑',
        desc: 'The Mad King\u2019s Decrees! Unpredictable royal rules & boss siege at wave 10.',
        unlocked: true,
        accent: C.goldInk, headText: C.ink,
      },
      {
        id: 'survival',
        title: 'SURVIVAL MODE',
        crown: '⚔️',
        desc: hasSurvival ? 'Endless escalating sieges! Fast-forward speed toggle (1x/2x/3x).' : 'LOCKED \u2014 Defeat Wave 10 in Story Campaign to Unlock',
        unlocked: !!hasSurvival,
        accent: C.crimson, headText: C.paper,
      },
      {
        id: 'chaos',
        title: 'CHAOS MODE',
        crown: '🎲',
        desc: hasChaos ? 'Spin the Wheel of Chaos! Draft random fortifications, trigger crazy defensive mutators & periodic anomalies.' : 'LOCKED \u2014 Beat Story Campaign to Unlock',
        unlocked: !!hasChaos,
        accent: C.lapis, headText: C.paper,
      },
    ];

    if (isLandscape) {
      modes.forEach((m, i) => {
        const x = W / 2 - 380 + i * 380;
        const y = 350;
        const cardW = 350, cardH = 340;
        const acc = m.unlocked ? m.accent : C.rule;
        p.add(addPanel(this, x, y, cardW, cardH, {
          border: CHROME.BORDER_LG, shadow: CHROME.SHADOW,
          stroke: m.unlocked ? C.ink : C.rule,
          header: `${m.crown} ${m.title}`,
          headerFill: acc,
          headerColor: m.unlocked ? m.headText : C.paper2,
          headerSize: 18,
        }));

        p.add(this.add.text(x, y - 55, m.desc, {
          fontFamily: FONT, fontSize: '16px', color: hex(m.unlocked ? C.inkSoft : C.muted),
          align: 'center', wordWrap: { width: cardW - 40 }, lineSpacing: 5, resolution: 2,
        }).setOrigin(0.5));

        const playBtn = button(this, {
          x, y: y + 105, w: cardW - 50, h: 68,
          label: m.unlocked ? 'PLAY' : 'LOCKED',
          fontSize: 21,
          fill: m.unlocked ? C.gold : C.paperEdge,
          stroke: m.unlocked ? C.ink : C.rule,
          textColor: m.unlocked ? C.ink : C.muted,
          onClick: () => {
            if (!m.unlocked) { SFX.deny(); return; }
            s.selectedMode = m.id;
            writeSave();
            this.scene.start('game', { fresh: true, mode: m.id });
          },
        });
        playBtn.setEnabled(m.unlocked);
        p.add(playBtn);
      });

      p.add(button(this, {
        x: W / 2, y: 620, w: 260, h: 70, label: 'BACK', fontSize: 24,
        onClick: () => this.show('root'),
      }));
    } else {
      modes.forEach((m, i) => {
        const y = 310 + i * 230;
        const cardW = 640, cardH = 200;
        const acc = m.unlocked ? m.accent : C.rule;
        p.add(addPanel(this, W / 2, y, cardW, cardH, {
          border: CHROME.BORDER_LG, shadow: CHROME.SHADOW,
          stroke: m.unlocked ? C.ink : C.rule,
          header: `${m.crown} ${m.title}`,
          headerFill: acc,
          headerColor: m.unlocked ? m.headText : C.paper2,
          headerSize: 20,
        }));

        const descTxt = this.add.text(60, y + 14, m.desc, {
          fontFamily: FONT, fontSize: '16px', color: hex(m.unlocked ? C.inkSoft : C.muted),
          wordWrap: { width: 380 }, lineSpacing: 4, resolution: 2,
        }).setOrigin(0, 0.5);
        p.add(descTxt);

        const playBtn = button(this, {
          x: 550, y, w: 160, h: 90,
          label: m.unlocked ? 'PLAY' : 'LOCKED',
          fontSize: 23,
          fill: m.unlocked ? C.gold : C.paperEdge,
          stroke: m.unlocked ? C.ink : C.rule,
          textColor: m.unlocked ? C.ink : C.muted,
          onClick: () => {
            if (!m.unlocked) { SFX.deny(); return; }
            s.selectedMode = m.id;
            writeSave();
            this.scene.start('game', { fresh: true, mode: m.id });
          },
        });
        playBtn.setEnabled(m.unlocked);
        p.add(playBtn);
      });

      p.add(button(this, {
        x: W / 2, y: 1100, w: 300, h: 90, label: 'BACK', fontSize: 28,
        onClick: () => this.show('root'),
      }));
    }
  }

  toggleSound() {
    const on = toggleSound();
    if (this.soundBtn && this.soundBtn.scene) this.soundBtn.setIcon(on ? 'ui_sound_on' : 'ui_sound_off');
    if (on) SFX.tap();
  }

  toggleMusic() {
    const s = loadSave();
    s.music = !s.music; writeSave();
    if (s.music) startMusic(); else stopMusic();
    if (this.musicBtn && this.musicBtn.scene) this.musicBtn.setIcon(s.music ? 'ui_music_on' : 'ui_music_off');
    SFX.tap();
  }

  buildWorkshop() {
    const p = this.workshopPanel;
    p.removeAll(true);
    const { W, H, isLandscape } = this.L;

    p.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.96));
    p.add(displayLabel(this.add, W / 2, isLandscape ? 44 : 78, 'WORKSHOP', isLandscape ? 38 : 40, C.gold));
    this.workshopLegacy = label(this.add, W / 2, isLandscape ? 82 : 126, '', isLandscape ? 18 : 19, C.paper).setFontStyle('bold');
    p.add(this.workshopLegacy);

    this.upgradeRows = [];
    if (isLandscape) {
      const cardW = 380;
      const cardH = 210;

      UPGRADES.forEach((u, i) => {
        const col = i % 3;
        const row = (i / 3) | 0;
        const x = W / 2 - 395 + col * 395;
        const y = 215 + row * 228;

        p.add(addPanel(this, x, y, cardW, cardH, { border: CHROME.BORDER, shadow: CHROME.SHADOW }));
        p.add(this.add.rectangle(x, y - cardH / 2 + CHROME.BORDER + 3, cardW - CHROME.BORDER * 2, 6, C.crimson, 1));

        p.add(label(this.add, x, y - 70, u.name, 20, C.ink).setFontStyle('bold'));
        const desc = this.add.text(x, y - 30, u.blurb, {
          fontFamily: FONT, fontSize: '14px', color: hex(C.inkSoft), align: 'center',
          wordWrap: { width: cardW - 34 }, lineSpacing: 3, resolution: 2,
        }).setOrigin(0.5);
        p.add(desc);

        const pips = label(this.add, x, y + 14, '', 19, C.crimson);
        p.add(pips);

        const buy = button(this, {
          x, y: y + 64, w: 260, h: 52, label: 'FORGE', sub: `${u.cost} legacy`, fontSize: 17,
          onClick: () => {
            if (buyUpgrade(u.key)) { SFX.repair(); this.refreshWorkshop(); this.refreshStats(); }
            else SFX.deny();
          },
        });
        p.add(buy);
        this.upgradeRows.push({ u, pips, buy });
      });

      p.add(button(this, {
        x: W / 2 - 160, y: 640, w: 260, h: 62, label: 'BACK', fontSize: 23,
        onClick: () => this.show('root'),
      }));
      p.add(button(this, {
        x: W / 2 + 160, y: 640, w: 260, h: 62, label: 'RESET PROGRESS', fontSize: 18,
        fill: C.crimson, stroke: C.ink, textColor: ON_CRIMSON,
        onClick: () => this.openResetConfirm(),
      }));
    } else {
      UPGRADES.forEach((u, i) => {
        const y = 205 + i * 132;
        p.add(addPanel(this, W / 2, y, 640, 118, { border: CHROME.BORDER, shadow: CHROME.SHADOW }));
        p.add(label(this.add, 60, y - 30, u.name, 23, C.ink, [0, 0.5]).setFontStyle('bold'));
        const desc = label(this.add, 60, y + 2, u.blurb, 15, C.inkSoft, [0, 0.5]);
        p.add(desc);
        const pips = label(this.add, 60, y + 34, '', 18, C.crimson, [0, 0.5]);
        p.add(pips);
        const buy = button(this, {
          x: 550, y, w: 180, h: 86, label: 'FORGE', sub: `${u.cost} legacy`, fontSize: 21,
          onClick: () => {
            if (buyUpgrade(u.key)) { SFX.repair(); this.refreshWorkshop(); this.refreshStats(); }
            else SFX.deny();
          },
        });
        p.add(buy);
        this.upgradeRows.push({ u, pips, buy });
      });

      p.add(button(this, {
        x: W / 2, y: 1020, w: 340, h: 72, label: 'RESET PROGRESS', fontSize: 21,
        fill: C.crimson, stroke: C.ink, textColor: ON_CRIMSON,
        onClick: () => this.openResetConfirm(),
      }));
      p.add(button(this, {
        x: W / 2, y: 1120, w: 340, h: 86, label: 'BACK', fontSize: 27,
        onClick: () => this.show('root'),
      }));
    }
    this.refreshWorkshop();
  }

  buildResetConfirm() {
    const p = this.resetConfirmModal;
    p.removeAll(true);
    const { W, H, isLandscape } = this.L;

    p.add(this.add.rectangle(W / 2, H / 2, W, H, C.ink, 0.94));

    const cy = H / 2;
    const cardW = isLandscape ? 620 : 640;
    const cardH = isLandscape ? 380 : 440;
    p.add(addPanel(this, W / 2, cy, cardW, cardH, {
      stroke: C.crimson, border: CHROME.BORDER_LG, shadow: CHROME.SHADOW_LG,
      header: 'RESET ALL PROGRESS?',
      headerFill: C.crimson, headerColor: ON_CRIMSON, headerSize: 24,
    }));

    p.add(label(this.add, W / 2, cy - (isLandscape ? 112 : 138), 'THIS ACTION CANNOT BE UNDONE!', 17, C.crimson).setFontStyle('bold'));

    const descTxt = this.add.text(W / 2, cy - (isLandscape ? 36 : 52),
      'All Workshop upgrades, earned Legacy, best siege records, and unlocked game modes will be permanently erased.', {
        fontFamily: FONT, fontSize: isLandscape ? '16px' : '17px', color: hex(C.inkSoft),
        align: 'center', wordWrap: { width: cardW - 70 }, lineSpacing: 5, resolution: 2,
      }).setOrigin(0.5);
    p.add(descTxt);

    p.add(button(this, {
      x: W / 2 - (isLandscape ? 140 : 0), y: cy + (isLandscape ? 105 : 80),
      w: isLandscape ? 245 : 380, h: isLandscape ? 64 : 76,
      label: 'YES, WIPE ALL', fontSize: 20, fill: C.crimson, stroke: C.ink, textColor: ON_CRIMSON,
      onClick: () => this.executeResetSave(),
    }));

    p.add(button(this, {
      x: W / 2 + (isLandscape ? 140 : 0), y: cy + (isLandscape ? 105 : 170),
      w: isLandscape ? 245 : 380, h: isLandscape ? 64 : 76,
      label: 'CANCEL', fontSize: 20, fill: C.paper2, stroke: C.ink, textColor: C.ink,
      onClick: () => this.closeResetConfirm(),
    }));
  }

  openResetConfirm() {
    this.resetConfirmModal.setVisible(true);
    SFX.tap();
  }

  closeResetConfirm() {
    this.resetConfirmModal.setVisible(false);
    SFX.tap();
  }

  executeResetSave() {
    resetSave();
    this.save = loadSave();
    this.closeResetConfirm();
    this.refreshWorkshop();
    this.refreshStats();
    this.buildRoot();
    this.buildModeSelect();
    SFX.sell();
    const { W } = this.L;
    toast(this, W / 2, 300, 'Game Progress Reset Clean', C.gold, 24);
  }

  refreshWorkshop() {
    const s = loadSave();
    this.workshopLegacy.setText(`Legacy in store: ${s.legacy}`);
    for (const row of this.upgradeRows) {
      const lvl = s.upgrades[row.u.key] || 0;
      row.pips.setText('◈'.repeat(lvl) + '◇'.repeat(row.u.max - lvl));
      const maxed = lvl >= row.u.max;
      row.buy.setEnabled(!maxed && s.legacy >= row.u.cost);
      if (maxed) row.buy.label.setText('MASTERED');
      else row.buy.label.setText('FORGE');
      if (row.buy.subLabel) row.buy.subLabel.setText(`${row.u.cost} legacy`);
    }
  }

  buildHelp() {
    const p = this.helpPanel;
    p.removeAll(true);
    const { W, H, isLandscape } = this.L;

    p.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.97));
    p.add(displayLabel(this.add, W / 2, isLandscape ? 50 : 110, 'HOW TO PLAY', 42, C.gold));

    const lines = [
      ['1', 'BUILD', 'Pick a piece, then tap a square. Your Keep must be placed.'],
      ['2', 'SIEGE', 'Press START SIEGE. Raiders march down toward your Keep.'],
      ['3', 'OBSERVE', 'Watch what they break first, and where they bunch up.'],
      ['4', 'SURVIVE', 'Clear the wave for gold. The Keep falling ends the run.'],
      ['5', 'REBUILD', 'Repair, expand, and try a layout you have not tried.'],
    ];

    if (isLandscape) {
      lines.forEach(([n, t, d], i) => {
        const col = i % 2, row = (i / 2) | 0;
        const x = col === 0 ? 320 : 880;
        const y = 140 + row * 110;
        p.add(this.add.circle(x - 220, y, 26, C.paper).setStrokeStyle(3, C.gold, 1));
        p.add(label(this.add, x - 220, y, n, 26, C.crimson).setFontStyle('bold'));
        p.add(label(this.add, x - 180, y - 18, t, 22, C.paper, [0, 0.5]).setFontStyle('bold'));
        p.add(label(this.add, x - 180, y + 14, d, 16, C.paper2, [0, 0.5]));
      });

      p.add(label(this.add, W / 2, 486,
        'KEYBOARD   1-7 select · WASD/arrows cursor · Space/Enter place · X sell · R repair', 17, C.paper2));
      p.add(label(this.add, W / 2, 512,
        'Tab/E cycle piece · B start siege · Esc menu · F6 cycles on-screen buttons, Enter presses one', 17, C.paper2));

      p.add(this.add.text(W / 2, 566,
        'The interesting parts are not written down.\nChange one thing each siege and watch what happens.',
        { fontFamily: FONT, fontSize: '19px', color: hex(C.gold), align: 'center', lineSpacing: 6, resolution: 2 })
        .setOrigin(0.5));

      p.add(button(this, {
        x: W / 2, y: 648, w: 260, h: 76, label: 'BACK', fontSize: 27,
        onClick: () => this.show('root'),
      }));
    } else {
      lines.forEach(([n, t, d], i) => {
        const y = 220 + i * 128;
        p.add(this.add.circle(78, y, 30, C.paper).setStrokeStyle(3, C.gold, 1));
        p.add(label(this.add, 78, y, n, 30, C.crimson).setFontStyle('bold'));
        p.add(label(this.add, 128, y - 22, t, 25, C.paper, [0, 0.5]).setFontStyle('bold'));
        p.add(label(this.add, 128, y + 16, d, 17, C.paper2, [0, 0.5]));
      });

      p.add(label(this.add, W / 2, 880,
        'KEYBOARD   1-7 select · WASD/arrows cursor\nSpace/Enter place · X sell · R repair · Tab/E cycle piece\nB start siege · Esc menu · F6 cycles buttons', 19, C.paper2));

      p.add(this.add.text(W / 2, 1020,
        'The interesting parts are not written down.\nChange one thing each siege and watch what happens.',
        { fontFamily: FONT, fontSize: '21px', color: hex(C.gold), align: 'center', lineSpacing: 8, resolution: 2 })
        .setOrigin(0.5));

      p.add(button(this, {
        x: W / 2, y: 1160, w: 300, h: 96, label: 'BACK', fontSize: 29,
        onClick: () => this.show('root'),
      }));
    }
  }

  show(which) {
    this.rootPanel.setVisible(which === 'root');
    this.modePanel.setVisible(which === 'modes');
    this.workshopPanel.setVisible(which === 'workshop');
    this.helpPanel.setVisible(which === 'help');
    this.mode = which;
    if (which === 'modes') this.buildModeSelect();
    if (which === 'workshop') this.refreshWorkshop();
    SFX.tap();
  }
}
