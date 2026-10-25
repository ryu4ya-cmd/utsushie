"use client";

// できた動画の編集（トリミング・文字入れ・BGM）。すべて端末の中で処理する

import { useEffect, useMemo, useRef, useState } from "react";
import { BackHeader, Chip, CtaButton, ErrorBox, Screen, Spinner, Switch, Toast, useToast } from "@/components/ui";
import { BGM_PRESETS, findPreset, renderBgm } from "@/lib/edit/bgm";
import { EditorEngine } from "@/lib/edit/engine";
import {
  clampTrim,
  defaultSpec,
  type EditSpec,
  extensionFor,
  formatSec,
  isEdited,
  MAX_TEXTS,
  newText,
  outputSize,
  TEXT_COLORS,
  TEXT_SIZES,
  type TextItem,
} from "@/lib/edit/spec";
import { getEdit, putEdit, restoreSpec, type SavedEdit } from "@/lib/edit/saved";
import { type HistoryEntry, loadHistory } from "@/lib/history";
import { shareBlob } from "@/lib/share";

type Tab = "trim" | "text" | "bgm";
type Phase =
  | { kind: "edit" }
  | { kind: "export"; ratio: number }
  | { kind: "done"; url: string; blob: Blob; kept: boolean };

const TABS: { id: Tab; label: string }[] = [
  { id: "trim", label: "トリミング" },
  { id: "text", label: "文字" },
  { id: "bgm", label: "BGM" },
];

export default function EditPage() {
  const [entry, setEntry] = useState<HistoryEntry | null | undefined>(undefined);
  const [saved, setSaved] = useState<SavedEdit | null>(null);
  const [back, setBack] = useState("/history");

  useEffect(() => {
    // 端末に保存した履歴は、画面を出したあとでしか読めない
    const q = new URLSearchParams(location.search);
    const editId = q.get("edit");
    void (async () => {
      if (q.get("from") === "done") setBack("/done");
      // 履歴に残した編集を開き直すときは、その設定と元の動画を読む
      const prev = editId ? await getEdit(editId) : null;
      const id = prev?.sourceId ?? q.get("id");
      setSaved(prev);
      setEntry(loadHistory().find((e) => e.id === id) ?? null);
    })();
  }, []);

  if (entry === undefined)
    return (
      <Screen>
        <div className="flex flex-1 items-center justify-center" role="status" aria-label="読み込んでいます">
          <Spinner />
        </div>
      </Screen>
    );
  if (entry === null)
    return (
      <Screen>
        <BackHeader href="/history" label="履歴に戻る" title="動画の編集" />
        <ErrorBox message="編集する動画が見つかりませんでした。履歴から選び直してください。" />
      </Screen>
    );
  return <Editor entry={entry} saved={saved} back={back} />;
}

function Editor({ entry, saved, back }: { entry: HistoryEntry; saved: SavedEdit | null; back: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fontRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<EditorEngine | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [duration, setDuration] = useState(0);
  const [spec, setSpec] = useState<EditSpec | null>(null);
  const specRef = useRef<EditSpec | null>(null);
  const [tab, setTab] = useState<Tab>("trim");
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "edit" });
  const [bgmBusy, setBgmBusy] = useState(false);
  const [bgmFileName, setBgmFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // 端末の音楽を BGM にしたときの元のファイル。編集を履歴に残すときに一緒に残す
  const bgmBlobRef = useRef<Blob | null>(saved?.bgmFile ?? null);
  // この編集を履歴に残すときの ID。書き出し直したら同じところに上書きする
  const keptRef = useRef<{ id: string; createdAt: number } | null>(saved ? { id: saved.id, createdAt: saved.createdAt } : null);
  const { toast, flash } = useToast();
  const cues = entry.subtitles;
  const recorderType = useMemo(() => (typeof window === "undefined" ? null : EditorEngine.recorderType()), []);
  useEffect(() => {
    specRef.current = spec;
  }, [spec]);

  // 動画は一度ファイルとして読み込んでから使う（別のサイトに置いた動画でも、キャンバスに描いて書き出せるように）
  useEffect(() => {
    let url = "";
    let gone = false;
    (async () => {
      try {
        const res = await fetch(entry.videoUrl);
        if (!res.ok) throw new Error(String(res.status));
        url = URL.createObjectURL(await res.blob());
        if (gone) URL.revokeObjectURL(url);
        else setSrc(url);
      } catch {
        if (!gone) setLoadError(true);
      }
    })();
    return () => {
      gone = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [entry.videoUrl]);

  const onMeta = () => {
    const v = videoRef.current!;
    const c = canvasRef.current!;
    const size = outputSize(v.videoWidth, v.videoHeight);
    c.width = size.width;
    c.height = size.height;
    const d = Math.round(v.duration * 10) / 10;
    setDuration(d);
    const first = saved ? restoreSpec(saved.spec, d) : defaultSpec(d);
    specRef.current = first;
    setSpec(first);
    engineRef.current?.dispose();
    const engine = new EditorEngine({
      video: v,
      canvas: c,
      spec: () => specRef.current!,
      cues,
      fontFamily: fontRef.current ? getComputedStyle(fontRef.current).fontFamily : "sans-serif",
      onState: (s) => {
        setPlaying(s.mode !== "idle");
        setNow(s.time);
      },
    });
    engineRef.current = engine;
    if (first.bgm.kind !== "none") void restoreBgm(engine, first.bgm, d);
  };

  // 開き直した編集の BGM を、もう一度鳴らせるように用意する。用意できなければ「なし」に戻す
  const restoreBgm = async (engine: EditorEngine, bgm: EditSpec["bgm"], d: number) => {
    setBgmBusy(true);
    try {
      if (bgm.kind === "preset") {
        const p = findPreset(bgm.id);
        if (!p) throw new Error("preset");
        engine.setBgm(await renderBgm(p, d));
      } else if (bgm.kind === "file") {
        if (!bgmBlobRef.current) throw new Error("file");
        engine.setBgm(await engine.decode(await bgmBlobRef.current.arrayBuffer()));
        setBgmFileName(bgm.name);
      }
    } catch {
      update({ bgm: { kind: "none" } });
      flash("前のBGMを読み込めなかったので「なし」にしました");
    } finally {
      setBgmBusy(false);
    }
  };
  useEffect(() => () => engineRef.current?.dispose(), []);

  // 見出し用の太字フォントは、使う文字だけ後から読み込まれるので、キャンバスに描く前に読み込んでおく
  const allText = spec?.texts.map((t) => t.text).join("") ?? "";
  useEffect(() => {
    if (!allText || !fontRef.current || !document.fonts) return;
    void document.fonts.load(`900 40px ${getComputedStyle(fontRef.current).fontFamily}`, allText).catch(() => {});
  }, [allText]);

  // 終わった動画の URL は片付ける
  const doneUrl = phase.kind === "done" ? phase.url : null;
  useEffect(() => () => void (doneUrl && URL.revokeObjectURL(doneUrl)), [doneUrl]);

  const update = (patch: Partial<EditSpec>) => setSpec((s) => (s ? { ...s, ...patch } : s));
  const updateText = (id: string, patch: Partial<TextItem>) =>
    setSpec((s) => (s ? { ...s, texts: s.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)) } : s));

  const trim = (moved: "start" | "end", value: number) => {
    if (!spec) return;
    const next = clampTrim(moved === "start" ? value : spec.start, moved === "end" ? value : spec.end, duration, moved);
    update(next);
    engineRef.current?.seek(moved === "start" ? next.start : Math.max(next.start, next.end - 0.05));
  };

  const togglePlay = () => {
    const e = engineRef.current;
    if (!e) return;
    if (playing) e.stop();
    else void e.preview().catch(() => flash("再生できませんでした"));
  };

  const chooseBgm = async (choice: EditSpec["bgm"]) => {
    const e = engineRef.current;
    if (!e || !spec) return;
    if (choice.kind === "none") {
      e.setBgm(null);
      update({ bgm: choice });
      return;
    }
    if (choice.kind === "preset") {
      const p = findPreset(choice.id);
      if (!p) return;
      setBgmBusy(true);
      try {
        e.setBgm(await renderBgm(p, duration));
        update({ bgm: choice });
      } catch {
        flash("BGMを作れませんでした");
      } finally {
        setBgmBusy(false);
      }
    }
  };

  const pickFile = async (file: File | undefined) => {
    const e = engineRef.current;
    if (!file || !e) return;
    setBgmBusy(true);
    try {
      e.setBgm(await e.decode(await file.arrayBuffer()));
      bgmBlobRef.current = file;
      setBgmFileName(file.name);
      update({ bgm: { kind: "file", name: file.name } });
    } catch {
      flash("この音楽ファイルは読み込めませんでした");
    } finally {
      setBgmBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const exportVideo = async () => {
    const e = engineRef.current;
    if (!e || !recorderType) return;
    setPhase({ kind: "export", ratio: 0 });
    try {
      const blob = await e.export(recorderType, (ratio) => setPhase({ kind: "export", ratio }));
      const kept = await keep(blob);
      setPhase({ kind: "done", url: URL.createObjectURL(blob), blob, kept });
    } catch {
      setPhase({ kind: "edit" });
      flash("書き出せませんでした。もう一度お試しください");
    }
  };

  // 書き出した動画と設定を、この端末の履歴に残す（サーバーには送らない）
  const keep = async (blob: Blob): Promise<boolean> => {
    const s = specRef.current;
    if (!s) return false;
    const now = Date.now();
    keptRef.current ??= { id: `e${now}`, createdAt: now };
    try {
      await putEdit({
        ...keptRef.current,
        sourceId: entry.id,
        updatedAt: now,
        spec: s,
        video: blob,
        length: Math.round((s.end - s.start) * 10) / 10,
        bgmFile: s.bgm.kind === "file" ? bgmBlobRef.current : null,
      });
      return true;
    } catch {
      return false;
    }
  };

  const ext = recorderType ? extensionFor(recorderType) : "mp4";
  const fileName = `utsushie-edit.${ext}`;
  const send = async () => {
    if (phase.kind !== "done") return;
    try {
      const r = await shareBlob(new File([phase.blob], fileName, { type: phase.blob.type }), entry.title);
      if (r === "unsupported") flash("この端末では動画を直接送れません。保存してから投稿してください");
    } catch {
      flash("共有できませんでした");
    }
  };

  const wide = entry.aspect === "16:9";
  const clipLen = spec ? spec.end - spec.start : 0;
  const busy = phase.kind === "export";
  const edited = spec ? isEdited(spec, duration, cues.length > 0) : false;

  return (
    <Screen wide>
      <BackHeader href={back} label="戻る" title="動画の編集" />
      {/* キャンバスに描く文字のフォントを、画面の CSS から読み取るための見えない印 */}
      <span ref={fontRef} className="hidden font-display" aria-hidden="true" />

      {loadError && <ErrorBox message="動画を読み込めませんでした。通信の状態を確かめて、開き直してください。" />}

      <div className="flex flex-1 flex-col gap-5 lg:grid lg:flex-none lg:grid-cols-[auto_minmax(0,460px)] lg:items-start lg:justify-center lg:gap-12">
        {/* 見本。書き出すものと同じ絵をキャンバスに描く */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-8">
          <div className={`relative self-center overflow-hidden rounded-[18px] bg-surface ${wide ? "w-full lg:w-[560px]" : "w-[236px] lg:w-[320px]"}`}>
            {src && (
              // iPhone では見えない動画は絵を出さないことがあるので、キャンバスの真下に置いておく
              <video
                ref={videoRef}
                src={src}
                onLoadedMetadata={onMeta}
                playsInline
                preload="auto"
                className="absolute inset-0 size-full object-cover"
                aria-hidden="true"
              />
            )}
            <canvas ref={canvasRef} className={`relative block w-full ${wide ? "aspect-video" : "aspect-[9/16]"}`} aria-label="編集した動画の見本" />
            {!spec && !loadError && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted" aria-live="polite">
                動画を読み込んでいます…
              </div>
            )}
            {spec && phase.kind === "edit" && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "止める" : "編集したところを再生"}
                className="absolute inset-0 flex items-center justify-center"
              >
                {!playing && (
                  <span className="flex size-16 items-center justify-center rounded-full bg-bg/70">
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="currentColor" aria-hidden="true">
                      <path d="M8 5l14 8-14 8z" />
                    </svg>
                  </span>
                )}
              </button>
            )}
          </div>
          {spec && (
            <p className="text-center text-xs text-muted" aria-live="off">
              {playing ? `${formatSec(Math.max(0, now - spec.start))} / ` : ""}
              {formatSec(clipLen)}
              {playing ? "" : "・タップで再生"}
            </p>
          )}
        </div>

        {spec && phase.kind !== "done" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="編集すること">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`h-11 rounded-xl border-[1.5px] text-sm font-bold ${
                    tab === t.id ? "border-accent bg-accent text-on-accent" : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <fieldset disabled={busy} className="flex flex-col gap-4">
              {tab === "trim" && (
                <TrimPanel spec={spec} duration={duration} onTrim={trim} />
              )}

              {tab === "text" && (
                <div className="flex flex-col gap-4">
                  {spec.texts.map((t, i) => (
                    <TextEditor
                      key={t.id}
                      index={i}
                      item={t}
                      onChange={(p) => updateText(t.id, p)}
                      onRemove={() => update({ texts: spec.texts.filter((x) => x.id !== t.id) })}
                    />
                  ))}
                  {spec.texts.length < MAX_TEXTS && (
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          texts: [...spec.texts, newText(`t${Date.now()}`, (["top", "bottom", "middle"] as const)[spec.texts.length])],
                        })
                      }
                      className="h-12 rounded-xl border border-dashed border-line-strong text-sm hover:border-accent"
                    >
                      ＋ 文字を入れる{spec.texts.length > 0 ? `（あと${MAX_TEXTS - spec.texts.length}つ）` : ""}
                    </button>
                  )}
                  {cues.length > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-1">
                      <span id="burn-label" className="text-sm">
                        セリフの字幕を動画に入れる
                      </span>
                      <Switch on={spec.burnSubtitles} onClick={() => update({ burnSubtitles: !spec.burnSubtitles })} labelId="burn-label" />
                    </div>
                  )}
                </div>
              )}

              {tab === "bgm" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <BgmChip on={spec.bgm.kind === "none"} onClick={() => chooseBgm({ kind: "none" })} label="なし" note="元の音だけ" />
                    {BGM_PRESETS.map((p) => (
                      <BgmChip
                        key={p.id}
                        on={spec.bgm.kind === "preset" && spec.bgm.id === p.id}
                        onClick={() => chooseBgm({ kind: "preset", id: p.id })}
                        label={p.label}
                        note={p.note}
                      />
                    ))}
                    <BgmChip
                      on={spec.bgm.kind === "file"}
                      onClick={() => fileRef.current?.click()}
                      label="端末の音楽"
                      note={spec.bgm.kind === "file" ? bgmFileName : "ファイルから選ぶ"}
                    />
                  </div>
                  <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
                  {bgmBusy && (
                    <p className="text-xs text-muted" role="status">
                      音を用意しています…
                    </p>
                  )}
                  <p className="text-xs leading-relaxed text-muted">
                    付属のBGMはウツシエのために作った曲で、自由に投稿に使えます。端末の音楽を使うときは、投稿してよい曲かどうかを確かめてください。
                  </p>
                  <Slider
                    label="BGMの大きさ"
                    value={spec.bgmVolume}
                    disabled={spec.bgm.kind === "none"}
                    onChange={(v) => update({ bgmVolume: v })}
                  />
                  <Slider label="元の音（声・効果音）の大きさ" value={spec.originalVolume} onChange={(v) => update({ originalVolume: v })} />
                  <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-1">
                    <span id="fade-label" className="text-sm">
                      BGMを始めと終わりでふわっと
                    </span>
                    <Switch on={spec.fade} onClick={() => update({ fade: !spec.fade })} labelId="fade-label" />
                  </div>
                </div>
              )}
            </fieldset>

            <div className="flex-1 lg:hidden" />
            {!recorderType && (
              <ErrorBox message="このブラウザでは動画の書き出しができません。iPhone の Safari か、PC の Chrome・Edge でお試しください。" />
            )}
            {phase.kind === "export" ? (
              <div className="flex flex-col gap-2" role="status">
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.round(phase.ratio * 100)}%` }} />
                </div>
                <p className="text-center text-xs text-muted">
                  書き出しています… {Math.round(phase.ratio * 100)}%（動画と同じ{Math.ceil(clipLen)}秒ほどかかります。画面を開いたままにしてください）
                </p>
              </div>
            ) : (
              <CtaButton onClick={exportVideo} disabled={!recorderType || !edited || playing || bgmBusy}>
                {edited ? "書き出す" : "編集すると書き出せます"}
              </CtaButton>
            )}
          </div>
        )}

        {phase.kind === "done" && (
          <div className="flex flex-col gap-4">
            <span className="text-[17px] font-bold">書き出しました</span>
            <video src={phase.url} controls playsInline className={`self-center rounded-xl bg-bg ${wide ? "w-full" : "w-[200px]"}`} />
            <a
              href={phase.url}
              download={fileName}
              className="flex h-[54px] items-center justify-center gap-2 rounded-2xl bg-accent text-[17px] font-bold text-on-accent hover:bg-accent-hover"
            >
              {ext === "mp4" ? "MP4で保存" : "WebMで保存"}
            </a>
            <button type="button" onClick={send} className="h-11 rounded-xl border border-line bg-surface text-sm hover:border-accent">
              動画を送る（TikTok・Instagram・YouTube など）
            </button>
            {ext === "webm" && (
              <p className="text-xs leading-relaxed text-muted">このブラウザは MP4 を作れないので WebM で保存します。多くの SNS はそのまま投稿できます。</p>
            )}
            <p className="text-xs leading-relaxed text-muted" role="status">
              {phase.kept
                ? "この端末の「作った動画」に残しました。元の動画の「編集した動画」から、あとで見直したり編集し直したりできます。"
                : "端末の空き容量が足りないなどで、履歴に残せませんでした。忘れずに保存してください。"}
            </p>
            <button
              type="button"
              onClick={() => setPhase({ kind: "edit" })}
              className="flex min-h-11 items-center justify-center text-sm font-bold text-accent hover:text-accent-hover"
            >
              編集に戻る
            </button>
          </div>
        )}
      </div>
      <Toast message={toast} />
    </Screen>
  );
}

function TrimPanel({ spec, duration, onTrim }: { spec: EditSpec; duration: number; onTrim: (moved: "start" | "end", v: number) => void }) {
  const left = (spec.start / duration) * 100;
  const right = (spec.end / duration) * 100;
  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-3 rounded-full bg-line" aria-hidden="true">
        <div className="absolute inset-y-0 rounded-full bg-accent" style={{ left: `${left}%`, width: `${right - left}%` }} />
      </div>
      <TrimSlider label="はじめ" value={spec.start} max={duration} onChange={(v) => onTrim("start", v)} />
      <TrimSlider label="おわり" value={spec.end} max={duration} onChange={(v) => onTrim("end", v)} />
      <p className="text-xs leading-relaxed text-muted">
        元の動画 {formatSec(duration)} のうち、{formatSec(spec.start)}〜{formatSec(spec.end)} の {formatSec(spec.end - spec.start)} を使います。
      </p>
    </div>
  );
}

function TrimSlider({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  const step = (d: number) => onChange(Math.round((value + d) * 10) / 10);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted">{formatSec(value)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => step(-0.1)} aria-label={`${label}を0.1秒前へ`} className="size-11 flex-none rounded-xl border border-line bg-surface hover:border-accent">
          −
        </button>
        <input
          type="range"
          min={0}
          max={max}
          step={0.1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="h-11 flex-1 accent-accent"
        />
        <button type="button" onClick={() => step(0.1)} aria-label={`${label}を0.1秒後へ`} className="size-11 flex-none rounded-xl border border-line bg-surface hover:border-accent">
          ＋
        </button>
      </div>
    </div>
  );
}

function ChipRow<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 flex-none text-xs text-muted">{label}</span>
      <div className="flex flex-1 flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip key={o.id} on={value === o.id} onClick={() => onChange(o.id)} className="h-9 px-3 text-xs">
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function TextEditor({ index, item, onChange, onRemove }: { index: number; item: TextItem; onChange: (p: Partial<TextItem>) => void; onRemove: () => void }) {
  const id = `text-${item.id}`;
  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] bg-surface p-3">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-bold">
          文字 {index + 1}
        </label>
        <button type="button" onClick={onRemove} className="h-9 rounded-lg px-3 text-xs text-muted hover:text-magenta">
          消す
        </button>
      </div>
      <textarea
        id={id}
        value={item.text}
        onChange={(e) => onChange({ text: e.target.value })}
        maxLength={40}
        rows={2}
        placeholder="例：夏の思い出"
        className="resize-none rounded-xl border border-line bg-bg px-3 py-2 text-base leading-relaxed placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <ChipRow
        label="位置"
        value={item.pos}
        onChange={(pos) => onChange({ pos })}
        options={[
          { id: "top", label: "上" },
          { id: "middle", label: "まん中" },
          { id: "bottom", label: "下" },
        ]}
      />
      <ChipRow
        label="大きさ"
        value={item.size}
        onChange={(size) => onChange({ size })}
        options={(Object.keys(TEXT_SIZES) as TextItem["size"][]).map((k) => ({ id: k, label: TEXT_SIZES[k].label }))}
      />
      <ChipRow
        label="色"
        value={item.color}
        onChange={(color) => onChange({ color })}
        options={(Object.keys(TEXT_COLORS) as TextItem["color"][]).map((k) => ({ id: k, label: TEXT_COLORS[k].label }))}
      />
      <ChipRow
        label="見た目"
        value={item.style}
        onChange={(style) => onChange({ style })}
        options={[
          { id: "outline", label: "ふち" },
          { id: "band", label: "帯" },
          { id: "neon", label: "ネオン" },
        ]}
      />
      <ChipRow
        label="出す時間"
        value={item.when}
        onChange={(when) => onChange({ when })}
        options={[
          { id: "all", label: "ずっと" },
          { id: "head", label: "はじめ3秒" },
          { id: "tail", label: "おわり3秒" },
        ]}
      />
    </div>
  );
}

function BgmChip({ on, onClick, label, note }: { on: boolean; onClick: () => void; label: string; note: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex min-h-14 flex-col items-start justify-center rounded-xl border-[1.5px] px-3 py-2 text-left ${
        on ? "border-accent bg-accent text-on-accent" : "border-line bg-surface hover:border-line-strong"
      }`}
    >
      <span className="text-sm font-bold">{label}</span>
      <span className={`max-w-full truncate text-[11px] ${on ? "text-on-accent/80" : "text-muted"}`}>{note}</span>
    </button>
  );
}

function Slider({ label, value, onChange, disabled = false }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${disabled ? "opacity-50" : ""}`}>
      <span className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 accent-accent"
      />
    </label>
  );
}
