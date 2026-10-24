// build.ts が Python 版（tools/prompt-expander/build_prompts.py）と同じ文章を出すかを確かめる。
// 正解は Python 版の出力 tools/prompt-expander/examples/prompts.md。

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Plan } from "@/lib/types";
import { check, kling, seedance, subtitles, toWebVtt, veo } from "./build";

const dir = path.resolve(__dirname, "../../../tools/prompt-expander/examples");
const plans = JSON.parse(fs.readFileSync(path.join(dir, "plans.json"), "utf8")) as Plan[];
const golden = fs.readFileSync(path.join(dir, "prompts.md"), "utf8").split(/^## \d+\. /m).slice(1);

const blocks = (section: string) => Array.from(section.matchAll(/```(?:text|json)\n([\s\S]*?)\n```/g), (m) => m[1]);

describe("Python 版と同じ指示文", () => {
  plans.forEach((plan, i) => {
    it(plan.title_ja, () => {
      const expected = blocks(golden[i]);
      const veoParts = veo(plan).map((p) => p.text);
      expect(expected.length).toBe(2 + veoParts.length + 1);
      expect(kling(plan)).toBe(expected[0]);
      expect(seedance(plan)).toBe(expected[1]);
      veoParts.forEach((t, n) => expect(t).toBe(expected[2 + n]));
      expect(subtitles(plan)).toEqual(JSON.parse(expected[expected.length - 1]));
      const verdict = golden[i].match(/検査: (.*)/)?.[1];
      expect(check(plan).join(" / ") || "問題なし").toBe(verdict);
    });
  });
});

describe("toWebVtt", () => {
  it("時刻を VTT の形にする", () => {
    expect(toWebVtt([{ start: 10, end: 11.2, text: "また明日ね" }])).toBe(
      "WEBVTT\n\n00:00:10.000 --> 00:00:11.200\nまた明日ね\n",
    );
  });
});
