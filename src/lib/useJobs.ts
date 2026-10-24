"use client";

// ジョブの進み具合を定期的に問い合わせる

import { useEffect, useRef, useState } from "react";
import type { JobStatus } from "@/lib/types";

const INTERVAL_MS = 500;

/**
 * onIdsChange は、サーバーが別のジョブIDで問い合わせを続けるよう返してきたとき（本番モードの Veo の延長）に呼ばれる。
 */
export function useJobs(
  ids: string[],
  onIdsChange?: (ids: string[]) => void,
): { jobs: (JobStatus | null)[]; error: string | null } {
  const [jobs, setJobs] = useState<(JobStatus | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
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

    const tick = async () => {
      try {
        const results = await Promise.all(
          current.map(async (id) => {
            const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
            if (!res.ok) throw new Error((await res.json()).error ?? "進み具合を取得できませんでした");
            return (await res.json()) as JobStatus;
          }),
        );
        if (stopped) return;
        setJobs(results);
        const next = results.map((j) => j.id);
        if (next.some((id, i) => id !== current[i])) {
          current = next;
          onIds.current?.(next);
        }
        const wait = Math.max(INTERVAL_MS, ...results.map((j) => j.pollMs ?? 0));
        if (results.some((j) => j.state !== "done")) timer = setTimeout(tick, wait);
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : "通信に失敗しました");
      }
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [key]);

  return { jobs: key ? jobs : [], error };
}
