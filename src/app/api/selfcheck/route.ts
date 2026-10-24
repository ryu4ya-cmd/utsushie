// ログインまわりの本番の確認（一時的なもの。確認が終わったら消す）。
// 環境変数 UTSUSHIE_SELFCHECK_TOKEN の合言葉を ?key= で渡したときだけ動き、違えば「見つからない」を返す（合言葉が未設定なら、その旨だけ返す）。
// メールは1通も送らない。Supabase の管理APIで検証用の架空のユーザーにログインのリンクを作り、
// 「リンクを開く → ウツシエに戻る → サーバーがログインを認める → 回数の表を読める」までを本番の設定で通す。
// 返すのは各段階の成否だけで、トークンや利用者の情報は返さない。

import { timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { supabaseServer } from "@/lib/supabase/config";
import { serverHeaders, todayUsage, userIdFromToken } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

const TEST_EMAIL = "selfcheck+utsushie@example.com";

type Step = { step: string; ok: boolean; detail?: unknown };

function allowed(key: string | null): boolean {
  const want = process.env.UTSUSHIE_SELFCHECK_TOKEN ?? "";
  if (want.length < 24 || !key) return false;
  const a = Buffer.from(want);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  await connection();
  // 合言葉がまだ設定されていないことだけは知らせる（ページが本番に出ているかを確かめるため。中身は何も動かさない）
  if ((process.env.UTSUSHIE_SELFCHECK_TOKEN ?? "").length < 24) return Response.json({ ok: false, ready: false, error: "合言葉が設定されていません" });
  if (!allowed(new URL(request.url).searchParams.get("key"))) return Response.json({ error: "Not Found" }, { status: 404 });

  const steps: Step[] = [];
  const done = () => Response.json({ ok: steps.every((s) => s.ok), steps }, { headers: { "Cache-Control": "no-store" } });

  let cfg;
  try {
    cfg = supabaseServer(process.env);
  } catch (e) {
    steps.push({ step: "設定", ok: false, detail: e instanceof Error ? e.message : "読めません" });
    return done();
  }
  if (!cfg) {
    steps.push({ step: "設定", ok: false, detail: "Supabase の環境変数がありません" });
    return done();
  }
  steps.push({ step: "設定", ok: true });
  const admin = { ...serverHeaders(cfg), "Content-Type": "application/json" };

  // メールでのログインが有効か（誰でも見られる公開の設定）
  const settings = await fetch(`${cfg.url}/auth/v1/settings`, { headers: { apikey: cfg.publishableKey } });
  const s = (await settings.json().catch(() => null)) as { external?: { email?: boolean }; disable_signup?: boolean } | null;
  steps.push({ step: "メールでのログイン", ok: settings.ok && !!s?.external?.email, detail: { status: settings.status, disableSignup: s?.disable_signup } });

  // 検証用の架空のユーザー（メールは送らない。もういれば 422 になるのでそのまま使う）
  const created = await fetch(`${cfg.url}/auth/v1/admin/users`, { method: "POST", headers: admin, body: JSON.stringify({ email: TEST_EMAIL, email_confirm: true }) });
  steps.push({ step: "検証用ユーザー", ok: created.ok || created.status === 422, detail: { status: created.status } });

  // ログインのリンクを作る（メールは送らない）
  const redirectTo = `${SITE_URL}/login`;
  const gen = await fetch(`${cfg.url}/auth/v1/admin/generate_link?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    headers: admin,
    body: JSON.stringify({ type: "magiclink", email: TEST_EMAIL }),
  });
  const g = (await gen.json().catch(() => null)) as { action_link?: string; properties?: { action_link?: string }; msg?: string } | null;
  const link = g?.action_link ?? g?.properties?.action_link;
  steps.push({ step: "ログインのリンクを作る", ok: gen.ok && !!link, detail: { status: gen.status, error: gen.ok ? undefined : g?.msg } });
  if (!link) return done();

  // リンクを開いたときの戻り先（メールのリンクを押したのと同じ）
  const verify = await fetch(link, { redirect: "manual" });
  const location = verify.headers.get("location") ?? "";
  const [base, hash = ""] = location.split("#");
  const params = new URLSearchParams(hash || location.split("?")[1] || "");
  const token = params.get("access_token");
  steps.push({
    step: "リンクを開く",
    ok: verify.status >= 300 && verify.status < 400 && base === redirectTo && !!token,
    detail: { status: verify.status, redirectTo: base.split("?")[0], expected: redirectTo, hasAccessToken: !!token, hasCode: params.has("code"), error: params.get("error_code") ?? undefined },
  });
  if (!token) return done();

  // サーバーがログインを認めるか（下書きを頼むときと同じ確かめ方）
  const userId = await userIdFromToken(cfg, token, fetch).catch(() => null);
  steps.push({ step: "サーバーがログインを認める", ok: !!userId });

  // 回数の表を読めるか（schema.sql が入っているか）
  if (userId) {
    const usage = await todayUsage(cfg, userId, fetch).then(() => true, () => false);
    steps.push({ step: "回数の表", ok: usage });
  }

  // 動画の保存場所
  const bucket = await fetch(`${cfg.url}/storage/v1/bucket/videos`, { headers: admin });
  const b = (await bucket.json().catch(() => null)) as { public?: boolean } | null;
  steps.push({ step: "動画の保存場所", ok: bucket.ok && b?.public === true, detail: { status: bucket.status, public: b?.public } });

  return done();
}
