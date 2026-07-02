/**
 * The standard FFT → visualizer input contract, and an efficient mapper to
 * produce it.
 *
 * A `SpectrumFrame` is the ONE format every audio source agrees on: a row of
 * `0..1` magnitudes, low→high frequency, log-spaced and dB-normalized so it looks
 * the same regardless of FFT size or source. It's just a `number[]`, so the
 * visualizer's `push(frame)` / `target` SharedValue accept it directly — no new
 * API. The producer owns the rate: run the FFT whenever you like (even 10×/s) and
 * push a frame; the visualizer's time-based easing synthesizes 60 fps motion
 * between frames (see `useLevelTransition` + `docs/skia-reanimated-animation.md`).
 *
 * Why a MAPPER and not just a function: turning raw FFT bins into log-spaced bands
 * means computing band edges (a `log`/`exp` per band) and grouping bins. Those
 * edges only depend on `bins`/`bands`, never on the data — so `createSpectrumMapper`
 * computes them ONCE and the returned function just scans bins and writes into a
 * REUSED output buffer. A low-rate producer can therefore map each frame with zero
 * allocation and no repeated edge math. `fftToBands` is a one-shot convenience that
 * builds a throwaway mapper.
 */

/**
 * A row of `0..1` magnitudes, low→high frequency — the standard visualizer input.
 * Pass straight to `<AudioVisualizer>`'s `push()` handle or `target` SharedValue.
 */
export type SpectrumFrame = number[];

/** How the input magnitudes are scaled. */
export type SpectrumInput =
  /** Raw linear magnitudes (e.g. from a bare FFT). Converted to dB internally. */
  | "linear"
  /** Already in decibels (e.g. `AnalyserNode.getFloatFrequencyData`). */
  | "db"
  /** `0..255` bytes (`AnalyserNode.getByteFrequencyData`) — already perceptual. */
  | "byte";

export interface SpectrumMapperOptions {
  /** Number of FFT magnitude bins the mapper will be fed. */
  bins: number;
  /** Number of output bands (visualizer bars). */
  bands: number;
  /** How input magnitudes are scaled. Default `"linear"`. */
  input?: SpectrumInput;
  /** dB mapped to `0` (floor). Default `-90`. Ignored for `"byte"`. */
  minDb?: number;
  /** dB mapped to `1` (ceiling). Default `-10`. Ignored for `"byte"`. */
  maxDb?: number;
  /** First bin to include (skip DC / sub-bass rumble). Default `1`. */
  minBin?: number;
  /** Last bin to include (exclusive upper bound clamps to `bins`). Default `bins`. */
  maxBin?: number;
}

/** A reusable FFT→`SpectrumFrame` mapper. Edges precomputed; output buffer reused. */
export type SpectrumMapper = (mags: ArrayLike<number>, out?: SpectrumFrame) => SpectrumFrame;

const DEFAULT_MIN_DB = -90;
const DEFAULT_MAX_DB = -10;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Build a reusable mapper that turns a row of FFT magnitude `bins` into a
 * `bands`-long `SpectrumFrame`. The per-band bin ranges (log-spaced) are computed
 * ONCE here; the returned function only scans bins and normalizes, writing into the
 * passed `out` buffer (or its own reused one) — allocation-free when you reuse it.
 */
export function createSpectrumMapper(opts: SpectrumMapperOptions): SpectrumMapper {
  const bands = Math.max(1, Math.floor(opts.bands));
  const bins = Math.max(1, Math.floor(opts.bins));
  const input: SpectrumInput = opts.input ?? "linear";
  const minDb = opts.minDb ?? DEFAULT_MIN_DB;
  const maxDb = opts.maxDb ?? DEFAULT_MAX_DB;
  const dbRange = maxDb - minDb || 1;
  const lo = Math.max(1, Math.min(bins - 1, Math.floor(opts.minBin ?? 1)));
  const hi = Math.max(lo + 1, Math.min(bins, Math.floor(opts.maxBin ?? bins)));

  // Precompute each band's [start, end) bin range, log-spaced across [lo, hi).
  const starts = new Int32Array(bands);
  const ends = new Int32Array(bands);
  const logLo = Math.log(lo);
  const logHi = Math.log(hi);
  let prev = lo;
  for (let b = 0; b < bands; b++) {
    const edge = Math.exp(logLo + ((b + 1) / bands) * (logHi - logLo));
    const start = Math.floor(prev);
    const end = Math.min(hi, Math.max(start + 1, Math.floor(edge)));
    starts[b] = start;
    ends[b] = end;
    prev = end;
  }

  // Reused buffer for the no-`out` path so casual callers still don't churn the GC.
  const owned = new Array<number>(bands).fill(0);

  const toUnit =
    input === "byte"
      ? (v: number): number => clamp01(v / 255)
      : input === "db"
        ? (v: number): number => clamp01((v - minDb) / dbRange)
        : (v: number): number => {
            const db = 20 * Math.log10(v <= 0 ? 1e-9 : v);
            return clamp01((db - minDb) / dbRange);
          };

  return (mags: ArrayLike<number>, out?: SpectrumFrame): SpectrumFrame => {
    const dst = out ?? owned;
    for (let b = 0; b < bands; b++) {
      let peak = 0;
      const end = ends[b];
      for (let i = starts[b]; i < end; i++) {
        const u = toUnit(mags[i] ?? 0);
        if (u > peak) peak = u;
      }
      dst[b] = peak;
    }
    return dst;
  };
}

/**
 * One-shot convenience: map a single row of FFT magnitudes to a `SpectrumFrame`.
 * For a steady feed, prefer `createSpectrumMapper` once and reuse it (this builds a
 * throwaway mapper per call).
 */
export function fftToBands(
  mags: ArrayLike<number>,
  opts: Omit<SpectrumMapperOptions, "bins"> & { bins?: number },
): SpectrumFrame {
  return createSpectrumMapper({ bins: opts.bins ?? mags.length, ...opts })(mags, []);
}
