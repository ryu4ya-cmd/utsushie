import { describe, expect, it } from "vitest";
import { sharePageUrl, shareIntentUrl } from "./share";

describe("共有", () => {
  it("共有ページのアドレスに題名を付ける", () => {
    expect(sharePageUrl("https://example.com", "abc", "猫のダンス")).toBe(
      "https://example.com/v/abc?t=%E7%8C%AB%E3%81%AE%E3%83%80%E3%83%B3%E3%82%B9",
    );
    expect(sharePageUrl("https://example.com", "abc")).toBe("https://example.com/v/abc");
  });

  it("各SNSの投稿画面のアドレスを作る", () => {
    const page = "https://example.com/v/abc";
    expect(shareIntentUrl("x", page, "猫")).toBe(`https://x.com/intent/post?text=%E7%8C%AB&url=${encodeURIComponent(page)}`);
    expect(shareIntentUrl("line", page, "猫")).toContain(encodeURIComponent(page));
    expect(shareIntentUrl("facebook", page, "猫")).toContain(encodeURIComponent(page));
  });
});
