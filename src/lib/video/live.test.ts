// 本番モードのテスト。fetch はすべて偽物に差し替え、本物の動画APIには一切つながない。

import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockPlan } from "@/lib/plan/mockPlanner";
import type { Brief, Duration } from "@/lib/types";
import { klingToken } from "./kling";
import { ConfigError, decodeLiveJob, encodeLiveJob, liveStatus, liveVideo, liveVideoUrl, parsePlan, startLive, type Env, type LiveDeps } from "./live";
import { ProviderError, type FetchLike } from "./types";

const SECRET = "x".repeat(32);
const ENV: Env = {
  UTSUSHIE_MODE: "live",
  UTSUSHIE_JOB_SECRET: SECRET,
  KLING_ACCESS_KEY: "ak-test",
  KLING_SECRET_KEY: "sk-test",
  GEMINI_API_KEY: "gk-test",
};
const T0 = 1_700_000_000_000;

const plan = (sentence_ja: string, duration_sec: Duration = 10) =>
  mockPlan({ sentence_ja, purpose: "sns_vertical", mood: "auto", duration_sec, sound: true, subtitles: true } satisfies Brief);
const WITH_LINE = plan("女の子が振り返って「また明日ね」と笑う");
const NO_LINE_15 = plan("夕焼けの海辺で猫が驚いてジャンプする", 15);

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
}

/** 決めておいた返事を順に返す偽の fetch。呼ばれた中身を calls に残す */
function fakeFetch(handler: (c: Call) => Response) {
  const calls: Call[] = [];
  const fn: FetchLike = async (url, init) => {
    const c: Call = {
      url,
      method: init?.method ?? "GET",
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
    };
    calls.push(c);
    return handler(c);
  };
  return { fn, calls };
}

const json = (data: unknown, status = 200) => Response.json(data, { status });
const deps = (fetch: FetchLike, now = T0, env = ENV): LiveDeps => ({ env, fetch, now });
const never: FetchLike = async () => {
  throw new Error("動画APIを呼んではいけない");
};

describe("ジョブID", () => {
  const job = {
    kind: "final", variant: null, duration: 10, model: "kling-3.0", aspect: "9:16", sound: true,
    task: "t1", step: 1, steps: 1, next: null, startedAt: T0,
  } as const;

  it("署名付きで元に戻せる", () => {
    expect(decodeLiveJob(encodeLiveJob(job, ENV), ENV)).toEqual(job);
  });

  it("書き換えたIDや別の鍵のIDは受け付けない", () => {
    const id = encodeLiveJob(job, ENV);
    const [, sig] = id.split(".");
    const forged = Buffer.from(JSON.stringify({ ...job, next: "勝手な延長" })).toString("base64url");
    expect(decodeLiveJob(`${forged}.${sig}`, ENV)).toBeNull();
    expect(decodeLiveJob(id, { ...ENV, UTSUSHIE_JOB_SECRET: "y".repeat(32) })).toBeNull();
    expect(decodeLiveJob("でたらめ", ENV)).toBeNull();
  });
});

describe("設定が足りないときは動画APIを呼ばない", () => {
  it("署名の鍵がない", async () => {
    await expect(startLive({ kind: "final", duration: 10, plan: WITH_LINE, sound: true }, deps(never, T0, { ...ENV, UTSUSHIE_JOB_SECRET: "" }))).rejects.toBeInstanceOf(ConfigError);
  });

  it("Kling の鍵がない", async () => {
    await expect(startLive({ kind: "final", duration: 10, plan: WITH_LINE, sound: true }, deps(never, T0, { ...ENV, KLING_SECRET_KEY: undefined }))).rejects.toBeInstanceOf(ConfigError);
  });

  it("Gemini の鍵がない", async () => {
    await expect(startLive({ kind: "final", duration: 15, plan: NO_LINE_15, sound: true }, deps(never, T0, { ...ENV, GEMINI_API_KEY: undefined }))).rejects.toBeInstanceOf(ConfigError);
  });
});

describe("設計図の受け取り", () => {
  it("おかしな設計図は断る", () => {
    expect(() => parsePlan(null, 10)).toThrow();
    expect(() => parsePlan({ ...WITH_LINE, duration_sec: 15 }, 10)).toThrow();
    expect(() => parsePlan({ ...WITH_LINE, characters: [] }, 10)).toThrow(); // 話し手がいない
    expect(parsePlan(WITH_LINE, 10)).toEqual(WITH_LINE);
  });
});

describe("Kling 3.0（セリフあり）", () => {
  it("JWT を正しく作る", () => {
    const token = klingToken({ accessKey: "ak", secretKey: "sk" }, 1000);
    const [h, b, s] = token.split(".");
    expect(JSON.parse(Buffer.from(b, "base64url").toString())).toEqual({ iss: "ak", exp: 2800, nbf: 995 });
    expect(s).toBe(createHmac("sha256", "sk").update(`${h}.${b}`).digest("base64url"));
  });

  it("本番は pro・指定の長さ・音ありで頼み、できたら動画を返す", async () => {
    let status = "processing";
    const { fn, calls } = fakeFetch((c) =>
      c.method === "POST"
        ? json({ code: 0, data: { task_id: "task-1", task_status: "submitted" } })
        : json({ code: 0, data: { task_id: "task-1", task_status: status, task_result: { videos: [{ url: "https://cdn.example/v.mp4" }] } } }),
    );

    const [id] = await startLive({ kind: "final", duration: 10, plan: WITH_LINE, sound: true }, deps(fn));
    expect(calls[0].url).toBe("https://api-singapore.klingai.com/v1/videos/text2video");
    expect(calls[0].headers.authorization).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
    expect(calls[0].body).toMatchObject({ model_name: "kling-v3", mode: "pro", aspect_ratio: "9:16", duration: "10", sound: "on" });
    expect(calls[0].body?.prompt).toContain("また明日ね");

    const running = await liveStatus(id, deps(fn, T0 + 150_000));
    expect(calls[1].url).toBe("https://api-singapore.klingai.com/v1/videos/text2video/task-1");
    expect(running).toMatchObject({ state: "running", progress: 50, practice: false, videoUrl: null, pollMs: 5000 });

    status = "succeed";
    const done = await liveStatus(id, deps(fn, T0 + 200_000));
    expect(done).toMatchObject({ id, state: "done", progress: 100, videoUrl: `/api/jobs/${id}/video` });
  });

  it("下書きは2本、std・5秒・音なしで、構図の違いを足して頼む", async () => {
    const { fn, calls } = fakeFetch(() => json({ code: 0, data: { task_id: `task-${Math.random().toString(36).slice(2)}` } }));
    const ids = await startLive({ kind: "draft", duration: 15, plan: plan("男の子が「やった！」と叫ぶ", 15), sound: true }, deps(fn));
    expect(ids).toHaveLength(2);
    expect(calls.map((c) => c.body)).toEqual([
      expect.objectContaining({ mode: "std", duration: "5", sound: "off", prompt: expect.stringContaining("closer framing") }),
      expect.objectContaining({ mode: "std", duration: "5", sound: "off", prompt: expect.stringContaining("wider framing") }),
    ]);
  });

  it("失敗やエラーはそのまま伝える", async () => {
    const failed = fakeFetch((c) =>
      c.method === "POST" ? json({ code: 0, data: { task_id: "t" } }) : json({ code: 0, data: { task_status: "failed", task_status_msg: "内容が不適切" } }),
    );
    const [id] = await startLive({ kind: "final", duration: 10, plan: WITH_LINE, sound: true }, deps(failed.fn));
    await expect(liveStatus(id, deps(failed.fn))).rejects.toThrow("内容が不適切");

    const denied = fakeFetch(() => json({ code: 1102, message: "Account balance not enough" }, 429));
    await expect(startLive({ kind: "final", duration: 10, plan: WITH_LINE, sound: true }, deps(denied.fn))).rejects.toBeInstanceOf(ProviderError);
  });
});

describe("Veo 3.1（セリフなし）", () => {
  const OP1 = "models/veo-3.1-generate-preview/operations/op1";
  const OP2 = "models/veo-3.1-generate-preview/operations/op2";
  const FILE1 = "https://generativelanguage.googleapis.com/v1beta/files/f1:download?alt=media";
  const FILE2 = "https://generativelanguage.googleapis.com/v1beta/files/f2:download?alt=media";
  const BASE = "https://generativelanguage.googleapis.com/v1beta";
  const done = (uri: string) => json({ done: true, response: { generateVideoResponse: { generatedSamples: [{ video: { uri } }] } } });

  it("15秒は8秒を作ってから延長し、延長後のIDで続ける", async () => {
    const state: Record<string, boolean> = { op1: false, op2: false };
    let posts = 0;
    const { fn, calls } = fakeFetch((c) => {
      if (c.method === "POST") return json({ name: ++posts === 1 ? OP1 : OP2 });
      if (c.url.endsWith("op1")) return state.op1 ? done(FILE1) : json({ done: false });
      return state.op2 ? done(FILE2) : json({ done: false });
    });

    const [id1] = await startLive({ kind: "final", duration: 15, plan: NO_LINE_15, sound: true }, deps(fn));
    expect(calls[0].url).toBe(`${BASE}/models/veo-3.1-generate-preview:predictLongRunning`);
    expect(calls[0].headers["x-goog-api-key"]).toBe("gk-test");
    expect(calls[0].body).toMatchObject({ parameters: { aspectRatio: "9:16", resolution: "720p", durationSeconds: 8 } });
    expect((calls[0].body?.instances as { prompt: string }[])[0].prompt).toContain("8 seconds");

    expect(await liveStatus(id1, deps(fn, T0 + 60_000))).toMatchObject({ id: id1, state: "running", progress: 25 });

    // 1本目ができたら延長を頼み、新しいIDを返す
    state.op1 = true;
    const handed = await liveStatus(id1, deps(fn, T0 + 120_000));
    expect(posts).toBe(2);
    const ext = calls.find((c) => c.method === "POST" && c !== calls[0])!;
    expect(ext.body).toEqual({
      instances: [{ prompt: expect.stringContaining("Continue seamlessly"), video: { uri: FILE1 } }],
      parameters: { aspectRatio: "9:16", resolution: "720p" },
    });
    expect(handed).toMatchObject({ state: "running", progress: 50 });
    expect(handed!.id).not.toBe(id1);

    // 1本目の動画は途中のものなので渡さない（共有ページでも出さない）
    expect((await liveVideo(id1, null, deps(fn))).status).toBe(409);
    expect(liveVideoUrl(id1, ENV)).toBeNull();
    expect(liveVideoUrl(handed!.id, ENV)).toBe(`/api/jobs/${handed!.id}/video`);

    state.op2 = true;
    const final = await liveStatus(handed!.id, deps(fn, T0 + 200_000));
    expect(final).toMatchObject({ id: handed!.id, state: "done", progress: 100 });
    expect(posts).toBe(2); // 延長は1回だけ
  });

  it("下書きは Fast で8秒だけ（延長しない）", async () => {
    const { fn, calls } = fakeFetch(() => json({ name: "models/veo-3.1-fast-generate-preview/operations/d" }));
    const ids = await startLive({ kind: "draft", duration: 15, plan: NO_LINE_15, sound: true }, deps(fn));
    expect(calls.map((c) => c.url)).toEqual(Array(2).fill(`${BASE}/models/veo-3.1-fast-generate-preview:predictLongRunning`));
    expect(decodeLiveJob(ids[0], ENV)).toMatchObject({ steps: 1, next: null, variant: "a" });
  });

  it("安全確認で止められたら失敗として伝える", async () => {
    const { fn } = fakeFetch((c) =>
      c.method === "POST" ? json({ name: OP1 }) : json({ done: true, response: { generateVideoResponse: { raiMediaFilteredReasons: ["x"] } } }),
    );
    const [id] = await startLive({ kind: "final", duration: 10, plan: plan("夕焼けの海辺で猫が驚いてジャンプする"), sound: true }, deps(fn));
    await expect(liveStatus(id, deps(fn))).rejects.toThrow("安全のための確認");
  });

  it("できた動画はキーを付けて取りに行き、途中から読む指定も渡す", async () => {
    const { fn, calls } = fakeFetch((c) => {
      if (c.url === FILE1) return new Response("mp4", { status: 206, headers: { "Content-Range": "bytes 0-2/3", "Content-Length": "3" } });
      return done(FILE1);
    });
    const id = encodeLiveJob(
      { kind: "final", variant: null, duration: 10, model: "veo-3.1", aspect: "9:16", sound: true, task: OP1, step: 2, steps: 2, next: null, startedAt: T0 },
      ENV,
    );
    const res = await liveVideo(id, "bytes=0-", deps(fn));
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 0-2/3");
    expect(await res.text()).toBe("mp4");
    expect(calls.at(-1)).toMatchObject({ url: FILE1, headers: { "x-goog-api-key": "gk-test", range: "bytes=0-" } });
  });

  it("Gemini API 以外の場所には APIキーを送らない", async () => {
    const { fn, calls } = fakeFetch((c) => (c.method === "POST" ? json({ name: OP1 }) : done("https://evil.example/steal")));
    const [id] = await startLive({ kind: "final", duration: 10, plan: plan("夕焼けの海辺で猫が驚いてジャンプする"), sound: true }, deps(fn));
    await expect(liveStatus(id, deps(fn))).rejects.toThrow();
    expect(calls.some((c) => c.url.startsWith("https://evil.example"))).toBe(false);
  });
});

describe("練習モードのAPIは外部を一切呼ばない", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", never);
    vi.stubEnv("UTSUSHIE_MODE", "");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("ジョブの開始と進み具合", async () => {
    const { POST } = await import("@/app/api/jobs/route");
    const { GET } = await import("@/app/api/jobs/[id]/route");
    const res = await POST(new Request("http://x/api/jobs", { method: "POST", body: JSON.stringify({ kind: "final", duration_sec: 10, model: "kling-3.0", plan: WITH_LINE }) }));
    const { ids, practice } = await res.json();
    expect(practice).toBe(true);
    const st = await GET(new Request("http://x"), { params: Promise.resolve({ id: ids[0] }) } as never);
    expect(await st.json()).toMatchObject({ practice: true });
  });

  it("live 以外の値は練習モード", async () => {
    vi.stubEnv("UTSUSHIE_MODE", "LIVE");
    const { POST } = await import("@/app/api/jobs/route");
    const res = await POST(new Request("http://x/api/jobs", { method: "POST", body: JSON.stringify({ kind: "draft", duration_sec: 10 }) }));
    expect((await res.json()).practice).toBe(true);
  });
});
