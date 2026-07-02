import { prefetchWindow, visibleWindow } from "../window";

describe("visibleWindow — defaults & guards", () => {
  it("returns [] for an empty data set", () => {
    expect(visibleWindow(0, 0, 5, true)).toEqual([]);
  });

  it("mounts ALL items when windowSize is <= 0 or non-finite", () => {
    expect(visibleWindow(0, 5, 0, false)).toEqual([0, 1, 2, 3, 4]);
    expect(visibleWindow(0, 5, Number.POSITIVE_INFINITY, false)).toEqual([0, 1, 2, 3, 4]);
  });

  it("never returns more than `count` items even if windowSize exceeds it", () => {
    expect(visibleWindow(0, 3, 10, false)).toEqual([0, 1, 2]);
  });
});

describe("visibleWindow — non-loop (clamped contiguous span)", () => {
  it("centers the window and keeps it within [0, count-1]", () => {
    expect(visibleWindow(5, 10, 3, false)).toEqual([4, 5, 6]);
  });

  it("clamps at the start without shrinking the window", () => {
    expect(visibleWindow(0, 10, 3, false)).toEqual([0, 1, 2]);
  });

  it("clamps at the end without shrinking the window", () => {
    expect(visibleWindow(9, 10, 3, false)).toEqual([7, 8, 9]);
  });

  it("rounds a fractional scroll to the nearest page", () => {
    expect(visibleWindow(2.6, 10, 3, false)).toEqual([2, 3, 4]);
  });
});

describe("visibleWindow — loop (mod-wrapped span, no duplication)", () => {
  it("wraps below 0", () => {
    expect(visibleWindow(0, 10, 3, true)).toEqual([9, 0, 1]);
  });

  it("wraps above count-1", () => {
    expect(visibleWindow(9, 10, 3, true)).toEqual([8, 9, 0]);
  });

  it("returns every index (reordered) when windowSize === count", () => {
    expect(visibleWindow(0, 5, 5, true)).toEqual([3, 4, 0, 1, 2]);
  });

  it("handles an even window (slightly forward-weighted)", () => {
    expect(visibleWindow(5, 10, 4, true)).toEqual([4, 5, 6, 7]);
  });

  it("produces `windowSize` distinct indices for any scroll when windowSize < count", () => {
    for (let s = -12; s <= 12; s++) {
      const win = visibleWindow(s, 7, 5, true);
      expect(win).toHaveLength(5);
      expect(new Set(win).size).toBe(5);
      for (const idx of win) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(7);
      }
    }
  });
});

describe("prefetchWindow — leads in the travel direction", () => {
  it("returns the plain visible window when lead <= 0", () => {
    expect(prefetchWindow(5, 20, 3, false, 1, 0)).toEqual([4, 5, 6]);
  });

  it("is always a superset of the visible window (same items first)", () => {
    const win = visibleWindow(5, 20, 3, false);
    const pre = prefetchWindow(5, 20, 3, false, 1, 3);
    expect(pre.slice(0, win.length)).toEqual(win);
    expect(new Set(pre).size).toBe(pre.length); // no duplicates
  });

  it("extends ahead when moving forward (non-loop)", () => {
    expect(prefetchWindow(5, 20, 3, false, 1, 2)).toEqual([4, 5, 6, 7, 8]);
  });

  it("extends behind when moving backward (non-loop)", () => {
    expect(prefetchWindow(5, 20, 3, false, -1, 2)).toEqual([4, 5, 6, 3, 2]);
  });

  it("drops out-of-range indices at the edges (non-loop)", () => {
    expect(prefetchWindow(19, 20, 3, false, 1, 3)).toEqual([17, 18, 19]);
  });

  it("wraps the lead in loop mode", () => {
    expect(prefetchWindow(19, 20, 3, true, 1, 2)).toEqual([18, 19, 0, 1, 2]);
    expect(prefetchWindow(0, 20, 3, true, -1, 2)).toEqual([19, 0, 1, 18, 17]);
  });

  it("never returns more than `count` distinct indices", () => {
    for (let s = -8; s <= 8; s++) {
      const pre = prefetchWindow(s, 6, 3, true, 1, 50);
      expect(pre.length).toBeLessThanOrEqual(6);
      expect(new Set(pre).size).toBe(pre.length);
    }
  });
});
