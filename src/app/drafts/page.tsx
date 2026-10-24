"use client";

// ③ AIが直した指示文と、下書き2本から選ぶ

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BackHeader, CtaButton, ErrorBox, Screen, Spinner, StepBar, WaitForFlow } from "@/components/ui";
import { LoginRequiredError, QuotaError, requestPlan, startDrafts, startFinal } from "@/lib/api";
import { useFlow } from "@/lib/flow";
import { MODEL_LABEL } from "@/lib/models";
import { cropPhoto } from "@/lib/photo";
import { useJobs } from "@/lib/useJobs";

export default function DraftsPage() {
  const router = useRouter();
  const { state, loaded, update } = useFlow();
  const { brief, planned, draftIds, pick, photo } = state;
  const [error, setError] = useState<string | null>(null);
  // 回数切れは「もう一度」を押しても変わらないので、ボタンを出さない
  const [quota, setQuota] = useState(false);
  const [openPrompt, setOpenPrompt] = useState(false);
  const [starting, setStarting] = useState(false);
  // 「もう一度」で指示文づくり・下書きの生成をやり直す
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const { jobs, error: jobError, retry: retryJobs } = useJobs(draftIds);

  // 指示文づくり → 下書き2本の生成を順に始める
  useEffect(() => {
    if (!loaded || busy.current) return;
    if (!brief.sentence_ja.trim() && !photo) {
      router.replace("/create");
      return;
    }
    if (planned && draftIds.length) return;
    busy.current = true;
    (async () => {
      try {
        const p = planned ?? (await requestPlan(brief));
        if (!planned) update({ planned: p });
        // 写真は動画の縦横比に合わせて切り取ってから送る
        const image = photo ? await cropPhoto(photo, p.plan.aspect_ratio) : null;
        update({ draftIds: await startDrafts(brief, p.plan, image) });
      } catch (e) {
        if (e instanceof LoginRequiredError) return router.replace("/login?next=/drafts");
        setQuota(e instanceof QuotaError);
        setError(e instanceof Error ? e.message : "うまくいきませんでした");
      } finally {
        busy.current = false;
      }
    })();
  }, [loaded, brief, planned, draftIds.length, photo, router, update, attempt]);

  const ready = jobs.length === 2 && jobs.every((j) => j?.state === "done");
  const progress = jobs.length ? Math.min(...jobs.map((j) => j?.progress ?? 0)) : 0;
  const phase = !planned ? "AIが指示を詳しく書き直しています…" : "下書きを2本作っています…";
  const name = pick === "a" ? "A" : "B";

  const goFinal = async () => {
    if (!planned) return;
    setStarting(true);
    setError(null);
    try {
      const image = photo ? await cropPhoto(photo, planned.plan.aspect_ratio) : null;
      const finalId = await startFinal(brief, planned.plan, planned.model, image);
      update({ finalId });
      router.push("/generating");
    } catch (e) {
      if (e instanceof LoginRequiredError) return router.push("/login?next=/drafts");
      setQuota(e instanceof QuotaError);
      setError(e instanceof Error ? e.message : "うまくいきませんでした");
      setStarting(false);
    }
  };

  const retry = () => {
    // 下書きができたあとの失敗は、本番を始めるところでの失敗なので、そこからやり直す
    if (ready && !jobError) return void goFinal();
    if (jobError) retryJobs();
    setError(null);
    setAttempt((n) => n + 1);
  };

  return (
    <WaitForFlow loaded={loaded}>
      <Screen>
        <BackHeader href="/create" label="一文の入力に戻る" title="下書きを選ぶ" />
        <StepBar step={3} />

        {(error || jobError) && <ErrorBox message={(error || jobError) as string} onRetry={quota && !jobError ? undefined : retry} />}

        {!ready && !error && !jobError && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <Spinner />
            {/* 読み上げは段階が変わったときだけ（%まで読むと0.5秒ごとに読み上げてしまう） */}
            <p className="text-[17px] font-bold">
              <span aria-live="polite">{phase}</span>
              {planned && <span aria-hidden="true">（{progress}%）</span>}
            </p>
            <p className="line-clamp-2 px-2 text-sm leading-relaxed text-ink/85">「{brief.sentence_ja}」</p>
            <p className="text-[13px] leading-relaxed text-muted">
              安いモデルで5秒の下書きを作り、
              <br />
              気に入った方だけ高画質にします。
            </p>
          </div>
        )}

        {ready && planned && (
          <>
            <div className="flex flex-col gap-2 rounded-[14px] bg-surface px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[13px] font-bold">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 1.5l1.7 4.3L14 7.5l-4.3 1.7L8 13.5l-1.7-4.3L2 7.5l4.3-1.7z" />
                  </svg>
                  AIが指示を詳しくしました
                </span>
                <button type="button" aria-expanded={openPrompt} onClick={() => setOpenPrompt(!openPrompt)} className="-my-2 min-h-11 px-1 text-[13px] text-accent hover:text-accent-hover">
                  {openPrompt ? "閉じる" : "中身を見る"}
                </button>
              </div>
              {openPrompt ? (
                <div className="flex flex-col gap-2 text-xs leading-relaxed text-ink/85">
                  <p>
                    本番は {MODEL_LABEL[planned.model]} で作ります（
                    {photo ? "写真から" : planned.model === "kling-3.0" ? "セリフあり" : "セリフなし"}）。
                  </p>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-bg p-2.5 font-mono text-[11px] whitespace-pre-wrap">{planned.prompt}</pre>
                  {planned.plan.assumptions_ja.map((a) => (
                    <p key={a} className="text-muted">・{a}</p>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.src} alt="元の写真" className="size-10 flex-none rounded-md object-cover" />
                  )}
                  <p className="text-xs leading-relaxed text-muted">
                    {photo ? "写真＋" : ""}「{brief.sentence_ja || "おまかせ"}」→ カメラ・動き・音まで指定した指示文
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(["a", "b"] as const).map((v, i) => {
                const on = pick === v;
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ pick: v })}
                    className={`flex flex-col gap-2 rounded-[18px] border-2 p-2 text-left ${on ? "border-accent bg-surface-2" : "border-line bg-surface hover:border-line-strong"}`}
                  >
                    <video
                      src={jobs[i]?.videoUrl ?? undefined}
                      className="aspect-[9/16] w-full rounded-xl bg-bg object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-label={`下書き${v.toUpperCase()}の動画`}
                    />
                    <span className="flex items-center gap-2 px-1 pb-1">
                      <span className={`size-[18px] flex-none rounded-full border-2 ${on ? "border-accent bg-accent" : "border-muted bg-bg"}`} />
                      <span className="flex flex-col">
                        <span className="text-sm font-bold">下書き{v.toUpperCase()}</span>
                        <span className="text-xs text-muted">{v === "a" ? "寄りのカメラ" : "引きの構図"}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1" />
            <div className="flex flex-col gap-2.5">
              <CtaButton onClick={goFinal} disabled={starting}>
                {starting ? "本番を始めています…" : `${name}で本番を作る（高画質・${brief.sound ? "音付き" : "音なし"}${brief.duration_sec}秒）`}
              </CtaButton>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted">練習モードは0円</span>
                <button
                  type="button"
                  onClick={() => {
                    update({ planned: null, draftIds: [] });
                    router.push("/create");
                  }}
                  className="flex min-h-11 items-center text-accent hover:text-accent-hover"
                >
                  どちらも違う：作り直す
                </button>
              </div>
            </div>
          </>
        )}
      </Screen>
    </WaitForFlow>
  );
}
