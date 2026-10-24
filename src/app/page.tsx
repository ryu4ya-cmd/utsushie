"use client";

// ① 用途を選ぶ

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandHeader, Screen, StepBar } from "@/components/ui";
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
    note: "広告向けのひな形",
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
  const router = useRouter();
  const { state, loaded, setBrief } = useFlow();
  // 前に作りかけたもの（タブやアプリを閉じても残っている）。この画面は保存の読み込みを待たずに出し、続きはあとから出す
  const resume = !loaded
    ? null
    : state.finalId
      ? { href: "/generating", label: "前に作った本番の動画を見る" }
      : state.draftIds.length
        ? { href: "/drafts", label: "前に作った下書きから選ぶ" }
        : null;

  return (
    <Screen>
      <BrandHeader />
      <StepBar step={1} />

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[30px] leading-snug font-black">何を作りますか？</h1>
        <p className="text-[15px] leading-relaxed text-muted">タップすると、動画の形を合わせて次へ進みます。</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((o) => {
          return (
            <button
              key={o.title}
              type="button"
              disabled={o.id === null}
              onClick={() => {
                // 選んだらそのまま次へ進む（選んでから下のボタンを押す、の2手を1手にする）
                if (!o.id) return;
                if (o.id !== state.brief.purpose) setBrief({ purpose: o.id });
                router.push("/create");
              }}
              className={`flex min-h-[168px] flex-col gap-2.5 rounded-[18px] border-[1.5px] p-4 text-left ${
                o.id === null
                  ? "cursor-not-allowed border-dashed border-line bg-bg"
                  : "border-line bg-surface hover:border-accent active:border-accent active:bg-surface-2"
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

      {resume && (
        <Link
          href={resume.href}
          className="flex items-center gap-3 rounded-[14px] border border-accent/60 bg-surface-2 px-4 py-3 hover:border-accent"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-bold">{resume.label}</span>
            <span className="truncate text-xs text-muted">
              {state.brief.sentence_ja ? `「${state.brief.sentence_ja}」` : state.photo ? "写真から・動きはおまかせ" : ""}
            </span>
          </span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 4l5 5-5 5" />
          </svg>
        </Link>
      )}

      <div className="flex items-start gap-3 rounded-[14px] bg-surface px-4 py-3.5">
        <svg className="mt-0.5 flex-none" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 9v5M10 6h.01" />
        </svg>
        <p className="text-[13px] leading-relaxed text-ink/85">
          プロンプトの書き方は知らなくて大丈夫。日本語の一文だけで、声や効果音まで入った動画ができます。手持ちの写真を動かすこともできます（次の画面で選べます）。
        </p>
      </div>

      <div className="flex-1" />
      <p className="text-center text-[11px] text-muted">バージョン {process.env.NEXT_PUBLIC_APP_VERSION}</p>
    </Screen>
  );
}
