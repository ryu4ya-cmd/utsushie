"use client";

// ジョブの進み具合を定期的に問い合わせる

import { useEffect, useState } from "react";
import type { JobStatus } from "@/lib/types";

const INTERVAL_MS = 500;

export function useJobs(ids: string[]): { jobs: (JobStatus | null)[]; error: string | null } {
  const [jobs, setJobs] = useState<(JobStatus | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!key) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const results = await Promise.all(
          key.split(",").map(async (id) => {
            const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
            if (!res.ok) throw new Error((await res.json()).error ?? "進み具合を取得できませんでした");
            return (await res.json()) as JobStatus;
          }),
        );
        if (stopped) return;
        setJobs(results);
        if (results.some((j) => j.state !== "done")) timer = setTimeout(tick, INTERVAL_MS);
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
