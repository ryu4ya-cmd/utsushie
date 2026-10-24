// オーナー（竜也さん）だけは、メールでログインしなくても使えるようにする。
// 推測できない長い合言葉の付いたオーナー用リンク（/api/owner?key=…）を一度開くと、その端末に長く残るクッキーを置く。
// 以後、その端末からの問い合わせにはクッキーが付くので、ログインなしで作れる（スマホと PC でそれぞれ一度開く）。
//
// コードに置くのは合言葉の SHA-256 だけで、合言葉そのものは置かない（リポジトリを見ても分からない）。
// 合言葉を変えたいときは、Vercel の環境変数 UTSUSHIE_OWNER_KEY_SHA256 に新しい SHA-256 を入れる。off にすると使えなくなる。

import { createHash, timingSafeEqual } from "node:crypto";
import type { Env } from "@/lib/supabase/config";
import { int, limits } from "@/lib/quota";
import type { JobKind } from "@/lib/types";

export const OWNER_COOKIE = "utsushie_owner";
/** ブラウザが認める一番長い期間（約400日）。リンクを開き直せば延びる */
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60;
const DEFAULT_KEY_SHA256 = "14687af008cf99f411fbdd065ad950393cd6b25f5d9718d8d52c4c5cbc87f036";

function keyHash(env: Env): Buffer | null {
  const v = (env.UTSUSHIE_OWNER_KEY_SHA256?.trim() || DEFAULT_KEY_SHA256).toLowerCase();
  return /^[0-9a-f]{64}$/.test(v) ? Buffer.from(v, "hex") : null;
}

/** オーナー用リンクの合言葉として正しいか */
export function isOwnerKey(key: string | null | undefined, env: Env): boolean {
  const want = keyHash(env);
  if (!want || !key) return false;
  return timingSafeEqual(createHash("sha256").update(key).digest(), want);
}

function cookieValue(request: Request, name: string): string | null {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** オーナーの端末からの問い合わせか */
export function isOwnerRequest(request: Request, env: Env): boolean {
  return isOwnerKey(cookieValue(request, OWNER_COOKIE), env);
}

/** オーナーのクッキーを置く（画面の JavaScript からは読めない・https だけ） */
export function ownerCookie(key: string): string {
  return `${OWNER_COOKIE}=${encodeURIComponent(key)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearOwnerCookie(): string {
  return `${OWNER_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

/**
 * オーナーの1日の上限。null は数えない（上限なし）。
 * 練習モードではお金がかからないので、既定は上限なし。本番モードでは既定でほかの人と同じ上限にする。
 * UTSUSHIE_OWNER_DAILY_DRAFTS / UTSUSHIE_OWNER_DAILY_FINALS で変えられる。
 */
export function ownerLimit(env: Env, live: boolean, kind: JobKind): number | null {
  const n = int(kind === "draft" ? env.UTSUSHIE_OWNER_DAILY_DRAFTS : env.UTSUSHIE_OWNER_DAILY_FINALS, -1);
  if (n >= 0) return n;
  return live ? limits(env).perUser[kind] : null;
}
