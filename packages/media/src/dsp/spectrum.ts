/**
 * `SpectrumAnalyzer` — the visualizer-facing front end over {@link RealFFT}. Feed
 * it PCM and read back a frequency spectrum, deliberately modeled on the Web Audio
 * `AnalyserNode` so the API is familiar: `fftSize`, `frequencyBinCount`,
 * `smoothingTimeConstant`, `minDecibels`/`maxDecibels`, and the
 * `getFloat/ByteFrequencyData` / `getFloat/ByteTimeDomainData` getters.
 *
 * On top of that it adds {@link SpectrumAnalyzer.getBands}, which groups the raw
 * bins into a handful of log- or linear-spaced bars — the shape a bar/level
 * visualizer actually draws.
 *
 * It owns an internal ring buffer, so you can `write()` PCM in whatever chunk
 * sizes the stream delivers (see `AudioSampleData.channels` /
 * `useAudioStream`'s `frames`) and analysis always runs over the most recent
 * `fftSize` samples. Pure TS — no DOM, no React, no Web Audio — so it runs the
 * same on web and native and is unit-tested directly.
 *
 * Typical per-frame loop:
 * ```ts
 * const analyzer = new SpectrumAnalyzer({ fftSize: 1024, sampleRate: 48000 });
 * // ...on every PCM buffer:
 * analyzer.write(frames);
 * // ...on every animation frame:
 * analyzer.getBands(bars); // bars: Float32Array(32), values 0..1
 * ```
 */
import { RealFFT } from "./fft";
import { applyWindow, makeWindow, windowGain, type WindowType } from "./window";

/** Construction options for {@link SpectrumAnalyzer}. All have sensible defaults. */
export interface SpectrumAnalyzerOptions {
  /** FFT window size — power of two `>= 2`. Default `2048`. Larger = finer
   *  frequency resolution but more latency and cost. */
  fftSize?: number;
  /** Sample rate of the incoming PCM, Hz. Needed to map bins to frequencies (and
   *  thus for {@link SpectrumAnalyzer.getBands}). Default `44100`. */
  sampleRate?: number;
  /** Analysis window shape. Default `"hann"`. */
  window?: WindowType;
  /** Exponential smoothing across frames, `0..1` (like AnalyserNode). `0` = no
   *  smoothing (snappy, jittery), `0.8` = the AnalyserNode default. Default `0.8`. */
  smoothingTimeConstant?: number;
  /** dB value mapped to the bottom of the byte/band range. Default `-100`. */
  minDecibels?: number;
  /** dB value mapped to the top of the byte/band range. Default `-30`. */
  maxDecibels?: number;
}

/** How bins within a band are combined into one bar value. */
export type BandReduce = "max" | "avg";

/** Options for {@link SpectrumAnalyzer.getBands}. */
export interface BandOptions {
  /** Frequency-axis spacing across bars. `"log"` matches human pitch perception
   *  (the usual choice for music). Default `"log"`. */
  scale?: "log" | "linear";
  /** Low edge of the lowest bar, Hz. Default `20`. */
  minHz?: number;
  /** High edge of the highest bar, Hz. Default Nyquist (`sampleRate / 2`). */
  maxHz?: number;
  /** Combine the bins falling in a bar by peak or mean. `"max"` reads punchier.
   *  Default `"max"`. */
  reduce?: BandReduce;
}

const TWO_PI_SAFE = 1e-30; // amplitude floor so log10 never sees zero

/** Clamp `v` into `[lo, hi]`. */
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export class SpectrumAnalyzer {
  /** FFT window size (power of two). */
  readonly fftSize: number;
  /** Number of frequency bins exposed, `fftSize / 2` (AnalyserNode convention:
   *  DC up to but excluding Nyquist). */
  readonly frequencyBinCount: number;
  /** Sample rate the analyzer assumes for the incoming PCM, Hz. */
  readonly sampleRate: number;

  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;

  private readonly fft: RealFFT;
  private readonly windowCoeffs: Float32Array;
  private readonly windowNorm: number; // 1 / sum(window) — amplitude normalizer

  // Ring buffer of the most recent fftSize samples.
  private readonly ring: Float32Array;
  private writeIndex = 0;
  private filled = 0;

  // Per-frame scratch (allocation-free steady state).
  private readonly frame: Float32Array; // de-ringed, windowed samples
  private readonly mag: Float32Array; // raw |X| from the FFT, length bins
  /** Smoothed, amplitude-normalized magnitudes, length {@link frequencyBinCount}. */
  private readonly smoothed: Float32Array;

  // Only re-run the FFT when new samples have arrived since the last analyze().
  private dirty = true;

  constructor(options: SpectrumAnalyzerOptions = {}) {
    const fftSize = options.fftSize ?? 2048;
    this.fft = new RealFFT(fftSize); // validates power-of-two
    this.fftSize = fftSize;
    this.frequencyBinCount = fftSize >> 1;
    this.sampleRate = options.sampleRate ?? 44100;
    this.smoothingTimeConstant = clamp(options.smoothingTimeConstant ?? 0.8, 0, 1);
    this.minDecibels = options.minDecibels ?? -100;
    this.maxDecibels = options.maxDecibels ?? -30;

    this.windowCoeffs = makeWindow(options.window ?? "hann", fftSize);
    const gain = windowGain(this.windowCoeffs);
    this.windowNorm = gain > 0 ? 1 / (gain * fftSize) : 1 / fftSize;

    this.ring = new Float32Array(fftSize);
    this.frame = new Float32Array(fftSize);
    this.mag = new Float32Array(this.fft.bins);
    this.smoothed = new Float32Array(this.frequencyBinCount);
  }

  /** Hz at the center of bin `i`. */
  frequencyOfBin(i: number): number {
    return (i * this.sampleRate) / this.fftSize;
  }

  /**
   * Append PCM samples (values in `[-1, 1]`) to the ring buffer. Accepts any chunk
   * size; only the most recent {@link fftSize} samples are retained. `channelOnly`
   * is assumed mono — for interleaved/multi-channel data, mix to mono first.
   */
  write(samples: ArrayLike<number>): void {
    const n = samples.length;
    if (n === 0) return;
    const size = this.fftSize;
    const ring = this.ring;
    if (n >= size) {
      // Only the tail fits; copy the last `size` samples in order.
      for (let i = 0; i < size; i++) ring[i] = samples[n - size + i];
      this.writeIndex = 0;
      this.filled = size;
    } else {
      let w = this.writeIndex;
      for (let i = 0; i < n; i++) {
        ring[w] = samples[i];
        w = (w + 1) % size;
      }
      this.writeIndex = w;
      this.filled = Math.min(size, this.filled + n);
    }
    this.dirty = true;
  }

  /** Reset captured audio and smoothing history. */
  clear(): void {
    this.ring.fill(0);
    this.frame.fill(0);
    this.mag.fill(0);
    this.smoothed.fill(0);
    this.writeIndex = 0;
    this.filled = 0;
    this.dirty = true;
  }

  /**
   * Run windowing + FFT + smoothing over the current ring buffer, updating the
   * internal spectrum. Idempotent until the next {@link write} — every getter
   * calls this for you, so calling several getters in one frame analyzes once.
   * Call directly only if you want to force a recompute.
   */
  analyze(): void {
    if (!this.dirty) return;
    const size = this.fftSize;

    // De-ring into a linear, time-ordered frame. Before the buffer is full, the
    // oldest valid sample sits `filled` slots behind writeIndex.
    const ring = this.ring;
    const frame = this.frame;
    const start = (this.writeIndex - this.filled + size) % size;
    for (let i = 0; i < size; i++) {
      frame[i] = i < this.filled ? ring[(start + i) % size] : 0;
    }

    applyWindow(frame, frame, this.windowCoeffs);
    this.fft.magnitude(frame, this.mag);

    // Amplitude-normalize and exponentially smooth across frames.
    const tau = this.smoothingTimeConstant;
    const norm = this.windowNorm;
    const smoothed = this.smoothed;
    const mag = this.mag;
    for (let i = 0; i < this.frequencyBinCount; i++) {
      const current = mag[i] * norm;
      smoothed[i] = tau * smoothed[i] + (1 - tau) * current;
    }
    this.dirty = false;
  }

  /**
   * Fill `out` (length {@link frequencyBinCount}) with the spectrum in decibels.
   * Empty/silent bins read `-Infinity`, matching `AnalyserNode`.
   */
  getFloatFrequencyData(out: Float32Array): void {
    this.expect(out.length, this.frequencyBinCount, "getFloatFrequencyData");
    this.analyze();
    const smoothed = this.smoothed;
    for (let i = 0; i < out.length; i++) {
      const v = smoothed[i];
      out[i] = v > 0 ? 20 * Math.log10(v) : -Infinity;
    }
  }

  /**
   * Fill `out` (length {@link frequencyBinCount}) with the spectrum as bytes
   * `0..255`, scaling the `[minDecibels, maxDecibels]` dB window across the range —
   * identical semantics to `AnalyserNode.getByteFrequencyData`. This is the
   * cheapest thing to hand straight to a per-bin visualizer.
   */
  getByteFrequencyData(out: Uint8Array): void {
    this.expect(out.length, this.frequencyBinCount, "getByteFrequencyData");
    this.analyze();
    const smoothed = this.smoothed;
    const min = this.minDecibels;
    const span = this.maxDecibels - min || 1;
    for (let i = 0; i < out.length; i++) {
      const db = 20 * Math.log10(smoothed[i] + TWO_PI_SAFE);
      out[i] = clamp(Math.round(((db - min) / span) * 255), 0, 255);
    }
  }

  /**
   * Fill `out` (length {@link frequencyBinCount}) with normalized `0..1` band
   * levels — the perceptually-scaled dB window grouped into `out.length` bars
   * across the requested frequency range. This is the one a bar visualizer draws.
   */
  getBands(out: Float32Array, options: BandOptions = {}): void {
    if (out.length === 0) return;
    this.analyze();
    this.binInto(
      out,
      this.smoothed,
      this.frequencyBinCount,
      this.sampleRate / this.fftSize,
      options,
    );
  }

  /**
   * Bin an EXTERNAL magnitude spectrum into bars, skipping the windowing + FFT.
   * Use this when the spectrum was produced OFF-THREAD — a backend that fills
   * `AudioSampleData.frequency` (a web AudioWorklet, or a native vDSP FFT) — so the
   * JS side never runs the transform at all. `mags` holds the linear magnitude per
   * bin for bins `0..N/2-1` (the same scale {@link getBands} works in, so swapping
   * a producer in doesn't change the look); `out.length` bars are written. Does not
   * touch the ring buffer or smoothing.
   */
  bandsFromSpectrum(mags: ArrayLike<number>, out: Float32Array, options: BandOptions = {}): void {
    if (out.length === 0 || mags.length === 0) return;
    // mags covers DC..Nyquist over N/2 bins, so the source FFT size is 2·length.
    this.binInto(out, mags, mags.length, this.sampleRate / (2 * mags.length), options);
  }

  /** Shared band-grouping: dB-normalize `mags` and reduce each Hz band into `out`. */
  private binInto(
    out: Float32Array,
    mags: ArrayLike<number>,
    binCount: number,
    binHz: number,
    options: BandOptions,
  ): void {
    const count = out.length;
    const scale = options.scale ?? "log";
    const nyquist = binCount * binHz;
    const maxHz = clamp(options.maxHz ?? nyquist, 1, nyquist);
    // Log scale needs a strictly positive low edge.
    const minHz = clamp(options.minHz ?? 20, scale === "log" ? 1 : 0, maxHz);
    const reduce = options.reduce ?? "max";

    const min = this.minDecibels;
    const span = this.maxDecibels - min || 1;
    const ratio = maxHz / minHz;

    let prevHi = minHz;
    for (let b = 0; b < count; b++) {
      const t = (b + 1) / count;
      const loHz = prevHi;
      const hiHz = scale === "log" ? minHz * Math.pow(ratio, t) : minHz + (maxHz - minHz) * t;
      prevHi = hiHz;

      let loBin = Math.floor(loHz / binHz);
      let hiBin = Math.ceil(hiHz / binHz);
      loBin = clamp(loBin, 0, binCount - 1);
      hiBin = clamp(hiBin, loBin + 1, binCount); // exclusive upper, at least one bin

      let acc = 0;
      let n = 0;
      for (let i = loBin; i < hiBin; i++) {
        const db = 20 * Math.log10(mags[i] + TWO_PI_SAFE);
        const v = clamp((db - min) / span, 0, 1);
        if (reduce === "max") acc = v > acc ? v : acc;
        else acc += v;
        n++;
      }
      out[b] = reduce === "avg" && n > 0 ? acc / n : acc;
    }
  }

  /**
   * Fill `out` (length {@link fftSize}) with the most recent raw waveform samples,
   * `[-1, 1]`, oldest-first — like `AnalyserNode.getFloatTimeDomainData`. Useful
   * for an oscilloscope-style visualizer.
   */
  getFloatTimeDomainData(out: Float32Array): void {
    this.expect(out.length, this.fftSize, "getFloatTimeDomainData");
    const size = this.fftSize;
    const ring = this.ring;
    const start = (this.writeIndex - this.filled + size) % size;
    for (let i = 0; i < size; i++) {
      out[i] = i < this.filled ? ring[(start + i) % size] : 0;
    }
  }

  /**
   * Fill `out` (length {@link fftSize}) with the most recent waveform as bytes
   * centered on `128` — like `AnalyserNode.getByteTimeDomainData`.
   */
  getByteTimeDomainData(out: Uint8Array): void {
    this.expect(out.length, this.fftSize, "getByteTimeDomainData");
    const size = this.fftSize;
    const ring = this.ring;
    const start = (this.writeIndex - this.filled + size) % size;
    for (let i = 0; i < size; i++) {
      const v = i < this.filled ? ring[(start + i) % size] : 0;
      out[i] = clamp(Math.round(v * 128 + 128), 0, 255);
    }
  }

  private expect(actual: number, expected: number, method: string): void {
    if (actual !== expected) {
      throw new RangeError(`${method} expects an array of length ${expected}, got ${actual}`);
    }
  }
}
