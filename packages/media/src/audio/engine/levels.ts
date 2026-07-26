/**
 * Pure PCM level math for meters. DOM-free / RN-free so it can be unit-tested
 * directly and shared by the web (Web Audio analyser) and native
 * (`useAudioSampleListener`) sampling paths.
 *
 * Frame values are PCM samples in `[-1, 1]` (0 = silence).
 */

/** dB floor mapped to 0. Shared with the web analyser so platforms match. */
export const DEFAULT_MIN_DB = -70;
/** dB ceiling mapped to 1. Shared with the web analyser so platforms match. */
export const DEFAULT_MAX_DB = -12;

/** Peak (max absolute) amplitude of a frame buffer, in `[0, 1]`. */
export function peakOf(frames: ArrayLike<number>): number {
  let peak = 0;
  for (let i = 0; i < frames.length; i++) {
    const a = Math.abs(frames[i]);
    if (a > peak) peak = a;
  }
  return peak > 1 ? 1 : peak;
}

/** Root-mean-square (perceptual loudness) of a frame buffer, in `[0, 1]`. */
export function rmsOf(frames: ArrayLike<number>): number {
  const n = frames.length;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const v = frames[i];
    sum += v * v;
  }
  const rms = Math.sqrt(sum / n);
  return rms > 1 ? 1 : rms;
}

/** The mixed envelope of a multi-channel frame. See {@link mixChannels}. */
export interface MixedLevels {
  /** Peak absolute amplitude across all channels, 0..1. */
  peak: number;
  /** Mean of the per-channel RMS values, 0..1. */
  rms: number;
}

/**
 * Combine per-channel frame buffers into a single mixed `{ peak, rms }` envelope.
 * Mono passes straight through; stereo (and beyond) are averaged.
 *
 * Peak and RMS are FUSED into ONE pass per channel (rather than `peakOf` +
 * `rmsOf`, which walked every frame twice). This is the hottest loop in the
 * package: the web sampler posts a 2048-sample window per display frame, so the
 * two-pass version read ~245k typed-array elements/second on a stereo source —
 * halved here for a byte-identical result (the per-channel clamps are applied at
 * exactly the same points as `peakOf`/`rmsOf` apply them).
 *
 * Pass `out` to write into a caller-owned result object instead of allocating one
 * per call — the per-frame sampling path does, so a 60 Hz meter allocates nothing.
 */
export function mixChannels(
  channels: ReadonlyArray<ArrayLike<number>>,
  out?: MixedLevels,
): MixedLevels {
  const result = out ?? { peak: 0, rms: 0 };
  const channelCount = channels.length;
  if (channelCount === 0) {
    result.peak = 0;
    result.rms = 0;
    return result;
  }
  let peak = 0;
  let rmsSum = 0;
  for (let c = 0; c < channelCount; c++) {
    const frames = channels[c];
    const n = frames.length;
    let chPeak = 0;
    let squares = 0;
    for (let i = 0; i < n; i++) {
      const v = frames[i];
      const a = v < 0 ? -v : v;
      if (a > chPeak) chPeak = a;
      squares += v * v;
    }
    if (chPeak > 1) chPeak = 1;
    if (chPeak > peak) peak = chPeak;
    let chRms = n === 0 ? 0 : Math.sqrt(squares / n);
    if (chRms > 1) chRms = 1;
    rmsSum += chRms;
  }
  result.peak = peak;
  result.rms = rmsSum / channelCount;
  return result;
}

/**
 * Convert a linear amplitude `[0, 1]` to a normalized decibel level `[0, 1]`,
 * where `floorDb` (default -60 dB) maps to 0 and 0 dB maps to 1. Useful for a
 * meter that should feel perceptually linear rather than bunching near silence.
 */
export function amplitudeToLevel(amplitude: number, floorDb = -60): number {
  if (amplitude <= 0) return 0;
  const db = 20 * Math.log10(amplitude);
  if (db <= floorDb) return 0;
  if (db >= 0) return 1;
  return 1 - db / floorDb;
}

/**
 * Convert expo-audio's `metering` value (a dBFS reading, typically in
 * `[-160, 0]`) to a normalized `[0, 1]` level for a recording meter.
 */
export function meteringToLevel(metering: number | undefined, floorDb = -60): number {
  if (metering == null || !Number.isFinite(metering)) return 0;
  if (metering >= 0) return 1;
  if (metering <= floorDb) return 0;
  return 1 - metering / floorDb;
}
