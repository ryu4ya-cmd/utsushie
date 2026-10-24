"use client";

// 「写真から作る」の写真選び。スマホではカメラロール（写真ライブラリ）かカメラから選べる。
// PC ではファイルを選ぶほか、写真をこの画面のどこかへドラッグ&ドロップしてもよい。
// 選んだ写真は動画の縦横比の枠に入れて見せ、ドラッグ（キーボードなら矢印キー）で切り取る位置を合わせる。

import { useEffect, useRef, useState } from "react";
import { ASPECT, photoProblem, readPhoto, type Photo } from "@/lib/photo";
import type { Plan } from "@/lib/types";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function PhotoPicker({
  photo,
  aspectRatio,
  onChange,
}: {
  photo: Photo | null;
  aspectRatio: Plan["aspect_ratio"];
  onChange: (photo: Photo | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<Pick<Photo, "fx" | "fy"> | null>(null); // ドラッグ中の位置（離したら保存する）
  const [dropping, setDropping] = useState(false); // PC で写真のファイルを画面の上に持ってきているあいだ
  const aspect = ASPECT[aspectRatio];
  const vertical = aspectRatio === "9:16";

  const choose = () => input.current?.click();

  const load = async (file: File) => {
    setReading(true);
    setError(null);
    try {
      const p = await readPhoto(file);
      const problem = photoProblem(p, aspect);
      if (problem) throw new Error(problem);
      onChange(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "写真を読み込めませんでした");
    } finally {
      setReading(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じ写真をもう一度選んでも反応するように
    if (file) void load(file);
  };

  // 画面のどこに落としても受け取る（ブラウザの既定では、落とした写真のページへ移ってしまい、入力が消える）
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    const hasFile = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    let depth = 0; // 子の要素に出入りするたびに enter/leave が来るので、数えて画面の外へ出たときだけ消す
    const onEnter = (e: DragEvent) => {
      if (!hasFile(e)) return;
      depth++;
      setDropping(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFile(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDropping(false);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFile(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFile(e)) return;
      e.preventDefault();
      depth = 0;
      setDropping(false);
      const file = e.dataTransfer?.files[0];
      if (file) void loadRef.current(file);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  // 写真が枠からはみ出している長さ（画面のピクセル）。はみ出した方向にだけ動かせる
  const overflow = () => {
    const el = frame.current;
    if (!el || !photo) return { x: 0, y: 0 };
    const { width, height } = el.getBoundingClientRect();
    const scale = Math.max(width / photo.width, height / photo.height);
    return { x: photo.width * scale - width, y: photo.height * scale - height };
  };

  const pos = live ?? photo;

  const onPointerDown = (e: React.PointerEvent) => {
    if (!photo) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, fx: photo.fx, fy: photo.fy };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const o = overflow();
    // 指を右へ動かすと写真も右へ動く＝左側が見える
    setLive({
      fx: o.x > 0 ? clamp01(d.fx - (e.clientX - d.x) / o.x) : d.fx,
      fy: o.y > 0 ? clamp01(d.fy - (e.clientY - d.y) / o.y) : d.fy,
    });
  };
  const onPointerUp = () => {
    drag.current = null;
    if (photo && live) onChange({ ...photo, ...live });
    setLive(null);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!photo) return;
    const step = 0.05;
    const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = move[e.key];
    if (!m) return;
    e.preventDefault();
    onChange({ ...photo, fx: clamp01(photo.fx + m[0]), fy: clamp01(photo.fy + m[1]) });
  };

  const fileInput = (
    <input ref={input} type="file" accept="image/*" className="hidden" onChange={onFile} aria-label="写真を選ぶ" />
  );

  if (!photo) {
    return (
      <div className="flex flex-col gap-1.5">
        {fileInput}
        <button
          type="button"
          onClick={choose}
          disabled={reading}
          className={`flex min-h-[72px] items-center gap-3.5 rounded-2xl border-[1.5px] border-dashed bg-surface px-4 py-3 text-left hover:border-accent disabled:opacity-60 lg:min-h-[120px] lg:px-6 ${
            dropping ? "border-accent bg-surface-2" : "border-line-strong"
          }`}
        >
          <svg className="flex-none" width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="6" width="24" height="19" rx="3" />
            <circle cx="11" cy="13" r="2.5" />
            <path d="M27 21l-7-7-11 11" />
          </svg>
          <span className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold">
              {reading ? "写真を読み込んでいます…" : dropping ? "ここに写真を落とす" : "写真から作る（なくてもOK）"}
            </span>
            <span className="text-xs leading-relaxed text-muted">
              写真を選ぶと、その写真がそのまま動き出します
              {/* マウスで使う PC にだけ出す */}
              <span className="hidden pointer-fine:inline">。写真のファイルをここへドラッグ&ドロップしても選べます</span>
            </span>
          </span>
        </button>
        {error && <p role="alert" className="text-xs text-magenta">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {fileInput}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">最初のコマにする写真</span>
        <span className="text-xs text-muted">{aspectRatio}・{vertical ? "縦" : "横"}に切り取り</span>
      </div>
      <div className={`flex gap-3 ${vertical ? "items-end" : "flex-col"}`}>
        <div
          ref={frame}
          role="slider"
          tabIndex={0}
          aria-label="写真の切り取る位置。ドラッグか矢印キーで動かす"
          aria-valuetext={`横${Math.round((pos?.fx ?? 0.5) * 100)}%・縦${Math.round((pos?.fy ?? 0.5) * 100)}%`}
          aria-valuenow={Math.round((vertical ? pos?.fx ?? 0.5 : pos?.fy ?? 0.5) * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          className={`relative flex-none cursor-grab touch-none overflow-hidden rounded-xl bg-bg outline-offset-2 select-none focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing ${
            vertical ? "w-[132px] lg:w-[200px]" : "w-full lg:max-w-[560px]"
          } ${dropping ? "ring-2 ring-accent" : ""}`}
          style={{ aspectRatio: String(aspect) }}
        >
          {/* data URL の写真なので next/image は使わない */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt="選んだ写真"
            draggable={false}
            className="pointer-events-none size-full object-cover"
            style={{ objectPosition: `${(pos?.fx ?? 0.5) * 100}% ${(pos?.fy ?? 0.5) * 100}%` }}
          />
          <span className="absolute bottom-1.5 left-1.5 rounded-md bg-bg/80 px-1.5 py-0.5 text-[10px]">ドラッグで位置合わせ</span>
        </div>
        <div className={`flex gap-2 ${vertical ? "flex-1 flex-col lg:max-w-[280px]" : ""}`}>
          <p className={`text-xs leading-relaxed text-muted ${vertical ? "" : "hidden"}`}>
            写っている人や物、構図はそのままに、下に書いた動きを付けます。
            <span className="hidden pointer-fine:inline">別の写真をドラッグ&ドロップすると入れ替わります。</span>
          </p>
          <button
            type="button"
            onClick={choose}
            disabled={reading}
            className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line px-3 text-[13px] hover:border-accent disabled:opacity-60"
          >
            {reading ? "読み込み中…" : "写真を変える"}
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-line px-3 text-[13px] text-muted hover:border-accent hover:text-ink"
          >
            写真を外す
          </button>
        </div>
      </div>
      {error && <p role="alert" className="text-xs text-magenta">{error}</p>}
    </div>
  );
}
