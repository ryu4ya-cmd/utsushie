"use client";

// ログイン。メールに届くリンクを開くか、メールに書かれた数字のコードを入れるとログインできる（パスワードは使わない）。
// ログインしていれば、今日あと何回作れるかとログアウトを出す。

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BackHeader, CtaButton, ErrorBox, Screen } from "@/components/ui";
import { keepFlowForLogin } from "@/lib/flow";
import { KIND_LABEL } from "@/lib/quota";
import { GOOGLE_LOGIN } from "@/lib/supabase/config";
import { supabase, useServerCheck, useSession } from "@/lib/supabase/browser";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE = /^\d{6,10}$/;
/** ログインのあとに戻る先。メールのリンクの戻り先に付けると Supabase の許可リストに合わないことがあるので、端末に残しておく */
const NEXT_KEY = "utsushie.login.next";

/** ログインのあとに戻る先。ほかのサイトへは飛ばさない */
function safeNext(v: string | null): string | null {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
}

function rememberNext(next: string | null) {
  try {
    if (next) localStorage.setItem(NEXT_KEY, next);
    else localStorage.removeItem(NEXT_KEY);
  } catch {
    // 残せなければ、ログインのあとはこの画面にとどまる
  }
}

function takeNext(): string | null {
  try {
    const v = localStorage.getItem(NEXT_KEY);
    localStorage.removeItem(NEXT_KEY);
    return safeNext(v);
  } catch {
    return null;
  }
}

/** メールのリンクから戻ってきたときの、アドレスに付いたエラー（期限切れなど） */
function urlError(): string | null {
  if (typeof location === "undefined") return null;
  const p = new URLSearchParams(location.hash.slice(1) || location.search);
  const code = p.get("error_code");
  if (!code && !p.get("error_description")) return null;
  if (code === "otp_expired") return "リンクの期限が切れたか、もう使われています。もう一度メールを送って、届いた数字のコードを入れてください。";
  return `ログインできませんでした（${p.get("error_description") ?? code}）。もう一度お試しください。`;
}

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const { enabled, loaded, session } = useSession();
  const check = useServerCheck(session);
  const [next, setNext] = useState<string | null>(() => safeNext(params.get("next")));
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 戻ってきたときのエラーと、メールを送る前に残した戻り先を読む（どちらもブラウザでしか読めない）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(urlError());
    setNext((n) => n ?? takeNext());
  }, []);

  // サーバーもログインを認めたら、続きへ進む（認めないのに進むと、ログイン画面との行き来になる）
  useEffect(() => {
    if (check?.state === "ok" && next) router.replace(next);
  }, [check, next, router]);

  const sendLink = async () => {
    const sb = supabase();
    if (!sb || !EMAIL.test(email.trim())) return;
    setBusy(true);
    setError(null);
    keepFlowForLogin();
    rememberNext(next);
    const { error: e } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${location.origin}/login` } });
    setBusy(false);
    if (e) setError(e.status === 429 ? "メールを送りすぎました。少し待ってからもう一度お試しください。" : `メールを送れませんでした（${e.message}）。`);
    else setSent(true);
  };

  const verifyCode = async () => {
    const sb = supabase();
    if (!sb || !CODE.test(code.trim())) return;
    setBusy(true);
    setError(null);
    const { error: e } = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (e) setError("コードが違うか、期限が切れています。もう一度メールを送ってお試しください。");
  };

  const google = async () => {
    const sb = supabase();
    if (!sb) return;
    rememberNext(next);
    const { error: e } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/login` } });
    if (e) setError("Google でログインできませんでした。");
  };

  if (!enabled) {
    return <p className="text-[15px] leading-relaxed text-muted">いまはログインなしで使えます。</p>;
  }
  if (!loaded) return null;

  if (session) {
    const usage = check?.state === "ok" ? check.usage : null;
    return (
      <>
        <div className="flex flex-col gap-1 rounded-[14px] bg-surface px-4 py-3.5">
          <span className="text-xs text-muted">ログイン中</span>
          <span className="text-[15px] font-bold break-all">{session.user.email ?? "ログインしています"}</span>
        </div>
        {check?.state === "rejected" && (
          <ErrorBox message="この画面ではログインしていますが、サーバーで確かめられませんでした。ログアウトして、もう一度ログインしてください。続くときは管理者に連絡してください。" />
        )}
        {check?.state === "error" && <ErrorBox message={`ログインを確かめられませんでした（${check.message}）。`} />}
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
        {usage && <CtaButton onClick={() => router.replace(next ?? "/create")}>{next ? "続ける" : "動画を作る"}</CtaButton>}
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
      <>
        <div className="flex flex-col gap-2 rounded-[14px] bg-surface px-4 py-4">
          <span className="text-[17px] font-bold">メールを送りました</span>
          <p className="text-sm leading-relaxed text-ink/85">
            {email.trim()} に届いたメールの数字のコードを、下に入れてください。メールのリンクを開いてもログインできます（開いたブラウザでログインします）。
          </p>
          <p className="text-xs leading-relaxed text-muted">届かないときは迷惑メールのフォルダも見てください。</p>
        </div>
        {error && <ErrorBox message={error} />}
        <div className="flex flex-col gap-2">
          <label htmlFor="code" className="text-sm font-bold">メールの数字のコード</label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && verifyCode()}
            className="h-12 w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-center text-xl tracking-[0.3em] placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <CtaButton disabled={busy || !CODE.test(code)} onClick={verifyCode}>
          {busy ? "確かめています…" : "ログインする"}
        </CtaButton>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setCode("");
          }}
          className="self-center text-sm text-accent hover:text-accent-hover"
        >
          アドレスを入れ直す・もう一度送る
        </button>
      </>
    );
  }

  return (
    <>
      <p className="text-[15px] leading-relaxed text-muted">動画を作るにはログインが必要です。メールに届くコードを入れるだけで、パスワードは要りません。</p>
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
        {busy ? "送っています…" : "ログインのメールを送る"}
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
