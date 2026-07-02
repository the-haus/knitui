/**
 * Allocation-free radix-2 FFT — the DSP core that powers a frequency-spectrum
 * audio visualizer. Pure TypeScript: no DOM, no `react-native`, no Web Audio. It
 * runs identically on web and native and is unit-tested directly (see
 * `fft.test.ts`), the same way the PCM {@link decodePcm} helper is.
 *
 * Two primitives live here:
 *
 * - {@link FFT} — a reusable in-place complex FFT. All work tables (the
 *   twiddle factors and the bit-reversal permutation) are precomputed once in the
 *   constructor, so a steady-state visualizer running at 60 fps allocates **zero**
 *   bytes per frame.
 *
 * - {@link RealFFT} — a real-input FFT. Audio samples are real, so this uses the
 *   classic "pack two reals into one complex" trick to run a half-length
 *   {@link FFT} (~2× faster, ~½ the memory) and recombines the result into the
 *   `N/2 + 1` non-redundant bins. This is the one a visualizer should reach for.
 *
 * Both operate on `Float32Array`s to match the PCM stream's sample format and for
 * cache-friendly throughput.
 */

/** Throw if `size` is not an integer power of two `>= 2`. */
function assertPow2(size: number, label: string): void {
  if (!Number.isInteger(size) || size < 1 || (size & (size - 1)) !== 0) {
    throw new RangeError(`${label} must be a power of two >= 1, got ${size}`);
  }
}

/** Build the bit-reversal permutation table for a length-`size` FFT. */
function bitReversalTable(size: number): Uint32Array {
  const bits = Math.log2(size);
  const table = new Uint32Array(size);
  for (let i = 0; i < size; i++) {
    let rev = 0;
    for (let b = 0; b < bits; b++) {
      rev = (rev << 1) | ((i >>> b) & 1);
    }
    table[i] = rev;
  }
  return table;
}

/**
 * Reusable in-place complex FFT (decimation-in-time, radix-2). Construct once per
 * transform size; call {@link transform} as often as you like.
 *
 * The transform is **in place**: the `re`/`im` arrays you pass in hold the result
 * on return. Both must be exactly {@link size} long. The convention is the
 * standard forward DFT, `X[k] = Σ x[n]·e^(-2πi·kn/N)`; pass {@link inverse} for
 * the conjugated, `1/N`-scaled inverse.
 */
export class FFT {
  /** Transform length (a power of two). */
  readonly size: number;

  private readonly cos: Float32Array;
  private readonly sin: Float32Array;
  private readonly reversal: Uint32Array;

  constructor(size: number) {
    assertPow2(size, "FFT size");
    this.size = size;
    const half = size >> 1;
    // Forward twiddle factors W_N^i = e^(-2πi·i/N), precomputed for i = 0..N/2-1.
    this.cos = new Float32Array(half);
    this.sin = new Float32Array(half);
    for (let i = 0; i < half; i++) {
      const angle = (-2 * Math.PI * i) / size;
      this.cos[i] = Math.cos(angle);
      this.sin[i] = Math.sin(angle);
    }
    this.reversal = bitReversalTable(size);
  }

  /**
   * In-place forward (or {@link inverse}) FFT. `re` and `im` carry the real and
   * imaginary parts; both must be {@link size} long and both are overwritten with
   * the transform. For real input, zero-fill `im` first — but prefer
   * {@link RealFFT} for that, it's ~2× faster.
   */
  transform(re: Float32Array, im: Float32Array, inverse = false): void {
    const n = this.size;
    if (re.length !== n || im.length !== n) {
      throw new RangeError(`FFT.transform expects arrays of length ${n}`);
    }

    // 1. Bit-reversal reordering (decimation in time).
    const rev = this.reversal;
    for (let i = 0; i < n; i++) {
      const j = rev[i];
      if (j > i) {
        const tr = re[i];
        re[i] = re[j];
        re[j] = tr;
        const ti = im[i];
        im[i] = im[j];
        im[j] = ti;
      }
    }

    // 2. Iterative butterflies. The inverse transform reuses the forward twiddle
    //    table with a flipped imaginary sign, then scales by 1/N at the end.
    const cos = this.cos;
    const sin = this.sin;
    const isign = inverse ? -1 : 1;
    for (let len = 2; len <= n; len <<= 1) {
      const half = len >> 1;
      const step = n / len; // index stride into the twiddle table for this stage
      for (let base = 0; base < n; base += len) {
        for (let k = 0, t = 0; k < half; k++, t += step) {
          const c = cos[t];
          const s = sin[t] * isign;
          const a = base + k;
          const b = a + half;
          const tre = re[b] * c - im[b] * s;
          const tim = re[b] * s + im[b] * c;
          re[b] = re[a] - tre;
          im[b] = im[a] - tim;
          re[a] += tre;
          im[a] += tim;
        }
      }
    }

    // 3. Normalize the inverse so FFT∘IFFT is the identity.
    if (inverse) {
      const inv = 1 / n;
      for (let i = 0; i < n; i++) {
        re[i] *= inv;
        im[i] *= inv;
      }
    }
  }
}

/**
 * Real-input FFT optimized for audio. Real signals have a Hermitian-symmetric
 * spectrum, so only the first `N/2 + 1` bins are unique — and we can compute them
 * with a half-length complex {@link FFT} by packing the even-indexed samples into
 * the real part and the odd-indexed into the imaginary part, then recombining.
 *
 * Construct once for your `fftSize`; call {@link forward} per frame. Like
 * {@link FFT} it owns all scratch and allocates nothing per call.
 */
export class RealFFT {
  /** Real input length (a power of two). */
  readonly size: number;
  /** Number of unique output bins, `size / 2 + 1` (DC … Nyquist inclusive). */
  readonly bins: number;

  private readonly fft: FFT;
  private readonly half: number;
  // Half-length packed-complex scratch reused across calls.
  private readonly zr: Float32Array;
  private readonly zi: Float32Array;
  // Recombination twiddles e^(-2πi·k/N) for k = 0..N/2.
  private readonly wr: Float32Array;
  private readonly wi: Float32Array;
  // Complex-spectrum scratch reused by magnitude() so it allocates nothing.
  private readonly magRe: Float32Array;
  private readonly magIm: Float32Array;

  constructor(size: number) {
    assertPow2(size, "RealFFT size");
    this.size = size;
    this.bins = (size >> 1) + 1;
    this.half = size >> 1;
    this.fft = new FFT(this.half);
    this.zr = new Float32Array(this.half);
    this.zi = new Float32Array(this.half);
    this.wr = new Float32Array(this.bins);
    this.wi = new Float32Array(this.bins);
    this.magRe = new Float32Array(this.bins);
    this.magIm = new Float32Array(this.bins);
    for (let k = 0; k < this.bins; k++) {
      const angle = (-2 * Math.PI * k) / size;
      this.wr[k] = Math.cos(angle);
      this.wi[k] = Math.sin(angle);
    }
  }

  /**
   * Forward real FFT. `input` must be exactly {@link size} long; `outRe`/`outIm`
   * receive the `N/2 + 1` complex bins (both must be {@link bins} long). Use
   * {@link RealFFT.magnitude} or compute `Math.hypot(outRe[k], outIm[k])` yourself
   * to get the spectrum a visualizer draws.
   */
  forward(input: Float32Array, outRe: Float32Array, outIm: Float32Array): void {
    const n = this.size;
    const m = this.half;
    if (input.length !== n) {
      throw new RangeError(`RealFFT.forward expects input of length ${n}`);
    }
    if (outRe.length !== this.bins || outIm.length !== this.bins) {
      throw new RangeError(`RealFFT.forward expects output of length ${this.bins}`);
    }

    // Pack: z[j] = input[2j] + i·input[2j+1], a half-length complex signal.
    const zr = this.zr;
    const zi = this.zi;
    for (let j = 0; j < m; j++) {
      zr[j] = input[2 * j];
      zi[j] = input[2 * j + 1];
    }
    this.fft.transform(zr, zi);

    // Recombine Z = FFT_{N/2}(z) into the real spectrum X[0..N/2].
    //   E[k] = (Z[k] + conj(Z[N/2-k])) / 2          (even-sample DFT)
    //   O[k] = (Z[k] - conj(Z[N/2-k])) / (2i)       (odd-sample DFT)
    //   X[k] = E[k] + W_N^k · O[k]
    const wr = this.wr;
    const wi = this.wi;
    for (let k = 0; k < this.bins; k++) {
      const a = k % m;
      const b = (m - k) % m;
      const zra = zr[a];
      const zia = zi[a];
      const zrb = zr[b];
      const zib = zi[b];

      const er = (zra + zrb) * 0.5;
      const ei = (zia - zib) * 0.5;
      // O = ((zra - zrb) + i(zia + zib)) / (2i) = (zia + zib)/2 - i(zra - zrb)/2
      const or = (zia + zib) * 0.5;
      const oi = -(zra - zrb) * 0.5;

      const c = wr[k];
      const s = wi[k];
      // W·O with W = c + i·s (s already carries the -sin sign).
      const wor = c * or - s * oi;
      const woi = c * oi + s * or;

      outRe[k] = er + wor;
      outIm[k] = ei + woi;
    }
  }

  /**
   * Convenience over {@link forward}: writes `Math.hypot(re, im)` for every bin
   * into `outMag` (length {@link bins}). This is the raw, *unnormalized* magnitude
   * spectrum; {@link import("./spectrum").SpectrumAnalyzer} handles windowing,
   * normalization, smoothing and dB conversion on top of it.
   */
  magnitude(input: Float32Array, outMag: Float32Array): void {
    if (outMag.length !== this.bins) {
      throw new RangeError(`RealFFT.magnitude expects output of length ${this.bins}`);
    }
    const re = this.magRe;
    const im = this.magIm;
    this.forward(input, re, im);
    for (let k = 0; k < this.bins; k++) {
      outMag[k] = Math.hypot(re[k], im[k]);
    }
  }
}
