// アプリ全体で使う型。設計図（Plan）の形は tools/prompt-expander/system-prompt.md の Schema と同じ。

export type Purpose = "sns_vertical" | "free";
export type Mood = "auto" | "cute" | "cinematic" | "anime";
export type Duration = 10 | 15;

export interface Brief {
  sentence_ja: string;
  purpose: Purpose;
  mood: Mood;
  duration_sec: Duration;
  sound: boolean;
  subtitles: boolean;
}

export interface Character {
  id: string;
  label_ja: string;
  sheet: string;
  voice: string | null;
}

export interface Dialogue {
  speaker: string;
  line_ja: string;
  delivery: string;
  at: number;
}

export interface Shot {
  start: number;
  end: number;
  framing: string;
  camera: string;
  characters: string[];
  wardrobe: Record<string, string>;
  action: string;
  dialogue: Dialogue[];
  sfx: string[];
  ambience: string[];
}

export interface Plan {
  title_ja: string;
  aspect_ratio: "9:16" | "16:9";
  duration_sec: Duration;
  style: string;
  setting: string;
  characters: Character[];
  shots: Shot[];
  music: string | null;
  on_screen_text: { text_ja: string; shot: number }[];
  negative: string[];
  elements_ja: { element: string; shot: number }[];
  assumptions_ja: string[];
  safety: { ok: boolean; notes_ja: string };
}

export interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

/** 本番で使う動画モデル。セリフあり → Kling 3.0、なし → Veo 3.1 */
export type FinalModel = "kling-3.0" | "veo-3.1";

export type JobKind = "draft" | "final";

export interface JobStatus {
  id: string;
  kind: JobKind;
  state: "running" | "done";
  progress: number; // 0〜100
  remainingSec: number;
  videoUrl: string | null;
  model: string;
  practice: boolean;
}
