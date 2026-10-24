import type { MetadataRoute } from "next";

// ホーム画面に追加（PWA）するための設定
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ウツシエ",
    short_name: "ウツシエ",
    description: "日本語の一文から、声や効果音まで入った短い動画を作る",
    lang: "ja",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08060f",
    theme_color: "#08060f",
    icons: [
      { src: "/brand/icon-square-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-square-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
