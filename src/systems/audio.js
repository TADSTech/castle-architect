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

// ------------------------------------------------------------- custom music & dynamic synth
// Drop your own tracks into public/music/ using these exact names:
//   1. game-music-ambient.mp3 (or game-music.mp3) - Calm build phase & menus
//   2. game-music-battle.mp3                      - Active siege (Keep >= 50% HP)
//   3. game-music-low.mp3                         - Active siege (Keep < 50% HP)
//   4. game-music-critical.mp3                    - Active siege (Keep < 20% HP)
// Any of .mp3 / .ogg / .m4a / .wav is accepted (first one found wins).
//
// 100% SAMPLE-ACCURATE GAPLESS WEB-AUDIO LOOP ENGINE:
// Decodes audio PCM directly in memory, calculates an equal-power (sin/cos)
// 1.0-second seamless loop splice, and runs native C++ DSP looping on the Web Audio thread.
const MUSIC_FILES = {
  ambience: 'music/game-music-ambient',
  calm: 'music/game-music-ambient',
  battle: 'music/game-music-battle',
  low: 'music/game-music-low',
  critical: 'music/game-music-critical',
};
const MUSIC_EXTS = ['.mp3', '.ogg', '.m4a', '.wav'];
const MUSIC_CHAIN = {
  ambience: ['ambience', 'calm', 'battle', 'low', 'critical'],
  calm: ['ambience', 'calm', 'battle', 'low', 'critical'],
  battle: ['battle', 'ambience', 'calm', 'low', 'critical'],
  low: ['low', 'battle', 'critical', 'ambience', 'calm'],
  critical: ['critical', 'low', 'battle', 'ambience', 'calm'],
};
const MUSIC_VOLUMES = {
  ambience: 0.045, // -20 dB relative to standard 0.45 (10^(-20/20) = 0.1x)
  calm: 0.045,
  battle: 0.20,   // -7 dB relative to standard 0.45 (10^(-7/20) = 0.447x)
  low: 0.215,     // -7 dB relative to standard 0.48
  critical: 0.23, // -7 dB relative to standard 0.52
};
const MUSIC_VOL = 0.20;
const FADE_SEC = 1.2;
const LOOP_CROSSFADE_SEC = 1.0;

const bufferCache = new Map(); // key -> AudioBuffer
const loadingPromises = new Map(); // key -> Promise<AudioBuffer|null>
const dead = new Set(); // key -> not found

let activeVoiceNode = null; // { source, gain, key }
let outgoingVoiceNodes = []; // array of { source, gain } fading out
let musicState = 'ambience';
let wanted = false;

function createSeamlessLoopBuffer(audioCtx, originalBuffer, crossfadeSec = LOOP_CROSSFADE_SEC) {
  const sampleRate = originalBuffer.sampleRate;
  const numChannels = originalBuffer.numberOfChannels;
  const origLen = originalBuffer.length;
  
  const maxFade = Math.floor(origLen / 4);
  const fadeLen = Math.min(Math.floor(sampleRate * crossfadeSec), maxFade);
  
  if (fadeLen <= 0 || origLen <= fadeLen * 2) {
    return originalBuffer;
  }
  
  const newLen = origLen - fadeLen;
  const loopBuffer = audioCtx.createBuffer(numChannels, newLen, sampleRate);
  
  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = originalBuffer.getChannelData(ch);
    const dstData = loopBuffer.getChannelData(ch);
    const endOffset = origLen - fadeLen;
    
    // Equal-power crossfade of the seam
    for (let i = 0; i < fadeLen; i++) {
      const t = i / fadeLen;
      const inWeight = Math.sin(t * 0.5 * Math.PI);
      const outWeight = Math.cos(t * 0.5 * Math.PI);
      
      dstData[i] = srcData[i] * inWeight + srcData[endOffset + i] * outWeight;
    }
    
    // Middle bulk data
    for (let i = fadeLen; i < newLen; i++) {
      dstData[i] = srcData[i];
    }
  }
  
  return loopBuffer;
}

async function loadTrackBuffer(key) {
  if (bufferCache.has(key)) return bufferCache.get(key);
  if (loadingPromises.has(key)) return loadingPromises.get(key);
  if (dead.has(key)) return null;

  const c = ensure();
  if (!c) return null;

  const promise = (async () => {
    const base = (import.meta.env && import.meta.env.BASE_URL) || './';
    const prefix = MUSIC_FILES[key] || 'music/game-music';

    for (const ext of MUSIC_EXTS) {
      const url = base + prefix + ext;
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const arrayBuf = await res.arrayBuffer();
        const decoded = await c.decodeAudioData(arrayBuf);
        const seamless = createSeamlessLoopBuffer(c, decoded, LOOP_CROSSFADE_SEC);
        bufferCache.set(key, seamless);
        return seamless;
      } catch {
        // try next extension
      }
    }

    dead.add(key);
    return null;
  })();

  loadingPromises.set(key, promise);
  return promise;
}

function pickKey(state) {
  const list = MUSIC_CHAIN[state] || MUSIC_CHAIN.ambience;
  for (const k of list) if (!dead.has(k)) return k;
  return null;
}

async function playMusic() {
  const c = ensure();
  if (!c || !wanted || !loadSave().music) return;
  if (c.state === 'suspended') {
    try { await c.resume(); } catch {}
  }

  const key = pickKey(musicState);
  if (!key) {
    stopTrackVoices(FADE_SEC);
    startProceduralMusic(musicState);
    return;
  }

  // If already playing this track, don't restart it
  if (activeVoiceNode && activeVoiceNode.key === key) {
    return;
  }

  const buffer = await loadTrackBuffer(key);
  if (!wanted || !loadSave().music) return;

  if (!buffer) {
    const fallbackKey = pickKey(musicState);
    if (!fallbackKey) {
      stopTrackVoices(FADE_SEC);
      startProceduralMusic(musicState);
    } else {
      playMusic();
    }
    return;
  }

  // Check again in case state changed during async buffer decode
  if (activeVoiceNode && activeVoiceNode.key === key) return;

  stopProceduralMusic();
  const t0 = c.currentTime;
  const targetVol = MUSIC_VOLUMES[key] || MUSIC_VOL;

  // Create new voice node
  const source = c.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(targetVol, t0 + FADE_SEC);

  source.connect(gain);
  gain.connect(master);
  source.start(t0);

  // Fade out previous active voice
  if (activeVoiceNode) {
    const prev = activeVoiceNode;
    try {
      prev.gain.gain.setValueAtTime(Math.max(0.0001, prev.gain.gain.value), t0);
      prev.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + FADE_SEC);
      setTimeout(() => {
        try {
          prev.source.stop();
          prev.source.disconnect();
          prev.gain.disconnect();
        } catch {}
      }, FADE_SEC * 1000 + 100);
    } catch {}
  }

  activeVoiceNode = { source, gain, key };
}

function stopTrackVoices(fadeSec = FADE_SEC) {
  const c = ensure();
  if (activeVoiceNode) {
    const prev = activeVoiceNode;
    activeVoiceNode = null;
    if (c) {
      const t0 = c.currentTime;
      try {
        prev.gain.gain.setValueAtTime(Math.max(0.0001, prev.gain.gain.value), t0);
        prev.gain.gain.exponentialRampToValueAtTime(0.0001, t0 + fadeSec);
        setTimeout(() => {
          try {
            prev.source.stop();
            prev.source.disconnect();
            prev.gain.disconnect();
          } catch {}
        }, fadeSec * 1000 + 100);
      } catch {
        try { prev.source.stop(); } catch {}
      }
    } else {
      try { prev.source.stop(); } catch {}
    }
  }
}

export function startMusic() {
  if (!loadSave().music) { stopMusic(); return; }
  wanted = true;
  playMusic();
}

export function stopMusic() {
  wanted = false;
  stopTrackVoices(FADE_SEC);
  stopProceduralMusic();
}

// Called by GameScene & MenuScene:
//   'ambience' | 'battle' | 'low' | 'critical'
export function setMusicState(state) {
  const normalized = (state === 'calm' || state === 'build') ? 'ambience' : state;
  if (normalized === musicState) return;
  musicState = normalized;
  if (wanted && loadSave().music) playMusic();
}

// ------------------------------------------------------------- 4-Tier Procedural Synth Music Engine
let synthTimer = null;
let synthBeat = 0;

// Musical scales
const AMBIENT_NOTES = [110, 130.81, 146.83, 164.81, 196, 220, 261.63]; // A Minor Pentatonic
const BATTLE_BASS = [55, 55, 65.41, 73.42, 82.41, 73.42, 65.41, 55];  // A2 Marching Bass
const LOW_BASS = [55, 55, 48.99, 48.99, 43.65, 43.65, 41.20, 41.20];   // A -> G -> F -> E Minor Descending
const CRITICAL_PULSE = [55, 58.27, 55, 58.27];                         // A -> Bb Discordant Warning

function startProceduralMusic(state) {
  stopProceduralMusic();
  if (!unlocked || !loadSave().music) return;

  const intervalMs = state === 'critical' ? 375 : state === 'low' ? 435 : state === 'battle' ? 500 : 900;

  synthTimer = setInterval(() => {
    if (!unlocked || !loadSave().music) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;

    if (musicState === 'ambience') {
      // 1. Ambience: Gentle lute/harp plucks & warm sub drone (-20 dB scale)
      const note = AMBIENT_NOTES[(synthBeat * 3 + (synthBeat % 3)) % AMBIENT_NOTES.length];
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t0);
      g.gain.setValueAtTime(0.00001, t0);
      g.gain.exponentialRampToValueAtTime(0.008, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.00001, t0 + 1.4);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + 1.5);

      // Deep Root Drone every 4 beats (-20 dB scale)
      if (synthBeat % 4 === 0) {
        const drone = c.createOscillator();
        const dg = c.createGain();
        drone.type = 'sine';
        drone.frequency.setValueAtTime(55, t0);
        dg.gain.setValueAtTime(0.00001, t0);
        dg.gain.exponentialRampToValueAtTime(0.009, t0 + 0.6);
        dg.gain.exponentialRampToValueAtTime(0.00001, t0 + 3.2);
        drone.connect(dg); dg.connect(master);
        drone.start(t0); drone.stop(t0 + 3.4);
      }
    } else if (musicState === 'battle') {
      // 2. Battle: 120 BPM Marching War Drums + Brass Horn Bassline (-7 dB scale)
      const bassNote = BATTLE_BASS[synthBeat % BATTLE_BASS.length];
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassNote * 2, t0);
      const filt = c.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(320, t0);
      filt.frequency.exponentialRampToValueAtTime(140, t0 + 0.3);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.054, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.38);
      osc.connect(filt); filt.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + 0.4);

      // War Drum Kick on beats 0 & 2
      if (synthBeat % 2 === 0) {
        const kick = c.createOscillator();
        const kg = c.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(140, t0);
        kick.frequency.exponentialRampToValueAtTime(38, t0 + 0.12);
        kg.gain.setValueAtTime(0.108, t0);
        kg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
        kick.connect(kg); kg.connect(master);
        kick.start(t0); kick.stop(t0 + 0.24);
      }
    } else if (musicState === 'low') {
      // 3. Low HP (<50%): 138 BPM Tense Minor Descending Progression (-7 dB scale)
      const bassNote = LOW_BASS[synthBeat % LOW_BASS.length];
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassNote * 2, t0);
      const filt = c.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(450, t0);
      filt.frequency.exponentialRampToValueAtTime(160, t0 + 0.25);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.067, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
      osc.connect(filt); filt.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + 0.35);

      // Fast War Drum Roll
      const kick = c.createOscillator();
      const kg = c.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(160, t0);
      kick.frequency.exponentialRampToValueAtTime(42, t0 + 0.1);
      kg.gain.setValueAtTime(0.116, t0);
      kg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      kick.connect(kg); kg.connect(master);
      kick.start(t0); kick.stop(t0 + 0.2);
    } else if (musicState === 'critical') {
      // 4. Critical HP (<20%): 160 BPM Heartbeat Sub + Panic Stabs (-7 dB scale)
      const pulseNote = CRITICAL_PULSE[synthBeat % CRITICAL_PULSE.length];
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pulseNote * 3, t0);
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.setValueAtTime(600, t0);
      filt.Q.setValueAtTime(4.0, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
      osc.connect(filt); filt.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + 0.26);

      // Pounding Alarm Double-Heartbeat
      const hb = c.createOscillator();
      const hbg = c.createGain();
      hb.type = 'sine';
      hb.frequency.setValueAtTime(180, t0);
      hb.frequency.exponentialRampToValueAtTime(32, t0 + 0.14);
      hbg.gain.setValueAtTime(0.156, t0);
      hbg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      hb.connect(hbg); hbg.connect(master);
      hb.start(t0); hb.stop(t0 + 0.22);
    }

    synthBeat++;
  }, intervalMs);
}

function stopProceduralMusic() {
  if (synthTimer) { clearInterval(synthTimer); synthTimer = null; }
}

// QA hook: report which track is live, its volume, and what failed to load.
window.__music = () => ({
  state: musicState,
  wanted,
  on: loadSave().music,
  synthActive: !!synthTimer,
  dead: [...dead],
  activeTrack: activeVoiceNode ? activeVoiceNode.key : null,
  cachedBuffers: [...bufferCache.keys()],
});


