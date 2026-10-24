// ログイン画面で出す、Supabase のエラーの文言

/**
 * メールを送れなかったときの文言。Supabase の理由（code）を必ず添えて、原因を取り違えないようにする。
 * ・over_email_send_rate_limit … 同じアドレスへは60秒に1通まで（「after N seconds」）、または標準のメール送信の1時間あたりの上限
 * ・over_request_rate_limit … 同じ場所からの問い合わせが多すぎる
 */
export function sendErrorMessage(e: { status?: number; code?: string; message: string }): string {
  const detail = `（${e.code ?? `HTTP ${e.status ?? "?"}`}: ${e.message}）`;
  const wait = /after (\d+) seconds?/i.exec(e.message);
  if (wait) return `同じアドレスへのメールは60秒に1通までです。${wait[1]}秒たってから押してください。${detail}`;
  if (e.code === "over_email_send_rate_limit") {
    return `ウツシエ全体で1時間に送れるメールの数を超えました（Supabase の無料のメール送信の上限）。1時間以内に届いたメールがあれば、その一番新しいメールのリンクは使えます。${detail}`;
  }
  if (e.status === 429) return `問い合わせが多すぎました。少し待ってからお試しください。${detail}`;
  return `メールを送れませんでした${detail}`;
}
