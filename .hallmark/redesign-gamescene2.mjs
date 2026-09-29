// Hallmark redesign — GameScene.js pass 2: fixes the 19 indent-sensitive misses.
import fs from 'node:fs';

const P = 'C:/Users/TADS/WORK/hackathon/gamejam/src/scenes/GameScene.js';
let s = fs.readFileSync(P, 'utf8');
const pairs = [];
const add = (o, n, tag) => pairs.push({ o: Array.isArray(o) ? o.join('\n') : o, n: Array.isArray(n) ? n.join('\n') : n, tag });

/* 1. HUD landscape head (6-space indent) */
add([
  '      g.add(this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, 0x0d0b16, 0.94).setStrokeStyle(2, C.line));',
  '',
  '      g.add(this.add.circle(sx + 34, sy + 22, 13, C.gold, 1));',
  '      g.add(this.add.circle(sx + 34, sy + 22, 8, C.goldDim, 1));',
  "      this.goldText = label(this.add, sx + 58, sy + 22, '120', 25, '#ffd56b', [0, 0.5]).setFontStyle('bold');",
  '      g.add(this.goldText);',
  '',
  "      this.waveText = label(this.add, sx + sw / 2 - 10, sy + 22, 'BUILD PHASE', 21, '#ffffff').setFontStyle('bold');",
  '      g.add(this.waveText);',
], [
  '      g.add(this.add.rectangle(sx + sw / 2 + 8, sy + sh / 2 + 8, sw, sh, C.ink, 1));',
  '      g.add(this.add.rectangle(sx + sw / 2, sy + sh / 2, sw, sh, C.paper, 1).setStrokeStyle(3, C.ink, 1));',
  '',
  '      g.add(this.add.circle(sx + 34, sy + 22, 13, C.gold, 1).setStrokeStyle(2, C.ink, 1));',
  '      g.add(this.add.circle(sx + 34, sy + 22, 8, C.goldDim, 1));',
  "      this.goldText = label(this.add, sx + 58, sy + 22, '120', 25, C.goldInk, [0, 0.5]).setFontStyle('bold');",
  '      g.add(this.goldText);',
  '',
  "      this.waveText = label(this.add, sx + sw / 2 - 10, sy + 22, 'BUILD PHASE', 21, C.ink).setFontStyle('bold');",
  '      g.add(this.waveText);',
], 'HUD ls head');

/* 2 + 4. MENU buttons (10-space indent) */
add("          x: sx + sw - 50, y: sy + 22, w: 82, h: 36, label: 'MENU', fontSize: 16,",
    "          x: sx + sw - 50, y: sy + 22, w: 82, h: 36, label: '\u2630', fontSize: 26,", 'menu ls A');
add("          x: W - 50, y: 34, w: 84, h: 50, label: 'MENU', fontSize: 17,",
    "          x: W - 50, y: 34, w: 84, h: 50, label: '\u2630', fontSize: 30,", 'menu pt A');

/* 3. HUD landscape body (6-space indent) */
add([
  "      g.add(label(this.add, sx + 20, sy + 48, 'KEEP', 15, '#dcd7eb', [0, 0.5]).setFontStyle('bold'));",
  '      this.keepBarBg = this.add.rectangle(sx + 70, sy + 48, sw - 140, 16, 0x241f3a, 1).setOrigin(0, 0.5);',
  '      this.keepBarFg = this.add.rectangle(sx + 70, sy + 48, sw - 140, 12, C.green, 1).setOrigin(0, 0.5);',
  '      g.add([this.keepBarBg, this.keepBarFg]);',
  "      this.keepBarText = label(this.add, sx + sw - 20, sy + 48, '', 14, '#ffffff', [1, 0.5]).setFontStyle('bold');",
  '      g.add(this.keepBarText);',
  '',
  "      this.statusText = label(this.add, sx + 20, sy + 70, '', 16, '#ffd56b', [0, 0.5]).setFontStyle('bold');",
  "      this.statusRight = label(this.add, sx + sw - 20, sy + 70, '', 16, '#ffffff', [1, 0.5]).setFontStyle('bold');",
], [
  "      g.add(label(this.add, sx + 20, sy + 48, '\u2665', 24, C.crimson, [0, 0.5]).setFontStyle('bold'));",
  '      this.keepBarBg = this.add.rectangle(sx + 70, sy + 48, sw - 140, 16, C.ink, 1).setOrigin(0, 0.5);',
  '      this.keepBarFg = this.add.rectangle(sx + 70, sy + 48, sw - 140, 12, C.green, 1).setOrigin(0, 0.5);',
  '      g.add([this.keepBarBg, this.keepBarFg]);',
  "      this.keepBarText = label(this.add, sx + sw - 20, sy + 48, '', 14, C.ink, [1, 0.5]).setFontStyle('bold');",
  '      g.add(this.keepBarText);',
  '',
  "      this.statusText = label(this.add, sx + 20, sy + 70, '', 16, C.crimsonDeep, [0, 0.5]).setFontStyle('bold');",
  "      this.statusRight = label(this.add, sx + sw - 20, sy + 70, '', 16, C.ink, [1, 0.5]).setFontStyle('bold');",
], 'HUD ls body');

/* 5. HUD portrait body (6-space indent) */
add([
  "      g.add(label(this.add, 30, 74, 'KEEP', 16, '#dcd7eb', [0, 0.5]).setFontStyle('bold'));",
  '      this.keepBarBg = this.add.rectangle(90, 74, W - 120, 18, 0x241f3a, 1).setOrigin(0, 0.5);',
  '      this.keepBarFg = this.add.rectangle(90, 74, W - 120, 14, C.green, 1).setOrigin(0, 0.5);',
  '      g.add([this.keepBarBg, this.keepBarFg]);',
  "      this.keepBarText = label(this.add, W - 40, 74, '', 15, '#ffffff', [1, 0.5]).setFontStyle('bold');",
  '      g.add(this.keepBarText);',
  '',
  "      this.statusText = label(this.add, 30, 106, '', 18, '#ffd56b', [0, 0.5]).setFontStyle('bold');",
  '      g.add(this.statusText);',
  "      this.statusRight = label(this.add, W - 30, 106, '', 18, '#ffffff', [1, 0.5]).setFontStyle('bold');",
], [
  "      g.add(label(this.add, 30, 74, '\u2665', 26, C.crimson, [0, 0.5]).setFontStyle('bold'));",
  '      this.keepBarBg = this.add.rectangle(90, 74, W - 170, 18, C.ink, 1).setOrigin(0, 0.5);',
  '      this.keepBarFg = this.add.rectangle(90, 74, W - 170, 14, C.green, 1).setOrigin(0, 0.5);',
  '      g.add([this.keepBarBg, this.keepBarFg]);',
  "      this.keepBarText = label(this.add, W - 40, 74, '', 15, C.ink, [1, 0.5]).setFontStyle('bold');",
  '      g.add(this.keepBarText);',
  '',
  "      this.statusText = label(this.add, 30, 106, '', 18, C.crimsonDeep, [0, 0.5]).setFontStyle('bold');",
  "      this.statusRight = label(this.add, W - 30, 106, '', 18, C.ink, [1, 0.5]).setFontStyle('bold');",
], 'HUD pt body');

/* 6. banner (4-space) */
add([
  '    this.bannerPlate = this.add.rectangle(0, 0, 620, 150, 0x0d0b16, 0.95).setStrokeStyle(3, C.gold, 0.8);',
  "    this.bannerTitle = label(this.add, 0, -26, '', 42, '#e8b73a').setFontStyle('bold');",
  "    this.bannerSub = label(this.add, 0, 30, '', 22, '#cfc9de');",
  '    this.banner.add([this.bannerPlate, this.bannerTitle, this.bannerSub]);',
], [
  '    this.bannerShadow = this.add.rectangle(8, 8, 620, 150, C.ink, 1);',
  '    this.bannerPlate = this.add.rectangle(0, 0, 620, 150, C.paper, 1).setStrokeStyle(4, C.ink, 1);',
  "    this.bannerTitle = displayLabel(this.add, 0, -26, '', 42, C.ink).setFontStyle('bold');",
  "    this.bannerSub = label(this.add, 0, 30, '', 22, C.inkSoft);",
  '    this.banner.add([this.bannerShadow, this.bannerPlate, this.bannerTitle, this.bannerSub]);',
], 'banner');

/* 7. results text (4-space) */
add([
  "    this.resultTitle = label(this.add, W / 2, isLandscape ? 150 : 300, '', 56, '#e8b73a').setFontStyle('bold');",
  "    this.resultBody = label(this.add, W / 2, isLandscape ? 230 : 400, '', 24, '#cfc9de');",
  "    this.resultStats = label(this.add, W / 2, isLandscape ? 330 : 520, '', 22, '#9a94b5');",
  "    this.resultLegacy = label(this.add, W / 2, isLandscape ? 400 : 590, '', 26, '#e8b73a');",
], [
  "    this.resultTitle = displayLabel(this.add, W / 2, isLandscape ? 150 : 300, '', 56, C.gold).setFontStyle('bold');",
  "    this.resultBody = label(this.add, W / 2, isLandscape ? 230 : 400, '', 24, C.paper);",
  "    this.resultStats = label(this.add, W / 2, isLandscape ? 330 : 520, '', 22, C.paper2);",
  "    this.resultLegacy = displayLabel(this.add, W / 2, isLandscape ? 400 : 590, '', 26, C.gold);",
], 'result text');

/* 8. exit confirm modal (4-space) */
add([
  '    this.exitConfirm.add(this.add.rectangle(W / 2, H / 2, W, H, 0x0b0a12, 0.93));',
  "    this.exitConfirm.add(label(this.add, W / 2, isLandscape ? 220 : 480, 'ABANDON THIS CASTLE?', 34, '#e8b73a').setFontStyle('bold'));",
  "    this.exitConfirm.add(label(this.add, W / 2, isLandscape ? 280 : 540, 'Progress this run is lost.', 20, '#9a94b5'));",
], [
  '    this.exitConfirm.add(this.add.rectangle(W / 2, H / 2, W, H, C.bgDeep, 0.9));',
  '    const exW = isLandscape ? 620 : 600;',
  '    const exTop = isLandscape ? 168 : 428;',
  '    const exBot = isLandscape ? 548 : 852;',
  '    const exH = exBot - exTop;',
  '    this.exitConfirm.add(this.add.rectangle(W / 2 + 8, exTop + exH / 2 + 8, exW, exH, C.ink, 1));',
  '    this.exitConfirm.add(this.add.rectangle(W / 2, exTop + exH / 2, exW, exH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  '    this.exitConfirm.add(this.add.rectangle(W / 2, exTop + 6, exW - 24, 5, C.crimson, 1));',
  "    this.exitConfirm.add(displayLabel(this.add, W / 2, isLandscape ? 232 : 492, 'ABANDON THIS CASTLE?', 34, C.ink).setFontStyle('bold'));",
  "    this.exitConfirm.add(label(this.add, W / 2, isLandscape ? 286 : 544, 'Progress this run is lost.', 20, C.inkSoft));",
], 'exit confirm');

/* 9. repair confirm body (4-space) */
add([
  '    this.repairConfirm.add(this.add.rectangle(W / 2, cardY, cardW, cardH, C.panel, 0.98).setStrokeStyle(3, C.gold, 0.9));',
  '    this.repairConfirm.add(this.add.rectangle(W / 2, cardY - cardH / 2 + 6, cardW - 20, 4, C.gold, 0.6));',
  '',
  "    this.repairConfirmTitle = label(this.add, W / 2, cardY - (isLandscape ? 100 : 120), 'CONFIRM REPAIR', 28, '#ffd56b').setFontStyle('bold');",
  "    this.repairConfirmPiece = label(this.add, W / 2, cardY - (isLandscape ? 55 : 65), '', 22, '#ffffff').setFontStyle('bold');",
  "    this.repairConfirmHp = label(this.add, W / 2, cardY - (isLandscape ? 15 : 20), '', 18, '#d5d0e6');",
  "    this.repairConfirmCost = label(this.add, W / 2, cardY + (isLandscape ? 25 : 30), '', 21, '#66c07a').setFontStyle('bold');",
], [
  '    this.repairConfirm.add(this.add.rectangle(W / 2 + 8, cardY + 8, cardW, cardH, C.ink, 1));',
  '    this.repairConfirm.add(this.add.rectangle(W / 2, cardY, cardW, cardH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  '    this.repairConfirm.add(this.add.rectangle(W / 2, cardY - cardH / 2 + 6, cardW - 24, 5, C.crimson, 1));',
  '',
  "    this.repairConfirmTitle = displayLabel(this.add, W / 2, cardY - (isLandscape ? 100 : 120), 'CONFIRM REPAIR', 28, C.ink).setFontStyle('bold');",
  "    this.repairConfirmPiece = label(this.add, W / 2, cardY - (isLandscape ? 55 : 65), '', 22, C.ink).setFontStyle('bold');",
  "    this.repairConfirmHp = label(this.add, W / 2, cardY - (isLandscape ? 15 : 20), '', 18, C.inkSoft);",
  "    this.repairConfirmCost = label(this.add, W / 2, cardY + (isLandscape ? 25 : 30), '', 21, C.crimsonDeep).setFontStyle('bold');",
], 'repair confirm');

/* 10. guide head (4-space) */
add([
  '    this.firstTimeModal.add(this.add.rectangle(W / 2, guideY, guideW, guideH, C.panel, 0.98).setStrokeStyle(3, C.gold, 0.9));',
  '    this.firstTimeModal.add(this.add.rectangle(W / 2, guideY - guideH / 2 + 6, guideW - 24, 4, C.gold, 0.7));',
  '',
  "    this.firstTimeModal.add(label(this.add, W / 2, titleY, 'WELCOME, ARCHITECT!', isLandscape ? 34 : 32, '#ffd56b').setFontStyle('bold'));",
  "    this.firstTimeModal.add(label(this.add, W / 2, subY, '4 QUICK RULES TO SURVIVE THE SIEGE', isLandscape ? 18 : 17, '#ffffff').setFontStyle('bold'));",
], [
  '    this.firstTimeModal.add(this.add.rectangle(W / 2 + 8, guideY + 8, guideW, guideH, C.ink, 1));',
  '    this.firstTimeModal.add(this.add.rectangle(W / 2, guideY, guideW, guideH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  '    this.firstTimeModal.add(this.add.rectangle(W / 2, guideY - guideH / 2 + 6, guideW - 24, 5, C.crimson, 1));',
  '',
  "    this.firstTimeModal.add(displayLabel(this.add, W / 2, titleY, 'WELCOME, ARCHITECT!', isLandscape ? 34 : 32, C.ink).setFontStyle('bold'));",
  "    this.firstTimeModal.add(label(this.add, W / 2, subY, '4 QUICK RULES TO SURVIVE THE SIEGE', isLandscape ? 18 : 17, C.crimsonDeep).setFontStyle('bold'));",
], 'guide head');

/* 11 + 12. guide cards (8-space indent) — line 792/817 already reference cardPlateFace */
add([
  '        const cardPlate = this.add.rectangle(cx, cy, 470, 115, 0x141024, 0.95).setStrokeStyle(2, C.line);',
  '        const circle = this.add.circle(cx - 195, cy, 22, C.panelHi).setStrokeStyle(2, C.gold, 0.8);',
  "        const numTxt = label(this.add, cx - 195, cy, st.num, 20, '#ffd56b').setFontStyle('bold');",
  "        const titTxt = label(this.add, cx - 155, cy - 24, st.title, 17, '#ffffff', [0, 0.5]).setFontStyle('bold');",
  '        const descTxt = this.add.text(cx - 155, cy + 14, st.desc, {',
  "          fontFamily: FONT, fontSize: '13.5px', color: '#dcd7eb',",
], [
  '        const cardPlate = this.add.rectangle(cx + 6, cy + 6, 470, 115, C.ink, 1);',
  '        const cardPlateFace = this.add.rectangle(cx, cy, 470, 115, C.paper2, 1).setStrokeStyle(3, C.ink, 1);',
  '        const circle = this.add.circle(cx - 195, cy, 22, C.crimson).setStrokeStyle(3, C.ink, 1);',
  "        const numTxt = label(this.add, cx - 195, cy, st.num, 20, C.white).setFontStyle('bold');",
  "        const titTxt = label(this.add, cx - 155, cy - 24, st.title, 17, C.ink, [0, 0.5]).setFontStyle('bold');",
  '        const descTxt = this.add.text(cx - 155, cy + 14, st.desc, {',
  "          fontFamily: FONT, fontSize: '13.5px', color: hex(C.inkSoft),",
], 'guide card ls');
add([
  '        const cardPlate = this.add.rectangle(cx, cy, 600, 120, 0x141024, 0.95).setStrokeStyle(2, C.line);',
  '        const circle = this.add.circle(cx - 245, cy, 24, C.panelHi).setStrokeStyle(2, C.gold, 0.8);',
  "        const numTxt = label(this.add, cx - 245, cy, st.num, 22, '#ffd56b').setFontStyle('bold');",
  "        const titTxt = label(this.add, cx - 205, cy - 24, st.title, 19, '#ffffff', [0, 0.5]).setFontStyle('bold');",
  '        const descTxt = this.add.text(cx - 205, cy + 16, st.desc, {',
  "          fontFamily: FONT, fontSize: '14px', color: '#dcd7eb',",
], [
  '        const cardPlate = this.add.rectangle(cx + 6, cy + 6, 600, 120, C.ink, 1);',
  '        const cardPlateFace = this.add.rectangle(cx, cy, 600, 120, C.paper2, 1).setStrokeStyle(3, C.ink, 1);',
  '        const circle = this.add.circle(cx - 245, cy, 24, C.crimson).setStrokeStyle(3, C.ink, 1);',
  "        const numTxt = label(this.add, cx - 245, cy, st.num, 22, C.white).setFontStyle('bold');",
  "        const titTxt = label(this.add, cx - 205, cy - 24, st.title, 19, C.ink, [0, 0.5]).setFontStyle('bold');",
  '        const descTxt = this.add.text(cx - 205, cy + 16, st.desc, {',
  "          fontFamily: FONT, fontSize: '14px', color: hex(C.inkSoft),",
], 'guide card pt');

/* 13. god console (4-space) */
add([
  '    this.godModeModal.add(this.add.rectangle(W / 2, H / 2, godW, godH, C.panel, 0.98).setStrokeStyle(3, C.gold, 1));',
  "    this.godModeModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 195 : 300), '\ud83d\udc51 GOD MODE CONSOLE \ud83d\udc51', 28, '#ffd56b').setFontStyle('bold'));",
  "    this.godModeModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 155 : 260), 'DEV CHEAT MENU (KONAMI CODE UNLOCKED)', 15, '#dcd7eb'));",
], [
  '    this.godModeModal.add(this.add.rectangle(W / 2 + 8, H / 2 + 8, godW, godH, C.ink, 1));',
  '    this.godModeModal.add(this.add.rectangle(W / 2, H / 2, godW, godH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  '    this.godModeModal.add(this.add.rectangle(W / 2, H / 2 - godH / 2 + 6, godW - 24, 5, C.crimson, 1));',
  "    this.godModeModal.add(displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 195 : 300), '\ud83d\udc51 GOD MODE CONSOLE \ud83d\udc51', 28, C.ink).setFontStyle('bold'));",
  "    this.godModeModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 155 : 260), 'DEV CHEAT MENU (KONAMI CODE UNLOCKED)', 15, C.crimsonDeep));",
], 'god console');

/* 14. victory body (4-space) */
add([
  '    this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2, vicW, vicH, C.panel, 0.98).setStrokeStyle(3, C.gold, 1));',
  '    this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2 - vicH / 2 + 6, vicW - 24, 5, C.gold, 0.8));',
  '',
  "    this.storyVictoryModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 190 : 280), 'VICTORY \u2014 REALM LIBERATED!', isLandscape ? 34 : 30, '#ffd56b').setFontStyle('bold'));",
  "    this.storyVictoryModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 140 : 220), 'The High Warlord has fallen. The Mad King awards you the Crown!', isLandscape ? 18 : 16, '#ffffff').setFontStyle('bold'));",
  '',
  "    const unlPlate = this.add.rectangle(W / 2, H / 2 - (isLandscape ? 30 : 60), vicW - 80, isLandscape ? 140 : 200, 0x141024, 0.9).setStrokeStyle(2, C.line);",
  "    const unlT1 = label(this.add, W / 2, H / 2 - (isLandscape ? 70 : 120), '\ud83c\udfc6 NEW MODES UNLOCKED \ud83c\udfc6', 22, '#ffd56b').setFontStyle('bold');",
  "    const unlT2 = label(this.add, W / 2, H / 2 - (isLandscape ? 35 : 65), '\u2694\ufe0f SURVIVAL MODE: Endless escalating sieges + Fast-Forward', 16, '#ffffff');",
  "    const unlT3 = label(this.add, W / 2, H / 2 + (isLandscape ? 0 : -10), '\ud83c\udfb2 CHAOS MODE: Wild draft rules & randomized mutators', 16, '#ffffff');",
], [
  '    this.storyVictoryModal.add(this.add.rectangle(W / 2 + 8, H / 2 + 8, vicW, vicH, C.ink, 1));',
  '    this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2, vicW, vicH, C.paper, 1).setStrokeStyle(4, C.ink, 1));',
  '    this.storyVictoryModal.add(this.add.rectangle(W / 2, H / 2 - vicH / 2 + 6, vicW - 24, 5, C.crimson, 1));',
  '',
  "    this.storyVictoryModal.add(displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 190 : 280), 'VICTORY \u2014 REALM LIBERATED!', isLandscape ? 34 : 30, C.ink).setFontStyle('bold'));",
  "    this.storyVictoryModal.add(label(this.add, W / 2, H / 2 - (isLandscape ? 140 : 220), 'The High Warlord has fallen. The Mad King awards you the Crown!', isLandscape ? 18 : 16, C.inkSoft).setFontStyle('bold'));",
  '',
  '    const unlPlate = this.add.rectangle(W / 2, H / 2 - (isLandscape ? 30 : 60), vicW - 80, isLandscape ? 140 : 200, C.paper2, 1).setStrokeStyle(3, C.ink, 1);',
  "    const unlT1 = displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 70 : 120), '\ud83c\udfc6 NEW MODES UNLOCKED \ud83c\udfc6', 22, C.crimsonDeep).setFontStyle('bold');",
  "    const unlT2 = label(this.add, W / 2, H / 2 - (isLandscape ? 35 : 65), '\u2694\ufe0f SURVIVAL MODE: Endless escalating sieges + Fast-Forward', 16, C.ink);",
  "    const unlT3 = label(this.add, W / 2, H / 2 + (isLandscape ? 0 : -10), '\ud83c\udfb2 CHAOS MODE: Wild draft rules & randomized mutators', 16, C.ink);",
], 'victory body');

/* 15. troll body (4-space) */
add([
  '    this.trollModal.add(this.add.rectangle(W / 2, H / 2, trW, trH, C.panel, 0.98).setStrokeStyle(3, 0xd9483b, 1));',
  '    this.trollModal.add(this.add.rectangle(W / 2, H / 2 - trH / 2 + 5, trW - 20, 5, 0xd9483b, 0.8));',
  '',
  "    this.trollTitle = label(this.add, W / 2, H / 2 - (isLandscape ? 175 : 250), '\ud83e\udd21 HAHAHAHA! CHEATER! \ud83e\udd21', isLandscape ? 32 : 28, '#d9483b').setFontStyle('bold');",
  "    this.trollSub = label(this.add, W / 2, H / 2 - (isLandscape ? 125 : 190), 'THE MAD KING CAUGHT YOU IN THE ACT!', isLandscape ? 17 : 16, '#ffd56b').setFontStyle('bold');",
  '    this.trollBody = this.add.text(W / 2, H / 2 - (isLandscape ? 15 : 45), \'\', {',
  "      fontFamily: FONT, fontSize: isLandscape ? '16px' : '17px', color: '#ffffff',",
], [
  '    this.trollModal.add(this.add.rectangle(W / 2 + 8, H / 2 + 8, trW, trH, C.ink, 1));',
  '    this.trollModal.add(this.add.rectangle(W / 2, H / 2, trW, trH, C.paper, 1).setStrokeStyle(4, C.crimson, 1));',
  '    this.trollModal.add(this.add.rectangle(W / 2, H / 2 - trH / 2 + 5, trW - 24, 5, C.crimson, 1));',
  '',
  "    this.trollTitle = displayLabel(this.add, W / 2, H / 2 - (isLandscape ? 175 : 250), '\ud83e\udd21 HAHAHAHA! CHEATER! \ud83e\udd21', isLandscape ? 32 : 28, C.ink).setFontStyle('bold');",
  "    this.trollSub = label(this.add, W / 2, H / 2 - (isLandscape ? 125 : 190), 'THE MAD KING CAUGHT YOU IN THE ACT!', isLandscape ? 17 : 16, C.crimsonDeep).setFontStyle('bold');",
  '    this.trollBody = this.add.text(W / 2, H / 2 - (isLandscape ? 15 : 45), \'\', {',
  "      fontFamily: FONT, fontSize: isLandscape ? '16px' : '17px', color: hex(C.inkSoft),",
], 'troll body');

/* 16 + 17. refreshPalette runtime bases */
add([
  "    this.toolSlot.plate.setStrokeStyle(3, this.tool === 'build' ? C.line : C.gold, 1);",
  '    this.toolSlot.plate.setFillStyle(toolFill[this.tool], 1);',
], [
  "    this.toolSlot.setBase({ fill: toolFill[this.tool], stroke: C.ink });",
], 'tool base');
add([
  '    this.sellBtn.plate.setStrokeStyle(isSelling ? 4 : 2, isSelling ? C.gold : 0x6b3030, 1);',
  '    this.sellBtn.plate.setFillStyle(isSelling ? 0x5a1e1e : 0x2a1a1a, 1);',
  '    this.repairBtn.plate.setStrokeStyle(isRepairing ? 4 : 2, isRepairing ? C.gold : 0x2f6b3f, 1);',
  '    this.repairBtn.plate.setFillStyle(isRepairing ? 0x1d4d29 : 0x17261c, 1);',
], [
  '    this.sellBtn.setBase({ fill: isSelling ? C.ink : C.crimson, stroke: C.ink });',
  '    this.repairBtn.setBase({ fill: isRepairing ? C.ink : C.green, stroke: C.ink });',
], 'sell/repair base');

/* 18. damage text (6-space) */
add([
  "      fontFamily: FONT, fontSize: '20px', color: '#e8b73a', fontStyle: 'bold',",
  "      stroke: '#0b0a12', strokeThickness: 4,",
], [
  "      fontFamily: FONT, fontSize: '20px', color: hex(C.gold), fontStyle: 'bold',",
  '      stroke: hex(C.bgDeep), strokeThickness: 4,',
], 'damage text');

const misses = [];
let hits = 0;
for (const p of pairs) {
  const n = s.split(p.o).length - 1;
  if (n === 0) { misses.push(p.tag); continue; }
  hits += n;
  s = s.split(p.o).join(p.n);
}
fs.writeFileSync(P, s);

console.log(`pass2 pairs=${pairs.length} replacements=${hits} misses=${misses.length}`);
if (misses.length) console.log('MISS:', misses.join(' | '));
const lh = s.match(/'#[0-9a-fA-F]{6}'/g) || [];
const l0 = s.match(/0x[0-9a-fA-F]{6}/g) || [];
console.log("leftover '#hex':", lh.length, [...new Set(lh)].join(' '));
console.log('leftover 0x:', l0.length, [...new Set(l0)].join(' '));
