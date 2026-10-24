// Supabase（ログイン・回数制限・動画の保存場所）の設定。無料プランで使う。
// NEXT_PUBLIC_ の2つは画面にも埋め込まれる公開の値。シークレットキーはサーバーだけで使う。
// 何も設定しなければ今まで通り、ログインなしで使える（本番モードはログインなしでは動かない）。

export type Env = Record<string, string | undefined>;

export interface SupabasePublic {
  url: string;
  publishableKey: string;
}

export interface SupabaseServer extends SupabasePublic {
  secretKey: string;
}

/** 画面の側で使う設定。NEXT_PUBLIC_ の値はビルドのときに埋め込まれるので、process.env.〜 と直接書く */
export function supabasePublic(
  env: Env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
): SupabasePublic | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

/** サーバーで使う設定。公開の2つがそろっていてシークレットキーがなければ、設定の間違いとしてエラーにする */
export function supabaseServer(env: Env): SupabaseServer | null {
  const pub = supabasePublic(env);
  if (!pub) return null;
  const secretKey = env.SUPABASE_SECRET_KEY?.trim();
  if (!secretKey) throw new SupabaseConfigError("SUPABASE_SECRET_KEY を設定してください。");
  return { ...pub, secretKey };
}

export class SupabaseConfigError extends Error {}

/**
 * メールの数字のコードでのログインを出すか。Supabase の標準のメール送信ではメールの文面を変えられず、
 * コードが載らないので、独自のメール送信（SMTP）をつないで文面に {{ .Token }} を足したときだけ 1 にする。
 */
export const EMAIL_CODE_LOGIN = process.env.NEXT_PUBLIC_UTSUSHIE_EMAIL_CODE === "1";

/** Google でのログインを出すか（Supabase 側で Google を有効にしたときだけ 1 にする） */
export const GOOGLE_LOGIN = process.env.NEXT_PUBLIC_UTSUSHIE_GOOGLE_LOGIN === "1";
