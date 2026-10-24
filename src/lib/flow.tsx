"use client";

// 5画面をまたいで使う入力と結果。ブラウザの sessionStorage に保存し、再読み込みしても続きから使える。

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
/**
 * ログインのメールのリンクは新しいタブで開くことがあり、sessionStorage はタブごとに別なので、
 * ログイン画面がメールを送る前に、続きをこちら（localStorage）にも写しておく。読んだら消す。
 */
const RESUME_KEY = "utsushie.flow.resume.v1";

/** ログインのあと、新しいタブでも入力の続きから使えるようにする */
export function keepFlowForLogin() {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) localStorage.setItem(RESUME_KEY, saved);
  } catch {
    // 写せなければ、ログインのあとに入力し直す
  }
}

function takeResume(): string | null {
  try {
    const saved = localStorage.getItem(RESUME_KEY);
    localStorage.removeItem(RESUME_KEY);
    return saved;
  } catch {
    return null;
  }
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
      const saved = sessionStorage.getItem(KEY) ?? takeResume();
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
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // 保存できなくても画面は動く
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
