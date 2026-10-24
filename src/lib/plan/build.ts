// 設計図（Plan）から各動画モデル向けの指示文と字幕を組み立てる。
// tools/prompt-expander/build_prompts.py を TypeScript に移したもの。出力は一字一句同じにしてある。

import type { Dialogue, Plan, Shot, SubtitleCue } from "@/lib/types";

const VEO_MAX_SEC = 8;
const MAX_CHARS_PER_SEC = 7;

// Python の len() と同じく、文字数をコードポイントで数える
const charCount = (s: string) => Array.from(s).length;

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s);

/** 設計図の検査（カットの隙間、セリフの長さ）。問題がなければ空配列 */
export function check(plan: Plan): string[] {
  const problems: string[] = [];
  const shots = plan.shots;
  if (!shots.length) return ["shots が空（safety.ok=false の可能性）"];
  if (shots[0].start !== 0 || shots[shots.length - 1].end !== plan.duration_sec) {
    problems.push("カットが 0 秒から尺の終わりまでを覆っていない");
  }
  for (let i = 0; i < shots.length - 1; i++) {
    if (shots[i].end !== shots[i + 1].start) problems.push(`カット${i + 1}と${i + 2}の間に隙間か重なり`);
  }
  const ids = new Set(plan.characters.map((c) => c.id));
  shots.forEach((s, idx) => {
    const i = idx + 1;
    if (s.end - s.start < 4) problems.push(`カット${i}が4秒未満`);
    for (const d of s.dialogue) {
      if (!ids.has(d.speaker)) problems.push(`カット${i}の話し手 ${d.speaker} が登場人物にいない`);
      const room = s.end - d.at;
      if (charCount(d.line_ja) > MAX_CHARS_PER_SEC * room) {
        problems.push(`カット${i}の「${d.line_ja}」が残り${room}秒に入らない`);
      }
    }
  });
  return problems;
}

function character(plan: Plan, cid: string) {
  const c = plan.characters.find((c) => c.id === cid);
  if (!c) throw new Error(`登場人物 ${cid} がいない`);
  return c;
}

function sheet(plan: Plan, cid: string, shot: Shot) {
  let text = character(plan, cid).sheet;
  if (shot.wardrobe?.[cid]) text += `, wearing ${shot.wardrobe[cid]}`;
  return text;
}

// 2人以上いるときは、セリフの話し手を外見で指す
function who(plan: Plan, cid: string) {
  const c = character(plan, cid);
  return plan.characters.length > 1 ? `${cid}, ${c.sheet.split(",")[0]},` : cid;
}

function audio(plan: Plan, shot: Shot, dialogue?: Dialogue[]) {
  const parts: string[] = [];
  for (const d of dialogue ?? shot.dialogue) {
    const c = character(plan, d.speaker);
    const voice = c.voice ? ` in a ${c.voice}` : "";
    parts.push(
      `${who(plan, d.speaker)} says in Japanese${voice}, ${d.delivery}, with matching lip movement: 「${d.line_ja}」`,
    );
  }
  if (shot.sfx.length) parts.push("Sound effects: " + shot.sfx.join(", "));
  if (shot.ambience.length) parts.push("Ambience: " + shot.ambience.join(", "));
  return parts.join(". ");
}

// Python の str.strip(" .") と同じ
const stripSpaceDot = (s: string) => s.replace(/^[ .]+|[ .]+$/g, "");

function shotBody(plan: Plan, shot: Shot, withSheets = true, dialogue?: Dialogue[]) {
  const cast = withSheets
    ? shot.characters.map((cid) => `${cid} is ${sheet(plan, cid, shot)}.`).join(" ")
    : Object.entries(shot.wardrobe ?? {})
        .map(([cid, w]) => `${cid} wears ${w}.`)
        .join(" ");
  return [`${capitalize(shot.framing)}, ${shot.camera}.`, cast, shot.action, audio(plan, shot, dialogue) + "."]
    .filter((x) => stripSpaceDot(x))
    .join(" ");
}

function header(plan: Plan) {
  const music = plan.music || "No background music";
  const head =
    plan.aspect_ratio === "9:16"
      ? `${plan.aspect_ratio} vertical video, ${plan.duration_sec} seconds. `
      : `${plan.aspect_ratio} video, ${plan.duration_sec} seconds. `;
  return head + `Style: ${plan.style}. Setting: ${plan.setting} ${music}.`;
}

const negative = (plan: Plan) => "Avoid: " + plan.negative.join(", ") + ".";

export function kling(plan: Plan): string {
  const lines = [header(plan)];
  plan.shots.forEach((s, i) => lines.push(`Shot ${i + 1} (${s.start}-${s.end}s): ${shotBody(plan, s)}`));
  lines.push(negative(plan));
  return lines.join("\n");
}

export function seedance(plan: Plan): string {
  const cast = plan.characters.map((c) => `${c.id}: ${c.sheet}.`).join(" ");
  const lines = [header(plan), `Characters (keep identical in every shot): ${cast}`];
  for (const s of plan.shots) lines.push(`[${s.start}-${s.end}s] ${shotBody(plan, s, false)}`);
  lines.push(negative(plan));
  return lines.join("\n");
}

/** Veo は1回8秒まで。8秒を超える分は「延長」用の2本目に分け、境目をまたぐカットは両方に入れる。 */
export function veo(plan: Plan): { label: string; text: string }[] {
  const segments: [number, number, string][] = [[0, Math.min(VEO_MAX_SEC, plan.duration_sec), "1本目（8秒）"]];
  if (plan.duration_sec > VEO_MAX_SEC) {
    segments.push([VEO_MAX_SEC, plan.duration_sec, `延長（続き${plan.duration_sec - VEO_MAX_SEC}秒）`]);
  }
  return segments.map(([segStart, segEnd, label]) => {
    const length = segEnd - segStart;
    const body = [header(plan).replace(`${plan.duration_sec} seconds`, `${length} seconds`)];
    if (segStart > 0) body.push("Continue seamlessly from the last frame of the previous clip.");
    for (const s of plan.shots) {
      if (s.end <= segStart || s.start >= segEnd) continue;
      const lines = s.dialogue.filter((d) => segStart <= d.at && d.at < segEnd);
      const start = Math.max(s.start, segStart) - segStart;
      const end = Math.min(s.end, segEnd) - segStart;
      body.push(`${start}-${end}s: ${shotBody(plan, s, true, lines)}`);
    }
    body.push(negative(plan));
    return { label, text: body.join("\n") };
  });
}

export function subtitles(plan: Plan): SubtitleCue[] {
  const out: SubtitleCue[] = [];
  for (const s of plan.shots) {
    for (const d of s.dialogue) {
      const end = Math.min(d.at + Math.max(1.0, charCount(d.line_ja) / 5), s.end);
      out.push({ start: d.at, end: Math.round(end * 10) / 10, text: d.line_ja });
    }
  }
  return out;
}

/** 字幕を WebVTT にする（動画プレーヤーで字幕の表示・非表示を切り替えるため） */
export function toWebVtt(cues: SubtitleCue[]): string {
  const ts = (sec: number) => {
    const ms = Math.round(sec * 1000);
    const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
    return `${h}:${m}:${s}.${String(ms % 1000).padStart(3, "0")}`;
  };
  return ["WEBVTT", "", ...cues.map((c) => `${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`)].join("\n");
}
