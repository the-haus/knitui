/**
 * Window functions for spectral analysis. Multiplying a PCM frame by a window
 * before the FFT tapers its edges to zero, which suppresses the spectral leakage
 * you'd otherwise get from the implicit discontinuity at the frame boundary — the
 * difference between a clean, readable visualizer and a smeared one.
 *
 * Pure TypeScript, no platform deps. Coefficients are precomputed once via
 * {@link makeWindow} and reused every frame by {@link applyWindow}.
 */

/**
 * Supported window shapes, from least to most aggressive sidelobe suppression
 * (and correspondingly wider main lobe):
 *
 * - `"rectangular"` — no window (a no-op). Sharpest frequency resolution, worst
 *   leakage. Fine for already-periodic test tones.
 * - `"hann"` — the sensible default for a music/voice visualizer. Good leakage
 *   suppression, simple.
 * - `"hamming"` — slightly lower nearest sidelobe than Hann, small DC pedestal.
 * - `"blackman"` — stronger suppression, wider main lobe.
 * - `"blackmanHarris"` — 4-term, the strongest suppression here; use when you
 *   need a very clean noise floor and can spare resolution.
 */
export type WindowType = "rectangular" | "hann" | "hamming" | "blackman" | "blackmanHarris";

/**
 * Build a length-`size` window of the given shape as a `Float32Array` of
 * coefficients in `[0, 1]`. Compute this once (per FFT size) and hand it to
 * {@link applyWindow} every frame.
 */
export function makeWindow(type: WindowType, size: number): Float32Array {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`window size must be a positive integer, got ${size}`);
  }
  const w = new Float32Array(size);
  if (type === "rectangular" || size === 1) {
    w.fill(1);
    return w;
  }
  // Periodic (DFT-even) windows: denominator is N, not N-1 — the correct form for
  // spectral analysis (the N-1 form is for filter design).
  const n1 = (2 * Math.PI) / size;
  const n2 = (4 * Math.PI) / size;
  const n3 = (6 * Math.PI) / size;
  for (let i = 0; i < size; i++) {
    switch (type) {
      case "hann":
        w[i] = 0.5 - 0.5 * Math.cos(n1 * i);
        break;
      case "hamming":
        w[i] = 0.54 - 0.46 * Math.cos(n1 * i);
        break;
      case "blackman":
        w[i] = 0.42 - 0.5 * Math.cos(n1 * i) + 0.08 * Math.cos(n2 * i);
        break;
      case "blackmanHarris":
        w[i] =
          0.35875 -
          0.48829 * Math.cos(n1 * i) +
          0.14128 * Math.cos(n2 * i) -
          0.01168 * Math.cos(n3 * i);
        break;
    }
  }
  return w;
}

/**
 * Coherent gain of a window: the mean of its coefficients. A windowed signal's
 * amplitude is scaled by this factor, so dividing the spectrum by it restores
 * true amplitudes. {@link import("./spectrum").SpectrumAnalyzer} applies this
 * automatically.
 */
export function windowGain(window: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < window.length; i++) sum += window[i];
  return window.length === 0 ? 1 : sum / window.length;
}

/**
 * Write `input[i] * window[i]` into `out`. `out` may alias `input` for an
 * in-place window. All three arrays must be the same length.
 */
export function applyWindow(out: Float32Array, input: Float32Array, window: Float32Array): void {
  const n = window.length;
  if (input.length !== n || out.length !== n) {
    throw new RangeError("applyWindow expects input, out and window of equal length");
  }
  for (let i = 0; i < n; i++) out[i] = input[i] * window[i];
}
