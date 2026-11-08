import type { AnimationStyle } from "../types";
import { coverflowLayout } from "./coverflow";
import { cubeLayout } from "./cube";
import { depthLayout } from "./depth";
import { fadeLayout } from "./fade";
import { flipLayout } from "./flip";
import { parallaxLayout } from "./parallax";
import { distanceZ } from "./zOrder";

const base = { size: 300, vertical: false };

describe("distanceZ", () => {
  it("is highest at the centre, strictly decreasing with distance, never negative", () => {
    const zs = [0, 0.5, 1, 2, 3, 5, 8, 12].map(distanceZ);
    for (let k = 1; k < zs.length; k++) expect(zs[k - 1]!).toBeGreaterThan(zs[k]!);
    expect(distanceZ(-2)).toBe(distanceZ(2));
    expect(distanceZ(1000)).toBe(0);
  });
});

// Every centre-out layout used to tie all slides a page or more away at zIndex 0,
// so a slide two pages out painted over the one a page out (mount order).
describe.each<[string, AnimationStyle]>([
  ["fade", fadeLayout(base)],
  ["depth", depthLayout(base)],
  ["flip", flipLayout(base)],
  ["cube", cubeLayout(base)],
  ["coverflow", coverflowLayout(base)],
  ["parallax", parallaxLayout(base)],
])("%s paint order", (_name, layout) => {
  it("keeps a nearer slide above a farther one on both sides", () => {
    for (const side of [1, -1]) {
      const zs = [0, 1, 2, 3, 4].map((d) => layout(side * d, 0).zIndex!);
      for (let k = 1; k < zs.length; k++) expect(zs[k - 1]!).toBeGreaterThan(zs[k]!);
      for (const z of zs) expect(z).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("flip — far slides", () => {
  it("hides a slide a full turn away (360° faces front again)", () => {
    const layout = flipLayout(base);
    expect(layout(0, 0).opacity).toBe(1);
    expect(layout(2, 0).opacity).toBe(0);
    expect(layout(-2, 0).opacity).toBe(0);
  });
});
