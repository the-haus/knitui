/**
 * Shared, platform-free contract for the live microphone PCM stream hook
 * (`useAudioStream`). The hook is platform-split (`.tsx` = web Web Audio /
 * `.native.tsx` = native `expo-audio`); both implementations honor this shape so
 * callers — and the `<LiveAudioMeter>` example — stay platform-agnostic.
 *
 * No DOM types, no `expo-audio` types: the web build excludes expo-audio and the
 * native build never touches the Web Audio API.
 */

/** PCM sample encoding requested from the microphone. Mirrors expo-audio. */
export type AudioStreamEncoding = "float32" | "int16";

/** A normalized live level reading derived from one captured PCM buffer. */
export interface AudioStreamLevel {
  /** Peak absolute amplitude of the buffer, `0..1`. */
  peak: number;
  /** Root-mean-square (loudness) of the buffer, `0..1`. */
  rms: number;
}

/**
 * One captured PCM buffer, normalized across both backends. `data` is the raw
 * interleaved bytes; `frames` are the decoded float samples in `[-1, 1]` so a
 * caller can visualize without re-decoding.
 */
export interface AudioStreamBufferData {
  /** Raw interleaved PCM bytes (float32 = 4 B/sample, int16 = 2 B/sample). */
  data: ArrayBuffer;
  /** Actual sample rate, Hz. */
  sampleRate: number;
  /** Actual channel count in this buffer (always `1` on web — mono-only). */
  channels: number;
  /** Seconds since the stream started. */
  timestamp: number;
  /** Decoded float samples, `[-1, 1]` (interleaved for multi-channel). */
  frames: number[];
}

/** Options for {@link useAudioStream}. */
export interface UseAudioStreamOptions {
  /** Desired sample rate, Hz. Default backend-specific (native 48000). */
  sampleRate?: number;
  /**
   * Channel count. `1` mono, `2` stereo. Default `1`.
   *
   * Honored on native. IGNORED on web: that backend captures with no
   * `channelCount` constraint and down-mixes to mono, so it always delivers ONE
   * channel — the returned/emitted `channels` reports `1` there no matter what
   * is requested. Read it (don't assume this value) before de-interleaving.
   */
  channels?: number;
  /** PCM encoding. Default `'float32'`. Honored on native; web is always float. */
  encoding?: AudioStreamEncoding;
  /** Begin capturing as soon as the hook mounts (requests permission). */
  autoStart?: boolean;
  /** Called for every captured PCM buffer. */
  onBuffer?: (buffer: AudioStreamBufferData) => void;
  /** Called with the level envelope for every captured buffer. */
  onLevel?: (level: AudioStreamLevel) => void;
}

/**
 * Result of {@link useAudioStream}. Platform-agnostic. The native hook adds an
 * extra `levelShared` field (a reanimated `SharedValue<number>` carrying the rms
 * level for UI-thread worklet animation); it is documented on the native
 * implementation and absent on web.
 */
export interface UseAudioStreamResult {
  /** Begin capturing (resolves once the mic permission + stream are live). */
  start(): Promise<void>;
  /** Stop capturing and release the mic. */
  stop(): void;
  /** Whether the stream is currently capturing. */
  isStreaming: boolean;
  /** Actual sample rate being delivered, Hz (`0` before `start`). */
  sampleRate: number;
  /**
   * Actual channel count being delivered (`0` before `start`). May be LESS than
   * the requested `channels` — web always delivers `1`.
   */
  channels: number;
  /** Throttled latest level (drives React re-renders for a meter UI). */
  level: AudioStreamLevel;
}

/** The zero level, reused as the initial state on both platforms. */
export const ZERO_LEVEL: AudioStreamLevel = { peak: 0, rms: 0 };

/** How often (ms) the hooks flush the level into React state (~30 fps). */
export const LEVEL_THROTTLE_MS = 33;
