/**
 * Pure PCM decoder for the live microphone stream. DOM-free / RN-free so it can
 * be unit-tested directly and shared by the web (Web Audio time-domain bytes are
 * pre-decoded to float) and native (`expo-audio` raw PCM `ArrayBuffer`) paths.
 *
 * The engine is locked, so this stream-local helper lives here rather than in
 * `src/engine`. It produces plain `number[]` frames in `[-1, 1]` that
 * {@link peakOf}/{@link rmsOf}/{@link mixChannels} from the engine consume.
 */

/** PCM sample encoding, mirroring expo-audio's `AudioStreamEncoding`. */
export type PcmEncoding = "float32" | "int16";

/** Normalization divisor for signed 16-bit PCM (`int16` range is -32768..32767). */
const INT16_SCALE = 32768;

/**
 * Decode a raw interleaved PCM `ArrayBuffer` into float samples in `[-1, 1]`.
 *
 * - `'float32'` — read as a `Float32Array` (already normalized) and copied out.
 * - `'int16'`   — read as an `Int16Array` and normalized by dividing by 32768.
 *
 * Trailing bytes that don't form a complete sample are ignored. For multi-channel
 * audio the result stays interleaved (`[L, R, L, R, …]`); callers that need
 * per-channel envelopes can mix it as a single buffer (the level math treats the
 * interleaved stream as one mixed signal, which is what a meter wants).
 */
export function decodePcm(buffer: ArrayBuffer, encoding: PcmEncoding): number[] {
  if (encoding === "float32") {
    const count = Math.floor(buffer.byteLength / 4);
    const view = new Float32Array(buffer, 0, count);
    const out = new Array<number>(count);
    for (let i = 0; i < count; i++) out[i] = view[i];
    return out;
  }
  // int16
  const count = Math.floor(buffer.byteLength / 2);
  const view = new Int16Array(buffer, 0, count);
  const out = new Array<number>(count);
  for (let i = 0; i < count; i++) out[i] = view[i] / INT16_SCALE;
  return out;
}
