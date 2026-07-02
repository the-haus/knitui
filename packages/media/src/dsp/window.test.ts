import { applyWindow, makeWindow, windowGain, type WindowType } from "./window";

describe("makeWindow", () => {
  it("rectangular is all ones", () => {
    expect(Array.from(makeWindow("rectangular", 4))).toEqual([1, 1, 1, 1]);
  });

  it("hann starts at zero and is symmetric about its peak", () => {
    const w = makeWindow("hann", 8);
    expect(w[0]).toBeCloseTo(0, 6);
    // Periodic Hann peaks at the midpoint (i = N/2).
    expect(w[4]).toBeCloseTo(1, 6);
    // Symmetry around the midpoint.
    expect(w[3]).toBeCloseTo(w[5], 6);
    expect(w[2]).toBeCloseTo(w[6], 6);
  });

  it.each<WindowType>(["hann", "hamming", "blackman", "blackmanHarris"])(
    "%s coefficients stay within [0, 1]",
    (type) => {
      // Approximate Blackman dips to ~-1e-17 (floating-point noise) at the edges.
      for (const v of makeWindow(type, 64)) {
        expect(v).toBeGreaterThanOrEqual(-1e-9);
        expect(v).toBeLessThanOrEqual(1);
      }
    },
  );

  it("rejects invalid sizes", () => {
    expect(() => makeWindow("hann", 0)).toThrow(RangeError);
    expect(() => makeWindow("hann", -4)).toThrow(RangeError);
  });
});

describe("windowGain", () => {
  it("is 1 for a rectangular window", () => {
    expect(windowGain(makeWindow("rectangular", 16))).toBeCloseTo(1, 6);
  });

  it("is ~0.5 for a Hann window", () => {
    expect(windowGain(makeWindow("hann", 1024))).toBeCloseTo(0.5, 2);
  });
});

describe("applyWindow", () => {
  it("multiplies elementwise into a separate output", () => {
    const input = Float32Array.from([1, 1, 1, 1]);
    const win = Float32Array.from([0, 0.5, 0.5, 1]);
    const out = new Float32Array(4);
    applyWindow(out, input, win);
    expect(Array.from(out)).toEqual([0, 0.5, 0.5, 1]);
  });

  it("supports in-place windowing (out aliases input)", () => {
    const buf = Float32Array.from([2, 4, 6, 8]);
    const win = Float32Array.from([1, 0.5, 0.5, 0]);
    applyWindow(buf, buf, win);
    expect(Array.from(buf)).toEqual([2, 2, 3, 0]);
  });

  it("rejects mismatched lengths", () => {
    expect(() =>
      applyWindow(new Float32Array(3), new Float32Array(4), new Float32Array(4)),
    ).toThrow(RangeError);
  });
});
