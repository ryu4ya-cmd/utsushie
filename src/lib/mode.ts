// 動作モードの切り替え。スイッチは環境変数 UTSUSHIE_MODE の1つだけ。
// 既定は「練習モード」で、外部の動画APIやLLMは一切呼ばず、public/samples のサンプル動画を返す。
// UTSUSHIE_MODE=live のときだけ本番モードになり、動画を Kling 3.0 / Veo 3.1 に頼む（お金がかかる）。
// live 以外の値や未設定はすべて練習モードとして扱う。

export type AppMode = "practice" | "live";

export function appMode(env: Record<string, string | undefined> = process.env): AppMode {
  return env.UTSUSHIE_MODE === "live" ? "live" : "practice";
}
