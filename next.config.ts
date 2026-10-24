import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画面に出す版の番号。Vercel ではビルドしたコミットの先頭7文字になる
  env: { NEXT_PUBLIC_APP_VERSION: (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7) },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
