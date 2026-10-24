// ジョブの進み具合。練習モードでは経過時間から計算する。

import { decodeJob, practiceStatus } from "@/lib/jobs";

export async function GET(_request: Request, ctx: RouteContext<"/api/jobs/[id]">) {
  const { id } = await ctx.params;
  const spec = decodeJob(id);
  if (!spec) return Response.json({ error: "ジョブが見つかりません" }, { status: 404 });
  return Response.json(practiceStatus(id, spec, Date.now()), { headers: { "Cache-Control": "no-store" } });
}
