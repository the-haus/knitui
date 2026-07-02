import { activeIndex, clamp, mod, offsetFor, progressFor, rawIndex, wrapIndex } from "../offset";

describe("mod", () => {
  it("returns a value in [0, m) for positive and negative inputs", () => {
    expect(mod(5, 4)).toBe(1);
    expect(mod(-1, 4)).toBe(3);
    expect(mod(-4, 4)).toBe(0);
    expect(mod(0, 4)).toBe(0);
    expect(mod(4, 4)).toBe(0);
  });

  it("handles fractional inputs", () => {
    expect(mod(0.5, 1)).toBeCloseTo(0.5);
    expect(mod(-0.25, 1)).toBeCloseTo(0.75);
  });
});

describe("clamp", () => {
  it("bounds the value", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
});

describe("rawIndex / offsetFor are inverses", () => {
  it("rawIndex negates and divides by size", () => {
    expect(rawIndex(-200, 100)).toBe(2);
    expect(rawIndex(-50, 100)).toBe(0.5);
    expect(rawIndex(0, 100)).toBe(0);
    expect(rawIndex(100, 100)).toBe(-1); // overscrolled backwards
  });

  it("offsetFor is the inverse of rawIndex", () => {
    for (const index of [0, 1, 2.5, -1, 7]) {
      expect(rawIndex(offsetFor(index, 100), 100)).toBeCloseTo(index);
    }
  });
});

describe("wrapIndex", () => {
  it("wraps onto the ring", () => {
    expect(wrapIndex(0, 5)).toBe(0);
    expect(wrapIndex(5, 5)).toBe(0);
    expect(wrapIndex(7, 5)).toBe(2);
    expect(wrapIndex(-1, 5)).toBe(4);
  });
});

describe("activeIndex", () => {
  const size = 100;
  const count = 5;

  it("rounds to the nearest page (loop wraps)", () => {
    expect(activeIndex(offsetFor(0, size), size, count, true)).toBe(0);
    expect(activeIndex(offsetFor(2, size), size, count, true)).toBe(2);
    expect(activeIndex(offsetFor(5, size), size, count, true)).toBe(0); // full lap
    expect(activeIndex(offsetFor(6, size), size, count, true)).toBe(1);
    expect(activeIndex(offsetFor(-1, size), size, count, true)).toBe(4); // back-wrap
  });

  it("clamps in non-loop mode", () => {
    expect(activeIndex(offsetFor(-3, size), size, count, false)).toBe(0);
    expect(activeIndex(offsetFor(10, size), size, count, false)).toBe(4);
    expect(activeIndex(offsetFor(2, size), size, count, false)).toBe(2);
  });

  it("rounds fractional offsets to nearest", () => {
    expect(activeIndex(offsetFor(1.4, size), size, count, true)).toBe(1);
    expect(activeIndex(offsetFor(1.6, size), size, count, true)).toBe(2);
  });
});

describe("progressFor", () => {
  const size = 100;
  const count = 5;

  it("reports fractional progress wrapped onto [0, count) in loop mode", () => {
    expect(progressFor(offsetFor(0, size), size, count, true)).toBeCloseTo(0);
    expect(progressFor(offsetFor(2.5, size), size, count, true)).toBeCloseTo(2.5);
    expect(progressFor(offsetFor(5, size), size, count, true)).toBeCloseTo(0);
    expect(progressFor(offsetFor(-0.5, size), size, count, true)).toBeCloseTo(4.5);
  });

  it("clamps to [0, count - 1] in non-loop mode", () => {
    expect(progressFor(offsetFor(-1, size), size, count, false)).toBe(0);
    expect(progressFor(offsetFor(10, size), size, count, false)).toBe(4);
    expect(progressFor(offsetFor(3.2, size), size, count, false)).toBeCloseTo(3.2);
  });
});
