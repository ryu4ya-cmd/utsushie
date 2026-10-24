"use client";

// 画面からサーバーへの問い合わせ

import type { PlanResult } from "@/lib/flow";
import { authHeaders } from "@/lib/supabase/browser";
import type { Brief, FinalModel, Plan } from "@/lib/types";

/** ログインが必要なときのエラー。画面はログインの画面へ案内する */
export class LoginRequiredError extends Error {}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && data.login) throw new LoginRequiredError(data.error);
  if (!res.ok) throw new Error(data.error ?? "通信に失敗しました。もう一度お試しください。");
  return data as T;
}

export const requestPlan = (brief: Brief) => post<PlanResult>("/api/plan", brief);

// 本番モードでは設計図から動画APIへの指示文を作るので、設計図も送る（練習モードでは使わない）
export const startDrafts = (brief: Brief, plan: Plan) =>
  post<{ ids: string[] }>("/api/jobs", { kind: "draft", duration_sec: brief.duration_sec, sound: brief.sound, plan }).then(
    (r) => r.ids,
  );

export const startFinal = (brief: Brief, plan: Plan, model: FinalModel) =>
  post<{ ids: string[] }>("/api/jobs", { kind: "final", duration_sec: brief.duration_sec, sound: brief.sound, plan, model }).then(
    (r) => r.ids[0],
  );
