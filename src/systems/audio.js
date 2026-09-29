// Zero-asset audio: every sound is synthesised on the fly with WebAudio.
import { loadSave, writeSave } from './save.js';

let ctx = null;
let master = null;
let unlocked = false;

function ensure() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

function unlock() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
  unlocked = true;
}

// Browsers require a gesture before any sound. Call this from the first pointer/key.
export function attachAudioUnlock() {
  const go = () => {
    unlock();
    window.removeEventListener('pointerdown', go);
    window.removeEventListener('keydown', go);
  };
  window.addEventListener('pointerdown', go);
  window.addEventListener('keydown', go);
}

function tone({ freq = 440, dur = 0.12, type = 'square', gain = 0.22, slide = 0, delay = 0 }) {
  const c = ensure();
  if (!c || !unlocked || !loadSave().sound) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.2, gain = 0.25, freq = 900, delay = 0 }) {
  const c = ensure();
  if (!c || !unlocked || !loadSave().sound) return;
  const t0 = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(freq, t0);
  filt.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.25), t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt); filt.connect(g); g.connect(master);
  src.start(t0);
}

function makeDistortionCurve(amount = 20) {
  const n = 44100;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; ++i) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

let distCurve = null;

function boom({ dur = 0.85, gain = 0.45, sub = 48, punch = 180, delay = 0 } = {}) {
  const c = ensure();
  if (!c || !unlocked || !loadSave().sound) return;
  const t0 = c.currentTime + delay;

  // 1. Heavy Low-End Punch / Transient (Pitch-dropping sub oscillator)
  const osc = c.createOscillator();
  const oscGain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(punch, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(24, sub), t0 + 0.07);
  osc.frequency.exponentialRampToValueAtTime(18, t0 + dur * 0.7);

  oscGain.gain.setValueAtTime(0.0001, t0);
  oscGain.gain.exponentialRampToValueAtTime(gain * 0.9, t0 + 0.003);
  oscGain.gain.exponentialRampToValueAtTime(gain * 0.4, t0 + 0.12);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.85);

  osc.connect(oscGain);
  oscGain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur);

  // 2. Fiery Blast / Saturated Body Noise (Filtered noise through waveshaper & lowpass sweep)
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    const pink = b0 + b1 + b2 + white * 0.5362;
    const env = Math.pow(1 - i / len, 1.8);
    d[i] = pink * env;
  }
  const noiseSrc = c.createBufferSource();
  noiseSrc.buffer = buf;

  const lowpass = c.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(1400, t0);
  lowpass.frequency.exponentialRampToValueAtTime(260, t0 + 0.12);
  lowpass.frequency.exponentialRampToValueAtTime(55, t0 + dur);
  lowpass.Q.setValueAtTime(3.2, t0); // resonant punch

  if (!distCurve) distCurve = makeDistortionCurve(16);
  const shaper = c.createWaveShaper();
  shaper.curve = distCurve;
  shaper.oversample = '2x';

  const noiseGain = c.createGain();
  noiseGain.gain.setValueAtTime(gain * 0.95, t0);
  noiseGain.gain.exponentialRampToValueAtTime(gain * 0.35, t0 + 0.16);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  noiseSrc.connect(lowpass);
  lowpass.connect(shaper);
  shaper.connect(noiseGain);
  noiseGain.connect(master);
  noiseSrc.start(t0);

  // 3. Sub-bass Ground Shake Rumble (Deep 45Hz sub sine wave)
  const subOsc = c.createOscillator();
  const subGain = c.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(55, t0);
  subOsc.frequency.exponentialRampToValueAtTime(30, t0 + dur * 0.8);

  subGain.gain.setValueAtTime(0.0001, t0);
  subGain.gain.exponentialRampToValueAtTime(gain * 0.75, t0 + 0.015);
  subGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.9);

  subOsc.connect(subGain);
  subGain.connect(master);
  subOsc.start(t0);
  subOsc.stop(t0 + dur);
}

export const SFX = {
  tap:       () => tone({ freq: 520, dur: 0.05, type: 'triangle', gain: 0.14 }),
  place:     () => { tone({ freq: 300, dur: 0.09, type: 'square', gain: 0.16 }); tone({ freq: 460, dur: 0.1, type: 'square', gain: 0.1, delay: 0.05 }); },
  deny:      () => tone({ freq: 150, dur: 0.16, type: 'sawtooth', gain: 0.16, slide: -60 }),
  sell:      () => tone({ freq: 620, dur: 0.1, type: 'triangle', gain: 0.15, slide: -260 }),
  repair:    () => { tone({ freq: 440, dur: 0.07, type: 'triangle', gain: 0.14 }); tone({ freq: 660, dur: 0.09, type: 'triangle', gain: 0.12, delay: 0.06 }); },
  shot:      () => tone({ freq: 700, dur: 0.06, type: 'square', gain: 0.09, slide: -420 }),
  cannon:    () => boom({ dur: 0.8, gain: 0.48, punch: 200, sub: 48 }),
  boom:      () => boom({ dur: 0.95, gain: 0.52, punch: 220, sub: 42 }),
  explosion: () => boom({ dur: 0.85, gain: 0.5, punch: 190, sub: 45 }),
  hit:       () => noise({ dur: 0.07, gain: 0.1, freq: 2600 }),
  hurt:      () => tone({ freq: 200, dur: 0.09, type: 'square', gain: 0.1, slide: -90 }),
  trap:      () => { noise({ dur: 0.22, gain: 0.28, freq: 2400 }); tone({ freq: 880, dur: 0.1, type: 'sawtooth', gain: 0.14, slide: -700 }); },
  death:     () => { noise({ dur: 0.22, gain: 0.2, freq: 1200 }); tone({ freq: 320, dur: 0.2, type: 'triangle', gain: 0.14, slide: -240 }); },
  build:     () => tone({ freq: 240, dur: 0.14, type: 'square', gain: 0.18, slide: 90 }),
  wave:      () => { tone({ freq: 330, dur: 0.18, type: 'triangle', gain: 0.2 }); tone({ freq: 495, dur: 0.2, type: 'triangle', gain: 0.16, delay: 0.12 }); },
  win:       () => { [392, 494, 587, 784].forEach((f, i) => tone({ freq: f, dur: 0.24, type: 'triangle', gain: 0.18, delay: i * 0.09 })); },
  lose:      () => { [330, 262, 196, 147].forEach((f, i) => tone({ freq: f, dur: 0.34, type: 'sawtooth', gain: 0.16, delay: i * 0.14 })); },
  gold:      () => { tone({ freq: 880, dur: 0.07, type: 'triangle', gain: 0.13 }); tone({ freq: 1320, dur: 0.1, type: 'triangle', gain: 0.1, delay: 0.05 }); },
  ability:   () => { boom({ dur: 0.85, gain: 0.44, punch: 260, sub: 44 }); tone({ freq: 620, dur: 0.2, type: 'sawtooth', gain: 0.16, slide: -480 }); },
  synergy:   () => { tone({ freq: 660, dur: 0.16, type: 'sine', gain: 0.16 }); tone({ freq: 990, dur: 0.24, type: 'sine', gain: 0.12, delay: 0.1 }); },
  tick:      () => tone({ freq: 880, dur: 0.03, type: 'triangle', gain: 0.1, slide: -200 }),
  step:      () => tone({ freq: 800, dur: 0.035, type: 'triangle', gain: 0.1, slide: -150 }),
};

export function toggleSound() {
  const s = loadSave();
  s.sound = !s.sound;
  writeSave();
  return s.sound;
}

// ------------------------------------------------------------- custom music
// Drop your own tracks into public/music/ using these exact names:
//   game-music.mp3          - Keep at 50% HP or more
//   game-music-low.mp3      - Keep below 50% HP
//   game-music-critical.mp3 - Keep below 20% HP
// Any of .mp3 / .ogg / .m4a / .wav is accepted (first one found wins).
// Tracks crossfade as the Keep takes damage. If a file is missing the
// next track in the chain is used; if the folder is empty the synthesised
// drone below keeps playing so the game is never silent.
const MUSIC_FILES = {
  calm: 'music/game-music',
  low: 'music/game-music-low',
  critical: 'music/game-music-critical',
};
const MUSIC_EXTS = ['.mp3', '.ogg', '.m4a', '.wav'];
const MUSIC_CHAIN = {
  calm: ['calm', 'low', 'critical'],
  low: ['low', 'critical', 'calm'],
  critical: ['critical', 'low', 'calm'],
};
const MUSIC_VOL = 0.45;
const FADE_MS = 1600;

const tracks = {};   // key -> HTMLAudioElement
const dead = new Set(); // key -> file known to be absent
const attempt = {};  // key -> extension index being tried
let current = null;  // element fading in / playing
let outgoing = null; // element fading out
let fadeTimer = null;
let musicState = 'calm';
let wanted = false;
let gestureArmed = false;

function trackUrl(key) {
  const base = (import.meta.env && import.meta.env.BASE_URL) || './';
  return base + MUSIC_FILES[key] + MUSIC_EXTS[attempt[key] || 0];
}

function ensureTrack(key) {
  if (tracks[key]) return tracks[key];
  const a = new Audio();
  a.loop = true;
  a.preload = 'auto';
  a.volume = 0;
  a.addEventListener('error', () => {
    if (tracks[key] !== a) return; // stale element
    const i = (attempt[key] || 0) + 1;
    attempt[key] = i;
    if (i < MUSIC_EXTS.length) { a.src = trackUrl(key); return; } // try next format
    delete tracks[key];
    if (dead.has(key)) return;
    dead.add(key);
    if (current === a) { current = null; playMusic(); }
  });
  tracks[key] = a;
  a.src = trackUrl(key);
  return a;
}

function pickKey(state) {
  for (const k of MUSIC_CHAIN[state]) if (!dead.has(k)) return k;
  return null;
}

function resume(el) {
  if (!el) return;
  const p = el.play();
  if (p && p.catch) p.catch(() => armGestureRetry());
}

function armGestureRetry() {
  if (gestureArmed) return;
  gestureArmed = true;
  const go = () => {
    gestureArmed = false;
    window.removeEventListener('pointerdown', go);
    window.removeEventListener('keydown', go);
    if (wanted && loadSave().music) resume(current);
  };
  window.addEventListener('pointerdown', go);
  window.addEventListener('keydown', go);
}

function endFade() {
  if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
  if (outgoing) {
    outgoing.pause();
    try { outgoing.currentTime = 0; } catch { /* ignore */ }
    outgoing.volume = 0;
    outgoing = null;
  }
}

function fade(to, from) {
  endFade();
  resume(to);
  if (from === to) { to.volume = MUSIC_VOL; return; }
  outgoing = from || null;
  const t0 = performance.now();
  fadeTimer = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / FADE_MS);
    const e = k * k * (3 - 2 * k); // smoothstep
    to.volume = e * MUSIC_VOL;
    if (outgoing) outgoing.volume = (1 - e) * MUSIC_VOL;
    if (k >= 1) endFade();
  }, 50);
}

function playMusic() {
  const key = pickKey(musicState);
  if (!key) { // no custom files at all -> synth drone
    endFade();
    if (current) { current.pause(); current = null; }
    startDrone();
    return;
  }
  stopDrone();
  const to = ensureTrack(key);
  if (to === current) { resume(to); return; }
  const from = current;
  current = to;
  fade(to, from);
}

export function startMusic() {
  if (!loadSave().music) { stopMusic(); return; }
  wanted = true;
  playMusic();
}

export function stopMusic() {
  wanted = false;
  endFade();
  if (current) {
    current.pause();
    try { current.currentTime = 0; } catch { /* ignore */ }
    current.volume = 0;
    current = null;
  }
  stopDrone();
}

// Called by the game whenever the Keep's health crosses a threshold.
//   'calm' | 'low' | 'critical'
export function setMusicState(state) {
  if (state === musicState) return;
  musicState = state;
  if (wanted && loadSave().music) playMusic();
}

// Fallback: very light generative drone when no custom track is available.
let droneTimer = null;
let droneStep = 0;
const SCALE = [110, 130.81, 146.83, 164.81, 196, 220];

function startDrone() {
  if (droneTimer) return;
  droneTimer = setInterval(() => {
    if (!unlocked || !loadSave().music) return;
    const c = ensure();
    if (!c) return;
    const note = SCALE[(droneStep * 3 + (droneStep % 2)) % SCALE.length];
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = note;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.7);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + 1.8);
    droneStep++;
  }, 900);
}

function stopDrone() {
  if (droneTimer) { clearInterval(droneTimer); droneTimer = null; }
}

// QA hook: report which track is live, its volume, and what failed to load.
window.__music = () => ({
  state: musicState,
  wanted,
  on: loadSave().music,
  drone: !!droneTimer,
  dead: [...dead],
  tracks: Object.fromEntries(Object.keys(MUSIC_FILES).map((k) => {
    const a = tracks[k];
    return [k, a
      ? { vol: +a.volume.toFixed(3), paused: a.paused, t: +a.currentTime.toFixed(2), ready: a.readyState, err: !!a.error }
      : 'unset'];
  })),
});
