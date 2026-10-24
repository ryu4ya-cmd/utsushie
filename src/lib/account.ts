// サーバーで「誰が頼んだか」を確かめる。Supabase を設定していなければ誰でも（ログインなしで）使える。

import { supabaseServer, SupabaseConfigError, type Env, type SupabaseServer } from "@/lib/supabase/config";
import { bearer, SupabaseError, userIdFromToken } from "@/lib/supabase/server";
import type { FetchLike } from "@/lib/video/types";

export type Caller =
  | { configured: false; supabase: null; user: null }
  | { configured: true; supabase: SupabaseServer; user: string | null };

export async function caller(request: Request, env: Env, fetcher: FetchLike): Promise<Caller> {
  const supabase = supabaseServer(env);
  if (!supabase) return { configured: false, supabase: null, user: null };
  return { configured: true, supabase, user: await userIdFromToken(supabase, bearer(request), fetcher) };
}

export const LOGIN_REQUIRED = { error: "ログインすると作れます。", login: true };

/** ログインまわりのエラーを画面向けの返事にする。ほかのエラーなら null */
export function accountError(e: unknown): Response | null {
  if (e instanceof SupabaseConfigError) {
    console.error(e.message);
    return Response.json({ error: "ログインの設定が足りません。管理者に連絡してください。" }, { status: 500 });
  }
  if (e instanceof SupabaseError) {
    console.error(e.message);
    return Response.json({ error: "ログインの確認に失敗しました。少し待ってからもう一度お試しください。" }, { status: 502 });
  }
  return null;
}
