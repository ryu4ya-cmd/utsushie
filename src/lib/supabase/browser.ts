"use client";

// 画面の側のログイン。Supabase の公開キーだけを使い、ログインの状態はこの端末のブラウザに残す。
// サーバーへ頼むときは、ログインした人のトークンを Authorization に付ける。

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabasePublic } from "@/lib/supabase/config";

let client: SupabaseClient | null | undefined;

/** ログインの設定がなければ null（ログインなしで使える） */
export function supabase(): SupabaseClient | null {
  if (client === undefined) {
    const cfg = supabasePublic();
    client = cfg
      ? createClient(cfg.url, cfg.publishableKey, { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true } })
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

/** 今日の使用回数。ログインしていない・設定がないときは null */
export function useUsage(session: Session | null): Usage | null {
  const [usage, setUsage] = useState<Usage | null>(null);
  const token = session?.access_token;
  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetch("/api/usage", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && d?.signedIn && setUsage({ used: d.used, limits: d.limits }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token]);
  return token ? usage : null;
}
