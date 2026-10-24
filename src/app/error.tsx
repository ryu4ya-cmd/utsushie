"use client";

// 画面の表示中に問題が起きたときの画面。何も変わらないままにせず、理由とやり直す方法を出す

import { useEffect } from "react";
import { Screen } from "@/components/ui";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="font-display text-[22px] font-black">うまく表示できませんでした</h1>
        <p className="text-sm leading-relaxed text-muted">{error instanceof Error ? error.message : "原因がわからない問題です"}</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => retry()} className="h-11 rounded-xl border border-line bg-surface px-4 text-sm hover:border-accent">
            もう一度
          </button>
          {/* 壊れた状態を持ち越さないよう、ページを読み込み直して最初に戻る */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="flex h-11 items-center rounded-xl bg-accent px-4 text-sm font-bold text-on-accent">
            最初から
          </a>
        </div>
      </div>
    </Screen>
  );
}
