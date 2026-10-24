// Kling 3.0（セリフあり）を公式APIで呼ぶ。
// 認証はアクセスキーとシークレットキーで作る JWT（HS256、30分で切れる）。
// 仕様は公開ドキュメントから組み立てたもので、実際の呼び出しではまだ確かめていない（モデル名など要確認）。

import { createHmac } from "node:crypto";
import { ProviderError, type FetchLike, type ProviderStatus, type VideoRequest } from "@/lib/video/types";

export interface KlingConfig {
  accessKey: string;
  secretKey: string;
  apiBase: string;
  model: string;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

/** Kling の API トークン（JWT）。now は秒 */
export function klingToken(cfg: Pick<KlingConfig, "accessKey" | "secretKey">, now: number): string {
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ iss: cfg.accessKey, exp: now + 1800, nbf: now - 5 }));
  const sig = createHmac("sha256", cfg.secretKey).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

const TASK_ID = /^[\w-]{1,128}$/;

async function call(cfg: KlingConfig, fetcher: FetchLike, path: string, init?: RequestInit) {
  const res = await fetcher(`${cfg.apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${klingToken(cfg, Math.floor(Date.now() / 1000))}`,
      "Content-Type": "application/json",
    },
  });
  const data = (await res.json().catch(() => null)) as { code?: number; message?: string; data?: Record<string, unknown> } | null;
  if (!res.ok || !data || data.code !== 0 || !data.data) {
    throw new ProviderError(`Kling: ${data?.message ?? `HTTP ${res.status}`}`);
  }
  return data.data;
}

/** 生成を頼み、タスクIDを返す。下書きは std・5秒・音なし、本番は pro・指定の長さ */
export async function submitKling(cfg: KlingConfig, req: VideoRequest, fetcher: FetchLike): Promise<string> {
  const draft = req.quality === "draft";
  const data = await call(cfg, fetcher, "/v1/videos/text2video", {
    method: "POST",
    body: JSON.stringify({
      model_name: cfg.model,
      prompt: req.prompt,
      mode: draft ? "std" : "pro",
      aspect_ratio: req.aspectRatio,
      duration: String(draft ? 5 : req.durationSec),
      sound: !draft && req.sound ? "on" : "off",
    }),
  });
  const id = data.task_id;
  if (typeof id !== "string" || !TASK_ID.test(id)) throw new ProviderError("Kling: タスクIDが返ってきませんでした");
  return id;
}

export async function pollKling(cfg: KlingConfig, taskId: string, fetcher: FetchLike): Promise<ProviderStatus> {
  if (!TASK_ID.test(taskId)) throw new ProviderError("Kling: タスクIDが正しくありません");
  const data = await call(cfg, fetcher, `/v1/videos/text2video/${taskId}`);
  if (data.task_status === "failed") return { state: "failed", message: String(data.task_status_msg ?? "生成に失敗しました") };
  if (data.task_status !== "succeed") return { state: "running" };
  const videos = (data.task_result as { videos?: { url?: unknown }[] } | undefined)?.videos;
  const url = videos?.[0]?.url;
  if (typeof url !== "string" || !url.startsWith("https://")) return { state: "failed", message: "動画のURLが返ってきませんでした" };
  return { state: "done", videoRef: url };
}

/** できた動画を取りに行く。Kling の動画URLは認証なしで読める（一定期間で消える） */
export function downloadKling(videoRef: string, range: string | null, fetcher: FetchLike): Promise<Response> {
  return fetcher(videoRef, { headers: range ? { Range: range } : {} });
}
