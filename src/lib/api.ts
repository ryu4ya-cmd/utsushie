"use client";

// 画面からサーバーへの問い合わせ

import type { PlanResult } from "@/lib/flow";
import { authHeaders } from "@/lib/supabase/browser";
import type { Brief, FinalModel, Plan } from "@/lib/types";

/** ログインが必要なときのエラー。画面はログインの画面へ案内する */
export class LoginRequiredError extends Error {}

/** 1日の回数を使い切ったときのエラー。「もう一度」を押しても変わらない */
export class QuotaError extends Error {}

async function post<T>(url: string, body: unknown): Promise<T> {
  const auth = await authHeaders();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify(body),
    });
  } catch {
    // ブラウザの英語のエラー（Failed to fetch / Load failed）をそのまま出さない
    throw new Error("通信に失敗しました。電波のよい所で、もう一度お試しください。");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && data.login) {
    // ログインしているのにサーバーが認めないときは、ログイン画面へ送り返すと行ったり来たりになるので、ここで止める
    if (auth.Authorization) throw new Error("ログインを確かめられませんでした。右上の「アカウント」からログアウトして、もう一度ログインしてください。");
    throw new LoginRequiredError(data.error);
  }
  if (res.status === 429 && data.quota) throw new QuotaError(data.error);
  if (!res.ok) throw new Error(data.error ?? "通信に失敗しました。もう一度お試しください。");
  return data as T;
}

export const requestPlan = (brief: Brief) => post<PlanResult>("/api/plan", brief);

// 本番モードでは設計図から動画APIへの指示文を作るので、設計図も送る（練習モードでは使わない）。
// 写真から作るときは、切り取った写真（data URL）を image で送る
export const startDrafts = (brief: Brief, plan: Plan, image: string | null = null) =>
  post<{ ids: string[] }>("/api/jobs", { kind: "draft", duration_sec: brief.duration_sec, sound: brief.sound, plan, image }).then(
    (r) => r.ids,
  );

export const startFinal = (brief: Brief, plan: Plan, model: FinalModel, image: string | null = null) =>
  post<{ ids: string[] }>("/api/jobs", { kind: "final", duration_sec: brief.duration_sec, sound: brief.sound, plan, model, image }).then(
    (r) => r.ids[0],
  );
