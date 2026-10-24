"use client";

// ログイン。メールに届くリンクを開くとログインできる（パスワードは使わない）。
// ログインしていれば、今日あと何回作れるかとログアウトを出す。

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BackHeader, CtaButton, ErrorBox, Screen } from "@/components/ui";
import { keepFlowForLogin } from "@/lib/flow";
import { KIND_LABEL } from "@/lib/quota";
import { GOOGLE_LOGIN } from "@/lib/supabase/config";
import { supabase, useSession, useUsage } from "@/lib/supabase/browser";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ログインのあとに戻る先。ほかのサイトへは飛ばさない */
function safeNext(v: string | null): string | null {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
}

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { enabled, loaded, session } = useSession();
  const usage = useUsage(session);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error_description"));

  // メールのリンクから戻ってきてログインできたら、続きへ進む
  useEffect(() => {
    if (session && next) router.replace(next);
  }, [session, next, router]);

  const redirectTo = () => `${location.origin}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  const sendLink = async () => {
    const sb = supabase();
    if (!sb || !EMAIL.test(email.trim())) return;
    setBusy(true);
    setError(null);
    keepFlowForLogin();
    const { error: e } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo() } });
    setBusy(false);
    if (e) setError(e.status === 429 ? "メールを送りすぎました。少し待ってからもう一度お試しください。" : "メールを送れませんでした。アドレスを確かめてください。");
    else setSent(true);
  };

  const google = async () => {
    const sb = supabase();
    if (!sb) return;
    const { error: e } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (e) setError("Google でログインできませんでした。");
  };

  if (!enabled) {
    return <p className="text-[15px] leading-relaxed text-muted">いまはログインなしで使えます。</p>;
  }
  if (!loaded) return null;

  if (session) {
    return (
      <>
        <div className="flex flex-col gap-1 rounded-[14px] bg-surface px-4 py-3.5">
          <span className="text-xs text-muted">ログイン中</span>
          <span className="text-[15px] font-bold break-all">{session.user.email ?? "ログインしています"}</span>
        </div>
        {usage && (
          <div className="flex flex-col gap-2 rounded-[14px] bg-surface px-4 py-3.5">
            <span className="text-sm font-bold">今日あと何回作れるか</span>
            {(["draft", "final"] as const).map((k) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span>{KIND_LABEL[k]}</span>
                <span>
                  あと{Math.max(0, usage.limits[k] - usage.used[k])}回
                  <span className="text-muted">（1日{usage.limits[k]}回）</span>
                </span>
              </div>
            ))}
            <span className="text-xs text-muted">日本時間の0時に戻ります。下書きは1回で2本です。</span>
          </div>
        )}
        <div className="flex-1" />
        {next && <CtaButton onClick={() => router.replace(next)}>続ける</CtaButton>}
        <button
          type="button"
          onClick={() => supabase()?.auth.signOut()}
          className="min-h-11 text-sm text-accent hover:text-accent-hover"
        >
          ログアウト
        </button>
      </>
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-3 rounded-[14px] bg-surface px-4 py-4">
        <span className="text-[17px] font-bold">メールを送りました</span>
        <p className="text-sm leading-relaxed text-ink/85">
          {email.trim()} に届いたメールの「ログイン」のリンクを開いてください。届かないときは迷惑メールのフォルダも見てください。
        </p>
        <button type="button" onClick={() => setSent(false)} className="self-start text-sm text-accent hover:text-accent-hover">
          アドレスを入れ直す
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="text-[15px] leading-relaxed text-muted">動画を作るにはログインが必要です。メールに届くリンクを開くだけで、パスワードは要りません。</p>
      {error && <ErrorBox message={error} />}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-bold">メールアドレス</label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendLink()}
          className="h-12 w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-base placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>
      <CtaButton disabled={busy || !EMAIL.test(email.trim())} onClick={sendLink}>
        {busy ? "送っています…" : "ログインのリンクを送る"}
      </CtaButton>
      {GOOGLE_LOGIN && (
        <button
          type="button"
          onClick={google}
          className="flex h-12 items-center justify-center rounded-2xl border-[1.5px] border-line bg-surface text-[15px] font-bold hover:border-line-strong"
        >
          Google でログイン
        </button>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <Screen>
      <BackHeader href="/" label="ホームに戻る" title="ログイン" />
      <Suspense fallback={null}>
        <Login />
      </Suspense>
    </Screen>
  );
}
