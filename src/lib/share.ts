// SNS への共有。動画ファイルそのものを送る（端末の共有画面）か、共有ページ /v/:id のリンクを送る。

export type LinkTarget = "x" | "line" | "facebook";

/** 共有ページのアドレス。題名は SNS のカードに出すためにだけ付ける */
export function sharePageUrl(origin: string, id: string, title?: string): string {
  const url = new URL(`/v/${id}`, origin);
  if (title) url.searchParams.set("t", title.slice(0, 60));
  return url.toString();
}

/** 各 SNS の「投稿画面を開く」アドレス。ログインや API キーは要らない */
export function shareIntentUrl(target: LinkTarget, pageUrl: string, text: string): string {
  const u = encodeURIComponent(pageUrl);
  const t = encodeURIComponent(text);
  switch (target) {
    case "x":
      return `https://x.com/intent/post?text=${t}&url=${u}`;
    case "line":
      return `https://social-plugins.line.me/lineit/share?url=${u}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  }
}

export const LINK_TARGETS: { id: LinkTarget; label: string }[] = [
  { id: "x", label: "X" },
  { id: "line", label: "LINE" },
  { id: "facebook", label: "Facebook" },
];

/** 動画ファイルを端末の共有画面で送る（TikTok・Instagram・YouTube へはこれで渡す） */
export async function shareVideoFile(videoUrl: string, title: string): Promise<"shared" | "cancelled" | "unsupported"> {
  const blob = await (await fetch(videoUrl)).blob();
  const file = new File([blob], "utsushie.mp4", { type: "video/mp4" });
  if (!navigator.canShare?.({ files: [file] })) return "unsupported";
  try {
    await navigator.share({ files: [file], title });
    return "shared";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    throw e;
  }
}
