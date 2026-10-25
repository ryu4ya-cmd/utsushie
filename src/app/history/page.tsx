"use client";

// 作った動画の履歴（この端末に保存したもの）

import Link from "next/link";
import { useEffect, useState } from "react";
import { SharePanel } from "@/components/SharePanel";
import { BackHeader, CtaLink, Screen, Toast, useToast } from "@/components/ui";
import { deleteEdit, deleteEditsOf, listEdits, type SavedEdit } from "@/lib/edit/saved";
import { extensionFor } from "@/lib/edit/spec";
import { type HistoryEntry, loadHistory, removeEntry, saveHistory } from "@/lib/history";
import { MODEL_LABEL } from "@/lib/models";
import { shareBlob } from "@/lib/share";

/** 履歴の画面で見せる編集。端末の中の動画を、画面で再生できる URL にしておく */
type EditView = SavedEdit & { url: string };

const dateFormat = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export default function HistoryPage() {
  const [list, setList] = useState<HistoryEntry[] | null>(null);
  const [edits, setEdits] = useState<EditView[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const { toast, flash } = useToast();

  useEffect(() => {
    // 端末に保存した履歴は、画面を出したあとでしか読めない
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setList(loadHistory());
    let views: EditView[] = [];
    let gone = false;
    void listEdits().then((all) => {
      if (gone) return;
      views = all.map((e) => ({ ...e, url: URL.createObjectURL(e.video) }));
      setEdits(views);
    });
    return () => {
      gone = true;
      views.forEach((v) => URL.revokeObjectURL(v.url));
    };
  }, []);

  const remove = (id: string) => {
    const n = edits.filter((e) => e.sourceId === id).length;
    if (!confirm(n ? `この動画と、編集した動画${n}本を履歴から消しますか？` : "この動画を履歴から消しますか？")) return;
    setList((l) => {
      const next = removeEntry(l ?? [], id);
      saveHistory(next);
      return next;
    });
    setEdits((all) => all.filter((e) => e.sourceId !== id));
    void deleteEditsOf(id);
  };

  const removeEdit = (id: string) => {
    if (!confirm("この編集した動画を消しますか？")) return;
    setEdits((all) => all.filter((e) => e.id !== id));
    void deleteEdit(id);
  };

  return (
    <Screen wide>
      <BackHeader href="/" label="ホームに戻る" title="作った動画" />
      {list && (
        <p className="-mt-3 text-xs leading-relaxed text-muted">
          この端末のブラウザに保存しています（最大50本）。別の端末やブラウザでは見えません。
        </p>
      )}

      {list?.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[14px] bg-surface px-4 py-10 text-center">
          <span className="text-[15px] font-bold">まだ動画がありません</span>
          <span className="text-[13px] text-muted">作った動画は、ここに自動で残ります。</span>
        </div>
      )}

      <ul className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-4">
        {list?.map((e) => {
          const open = openId === e.id;
          const mine = edits.filter((x) => x.sourceId === e.id);
          return (
            <li key={e.id} className="flex flex-col gap-3 rounded-[18px] bg-surface p-3">
              <div className="flex gap-3">
                <video
                  src={`${e.videoUrl}#t=0.1`}
                  className={`flex-none rounded-xl bg-bg object-cover ${e.aspect === "16:9" ? "aspect-video w-[132px]" : "aspect-[9/16] w-[84px]"}`}
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[15px] font-bold">{e.title}</span>
                  <span className="line-clamp-2 text-[13px] leading-relaxed text-muted">{e.sentence}</span>
                  <span className="text-[11px] text-muted">
                    {dateFormat.format(e.createdAt)}・{e.duration}秒・{MODEL_LABEL[e.model]}
                  </span>
                  {mine.length > 0 && <span className="text-[11px] font-bold text-accent">編集した動画 {mine.length}本</span>}
                  <div className="mt-auto flex gap-2 pt-1">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : e.id)}
                      className="h-9 flex-1 rounded-lg border border-line text-xs hover:border-accent"
                    >
                      {open ? "閉じる" : "再生・共有"}
                    </button>
                    <a href={e.videoUrl} download="utsushie.mp4" className="flex h-9 flex-1 items-center justify-center rounded-lg border border-line text-xs hover:border-accent">
                      保存
                    </a>
                    <button type="button" onClick={() => remove(e.id)} className="h-9 rounded-lg border border-line px-3 text-xs text-muted hover:border-magenta">
                      削除
                    </button>
                  </div>
                </div>
              </div>
              {open && (
                <>
                  <video
                    src={`${e.videoUrl}#t=0.1`}
                    className={`self-center rounded-xl bg-bg object-cover ${e.aspect === "16:9" ? "aspect-video w-full" : "aspect-[9/16] w-[236px]"}`}
                    controls
                    playsInline
                    preload="metadata"
                  />
                  <Link
                    href={`/edit?id=${encodeURIComponent(e.id)}`}
                    className="flex h-11 items-center justify-center rounded-xl border-[1.5px] border-accent text-sm font-bold text-accent hover:bg-accent hover:text-on-accent"
                  >
                    編集する（文字・BGM・トリミング）
                  </Link>
                  <SharePanel id={e.id} title={e.title} videoUrl={e.videoUrl} flash={flash} />
                  {mine.length > 0 && (
                    <section className="flex flex-col gap-2" aria-label="編集した動画">
                      <span className="text-sm font-bold">編集した動画</span>
                      {mine.map((x) => (
                        <EditRow key={x.id} edit={x} entry={e} flash={flash} onRemove={() => removeEdit(x.id)} />
                      ))}
                    </section>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex-1" />
      <div className="flex flex-col lg:mx-auto lg:w-[380px]">
        <CtaLink href="/">新しく作る</CtaLink>
      </div>
      <Toast message={toast} />
    </Screen>
  );
}

function EditRow({ edit, entry, flash, onRemove }: { edit: EditView; entry: HistoryEntry; flash: (m: string) => void; onRemove: () => void }) {
  const [play, setPlay] = useState(false);
  const ext = extensionFor(edit.video.type);
  const fileName = `utsushie-edit.${ext}`;
  const wide = entry.aspect === "16:9";
  const labels = [
    edit.spec.texts.some((t) => t.text.trim()) && "文字",
    edit.spec.bgm.kind !== "none" && "BGM",
    (edit.spec.start > 0 || edit.length < entry.duration) && "トリミング",
  ].filter(Boolean);
  const send = async () => {
    try {
      const r = await shareBlob(new File([edit.video], fileName, { type: edit.video.type }), entry.title);
      if (r === "unsupported") flash("この端末では動画を直接送れません。保存してから投稿してください");
    } catch {
      flash("共有できませんでした");
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line p-2">
      <div className="flex gap-3">
        <video
          src={`${edit.url}#t=0.1`}
          className={`flex-none rounded-lg bg-bg object-cover ${wide ? "aspect-video w-[104px]" : "aspect-[9/16] w-[60px]"}`}
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[11px] text-muted">
            {dateFormat.format(edit.updatedAt)}・{edit.length}秒{labels.length ? `・${labels.join("・")}` : ""}
          </span>
          <div className="mt-auto grid grid-cols-2 gap-1.5">
            <button type="button" aria-expanded={play} onClick={() => setPlay(!play)} className="h-9 rounded-lg border border-line text-xs hover:border-accent">
              {play ? "閉じる" : "見る"}
            </button>
            <Link
              href={`/edit?edit=${encodeURIComponent(edit.id)}`}
              className="flex h-9 items-center justify-center rounded-lg border border-accent text-xs font-bold text-accent hover:bg-accent hover:text-on-accent"
            >
              編集し直す
            </Link>
            <a href={edit.url} download={fileName} className="flex h-9 items-center justify-center rounded-lg border border-line text-xs hover:border-accent">
              {ext === "mp4" ? "MP4で保存" : "WebMで保存"}
            </a>
            <button type="button" onClick={send} className="h-9 rounded-lg border border-line text-xs hover:border-accent">
              送る
            </button>
          </div>
        </div>
      </div>
      {play && (
        <video
          src={edit.url}
          className={`self-center rounded-lg bg-bg ${wide ? "w-full" : "w-[200px]"}`}
          controls
          autoPlay
          playsInline
        />
      )}
      <button type="button" onClick={onRemove} className="h-8 self-end rounded-lg px-3 text-xs text-muted hover:text-magenta">
        この編集を消す
      </button>
    </div>
  );
}
