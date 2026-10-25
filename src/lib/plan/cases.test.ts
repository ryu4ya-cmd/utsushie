// 課題セット（cases.ts）を全部変換して、抜け・崩れ・ぶれがないかを確かめる。
// 結果は tools/prompt-expander/examples/rule-based.md と一字一句同じでなければならない（変えたら npm run examples）。

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chooseFinalModel, cogvideo, promptFor } from "@/lib/models";
import type { Brief, Duration, Plan } from "@/lib/types";
import { check, kling } from "./build";
import { analyze } from "./analyze";
import { CASES, type PlanCase } from "./cases";
import { mockPlan } from "./mockPlanner";

const reportPath = path.resolve(__dirname, "../../../tools/prompt-expander/examples/rule-based.md");

const briefOf = (c: PlanCase, duration_sec: Duration = c.duration ?? 10, purpose: Brief["purpose"] = "sns_vertical"): Brief => ({
  sentence_ja: c.sentence,
  purpose,
  mood: c.mood ?? "auto",
  duration_sec,
  sound: true,
  subtitles: true,
  from_image: c.from_image === true,
});

// 「」の外に日本語が残っていないか（セリフ・画面の文字・辞書にない言葉は「」の中に入れる決まり）
const japaneseOutsideQuotes = (text: string) => text.replace(/「[^」]*」/g, "").match(/[぀-ヿ一-鿿]+/g) ?? [];
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe("課題セット", () => {
  CASES.forEach((c) => {
    describe(`${c.category}：${c.sentence}${c.from_image ? "（写真から）" : ""}`, () => {
      for (const duration of [10, 15] as const) {
        for (const purpose of ["sns_vertical", "free"] as const) {
          it(`${duration}秒・${purpose}`, () => {
            const brief = briefOf(c, duration, purpose);
            const plan = mockPlan(brief);
            expect(plan.safety.ok).toBe(true);
            expect(check(plan)).toEqual([]);
            const text = kling(plan);
            for (const e of c.expect) expect(text.toLowerCase()).toContain(e.toLowerCase());
            expect(chooseFinalModel(plan, brief.from_image)).toBe(c.model);
            expect(plan.characters.length).toBe(c.characters);
            expect(japaneseOutsideQuotes(text)).toEqual([]);
            // セリフは一字一句そのまま、全部入る
            for (const line of analyze(c.sentence).lines) expect(plan.shots.flatMap((s) => s.dialogue.map((d) => d.line_ja))).toContain(line.text);
            // 無料の CogVideoX-Flash 向けは512文字（下書きの差分の分を残す）に収まり、動きの文が入る
            const free = cogvideo(plan);
            expect(Array.from(free).length).toBeLessThanOrEqual(432);
            expect(free).toMatch(/one continuous shot\. \S/);
            // 同じ入力なら同じ出力
            expect(mockPlan(brief)).toEqual(plan);
            if (c.from_image) {
              expect(plan.shots[0].action).toContain("Animate the input image");
              expect(plan.negative).toContain("changing the face or identity of the subject");
            }
          });
        }
      }

      it("人物の固定文は全カットで同じで、長さもそろっている", () => {
        const plan = mockPlan(briefOf(c, 15));
        for (const ch of plan.characters) {
          if (!c.from_image) {
            expect(words(ch.sheet)).toBeGreaterThanOrEqual(18);
            expect(words(ch.sheet)).toBeLessThanOrEqual(55);
          }
          const text = kling(plan);
          const count = text.split(`${ch.id} is ${ch.sheet}.`).length - 1;
          expect(count).toBe(plan.shots.filter((s) => s.characters.includes(ch.id)).length);
        }
      });
    });
  });

  it("辞書で読み切れる一文が9割以上", () => {
    const clean = CASES.filter((c) => analyze(c.sentence).unknown.length === 0).length;
    expect(clean / CASES.length).toBeGreaterThanOrEqual(0.9);
  });

  it("書き出した例（rule-based.md）が今の変換と同じ", () => {
    const report = buildReport();
    if (process.env.UPDATE_EXAMPLES) fs.writeFileSync(reportPath, report);
    expect(fs.readFileSync(reportPath, "utf8")).toBe(report);
  });
});

function buildReport(): string {
  const rows = CASES.map((c) => {
    const plan = mockPlan(briefOf(c));
    return { c, plan, unknown: analyze(c.sentence).unknown };
  });
  const clean = rows.filter((r) => !r.unknown.length).length;
  const out = [
    "# 練習モードの一文→指示文（自動生成）",
    "",
    "`src/lib/plan/cases.ts` の課題セットを、LLM を使わない練習モードの変換（`src/lib/plan/mockPlanner.ts`）にかけた結果。",
    "変換や辞書を変えたら `npm run examples` で作り直す（テストがこのファイルとの違いを見つける）。",
    "",
    `辞書で読み切れた一文：${clean} / ${rows.length}`,
    "",
    "| # | 用途 | 一文 | 本番のモデル | 辞書にない言葉 |",
    "|---|---|---|---|---|",
    ...rows.map(
      (r, i) =>
        `| ${i + 1} | ${r.c.category} | ${r.c.from_image ? "📷 " : ""}${r.c.sentence} | ${chooseFinalModel(r.plan, r.c.from_image)} | ${r.unknown.join("、") || "—"} |`,
    ),
    "",
  ];
  rows.forEach((r, i) => {
    const model = chooseFinalModel(r.plan, r.c.from_image);
    out.push(
      `## ${i + 1}. ${r.c.sentence}`,
      "",
      `- 条件：${r.c.from_image ? "写真から・" : ""}${r.plan.duration_sec}秒・縦・雰囲気 ${r.c.mood ?? "auto"}`,
      `- 検査：${check(r.plan).join(" / ") || "問題なし"}`,
      `- 一文の要素 → カット：${r.plan.elements_ja.map((e) => `${e.element}→${e.shot}`).join("、")}`,
      ...(r.plan.assumptions_ja.length ? [`- 決めたこと：${r.plan.assumptions_ja.join(" / ")}`] : []),
      "",
      "```text",
      promptFor(r.plan as Plan, model),
      "```",
      "",
    );
  });
  return out.join("\n");
}
