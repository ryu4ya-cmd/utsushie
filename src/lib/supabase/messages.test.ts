import { describe, expect, it } from "vitest";
import { sendErrorMessage } from "./messages";

describe("メールを送れなかったときの文言", () => {
  it("60秒の待ちと、1時間の上限を取り違えない", () => {
    expect(
      sendErrorMessage({ status: 429, code: "over_email_send_rate_limit", message: "For security purposes, you can only request this after 42 seconds." }),
    ).toMatch(/^同じアドレスへのメールは60秒に1通までです。42秒/);
    expect(sendErrorMessage({ status: 429, code: "over_email_send_rate_limit", message: "email rate limit exceeded" })).toMatch(/^ウツシエ全体で1時間/);
    expect(sendErrorMessage({ status: 429, code: "over_request_rate_limit", message: "Request rate limit reached" })).toMatch(/^問い合わせが多すぎ/);
  });

  it("理由をそのまま添える", () => {
    expect(sendErrorMessage({ status: 400, code: "email_address_not_authorized", message: "Email address not authorized" })).toBe(
      "メールを送れませんでした（email_address_not_authorized: Email address not authorized）",
    );
  });
});
