// 公開しているアドレス。共有ページのカード画像や動画を絶対アドレスにするのに使う。
// Vercel では本番のドメインになる。
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";
