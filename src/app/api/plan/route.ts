// 一文 → 設計図 → 指示文。練習モードでは LLM を呼ばない。

import { parseBrief } from "@/lib/brief";
import { appMode, LiveModeNotReadyError } from "@/lib/mode";
import { chooseFinalModel, promptFor } from "@/lib/models";
import { check, subtitles } from "@/lib/plan/build";
import { mockPlan } from "@/lib/plan/mockPlanner";

export async function POST(request: Request) {
  const parsed = parseBrief(await request.json().catch(() => null));
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });

  if (appMode() === "live") {
    const err = new LiveModeNotReadyError("指示文の書き直し");
    return Response.json({ error: err.message }, { status: 501 });
  }

  const plan = mockPlan(parsed.brief);
  if (!plan.safety.ok) return Response.json({ error: plan.safety.notes_ja }, { status: 422 });

  const model = chooseFinalModel(plan);
  return Response.json({
    plan,
    model,
    prompt: promptFor(plan, model),
    subtitles: subtitles(plan),
    problems: check(plan),
    practice: true,
  });
}
