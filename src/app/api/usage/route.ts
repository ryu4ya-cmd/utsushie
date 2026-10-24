// 今日あと何回作れるか。ログインの設定がなければ { configured: false }。

import { connection } from "next/server";
import { accountError, caller } from "@/lib/account";
import { limits } from "@/lib/quota";
import { todayUsage } from "@/lib/supabase/server";

export async function GET(request: Request) {
  await connection(); // 人ごとに違う答えなので、ビルドのときに作り置きしない
  const headers = { "Cache-Control": "no-store" };
  try {
    const who = await caller(request, process.env, fetch);
    if (!who.configured) return Response.json({ configured: false }, { headers });
    if (!who.user) return Response.json({ configured: true, signedIn: false }, { headers });
    const used = await todayUsage(who.supabase, who.user, fetch);
    return Response.json({ configured: true, signedIn: true, used, limits: limits(process.env).perUser }, { headers });
  } catch (e) {
    const res = accountError(e);
    if (res) return res;
    throw e;
  }
}
