import Phaser from 'phaser';
import { C, getInitDimensions } from './config/palette.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import { attachAudioUnlock, startMusic } from './systems/audio.js';
import { loadSave } from './systems/save.js';

attachAudioUnlock();

// Fonts must be ready before the canvas draws, or every Cinzel/Archivo label
// renders in a fallback and the design system is not what ships.
const FONT_PROBES = [
  '700 42px Cinzel',
  '700 24px Archivo',
  '400 16px Archivo',
];
const FONT_TIMEOUT = 3000;

function fontsReady() {
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return Promise.resolve();
  const loads = FONT_PROBES.map((f) => document.fonts.load(f).catch(() => {}));
  const timeout = new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT));
  return Promise.race([Promise.all(loads), timeout]);
}

async function boot() {
  await fontsReady();

  const { W, H } = getInitDimensions();
  const dpr = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2;

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: W,
    height: H,
    resolution: dpr,
    parent: 'game-container',
    backgroundColor: C.bgDeep,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: W,
      height: H,
    },
    render: {
      antialias: true,
      antialiasGL: true,
      roundPixels: false,
      pixelArt: false,
      powerPreference: 'high-performance',
      mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
    },
    input: { activePointers: 3 },
    scene: [BootScene, MenuScene, GameScene],
  });

  // Hide the HTML splash once the first scene has drawn.
  game.events.once('ready', () => {
    const b = document.getElementById('boot');
    if (b) { b.classList.add('hide'); setTimeout(() => b.remove(), 500); }
    if (loadSave().music) startMusic();
  });

  window.__game = game;
}

boot();

// Belt & braces: some browsers only let us drop the splash after load.
window.addEventListener('load', () => {
  setTimeout(() => {
    const b = document.getElementById('boot');
    if (b) { b.classList.add('hide'); setTimeout(() => b.remove(), 500); }
  }, 1500);
});
