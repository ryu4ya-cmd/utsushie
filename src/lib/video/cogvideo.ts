// CogVideoX-Flash（智谱 BigModel の無料の動画モデル）を公式APIで呼ぶ。お金もクレジットも使わない。
// 一文からも写真からも同じ場所に頼む。長さは選べず（数秒の1本）、セリフの口の動きや日本語の声は出ない。
// 無料の機能は「非商用・個人の研究や学習」に限られる（利用規約 7.2）。一般公開する前に有料のモデルへ戻すこと。
// 動画には AI 生成の印（透かし）が付き、規約で消せない。
// 仕様は公開ドキュメントから組み立てたもので、実際の呼び出しではまだ確かめていない（写真の base64 の渡し方など要確認）。

import { ProviderError, type FetchLike, type ProviderStatus, type VideoRequest } from "@/lib/video/types";

export interface CogVideoConfig {
  apiKey: string;
  apiBase: string; // https://open.bigmodel.cn/api/paas/v4
  model: string;
}

/** 指示文の上限（文字） */
export const COGVIDEO_MAX_PROMPT = 512;

const TASK_ID = /^[\w.-]{1,128}$/;

const SIZE: Record<VideoRequest["aspectRatio"], string> = { "9:16": "1080x1920", "16:9": "1920x1080" };

async function call(cfg: CogVideoConfig, fetcher: FetchLike, path: string, init?: RequestInit) {
  const res = await fetcher(`${cfg.apiBase}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
  });
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !data) {
    const msg = (data?.error as { message?: string } | undefined)?.message;
    throw new ProviderError(`CogVideoX: ${msg ?? `HTTP ${res.status}`}`);
  }
  return data;
}

/** 上限に収まるよう、行ごとに詰める（入らない行は飛ばし、それでも長ければ切る） */
export function clipPrompt(text: string, max = COGVIDEO_MAX_PROMPT): string {
  const out: string[] = [];
  let len = 0;
  for (const line of text.split("\n")) {
    const add = Array.from(line).length + (out.length ? 1 : 0);
    if (len + add > max) continue;
    out.push(line);
    len += add;
  }
  const joined = out.length ? out.join("\n") : text;
  return Array.from(joined).slice(0, max).join("");
}

/** 生成を頼み、タスクIDを返す。下書きは速さ優先・音なし、本番は画質優先。req.image があれば写真から作る */
export async function submitCogVideo(cfg: CogVideoConfig, req: VideoRequest, fetcher: FetchLike): Promise<string> {
  const draft = req.quality === "draft";
  const body: Record<string, unknown> = {
    model: cfg.model,
    prompt: clipPrompt(req.prompt),
    quality: draft ? "speed" : "quality",
    with_audio: !draft && req.sound,
  };
  // 写真から作るときは大きさを送らず、写真の縦横で作られる（画面で切り取ってから送る）
  if (req.image) body.image_url = req.image;
  else body.size = SIZE[req.aspectRatio];

  const data = await call(cfg, fetcher, "/videos/generations", { method: "POST", body: JSON.stringify(body) });
  if (typeof data.id !== "string" || !TASK_ID.test(data.id)) throw new ProviderError("CogVideoX: タスクIDが返ってきませんでした");
  return data.id;
}

export async function pollCogVideo(cfg: CogVideoConfig, taskId: string, fetcher: FetchLike): Promise<ProviderStatus> {
  if (!TASK_ID.test(taskId)) throw new ProviderError("CogVideoX: タスクIDが正しくありません");
  const data = await call(cfg, fetcher, `/async-result/${taskId}`);
  if (data.task_status === "FAIL") return { state: "failed", message: "生成に失敗しました" };
  if (data.task_status !== "SUCCESS") return { state: "running" };
  const url = (data.video_result as { url?: unknown }[] | undefined)?.[0]?.url;
  if (typeof url !== "string" || !url.startsWith("https://")) return { state: "failed", message: "動画のURLが返ってきませんでした" };
  return { state: "done", videoRef: url };
}

/** できた動画を取りに行く。動画のURLは認証なしで読める（一定期間で消える） */
export function downloadCogVideo(videoRef: string, range: string | null, fetcher: FetchLike): Promise<Response> {
  return fetcher(videoRef, { headers: range ? { Range: range } : {} });
}
