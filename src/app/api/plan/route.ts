// 一文 → 設計図 → 指示文。LLM へのつなぎ込みはまだなので、本番モードでも決まった形の設計図を作る（LLM は呼ばない）。

import { parseBrief } from "@/lib/brief";
import { appMode } from "@/lib/mode";
import { chooseFinalModel, promptFor } from "@/lib/models";
import { check, subtitles } from "@/lib/plan/build";
import { mockPlan } from "@/lib/plan/mockPlanner";

export async function POST(request: Request) {
  const parsed = parseBrief(await request.json().catch(() => null));
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

  const plan = mockPlan(parsed.brief);
  if (!plan.safety.ok) return Response.json({ error: plan.safety.notes_ja }, { status: 422 });

  const model = chooseFinalModel(plan, parsed.brief.from_image);
  return Response.json({
    plan,
    model,
    prompt: promptFor(plan, model),
    subtitles: subtitles(plan),
    problems: check(plan),
    practice: appMode() === "practice",
  });
}
