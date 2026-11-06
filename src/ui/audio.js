/** 极简环境音乐合成器 — WebAudio 生成式氛围铺底 + 频谱分析（驱动视觉izer / 灵动岛） */
import { state, emit } from './state.js';

let ctx = null;
let master = null;
let analyser = null;
let chordTimer = 0;
let chordIdx = 0;
let live = []; // 当前发声节点

const CHORDS = [
  [220.0, 277.18, 329.63],   // A maj
  [174.61, 220.0, 261.63],   // F maj
  [196.0, 246.94, 293.66],   // G maj
  [164.81, 207.65, 246.94],  // E maj
];

export function ensureAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.0;
  analyser = ctx.createAnalyser();
  analyser.fftSize = 64;
  analyser.smoothingTimeConstant = 0.72;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp);
  comp.connect(analyser);
  analyser.connect(ctx.destination);
}

function playChord(freqs) {
  const now = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.32, now + 1.4);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 5.2);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.8;

  // 慢 LFO 扫滤波，制造“液态呼吸感”
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.12;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 420;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start(now);

  const oscs = freqs.map((f, i) => {
    const o = ctx.createOscillator();
    o.type = i === 0 ? 'triangle' : 'sawtooth';
    o.frequency.value = f;
    o.detune.value = (i - 1) * 7;
    o.connect(filter);
    o.start(now);
    o.stop(now + 5.4);
    return o;
  });

  filter.connect(g);
  g.connect(master);
  lfo.stop(now + 5.4);
  live = [...oscs, lfo];
}

export function isPlaying() {
  return state.playing;
}

export function togglePlay() {
  ensureAudio();
  if (ctx.state === 'suspended') ctx.resume();
  state.playing = !state.playing;
  if (state.playing) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.6);
    chordIdx = 0;
    playChord(CHORDS[0]);
    chordTimer = setInterval(() => {
      if (!state.playing) return;
      chordIdx = (chordIdx + 1) % CHORDS.length;
      playChord(CHORDS[chordIdx]);
    }, 4200);
  } else {
    master.gain.setTargetAtTime(0.0, ctx.currentTime, 0.25);
    clearInterval(chordTimer);
  }
  emit('play-change', state.playing);
  return state.playing;
}

/** 0..1 × 24 频谱条 */
export function spectrum(bins = 24) {
  const out = new Array(bins).fill(0);
  if (!analyser) return out;
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  for (let i = 0; i < bins; i++) {
    const idx = Math.min(data.length - 1, Math.floor(i * data.length / bins));
    out[i] = data[idx] / 255;
  }
  return out;
}
