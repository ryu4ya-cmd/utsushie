import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, parseStartImage } from "./startImage";
import { fakeJpeg, fakePng } from "./startImage.fixtures";

describe("写真の検査", () => {
  it("JPEG と PNG の大きさを読む", () => {
    expect(parseStartImage(fakeJpeg(720, 1280))).toMatchObject({ image: { mime: "image/jpeg", width: 720, height: 1280 } });
    expect(parseStartImage(fakePng(1280, 720))).toMatchObject({ image: { mime: "image/png", width: 1280, height: 720 } });
  });

  it("Kling に渡す base64 には data: を付けない", () => {
    const r = parseStartImage(fakeJpeg(720, 1280));
    expect("image" in r && r.image.base64.startsWith("/9j/")).toBe(true);
  });

  it("形式が違う・中身が壊れている写真は断る", () => {
    expect(parseStartImage(undefined)).toHaveProperty("error");
    expect(parseStartImage("data:image/gif;base64,R0lGODlh")).toHaveProperty("error");
    expect(parseStartImage("https://example.com/a.jpg")).toHaveProperty("error");
    // PNG と言って中身が JPEG
    expect(parseStartImage(fakeJpeg(720, 1280).replace("image/jpeg", "image/png"))).toHaveProperty("error");
    expect(parseStartImage("data:image/jpeg;base64,AAAA")).toHaveProperty("error");
  });

  it("小さすぎる・細長すぎる・大きすぎる写真は断る", () => {
    expect(parseStartImage(fakeJpeg(299, 600))).toEqual({ error: expect.stringContaining("小さすぎ") });
    expect(parseStartImage(fakePng(300, 900))).toEqual({ error: expect.stringContaining("細長") });
    const huge = `data:image/jpeg;base64,${"A".repeat(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 8)}`;
    expect(parseStartImage(huge)).toEqual({ error: expect.stringContaining("大きすぎ") });
  });
});
