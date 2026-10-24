// 生成ジョブ。練習モードでは状態をサーバーに持たず、ジョブIDに「いつ・何を」作り始めたかを入れておき、
// 経過時間から進み具合を計算する（Vercel のサーバーレスでも同じ結果になる）。

import type { Duration, FinalModel, JobKind, JobStatus } from "@/lib/types";

/** 練習モードでの所要時間（秒）。実際の生成時間より短くしてある */
export const PRACTICE_SECONDS: Record<JobKind, number> = { draft: 4, final: 12 };

export interface JobSpec {
  kind: JobKind;
  variant: "a" | "b" | null; // 下書きのどちらか
  duration: Duration;
  model: FinalModel | "draft";
  startedAt: number; // ミリ秒
}

export function encodeJob(spec: JobSpec): string {
  return Buffer.from(JSON.stringify(spec)).toString("base64url");
}

export function decodeJob(id: string): JobSpec | null {
  try {
    const spec = JSON.parse(Buffer.from(id, "base64url").toString("utf8")) as JobSpec;
    if (spec.kind !== "draft" && spec.kind !== "final") return null;
    if (spec.duration !== 10 && spec.duration !== 15) return null;
    if (typeof spec.startedAt !== "number") return null;
    if (spec.kind === "draft" && spec.variant !== "a" && spec.variant !== "b") return null;
    return spec;
  } catch {
    return null;
  }
}

export function sampleVideo(spec: JobSpec): string {
  return spec.kind === "draft" ? `/samples/draft-${spec.variant}.mp4` : `/samples/final-${spec.duration}s.mp4`;
}

export function practiceStatus(id: string, spec: JobSpec, now: number): JobStatus {
  const total = PRACTICE_SECONDS[spec.kind];
  const elapsed = Math.max(0, (now - spec.startedAt) / 1000);
  const progress = Math.min(100, Math.floor((elapsed / total) * 100));
  const done = progress >= 100;
  return {
    id,
    kind: spec.kind,
    state: done ? "done" : "running",
    progress,
    remainingSec: Math.max(0, Math.ceil(total - elapsed)),
    videoUrl: done ? sampleVideo(spec) : null,
    model: spec.model,
    practice: true,
  };
}
