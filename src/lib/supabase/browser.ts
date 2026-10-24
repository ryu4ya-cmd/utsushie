"use client";

// 画面の側のログイン。Supabase の公開キーだけを使い、ログインの状態はこの端末のブラウザに残す。
// サーバーへ頼むときは、ログインした人のトークンを Authorization に付ける。
//
// メールのリンクは、ページを開いたのと別のブラウザで開くことがある（iPhone のホーム画面アプリ、Gmail アプリの中など）。
// PKCE 方式だと最初のブラウザにしかない合言葉が要って、別のブラウザでは必ず失敗するので、リンクだけでログインが済む方式（implicit）にする。
// ホーム画面アプリなど、リンクを開いたブラウザに戻れないときのために、メールの数字のコードでもログインできる。

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabasePublic } from "@/lib/supabase/config";

let client: SupabaseClient | null | undefined;

/** ログインの設定がなければ null（ログインなしで使える） */
export function supabase(): SupabaseClient | null {
  if (client === undefined) {
    const cfg = supabasePublic();
    client = cfg
      ? createClient(cfg.url, cfg.publishableKey, { auth: { flowType: "implicit", persistSession: true, detectSessionInUrl: true } })
      : null;
  }
  return client;
}

export const loginEnabled = () => supabasePublic() !== null;

/** サーバーへ送る見出し。ログインしていなければ空 */
export async function authHeaders(): Promise<Record<string, string>> {
  const sb = supabase();
  if (!sb) return {};
  const { data } = await sb.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export interface SessionState {
  enabled: boolean; // ログインの設定があるか
  loaded: boolean;
  session: Session | null;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ enabled: loginEnabled(), loaded: !loginEnabled(), session: null });
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => alive && setState({ enabled: true, loaded: true, session: data.session }));
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      if (alive) setState({ enabled: true, loaded: true, session });
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return state;
}

export interface Usage {
  used: { draft: number; final: number };
  limits: { draft: number; final: number };
}

/**
 * サーバーから見たログインの状態と、今日の使用回数。
 * checking … 問い合わせ中 / ok … サーバーもログインを認めた / rejected … 画面ではログイン中なのにサーバーが認めない / error … 通信の失敗
 */
export type ServerCheck = { state: "checking" } | { state: "ok"; usage: Usage } | { state: "rejected" } | { state: "error"; message: string };

export function useServerCheck(session: Session | null): ServerCheck | null {
  const token = session?.access_token;
  const [result, setResult] = useState<{ token: string; check: ServerCheck } | null>(null);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch("/api/usage", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(d?.error ?? `HTTP ${r.status}`);
        return d;
      })
      .then((d) => {
        const check: ServerCheck = d?.signedIn ? { state: "ok", usage: { used: d.used, limits: d.limits } } : { state: "rejected" };
        if (alive) setResult({ token, check });
      })
      .catch((e) => alive && setResult({ token, check: { state: "error", message: e instanceof Error ? e.message : "通信に失敗しました" } }));
    return () => {
      alive = false;
    };
  }, [token]);
  if (!token) return null;
  return result?.token === token ? result.check : { state: "checking" };
}

/** 今日の使用回数。ログインしていない・設定がない・サーバーが認めないときは null */
export function useUsage(session: Session | null): Usage | null {
  const check = useServerCheck(session);
  return check?.state === "ok" ? check.usage : null;
}
