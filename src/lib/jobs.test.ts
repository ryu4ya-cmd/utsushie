import { describe, expect, it } from "vitest";
import { decodeJob, encodeJob, practiceStatus, PRACTICE_SECONDS, type JobSpec } from "./jobs";

const spec: JobSpec = { kind: "final", variant: null, duration: 15, model: "kling-3.0", startedAt: 1_000_000 };

describe("練習モードのジョブ", () => {
  it("IDから元に戻せる", () => {
    expect(decodeJob(encodeJob(spec))).toEqual(spec);
    expect(decodeJob("でたらめ")).toBeNull();
  });

  it("経過時間で進み、終わるとサンプル動画を返す", () => {
    const id = encodeJob(spec);
    const half = practiceStatus(id, spec, spec.startedAt + (PRACTICE_SECONDS.final * 1000) / 2);
    expect(half).toMatchObject({ state: "running", progress: 50, videoUrl: null });
    const done = practiceStatus(id, spec, spec.startedAt + PRACTICE_SECONDS.final * 1000);
    expect(done).toMatchObject({ state: "done", progress: 100, videoUrl: "/samples/final-15s.mp4" });
  });
});
