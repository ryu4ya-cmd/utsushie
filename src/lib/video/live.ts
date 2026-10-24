// 本番モードの生成ジョブ。写真から作るときとセリフあり → Kling 3.0、それ以外 → Veo 3.1 に頼む。
// UTSUSHIE_VIDEO=free のときは、すべて無料の CogVideoX-Flash に頼む（お金はかからない）。
// 練習モードと同じくサーバーに状態を持たず、動画APIのタスクIDなどをジョブIDに入れておく。
// ジョブIDには署名を付け、作り替えたIDで勝手に生成（課金）を始められないようにする。
// 完成した動画は、Supabase の保存場所があればそこへ移す（動画API側の動画はいずれ消えるため）。

import { createHmac, timingSafeEqual } from "node:crypto";
import { chooseFinalModel, cogvideo } from "@/lib/models";
import type { SupabaseServer } from "@/lib/supabase/config";
import { hasStoredVideo, putStoredVideo, storedVideoUrl } from "@/lib/supabase/server";
import { kling, veo } from "@/lib/plan/build";
import type { StartImage } from "@/lib/startImage";
import type { Duration, FinalModel, JobKind, JobStatus, Plan } from "@/lib/types";
import { downloadCogVideo, pollCogVideo, submitCogVideo, type CogVideoConfig } from "@/lib/video/cogvideo";
import { downloadKling, pollKling, submitKling, type KlingConfig } from "@/lib/video/kling";
import { ProviderError, type FetchLike, type VideoRequest } from "@/lib/video/types";
import { downloadVeo, pollVeo, submitVeo, type VeoConfig } from "@/lib/video/veo";

export type Env = Record<string, string | undefined>;

export interface LiveDeps {
  env: Env;
  fetch: FetchLike;
  now: number; // ミリ秒
  /** 完成動画の保存場所。なければ動画API側に置いたまま、サーバー経由で返す */
  storage?: SupabaseServer | null;
}

/** 設定が足りないときのエラー。動画APIは呼ばずに止める */
export class ConfigError extends Error {}

/** 画面から届いた設計図がおかしいときのエラー */
export class BadPlanError extends Error {}

export interface LiveJob {
  kind: JobKind;
  variant: "a" | "b" | null;
  duration: Duration;
  model: FinalModel;
  aspect: Plan["aspect_ratio"];
  sound: boolean;
  task: string; // Kling のタスクID か Veo の操作名
  step: number; // Veo の延長で何本目か（1から）
  steps: number;
  next: string | null; // Veo の延長に使う、続きの指示文
  startedAt: number; // この step を始めた時刻（ミリ秒）
  owner?: string | null; // 頼んだ人（Supabase のユーザーID）。保存場所でのフォルダ名になる
  source?: "image"; // 写真から作ったとき（Kling の問い合わせ先が変わる）。写真そのものはIDに入れない
}

/** 本番モードで進み具合を問い合わせる間隔。動画APIに負担をかけないよう練習モードより長い */
export const LIVE_POLL_MS = 5000;

// 進み具合の目安（秒）。動画APIは途中の進み具合を返さないので、経過時間から見積もる
const EXPECTED_SEC: Record<FinalModel, Record<JobKind, number>> = {
  "kling-3.0": { draft: 120, final: 300 },
  "veo-3.1": { draft: 60, final: 120 },
  "cogvideox-flash": { draft: 60, final: 120 },
};

const VARIANT_HINT = {
  a: "Camera emphasis for this version: closer framing, intimate close-ups.",
  b: "Camera emphasis for this version: wider framing, establishing composition.",
};

// ---- 設定 ----

function secret(env: Env): string {
  const s = env.UTSUSHIE_JOB_SECRET ?? "";
  if (s.length < 32) throw new ConfigError("UTSUSHIE_JOB_SECRET（32文字以上のランダムな文字列）を設定してください。");
  return s;
}

export function klingConfig(env: Env): KlingConfig {
  if (!env.KLING_ACCESS_KEY || !env.KLING_SECRET_KEY) {
    throw new ConfigError("Kling を使うには KLING_ACCESS_KEY と KLING_SECRET_KEY を設定してください。");
  }
  return {
    accessKey: env.KLING_ACCESS_KEY,
    secretKey: env.KLING_SECRET_KEY,
    apiBase: env.KLING_API_BASE || "https://api-singapore.klingai.com",
    model: env.KLING_MODEL || "kling-v3",
  };
}

export function veoConfig(env: Env): VeoConfig {
  if (!env.GEMINI_API_KEY) throw new ConfigError("Veo を使うには GEMINI_API_KEY を設定してください。");
  return {
    apiKey: env.GEMINI_API_KEY,
    apiBase: env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta",
    model: env.VEO_MODEL || "veo-3.1-generate-preview",
    draftModel: env.VEO_DRAFT_MODEL || "veo-3.1-fast-generate-preview",
  };
}

export function cogvideoConfig(env: Env): CogVideoConfig {
  if (!env.ZHIPU_API_KEY) throw new ConfigError("CogVideoX-Flash を使うには ZHIPU_API_KEY（智谱 BigModel の APIキー）を設定してください。");
  return {
    apiKey: env.ZHIPU_API_KEY,
    apiBase: env.ZHIPU_API_BASE || "https://open.bigmodel.cn/api/paas/v4",
    model: env.COGVIDEO_MODEL || "cogvideox-flash",
  };
}

// ---- ジョブID（署名付き） ----

const sign = (body: string, key: string) => createHmac("sha256", key).update(body).digest("base64url");

export function encodeLiveJob(job: LiveJob, env: Env): string {
  const body = Buffer.from(JSON.stringify(job)).toString("base64url");
  return `${body}.${sign(body, secret(env))}`;
}

export function decodeLiveJob(id: string, env: Env): LiveJob | null {
  const [body, sig, extra] = id.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const want = Buffer.from(sign(body, secret(env)));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as LiveJob;
  } catch {
    return null;
  }
}

// ---- 設計図の受け取り ----

/** 画面から届いた設計図を確かめる。指示文が組み立てられなければエラー */
export function parsePlan(input: unknown, duration: Duration): Plan {
  const p = input as Plan | null;
  if (!p || typeof p !== "object" || !Array.isArray(p.shots) || !p.shots.length || !Array.isArray(p.characters)) {
    throw new BadPlanError("設計図がありません。最初からやり直してください。");
  }
  if (p.aspect_ratio !== "9:16" && p.aspect_ratio !== "16:9") throw new BadPlanError("縦横比が正しくありません");
  if (p.duration_sec !== duration) throw new BadPlanError("設計図と長さが合っていません");
  try {
    kling(p);
    veo(p);
  } catch {
    throw new BadPlanError("設計図から指示文を作れませんでした。最初からやり直してください。");
  }
  return p;
}

// ---- 生成を始める ----

export interface StartInput {
  kind: JobKind;
  duration: Duration;
  plan: Plan;
  sound: boolean;
  owner?: string | null;
  /** 写真から作るときの最初のコマ。画面で縦横比に合わせて切り取ってある */
  image?: StartImage | null;
}

/** 動画APIを呼ぶ前に、設定がそろっているか確かめる（回数を使ってから設定不足で止まらないように） */
export function checkLiveConfig(plan: Plan, env: Env, fromImage = false): void {
  secret(env);
  const model = chooseFinalModel(plan, fromImage, env);
  if (model === "kling-3.0") klingConfig(env);
  else if (model === "cogvideox-flash") cogvideoConfig(env);
  else veoConfig(env);
}

/** 下書きなら2本、本番なら1本を頼み、ジョブIDを返す */
export async function startLive(input: StartInput, deps: LiveDeps): Promise<string[]> {
  secret(deps.env); // 頼んだあとでIDを作れない、ということがないよう先に確かめる
  const image = input.image ?? null;
  const model = chooseFinalModel(input.plan, image !== null, deps.env);
  const variants = input.kind === "draft" ? (["a", "b"] as const) : [null];
  return Promise.all(
    variants.map(async (variant) => {
      const segments =
        model === "kling-3.0" ? [kling(input.plan)] : model === "cogvideox-flash" ? [cogvideo(input.plan)] : veo(input.plan).map((s) => s.text);
      // 下書きは安く済ませるため、Veo でも延長しない
      const parts = input.kind === "draft" ? segments.slice(0, 1) : segments;
      const prompt = variant ? `${parts[0]}\n${VARIANT_HINT[variant]}` : parts[0];
      const job: Omit<LiveJob, "task"> = {
        kind: input.kind,
        variant,
        duration: input.duration,
        model,
        aspect: input.plan.aspect_ratio,
        sound: input.sound,
        step: 1,
        steps: parts.length,
        next: parts[1] ?? null,
        startedAt: deps.now,
        owner: input.owner ?? null,
        ...(image ? { source: "image" as const } : {}),
      };
      const task = await submit(job, prompt, deps, undefined, image?.base64);
      return encodeLiveJob({ ...job, task }, deps.env);
    }),
  );
}

function request(job: Omit<LiveJob, "task">, prompt: string, image?: string): VideoRequest {
  return { prompt, aspectRatio: job.aspect, durationSec: job.duration, quality: job.kind, sound: job.sound, ...(image ? { image } : {}) };
}

function submit(job: Omit<LiveJob, "task">, prompt: string, deps: LiveDeps, extendFrom?: string, image?: string) {
  if (job.model === "kling-3.0") return submitKling(klingConfig(deps.env), request(job, prompt, image), deps.fetch);
  if (job.model === "cogvideox-flash") return submitCogVideo(cogvideoConfig(deps.env), request(job, prompt, image), deps.fetch);
  return submitVeo(veoConfig(deps.env), request(job, prompt), deps.fetch, extendFrom);
}

function poll(job: LiveJob, deps: LiveDeps) {
  if (job.model === "kling-3.0") return pollKling(klingConfig(deps.env), job.task, deps.fetch, job.source === "image" ? "image" : "text");
  if (job.model === "cogvideox-flash") return pollCogVideo(cogvideoConfig(deps.env), job.task, deps.fetch);
  return pollVeo(veoConfig(deps.env), job.task, deps.fetch);
}

// ---- 進み具合 ----

/**
 * 進み具合を問い合わせる。Veo の1本目ができて延長が要るときは、ここで延長を頼み、
 * 新しいジョブIDを返す（画面はそのIDで問い合わせを続ける）。
 */
export async function liveStatus(id: string, deps: LiveDeps): Promise<JobStatus | null> {
  const job = decodeLiveJob(id, deps.env);
  if (!job) return null;
  const st = await poll(job, deps);
  if (st.state === "failed") throw new ProviderError(st.message);

  if (st.state === "done" && job.next) {
    const nextJob = { ...job, step: job.step + 1, next: null, startedAt: deps.now };
    const task = await submit(nextJob, job.next, deps, st.videoRef);
    const nextId = encodeLiveJob({ ...nextJob, task }, deps.env);
    return status(nextId, { ...nextJob, task }, null, deps.now);
  }
  if (st.state !== "done") return status(id, job, null, deps.now);
  const videoUrl = job.kind === "final" ? await keepVideo(id, job, st.videoRef, deps) : proxyUrl(id);
  return status(id, job, videoUrl, deps.now);
}

/** videoUrl があればできあがり */
function status(id: string, job: LiveJob, videoUrl: string | null, now: number): JobStatus {
  const done = videoUrl !== null;
  const expected = EXPECTED_SEC[job.model][job.kind];
  const elapsed = Math.max(0, (now - job.startedAt) / 1000);
  const within = Math.min(0.95, elapsed / expected);
  const left = job.steps - job.step; // このあとに残っている延長の本数
  return {
    id,
    kind: job.kind,
    state: done ? "done" : "running",
    progress: done ? 100 : Math.floor(((job.step - 1 + within) / job.steps) * 100),
    remainingSec: done ? 0 : Math.max(10, Math.ceil(expected - elapsed)) + left * expected,
    videoUrl,
    model: job.model,
    practice: false,
    pollMs: LIVE_POLL_MS,
  };
}

/** 本番モードのエラーを画面向けの返事にする */
export function liveError(e: unknown): Response {
  if (e instanceof BadPlanError) return Response.json({ error: e.message }, { status: 400 });
  if (e instanceof ConfigError) {
    console.error(e.message);
    return Response.json({ error: "本番モードの設定が足りません。管理者に連絡してください。" }, { status: 500 });
  }
  if (e instanceof ProviderError) {
    console.error(e.message);
    return Response.json({ error: `動画を作れませんでした（${e.message}）` }, { status: 502 });
  }
  throw e;
}

// ---- できた動画 ----

const proxyUrl = (id: string) => `/api/jobs/${id}/video`;

/** 無料プランの1ファイルの上限 */
const MAX_STORED_BYTES = 50 * 1024 * 1024;

/** 保存場所での名前。頼んだ人のフォルダに、推測できない名前で置く */
export function storedVideoPath(job: LiveJob, env: Env): string | null {
  if (!job.owner || !/^[\w-]{1,64}$/.test(job.owner)) return null;
  return `${job.owner}/${sign(`video:${job.task}`, secret(env)).slice(0, 32)}.mp4`;
}

/**
 * 完成した動画を保存場所へ移し、そのアドレスを返す。
 * 保存場所がない・移せなかったときは、動画API側の動画をサーバー経由で返すアドレスにする（いずれ消える）。
 */
async function keepVideo(id: string, job: LiveJob, videoRef: string, deps: LiveDeps): Promise<string> {
  const path = deps.storage ? storedVideoPath(job, deps.env) : null;
  if (!deps.storage || !path) return proxyUrl(id);
  try {
    if (await hasStoredVideo(deps.storage, path, deps.fetch)) return storedVideoUrl(deps.storage, path);
    const res = await download(job, videoRef, null, deps);
    if (!res.ok) throw new Error(`動画を読み込めませんでした（HTTP ${res.status}）`);
    const data = await res.arrayBuffer();
    if (data.byteLength > MAX_STORED_BYTES) throw new Error(`動画が大きすぎて保存できません（${data.byteLength} バイト）`);
    await putStoredVideo(deps.storage, path, data, deps.fetch);
    return storedVideoUrl(deps.storage, path);
  } catch (e) {
    console.error("動画を保存場所に移せませんでした", e);
    return proxyUrl(id);
  }
}

/** 保存場所に移してあれば、そのアドレス */
async function storedUrlOf(job: LiveJob, deps: LiveDeps): Promise<string | null> {
  const path = deps.storage ? storedVideoPath(job, deps.env) : null;
  if (!deps.storage || !path) return null;
  return (await hasStoredVideo(deps.storage, path, deps.fetch)) ? storedVideoUrl(deps.storage, path) : null;
}

function download(job: LiveJob, videoRef: string, range: string | null, deps: LiveDeps): Promise<Response> {
  if (job.model === "kling-3.0") return downloadKling(videoRef, range, deps.fetch);
  if (job.model === "cogvideox-flash") return downloadCogVideo(videoRef, range, deps.fetch);
  return downloadVeo(veoConfig(deps.env), videoRef, range, deps.fetch);
}

/** 共有ページ用の、完成した本番動画のアドレス。下書きや延長前の途中のIDなら null */
export async function liveVideoUrl(id: string, deps: LiveDeps): Promise<string | null> {
  try {
    const job = decodeLiveJob(id, deps.env);
    if (!job || job.kind !== "final" || job.next) return null;
    return (await storedUrlOf(job, deps)) ?? proxyUrl(id);
  } catch {
    return null; // 署名の鍵がないなど
  }
}

/** できた動画をサーバー経由で返す（同じドメインから読めるので、保存ボタンや iPhone の再生でも困らない） */
export async function liveVideo(id: string, range: string | null, deps: LiveDeps): Promise<Response> {
  const job = decodeLiveJob(id, deps.env);
  if (!job) return Response.json({ error: "ジョブが見つかりません" }, { status: 404 });
  // 保存場所に移してあれば、そちらを見てもらう（動画API側の動画が消えたあとでも見られる）
  const stored = job.kind === "final" && !job.next ? await storedUrlOf(job, deps) : null;
  if (stored) return Response.redirect(stored, 302);

  const st = await poll(job, deps);
  if (st.state !== "done" || job.next) return Response.json({ error: "動画はまだできていません" }, { status: 409 });

  const upstream = await download(job, st.videoRef, range, deps);
  if (!upstream.ok) return Response.json({ error: "動画を読み込めませんでした" }, { status: 502 });

  const headers = new Headers({ "Content-Type": "video/mp4", "Cache-Control": "private, max-age=3600" });
  for (const h of ["Content-Length", "Content-Range", "Accept-Ranges"]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
