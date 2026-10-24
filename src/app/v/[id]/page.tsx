// 共有ページ。SNS で送ったリンクを開いた人が、ログインなしで動画を見られる。
// 練習モードではジョブIDからサンプル動画を割り出す。本番モードでは署名付きのジョブIDから完成動画のアドレス（保存場所に移してあればそちら）を引く。

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrandHeader, CtaLink, Screen } from "@/components/ui";
import { decodeJob, sampleVideo } from "@/lib/jobs";
import { appMode } from "@/lib/mode";
import { SITE_URL } from "@/lib/site";
import { supabaseServer, type SupabaseServer } from "@/lib/supabase/config";
import { liveVideoUrl } from "@/lib/video/live";

type Props = PageProps<"/v/[id]">;

async function load({ params, searchParams }: Props) {
  const { id } = await params;
  const videoUrl = appMode() === "live" ? await liveVideoUrl(id, liveDeps()) : practiceVideoUrl(id);
  if (!videoUrl) return null;
  const t = (await searchParams).t;
  const title = (typeof t === "string" && t.trim().slice(0, 60)) || "ウツシエで作った動画";
  return { title, videoUrl };
}

function liveDeps() {
  let storage: SupabaseServer | null = null;
  try {
    storage = supabaseServer(process.env);
  } catch {
    // 保存場所の設定が足りなければ、動画API側の動画を見せる
  }
  return { env: process.env, fetch, now: Date.now(), storage };
}

function practiceVideoUrl(id: string) {
  const spec = decodeJob(id);
  return spec?.kind === "final" ? sampleVideo(spec) : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const v = await load(props);
  if (!v) return { title: "動画が見つかりません｜ウツシエ" };
  const description = "日本語の一文から、声や効果音まで入った動画を作れるウツシエで作りました。";
  return {
    title: `${v.title}｜ウツシエ`,
    description,
    openGraph: {
      title: v.title,
      description,
      type: "video.other",
      images: [{ url: "/brand/icon-square-512.png", width: 512, height: 512 }],
      videos: [{ url: new URL(v.videoUrl, SITE_URL).toString(), type: "video/mp4" }],
    },
    twitter: { card: "summary", title: v.title, description },
  };
}

async function Video(props: Props) {
  const v = await load(props);
  if (!v) notFound();
  return (
    <>
      <h1 className="font-display text-[24px] leading-snug font-black">{v.title}</h1>
      <div className="relative w-[236px] self-center overflow-hidden rounded-[18px] bg-surface">
        <video src={`${v.videoUrl}#t=0.1`} className="aspect-[9/16] w-full object-cover" controls playsInline preload="metadata" />
        <span className="absolute top-2.5 left-2.5 rounded-md bg-bg px-2 py-0.5 text-[11px] font-bold">AI生成</span>
      </div>
    </>
  );
}

export default function SharedVideoPage(props: Props) {
  return (
    <Screen>
      <BrandHeader />
      <Suspense fallback={<div className="aspect-[9/16] w-[236px] self-center rounded-[18px] bg-surface" />}>
        <Video {...props} />
      </Suspense>
      <p className="text-center text-[13px] leading-relaxed text-muted">
        この動画は、日本語の一文からAIで作りました。
      </p>
      <div className="flex-1" />
      <CtaLink href="/">自分も作ってみる</CtaLink>
    </Screen>
  );
}
