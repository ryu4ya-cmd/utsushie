"use client";

// ジョブの進み具合を定期的に問い合わせる

import { useCallback, useEffect, useRef, useState } from "react";
import type { JobStatus } from "@/lib/types";

const INTERVAL_MS = 500;
/** スマホの電波が一瞬切れたくらいで止まらないよう、続けて失敗してもこの回数までは間をあけて問い合わせ直す */
const MAX_RETRIES = 5;

/** サーバーが理由を付けて断った失敗（ジョブが見つからない・動画APIが失敗したなど）。問い合わせ直しても変わらない */
class FinalError extends Error {}

/**
 * onIdsChange は、サーバーが別のジョブIDで問い合わせを続けるよう返してきたとき（本番モードの Veo の延長）に呼ばれる。
 */
export function useJobs(
  ids: string[],
  onIdsChange?: (ids: string[]) => void,
): { jobs: (JobStatus | null)[]; error: string | null; retry: () => void } {
  const [jobs, setJobs] = useState<(JobStatus | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  // 「もう一度」で問い合わせを始め直す
  const [attempt, setAttempt] = useState(0);
  const key = ids.join(",");
  const onIds = useRef(onIdsChange);
  useEffect(() => {
    onIds.current = onIdsChange;
  });

  useEffect(() => {
    if (!key) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let current = key.split(",");
    let failures = 0;

    const tick = async () => {
      try {
        const results = await Promise.all(
          current.map(async (id) => {
            const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
            if (!res.ok) {
              const message = (await res.json().catch(() => null))?.error;
              // 理由のない失敗は、サーバーやその手前が一時的に混んでいるだけのことが多いので問い合わせ直す
              throw message ? new FinalError(message) : new Error("進み具合を取得できませんでした");
            }
            return (await res.json()) as JobStatus;
          }),
        );
        if (stopped) return;
        failures = 0;
        setError(null);
        setJobs(results);
        const next = results.map((j) => j.id);
        if (next.some((id, i) => id !== current[i])) {
          current = next;
          onIds.current?.(next);
        }
        const wait = Math.max(INTERVAL_MS, ...results.map((j) => j.pollMs ?? 0));
        if (results.some((j) => j.state !== "done")) timer = setTimeout(tick, wait);
      } catch (e) {
        if (stopped) return;
        failures += 1;
        if (!(e instanceof FinalError) && failures <= MAX_RETRIES) {
          timer = setTimeout(tick, INTERVAL_MS * 2 ** failures);
          return;
        }
        setError(e instanceof FinalError ? e.message : "通信に失敗しました。電波のよい所で「もう一度」を押してください。");
      }
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [key, attempt]);

  const retry = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  return { jobs: key ? jobs : [], error: key ? error : null, retry };
}
