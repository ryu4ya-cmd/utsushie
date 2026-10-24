// 生成ジョブを始める。練習モードではサンプル動画を返すジョブIDを作るだけ。
// 本番モードでは設計図から指示文を作り、Kling 3.0 か Veo 3.1 に生成を頼む。

import { encodeJob, type JobSpec } from "@/lib/jobs";
import { appMode } from "@/lib/mode";
import { liveError, parsePlan, startLive } from "@/lib/video/live";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const kind = body?.kind;
  const duration = body?.duration_sec;
  if (kind !== "draft" && kind !== "final") return Response.json({ error: "kind が正しくありません" }, { status: 400 });
  if (duration !== 10 && duration !== 15) return Response.json({ error: "長さは10秒か15秒です" }, { status: 400 });

  if (appMode() === "live") {
    try {
      const plan = parsePlan(body?.plan, duration);
      const ids = await startLive({ kind, duration, plan, sound: body?.sound !== false }, { env: process.env, fetch, now: Date.now() });
      return Response.json({ ids, practice: false });
    } catch (e) {
      return liveError(e);
    }
  }

  const startedAt = Date.now();
  if (kind === "draft") {
    const ids = (["a", "b"] as const).map((variant) =>
      encodeJob({ kind, variant, duration, model: "draft", startedAt } satisfies JobSpec),
    );
    return Response.json({ ids, practice: true });
  }

  const model = body?.model === "kling-3.0" ? "kling-3.0" : "veo-3.1";
  return Response.json({ ids: [encodeJob({ kind, variant: null, duration, model, startedAt })], practice: true });
}
