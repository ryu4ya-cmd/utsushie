"use client";

// 作った動画の履歴（この端末に保存したもの）

import { useEffect, useState } from "react";
import { SharePanel } from "@/components/SharePanel";
import { BackHeader, CtaLink, Screen, Toast, useToast } from "@/components/ui";
import { type HistoryEntry, loadHistory, removeEntry, saveHistory } from "@/lib/history";
import { MODEL_LABEL } from "@/lib/models";

const dateFormat = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function HistoryPage() {
  const [list, setList] = useState<HistoryEntry[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const { toast, flash } = useToast();

  useEffect(() => {
    // 端末に保存した履歴は、画面を出したあとでしか読めない
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setList(loadHistory());
  }, []);

  const remove = (id: string) => {
    if (!confirm("この動画を履歴から消しますか？")) return;
    setList((l) => {
      const next = removeEntry(l ?? [], id);
      saveHistory(next);
      return next;
    });
  };

  return (
    <Screen wide>
      <BackHeader href="/" label="ホームに戻る" title="作った動画" />
      {list && (
        <p className="-mt-3 text-xs leading-relaxed text-muted">
          この端末のブラウザに保存しています（最大50本）。別の端末やブラウザでは見えません。
        </p>
      )}

      {list?.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[14px] bg-surface px-4 py-10 text-center">
          <span className="text-[15px] font-bold">まだ動画がありません</span>
          <span className="text-[13px] text-muted">作った動画は、ここに自動で残ります。</span>
        </div>
      )}

      <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
        {list?.map((e) => {
          const open = openId === e.id;
          return (
            <li key={e.id} className="flex flex-col gap-3 rounded-[18px] bg-surface p-3">
              <div className="flex gap-3">
                <video
                  src={`${e.videoUrl}#t=0.1`}
                  className={`flex-none rounded-xl bg-bg object-cover ${e.aspect === "16:9" ? "aspect-video w-[132px]" : "aspect-[9/16] w-[84px]"}`}
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[15px] font-bold">{e.title}</span>
                  <span className="line-clamp-2 text-[13px] leading-relaxed text-muted">{e.sentence}</span>
                  <span className="text-[11px] text-muted">
                    {dateFormat.format(e.createdAt)}・{e.duration}秒・{MODEL_LABEL[e.model]}
                  </span>
                  <div className="mt-auto flex gap-2 pt-1">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : e.id)}
                      className="h-9 flex-1 rounded-lg border border-line text-xs hover:border-accent"
                    >
                      {open ? "閉じる" : "再生・共有"}
                    </button>
                    <a href={e.videoUrl} download="utsushie.mp4" className="flex h-9 flex-1 items-center justify-center rounded-lg border border-line text-xs hover:border-accent">
                      保存
                    </a>
                    <button type="button" onClick={() => remove(e.id)} className="h-9 rounded-lg border border-line px-3 text-xs text-muted hover:border-magenta">
                      削除
                    </button>
                  </div>
                </div>
              </div>
              {open && (
                <>
                  <video
                    src={`${e.videoUrl}#t=0.1`}
                    className={`self-center rounded-xl bg-bg object-cover ${e.aspect === "16:9" ? "aspect-video w-full" : "aspect-[9/16] w-[236px]"}`}
                    controls
                    playsInline
                    preload="metadata"
                  />
                  <SharePanel id={e.id} title={e.title} videoUrl={e.videoUrl} flash={flash} />
                </>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex-1" />
      <div className="flex flex-col lg:mx-auto lg:w-[380px]">
        <CtaLink href="/">新しく作る</CtaLink>
      </div>
      <Toast message={toast} />
    </Screen>
  );
}
