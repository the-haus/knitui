import { FFT, RealFFT } from "./fft";

/** Reference O(N²) DFT in float64 — the ground truth the fast paths must match. */
function naiveDft(re: number[], im: number[]): { re: number[]; im: number[] } {
  const n = re.length;
  const outRe = new Array<number>(n).fill(0);
  const outIm = new Array<number>(n).fill(0);
  for (let k = 0; k < n; k++) {
    for (let t = 0; t < n; t++) {
      const angle = (-2 * Math.PI * k * t) / n;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      outRe[k] += re[t] * c - im[t] * s;
      outIm[k] += re[t] * s + im[t] * c;
    }
  }
  return { re: outRe, im: outIm };
}

/** Deterministic pseudo-random signal (no Math.random — keeps tests reproducible). */
function signal(n: number): number[] {
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    out[i] = Math.sin((i * 12.9898) % (2 * Math.PI)) * 0.5 + Math.cos(i * 0.37) * 0.3;
  }
  return out;
}

describe("FFT (complex)", () => {
  it.each([2, 4, 8, 16, 64, 256])("matches the naive DFT for size %i", (n) => {
    const re = signal(n);
    const im = signal(n).map((v) => -v * 0.5);
    const expected = naiveDft(re, im);

    const fft = new FFT(n);
    const fr = Float32Array.from(re);
    const fi = Float32Array.from(im);
    fft.transform(fr, fi);

    for (let k = 0; k < n; k++) {
      expect(fr[k]).toBeCloseTo(expected.re[k], 3);
      expect(fi[k]).toBeCloseTo(expected.im[k], 3);
    }
  });

  it("inverse FFT reconstructs the original signal", () => {
    const n = 128;
    const re = signal(n);
    const im = signal(n).map((v) => v * 0.25);
    const fft = new FFT(n);
    const fr = Float32Array.from(re);
    const fi = Float32Array.from(im);

    fft.transform(fr, fi);
    fft.transform(fr, fi, true);

    for (let i = 0; i < n; i++) {
      expect(fr[i]).toBeCloseTo(re[i], 4);
      expect(fi[i]).toBeCloseTo(im[i], 4);
    }
  });

  it("rejects non-power-of-two sizes", () => {
    expect(() => new FFT(3)).toThrow(RangeError);
    expect(() => new FFT(0)).toThrow(RangeError);
    expect(() => new FFT(48000)).toThrow(RangeError);
  });

  it("rejects mismatched array lengths", () => {
    const fft = new FFT(8);
    expect(() => fft.transform(new Float32Array(8), new Float32Array(4))).toThrow(RangeError);
  });
});

describe("RealFFT", () => {
  it.each([2, 4, 8, 16, 64, 512])("matches the naive DFT (first N/2+1 bins) for size %i", (n) => {
    const re = signal(n);
    const expected = naiveDft(re, new Array<number>(n).fill(0));

    const rfft = new RealFFT(n);
    expect(rfft.bins).toBe(n / 2 + 1);

    const outRe = new Float32Array(rfft.bins);
    const outIm = new Float32Array(rfft.bins);
    rfft.forward(Float32Array.from(re), outRe, outIm);

    for (let k = 0; k < rfft.bins; k++) {
      expect(outRe[k]).toBeCloseTo(expected.re[k], 3);
      expect(outIm[k]).toBeCloseTo(expected.im[k], 3);
    }
  });

  it("magnitude() equals hypot of forward()'s complex bins", () => {
    const n = 64;
    const input = Float32Array.from(signal(n));
    const rfft = new RealFFT(n);

    const re = new Float32Array(rfft.bins);
    const im = new Float32Array(rfft.bins);
    rfft.forward(input, re, im);

    const mag = new Float32Array(rfft.bins);
    rfft.magnitude(input, mag);

    for (let k = 0; k < rfft.bins; k++) {
      expect(mag[k]).toBeCloseTo(Math.hypot(re[k], im[k]), 4);
    }
  });

  it("puts a single peak at the bin of a pure cosine tone", () => {
    const n = 256;
    const binK = 8; // 8 full cycles across the window → energy lands in bin 8
    const input = new Float32Array(n);
    for (let i = 0; i < n; i++) input[i] = Math.cos((2 * Math.PI * binK * i) / n);

    const rfft = new RealFFT(n);
    const mag = new Float32Array(rfft.bins);
    rfft.magnitude(input, mag);

    let peak = 0;
    for (let k = 1; k < rfft.bins; k++) if (mag[k] > mag[peak]) peak = k;
    expect(peak).toBe(binK);
  });

  it("rejects wrong-length input/output", () => {
    const rfft = new RealFFT(8);
    expect(() =>
      rfft.forward(new Float32Array(4), new Float32Array(5), new Float32Array(5)),
    ).toThrow(RangeError);
    expect(() => rfft.magnitude(new Float32Array(8), new Float32Array(3))).toThrow(RangeError);
  });
});
