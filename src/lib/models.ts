// 本番で使う動画モデルの選び方と、そのモデル向けの指示文づくり。

import { kling, veo } from "@/lib/plan/build";
import type { FinalModel, Plan } from "@/lib/types";

export const MODEL_LABEL: Record<FinalModel, string> = {
  "kling-3.0": "Kling 3.0",
  "veo-3.1": "Veo 3.1",
};

/** セリフがあれば Kling 3.0（日本語のリップシンク）、なければ Veo 3.1 */
export function chooseFinalModel(plan: Plan): FinalModel {
  return plan.shots.some((s) => s.dialogue.length > 0) ? "kling-3.0" : "veo-3.1";
}

/** 選んだモデルに送る指示文。Veo は8秒ごとに分かれるので、つないで見せる */
export function promptFor(plan: Plan, model: FinalModel): string {
  if (model === "kling-3.0") return kling(plan);
  return veo(plan)
    .map((p) => `# ${p.label}\n${p.text}`)
    .join("\n\n");
}
