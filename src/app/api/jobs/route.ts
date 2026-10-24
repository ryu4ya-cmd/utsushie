// 生成ジョブを始める。練習モードではサンプル動画を返すジョブIDを作るだけ。
// 本番モードでは設計図から指示文を作り、Kling 3.0 か Veo 3.1 に生成を頼む。
// 写真から作るときは、縦横比に合わせて切り取った写真（data URL）が image に入っている（練習モードでも形を確かめる）。
// Supabase を設定していれば、ログインした人だけが、1日の上限まで作れる（本番モードでは必須）。
// オーナーの端末はログインなしで作れる。上限はオーナー用の設定（練習モードの既定は上限なし）。

import { accountError, caller, LOGIN_REQUIRED } from "@/lib/account";
import { encodeJob, type JobSpec } from "@/lib/jobs";
import { appMode } from "@/lib/mode";
import { ownerLimit } from "@/lib/owner";
import { limitMessage, limits } from "@/lib/quota";
import { parseStartImage, type StartImage } from "@/lib/startImage";
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

  // 回数を使う前に、写真がおかしくないか確かめる
  let image: StartImage | null = null;
  if (body?.image !== undefined && body?.image !== null) {
    const parsed = parseStartImage(body.image);
    if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
    image = parsed.image;
  }

  try {
    const who = await caller(request, process.env, fetch);
    if (who.configured && !who.user && !who.owner) return Response.json(LOGIN_REQUIRED, { status: 401 });
    if (live && !who.configured) {
      // URL を知っている人が誰でも生成（課金）できてしまうので、ログインなしの本番モードは動かさない
      throw new ConfigError("本番モードでは Supabase（ログインと回数制限）の設定が必要です。");
    }

    let plan: Plan | null = null;
    if (live) {
      plan = parsePlan(body?.plan, duration);
      checkLiveConfig(plan, process.env, image !== null);
    }

    if (who.configured) {
      const lim = limits(process.env);
      const perUser = who.owner ? ownerLimit(process.env, live, kind) : lim.perUser[kind];
      if (perUser !== null) {
        // 回数は Supabase のユーザーごとに数える。オーナーをログインなしで数えるには、ユーザーIDの設定が要る
        if (!who.user) throw new ConfigError("オーナーの回数を数えるには UTSUSHIE_OWNER_USER_ID（Supabase のユーザーID）を設定してください。");
        const spent = await spendGeneration(who.supabase, { user: who.user, kind, limit: perUser, total: lim.total[kind] }, fetch);
        if (!spent.ok) return Response.json({ error: limitMessage(kind, perUser, spent.reason), quota: true }, { status: 429 });
      }
    }

    if (live && plan) {
      const ids = await startLive(
        { kind, duration, plan, sound: body?.sound !== false, owner: who.user ?? (who.owner ? "owner" : null), image },
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

  const model = image || body?.model === "kling-3.0" ? "kling-3.0" : "veo-3.1";
  return Response.json({ ids: [encodeJob({ kind, variant: null, duration, model, startedAt })], practice: true });
}
