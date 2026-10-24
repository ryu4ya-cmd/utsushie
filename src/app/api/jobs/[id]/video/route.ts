// 本番モードでできた動画を、サーバー経由で返す。練習モードの動画は public/samples から直接読むので使わない。

import { appMode } from "@/lib/mode";
import { liveError, liveVideo } from "@/lib/video/live";

export async function GET(request: Request, ctx: RouteContext<"/api/jobs/[id]/video">) {
  if (appMode() !== "live") return Response.json({ error: "練習モードでは使いません" }, { status: 404 });
  const { id } = await ctx.params;
  try {
    return await liveVideo(id, request.headers.get("range"), { env: process.env, fetch, now: Date.now() });
  } catch (e) {
    return liveError(e);
  }
}
