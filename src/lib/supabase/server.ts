// サーバーから Supabase を呼ぶ部分。ライブラリを使わず REST を直接呼ぶ（テストで fetch を差し替えるため）。
// ・ログインした人の確認（画面から届いたトークン）
// ・1日あたりの生成回数を1回使う／今日の使用回数
// ・完成動画を保存場所（Storage）に置く

import type { FetchLike } from "@/lib/video/types";
import type { SupabaseServer } from "@/lib/supabase/config";

export const VIDEO_BUCKET = "videos";

export class SupabaseError extends Error {}

/** シークレットキーで呼ぶときの見出し。新しい形式（sb_secret_…）は apikey だけで送る */
function serverHeaders(cfg: SupabaseServer): Record<string, string> {
  return cfg.secretKey.startsWith("sb_")
    ? { apikey: cfg.secretKey }
    : { apikey: cfg.secretKey, Authorization: `Bearer ${cfg.secretKey}` };
}

/** 要求の Authorization からトークンを取り出す */
export function bearer(request: Request): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") ?? "");
  return m ? m[1] : null;
}

/** トークンが本物なら、その人のIDを返す。ログインしていなければ null */
export async function userIdFromToken(cfg: SupabaseServer, token: string | null, fetcher: FetchLike): Promise<string | null> {
  if (!token) return null;
  const res = await fetcher(`${cfg.url}/auth/v1/user`, {
    headers: { apikey: cfg.publishableKey, Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new SupabaseError(`ログインの確認に失敗しました（HTTP ${res.status}）`);
  const data = (await res.json().catch(() => null)) as { id?: unknown } | null;
  return typeof data?.id === "string" ? data.id : null;
}

async function rpc(cfg: SupabaseServer, name: string, args: Record<string, unknown>, fetcher: FetchLike): Promise<unknown> {
  const res = await fetcher(`${cfg.url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { ...serverHeaders(cfg), "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data as { message?: string } | null)?.message ?? `HTTP ${res.status}`;
    throw new SupabaseError(`Supabase の ${name} に失敗しました（${msg}）`);
  }
  return data;
}

export type Spend = { ok: true; used: number } | { ok: false; reason: "user" | "total" };

/** 生成を1回使う。その人の上限（user）か全員の合計の上限（total）に達していたら使えない */
export async function spendGeneration(
  cfg: SupabaseServer,
  args: { user: string; kind: "draft" | "final"; limit: number; total: number },
  fetcher: FetchLike,
): Promise<Spend> {
  const used = await rpc(cfg, "use_generation", { p_user: args.user, p_kind: args.kind, p_limit: args.limit, p_total: args.total }, fetcher);
  if (typeof used !== "number") throw new SupabaseError("Supabase の use_generation の返事が正しくありません");
  if (used === -2) return { ok: false, reason: "total" };
  if (used < 0) return { ok: false, reason: "user" };
  return { ok: true, used };
}

/** 今日の使用回数 */
export async function todayUsage(cfg: SupabaseServer, user: string, fetcher: FetchLike): Promise<{ draft: number; final: number }> {
  const rows = (await rpc(cfg, "today_usage", { p_user: user }, fetcher)) as { kind?: string; count?: number }[] | null;
  const out = { draft: 0, final: 0 };
  for (const r of Array.isArray(rows) ? rows : []) {
    if ((r.kind === "draft" || r.kind === "final") && typeof r.count === "number") out[r.kind] = r.count;
  }
  return out;
}

// ---- 動画の保存場所 ----

/** 保存場所の動画のアドレス（公開。ログインなしで見られる） */
export function storedVideoUrl(cfg: Pick<SupabaseServer, "url">, path: string): string {
  return `${cfg.url}/storage/v1/object/public/${VIDEO_BUCKET}/${path}`;
}

/** もう保存してあるか */
export async function hasStoredVideo(cfg: Pick<SupabaseServer, "url">, path: string, fetcher: FetchLike): Promise<boolean> {
  const res = await fetcher(storedVideoUrl(cfg, path), { method: "HEAD" });
  return res.ok;
}

/** 動画を保存場所に置く。同じ名前がもうあれば何もしない（同時に2回頼まれたときなど） */
export async function putStoredVideo(cfg: SupabaseServer, path: string, data: ArrayBuffer, fetcher: FetchLike): Promise<void> {
  const res = await fetcher(`${cfg.url}/storage/v1/object/${VIDEO_BUCKET}/${path}`, {
    method: "POST",
    headers: { ...serverHeaders(cfg), "Content-Type": "video/mp4", "x-upsert": "false" },
    body: data,
  });
  if (res.ok) return;
  const body = (await res.json().catch(() => null)) as { statusCode?: string; message?: string } | null;
  if (res.status === 409 || body?.statusCode === "409") return;
  throw new SupabaseError(`動画を保存できませんでした（${body?.message ?? `HTTP ${res.status}`}）`);
}
