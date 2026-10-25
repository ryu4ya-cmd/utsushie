// 1コマ分の絵を描く。画面の見本と書き出しの両方で同じものを使うので、見たとおりに保存される

import type { SubtitleCue } from "@/lib/types";
import { cueAt, type EditSpec, TEXT_COLORS, TEXT_SIZES, textCenterY, textVisible, type TextItem, wrapLines } from "./spec";

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  spec: EditSpec,
  cues: SubtitleCue[],
  fontFamily: string,
) {
  const { width: w, height: h } = ctx.canvas;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  if (video.readyState >= 2) ctx.drawImage(video, 0, 0, w, h);

  const time = video.currentTime;
  const t = time - spec.start;
  const clipLen = spec.end - spec.start;
  for (const item of spec.texts) if (textVisible(item, t, clipLen)) drawText(ctx, item, fontFamily);

  if (spec.burnSubtitles) {
    const line = cueAt(cues, time);
    if (line) drawSubtitle(ctx, line, fontFamily);
  }
}

function drawText(ctx: CanvasRenderingContext2D, item: TextItem, fontFamily: string) {
  const { width: w, height: h } = ctx.canvas;
  const size = Math.round(Math.min(w, h) * TEXT_SIZES[item.size].ratio);
  ctx.font = `900 ${size}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrapLines(item.text, w * 0.88, (s) => ctx.measureText(s).width);
  const lh = size * 1.25;
  const cy = textCenterY(item.pos) * h;
  const top = Math.min(Math.max(cy - (lh * lines.length) / 2, lh * 0.2), h - lh * (lines.length + 0.2));
  const fill = TEXT_COLORS[item.color].fill;

  lines.forEach((line, i) => {
    const y = top + lh * (i + 0.5);
    if (item.style === "band") {
      const bw = ctx.measureText(line).width + size * 0.6;
      ctx.fillStyle = "rgba(8, 6, 15, 0.72)";
      roundRect(ctx, w / 2 - bw / 2, y - lh / 2, bw, lh, size * 0.2);
      ctx.fillStyle = fill;
      ctx.fillText(line, w / 2, y);
    } else if (item.style === "neon") {
      ctx.save();
      ctx.shadowColor = fill;
      ctx.shadowBlur = size * 0.5;
      ctx.fillStyle = fill;
      ctx.fillText(line, w / 2, y);
      ctx.shadowBlur = size * 0.2;
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.85;
      ctx.fillText(line, w / 2, y);
      ctx.restore();
    } else {
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(2, size * 0.16);
      ctx.strokeStyle = "rgba(8, 6, 15, 0.95)";
      ctx.strokeText(line, w / 2, y);
      ctx.fillStyle = fill;
      ctx.fillText(line, w / 2, y);
    }
  });
}

function drawSubtitle(ctx: CanvasRenderingContext2D, text: string, fontFamily: string) {
  const { width: w, height: h } = ctx.canvas;
  const size = Math.round(Math.min(w, h) * 0.05);
  ctx.font = `700 ${size}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = wrapLines(text, w * 0.86, (s) => ctx.measureText(s).width);
  const lh = size * 1.35;
  const bottom = h * 0.93;
  lines.forEach((line, i) => {
    const y = bottom - lh * (lines.length - i - 0.5);
    const bw = ctx.measureText(line).width + size * 0.6;
    ctx.fillStyle = "rgba(8, 6, 15, 0.6)";
    ctx.fillRect(w / 2 - bw / 2, y - lh / 2, bw, lh);
    ctx.fillStyle = "#f2f3f5";
    ctx.fillText(line, w / 2, y);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}
