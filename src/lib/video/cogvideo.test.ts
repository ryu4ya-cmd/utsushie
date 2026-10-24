import { describe, expect, it } from "vitest";
import { clipPrompt } from "./cogvideo";

describe("clipPrompt", () => {
  it("上限に収まる行だけを残し、それでも長ければ切る", () => {
    expect(clipPrompt("aaa\nbbbbbbbb\ncc", 6)).toBe("aaa\ncc");
    expect(clipPrompt("あいうえおかきくけこ", 4)).toBe("あいうえ");
    expect(clipPrompt("short", 512)).toBe("short");
  });
});
