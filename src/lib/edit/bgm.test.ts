import { describe, expect, it } from "vitest";
import { BGM_PRESETS, bgmEvents, midiToHz } from "./bgm";

describe("付属のBGM", () => {
  it("ラが440Hz", () => {
    expect(midiToHz(69)).toBe(440);
    expect(midiToHz(81)).toBe(880);
  });
  for (const p of BGM_PRESETS) {
    it(`${p.label}: 15秒ぶんの音が尺の中に並ぶ`, () => {
      const evs = bgmEvents(p, 15);
      expect(evs.length).toBeGreaterThan(20);
      for (const e of evs) {
        expect(e.t).toBeGreaterThanOrEqual(0);
        expect(e.t).toBeLessThan(15);
        expect(e.dur).toBeGreaterThan(0);
        expect(e.vel).toBeGreaterThan(0);
        expect(e.vel).toBeLessThanOrEqual(1);
        if (!["kick", "snare", "hat"].includes(e.voice)) {
          expect(e.freq).toBeGreaterThan(30);
          expect(e.freq).toBeLessThan(5000);
        }
      }
      // 時刻の順に並んでいる
      expect(evs.map((e) => e.t)).toEqual([...evs.map((e) => e.t)].sort((a, b) => a - b));
    });
  }
  it("同じ設定なら毎回同じ楽譜", () => {
    expect(bgmEvents(BGM_PRESETS[0], 10)).toEqual(bgmEvents(BGM_PRESETS[0], 10));
  });
});
