"use client";

// ⑤ 完成・保存・共有

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chip, Screen, WaitForFlow } from "@/components/ui";
import { useFlow } from "@/lib/flow";
import { toWebVtt } from "@/lib/plan/build";
import { useJobs } from "@/lib/useJobs";

const SHARE_TARGETS = ["TikTok", "Instagram", "YouTube", "LINE"];

export default function DonePage() {
  const router = useRouter();
  const { state, loaded, setBrief, reset } = useFlow();
  const { finalId, planned, brief } = state;
  const { jobs } = useJobs(finalId ? [finalId] : []);
  const videoUrl = jobs[0]?.state === "done" ? jobs[0].videoUrl : null;
  const cues = useMemo(() => planned?.subtitles ?? [], [planned]);
  const [subOn, setSubOn] = useState(brief.subtitles);
  const [toast, setToast] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const flash = (msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const share = async (target: string) => {
    if (!videoUrl) return;
    try {
      const blob = await (await fetch(videoUrl)).blob();
      const file = new File([blob], "utsushie.mp4", { type: "video/mp4" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: planned?.plan.title_ja ?? "ウツシエ" });
        return;
      }
      flash(`この端末では共有画面を開けません。保存してから${target}に投稿してください`);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // 共有をやめた
      flash("共有できませんでした");
    }
  };

  return (
    <WaitForFlow loaded={loaded}>
      <Screen>
        <header className="flex h-11 items-center gap-2">
          <span className="flex-1 font-display text-[22px] font-black">できました！</span>
          <Link href="/" aria-label="ホームに戻る" className="-mr-2.5 flex size-11 items-center justify-center hover:text-accent">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </Link>
        </header>

        <div className="relative w-[236px] self-center overflow-hidden rounded-[18px] bg-surface">
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

        <div className="flex items-center justify-center gap-2">
          <span className="text-[13px] text-muted">字幕</span>
          <Chip on={subOn} onClick={() => setSubOn(true)} className="h-10 rounded-full px-[18px]">あり</Chip>
          <Chip on={!subOn} onClick={() => setSubOn(false)} className="h-10 rounded-full px-[18px]">なし</Chip>
        </div>
        {!cues.length && <p className="-mt-3 text-center text-xs text-muted">セリフがないので、字幕は出ません</p>}

        <a
          href={videoUrl ?? undefined}
          download="utsushie.mp4"
          aria-disabled={!videoUrl}
          className="flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-accent text-[17px] font-bold text-on-accent hover:bg-accent-hover"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 2.5v9M5 8l4 4 4-4M3 15.5h12" />
          </svg>
          MP4で保存
        </a>

        <div className="grid grid-cols-4 gap-2">
          {SHARE_TARGETS.map((t) => (
            <button key={t} type="button" onClick={() => share(t)} className="h-11 rounded-xl border border-line bg-surface text-xs hover:border-accent">
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <div className="flex items-center justify-between text-sm">
          {brief.duration_sec === 10 ? (
            <button
              type="button"
              onClick={() => {
                setBrief({ duration_sec: 15 });
                router.push("/drafts");
              }}
              className="flex min-h-11 items-center text-accent hover:text-accent-hover"
            >
              15秒版も作る
            </button>
          ) : (
            <span />
          )}
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

        {toast && (
          <div role="status" className="fixed inset-x-5 top-[calc(env(safe-area-inset-top)+80px)] mx-auto max-w-[390px] rounded-xl bg-ink px-4 py-3 text-center text-sm font-medium text-bg">
            {toast}
          </div>
        )}
      </Screen>
    </WaitForFlow>
  );
}
