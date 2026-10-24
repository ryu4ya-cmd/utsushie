import { describe, expect, it } from "vitest";
import { addEntry, HISTORY_LIMIT, parseHistory, removeEntry, type HistoryEntry } from "./history";

const entry = (id: string, createdAt = 1): HistoryEntry => ({
  id,
  createdAt,
  title: `動画${id}`,
  sentence: "猫が踊る",
  duration: 10,
  aspect: "9:16",
  model: "veo-3.1",
  videoUrl: "/samples/final-10s.mp4",
  subtitles: [],
});

describe("履歴", () => {
  it("新しいものが先頭に来て、同じIDは1件にまとまる", () => {
    const list = addEntry(addEntry([], entry("a")), entry("b"));
    expect(list.map((e) => e.id)).toEqual(["b", "a"]);
    expect(addEntry(list, entry("a", 2)).map((e) => [e.id, e.createdAt])).toEqual([["a", 2], ["b", 1]]);
  });

  it("上限を超えたら古いものから消える", () => {
    let list: HistoryEntry[] = [];
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) list = addEntry(list, entry(String(i)));
    expect(list).toHaveLength(HISTORY_LIMIT);
    expect(list[0].id).toBe(String(HISTORY_LIMIT + 4));
  });

  it("消せる", () => {
    expect(removeEntry([entry("a"), entry("b")], "a").map((e) => e.id)).toEqual(["b"]);
  });

  it("壊れた保存データは空として読む", () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory("{壊れ")).toEqual([]);
    expect(parseHistory(JSON.stringify([entry("a"), { id: 1 }]))).toHaveLength(1);
  });
});
