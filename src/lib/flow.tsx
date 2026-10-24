"use client";

// 5画面をまたいで使う入力と結果。ブラウザの localStorage に保存し、タブやホーム画面アプリを閉じても続きから使える。

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Photo } from "@/lib/photo";
import type { Brief, FinalModel, Plan, SubtitleCue } from "@/lib/types";

export interface PlanResult {
  plan: Plan;
  model: FinalModel;
  prompt: string;
  subtitles: SubtitleCue[];
  problems: string[];
}

export interface FlowState {
  brief: Brief;
  planned: PlanResult | null;
  draftIds: string[];
  pick: "a" | "b";
  finalId: string | null;
  /** 写真から作るときの写真（縮めたもの） */
  photo: Photo | null;
}

export const DEFAULT_BRIEF: Brief = {
  sentence_ja: "",
  purpose: "sns_vertical",
  mood: "auto",
  duration_sec: 10,
  sound: true,
  subtitles: true,
  from_image: false,
};

const INITIAL: FlowState = { brief: DEFAULT_BRIEF, planned: null, draftIds: [], pick: "a", finalId: null, photo: null };
const KEY = "utsushie.flow.v1";
/** 前は sessionStorage（タブごと）に保存していた。そちらに残っている続きも読む */
const OLD_SESSION_KEY = KEY;
/** 前は、ログインのメールを開いた新しいタブのためにここへ写していた */
const OLD_RESUME_KEY = "utsushie.flow.resume.v1";

function loadSaved(): string | null {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    // 読めなければ下へ
  }
  try {
    saved ??= sessionStorage.getItem(OLD_SESSION_KEY) ?? localStorage.getItem(OLD_RESUME_KEY);
    localStorage.removeItem(OLD_RESUME_KEY);
  } catch {
    // 読めなければ最初から
  }
  return saved;
}

interface FlowContextValue {
  state: FlowState;
  loaded: boolean;
  update: (patch: Partial<FlowState>) => void;
  setBrief: (patch: Partial<Brief>) => void;
  /** 写真を選ぶ・切り取る位置を変える・外す（null） */
  setPhoto: (photo: Photo | null) => void;
  reset: () => void;
}

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FlowState>(INITIAL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = loadSaved();
      // 保存済みの続きを読み込むのは最初の1回だけ
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setState({ ...INITIAL, ...(JSON.parse(saved) as FlowState) });
    } catch {
      // 読めなければ最初から
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // 保存できなくても画面は動く。写真で保存領域があふれたときは、写真を除いて残す
      try {
        if (state.photo) {
          const brief = { ...state.brief, from_image: false };
          localStorage.setItem(KEY, JSON.stringify({ ...state, photo: null, brief, planned: null, draftIds: [] }));
        }
      } catch {
        // それでも保存できなければあきらめる
      }
    }
  }, [state, loaded]);

  const update = useCallback((patch: Partial<FlowState>) => setState((s) => ({ ...s, ...patch })), []);
  // 入力が変わったら、前の結果は使えないので消す
  const setBrief = useCallback(
    (patch: Partial<Brief>) =>
      setState((s) => ({ ...s, brief: { ...s.brief, ...patch }, planned: null, draftIds: [], finalId: null })),
    [],
  );
  // 最初のコマが変わるので、前の結果は使えない
  const setPhoto = useCallback(
    (photo: Photo | null) =>
      setState((s) => ({
        ...s,
        photo,
        brief: { ...s.brief, from_image: photo !== null },
        planned: null,
        draftIds: [],
        finalId: null,
      })),
    [],
  );
  const reset = useCallback(() => setState(INITIAL), []);

  const value = useMemo(
    () => ({ state, loaded, update, setBrief, setPhoto, reset }),
    [state, loaded, update, setBrief, setPhoto, reset],
  );
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("FlowProvider の中で使ってください");
  return ctx;
}
