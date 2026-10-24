import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Zen_Kaku_Gothic_New } from "next/font/google";
import { FlowProvider } from "@/lib/flow";
import "./globals.css";

const noto = Noto_Sans_JP({ variable: "--font-noto", weight: ["400", "500", "700"], preload: false });
const zen = Zen_Kaku_Gothic_New({ variable: "--font-zen", weight: ["700", "900"], preload: false });

export const metadata: Metadata = {
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
    <html lang="ja" className={`${noto.variable} ${zen.variable} h-full antialiased`}>
      <body className="min-h-full">
        <FlowProvider>{children}</FlowProvider>
      </body>
    </html>
  );
}
