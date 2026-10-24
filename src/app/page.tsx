"use client";

// ① 用途を選ぶ

import { BrandHeader, CtaLink, Screen, StepBar, WaitForFlow } from "@/components/ui";
import { useFlow } from "@/lib/flow";
import type { Purpose } from "@/lib/types";

const OPTIONS: { id: Purpose | null; title: string; note: string; icon: React.ReactNode }[] = [
  {
    id: "sns_vertical",
    title: "SNS縦型",
    note: "TikTok・リール・ショート向けの9:16",
    icon: <><rect x="8" y="2.5" width="12" height="23" rx="3" /><path d="M12.5 11v6l5-3z" /></>,
  },
  {
    id: "free",
    title: "自由に作る",
    note: "横長の16:9、長さも選べる",
    icon: <><path d="M14 3l2.6 6.4L23 12l-6.4 2.6L14 21l-2.6-6.4L5 12l6.4-2.6z" /><path d="M22 20l1 2.5 2.5 1-2.5 1L22 27l-1-2.5-2.5-1 2.5-1z" /></>,
  },
  {
    id: null,
    title: "商品紹介",
    note: "商品写真を動かす広告",
    icon: <><path d="M5 9h18l-1.5 15h-15z" /><path d="M10 9V7a4 4 0 0 1 8 0v2" /></>,
  },
  {
    id: null,
    title: "漫画・アニメ風",
    note: "自作キャラが動く",
    icon: <><path d="M4 6h20v14H13l-5 4v-4H4z" /><path d="M10 12h.01M18 12h.01" /></>,
  },
];

export default function PurposePage() {
  const { state, loaded, setBrief } = useFlow();

  return (
    <WaitForFlow loaded={loaded}>
      <Screen>
        <BrandHeader />
        <StepBar step={1} />

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[30px] leading-snug font-black">何を作りますか？</h1>
          <p className="text-[15px] leading-relaxed text-muted">用途を選ぶと、動画の形と長さを自動で合わせます。</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map((o) => {
            const on = o.id !== null && state.brief.purpose === o.id;
            return (
              <button
                key={o.title}
                type="button"
                disabled={o.id === null}
                aria-pressed={o.id === null ? undefined : on}
                onClick={() => o.id && o.id !== state.brief.purpose && setBrief({ purpose: o.id })}
                className={`flex min-h-[168px] flex-col gap-2.5 rounded-[18px] border-[1.5px] p-4 text-left ${
                  o.id === null
                    ? "cursor-not-allowed border-dashed border-line bg-bg"
                    : on
                      ? "border-accent bg-surface-2"
                      : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={o.id ? "var(--color-accent)" : "var(--color-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {o.icon}
                </svg>
                <span className={`text-[17px] font-bold ${o.id ? "" : "text-muted"}`}>{o.title}</span>
                <span className="text-[13px] leading-relaxed text-muted">{o.note}</span>
                {o.id === null && (
                  <span className="self-start rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-muted">近日公開</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-3 rounded-[14px] bg-surface px-4 py-3.5">
          <svg className="mt-0.5 flex-none" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 9v5M10 6h.01" />
          </svg>
          <p className="text-[13px] leading-relaxed text-ink/85">
            プロンプトの書き方は知らなくて大丈夫。日本語の一文だけで、声や効果音まで入った動画ができます。
          </p>
        </div>

        <div className="flex-1" />
        <CtaLink href="/create">次へ：一文を書く</CtaLink>
        <p className="-mt-3 text-center text-[11px] text-muted">バージョン {process.env.NEXT_PUBLIC_APP_VERSION}</p>
      </Screen>
    </WaitForFlow>
  );
}
