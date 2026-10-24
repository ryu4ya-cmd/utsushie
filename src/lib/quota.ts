// 1人あたり・1日あたりの生成回数の上限。日付は日本時間で切り替わる（数えるのは Supabase 側）。
// 下書きは「2本で1回」、本番は「1本で1回」と数える。
// 全員の合計にも上限を付け、思わぬ使われ方でお金がかかりすぎないようにする。

import type { Env } from "@/lib/supabase/config";
import type { JobKind } from "@/lib/types";

export interface Limits {
  perUser: Record<JobKind, number>;
  total: Record<JobKind, number>;
}

export const DEFAULT_LIMITS: Limits = {
  perUser: { draft: 3, final: 1 },
  total: { draft: 30, final: 10 },
};

function int(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return v !== undefined && v.trim() !== "" && Number.isInteger(n) && n >= 0 ? n : fallback;
}

export function limits(env: Env): Limits {
  const d = DEFAULT_LIMITS;
  return {
    perUser: {
      draft: int(env.UTSUSHIE_DAILY_DRAFTS, d.perUser.draft),
      final: int(env.UTSUSHIE_DAILY_FINALS, d.perUser.final),
    },
    total: {
      draft: int(env.UTSUSHIE_DAILY_TOTAL_DRAFTS, d.total.draft),
      final: int(env.UTSUSHIE_DAILY_TOTAL_FINALS, d.total.final),
    },
  };
}

export const KIND_LABEL: Record<JobKind, string> = { draft: "下書き", final: "本番の動画" };

/** 上限に達したときの文言 */
export function limitMessage(kind: JobKind, perUser: number, reason: "user" | "total"): string {
  if (reason === "total") return `今日は${KIND_LABEL[kind]}の受け付けが上限に達しました。明日の0時（日本時間）にまた使えます。`;
  return perUser === 0
    ? `いまは${KIND_LABEL[kind]}を作れません。`
    : `今日の${KIND_LABEL[kind]}は使い切りました（1日${perUser}回まで）。明日の0時（日本時間）にまた使えます。`;
}
