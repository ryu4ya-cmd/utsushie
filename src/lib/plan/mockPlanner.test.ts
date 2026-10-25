import { describe, expect, it } from "vitest";
import { DEFAULT_IMAGE_SENTENCE, parseBrief } from "@/lib/brief";
import { chooseFinalModel } from "@/lib/models";
import type { Brief } from "@/lib/types";
import { analyze } from "./analyze";
import { check } from "./build";
import { LEXICON, SUBJECTS } from "./lexicon";
import { extractLines, mockPlan } from "./mockPlanner";

const brief = (patch: Partial<Brief>): Brief => ({
  sentence_ja: "夕焼けの海辺で猫が驚いてジャンプする",
  purpose: "sns_vertical",
  mood: "auto",
  duration_sec: 10,
  sound: true,
  subtitles: true,
  from_image: false,
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

  it("写真から作るときは写真を最初のコマにし、セリフがなくても Kling 3.0", () => {
    const p = mockPlan(brief({ from_image: true, sentence_ja: "髪が風になびく" }));
    expect(check(p)).toEqual([]);
    expect(p.shots[0].action).toContain("Animate the input image");
    expect(p.style).toContain("input image");
    expect(chooseFinalModel(p, true)).toBe("kling-3.0");
  });

  it("写真から作るときは一文を空欄にでき、おまかせの動きを使う", () => {
    const input = { ...brief({}), sentence_ja: "  " };
    expect(parseBrief(input)).toEqual({ error: "一文を書いてください" });
    expect(parseBrief({ ...input, from_image: true })).toMatchObject({ brief: { sentence_ja: DEFAULT_IMAGE_SENTENCE, from_image: true } });
  });

  it("「〜と書かれた看板」の「」はセリフではなく画面の文字にする", () => {
    const a = analyze("「本日開店」と書かれた看板の前で、店主が「どうぞ」と言う");
    expect(a.signs.map((s) => s.text)).toEqual(["本日開店"]);
    expect(a.lines.map((s) => s.text)).toEqual(["どうぞ"]);
    const p = mockPlan(brief({ sentence_ja: "「本日開店」と書かれた看板の前で、店主が「どうぞ」と言う" }));
    expect(p.on_screen_text).toEqual([{ text_ja: "本日開店", shot: 1 }]);
    expect(p.shots.flatMap((s) => s.dialogue.map((d) => d.line_ja))).toEqual(["どうぞ"]);
  });

  it("二人のセリフは、言った人に割り振る", () => {
    const p = mockPlan(brief({ sentence_ja: "お母さんが「いってらっしゃい」と言い、男の子が「いってきます！」と走っていく" }));
    const lines = p.shots.flatMap((s) => s.dialogue);
    const who = (id: string) => p.characters.find((c) => c.id === id)!.label_ja;
    expect(lines.map((d) => [d.line_ja, who(d.speaker)])).toEqual([["いってらっしゃい", "お母さん"], ["いってきます！", "男の子"]]);
  });

  it("辞書にない言葉は、日本語のまま指示文に残して落とさない", () => {
    const p = mockPlan(brief({ sentence_ja: "猫がルンバに乗って移動する" }));
    expect(p.shots[0].action).toContain("「猫がルンバに乗って移動する」");
    expect(p.assumptions_ja.join()).toContain("ルンバ");
    expect(p.elements_ja.map((e) => e.element)).toContain("ルンバ");
  });

  it("性的・暴力的な内容は作らない", () => {
    expect(mockPlan(brief({ sentence_ja: "人を殺すシーン" })).safety.ok).toBe(false);
    expect(mockPlan(brief({ sentence_ja: "深夜の飯テロ、ラーメンをすする" })).safety.ok).toBe(true);
  });

  it("音なしなら効果音も環境音も入れない", () => {
    const p = mockPlan(brief({ sound: false }));
    expect(p.shots.every((s) => !s.sfx.length && !s.ambience.length)).toBe(true);
  });
});

describe("辞書", () => {
  it("同じ言葉が二か所に入っていない", () => {
    const all = LEXICON.flatMap((e) => e.ja);
    expect(all.length).toBe(new Set(all).size);
  });

  it("人物・動物の固定文は18〜55語で、声は a のあとに置ける形", () => {
    for (const s of SUBJECTS) {
      const sheet = s.clothes ? `${s.base}, ${s.clothes}` : s.base;
      const n = sheet.split(/\s+/).length;
      expect(n, s.label).toBeGreaterThanOrEqual(18);
      expect(n, s.label).toBeLessThanOrEqual(55);
      expect(s.voice, s.label).not.toMatch(/^[aeiou]/i);
    }
  });
});
