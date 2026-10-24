"use client";

// ログイン。メールに届く「Sign in」のリンクを開くとログインできる（パスワードは使わない）。
// メールの数字のコードは、文面を変えられる設定（独自のメール送信）にしたときだけ使う。
// ログインしていれば、今日あと何回作れるかとログアウトを出す。
// オーナー用リンクを開いた端末は、ログインしなくても同じ画面（オーナー）になる。

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { BackHeader, CtaButton, ErrorBox, Screen } from "@/components/ui";
import { KIND_LABEL } from "@/lib/quota";
import { EMAIL_CODE_LOGIN, GOOGLE_LOGIN } from "@/lib/supabase/config";
import { sendErrorMessage } from "@/lib/supabase/messages";
import { supabase, useServerCheck, useSession } from "@/lib/supabase/browser";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE = /^\d{6,10}$/;
/** ログインのあとに戻る先。メールのリンクの戻り先に付けると Supabase の許可リストに合わないことがあるので、端末に残しておく */
const NEXT_KEY = "utsushie.login.next";
/** リンクが使えなかったときに入れ直さなくて済むよう、最後に送ったアドレスを端末に残す */
const EMAIL_KEY = "utsushie.login.email";

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
  // 前の方式で送ったメールのリンク（?code=…）は、いまの方式では使えない
  if (new URLSearchParams(location.search).has("code")) {
    return "前に届いたメールのリンクは使えなくなりました。下の「ログインのメールを送る」をもう一度押し、新しく届いたメールの「Sign in」を開いてください。";
  }
  if (!code && !p.get("error_description")) return null;
  if (code === "otp_expired") {
    return "このリンクはもう使えません（期限切れ・使用済み、またはあとから別のメールを送ったため）。下の「ログインのメールを送る」をもう一度押し、届いた一番新しいメールの「Sign in」を開いてください。";
  }
  return `ログインできませんでした（${p.get("error_description") ?? code}）。下の「ログインのメールを送る」からもう一度お試しください。`;
}

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const { enabled, loaded, session, owner } = useSession();
  const check = useServerCheck(session, owner);
  // オーナー用リンクから戻ってきたとき（on … 覚えた / bad … 合言葉が違う / off … 外した）
  const ownerLink = params.get("owner");
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
    // エラーの付いたアドレスを消しておく（再読み込みで同じエラーが出ないように）
    if (/error|code=/.test(location.hash + location.search)) history.replaceState(history.state, "", location.pathname);
    try {
      setEmail(localStorage.getItem(EMAIL_KEY) ?? "");
    } catch {
      // 読めなければ入れ直してもらう
    }
    setNext((n) => n ?? takeNext());
  }, []);

  // サーバーもログインを認めたら、続きへ進む（認めないのに進むと、ログイン画面との行き来になる）
  useEffect(() => {
    if (check?.state === "ok" && next) router.replace(next);
  }, [check, next, router]);

  // キーボードの「開く」とボタンが続けて押されても、メールは1通だけ送る
  const sending = useRef(false);

  const sendLink = async () => {
    const sb = supabase();
    if (!sb || !EMAIL.test(email.trim()) || sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    rememberNext(next);
    try {
      localStorage.setItem(EMAIL_KEY, email.trim());
    } catch {
      // 残せなくてもログインはできる
    }
    const { error: e } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${location.origin}/login` } });
    sending.current = false;
    setBusy(false);
    if (e) setError(sendErrorMessage(e));
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

  if (session || owner) {
    const usage = check?.state === "ok" ? check.usage : null;
    return (
      <>
        {owner && (
          <div className="flex flex-col gap-1 rounded-[14px] bg-surface px-4 py-3.5">
            <span className="text-xs text-muted">オーナー</span>
            <span className="text-[15px] font-bold">この端末はオーナーとして使えます</span>
            <span className="text-xs leading-relaxed text-muted">ログインは要りません。別の端末やブラウザでは、オーナー用リンクをもう一度開いてください。</span>
          </div>
        )}
        {session && (
          <div className="flex flex-col gap-1 rounded-[14px] bg-surface px-4 py-3.5">
            <span className="text-xs text-muted">ログイン中</span>
            <span className="text-[15px] font-bold break-all">{session.user.email ?? "ログインしています"}</span>
          </div>
        )}
        {check?.state === "rejected" && (
          <ErrorBox message="この画面ではログインしていますが、サーバーで確かめられませんでした。ログアウトして、もう一度ログインしてください。続くときは管理者に連絡してください。" />
        )}
        {check?.state === "error" && <ErrorBox message={`ログインを確かめられませんでした（${check.message}）。`} />}
        {usage && (
          <div className="flex flex-col gap-2 rounded-[14px] bg-surface px-4 py-3.5">
            <span className="text-sm font-bold">今日あと何回作れるか</span>
            {(["draft", "final"] as const).map((k) => {
              const limit = usage.limits[k];
              return (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span>{KIND_LABEL[k]}</span>
                  {limit === null ? (
                    <span>上限なし</span>
                  ) : (
                    <span>
                      あと{Math.max(0, limit - usage.used[k])}回
                      <span className="text-muted">（1日{limit}回）</span>
                    </span>
                  )}
                </div>
              );
            })}
            <span className="text-xs text-muted">日本時間の0時に戻ります。下書きは1回で2本です。</span>
          </div>
        )}
        <div className="flex-1" />
        {usage && <CtaButton onClick={() => router.replace(next ?? "/create")}>{next ? "続ける" : "動画を作る"}</CtaButton>}
        {session && (
          <button
            type="button"
            onClick={() => supabase()?.auth.signOut()}
            className="min-h-11 text-sm text-accent hover:text-accent-hover"
          >
            ログアウト
          </button>
        )}
        {owner && (
          // クッキーを消すのはサーバーなので、ページごと移る
          <a href="/api/owner?off=1" className="flex min-h-11 items-center justify-center text-sm text-muted hover:text-accent">
            この端末のオーナーの設定を外す
          </a>
        )}
      </>
    );
  }

  if (sent) {
    return (
      <>
        <div className="flex flex-col gap-2 rounded-[14px] bg-surface px-4 py-4">
          <span className="text-[17px] font-bold">メールを送りました</span>
          <p className="text-sm leading-relaxed text-ink/85">
            {email.trim()} に Supabase Auth から英語のメール（件名「Your sign-in link」など）が届きます。メールの「Sign in」のリンクを開くと、ログインして続きに進めます。
          </p>
          <p className="text-xs leading-relaxed text-muted">
            リンクを開いたブラウザ（Safari や Chrome）でログインします。ホーム画面のアイコンから使っているときは、そのブラウザで続けてください。届かないときは迷惑メールのフォルダも見てください。
          </p>
        </div>
        {error && <ErrorBox message={error} />}
        {EMAIL_CODE_LOGIN && (
          <>
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
          </>
        )}
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
      <p className="text-[15px] leading-relaxed text-muted">動画を作るにはログインが必要です。メールに届くリンクを開くだけで、パスワードは要りません。</p>
      {ownerLink === "bad" && <ErrorBox message="オーナー用リンクが正しくありません。リンクを最後まで正しくコピーしたか確かめてください。" />}
      {ownerLink === "on" && <ErrorBox message="オーナー用リンクは正しいのですが、この端末に覚えられませんでした。ブラウザでクッキー（サイトのデータ）を許可してから、もう一度開いてください。" />}
      {ownerLink === "off" && <p className="text-sm text-muted">この端末のオーナーの設定を外しました。</p>}
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
