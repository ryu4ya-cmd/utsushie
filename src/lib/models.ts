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
 * CogVideoX-Flash 向けの指示文。数秒の1本しか作れず、指示文も512文字までなので、
 * 全カットの動きを1本の流れにまとめ、大事な順（動き → 場所 → 見た目 → 雰囲気 → 音 → 避けるもの）に並べて、入る行だけを送る。
 * 声は出ないのでセリフは書かない。構図の違い（下書き）を足せるよう、上限より少し短く詰める
 */
export function cogvideo(plan: Plan): string {
  const vertical = plan.aspect_ratio === "9:16" ? "Vertical 9:16 video" : "16:9 video";
  const actions = plan.shots
    .map((s) => s.action.replace(/^The same continuous take goes on with no cut\. /, "").replace(/ Also follow this detail[^「]*「[^」]*」\./, ""))
    .join(" Then ");
  const sounds = Array.from(new Set(plan.shots.flatMap((s) => [...s.sfx, ...s.ambience])));
  const lines = [
    fitSentences(`${vertical}, one continuous shot. ${actions}`, 300),
    `Setting: ${plan.setting}`,
    ...plan.characters.map((c) => `${c.id} is ${c.sheet}.`),
    `Style: ${plan.style}.`,
    ...(sounds.length ? [`Sound: ${sounds.join(", ")}.`] : []),
    `Avoid: ${plan.negative.join(", ")}.`,
  ];
  return clipPrompt(lines.join("\n"), COGVIDEO_MAX_PROMPT - 80);
}

/** 文の切れ目で max 文字までに詰める */
function fitSentences(text: string, max: number): string {
  if (Array.from(text).length <= max) return text;
  let out = "";
  for (const part of text.match(/[^.]+\.(?:\s|$)/g) ?? [text]) {
    if (Array.from(out + part).length > max) break;
    out += part;
  }
  return (out || Array.from(text).slice(0, max).join("")).trim();
}

/** 選んだモデルに送る指示文。Veo は8秒ごとに分かれるので、つないで見せる */
export function promptFor(plan: Plan, model: FinalModel): string {
  if (model === "kling-3.0") return kling(plan);
  if (model === "cogvideox-flash") return cogvideo(plan);
  return veo(plan)
    .map((p) => `# ${p.label}\n${p.text}`)
    .join("\n\n");
}
