// 本番で使う動画モデルの選び方と、そのモデル向けの指示文づくり。

import { kling, veo } from "@/lib/plan/build";
import type { FinalModel, Plan } from "@/lib/types";
import { clipPrompt, COGVIDEO_MAX_PROMPT } from "@/lib/video/cogvideo";

export const MODEL_LABEL: Record<FinalModel, string> = {
  "kling-3.0": "Kling 3.0",
  "veo-3.1": "Veo 3.1",
  "cogvideox-flash": "CogVideoX-Flash（無料）",
};

/** 環境変数 UTSUSHIE_VIDEO=free のとき、お金のかからない CogVideoX-Flash だけを使う */
export const freeVideo = (env: Record<string, string | undefined> = process.env) => env.UTSUSHIE_VIDEO === "free";

/**
 * 写真から作るときは Kling 3.0（画像→動画。品質比較で最も良かった）。
 * 一文からのときは、セリフがあれば Kling 3.0（日本語のリップシンク）、なければ Veo 3.1。
 * 無料の設定のときは、どちらも CogVideoX-Flash
 */
export function chooseFinalModel(plan: Plan, fromImage = false, env: Record<string, string | undefined> = process.env): FinalModel {
  if (freeVideo(env)) return "cogvideox-flash";
  if (fromImage) return "kling-3.0";
  return plan.shots.some((s) => s.dialogue.length > 0) ? "kling-3.0" : "veo-3.1";
}

/**
 * CogVideoX-Flash 向けの指示文。数秒の1本しか作れないので、最初のカットだけにし、長さの指定は外す。
 * 構図の違い（下書き）を足せるよう、上限より少し短く詰める
 */
export function cogvideo(plan: Plan): string {
  const lines = kling(plan)
    .split("\n")
    .filter((l) => !/^Shot [2-9]/.test(l))
    .map((l) => l.replace(/, \d+ seconds\./, ".").replace(/^Shot 1 \([^)]*\): /, ""));
  return clipPrompt(lines.join("\n"), COGVIDEO_MAX_PROMPT - 80);
}

/** 選んだモデルに送る指示文。Veo は8秒ごとに分かれるので、つないで見せる */
export function promptFor(plan: Plan, model: FinalModel): string {
  if (model === "kling-3.0") return kling(plan);
  if (model === "cogvideox-flash") return cogvideo(plan);
  return veo(plan)
    .map((p) => `# ${p.label}\n${p.text}`)
    .join("\n\n");
}
