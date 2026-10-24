"use client";

// ④ 本番を生成中

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CtaAnchor, ErrorBox, Screen, StepBar, WaitForFlow } from "@/components/ui";
import { useFlow } from "@/lib/flow";
import { MODEL_LABEL } from "@/lib/models";
import { useJobs } from "@/lib/useJobs";

const SEGMENTS = 24;

export default function GeneratingPage() {
  const router = useRouter();
  const { state, loaded, update } = useFlow();
  const { finalId, planned, pick, brief, photo } = state;
  // 本番モードの Veo は途中で延長を頼むとジョブIDが変わるので、新しいIDを覚えておく
  const { jobs, error, retry } = useJobs(finalId ? [finalId] : [], (ids) => update({ finalId: ids[0] }));
  const job = jobs[0];
  const pct = job?.progress ?? 0;
  const done = job?.state === "done";

  useEffect(() => {
    if (loaded && !finalId) router.replace("/drafts");
  }, [loaded, finalId, router]);

  // できあがったら、ボタンを押さなくても完成画面へ進む（ページを読み込み直して移る。下のボタンと同じ理由。戻るでこの画面に戻って行き来しないよう、履歴は置き換える）
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => location.replace("/done"), 900);
    return () => clearTimeout(t);
  }, [done]);

  const steps = [
    { label: "映像を高画質で作る", from: 0, to: 60 },
    { label: brief.sound ? "声・効果音を合わせる" : "仕上げの調整", from: 60, to: 85 },
    { label: brief.subtitles ? "日本語字幕を用意する" : "書き出し", from: 85, to: 100 },
  ].map((s) => {
    const st = pct >= s.to ? "done" : pct >= s.from ? "active" : "wait";
    return { ...s, st, note: st === "done" ? "完了" : st === "active" ? "作成中" : "待ち" };
  });

  return (
    <WaitForFlow loaded={loaded}>
      <Screen>
        <header className="flex h-11 items-center gap-2">
          <span className="flex-1 text-[17px] font-bold">{done ? "できあがりました" : "本番を作っています"}</span>
          <Link href="/" aria-label="ホームに戻る（生成は続きます）" className="-mr-2.5 flex size-11 items-center justify-center hover:text-accent">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </Link>
        </header>
        <StepBar step={4} />

        {error && <ErrorBox message={error} onRetry={retry} />}

        <div className="relative flex aspect-[9/16] w-[200px] flex-col items-center justify-center gap-1 self-center overflow-hidden rounded-[18px] bg-gradient-to-br from-accent/40 to-magenta/40">
          {photo && (
            // 写真から作るときは、その写真をうっすら敷いておく
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.src}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-35"
              style={{ objectPosition: `${photo.fx * 100}% ${photo.fy * 100}%` }}
            />
          )}
          <span className="relative font-display text-[44px] font-black" aria-live="polite">{pct}%</span>
          <span className="relative text-xs text-ink/90">下書き{pick.toUpperCase()}を高画質に</span>
          {planned && <span className="relative text-[11px] text-ink/70">{MODEL_LABEL[planned.model]}（練習モード）</span>}
        </div>

        <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${SEGMENTS}, minmax(0, 1fr))` }} role="progressbar" aria-label="生成の進み具合" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span key={i} className={`h-2 rounded-sm ${pct >= ((i + 1) / SEGMENTS) * 100 - 0.01 ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-[14px] bg-surface px-4 py-3.5">
          {steps.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className={`size-3.5 flex-none rounded-full border-2 ${s.st === "done" ? "border-accent bg-accent" : s.st === "active" ? "border-accent bg-surface-2" : "border-line-strong bg-bg"}`} />
              <span className={`flex-1 text-sm ${s.st === "wait" ? "text-muted" : s.st === "active" ? "font-bold" : ""}`}>{s.label}</span>
              <span className="text-xs text-muted">{s.note}</span>
            </div>
          ))}
        </div>

        <div className="flex-1" />
        {done ? (
          <CtaAnchor href="/done">完成した動画を見る</CtaAnchor>
        ) : (
          <div className="flex flex-col items-center gap-1.5 pb-2 text-center">
            <span className="text-[15px] font-bold">あと約{job?.remainingSec ?? "…"}秒</span>
            <span className="text-[13px] leading-relaxed text-muted">
              画面を閉じても大丈夫です。
              <br />
              戻ってくると続きから見られます。
            </span>
          </div>
        )}
      </Screen>
    </WaitForFlow>
  );
}
