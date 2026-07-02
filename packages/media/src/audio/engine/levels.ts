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

/**
 * Combine per-channel frame buffers into a single mixed `{ peak, rms }` envelope.
 * Mono passes straight through; stereo (and beyond) are averaged.
 */
export function mixChannels(channels: ReadonlyArray<ArrayLike<number>>): {
  peak: number;
  rms: number;
} {
  if (channels.length === 0) return { peak: 0, rms: 0 };
  let peak = 0;
  let rms = 0;
  for (const ch of channels) {
    const p = peakOf(ch);
    if (p > peak) peak = p;
    rms += rmsOf(ch);
  }
  return { peak, rms: rms / channels.length };
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
