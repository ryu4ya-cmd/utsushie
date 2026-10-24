"use client";

// ② 一文と雰囲気を入れる

import { useRouter } from "next/navigation";
import { BackHeader, Chip, CtaButton, Screen, StepBar, Switch, WaitForFlow } from "@/components/ui";
import { MAX_SENTENCE } from "@/lib/brief";
import { useFlow } from "@/lib/flow";
import { useSession, useUsage } from "@/lib/supabase/browser";
import type { Mood } from "@/lib/types";

const EXAMPLES = [
  "夕焼けの海辺で猫が驚いてジャンプする",
  "雨の夜の商店街で、傘をさした女の子が振り返って「また明日ね」と笑う",
  "朝のカフェでラテアートが完成する瞬間",
];

const MOODS: { id: Mood; label: string }[] = [
  { id: "auto", label: "おまかせ" },
  { id: "cute", label: "かわいい" },
  { id: "cinematic", label: "映画風" },
  { id: "anime", label: "アニメ風" },
];

export default function CreatePage() {
  const router = useRouter();
  const { state, loaded, setBrief } = useFlow();
  const b = state.brief;
  const count = Array.from(b.sentence_ja).length;
  const canGo = b.sentence_ja.trim().length > 0 && count <= MAX_SENTENCE;
  // ログインの設定があるときは、ログインしてから作る
  const auth = useSession();
  const usage = useUsage(auth.session);
  const needLogin = auth.enabled && auth.loaded && !auth.session;
  const left = usage ? Math.max(0, usage.limits.draft - usage.used.draft) : null;

  return (
    <WaitForFlow loaded={loaded}>
      <Screen>
        <BackHeader
          href="/"
          label="用途選択に戻る"
          title="一文で伝える"
          right={
            <span className="rounded-full border border-accent bg-surface-2 px-2.5 py-1 text-xs">
              {b.purpose === "sns_vertical" ? "SNS縦型" : "自由"}
            </span>
          }
        />
        <StepBar step={2} />

        <div className="flex flex-col gap-2">
          <label htmlFor="idea" className="font-display text-[22px] font-black">
            どんな動画にしますか？
          </label>
          <textarea
            id="idea"
            rows={3}
            maxLength={MAX_SENTENCE}
            placeholder="例：夕焼けの海辺で猫が驚いてジャンプする"
            value={b.sentence_ja}
            enterKeyHint="done"
            onChange={(e) => setBrief({ sentence_ja: e.target.value.replace(/\s*\n\s*/g, " ") })}
            // 一文なので改行は入れない。スマホのキーボードの「完了」でキーボードを閉じる
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            className="w-full resize-none rounded-2xl border-[1.5px] border-line bg-surface px-4 py-3.5 text-base leading-relaxed placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <span className="self-end text-xs text-muted">
            {count} / {MAX_SENTENCE}文字・セリフは「」で囲む
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-muted">例をタップして入れる</span>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setBrief({ sentence_ja: t })}
                className="min-h-10 rounded-xl border border-line px-3 py-2 text-left text-[13px] leading-normal text-ink/85 hover:border-accent hover:text-ink"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">雰囲気</span>
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map((m) => (
              <Chip key={m.id} on={b.mood === m.id} onClick={() => setBrief({ mood: m.id })} className="h-11">
                {m.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">長さ</span>
          <div className="flex gap-2">
            {([10, 15] as const).map((n) => (
              <Chip key={n} on={b.duration_sec === n} onClick={() => setBrief({ duration_sec: n })} className="h-10 w-[76px] rounded-full">
                {n}秒
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-[14px] bg-surface px-4 py-1">
          <div className="flex min-h-12 items-center justify-between">
            <span id="lbl-sound" className="text-sm">声・効果音を自動で入れる</span>
            <Switch labelId="lbl-sound" on={b.sound} onClick={() => setBrief({ sound: !b.sound })} />
          </div>
          <div className="h-px bg-line" />
          <div className="flex min-h-12 items-center justify-between">
            <span id="lbl-sub" className="text-sm">日本語字幕を付ける</span>
            <Switch labelId="lbl-sub" on={b.subtitles} onClick={() => setBrief({ subtitles: !b.subtitles })} />
          </div>
        </div>

        <div className="flex-1" />
        <div className="flex flex-col gap-2">
          <span className="text-center text-xs text-muted" aria-live="polite">
            {!b.sentence_ja.trim()
              ? "上に一文を書くか、例をタップすると作れます"
              : left === 0
                ? "今日の分は使い切りました。日本時間の0時にまた作れます"
                : left !== null
                  ? `今日はあと${left}回、下書きを作れます（1回で2本）`
                  : "練習モードでは、サンプル動画が返ってきます"}
          </span>
          <CtaButton
            disabled={!canGo || !auth.loaded || left === 0}
            onClick={() => router.push(needLogin ? "/login?next=/drafts" : "/drafts")}
          >
            {needLogin ? "ログインして下書きを作る" : "下書きを2本作る"}
          </CtaButton>
        </div>
      </Screen>
    </WaitForFlow>
  );
}
