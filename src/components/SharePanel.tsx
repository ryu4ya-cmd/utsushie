"use client";

// 共有ボタンの並び。完成画面と履歴で使う

import { LINK_TARGETS, sharePageUrl, shareIntentUrl, shareVideoFile } from "@/lib/share";

export function SharePanel({ id, title, videoUrl, flash }: { id: string; title: string; videoUrl: string | null; flash: (msg: string) => void }) {
  const pageUrl = () => sharePageUrl(location.origin, id, title);
  const text = `${title}｜ウツシエで作った動画`;

  const sendFile = async () => {
    if (!videoUrl) return;
    try {
      const r = await shareVideoFile(videoUrl, title);
      if (r === "unsupported") flash("この端末では動画を直接送れません。MP4で保存してから投稿してください");
    } catch {
      flash("共有できませんでした");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      flash("リンクをコピーしました");
    } catch {
      flash("コピーできませんでした");
    }
  };

  const btn = "h-11 rounded-xl border border-line bg-surface text-xs hover:border-accent disabled:opacity-50";
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={sendFile} disabled={!videoUrl} className={`${btn} text-sm`}>
        動画を送る（TikTok・Instagram・YouTube など）
      </button>
      <div className="grid grid-cols-4 gap-2">
        {LINK_TARGETS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => window.open(shareIntentUrl(t.id, pageUrl(), text), "_blank", "noopener")}
            className={btn}
          >
            {t.label}
          </button>
        ))}
        <button type="button" onClick={copy} aria-label="共有ページのリンクをコピー" className={btn}>
          コピー
        </button>
      </div>
    </div>
  );
}
