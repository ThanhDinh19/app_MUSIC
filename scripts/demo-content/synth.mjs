/**
 * Bộ tổng hợp nhạc demo (procedural music) — viết thuần JavaScript, không cần thư viện âm thanh.
 *
 * Quy trình cho mỗi bài:
 *   1. buildArrangement(): chia bài thành các đoạn (intro, A, B, break, outro) theo vòng hợp âm.
 *   2. compose(): sinh "nốt nhạc" cho từng nhóm nhạc cụ (pad, keys, bass, drums, arp, lead).
 *   3. render: tổng hợp từng nốt thành sóng âm, áp dụng filter/ducking, gửi vào delay & reverb.
 *   4. master: cân bằng âm lượng, soft-clip, fade in/out → trả về 2 kênh Float32Array.
 *
 * Mọi thứ đều dùng bộ sinh số ngẫu nhiên có seed nên kết quả lặp lại được.
 */
import { Mp3Encoder } from '@breezystack/lamejs';

export const SAMPLE_RATE = 44100;
const SR = SAMPLE_RATE;
const TAU = Math.PI * 2;
const TAIL_SEC = 3.5;

/* ------------------------------------------------------------------ */
/* Tiện ích                                                            */
/* ------------------------------------------------------------------ */

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (a, b) => a + (b - a) * next();
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.chance = (p) => next() < p;
  return next;
}

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function panGains(pan) {
  const p = (clamp(pan, -1, 1) + 1) * 0.25 * Math.PI;
  return [Math.cos(p), Math.sin(p)];
}

function polyBlep(t, dt) {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
}

/** Bộ lọc state-variable (TPT) — ổn định khi thay đổi cutoff theo thời gian. */
class Svf {
  constructor() {
    this.ic1 = 0;
    this.ic2 = 0;
    this.set(1000, 0.707);
  }
  set(fc, q) {
    const g = Math.tan((Math.PI * clamp(fc, 20, SR * 0.45)) / SR);
    this.k = 1 / q;
    this.a1 = 1 / (1 + g * (g + this.k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
  }
  /** Trả về [low, band, high] qua các thuộc tính để tránh cấp phát mảng. */
  tick(x) {
    const v3 = x - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.low = v2;
    this.band = v1;
    this.high = x - this.k * v1 - v2;
    return v2;
  }
}

/* ------------------------------------------------------------------ */
/* Nhạc lý                                                             */
/* ------------------------------------------------------------------ */

const NOTE_INDEX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
};

function scaleSemitone(scale, degree) {
  const oct = Math.floor(degree / 7);
  const idx = ((degree % 7) + 7) % 7;
  return scale[idx] + 12 * oct;
}

/** Hợp âm xếp chồng quãng 3 trong âm giai. `size` = 3 (hợp âm ba), 4 (7th), 5 (9th). */
function makeChord(keyRoot, scale, degree, size) {
  const semis = [];
  for (let i = 0; i < size; i++) semis.push(scaleSemitone(scale, degree + 2 * i));
  const root = semis[0];
  return {
    degree,
    rootPc: (keyRoot + root) % 12,
    /** Khoảng cách (nửa cung) của từng nốt so với nốt gốc của hợp âm. */
    rel: semis.map((s) => s - root),
    pcs: semis.map((s) => (keyRoot + s) % 12),
  };
}

/** Đặt các pitch-class vào cửa sổ [lo, lo+12) → voicing gần, tự động "dẫn giọng" mượt. */
function voiceInWindow(pcs, lo) {
  return pcs.map((pc) => lo + ((((pc - lo) % 12) + 12) % 12)).sort((a, b) => a - b);
}

function rootIn(pc, lo) {
  return lo + ((((pc - lo) % 12) + 12) % 12);
}

/** Nốt thứ `idx` trong hợp âm ba (0 = gốc, 1 = quãng 3, 2 = quãng 5, 3 = gốc + 1 quãng tám...). */
function triadTone(chord, idx, lo) {
  const size = 3;
  const oct = Math.floor(idx / size);
  const i = ((idx % size) + size) % size;
  return rootIn(chord.rootPc, lo) + chord.rel[i] + 12 * oct;
}

/* ------------------------------------------------------------------ */
/* Bố cục bài hát                                                      */
/* ------------------------------------------------------------------ */

const SECTION_LAYERS = {
  intro: { pad: 1, keys: 0.55, bass: 0, drums: 0, hats: 0, arp: 0.6, lead: 0, texture: 1 },
  A: { pad: 0.75, keys: 1, bass: 1, drums: 1, hats: 0.7, arp: 0.35, lead: 0, texture: 0.6 },
  B: { pad: 1, keys: 0.9, bass: 1, drums: 1, hats: 1, arp: 1, lead: 1, texture: 0.5 },
  break: { pad: 1, keys: 0.7, bass: 0.6, drums: 0, hats: 0.5, arp: 0.8, lead: 0, texture: 1 },
  outro: { pad: 1, keys: 0.7, bass: 0.4, drums: 0, hats: 0, arp: 0.5, lead: 0, texture: 1 },
};

function planSections(cycles) {
  if (cycles <= 4) return ['intro', 'A', 'B', 'outro'];
  if (cycles === 5) return ['intro', 'A', 'B', 'B', 'outro'];
  if (cycles === 6) return ['intro', 'A', 'B', 'break', 'B', 'outro'];
  if (cycles === 7) return ['intro', 'A', 'B', 'B', 'break', 'B', 'outro'];
  if (cycles === 8) return ['intro', 'A', 'A', 'B', 'B', 'break', 'B', 'outro'];
  const plan = ['intro', 'A', 'A', 'B', 'B'];
  for (let i = 0; i < cycles - 9; i++) plan.push(i % 2 === 0 ? 'A' : 'B');
  plan.push('break', 'B', 'B', 'outro');
  return plan;
}

const CHORD_SIZE = { dreampop: 4, lofi: 5, neosoul: 5, synthwave: 3, ambient: 4 };

export function buildArrangement(spec) {
  const keyRoot = NOTE_INDEX[spec.key];
  const scale = SCALES[spec.scale];
  if (keyRoot === undefined || !scale) throw new Error(`Giọng/âm giai không hợp lệ cho ${spec.id}`);
  const beat = 60 / spec.bpm;
  const barSec = beat * 4;
  const chordBars = spec.chordBars ?? 1;
  const cycleBars = spec.progression.length * chordBars;
  const cycles = clamp(Math.round(spec.targetSec / (cycleBars * barSec)), 4, 12);
  const plan = planSections(cycles);
  const size = CHORD_SIZE[spec.style];
  const chords = spec.progression.map((d) => makeChord(keyRoot, scale, d, size));

  const bars = [];
  plan.forEach((section, sectionIndex) => {
    for (let b = 0; b < cycleBars; b++) {
      const chordIdx = Math.floor(b / chordBars);
      bars.push({
        index: bars.length,
        start: bars.length * barSec,
        section,
        sectionIndex,
        barInSection: b,
        chordStart: b % chordBars === 0,
        chord: chords[chordIdx],
        next: chords[Math.floor(((b + 1) % cycleBars) / chordBars)],
        isLastOfSection: b === cycleBars - 1,
        nextSection: plan[sectionIndex + 1] ?? null,
        layers: SECTION_LAYERS[section],
      });
    }
  });
  return { bars, beat, barSec, chordBars, totalSec: bars.length * barSec, keyRoot, scale };
}

/** Thời lượng (giây) của file âm thanh — tính được mà không cần render. */
export function computeDurationSec(spec) {
  const { totalSec } = buildArrangement(spec);
  return Math.ceil((totalSec + TAIL_SEC) * SR) / SR;
}

/* ------------------------------------------------------------------ */
/* Nhạc cụ (render từng nốt vào buffer L/R)                            */
/* ------------------------------------------------------------------ */

function adsrLevel(x, a, d, s) {
  if (x < a) return x / a;
  if (x < a + d) return 1 - (1 - s) * ((x - a) / d);
  return s;
}

function envAdsr(t, gate, a, d, s, r) {
  if (t <= gate) return adsrLevel(t, a, d, s);
  const rt = (t - gate) / r;
  return rt >= 1 ? 0 : adsrLevel(gate, a, d, s) * (1 - rt) * (1 - rt);
}

const INSTRUMENTS = {
  /** Pad 3 sóng răng cưa lệch nhau (supersaw) — mềm nhờ filter ở bus. */
  supersaw(L, R, s0, ev, rng) {
    const { dur, midi, vel, pan } = ev;
    const a = ev.attack ?? 0.6;
    const rel = ev.release ?? 1.4;
    const n = Math.floor((dur + rel) * SR);
    const f = mtof(midi);
    const detune = [-0.12, 0, 0.12];
    const pans = [pan - 0.5, pan, pan + 0.5].map(panGains);
    const ph = detune.map(() => rng());
    const inc = detune.map((d) => (f * Math.pow(2, d / 12)) / SR);
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const env = envAdsr(k / SR, dur, a, 0.8, 0.85, rel) * vel * 0.33;
      let l = 0;
      let r = 0;
      for (let o = 0; o < 3; o++) {
        ph[o] += inc[o];
        if (ph[o] >= 1) ph[o] -= 1;
        const v = 2 * ph[o] - 1 - polyBlep(ph[o], inc[o]);
        l += v * pans[o][0];
        r += v * pans[o][1];
      }
      L[i] += l * env;
      R[i] += r * env;
    }
  },

  /** Pad sóng tam giác + sine — mềm, dùng cho lo-fi/neo-soul. */
  softpad(L, R, s0, ev) {
    const { dur, midi, vel, pan } = ev;
    const rel = ev.release ?? 1.2;
    const n = Math.floor((dur + rel) * SR);
    const f = mtof(midi);
    const [gl, gr] = panGains(pan);
    let p1 = 0;
    let p2 = 0.25;
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const t = k / SR;
      p1 += f / SR;
      p2 += (f * 1.003) / SR;
      p1 -= Math.floor(p1);
      p2 -= Math.floor(p2);
      const tri = 4 * Math.abs(p1 - 0.5) - 1;
      const v = (tri * 0.6 + Math.sin(TAU * p2) * 0.5) * envAdsr(t, dur, ev.attack ?? 0.5, 0.6, 0.8, rel) * vel * 0.5;
      L[i] += v * gl;
      R[i] += v * gr;
    }
  },

  /** Đàn Rhodes bằng tổng hợp FM: chuông ở đầu nốt, thân ấm, có tremolo. */
  rhodes(L, R, s0, ev) {
    const { dur, midi, vel, pan } = ev;
    const rel = 0.35;
    const n = Math.floor((dur + rel) * SR);
    const f = mtof(midi);
    const tau = 0.9 + (76 - midi) * 0.035;
    const [gl, gr] = panGains(pan);
    const tremPhase = pan * Math.PI;
    let pc = 0;
    let pm = 0;
    let pb = 0;
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const t = k / SR;
      pc += f / SR;
      pm += f / SR;
      pb += (f * 7) / SR;
      const index = (0.6 + 0.9 * vel) * Math.exp(-t / 0.3) + 0.18;
      const carrier = Math.sin(TAU * pc + index * Math.sin(TAU * pm));
      const bell = 0.12 * vel * Math.sin(TAU * pb) * Math.exp(-t / 0.05);
      let env = (t < 0.004 ? t / 0.004 : 1) * Math.exp(-t / tau);
      if (t > dur) env *= Math.max(0, 1 - (t - dur) / rel);
      const trem = 1 + 0.12 * Math.sin(TAU * 4.3 * t + tremPhase);
      const v = (carrier + bell) * env * vel * 0.42 * trem;
      L[i] += v * gl;
      R[i] += v * gr;
    }
  },

  /** Dây gảy Karplus–Strong (có nội suy allpass để đúng cao độ). */
  pluck(L, R, s0, ev, rng) {
    const { dur, midi, vel, pan } = ev;
    const bright = ev.bright ?? 0.5;
    const ring = ev.ring ?? 1.2;
    const n = Math.floor((dur + ring) * SR);
    const period = SR / mtof(midi) - 0.5;
    const N = Math.max(2, Math.floor(period));
    const fr = period - N;
    const C = (1 - fr) / (1 + fr);
    const buf = new Float32Array(N);
    let lp = 0;
    for (let j = 0; j < N; j++) {
      lp += bright * (rng() * 2 - 1 - lp);
      buf[j] = lp;
    }
    const decay = ev.decay ?? 0.996;
    const [gl, gr] = panGains(pan);
    let idx = 0;
    let prev = 0;
    let apX = 0;
    let apY = 0;
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const t = k / SR;
      const cur = buf[idx];
      const avg = decay * 0.5 * (cur + prev);
      prev = cur;
      const ap = C * avg + apX - C * apY;
      apX = avg;
      apY = ap;
      buf[idx] = ap;
      if (++idx >= N) idx = 0;
      let env = vel * 0.9;
      if (t > dur) env *= Math.exp(-(t - dur) / 0.25);
      if (k > n - 400) env *= (n - k) / 400;
      L[i] += cur * env * gl;
      R[i] += cur * env * gr;
    }
  },

  /** Bass sine ấm + bồi âm, bão hoà nhẹ. */
  sinebass(L, R, s0, ev) {
    const { dur, midi, vel } = ev;
    const rel = 0.07;
    const n = Math.floor((dur + rel) * SR);
    const f = mtof(midi);
    let p = 0;
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const t = k / SR;
      p += f / SR;
      const raw = Math.sin(TAU * p) + 0.28 * Math.sin(TAU * 2 * p) + 0.08 * Math.sin(TAU * 3 * p);
      const env = envAdsr(t, dur, 0.008, 0.25, 0.75, rel) * vel;
      const v = Math.tanh(raw * 1.4) * env * 0.7;
      L[i] += v;
      R[i] += v;
    }
  },

  /** Bass răng cưa qua filter có envelope (synthwave). */
  sawbass(L, R, s0, ev) {
    const { dur, midi, vel } = ev;
    const rel = 0.04;
    const n = Math.floor((dur + rel) * SR);
    const f = mtof(midi);
    const inc = f / SR;
    const svf = new Svf();
    let p = 0;
    let sub = 0;
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const t = k / SR;
      if (k % 32 === 0) svf.set(180 + 1500 * Math.exp(-t / 0.09) * vel, 1.4);
      p += inc;
      if (p >= 1) p -= 1;
      sub += inc * 0.5;
      if (sub >= 1) sub -= 1;
      const saw = 2 * p - 1 - polyBlep(p, inc);
      const v = (svf.tick(saw) * 0.8 + Math.sin(TAU * sub) * 0.45) * envAdsr(t, dur, 0.003, 0.15, 0.7, rel) * vel * 0.7;
      L[i] += v;
      R[i] += v;
    }
  },

  /** Lead mềm (tam giác/vuông/răng cưa) có vibrato trễ. */
  lead(L, R, s0, ev) {
    const { dur, midi, vel, pan } = ev;
    const wave = ev.wave ?? 'triangle';
    const rel = ev.release ?? 0.3;
    const n = Math.floor((dur + rel) * SR);
    const f = mtof(midi);
    const [gl, gr] = panGains(pan);
    const svf = new Svf();
    svf.set(ev.cutoff ?? 3200, 0.8);
    let p = 0;
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const t = k / SR;
      const vibDepth = Math.min(1, Math.max(0, (t - 0.18) / 0.3)) * 0.0075;
      const inc = (f * (1 + vibDepth * Math.sin(TAU * 5.3 * t))) / SR;
      p += inc;
      if (p >= 1) p -= 1;
      let v;
      if (wave === 'saw') v = 2 * p - 1 - polyBlep(p, inc);
      else if (wave === 'square') v = (p < 0.5 ? 1 : -1) + polyBlep(p, inc) - polyBlep((p + 0.5) % 1, inc);
      else if (wave === 'sine') v = Math.sin(TAU * p) + 0.15 * Math.sin(TAU * 2 * p);
      else v = 4 * Math.abs(p - 0.5) - 1;
      v = svf.tick(v) * envAdsr(t, dur, ev.attack ?? 0.03, 0.2, 0.8, rel) * vel * 0.45;
      L[i] += v * gl;
      R[i] += v * gr;
    }
  },

  /** Chuông FM (ambient). */
  bell(L, R, s0, ev) {
    const { midi, vel, pan } = ev;
    const n = Math.floor(4 * SR);
    const f = mtof(midi);
    const [gl, gr] = panGains(pan);
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const t = k / SR;
      const index = 2.2 * Math.exp(-t / 0.9);
      const v = Math.sin(TAU * f * t + index * Math.sin(TAU * f * 3.5 * t)) * Math.exp(-t / 1.6) * (t < 0.003 ? t / 0.003 : 1) * vel * 0.3;
      L[i] += v * gl;
      R[i] += v * gr;
    }
  },

  kick(L, R, s0, ev, rng) {
    const { vel } = ev;
    const decay = ev.decay ?? 0.24;
    const n = Math.floor((decay * 2.2) * SR);
    let p = 0;
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const t = k / SR;
      const f = 46 + 115 * Math.exp(-t / 0.032);
      p += f / SR;
      const click = k < 60 ? (rng() * 2 - 1) * 0.25 * (1 - k / 60) : 0;
      const v = Math.tanh((Math.sin(TAU * p) * Math.exp(-t / decay) + click) * 1.6) * vel * 0.9;
      L[i] += v;
      R[i] += v;
    }
  },

  snare(L, R, s0, ev, rng) {
    const { vel, pan } = ev;
    const tone = ev.tone ?? 1;
    const n = Math.floor(0.45 * SR);
    const svf = new Svf();
    svf.set(ev.cutoff ?? 4200, 0.6);
    const [gl, gr] = panGains(pan ?? 0);
    let p = 0;
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const t = k / SR;
      p += 190 / SR;
      const body = Math.sin(TAU * p) * Math.exp(-t / 0.055) * 0.55 * tone;
      svf.tick(rng() * 2 - 1);
      const noise = (svf.low * 0.7 + svf.high * 0.4) * Math.exp(-t / (ev.decay ?? 0.13));
      const v = (body + noise) * vel * 0.6;
      L[i] += v * gl;
      R[i] += v * gr;
    }
  },

  hat(L, R, s0, ev, rng) {
    const { vel, pan } = ev;
    const decay = ev.decay ?? 0.035;
    const n = Math.floor(decay * 6 * SR);
    const svf = new Svf();
    svf.set(ev.cutoff ?? 7500, 0.9);
    const [gl, gr] = panGains(pan ?? 0.25);
    for (let k = 0; k < n; k++) {
      const i = s0 + k;
      if (i >= L.length) break;
      const t = k / SR;
      svf.tick(rng() * 2 - 1);
      const v = svf.high * Math.exp(-t / decay) * vel * 0.35;
      L[i] += v * gl;
      R[i] += v * gr;
    }
  },
};

/* ------------------------------------------------------------------ */
/* Sáng tác: sinh nốt cho từng nhóm nhạc cụ                            */
/* ------------------------------------------------------------------ */

const MOTIF_RHYTHMS = [
  [[0, 1], [1, 0.5], [1.5, 1.5], [3, 1]],
  [[0, 1.5], [1.5, 0.5], [2, 2]],
  [[0.5, 0.5], [1, 1], [2, 0.5], [2.5, 1.5]],
  [[0, 0.5], [0.5, 0.5], [1, 1], [2.5, 0.5], [3, 1]],
  [[0, 2], [2, 1], [3, 1]],
  [[0, 0.75], [0.75, 0.75], [1.5, 2.5]],
];

function makeMotif(rng) {
  const rhythm = rng.pick(MOTIF_RHYTHMS);
  let idx = rng.pick([2, 3, 4]);
  return rhythm.map(([beat, len]) => {
    const note = { beat, len, idx };
    idx = clamp(idx + rng.pick([-1, 1, 1, -1, 0, 2, -2]), 1, 5);
    return note;
  });
}

function swing(beat, amount) {
  const frac = beat - Math.floor(beat);
  return Math.abs(frac - 0.5) < 1e-6 ? beat + amount : beat;
}

const STYLES = {
  dreampop: {
    reverb: { room: 0.88, damp: 0.35 },
    lowpass: null,
    buses: {
      pad: { gain: 0.24, rev: 0.55, del: 0, filter: { base: 1900, depth: 0.6, rate: 0.05, q: 0.8 } },
      keys: { gain: 0.26, rev: 0.35, del: 0.05 },
      bass: { gain: 0.5, rev: 0, del: 0 },
      drums: { gain: 0.62, rev: 0.16, del: 0 },
      arp: { gain: 0.24, rev: 0.45, del: 0.35 },
      lead: { gain: 0.26, rev: 0.55, del: 0.25 },
    },
    swing: 0,
  },
  lofi: {
    reverb: { room: 0.74, damp: 0.5 },
    lowpass: 5200,
    buses: {
      pad: { gain: 0.13, rev: 0.35, del: 0 },
      keys: { gain: 0.42, rev: 0.22, del: 0 },
      bass: { gain: 0.52, rev: 0, del: 0 },
      drums: { gain: 0.6, rev: 0.08, del: 0 },
      arp: { gain: 0.2, rev: 0.3, del: 0.2 },
      lead: { gain: 0.22, rev: 0.3, del: 0.2 },
    },
    swing: 0.09,
  },
  synthwave: {
    reverb: { room: 0.86, damp: 0.3 },
    lowpass: null,
    buses: {
      pad: { gain: 0.2, rev: 0.4, del: 0, filter: { base: 2600, depth: 0.5, rate: 0.07, q: 0.9 }, duck: 0.55 },
      keys: { gain: 0, rev: 0, del: 0 },
      bass: { gain: 0.42, rev: 0, del: 0, duck: 0.35 },
      drums: { gain: 0.62, rev: 0.18, del: 0 },
      arp: { gain: 0.18, rev: 0.3, del: 0.3, duck: 0.3 },
      lead: { gain: 0.24, rev: 0.4, del: 0.3 },
    },
    swing: 0,
  },
  neosoul: {
    reverb: { room: 0.78, damp: 0.45 },
    lowpass: 9000,
    buses: {
      pad: { gain: 0.12, rev: 0.35, del: 0 },
      keys: { gain: 0.45, rev: 0.2, del: 0 },
      bass: { gain: 0.55, rev: 0, del: 0 },
      drums: { gain: 0.58, rev: 0.1, del: 0 },
      arp: { gain: 0.16, rev: 0.3, del: 0.15 },
      lead: { gain: 0.22, rev: 0.38, del: 0.18 },
    },
    swing: 0.1,
  },
  ambient: {
    reverb: { room: 0.94, damp: 0.3 },
    lowpass: null,
    buses: {
      pad: { gain: 0.3, rev: 0.75, del: 0, filter: { base: 1500, depth: 1, rate: 0.03, q: 0.9 } },
      keys: { gain: 0.18, rev: 0.6, del: 0.2 },
      bass: { gain: 0.32, rev: 0.1, del: 0 },
      drums: { gain: 0, rev: 0, del: 0 },
      arp: { gain: 0.2, rev: 0.75, del: 0.45 },
      lead: { gain: 0, rev: 0, del: 0 },
    },
    swing: 0,
  },
};

function compose(arr, spec, rng) {
  const style = STYLES[spec.style];
  const { bars, beat } = arr;
  const energy = spec.energy ?? 0.6;
  const ev = { pad: [], keys: [], bass: [], drums: [], arp: [], lead: [] };
  const kickTimes = [];
  const human = (t) => t + (rng() - 0.5) * 0.012;
  const at = (bar, b) => bar.start + swing(b, style.swing) * beat;

  const motifA = makeMotif(rng);
  const motifB = makeMotif(rng);
  const arpPattern = rng.pick([
    [0, 1, 2, 3, 4, 3, 2, 1],
    [0, 2, 1, 3, 2, 4, 3, 1],
    [0, 1, 2, 4, 3, 2, 4, 1],
    [4, 3, 2, 1, 2, 3, 4, 2],
  ]);
  const chordLen = arr.chordBars * 4 * beat;

  for (const bar of bars) {
    const L = bar.layers;
    const chord = bar.chord;

    /* ---- Pad ---- */
    if (L.pad > 0 && bar.chordStart) {
      const inst = spec.style === 'lofi' || spec.style === 'neosoul' ? 'softpad' : 'supersaw';
      const lo = spec.style === 'ambient' ? 50 : 53;
      const notes = voiceInWindow(chord.pcs.slice(0, 4), lo);
      notes.push(rootIn(chord.rootPc, lo - 12));
      if (spec.style === 'ambient') notes.push(notes[1] + 12, notes[2] + 12);
      for (const midi of notes) {
        ev.pad.push({ inst, t: bar.start, dur: chordLen * 0.98, midi, vel: 0.5 * L.pad, pan: rng.range(-0.3, 0.3), attack: spec.style === 'ambient' ? 2.2 : 0.6, release: spec.style === 'ambient' ? 3 : 1.4 });
      }
    }

    /* ---- Keys ---- */
    if (L.keys > 0) {
      const rootless = chord.pcs.slice(1);
      if (spec.style === 'lofi' || spec.style === 'neosoul') {
        const hits =
          spec.style === 'lofi'
            ? [[0, 1.5, 1], [2.5, 1.3, 0.75]]
            : [[0, 2.3, 1], [2.5, 0.45, 0.55], [3.5, 0.5, 0.8, true]];
        for (const [b, len, v, anticipate] of hits) {
          if (anticipate && bar.isLastOfSection && !bar.nextSection) continue;
          const c = anticipate ? bar.next : chord;
          const notes = voiceInWindow((anticipate ? c.pcs.slice(1) : rootless).slice(0, 4), 55);
          notes.forEach((midi, j) =>
            ev.keys.push({ inst: 'rhodes', t: human(at(bar, b)) + j * 0.014, dur: len * beat, midi, vel: (0.55 + rng() * 0.15) * v * L.keys, pan: (j - 1.5) * 0.25 }),
          );
        }
      } else if (spec.style === 'dreampop' && bar.chordStart) {
        const notes = voiceInWindow(rootless.slice(0, 3), 60);
        notes.forEach((midi, j) =>
          ev.keys.push({ inst: 'rhodes', t: human(bar.start) + j * 0.02, dur: chordLen * 0.9, midi, vel: 0.35 * L.keys, pan: (j - 1) * 0.4 }),
        );
      } else if (spec.style === 'ambient') {
        for (let b = 0; b < 4; b += 2) {
          if (!rng.chance(0.55)) continue;
          ev.keys.push({ inst: 'bell', t: at(bar, b + rng.pick([0, 0.5, 1])), dur: 2, midi: triadTone(chord, rng.pick([2, 3, 4, 5]), 64), vel: 0.4 * L.keys, pan: rng.range(-0.6, 0.6) });
        }
      }
    }

    /* ---- Bass ---- */
    if (L.bass > 0) {
      const root = rootIn(chord.rootPc, 36);
      const fifth = root + 7;
      const nextRoot = rootIn(bar.next.rootPc, 36);
      const approach = nextRoot + (nextRoot > root ? -1 : 1) * (rng.chance(0.5) ? 1 : 2);
      const v = L.bass;
      if (spec.style === 'synthwave') {
        for (let e = 0; e < 8; e++) {
          ev.bass.push({ inst: 'sawbass', t: bar.start + e * 0.5 * beat, dur: 0.42 * beat, midi: e % 2 === 1 && energy > 0.7 ? root + 12 : root, vel: (e % 2 === 0 ? 0.95 : 0.75) * v });
        }
      } else if (spec.style === 'ambient') {
        if (bar.chordStart) ev.bass.push({ inst: 'sinebass', t: bar.start, dur: chordLen * 0.95, midi: root, vel: 0.5 * v });
      } else {
        const pattern =
          spec.style === 'dreampop'
            ? energy > 0.75
              ? [[0, 0.45, root], [0.5, 0.45, root], [1.5, 0.45, root + 12], [2, 0.45, root], [2.5, 0.45, root], [3.5, 0.45, fifth]]
              : [[0, 1.4, root], [1.5, 0.9, root], [2.5, 1, fifth], [3.5, 0.45, root + 12]]
            : spec.style === 'lofi'
              ? [[0, 1.3, root], [1.75, 0.5, root], [2.5, 0.9, fifth], [3.5, 0.45, approach]]
              : [[0, 1.4, root], [1.5, 0.4, root + 12], [2.5, 0.5, fifth], [3, 0.45, root], [3.75, 0.25, approach]];
        for (const [b, len, midi] of pattern) {
          ev.bass.push({ inst: 'sinebass', t: human(at(bar, b)), dur: len * beat, midi, vel: (0.8 + rng() * 0.15) * v });
        }
      }
    }

    /* ---- Drums ---- */
    if (STYLES[spec.style].buses.drums.gain > 0) {
      const drumOn = L.drums > 0;
      const kickPattern =
        spec.style === 'synthwave'
          ? spec.fourOnFloor
            ? [0, 1, 2, 3]
            : [0, 2, 2.5]
          : spec.style === 'lofi'
            ? [0, 1.75, 2.5]
            : spec.style === 'neosoul'
              ? [0, 0.75, 2.5]
              : energy > 0.75
                ? [0, 1.5, 2, 2.5]
                : [0, 2.5];
      const kickDecay = spec.style === 'lofi' ? 0.18 : spec.style === 'synthwave' ? 0.3 : 0.24;
      if (drumOn) {
        for (const b of kickPattern) {
          const t = human(at(bar, b));
          kickTimes.push(t);
          ev.drums.push({ inst: 'kick', t, vel: (b === 0 ? 1 : 0.85) * L.drums, decay: kickDecay });
        }
        const lazy = spec.style === 'neosoul' || spec.style === 'lofi' ? 0.025 : 0;
        const snareOpts =
          spec.style === 'lofi'
            ? { cutoff: 2600, decay: 0.11, tone: 0.8 }
            : spec.style === 'synthwave'
              ? { cutoff: 5200, decay: 0.2, tone: 1 }
              : spec.style === 'neosoul'
                ? { cutoff: 3600, decay: 0.12, tone: 0.9 }
                : { cutoff: 4400, decay: 0.16, tone: 1 };
        for (const b of [1, 3]) {
          ev.drums.push({ inst: 'snare', t: human(at(bar, b)) + lazy, vel: 0.85 * L.drums, pan: 0.05, ...snareOpts });
        }
        if ((spec.style === 'neosoul' || spec.style === 'lofi') && rng.chance(0.6)) {
          ev.drums.push({ inst: 'snare', t: human(at(bar, rng.pick([1.75, 3.25, 3.75]))), vel: 0.22, pan: 0.05, ...snareOpts });
        }
        // Fill trống trước đoạn điệp khúc
        if (bar.isLastOfSection && bar.nextSection === 'B') {
          for (const b of [3, 3.25, 3.5, 3.75]) {
            ev.drums.push({ inst: 'snare', t: at(bar, b), vel: 0.35 + (b - 3) * 0.6, pan: 0.1, ...snareOpts });
          }
        }
      }
      if (L.hats > 0 && (drumOn || bar.section === 'break')) {
        const sixteenths = spec.style === 'synthwave' || (spec.style === 'dreampop' && energy > 0.75);
        const step = sixteenths ? 0.25 : 0.5;
        for (let b = 0; b < 4; b += step) {
          const accent = b % 1 === 0 ? 1 : b % 0.5 === 0 ? 0.7 : 0.45;
          const cutoff = spec.style === 'lofi' ? 6000 : 8000;
          ev.drums.push({ inst: 'hat', t: human(at(bar, b)), vel: accent * 0.55 * L.hats * (0.85 + rng() * 0.3), pan: 0.3, cutoff });
        }
        if (spec.style === 'synthwave' && L.drums > 0) {
          for (const b of [0.5, 1.5, 2.5, 3.5]) ev.drums.push({ inst: 'hat', t: at(bar, b), vel: 0.35, decay: 0.16, pan: -0.25, cutoff: 7000 });
        }
      }
    }

    /* ---- Arp ---- */
    if (L.arp > 0 && spec.style !== 'lofi' && spec.style !== 'neosoul') {
      if (spec.style === 'ambient') {
        if (rng.chance(0.7)) {
          const b = rng.pick([0, 1, 2, 2.5]);
          ev.arp.push({ inst: 'pluck', t: at(bar, b), dur: 1.5 * beat, midi: triadTone(chord, rng.pick([3, 4, 5, 6]), 60), vel: 0.4 * L.arp, pan: rng.range(-0.7, 0.7), bright: 0.3, ring: 2.5, decay: 0.998 });
        }
      } else {
        const step = spec.style === 'synthwave' ? 0.25 : 0.5;
        const lo = spec.style === 'synthwave' ? 60 : 64;
        let s = 0;
        for (let b = 0; b < 4; b += step, s++) {
          const idx = arpPattern[s % arpPattern.length];
          const midi = triadTone(chord, idx, lo);
          if (spec.style === 'synthwave') {
            ev.arp.push({ inst: 'lead', wave: 'square', t: at(bar, b), dur: step * beat * 0.6, midi, vel: 0.45 * L.arp, pan: s % 2 ? 0.35 : -0.35, cutoff: 2600, attack: 0.004, release: 0.08 });
          } else {
            ev.arp.push({ inst: 'pluck', t: human(at(bar, b)), dur: step * beat, midi, vel: (s % 4 === 0 ? 0.6 : 0.42) * L.arp, pan: s % 2 ? 0.45 : -0.45, bright: 0.45, ring: 0.8 });
          }
        }
      }
    }

    /* ---- Lead (giai điệu chính) ---- */
    if (L.lead > 0 && !spec.noLead && STYLES[spec.style].buses.lead.gain > 0) {
      const phraseBar = bar.barInSection % 4;
      const motif = phraseBar === 2 ? motifB : motifA;
      const lo = spec.style === 'synthwave' ? 67 : 69;
      motif.forEach((note, j) => {
        let idx = note.idx;
        let len = note.len;
        if (phraseBar === 3 && j === motif.length - 1) {
          idx = 3;
          len = Math.max(len, 1.5);
        }
        const leadOpts =
          spec.style === 'synthwave'
            ? { inst: 'lead', wave: 'saw', cutoff: 2400, attack: 0.01 }
            : spec.style === 'lofi'
              ? { inst: 'pluck', bright: 0.35, ring: 0.6 }
              : spec.style === 'neosoul'
                ? { inst: 'lead', wave: 'sine', cutoff: 2600, attack: 0.04 }
                : { inst: 'lead', wave: 'triangle', cutoff: 3000, attack: 0.05 };
        ev.lead.push({ ...leadOpts, t: human(at(bar, note.beat)), dur: len * beat * 0.92, midi: triadTone(chord, idx, lo), vel: 0.62 * L.lead, pan: 0 });
      });
    }
  }

  return { events: ev, kickTimes };
}

/* ------------------------------------------------------------------ */
/* Hiệu ứng & tiếng nền                                               */
/* ------------------------------------------------------------------ */

function applyBusFilter(L, R, { base, depth, rate, q }) {
  const fl = new Svf();
  const fr = new Svf();
  for (let i = 0; i < L.length; i++) {
    if (i % 64 === 0) {
      const fc = base * Math.pow(2, depth * Math.sin((TAU * rate * i) / SR));
      fl.set(fc, q);
      fr.set(fc, q);
    }
    L[i] = fl.tick(L[i]);
    R[i] = fr.tick(R[i]);
  }
}

function buildDuckEnvelope(n, kickTimes, depth) {
  const env = new Float32Array(n).fill(1);
  const len = Math.floor(0.22 * SR);
  for (const t of kickTimes) {
    const s0 = Math.floor(t * SR);
    for (let k = 0; k < len; k++) {
      const i = s0 + k;
      if (i >= n) break;
      const g = 1 - depth * Math.pow(1 - k / len, 2);
      if (g < env[i]) env[i] = g;
    }
  }
  return env;
}

function applyPingPong(send, outL, outR, rev, time) {
  const len = Math.max(1, Math.floor(time * SR));
  const bl = new Float32Array(len);
  const br = new Float32Array(len);
  let idx = 0;
  let lpL = 0;
  let lpR = 0;
  for (let i = 0; i < send.length; i++) {
    const yl = bl[idx];
    const yr = br[idx];
    lpL += 0.35 * (yl - lpL);
    lpR += 0.35 * (yr - lpR);
    bl[idx] = send[i] + lpR * 0.42;
    br[idx] = lpL * 0.42;
    if (++idx >= len) idx = 0;
    outL[i] += yl * 0.6;
    outR[i] += yr * 0.6;
    rev[i] += (yl + yr) * 0.15;
  }
}

/** Freeverb (Schroeder–Moorer): 8 comb + 4 allpass mỗi kênh. */
function applyReverb(send, outL, outR, { room, damp }) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const aps = [556, 441, 341, 225];
  const spread = 23;
  const mk = (len) => ({ buf: new Float32Array(len), idx: 0, store: 0 });
  const cL = combs.map(mk);
  const cR = combs.map((l) => mk(l + spread));
  const aL = aps.map(mk);
  const aR = aps.map((l) => mk(l + spread));
  const pre = Math.floor(0.025 * SR);
  const d1 = damp;
  const d2 = 1 - damp;
  const comb = (c, x) => {
    const y = c.buf[c.idx];
    c.store = y * d2 + c.store * d1;
    c.buf[c.idx] = x + c.store * room;
    if (++c.idx >= c.buf.length) c.idx = 0;
    return y;
  };
  const allpass = (a, x) => {
    const b = a.buf[a.idx];
    a.buf[a.idx] = x + b * 0.5;
    if (++a.idx >= a.buf.length) a.idx = 0;
    return b - x;
  };
  for (let i = 0; i < outL.length; i++) {
    const x = (i >= pre ? send[i - pre] : 0) * 0.015;
    let l = 0;
    let r = 0;
    for (let c = 0; c < 8; c++) {
      l += comb(cL[c], x);
      r += comb(cR[c], x);
    }
    for (let a = 0; a < 4; a++) {
      l = allpass(aL[a], l);
      r = allpass(aR[a], r);
    }
    outL[i] += l * 2.4;
    outR[i] += r * 2.4;
  }
}

function addTexture(outL, outR, kind, level, rng) {
  const n = outL.length;
  if (kind === 'rain') {
    const fl = new Svf();
    const fr = new Svf();
    fl.set(2400, 0.5);
    fr.set(2600, 0.5);
    const drops = [];
    for (let i = 0; i < n; i++) {
      fl.tick(rng() * 2 - 1);
      fr.tick(rng() * 2 - 1);
      let dl = fl.band * 0.16;
      let dr = fr.band * 0.16;
      if (rng() < 26 / SR) drops.push({ i, f: rng.range(1800, 5200), a: rng.range(0.05, 0.22), d: rng.range(0.006, 0.02), pan: rng.range(-0.8, 0.8) });
      for (let j = drops.length - 1; j >= 0; j--) {
        const d = drops[j];
        const t = (i - d.i) / SR;
        if (t > d.d * 6) {
          drops.splice(j, 1);
          continue;
        }
        const v = Math.sin(TAU * d.f * t * (1 + t * 8)) * Math.exp(-t / d.d) * d.a;
        const [gl, gr] = panGains(d.pan);
        dl += v * gl;
        dr += v * gr;
      }
      outL[i] += dl * level;
      outR[i] += dr * level;
    }
  } else if (kind === 'vinyl') {
    let hpL = 0;
    let hpR = 0;
    let crackle = 0;
    for (let i = 0; i < n; i++) {
      const wl = rng() * 2 - 1;
      const wr = rng() * 2 - 1;
      const hl = wl - hpL;
      const hr = wr - hpR;
      hpL += 0.08 * hl;
      hpR += 0.08 * hr;
      if (rng() < 9 / SR) crackle = (rng() < 0.5 ? -1 : 1) * Math.pow(rng(), 2) * 0.9;
      crackle *= 0.86;
      outL[i] += (hl * 0.02 + crackle) * level;
      outR[i] += (hr * 0.02 + crackle * 0.8) * level;
    }
  } else if (kind === 'surf') {
    const fl = new Svf();
    const fr = new Svf();
    const period = rng.range(8.5, 11);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      if (i % 64 === 0) {
        const w = 0.5 - 0.5 * Math.cos((TAU * t) / period);
        fl.set(250 + 700 * w, 0.6);
        fr.set(250 + 700 * (0.5 - 0.5 * Math.cos((TAU * (t + 1.3)) / period)), 0.6);
      }
      const wl = Math.pow(0.5 - 0.5 * Math.cos((TAU * t) / period), 2);
      const wr = Math.pow(0.5 - 0.5 * Math.cos((TAU * (t + 1.3)) / period), 2);
      outL[i] += fl.tick(rng() * 2 - 1) * (0.06 + 0.5 * wl) * level;
      outR[i] += fr.tick(rng() * 2 - 1) * (0.06 + 0.5 * wr) * level;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Render & master                                                     */
/* ------------------------------------------------------------------ */

export function renderTrack(spec) {
  const rng = createRng(hashString(spec.id));
  const arr = buildArrangement(spec);
  const style = STYLES[spec.style];
  const n = Math.ceil((arr.totalSec + TAIL_SEC) * SR);
  const outL = new Float32Array(n);
  const outR = new Float32Array(n);
  const revSend = new Float32Array(n);
  const delSend = new Float32Array(n);

  const { events, kickTimes } = compose(arr, spec, rng);
  const duckCache = new Map();

  for (const [busName, busEvents] of Object.entries(events)) {
    const bus = style.buses[busName];
    if (!bus || bus.gain <= 0 || busEvents.length === 0) continue;
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    for (const e of busEvents) {
      INSTRUMENTS[e.inst](L, R, Math.max(0, Math.floor(e.t * SR)), e, rng);
    }
    if (bus.filter) applyBusFilter(L, R, bus.filter);
    let duck = null;
    if (bus.duck && kickTimes.length) {
      if (!duckCache.has(bus.duck)) duckCache.set(bus.duck, buildDuckEnvelope(n, kickTimes, bus.duck));
      duck = duckCache.get(bus.duck);
    }
    for (let i = 0; i < n; i++) {
      const g = duck ? bus.gain * duck[i] : bus.gain;
      const l = L[i] * g;
      const r = R[i] * g;
      outL[i] += l;
      outR[i] += r;
      const mono = (l + r) * 0.5;
      revSend[i] += mono * bus.rev;
      delSend[i] += mono * bus.del;
    }
  }

  // Tiếng nền (mưa, đĩa than, sóng biển)
  const textureLevel = (t) => arr.bars[Math.min(arr.bars.length - 1, Math.floor(t / arr.barSec))].layers.texture;
  const textures = [];
  if (spec.rain) textures.push(['rain', 0.55]);
  if (spec.style === 'lofi') textures.push(['vinyl', 0.5]);
  if (spec.surf) textures.push(['surf', 0.5]);
  for (const [kind, level] of textures) {
    const tl = new Float32Array(n);
    const tr = new Float32Array(n);
    addTexture(tl, tr, kind, level, rng);
    for (let i = 0; i < n; i++) {
      const g = 0.6 + 0.4 * textureLevel(i / SR);
      outL[i] += tl[i] * g;
      outR[i] += tr[i] * g;
      revSend[i] += (tl[i] + tr[i]) * 0.05;
    }
  }

  applyPingPong(delSend, outL, outR, revSend, arr.beat * 0.75);
  applyReverb(revSend, outL, outR, style.reverb);

  // Master: chặn DC, lọc thông thấp (lo-fi), chuẩn hoá theo RMS, soft-clip, fade.
  const lpL = new Svf();
  const lpR = new Svf();
  if (style.lowpass) {
    lpL.set(style.lowpass, 0.7);
    lpR.set(style.lowpass, 0.7);
  }
  let dcL = 0;
  let dcR = 0;
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    let l = outL[i];
    let r = outR[i];
    dcL += 0.0005 * (l - dcL);
    dcR += 0.0005 * (r - dcR);
    l -= dcL;
    r -= dcR;
    if (style.lowpass) {
      l = lpL.tick(l);
      r = lpR.tick(r);
    }
    outL[i] = l;
    outR[i] = r;
    sumSq += l * l + r * r;
  }
  const rms = Math.sqrt(sumSq / (2 * n)) || 1;
  const gain = 0.14 / rms;
  const fadeIn = Math.floor(0.05 * SR);
  const fadeOutStart = Math.floor((arr.totalSec - 2.5) * SR);
  const knee = 0.75;
  const soft = (x) => {
    const a = Math.abs(x);
    if (a <= knee) return x;
    return Math.sign(x) * (knee + (1 - knee) * Math.tanh((a - knee) / (1 - knee)));
  };
  for (let i = 0; i < n; i++) {
    let g = gain;
    if (i < fadeIn) g *= i / fadeIn;
    if (i > fadeOutStart) g *= Math.pow(Math.max(0, 1 - (i - fadeOutStart) / (n - fadeOutStart)), 1.6);
    outL[i] = soft(outL[i] * g) * 0.97;
    outR[i] = soft(outR[i] * g) * 0.97;
  }

  return { left: outL, right: outR, durationSec: n / SR };
}

export function encodeMp3(left, right, kbps = 128) {
  const encoder = new Mp3Encoder(2, SR, kbps);
  const block = 1152;
  const l16 = new Int16Array(block);
  const r16 = new Int16Array(block);
  const chunks = [];
  const push = (data) => {
    if (data && data.length) chunks.push(Buffer.from(data.buffer, data.byteOffset, data.length));
  };
  for (let i = 0; i < left.length; i += block) {
    const len = Math.min(block, left.length - i);
    for (let j = 0; j < len; j++) {
      l16[j] = Math.round(clamp(left[i + j], -1, 1) * 32767);
      r16[j] = Math.round(clamp(right[i + j], -1, 1) * 32767);
    }
    push(encoder.encodeBuffer(l16.subarray(0, len), r16.subarray(0, len)));
  }
  push(encoder.flush());
  return Buffer.concat(chunks);
}
