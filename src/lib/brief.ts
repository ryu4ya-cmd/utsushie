// 画面から届いた入力（Brief）の検査

import type { Brief } from "@/lib/types";

export const MAX_SENTENCE = 80;

export function parseBrief(input: unknown): { brief: Brief } | { error: string } {
  if (!input || typeof input !== "object") return { error: "入力がありません" };
  const b = input as Record<string, unknown>;
  const sentence = typeof b.sentence_ja === "string" ? b.sentence_ja.trim() : "";
  if (!sentence) return { error: "一文を書いてください" };
  if (Array.from(sentence).length > MAX_SENTENCE) return { error: `${MAX_SENTENCE}文字以内にしてください` };
  if (b.purpose !== "sns_vertical" && b.purpose !== "free") return { error: "用途が正しくありません" };
  if (!["auto", "cute", "cinematic", "anime"].includes(b.mood as string)) return { error: "雰囲気が正しくありません" };
  if (b.duration_sec !== 10 && b.duration_sec !== 15) return { error: "長さは10秒か15秒です" };
  return {
    brief: {
      sentence_ja: sentence,
      purpose: b.purpose,
      mood: b.mood as Brief["mood"],
      duration_sec: b.duration_sec,
      sound: b.sound !== false,
      subtitles: b.subtitles !== false,
    },
  };
}
