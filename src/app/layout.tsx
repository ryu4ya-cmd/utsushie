import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import { FlowProvider } from "@/lib/flow";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// 本文は端末の日本語フォント（iPhone はヒラギノ、Android は Noto Sans CJK）を使う。
// 日本語のWebフォントは太さ1つで読み込みの指定だけでも数十KBあり、スマホで最初の表示が遅れるため、見出しの太字1つだけにする
const zen = Zen_Kaku_Gothic_New({ variable: "--font-zen", weight: ["900"], preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ウツシエ",
  description: "日本語の一文から、声や効果音まで入った短い動画を作る",
  applicationName: "ウツシエ",
  appleWebApp: { title: "ウツシエ", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#08060f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${zen.variable} h-full antialiased`}>
      <body className="min-h-full">
        <FlowProvider>{children}</FlowProvider>
      </body>
    </html>
  );
}
