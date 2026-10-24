// 作った動画の履歴。いまはこの端末のブラウザ（localStorage）だけに保存する。
// ログインを入れたら、同じ形のままサーバーにも保存する予定。

import type { FinalModel, SubtitleCue } from "@/lib/types";

export interface HistoryEntry {
  id: string; // 本番ジョブのID。共有ページ /v/:id でもこれを使う
  createdAt: number; // ミリ秒
  title: string;
  sentence: string;
  duration: 10 | 15;
  aspect: "9:16" | "16:9";
  model: FinalModel;
  videoUrl: string;
  subtitles: SubtitleCue[];
}

export const HISTORY_KEY = "utsushie.history.v1";
/** ブラウザの保存領域は小さいので、古いものから消す */
export const HISTORY_LIMIT = 50;

/** 新しいものを先頭に足す。同じIDがあれば入れ替える */
export function addEntry(list: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...list.filter((e) => e.id !== entry.id)].slice(0, HISTORY_LIMIT);
}

export function removeEntry(list: HistoryEntry[], id: string): HistoryEntry[] {
  return list.filter((e) => e.id !== id);
}

/** 保存されていた文字列を読む。壊れていたら空にする */
export function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (e): e is HistoryEntry =>
        !!e && typeof e.id === "string" && typeof e.videoUrl === "string" && typeof e.createdAt === "number",
    );
  } catch {
    return [];
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    return parseHistory(localStorage.getItem(HISTORY_KEY));
  } catch {
    return [];
  }
}

export function saveHistory(list: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // 保存できなくても画面は動く（プライベートブラウズなど）
  }
}
