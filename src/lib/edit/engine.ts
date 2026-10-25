// 編集画面の再生と書き出し。動画をキャンバスに描き、元の音と BGM を Web Audio で混ぜる。
// 書き出しはキャンバスの映像と混ぜた音を MediaRecorder で録る（実際の長さと同じ時間がかかる）。
// すべて端末の中で行うので、お金もどこかのクレジットも使わない。

import type { SubtitleCue } from "@/lib/types";
import { drawFrame } from "./draw";
import { bgmGainAt, type EditSpec, pickRecorderType } from "./spec";

type Mode = "idle" | "preview" | "export";

export interface EngineOptions {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  spec: () => EditSpec;
  cues: SubtitleCue[];
  fontFamily: string;
  onState: (s: { mode: Mode; time: number }) => void;
}

export class EditorEngine {
  private o: EngineOptions;
  private g: CanvasRenderingContext2D;
  private raf = 0;
  private mode: Mode = "idle";
  private audio: {
    ctx: AudioContext;
    vGain: GainNode;
    bGain: GainNode;
    speaker: GainNode;
    mix: GainNode;
  } | null = null;
  private bgmBuffer: AudioBuffer | null = null;
  private bgmNode: AudioBufferSourceNode | null = null;
  private finish: (() => void) | null = null;
  private lastTime = -1;

  constructor(o: EngineOptions) {
    this.o = o;
    this.g = o.canvas.getContext("2d")!;
    this.tick();
  }

  /** 音の部品は、ボタンを押したとき（ユーザーの操作の中）にしか作れない端末がある */
  private ensureAudio() {
    if (this.audio) {
      void this.audio.ctx.resume();
      return this.audio;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const src = ctx.createMediaElementSource(this.o.video);
    const vGain = ctx.createGain();
    const bGain = ctx.createGain();
    const mix = ctx.createGain();
    const speaker = ctx.createGain();
    src.connect(vGain).connect(mix);
    bGain.connect(mix);
    mix.connect(speaker).connect(ctx.destination);
    this.audio = { ctx, vGain, bGain, speaker, mix };
    return this.audio;
  }

  setBgm(buffer: AudioBuffer | null) {
    this.bgmBuffer = buffer;
    // 再生中に変えたら、いまの位置から鳴らし直す
    if (this.mode !== "idle") this.startBgm(this.o.video.currentTime - this.o.spec().start);
    else this.stopBgm();
  }

  /** ファイルの音を読む（端末の音楽ファイルから BGM を選んだとき） */
  async decode(data: ArrayBuffer): Promise<AudioBuffer> {
    const { ctx } = this.ensureAudio();
    return await ctx.decodeAudioData(data);
  }

  private startBgm(offset: number) {
    this.stopBgm();
    if (!this.audio || !this.bgmBuffer) return;
    const node = this.audio.ctx.createBufferSource();
    node.buffer = this.bgmBuffer;
    node.loop = true; // 動画より短い曲は繰り返す
    node.connect(this.audio.bGain);
    node.start(0, Math.max(0, offset) % this.bgmBuffer.duration);
    this.bgmNode = node;
  }

  private stopBgm() {
    try {
      this.bgmNode?.stop();
    } catch {
      // まだ鳴らしていない
    }
    this.bgmNode?.disconnect();
    this.bgmNode = null;
  }

  /** 止まっているときに、指定の位置の絵を出す（つまみを動かしたとき） */
  seek(time: number) {
    if (this.mode !== "idle") return;
    this.o.video.currentTime = time;
  }

  private async seekAndWait(time: number) {
    const v = this.o.video;
    if (Math.abs(v.currentTime - time) < 0.02 && v.readyState >= 2) return;
    await new Promise<void>((resolve) => {
      const done = () => {
        v.removeEventListener("seeked", done);
        resolve();
      };
      v.addEventListener("seeked", done);
      v.currentTime = time;
      setTimeout(done, 1500);
    });
  }

  private async run(mode: Mode) {
    const audio = this.ensureAudio();
    const spec = this.o.spec();
    await this.seekAndWait(spec.start);
    this.mode = mode;
    audio.speaker.gain.value = mode === "export" ? 0 : 1; // 書き出し中は端末から音を出さない
    this.applyGains(0, true);
    await this.o.video.play();
    this.startBgm(0);
    this.emit();
    await new Promise<void>((resolve) => (this.finish = resolve));
  }

  async preview() {
    if (this.mode !== "idle") return;
    try {
      await this.run("preview");
    } finally {
      this.halt();
    }
  }

  stop() {
    this.finish?.();
  }

  private halt() {
    this.o.video.pause();
    this.stopBgm();
    this.mode = "idle";
    this.finish = null;
    if (this.audio) this.audio.speaker.gain.value = 1;
    this.emit();
  }

  /** 書き出す。対応していない端末では null の type を返す */
  static recorderType(): string | null {
    if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement.prototype.captureStream !== "function") return null;
    return pickRecorderType((t) => MediaRecorder.isTypeSupported(t));
  }

  async export(type: string, onProgress: (ratio: number) => void): Promise<Blob> {
    if (this.mode !== "idle") throw new Error("busy");
    const audio = this.ensureAudio();
    const dest = audio.ctx.createMediaStreamDestination();
    audio.mix.connect(dest);
    const stream = new MediaStream([...this.o.canvas.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 160_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
    const spec = this.o.spec();
    const len = spec.end - spec.start;
    const timer = setInterval(() => onProgress(Math.min(1, Math.max(0, (this.o.video.currentTime - spec.start) / len))), 200);
    try {
      await this.seekAndWait(spec.start);
      this.paint();
      rec.start(500);
      await this.run("export");
    } finally {
      clearInterval(timer);
      this.halt();
      if (rec.state !== "inactive") rec.stop();
      await stopped;
      stream.getTracks().forEach((t) => t.stop());
      audio.mix.disconnect(dest);
    }
    onProgress(1);
    return new Blob(chunks, { type: type.split(";")[0] });
  }

  private applyGains(t: number, now = false) {
    if (!this.audio) return;
    const spec = this.o.spec();
    const at = this.audio.ctx.currentTime;
    const b = bgmGainAt(t, spec.end - spec.start, spec.bgmVolume, spec.fade);
    if (now) {
      this.audio.vGain.gain.setValueAtTime(spec.originalVolume, at);
      this.audio.bGain.gain.setValueAtTime(b, at);
    } else {
      this.audio.vGain.gain.setTargetAtTime(spec.originalVolume, at, 0.03);
      this.audio.bGain.gain.setTargetAtTime(b, at, 0.03);
    }
  }

  private paint() {
    drawFrame(this.g, this.o.video, this.o.spec(), this.o.cues, this.o.fontFamily);
  }

  private emit() {
    this.o.onState({ mode: this.mode, time: this.o.video.currentTime });
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick);
    const v = this.o.video;
    this.paint();
    if (this.mode !== "idle") {
      const spec = this.o.spec();
      this.applyGains(v.currentTime - spec.start);
      if (v.currentTime >= spec.end - 0.01 || v.ended) this.finish?.();
    }
    if (Math.abs(v.currentTime - this.lastTime) > 0.05) {
      this.lastTime = v.currentTime;
      this.emit();
    }
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    this.finish?.();
    this.stopBgm();
    void this.audio?.ctx.close();
    this.audio = null;
  }
}
