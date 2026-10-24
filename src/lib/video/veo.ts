// Veo 3.1（セリフなし）を Gemini API で呼ぶ。
// 1回8秒まで。それより長いときは、できた動画を「延長」してつなぐ（延長は720pのみ、1回で約7秒伸びる）。
// 仕様は公開ドキュメントから組み立てたもので、実際の呼び出しではまだ確かめていない（延長のリクエストの形など要確認）。

import { ProviderError, type FetchLike, type ProviderStatus, type VideoRequest } from "@/lib/video/types";

export interface VeoConfig {
  apiKey: string;
  apiBase: string; // https://generativelanguage.googleapis.com/v1beta
  model: string; // 本番
  draftModel: string; // 下書き（Fast）
}

const OPERATION = /^models\/[\w.-]+\/operations\/[\w-]+$/;

async function call(cfg: VeoConfig, fetcher: FetchLike, path: string, init?: RequestInit) {
  const res = await fetcher(`${cfg.apiBase}/${path}`, {
    ...init,
    headers: { "x-goog-api-key": cfg.apiKey, "Content-Type": "application/json" },
  });
  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok || !data) {
    const msg = (data?.error as { message?: string } | undefined)?.message;
    throw new ProviderError(`Veo: ${msg ?? `HTTP ${res.status}`}`);
  }
  return data;
}

/** 生成を頼み、操作名（operations/…）を返す。extendFrom を渡すと、その動画の続きを作る */
export async function submitVeo(
  cfg: VeoConfig,
  req: VideoRequest,
  fetcher: FetchLike,
  extendFrom?: string,
): Promise<string> {
  const model = req.quality === "draft" ? cfg.draftModel : cfg.model;
  const instance: Record<string, unknown> = { prompt: req.prompt };
  const parameters: Record<string, unknown> = { aspectRatio: req.aspectRatio, resolution: "720p" };
  if (extendFrom) instance.video = { uri: extendFrom };
  else parameters.durationSeconds = Math.min(8, req.durationSec);

  const data = await call(cfg, fetcher, `models/${model}:predictLongRunning`, {
    method: "POST",
    body: JSON.stringify({ instances: [instance], parameters }),
  });
  if (typeof data.name !== "string" || !OPERATION.test(data.name)) {
    throw new ProviderError("Veo: 操作名が返ってきませんでした");
  }
  return data.name;
}

export async function pollVeo(cfg: VeoConfig, operation: string, fetcher: FetchLike): Promise<ProviderStatus> {
  if (!OPERATION.test(operation)) throw new ProviderError("Veo: 操作名が正しくありません");
  const data = await call(cfg, fetcher, operation);
  if (!data.done) return { state: "running" };
  const error = data.error as { message?: string } | undefined;
  if (error) return { state: "failed", message: error.message ?? "生成に失敗しました" };
  const res = (data.response as Record<string, unknown> | undefined)?.generateVideoResponse as
    | { generatedSamples?: { video?: { uri?: unknown } }[]; raiMediaFilteredReasons?: string[] }
    | undefined;
  if (res?.raiMediaFilteredReasons?.length) {
    return { state: "failed", message: "安全のための確認で止められました。内容を変えてお試しください。" };
  }
  const uri = res?.generatedSamples?.[0]?.video?.uri;
  if (typeof uri !== "string" || !isVeoFile(cfg, uri)) return { state: "failed", message: "動画が返ってきませんでした" };
  return { state: "done", videoRef: uri };
}

/** Veo の動画ファイルは APIキーがないと読めないので、サーバーが代わりに取りに行く */
export function downloadVeo(cfg: VeoConfig, uri: string, range: string | null, fetcher: FetchLike): Promise<Response> {
  if (!isVeoFile(cfg, uri)) throw new ProviderError("Veo: 動画のURIが正しくありません");
  return fetcher(uri, { headers: { "x-goog-api-key": cfg.apiKey, ...(range ? { Range: range } : {}) } });
}

// APIキーを他のサイトに送らないよう、Gemini API のファイル以外は扱わない
function isVeoFile(cfg: VeoConfig, uri: string) {
  return uri.startsWith(new URL(cfg.apiBase).origin + "/");
}
