import { describe, expect, it } from "vitest";
import {
  bgmGainAt,
  clampTrim,
  cueAt,
  defaultSpec,
  extensionFor,
  isEdited,
  newText,
  outputSize,
  pickRecorderType,
  textVisible,
  wrapLines,
} from "./spec";

describe("clampTrim", () => {
  it("動画の長さに収める", () => {
    expect(clampTrim(-1, 12, 10, "start")).toEqual({ start: 0, end: 10 });
  });
  it("はじめを動かして短くなりすぎたら、はじめのほうを戻す", () => {
    expect(clampTrim(9.8, 10, 10, "start")).toEqual({ start: 9, end: 10 });
  });
  it("おわりを動かして短くなりすぎたら、おわりのほうを戻す", () => {
    expect(clampTrim(2, 2.3, 10, "end")).toEqual({ start: 2, end: 3 });
  });
  it("端でも1秒は残す", () => {
    expect(clampTrim(0, 0.2, 10, "end")).toEqual({ start: 0, end: 1 });
    expect(clampTrim(10, 10, 10, "start")).toEqual({ start: 9, end: 10 });
  });
});

describe("textVisible", () => {
  const t = { ...newText("a"), text: "やあ" };
  it("空の文字は出さない", () => {
    expect(textVisible({ ...t, text: "  " }, 1, 10)).toBe(false);
  });
  it("はじめだけ・おわりだけ", () => {
    expect(textVisible({ ...t, when: "head" }, 2.9, 10)).toBe(true);
    expect(textVisible({ ...t, when: "head" }, 3, 10)).toBe(false);
    expect(textVisible({ ...t, when: "tail" }, 6.9, 10)).toBe(false);
    expect(textVisible({ ...t, when: "tail" }, 7, 10)).toBe(true);
    expect(textVisible({ ...t, when: "all" }, 9.9, 10)).toBe(true);
  });
});

describe("wrapLines", () => {
  const measure = (s: string) => Array.from(s).length * 10;
  it("横幅で折り返し、改行を残す", () => {
    expect(wrapLines("あいうえおかき\nく", 50, measure)).toEqual(["あいうえお", "かき", "く"]);
  });
  it("句読点を行の頭にしない", () => {
    expect(wrapLines("あいうえお。かき", 50, measure)).toEqual(["あいうえお。", "かき"]);
  });
});

describe("bgmGainAt", () => {
  it("フェードで始めと終わりを下げる", () => {
    expect(bgmGainAt(0, 10, 0.8, true)).toBe(0);
    expect(bgmGainAt(0.5, 10, 0.8, true)).toBeCloseTo(0.4);
    expect(bgmGainAt(5, 10, 0.8, true)).toBeCloseTo(0.8);
    expect(bgmGainAt(10, 10, 0.8, true)).toBe(0);
    expect(bgmGainAt(0, 10, 0.8, false)).toBe(0.8);
  });
});

describe("書き出し", () => {
  it("MP4 を作れるなら MP4、だめなら WebM", () => {
    expect(pickRecorderType((t) => t === "video/mp4")).toBe("video/mp4");
    expect(pickRecorderType((t) => t.startsWith("video/mp4;codecs=avc1") || t.startsWith("video/webm"))).toBe("video/mp4;codecs=avc1.42E01E,mp4a.40.2");
    expect(pickRecorderType((t) => t === "video/mp4" || t === "video/webm")).toBe("video/webm");
    const webm = pickRecorderType((t) => t.startsWith("video/webm"));
    expect(webm).toBe("video/webm;codecs=vp9,opus");
    expect(extensionFor(webm!)).toBe("webm");
    expect(pickRecorderType(() => false)).toBeNull();
  });
  it("小さい動画は短い辺を720まで大きくする", () => {
    expect(outputSize(360, 640)).toEqual({ width: 720, height: 1280 });
    expect(outputSize(540, 960)).toEqual({ width: 720, height: 1280 });
    expect(outputSize(1280, 720)).toEqual({ width: 1280, height: 720 });
    expect(outputSize(1080, 1920)).toEqual({ width: 1080, height: 1920 });
  });
});

it("cueAt", () => {
  const cues = [{ start: 1, end: 3, text: "こんにちは" }];
  expect(cueAt(cues, 0.5)).toBeNull();
  expect(cueAt(cues, 2)).toBe("こんにちは");
  expect(cueAt(cues, 3)).toBeNull();
});

it("isEdited", () => {
  const s = defaultSpec(10);
  expect(isEdited({ ...s, burnSubtitles: false }, 10, true)).toBe(false);
  expect(isEdited(s, 10, false)).toBe(false);
  expect(isEdited(s, 10, true)).toBe(true);
  expect(isEdited({ ...s, end: 8 }, 10, false)).toBe(true);
  expect(isEdited({ ...s, bgm: { kind: "preset", id: "kirakira" } }, 10, false)).toBe(true);
});
