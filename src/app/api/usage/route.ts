// 今日あと何回作れるか。ログインの設定がなければ { configured: false }。
// オーナーの端末なら owner: true を付ける。上限のない種類は limits が null（数えない）。

import { connection } from "next/server";
import { accountError, caller } from "@/lib/account";
import { appMode } from "@/lib/mode";
import { ownerLimit } from "@/lib/owner";
import { limits } from "@/lib/quota";
import { todayUsage } from "@/lib/supabase/server";

export async function GET(request: Request) {
  await connection(); // 人ごとに違う答えなので、ビルドのときに作り置きしない
  const headers = { "Cache-Control": "no-store" };
  try {
    const who = await caller(request, process.env, fetch);
    if (!who.configured) return Response.json({ configured: false }, { headers });
    if (who.owner) {
      const live = appMode() === "live";
      const lim = { draft: ownerLimit(process.env, live, "draft"), final: ownerLimit(process.env, live, "final") };
      const used =
        who.user && (lim.draft !== null || lim.final !== null) ? await todayUsage(who.supabase, who.user, fetch) : { draft: 0, final: 0 };
      return Response.json({ configured: true, signedIn: true, owner: true, used, limits: lim }, { headers });
    }
    if (!who.user) return Response.json({ configured: true, signedIn: false }, { headers });
    const used = await todayUsage(who.supabase, who.user, fetch);
    return Response.json({ configured: true, signedIn: true, used, limits: limits(process.env).perUser }, { headers });
  } catch (e) {
    const res = accountError(e);
    if (res) return res;
    throw e;
  }
}
