// 付属の BGM。音源ファイルは使わず、楽譜（音の並び）からブラウザの中で音を合成する。
// すべてこのアプリのために書いたものなので、著作権を気にせず使える。

export type Voice = "pad" | "bell" | "pluck" | "keys" | "bass" | "kick" | "snare" | "hat";

export interface NoteEvent {
  t: number; // 秒
  dur: number; // 秒
  voice: Voice;
  freq: number; // Hz（打楽器は 0）
  vel: number; // 0〜1
}

export interface BgmPreset {
  id: string;
  label: string;
  note: string; // どんな場面に合うか
  bpm: number;
  chords: number[][]; // 1小節ずつの和音（MIDI の音の番号）
  build: (ctx: BarContext) => NoteEvent[];
}

interface BarContext {
  bar: number;
  t0: number; // 小節の頭の秒
  beat: number; // 1拍の秒
  chord: number[];
}

export const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

const ev = (t: number, dur: number, voice: Voice, midi: number | null, vel: number): NoteEvent => ({
  t,
  dur,
  voice,
  freq: midi === null ? 0 : midiToHz(midi),
  vel,
});

// C  G  Am  F（明るい定番の進行）など
const C = [60, 64, 67];
const G = [59, 62, 67];
const Am = [57, 60, 64];
const F = [57, 60, 65];
const Em = [59, 64, 67];
const Dm = [57, 62, 65];

export const BGM_PRESETS: BgmPreset[] = [
  {
    id: "kirakira",
    label: "きらきら",
    note: "やさしい・かわいい",
    bpm: 96,
    chords: [C, G, Am, F],
    build: ({ t0, beat, chord }) => {
      const out = chord.map((m) => ev(t0, beat * 4, "pad", m, 0.22));
      // 和音を上へ下へと8分音符で鳴らす
      [0, 1, 2, 1, 0, 1, 2, 1].forEach((i, k) =>
        out.push(ev(t0 + (k * beat) / 2, beat * 0.9, "bell", chord[i] + (k % 4 === 2 ? 24 : 12), 0.32)),
      );
      out.push(ev(t0, beat * 2, "bass", chord[0] - 24, 0.5), ev(t0 + beat * 2, beat * 2, "bass", chord[0] - 24, 0.4));
      return out;
    },
  },
  {
    id: "norinori",
    label: "ノリノリ",
    note: "元気・楽しい",
    bpm: 122,
    chords: [Am, F, C, G],
    build: ({ t0, beat, chord }) => {
      const out: NoteEvent[] = [];
      for (let b = 0; b < 4; b++) {
        const t = t0 + b * beat;
        out.push(ev(t, 0.3, "kick", null, 0.9));
        if (b % 2 === 1) out.push(ev(t, 0.2, "snare", null, 0.55));
        out.push(ev(t + beat / 2, 0.05, "hat", null, 0.35), ev(t, 0.05, "hat", null, 0.18));
        // 裏拍で弾むベース
        out.push(ev(t + beat / 2, beat * 0.45, "bass", chord[0] - 24 + (b === 3 ? 7 : 0), 0.6));
      }
      [0, 1.5, 3].forEach((b) => chord.forEach((m) => out.push(ev(t0 + b * beat, beat * 0.4, "pluck", m + 12, 0.2))));
      return out;
    },
  },
  {
    id: "shittori",
    label: "しっとり",
    note: "おだやか・感動",
    bpm: 72,
    chords: [F, C, Dm, Em],
    build: ({ t0, beat, chord, bar }) => {
      const out = chord.map((m) => ev(t0, beat * 4, "pad", m - 12, 0.2));
      out.push(ev(t0, beat * 4, "bass", chord[0] - 24, 0.35));
      // ゆっくり和音をほどくピアノ
      const line = bar % 2 === 0 ? [0, 1, 2, 1] : [2, 1, 0, 2];
      line.forEach((i, k) => out.push(ev(t0 + k * beat, beat * 1.8, "keys", chord[i] + 12, 0.35)));
      return out;
    },
  },
  {
    id: "wakuwaku",
    label: "わくわく",
    note: "冒険・はじまり",
    bpm: 128,
    chords: [C, Em, F, G],
    build: ({ t0, beat, chord, bar }) => {
      const out: NoteEvent[] = [];
      for (let k = 0; k < 16; k++) {
        const t = t0 + (k * beat) / 4;
        // 16分音符で刻むアルペジオ
        out.push(ev(t, beat * 0.22, "pluck", chord[k % 3] + 12 + (k % 8 >= 6 ? 12 : 0), k % 4 === 0 ? 0.32 : 0.2));
      }
      for (let b = 0; b < 4; b++) {
        out.push(ev(t0 + b * beat, 0.3, "kick", null, b % 2 === 0 ? 0.8 : 0.5));
        out.push(ev(t0 + b * beat + beat / 2, 0.05, "hat", null, 0.3));
      }
      if (bar % 2 === 1) out.push(ev(t0 + beat * 3.5, 0.2, "snare", null, 0.4));
      out.push(ev(t0, beat * 4, "bass", chord[0] - 24, 0.45));
      chord.forEach((m) => out.push(ev(t0, beat * 4, "pad", m, 0.12)));
      return out;
    },
  },
];

export function findPreset(id: string): BgmPreset | undefined {
  return BGM_PRESETS.find((p) => p.id === id);
}

/** durationSec 秒ぶんの楽譜。小節を繰り返し、はみ出す音は落とす */
export function bgmEvents(preset: BgmPreset, durationSec: number): NoteEvent[] {
  const beat = 60 / preset.bpm;
  const barSec = beat * 4;
  const bars = Math.ceil(durationSec / barSec);
  const out: NoteEvent[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const chord = preset.chords[bar % preset.chords.length];
    for (const e of preset.build({ bar, t0: bar * barSec, beat, chord })) {
      if (e.t < durationSec) out.push({ ...e, dur: Math.min(e.dur, durationSec - e.t + 0.5) });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

/** 楽譜を音にする（ブラウザの OfflineAudioContext で、再生より速く作る） */
export async function renderBgm(preset: BgmPreset, durationSec: number, sampleRate = 44100): Promise<AudioBuffer> {
  const len = Math.max(1, Math.ceil((durationSec + 1) * sampleRate));
  const ctx = new OfflineAudioContext(2, len, sampleRate);
  const master = ctx.createGain();
  master.gain.value = 0.5;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp).connect(ctx.destination);

  const noise = ctx.createBuffer(1, sampleRate, sampleRate);
  const nd = noise.getChannelData(0);
  // 毎回同じ音になるよう、決まった並びの乱数で雑音を作る
  let seed = 1;
  for (let i = 0; i < nd.length; i++) {
    seed = (seed * 16807) % 2147483647;
    nd[i] = (seed / 2147483647) * 2 - 1;
  }

  for (const e of bgmEvents(preset, durationSec)) playVoice(ctx, master, noise, e);
  return ctx.startRendering();
}

function envelope(ctx: BaseAudioContext, out: AudioNode, t: number, peak: number, attack: number, decay: number): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(out);
  return g;
}

function osc(ctx: BaseAudioContext, type: OscillatorType, freq: number, t: number, stop: number, out: AudioNode, detune = 0) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  o.connect(out);
  o.start(t);
  o.stop(stop);
  return o;
}

function playVoice(ctx: BaseAudioContext, out: AudioNode, noise: AudioBuffer, e: NoteEvent) {
  const { t, dur, freq, vel } = e;
  switch (e.voice) {
    case "pad": {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vel * 0.5, t + Math.min(0.4, dur / 3));
      g.gain.setValueAtTime(vel * 0.5, t + dur * 0.8);
      g.gain.linearRampToValueAtTime(0, t + dur + 0.3);
      lp.connect(g).connect(out);
      for (const d of [-7, 7]) osc(ctx, "sawtooth", freq, t, t + dur + 0.35, lp, d);
      return;
    }
    case "bell": {
      const g = envelope(ctx, out, t, vel, 0.005, 1.2);
      osc(ctx, "sine", freq, t, t + 1.3, g);
      const g2 = envelope(ctx, out, t, vel * 0.25, 0.005, 0.4);
      osc(ctx, "sine", freq * 3.01, t, t + 0.5, g2);
      return;
    }
    case "pluck": {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(4000, t);
      lp.frequency.exponentialRampToValueAtTime(600, t + 0.25);
      const g = envelope(ctx, out, t, vel, 0.003, Math.max(0.15, dur));
      lp.connect(g);
      osc(ctx, "square", freq, t, t + dur + 0.3, lp);
      return;
    }
    case "keys": {
      const g = envelope(ctx, out, t, vel, 0.01, Math.max(0.6, dur));
      osc(ctx, "triangle", freq, t, t + dur + 0.7, g);
      const g2 = envelope(ctx, out, t, vel * 0.3, 0.005, 0.3);
      osc(ctx, "sine", freq * 2, t, t + 0.4, g2);
      return;
    }
    case "bass": {
      const g = envelope(ctx, out, t, vel, 0.01, Math.max(0.2, dur));
      osc(ctx, "sine", freq, t, t + dur + 0.3, g);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 500;
      const g2 = envelope(ctx, out, t, vel * 0.35, 0.01, Math.max(0.2, dur));
      lp.connect(g2);
      osc(ctx, "sawtooth", freq, t, t + dur + 0.3, lp);
      return;
    }
    case "kick": {
      const g = envelope(ctx, out, t, vel * 1.2, 0.002, 0.32);
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.4);
      return;
    }
    case "snare":
    case "hat": {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const f = ctx.createBiquadFilter();
      f.type = e.voice === "hat" ? "highpass" : "bandpass";
      f.frequency.value = e.voice === "hat" ? 7000 : 1800;
      const g = envelope(ctx, out, t, vel * (e.voice === "hat" ? 0.5 : 0.8), 0.002, e.voice === "hat" ? 0.05 : 0.16);
      src.connect(f).connect(g);
      src.start(t, (t * 0.37) % 0.5);
      src.stop(t + 0.25);
      return;
    }
  }
}
