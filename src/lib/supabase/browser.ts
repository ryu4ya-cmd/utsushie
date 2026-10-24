"use client";

// 画面の側のログイン。Supabase の公開キーだけを使い、ログインの状態はこの端末のブラウザに残す。
// サーバーへ頼むときは、ログインした人のトークンを Authorization に付ける。
// オーナー用リンクを開いた端末は、ログインしていなくても使える（クッキーは画面から読めないので、サーバーに聞く）。
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

let ownerStatus: Promise<boolean> | undefined;

/** この端末がオーナーとして覚えられているか。ページを開いている間は1回だけ聞く */
function fetchOwner(): Promise<boolean> {
  ownerStatus ??= fetch("/api/usage", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => d?.owner === true)
    .catch(() => false);
  return ownerStatus;
}

export interface SessionState {
  enabled: boolean; // ログインの設定があるか
  loaded: boolean;
  session: Session | null;
  owner: boolean; // オーナーの端末か（ログインなしで使える）
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ enabled: loginEnabled(), loaded: !loginEnabled(), session: null, owner: false });
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    let alive = true;
    const set = (session: Session | null) =>
      fetchOwner().then((owner) => alive && setState({ enabled: true, loaded: true, session, owner }));
    sb.auth.getSession().then(({ data }) => set(data.session));
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      set(session);
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
  limits: { draft: number | null; final: number | null }; // null は上限なし（オーナー）
  owner: boolean;
}

/**
 * サーバーから見たログインの状態と、今日の使用回数。
 * checking … 問い合わせ中 / ok … サーバーもログインを認めた / rejected … 画面ではログイン中なのにサーバーが認めない / error … 通信の失敗
 */
export type ServerCheck = { state: "checking" } | { state: "ok"; usage: Usage } | { state: "rejected" } | { state: "error"; message: string };

export function useServerCheck(session: Session | null, owner = false): ServerCheck | null {
  const token = session?.access_token ?? (owner ? "owner" : undefined);
  const [result, setResult] = useState<{ token: string; check: ServerCheck } | null>(null);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    const headers: Record<string, string> = token === "owner" ? {} : { Authorization: `Bearer ${token}` };
    fetch("/api/usage", { headers, cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(d?.error ?? `HTTP ${r.status}`);
        return d;
      })
      .then((d) => {
        const check: ServerCheck = d?.signedIn ? { state: "ok", usage: { used: d.used, limits: d.limits, owner: d.owner === true } } : { state: "rejected" };
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

/** 今日の使用回数。ログインしていない（オーナーでもない）・設定がない・サーバーが認めないときは null */
export function useUsage(session: Session | null, owner = false): Usage | null {
  const check = useServerCheck(session, owner);
  return check?.state === "ok" ? check.usage : null;
}
