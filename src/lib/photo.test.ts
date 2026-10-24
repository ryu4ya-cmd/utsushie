import { describe, expect, it } from "vitest";
import { ASPECT, cropBox, photoProblem, shrinkScale } from "./photo";

describe("写真の切り取り", () => {
  it("横長の写真を縦の動画にするときは、左右を切る。位置で左右に動く", () => {
    expect(cropBox(1600, 1200, ASPECT["9:16"], 0.5, 0.5)).toEqual({ x: 463, y: 0, w: 675, h: 1200 });
    expect(cropBox(1600, 1200, ASPECT["9:16"], 0, 0.5)).toMatchObject({ x: 0 });
    expect(cropBox(1600, 1200, ASPECT["9:16"], 1, 0.5)).toMatchObject({ x: 925 });
  });

  it("縦長の写真を横の動画にするときは、上下を切る", () => {
    expect(cropBox(1200, 1600, ASPECT["16:9"], 0.5, 0)).toEqual({ x: 0, y: 0, w: 1200, h: 675 });
    expect(cropBox(1200, 1600, ASPECT["16:9"], 0.5, 1)).toMatchObject({ y: 925 });
  });

  it("範囲の外の位置は端にそろえる", () => {
    expect(cropBox(1600, 1200, ASPECT["9:16"], 2, 0.5).x).toBe(925);
    expect(cropBox(1600, 1200, ASPECT["9:16"], -1, 0.5).x).toBe(0);
  });

  it("切り取ると小さすぎる写真は先に知らせる", () => {
    expect(photoProblem({ width: 1600, height: 1200 }, ASPECT["9:16"])).toBeNull();
    // 横長の 800×450 を縦にすると幅 253px しか残らない
    expect(photoProblem({ width: 800, height: 450 }, ASPECT["9:16"])).not.toBeNull();
  });

  it("縮めるだけで、大きくはしない", () => {
    expect(shrinkScale(4000, 3000, 1600)).toBe(0.4);
    expect(shrinkScale(800, 600, 1600)).toBe(1);
  });
});
