// できた動画の編集（トリミング・文字入れ・BGM）の設定と、画面や書き出しに依らない計算。
// 編集はすべて端末の中（ブラウザ）で行い、サーバーや外部のサービスは使わない。

import type { SubtitleCue } from "@/lib/types";

export type TextPos = "top" | "middle" | "bottom";
export type TextSize = "s" | "m" | "l";
export type TextColor = "white" | "yellow" | "cyan" | "pink";
export type TextStyle = "outline" | "band" | "neon";
export type TextWhen = "all" | "head" | "tail";

export interface TextItem {
  id: string;
  text: string;
  pos: TextPos;
  size: TextSize;
  color: TextColor;
  style: TextStyle;
  when: TextWhen;
}

export type BgmChoice = { kind: "none" } | { kind: "preset"; id: string } | { kind: "file"; name: string };

export interface EditSpec {
  start: number; // 秒。元の動画のどこから使うか
  end: number; // 秒。どこまで使うか
  texts: TextItem[];
  burnSubtitles: boolean; // セリフの字幕を映像に焼き込む
  bgm: BgmChoice;
  bgmVolume: number; // 0〜1
  originalVolume: number; // 元の音（声・効果音）の大きさ 0〜1
  fade: boolean; // BGM を始めと終わりで、ふわっと出し入れする
}

/** 切り出す長さの最短。これより短いと動画として見られない */
export const MIN_CLIP_SEC = 1;
export const MAX_TEXTS = 3;
/** 「はじめだけ」「おわりだけ」の文字を出す秒数 */
export const SHORT_TEXT_SEC = 3;
export const FADE_SEC = 1;

export const TEXT_COLORS: Record<TextColor, { label: string; fill: string }> = {
  white: { label: "白", fill: "#ffffff" },
  yellow: { label: "黄", fill: "#ffe14d" },
  cyan: { label: "水色", fill: "#3ee8ff" },
  pink: { label: "ピンク", fill: "#ff4fd8" },
};

/** 文字の高さを、画面の短いほうの辺に対する割合で決める */
export const TEXT_SIZES: Record<TextSize, { label: string; ratio: number }> = {
  s: { label: "小", ratio: 0.06 },
  m: { label: "中", ratio: 0.085 },
  l: { label: "大", ratio: 0.12 },
};

export function defaultSpec(duration: number): EditSpec {
  return {
    start: 0,
    end: duration,
    texts: [],
    burnSubtitles: true,
    bgm: { kind: "none" },
    bgmVolume: 0.6,
    originalVolume: 1,
    fade: true,
  };
}

export function newText(id: string, pos: TextPos = "top"): TextItem {
  return { id, text: "", pos, size: "m", color: "white", style: "outline", when: "all" };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** つまみを動かしたときの範囲を、動画の長さと最短の長さに収める。動かしたほうの端だけをずらす */
export function clampTrim(start: number, end: number, duration: number, moved: "start" | "end"): { start: number; end: number } {
  const min = Math.min(MIN_CLIP_SEC, duration);
  let s = Math.max(0, Math.min(start, duration));
  let e = Math.max(0, Math.min(end, duration));
  if (e - s < min) {
    if (moved === "start") s = Math.max(0, e - min);
    else e = Math.min(duration, s + min);
    if (e - s < min) {
      if (moved === "start") e = s + min;
      else s = e - min;
    }
  }
  return { start: round1(s), end: round1(e) };
}

/** 文字を出すかどうか。t は切り出したあとの動画の頭からの秒数 */
export function textVisible(item: TextItem, t: number, clipLen: number): boolean {
  if (!item.text.trim()) return false;
  if (item.when === "head") return t < Math.min(SHORT_TEXT_SEC, clipLen);
  if (item.when === "tail") return t >= Math.max(0, clipLen - SHORT_TEXT_SEC);
  return true;
}

/** 元の動画の時刻 time に出ているセリフ（なければ null） */
export function cueAt(cues: SubtitleCue[], time: number): string | null {
  return cues.find((c) => time >= c.start && time < c.end)?.text ?? null;
}

/**
 * 横幅に収まるように折り返す。日本語は単語の区切りがないので1文字ずつ測る。
 * 改行はそのまま生かし、句読点や閉じかっこが行の頭に来ないようにする
 */
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const noHead = new Set(Array.from("、。，．,.!?！？)）」』】〉》ーぁぃぅぇぉっゃゅょァィゥェォッャュョ…"));
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const ch of Array.from(para)) {
      if (line && measure(line + ch) > maxWidth && !noHead.has(ch)) {
        out.push(line);
        line = ch;
      } else line += ch;
    }
    out.push(line);
  }
  return out;
}

/** 文字の縦の位置（中心）。画面の高さに対する割合 */
export function textCenterY(pos: TextPos): number {
  return pos === "top" ? 0.16 : pos === "middle" ? 0.5 : 0.76;
}

/** BGM の大きさ。フェードありなら始めと終わりの FADE_SEC 秒で 0 から上げ、0 へ下げる */
export function bgmGainAt(t: number, clipLen: number, volume: number, fade: boolean): number {
  if (!fade) return volume;
  const f = Math.min(FADE_SEC, clipLen / 2);
  if (f <= 0) return volume;
  const k = Math.min(1, Math.max(0, t / f), Math.max(0, (clipLen - t) / f));
  return volume * k;
}

/**
 * 書き出す形式を選ぶ。H.264 の MP4 を作れる端末（iPhone、新しい Chrome）は MP4、それ以外は WebM。
 * 形式を指定しない "video/mp4" は、Chrome だと中身が VP9 になり iPhone で見られないので、WebM も作れないときだけ使う
 */
export const RECORDER_TYPES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

export function pickRecorderType(isSupported: (t: string) => boolean): string | null {
  return RECORDER_TYPES.find((t) => isSupported(t)) ?? null;
}

export function extensionFor(mime: string): "mp4" | "webm" {
  return mime.startsWith("video/mp4") ? "mp4" : "webm";
}

/** 書き出す大きさ。小さい動画は文字がにじまないよう、短い辺が 720 になるまで（最大2倍）大きくする */
export function outputSize(w: number, h: number): { width: number; height: number } {
  const short = Math.min(w, h);
  const scale = short > 0 ? Math.min(2, Math.max(1, 720 / short)) : 1;
  // 動画の圧縮は偶数の大きさを前提にしている
  const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2);
  return { width: even(w), height: even(h) };
}

/** 何か手を入れたか（何も変えていなければ書き出す意味がない） */
export function isEdited(spec: EditSpec, duration: number, hasCues: boolean): boolean {
  return (
    spec.start > 0 ||
    spec.end < duration ||
    spec.texts.some((t) => t.text.trim()) ||
    (hasCues && spec.burnSubtitles) ||
    spec.bgm.kind !== "none" ||
    spec.originalVolume < 1
  );
}

export function formatSec(sec: number): string {
  return `${sec.toFixed(1)}秒`;
}
