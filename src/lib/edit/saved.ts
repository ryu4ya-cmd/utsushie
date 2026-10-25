// 書き出した編集済みの動画と、その編集の設定を、この端末のブラウザ（IndexedDB）に残す。
// 動画そのものも端末の中だけに置くので、サーバーの保存領域（無料枠も含む）は使わない。
// 設定も一緒に残すので、あとから同じ状態で編集し直せる。

import { clampTrim, defaultSpec, type EditSpec, MAX_TEXTS, type TextItem } from "./spec";

export interface SavedEdit {
  id: string;
  sourceId: string; // 元の動画（履歴の HistoryEntry.id）
  createdAt: number; // ミリ秒
  updatedAt: number;
  spec: EditSpec;
  video: Blob; // 書き出した動画
  length: number; // 書き出した動画の秒数
  bgmFile: Blob | null; // 端末の音楽を BGM にしたときの元のファイル（編集し直すときに使う）
}

/** 端末の保存領域を使いすぎないよう、古いものから消す */
export const EDIT_LIMIT = 30;

/** 新しく残したあと、上限を超えたぶんの古いもの（更新が古い順）を返す */
export function overflow(list: Pick<SavedEdit, "id" | "updatedAt">[], limit = EDIT_LIMIT): string[] {
  return [...list]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(limit)
    .map((e) => e.id);
}

const pick = <T extends string>(v: unknown, ok: readonly T[], fallback: T): T => (ok.includes(v as T) ? (v as T) : fallback);
const unit = (v: unknown, fallback: number) => (typeof v === "number" && v >= 0 && v <= 1 ? v : fallback);

/**
 * 残していた設定を、いま読み込んだ動画の長さに合わせて戻す。
 * 古い形や壊れた値が混じっていても、使えるところだけ生かして残りはふつうの値にする
 */
export function restoreSpec(raw: unknown, duration: number): EditSpec {
  const base = defaultSpec(duration);
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<EditSpec>;
  const start = typeof s.start === "number" ? s.start : 0;
  const end = typeof s.end === "number" ? s.end : duration;
  const trim = clampTrim(start, Math.min(end, duration), duration, "end");
  const texts: TextItem[] = (Array.isArray(s.texts) ? s.texts : [])
    .filter((t): t is TextItem => !!t && typeof t.id === "string" && typeof t.text === "string")
    .slice(0, MAX_TEXTS)
    .map((t) => ({
      id: t.id,
      text: t.text.slice(0, 40),
      pos: pick(t.pos, ["top", "middle", "bottom"], "top"),
      size: pick(t.size, ["s", "m", "l"], "m"),
      color: pick(t.color, ["white", "yellow", "cyan", "pink"], "white"),
      style: pick(t.style, ["outline", "band", "neon"], "outline"),
      when: pick(t.when, ["all", "head", "tail"], "all"),
    }));
  const b = s.bgm as EditSpec["bgm"] | undefined;
  const bgm: EditSpec["bgm"] =
    b?.kind === "preset" && typeof b.id === "string"
      ? { kind: "preset", id: b.id }
      : b?.kind === "file" && typeof b.name === "string"
        ? { kind: "file", name: b.name }
        : { kind: "none" };
  return {
    ...trim,
    texts,
    burnSubtitles: typeof s.burnSubtitles === "boolean" ? s.burnSubtitles : base.burnSubtitles,
    bgm,
    bgmVolume: unit(s.bgmVolume, base.bgmVolume),
    originalVolume: unit(s.originalVolume, base.originalVolume),
    fade: typeof s.fade === "boolean" ? s.fade : base.fade,
  };
}

// ここから下はブラウザの中だけで動く

const DB_NAME = "utsushie";
const STORE = "edits";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("sourceId", "sourceId");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** 残してあるものすべて（新しい順）。読めない端末では空 */
export async function listEdits(): Promise<SavedEdit[]> {
  try {
    const all = (await run<SavedEdit[]>("readonly", (s) => s.getAll())) ?? [];
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function getEdit(id: string): Promise<SavedEdit | null> {
  try {
    return (await run<SavedEdit>("readonly", (s) => s.get(id))) ?? null;
  } catch {
    return null;
  }
}

/** 残す（同じ ID があれば上書き）。上限を超えたら古いものを消す。失敗したら投げる（空き容量が足りないなど） */
export async function putEdit(edit: SavedEdit): Promise<void> {
  await run("readwrite", (s) => void s.put(edit));
  // 端末の都合で勝手に消されにくくする（できない端末では何もしない）
  void navigator.storage?.persist?.().catch(() => {});
  const all = await listEdits();
  const old = overflow(all);
  if (old.length) await run("readwrite", (s) => old.forEach((id) => s.delete(id)));
}

export async function deleteEdit(id: string): Promise<void> {
  try {
    await run("readwrite", (s) => void s.delete(id));
  } catch {
    // 消せなくても画面は動く
  }
}

/** 元の動画を履歴から消したときに、その編集もまとめて消す */
export async function deleteEditsOf(sourceId: string): Promise<void> {
  const ids = (await listEdits()).filter((e) => e.sourceId === sourceId).map((e) => e.id);
  if (!ids.length) return;
  try {
    await run("readwrite", (s) => ids.forEach((id) => s.delete(id)));
  } catch {
    // 消せなくても画面は動く
  }
}
