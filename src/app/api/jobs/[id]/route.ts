// ジョブの進み具合。練習モードでは経過時間から計算し、本番モードでは動画APIに問い合わせる。

import { decodeJob, practiceStatus } from "@/lib/jobs";
import { appMode } from "@/lib/mode";
import { liveError, liveStatus } from "@/lib/video/live";

const NOT_FOUND = { error: "ジョブが見つかりません" };

export async function GET(_request: Request, ctx: RouteContext<"/api/jobs/[id]">) {
  const { id } = await ctx.params;
  const headers = { "Cache-Control": "no-store" };

  if (appMode() === "live") {
    try {
      const status = await liveStatus(id, { env: process.env, fetch, now: Date.now() });
      if (!status) return Response.json(NOT_FOUND, { status: 404 });
      return Response.json(status, { headers });
    } catch (e) {
      return liveError(e);
    }
  }

  const spec = decodeJob(id);
  if (!spec) return Response.json(NOT_FOUND, { status: 404 });
  return Response.json(practiceStatus(id, spec, Date.now()), { headers });
}
