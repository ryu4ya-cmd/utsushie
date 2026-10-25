"use client";

// ⑤ 完成・保存・共有

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SharePanel } from "@/components/SharePanel";
import { Chip, Screen, Toast, useToast, WaitForFlow } from "@/components/ui";
import { useFlow } from "@/lib/flow";
import { addEntry, loadHistory, saveHistory } from "@/lib/history";
import { toWebVtt } from "@/lib/plan/build";
import { useJobs } from "@/lib/useJobs";

export default function DonePage() {
  const router = useRouter();
  const { state, loaded, setBrief, reset } = useFlow();
  const { finalId, planned, brief } = state;
  const { jobs } = useJobs(finalId ? [finalId] : []);
  const videoUrl = jobs[0]?.state === "done" ? jobs[0].videoUrl : null;
  const cues = useMemo(() => planned?.subtitles ?? [], [planned]);
  const [subOn, setSubOn] = useState(brief.subtitles);
  const { toast, flash } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const title = planned?.plan.title_ja ?? "ウツシエ";

  useEffect(() => {
    if (loaded && !finalId) router.replace("/");
  }, [loaded, finalId, router]);

  // 字幕は WebVTT にして動画に重ねる（MP4 への焼き込みは本番モードで FFmpeg を使う）
  const vttUrl = useMemo(() => {
    if (!cues.length) return null;
    return URL.createObjectURL(new Blob([toWebVtt(cues)], { type: "text/vtt" }));
  }, [cues]);
  useEffect(() => () => void (vttUrl && URL.revokeObjectURL(vttUrl)), [vttUrl]);

  useEffect(() => {
    const track = videoRef.current?.textTracks[0];
    if (track) track.mode = subOn ? "showing" : "hidden";
  }, [subOn, vttUrl, videoUrl]);

  // できあがったら履歴に残す（同じ動画は1件にまとめる）
  useEffect(() => {
    if (!finalId || !videoUrl || !planned) return;
    saveHistory(
      addEntry(loadHistory(), {
        id: finalId,
        createdAt: Date.now(),
        title: planned.plan.title_ja,
        sentence: brief.sentence_ja,
        duration: brief.duration_sec,
        aspect: planned.plan.aspect_ratio,
        model: planned.model,
        videoUrl,
        subtitles: planned.subtitles,
      }),
    );
  }, [finalId, videoUrl, planned, brief.sentence_ja, brief.duration_sec]);

  return (
    <WaitForFlow loaded={loaded}>
      <Screen wide>
        <header className="flex h-11 items-center gap-2">
          <span className="flex-1 font-display text-[22px] font-black">できました！</span>
          <Link href="/" aria-label="ホームに戻る" className="-mr-2.5 flex size-11 items-center justify-center hover:text-accent">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </Link>
        </header>

        {/* PC では左に動画を大きく、右に保存・共有を並べる */}
        <div className="flex flex-1 flex-col gap-5 lg:grid lg:flex-none lg:grid-cols-[auto_minmax(0,420px)] lg:items-start lg:justify-center lg:gap-12">
          <div className="flex flex-col gap-5">
            <div className="relative w-[236px] self-center overflow-hidden rounded-[18px] bg-surface lg:w-[320px]">
              {videoUrl && (
                // iPhone は自動再生と先読みをしないので、#t=0.1 で最初のコマを出し、再生はボタンで始める
                <video ref={videoRef} src={`${videoUrl}#t=0.1`} className="aspect-[9/16] w-full object-cover" controls playsInline preload="metadata">
                  {vttUrl && <track kind="subtitles" srcLang="ja" label="日本語" src={vttUrl} default={subOn} />}
                </video>
              )}
              {!videoUrl && (
                <div className="flex aspect-[9/16] w-full items-center justify-center text-sm text-muted" aria-live="polite">
                  動画を読み込んでいます…
                </div>
              )}
              <span className="absolute top-2.5 left-2.5 rounded-md bg-bg px-2 py-0.5 text-[11px] font-bold">AI生成</span>
              <span className="absolute top-2.5 right-2.5 rounded-md bg-bg px-2 py-0.5 text-[11px]">練習モード</span>
            </div>

            {/* セリフがなければ字幕もないので、切り替えは出さない */}
            {cues.length > 0 && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-[13px] text-muted">字幕</span>
                <Chip on={subOn} onClick={() => setSubOn(true)} className="h-10 rounded-full px-[18px]">あり</Chip>
                <Chip on={!subOn} onClick={() => setSubOn(false)} className="h-10 rounded-full px-[18px]">なし</Chip>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-5">
            {/* PC は横に余白があるので、動画の題と元の一文も出す */}
            {planned && (
              <div className="hidden flex-col gap-1 lg:flex">
                <span className="text-[17px] font-bold">{title}</span>
                {brief.sentence_ja && <span className="text-[13px] leading-relaxed text-muted">「{brief.sentence_ja}」</span>}
              </div>
            )}
            <a
              href={videoUrl ?? undefined}
              download="utsushie.mp4"
              aria-disabled={!videoUrl}
              className={`flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-accent text-[17px] font-bold text-on-accent hover:bg-accent-hover ${videoUrl ? "" : "pointer-events-none opacity-50"}`}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 2.5v9M5 8l4 4 4-4M3 15.5h12" />
              </svg>
              MP4で保存
            </a>

            {finalId && videoUrl && (
              <Link
                href={`/edit?id=${encodeURIComponent(finalId)}&from=done`}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-accent text-[15px] font-bold text-accent hover:bg-accent hover:text-on-accent"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 15l1-4 8-8 3 3-8 8-4 1zM10.5 4.5l3 3" />
                </svg>
                編集する（文字・BGM・トリミング）
              </Link>
            )}

            {finalId && <SharePanel id={finalId} title={title} videoUrl={videoUrl} flash={flash} />}

            <div className="flex-1 lg:hidden" />
            {brief.duration_sec === 10 && (
              <button
                type="button"
                onClick={() => {
                  setBrief({ duration_sec: 15 });
                  router.push("/drafts");
                }}
                className="h-11 rounded-xl border border-line bg-surface text-sm hover:border-accent"
              >
                同じ一文で15秒版も作る
              </button>
            )}
            <div className="flex items-center justify-between text-sm">
              <Link href="/history" className="flex min-h-11 items-center text-accent hover:text-accent-hover">
                履歴を見る
              </Link>
              <button
                type="button"
                onClick={() => {
                  reset();
                  router.push("/");
                }}
                className="flex min-h-11 items-center font-bold text-accent hover:text-accent-hover"
              >
                もう1本作る
              </button>
            </div>
          </div>
        </div>

        <Toast message={toast} />
      </Screen>
    </WaitForFlow>
  );
}
