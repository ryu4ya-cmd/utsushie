// 「写真から作る」の写真を画面で扱う部分。スマホの写真は大きいので、選んだらすぐ縮めて JPEG にする。
// 動画の縦横比（9:16 か 16:9）に合わせた切り取りは、送る直前に行う（用途を変えても選び直さなくて済むように）。
// 切り取る位置（fx, fy）は 0〜1 で、CSS の object-position と同じ意味。プレビューと送る写真が同じになる。

import type { Plan } from "@/lib/types";

export interface Photo {
  /** 縮めた写真（data URL・JPEG） */
  src: string;
  width: number;
  height: number;
  /** 切り取る位置。0 なら左（上）端、1 なら右（下）端 */
  fx: number;
  fy: number;
}

/** 手元に置いておく写真の長い辺。切り取ってもこれで十分な大きさが残る */
const KEEP_LONG_SIDE = 1600;
/** 送る写真の長い辺（9:16 なら 720×1280） */
const SEND_LONG_SIDE = 1280;
/** サーバーの検査（src/lib/startImage.ts）と同じ */
const MIN_SIDE = 300;

export const ASPECT: Record<Plan["aspect_ratio"], number> = { "9:16": 9 / 16, "16:9": 16 / 9 };

export class PhotoError extends Error {}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 写真の中から切り取る範囲（元の写真のピクセルで） */
export function cropBox(width: number, height: number, aspect: number, fx: number, fy: number) {
  if (width / height > aspect) {
    const w = Math.round(height * aspect);
    return { x: Math.round((width - w) * clamp01(fx)), y: 0, w, h: height };
  }
  const h = Math.round(width / aspect);
  return { x: 0, y: Math.round((height - h) * clamp01(fy)), w: width, h };
}

/** 切り取ったときに短い辺が足りるか */
export function photoProblem(photo: Pick<Photo, "width" | "height">, aspect: number): string | null {
  const box = cropBox(photo.width, photo.height, aspect, 0.5, 0.5);
  return Math.min(box.w, box.h) < MIN_SIDE ? "写真が小さすぎます。もっと大きな写真を選んでください。" : null;
}

/** 縮める倍率（大きくはしない） */
export const shrinkScale = (w: number, h: number, longSide: number) => Math.min(1, longSide / Math.max(w, h));

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new PhotoError("この写真は読み込めませんでした。JPEG か PNG の写真を選んでください。"));
    img.src = src;
  });
}

function draw(img: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, dw: number, dh: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoError("写真を扱えませんでした。別のブラウザでお試しください。");
  // PNG の透明な部分が黒くならないよう、白で塗っておく
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, dw, dh);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/** 選んだ写真を読み込み、縮めて JPEG にする。スマホの写真の向き（EXIF）はブラウザが直してくれる */
export async function readPhoto(file: File): Promise<Photo> {
  if (file.type && !file.type.startsWith("image/")) throw new PhotoError("写真（画像）のファイルを選んでください。");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) throw new PhotoError("この写真は読み込めませんでした。");
    if (Math.min(w, h) < MIN_SIDE) throw new PhotoError(`写真が小さすぎます（短い辺が${MIN_SIDE}ピクセル以上必要です）。`);
    const s = shrinkScale(w, h, KEEP_LONG_SIDE);
    const width = Math.round(w * s);
    const height = Math.round(h * s);
    return { src: draw(img, 0, 0, w, h, width, height), width, height, fx: 0.5, fy: 0.5 };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 動画の縦横比に合わせて切り取り、送る形（data URL・JPEG）にする */
export async function cropPhoto(photo: Photo, aspectRatio: Plan["aspect_ratio"]): Promise<string> {
  const aspect = ASPECT[aspectRatio];
  const problem = photoProblem(photo, aspect);
  if (problem) throw new PhotoError(problem);
  const img = await loadImage(photo.src);
  // 縮めたときと同じ大きさで読めているとは限らないので、比で合わせる
  const k = img.naturalWidth / photo.width;
  const box = cropBox(photo.width, photo.height, aspect, photo.fx, photo.fy);
  const s = shrinkScale(box.w, box.h, SEND_LONG_SIDE);
  return draw(img, box.x * k, box.y * k, box.w * k, box.h * k, Math.round(box.w * s), Math.round(box.h * s));
}
