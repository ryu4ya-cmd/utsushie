// ログインと回数制限のテスト。Supabase も動画APIも偽の fetch に差し替え、外には一切つながない。

import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isOwnerKey } from "@/lib/owner";
import { mockPlan } from "@/lib/plan/mockPlanner";
import { limitMessage, limits } from "@/lib/quota";
import type { Brief } from "@/lib/types";
import { decodeLiveJob } from "@/lib/video/live";

// connection() は Next の中でしか動かないので、テストでは何もしないものにする
vi.mock("next/server", () => ({ connection: async () => {} }));

const SB_URL = "https://proj.supabase.co";
const USER = "1b4e28ba-2fa1-11d2-883f-0016d3cca427";
const SUPABASE_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: SB_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
  SUPABASE_SECRET_KEY: "sb_secret_y",
};
const LIVE_ENV = {
  UTSUSHIE_MODE: "live",
  UTSUSHIE_JOB_SECRET: "x".repeat(32),
  KLING_ACCESS_KEY: "ak",
  KLING_SECRET_KEY: "sk",
  GEMINI_API_KEY: "gk",
};
const PLAN = mockPlan({
  sentence_ja: "女の子が振り返って「また明日ね」と笑う", purpose: "sns_vertical", mood: "auto", duration_sec: 10, sound: true, subtitles: true, from_image: false,
} satisfies Brief);

interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

/** Supabase の返事を決めた偽の fetch。used は use_generation が返す値 */
function stubFetch(opts: { used?: number; tokenOk?: boolean } = {}) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    const c = {
      url,
      method: init?.method ?? "GET",
      headers: Object.fromEntries(new Headers(init?.headers).entries()),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
    };
    calls.push(c);
    if (url === `${SB_URL}/auth/v1/user`) {
      return opts.tokenOk === false ? Response.json({ msg: "bad jwt" }, { status: 401 }) : Response.json({ id: USER });
    }
    if (url === `${SB_URL}/rest/v1/rpc/use_generation`) return Response.json(opts.used ?? 1);
    if (url === `${SB_URL}/rest/v1/rpc/today_usage`) return Response.json([{ kind: "draft", count: 2 }]);
    if (url.includes("klingai.com")) return Response.json({ code: 0, data: { task_id: "task-1" } });
    throw new Error(`呼んではいけない: ${url}`);
  });
  return calls;
}

function setEnv(env: Record<string, string>) {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
}

const startJob = async (body: Record<string, unknown>, token: string | null = "user-token", cookie: string | null = null) => {
  const { POST } = await import("@/app/api/jobs/route");
  return POST(
    new Request("http://x/api/jobs", {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(body),
    }),
  );
};

beforeEach(() => {
  vi.stubEnv("UTSUSHIE_MODE", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("ログイン", () => {
  it("Supabase を設定していなければ、今まで通りログインなしで作れる", async () => {
    const calls = stubFetch();
    const res = await startJob({ kind: "draft", duration_sec: 10 }, null);
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(0);
  });

  it("設定していれば、ログインしていない人は作れない", async () => {
    setEnv(SUPABASE_ENV);
    const calls = stubFetch({ tokenOk: false });
    expect(await (await startJob({ kind: "draft", duration_sec: 10 }, null)).json()).toMatchObject({ login: true });
    const res = await startJob({ kind: "draft", duration_sec: 10 }, "expired");
    expect(res.status).toBe(401);
    expect(calls.map((c) => c.url)).toEqual([`${SB_URL}/auth/v1/user`]); // 回数は使わない
    expect(calls[0].headers).toMatchObject({ apikey: "sb_publishable_x", authorization: "Bearer expired" });
  });

  it("シークレットキーがなければ設定の間違いとして止める", async () => {
    setEnv({ ...SUPABASE_ENV, SUPABASE_SECRET_KEY: "" });
    stubFetch();
    const res = await startJob({ kind: "draft", duration_sec: 10 });
    expect(res.status).toBe(500);
  });
});

describe("回数制限", () => {
  it("ログインした人は1回使って作れる。上限はサーバーの設定から送る", async () => {
    setEnv({ ...SUPABASE_ENV, UTSUSHIE_DAILY_DRAFTS: "5" });
    const calls = stubFetch({ used: 1 });
    const res = await startJob({ kind: "draft", duration_sec: 10 });
    expect(res.status).toBe(200);
    expect((await res.json()).ids).toHaveLength(2);
    const rpc = calls.find((c) => c.url.endsWith("/rpc/use_generation"))!;
    expect(rpc.body).toEqual({ p_user: USER, p_kind: "draft", p_limit: 5, p_total: 30 });
    expect(rpc.headers.apikey).toBe("sb_secret_y");
  });

  it("その人の上限に達したら作れない", async () => {
    setEnv(SUPABASE_ENV);
    stubFetch({ used: -1 });
    const res = await startJob({ kind: "final", duration_sec: 10, model: "kling-3.0" });
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: limitMessage("final", 1, "user"), quota: true });
  });

  it("全員の合計の上限に達しても作れない", async () => {
    setEnv(SUPABASE_ENV);
    stubFetch({ used: -2 });
    const res = await startJob({ kind: "draft", duration_sec: 10 });
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe(limitMessage("draft", 3, "total"));
  });

  it("上限は環境変数で変えられ、おかしな値なら既定に戻す", () => {
    expect(limits({ UTSUSHIE_DAILY_DRAFTS: "10", UTSUSHIE_DAILY_FINALS: "0", UTSUSHIE_DAILY_TOTAL_FINALS: "abc" })).toEqual({
      perUser: { draft: 10, final: 0 },
      total: { draft: 30, final: 10 },
    });
  });

  it("今日の使用回数を返す", async () => {
    setEnv(SUPABASE_ENV);
    stubFetch();
    const { GET } = await import("@/app/api/usage/route");
    const res = await GET(new Request("http://x/api/usage", { headers: { Authorization: "Bearer t" } }));
    expect(await res.json()).toEqual({ configured: true, signedIn: true, used: { draft: 2, final: 0 }, limits: { draft: 3, final: 1 } });
  });
});

describe("本番モード", () => {
  it("ログインの設定がなければ、動画APIを呼ばずに止める", async () => {
    setEnv(LIVE_ENV);
    const calls = stubFetch();
    const res = await startJob({ kind: "final", duration_sec: 10, plan: PLAN }, null);
    expect(res.status).toBe(500);
    expect(calls).toHaveLength(0);
  });

  it("上限なら動画APIを呼ばない", async () => {
    setEnv({ ...LIVE_ENV, ...SUPABASE_ENV });
    const calls = stubFetch({ used: -1 });
    expect((await startJob({ kind: "final", duration_sec: 10, plan: PLAN })).status).toBe(429);
    expect(calls.some((c) => c.url.includes("klingai.com"))).toBe(false);
  });

  it("動画APIの設定が足りなければ、回数を使う前に止める", async () => {
    setEnv({ ...LIVE_ENV, ...SUPABASE_ENV, KLING_ACCESS_KEY: "" });
    const calls = stubFetch();
    expect((await startJob({ kind: "final", duration_sec: 10, plan: PLAN })).status).toBe(500);
    expect(calls.some((c) => c.url.endsWith("/rpc/use_generation"))).toBe(false);
  });

  it("ログインした人の分として頼み、ジョブIDに頼んだ人を入れる", async () => {
    setEnv({ ...LIVE_ENV, ...SUPABASE_ENV });
    const calls = stubFetch({ used: 1 });
    const res = await startJob({ kind: "final", duration_sec: 10, plan: PLAN });
    const { ids, practice } = await res.json();
    expect(practice).toBe(false);
    expect(decodeLiveJob(ids[0], process.env)?.owner).toBe(USER);
    const order = calls.map((c) => (c.url.includes("klingai") ? "kling" : c.url.replace(SB_URL, "")));
    expect(order).toEqual(["/auth/v1/user", "/rest/v1/rpc/use_generation", "kling"]);
  });
});

// オーナー用の合言葉はテスト用のものに差し替える（本物の合言葉はコードにない）
const OWNER_KEY = "test-owner-key";
const OWNER_ENV = { UTSUSHIE_OWNER_KEY_SHA256: createHash("sha256").update(OWNER_KEY).digest("hex") };
const OWNER_COOKIE = `theme=dark; utsushie_owner=${OWNER_KEY}`;
const OWNER_USER = "9f8e7d6c-1111-2222-3333-444455556666";

describe("オーナー", () => {
  it("オーナー用リンクを開くと、長く残るクッキーを置いてログインの画面へ戻す", async () => {
    setEnv(OWNER_ENV);
    const { GET } = await import("@/app/api/owner/route");
    const res = await GET(new Request(`http://x/api/owner?key=${OWNER_KEY}`));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/login?owner=on");
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toContain(`utsushie_owner=${OWNER_KEY}`);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Max-Age=34560000/);
  });

  it("合言葉が違えばクッキーを置かない。off で外せる", async () => {
    setEnv(OWNER_ENV);
    const { GET } = await import("@/app/api/owner/route");
    const bad = await GET(new Request("http://x/api/owner?key=guess"));
    expect(bad.headers.get("location")).toBe("/login?owner=bad");
    expect(bad.headers.get("set-cookie")).toBeNull();
    const off = await GET(new Request("http://x/api/owner?off=1"));
    expect(off.headers.get("set-cookie")).toMatch(/utsushie_owner=; .*Max-Age=0/);
  });

  it("練習モードでは、ログインなしで何回でも作れる（回数を数えない）", async () => {
    setEnv({ ...SUPABASE_ENV, ...OWNER_ENV });
    const calls = stubFetch({ used: -1 });
    const res = await startJob({ kind: "draft", duration_sec: 10 }, null, OWNER_COOKIE);
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(0);
  });

  it("クッキーの合言葉が違えば、ほかの人と同じくログインが要る", async () => {
    setEnv({ ...SUPABASE_ENV, ...OWNER_ENV });
    stubFetch();
    const res = await startJob({ kind: "draft", duration_sec: 10 }, null, "utsushie_owner=guess");
    expect(res.status).toBe(401);
  });

  it("上限を設定すれば、オーナーのユーザーIDで数える", async () => {
    setEnv({ ...SUPABASE_ENV, ...OWNER_ENV, UTSUSHIE_OWNER_DAILY_DRAFTS: "20", UTSUSHIE_OWNER_USER_ID: OWNER_USER });
    const calls = stubFetch({ used: 1 });
    expect((await startJob({ kind: "draft", duration_sec: 10 }, null, OWNER_COOKIE)).status).toBe(200);
    expect(calls.map((c) => c.body)).toEqual([{ p_user: OWNER_USER, p_kind: "draft", p_limit: 20, p_total: 30 }]);
  });

  it("本番モードでは既定でほかの人と同じ上限。ユーザーIDがなければ動画APIを呼ばずに止める", async () => {
    setEnv({ ...LIVE_ENV, ...SUPABASE_ENV, ...OWNER_ENV });
    const calls = stubFetch();
    expect((await startJob({ kind: "final", duration_sec: 10, plan: PLAN }, null, OWNER_COOKIE)).status).toBe(500);
    expect(calls).toHaveLength(0);

    vi.stubEnv("UTSUSHIE_OWNER_USER_ID", OWNER_USER);
    const calls2 = stubFetch({ used: 1 });
    const res = await startJob({ kind: "final", duration_sec: 10, plan: PLAN }, null, OWNER_COOKIE);
    expect(decodeLiveJob((await res.json()).ids[0], process.env)?.owner).toBe(OWNER_USER);
    expect(calls2.find((c) => c.url.endsWith("/rpc/use_generation"))?.body).toMatchObject({ p_user: OWNER_USER, p_limit: 1 });
  });

  it("今日の回数の問い合わせに、オーナーであることと上限なしを返す", async () => {
    setEnv({ ...SUPABASE_ENV, ...OWNER_ENV });
    const calls = stubFetch();
    const { GET } = await import("@/app/api/usage/route");
    const res = await GET(new Request("http://x/api/usage", { headers: { Cookie: OWNER_COOKIE } }));
    expect(await res.json()).toEqual({
      configured: true, signedIn: true, owner: true, used: { draft: 0, final: 0 }, limits: { draft: null, final: null },
    });
    expect(calls).toHaveLength(0);
  });

  it("コードの合言葉を off にすれば、オーナー用リンクは使えない", () => {
    expect(isOwnerKey(OWNER_KEY, { UTSUSHIE_OWNER_KEY_SHA256: "off" })).toBe(false);
    expect(isOwnerKey(OWNER_KEY, OWNER_ENV)).toBe(true);
    expect(isOwnerKey("", OWNER_ENV)).toBe(false);
  });
});
