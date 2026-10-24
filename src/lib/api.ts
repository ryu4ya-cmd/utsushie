"use client";

// 画面からサーバーへの問い合わせ

import type { PlanResult } from "@/lib/flow";
import type { Brief, Duration, FinalModel } from "@/lib/types";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "通信に失敗しました。もう一度お試しください。");
  return data as T;
}

export const requestPlan = (brief: Brief) => post<PlanResult>("/api/plan", brief);

export const startDrafts = (duration: Duration) =>
  post<{ ids: string[] }>("/api/jobs", { kind: "draft", duration_sec: duration }).then((r) => r.ids);

export const startFinal = (duration: Duration, model: FinalModel) =>
  post<{ ids: string[] }>("/api/jobs", { kind: "final", duration_sec: duration, model }).then((r) => r.ids[0]);
