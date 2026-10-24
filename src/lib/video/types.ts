// 本番モードで動画APIを呼ぶ部分の共通の型。
// テストでは fetch を差し替えて、本物のAPIには一切つながないようにする。

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** 動画APIに1回だけ頼む中身 */
export interface VideoRequest {
  prompt: string;
  aspectRatio: "9:16" | "16:9";
  durationSec: number;
  quality: "draft" | "final"; // 下書きは安い設定、本番は高画質
  sound: boolean;
}

/** 動画APIに問い合わせた結果。done なら videoRef（Kling は動画のURL、Veo はファイルのURI）が入る */
export type ProviderStatus =
  | { state: "running" }
  | { state: "done"; videoRef: string }
  | { state: "failed"; message: string };

export class ProviderError extends Error {}
