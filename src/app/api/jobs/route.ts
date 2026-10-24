// 生成ジョブを始める。練習モードではサンプル動画を返すジョブIDを作るだけ。
// 本番モードでは設計図から指示文を作り、Kling 3.0 か Veo 3.1 に生成を頼む。
// Supabase を設定していれば、ログインした人だけが、1日の上限まで作れる（本番モードでは必須）。

import { accountError, caller, LOGIN_REQUIRED } from "@/lib/account";
import { encodeJob, type JobSpec } from "@/lib/jobs";
import { appMode } from "@/lib/mode";
import { limitMessage, limits } from "@/lib/quota";
import { spendGeneration } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";
import { ConfigError, checkLiveConfig, liveError, parsePlan, startLive } from "@/lib/video/live";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const kind = body?.kind;
  const duration = body?.duration_sec;
  if (kind !== "draft" && kind !== "final") return Response.json({ error: "kind が正しくありません" }, { status: 400 });
  if (duration !== 10 && duration !== 15) return Response.json({ error: "長さは10秒か15秒です" }, { status: 400 });
  const live = appMode() === "live";

  try {
    const who = await caller(request, process.env, fetch);
    if (who.configured && !who.user) return Response.json(LOGIN_REQUIRED, { status: 401 });
    if (live && !who.configured) {
      // URL を知っている人が誰でも生成（課金）できてしまうので、ログインなしの本番モードは動かさない
      throw new ConfigError("本番モードでは Supabase（ログインと回数制限）の設定が必要です。");
    }

    let plan: Plan | null = null;
    if (live) {
      plan = parsePlan(body?.plan, duration);
      checkLiveConfig(plan, process.env);
    }

    if (who.configured && who.user) {
      const lim = limits(process.env);
      const spent = await spendGeneration(
        who.supabase,
        { user: who.user, kind, limit: lim.perUser[kind], total: lim.total[kind] },
        fetch,
      );
      if (!spent.ok) return Response.json({ error: limitMessage(kind, lim.perUser[kind], spent.reason), quota: true }, { status: 429 });
    }

    if (live && plan) {
      const ids = await startLive(
        { kind, duration, plan, sound: body?.sound !== false, owner: who.user },
        { env: process.env, fetch, now: Date.now() },
      );
      return Response.json({ ids, practice: false });
    }
  } catch (e) {
    return accountError(e) ?? liveError(e);
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
