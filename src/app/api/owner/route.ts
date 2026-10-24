// オーナー用リンク。/api/owner?key=合言葉 を開くと、この端末をオーナーとして覚える（ログインなしで使える）。
// /api/owner?off=1 で、この端末のオーナーの設定を外す。どちらもログインの画面へ戻して、状態を見せる。

import { connection } from "next/server";
import { clearOwnerCookie, isOwnerKey, ownerCookie } from "@/lib/owner";

export async function GET(request: Request) {
  await connection(); // 開くたびに確かめる（作り置きしない）
  const url = new URL(request.url);
  const back = (q: string, cookie?: string) => {
    const headers = new Headers({ Location: `/login?${q}`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
    if (cookie) headers.set("Set-Cookie", cookie);
    return new Response(null, { status: 303, headers });
  };
  if (url.searchParams.has("off")) return back("owner=off", clearOwnerCookie());
  const key = url.searchParams.get("key");
  if (!isOwnerKey(key, process.env)) return back("owner=bad");
  return back("owner=on", ownerCookie(key!));
}
