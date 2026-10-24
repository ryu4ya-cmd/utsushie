// 練習モード用の設計図づくり。LLM を呼ばずに、一文から決まった形の設計図を組み立てる。
// 本番では tools/prompt-expander/system-prompt.md を LLM に渡して設計図を作る。

import type { Brief, Character, Dialogue, Mood, Plan, Shot } from "@/lib/types";

const MOOD_STYLE: Record<Mood, string> = {
  cute: "soft pastel colors, gentle diffused light",
  cinematic: "cinematic, shallow depth of field, subtle film grain",
  anime: "Japanese anime style, clean cel shading",
  auto: "photorealistic, natural light",
};

const BASE_NEGATIVE = ["subtitles", "captions", "watermark", "logo", "distorted hands", "extra limbs"];

/** 一文の中の「」で囲まれたセリフを取り出す */
export function extractLines(sentence: string): string[] {
  return Array.from(sentence.matchAll(/「([^」]+)」/g), (m) => m[1].trim()).filter(Boolean);
}

/** 尺に合わせてカットの区切りを決める（各4秒以上、15秒は8秒で区切る） */
function cuts(duration: number, hasDialogue: boolean): [number, number][] {
  if (duration === 15) return [[0, 8], [8, 15]];
  return hasDialogue ? [[0, 5], [5, 10]] : [[0, 10]];
}

export function mockPlan(brief: Brief): Plan {
  const sentence = brief.sentence_ja.trim();
  const lines = extractLines(sentence);
  const hasDialogue = lines.length > 0;
  const vertical = brief.purpose === "sns_vertical";

  const characters: Character[] = hasDialogue
    ? [{ id: "A", label_ja: "主人公", sheet: "the main character described in the sentence", voice: "natural, friendly voice" }]
    : [];

  const ranges = cuts(brief.duration_sec, hasDialogue);
  const shots: Shot[] = ranges.map(([start, end], i) => {
    const last = i === ranges.length - 1;
    const dialogue: Dialogue[] =
      last && hasDialogue
        ? lines.map((line, n) => ({ speaker: "A", line_ja: line, delivery: "natural", at: start + 1 + n * 2 }))
        : [];
    return {
      start,
      end,
      framing: i === 0 ? "wide shot" : "medium close-up",
      camera: i === 0 ? "slow push-in" : "static",
      characters: hasDialogue ? ["A"] : [],
      wardrobe: {},
      action:
        i === 0
          ? `The scene described in this Japanese sentence: 「${sentence}」`
          : `The scene continues toward its key moment: 「${sentence}」`,
      dialogue,
      sfx: [],
      ambience: brief.sound ? ["ambient sound that fits the place"] : [],
    };
  });

  return {
    title_ja: Array.from(sentence).slice(0, 20).join(""),
    aspect_ratio: vertical ? "9:16" : "16:9",
    duration_sec: brief.duration_sec,
    style: MOOD_STYLE[brief.mood],
    setting: "The place and time described in the sentence.",
    characters,
    shots,
    music: null,
    on_screen_text: [],
    negative: BASE_NEGATIVE,
    elements_ja: [{ element: sentence, shot: 1 }],
    assumptions_ja: ["練習モードのため、AIでの書き直しはせず決まった形で組み立てています"],
    safety: { ok: true, notes_ja: "" },
  };
}
