import { describe, expect, it } from "vitest";
import { chooseFinalModel } from "@/lib/models";
import type { Brief } from "@/lib/types";
import { check } from "./build";
import { extractLines, mockPlan } from "./mockPlanner";

const brief = (patch: Partial<Brief>): Brief => ({
  sentence_ja: "夕焼けの海辺で猫が驚いてジャンプする",
  purpose: "sns_vertical",
  mood: "auto",
  duration_sec: 10,
  sound: true,
  subtitles: true,
  ...patch,
});

describe("mockPlan", () => {
  it("「」の中をセリフとして取り出す", () => {
    expect(extractLines("女の子が「また明日ね」と笑い、「バイバイ」と手を振る")).toEqual(["また明日ね", "バイバイ"]);
  });

  for (const duration_sec of [10, 15] as const) {
    for (const sentence_ja of ["夕焼けの海辺で猫が驚いてジャンプする", "女の子が振り返って「また明日ね」と笑う"]) {
      it(`${duration_sec}秒・${sentence_ja} の設計図は検査を通る`, () => {
        expect(check(mockPlan(brief({ duration_sec, sentence_ja })))).toEqual([]);
      });
    }
  }

  it("用途で縦横が決まる", () => {
    expect(mockPlan(brief({ purpose: "sns_vertical" })).aspect_ratio).toBe("9:16");
    expect(mockPlan(brief({ purpose: "free" })).aspect_ratio).toBe("16:9");
  });

  it("セリフありは Kling 3.0、なしは Veo 3.1", () => {
    expect(chooseFinalModel(mockPlan(brief({ sentence_ja: "猫が「にゃっ」と鳴く" })))).toBe("kling-3.0");
    expect(chooseFinalModel(mockPlan(brief({})))).toBe("veo-3.1");
  });
});
