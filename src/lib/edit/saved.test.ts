import { describe, expect, it } from "vitest";
import { EDIT_LIMIT, overflow, restoreSpec } from "./saved";
import { defaultSpec } from "./spec";

describe("編集を履歴に残す", () => {
  it("上限を超えたぶんは、更新が古いものから消す", () => {
    const list = Array.from({ length: EDIT_LIMIT + 2 }, (_, i) => ({ id: String(i), updatedAt: i }));
    expect(overflow(list)).toEqual(["1", "0"]);
    expect(overflow(list.slice(0, 3))).toEqual([]);
  });

  it("残した設定をそのまま戻せる", () => {
    const spec = {
      ...defaultSpec(10),
      start: 1.5,
      end: 8,
      texts: [{ id: "t1", text: "夏の思い出", pos: "bottom", size: "l", color: "pink", style: "neon", when: "head" }],
      bgm: { kind: "preset", id: "pop" },
      bgmVolume: 0.3,
      originalVolume: 0.5,
      fade: false,
      burnSubtitles: false,
    };
    expect(restoreSpec(JSON.parse(JSON.stringify(spec)), 10)).toEqual(spec);
  });

  it("元の動画より長い範囲は、動画の長さに収める", () => {
    const s = restoreSpec({ ...defaultSpec(15), start: 2, end: 15 }, 10);
    expect([s.start, s.end]).toEqual([2, 10]);
  });

  it("壊れた値は、ふつうの値にする", () => {
    expect(restoreSpec(null, 10)).toEqual(defaultSpec(10));
    const s = restoreSpec({ texts: [{ id: "a", text: "x", pos: "left", color: 3 }, null], bgm: { kind: "file" }, bgmVolume: 5 }, 10);
    expect(s.texts).toEqual([{ id: "a", text: "x", pos: "top", size: "m", color: "white", style: "outline", when: "all" }]);
    expect(s.bgm).toEqual({ kind: "none" });
    expect(s.bgmVolume).toBe(0.6);
  });
});
