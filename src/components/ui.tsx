"use client";

// 画面で共通に使う部品

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    // iPhone の画面上端（時計）と下端（ホームバー・Safari のツールバー）に重ならないよう、安全な余白を足す
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-5 px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+28px)]">
      {children}
    </main>
  );
}

export function PracticeBadge() {
  return (
    <span
      className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink"
      title="外部の動画AIは使わず、サンプル動画を返しています"
    >
      練習モード
    </span>
  );
}

export function BrandHeader() {
  return (
    <header className="flex h-11 items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5" aria-label="ウツシエ ホーム">
        <Image src="/brand/mark-on-dark.svg" alt="" width={32} height={32} priority />
        <span className="font-display text-lg font-black tracking-wide">ウツシエ</span>
      </Link>
      <div className="flex items-center gap-1">
        <Link href="/history" className="flex h-11 items-center px-2.5 text-sm text-ink hover:text-accent">
          履歴
        </Link>
        <PracticeBadge />
      </div>
    </header>
  );
}

export function BackHeader({ href, label, title, right }: { href: string; label: string; title: string; right?: React.ReactNode }) {
  return (
    <header className="flex h-11 items-center gap-2">
      <Link href={href} aria-label={label} className="-ml-2.5 flex size-11 items-center justify-center text-ink hover:text-accent">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 4l-7 7 7 7" />
        </svg>
      </Link>
      <span className="flex-1 text-[17px] font-bold">{title}</span>
      {right}
    </header>
  );
}

export function StepBar({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={`ステップ ${step} / ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1 flex-1 rounded-sm ${i < step ? "bg-accent" : "bg-line"}`} />
      ))}
    </div>
  );
}

const ctaClass =
  "flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-center text-[16px] font-bold text-on-accent hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";

export function CtaLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={ctaClass}>
      {children}
    </Link>
  );
}

/** Next のクライアント遷移を使わず、ページを読み込み直して移る。iPhone のホーム画面アプリでも確実に進めるため */
export function CtaAnchor({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className={ctaClass}>
      {children}
    </a>
  );
}

export function CtaButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={ctaClass} />;
}

export function Chip({ on, onClick, children, className = "" }: { on: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-xl border-[1.5px] text-sm font-medium ${
        on ? "border-accent bg-accent text-on-accent" : "border-line bg-surface text-ink hover:border-line-strong"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Switch({ on, onClick, labelId }: { on: boolean; onClick: () => void; labelId: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-labelledby={labelId} onClick={onClick} className="flex h-11 w-12 items-center">
      <span className={`relative block h-[26px] w-[46px] rounded-full transition-colors ${on ? "bg-accent" : "bg-line-strong"}`}>
        <span className={`absolute top-[3px] left-[3px] block size-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

export function Spinner() {
  return (
    <svg className="animate-spin" width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke="var(--color-line)" strokeWidth="5" />
      <path d="M24 4a20 20 0 0 1 20 20" stroke="var(--color-accent)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-magenta/60 bg-surface px-4 py-3 text-sm leading-relaxed">
      {message}
    </p>
  );
}

/** 保存した入力を読み込むまでは何も出さない（読み込み前の初期値で画面が一瞬ずれるのを防ぐ） */
export function WaitForFlow({ loaded, children }: { loaded: boolean; children: React.ReactNode }) {
  if (!loaded) return <Screen>{null}</Screen>;
  return <>{children}</>;
}

/** 画面上部に少しだけ出るお知らせ */
export function useToast() {
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = useCallback((msg: string) => {
    clearTimeout(timer.current);
    setToast(msg);
    timer.current = setTimeout(() => setToast(""), 2200);
  }, []);
  return { toast, flash };
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="status" className="fixed inset-x-5 top-[calc(env(safe-area-inset-top)+80px)] z-10 mx-auto max-w-[390px] rounded-xl bg-ink px-4 py-3 text-center text-sm font-medium text-bg">
      {message}
    </div>
  );
}
