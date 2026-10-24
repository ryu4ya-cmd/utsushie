// 動作モードの切り替え。
// 既定は「練習モード」で、外部の動画APIやLLMは一切呼ばず、public/samples のサンプル動画を返す。
// 本番モード（UTSUSHIE_MODE=live）はまだ作っていない。誤って有料APIを呼ばないよう、選ぶとエラーにする。

export type AppMode = "practice" | "live";

export function appMode(): AppMode {
  return process.env.UTSUSHIE_MODE === "live" ? "live" : "practice";
}

export class LiveModeNotReadyError extends Error {
  constructor(what: string) {
    super(`本番モードの${what}はまだ実装していません。UTSUSHIE_MODE を外して練習モードで動かしてください。`);
  }
}
