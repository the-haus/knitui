/**
 * The provider-agnostic player controller contract — the single seam the design
 * turns on. The {@link ../controller/expo-controller} backend (over `expo-audio`,
 * which resolves to its native module on device and its `.web` backend in the
 * browser) implements `AudioController`, so the hooks, context and chrome program
 * against ONE API regardless of platform.
 *
 * `BaseAudioController` is a thin specialization of the generic
 * {@link BaseMediaController} (`../../core/media-controller-base`): it inherits the
 * state store, typed emitter, subscription, `setState` and the derived commands,
 * and adds ONLY the audio deltas — the waveform silence-gate and the lock-screen
 * / sampling abstract surface. Concrete adapters extend it and implement the
 * imperative surface against their platform.
 */
import { BaseMediaController, type MediaController } from "../../core/media-controller-base";
import { createInitialState } from "../engine";
import type {
  AudioCapabilities,
  AudioControllerEventMap,
  AudioControllerState,
  AudioLockScreenOptions,
  AudioMetadata,
  AudioSampleData,
  AudioSource,
  PitchCorrectionQuality,
} from "../types";

/** The imperative + reactive API shared by every player backend. */
export interface AudioController extends MediaController<
  AudioControllerState,
  AudioCapabilities,
  AudioControllerEventMap,
  AudioSource
> {
  /** Pitch-corrected rate changes when supported. */
  setPlaybackRate(rate: number, pitchCorrection?: PitchCorrectionQuality): void;

  /* lock screen / now playing (no-op where unsupported) */
  setActiveForLockScreen(
    active: boolean,
    metadata?: AudioMetadata,
    options?: AudioLockScreenOptions,
  ): void;
  updateLockScreenMetadata(metadata: AudioMetadata): void;
  clearLockScreenControls(): void;

  /* sampling (waveform). No-op / unsupported where `capabilities.canSample` is false. */
  setSamplingEnabled(enabled: boolean): void;
}

/**
 * Waveform-sample emission gate. Goal: stop spinning the whole chain (reduce →
 * smooth → rebuild → repaint) when there's genuinely nothing to show — i.e. during
 * SILENCE — while letting every audible frame through so the visualizers animate
 * the full waveform smoothly.
 *
 * It gates on a silence FLOOR, not a peak/rms dead-band. A dead-band was wrong here:
 * peak and rms are aggregates over the backend's large, OVERLAPPING analysis window
 * (≈2048 samples), so they barely move frame-to-frame during sustained playback —
 * even though the waveform shape the visualizer draws keeps changing. Dead-banding
 * them suppressed frames the visualizers needed and made playback choppy. So: any
 * audible frame passes; only sustained silence (below the floor, past a short tail
 * that lets a downstream smoother decay to rest) is dropped.
 */
const SAMPLE_SILENCE_FLOOR = 0.01; // ≈ -40 dBFS peak/rms; below this is "silence"
const SAMPLE_SILENCE_TAIL_MS = 400; // keep emitting this long after the last audible frame

/** Monotonic-ish clock for the emit gate; falls back where `performance` is absent. */
function sampleClock(): number {
  const perf = (globalThis as { performance?: { now(): number } }).performance;
  return perf && typeof perf.now === "function" ? perf.now() : Date.now();
}

/**
 * Audio specialization of {@link BaseMediaController}: adds the waveform silence
 * gate and the lock-screen / sampling abstract surface.
 */
export abstract class BaseAudioController
  extends BaseMediaController<
    AudioControllerState,
    AudioCapabilities,
    AudioControllerEventMap,
    AudioSource
  >
  implements AudioController
{
  // Emit-gate state: when the last AUDIBLE frame arrived (see SAMPLE_SILENCE_FLOOR).
  private _lastAudibleSampleMs = 0;

  constructor(initial?: Partial<AudioControllerState>) {
    super(createInitialState, initial);
  }

  /**
   * Convenience for adapters: publish a waveform sample, through the silence gate.
   * Any AUDIBLE frame (peak/rms ≥ the silence floor) always passes — so the
   * visualizers see every frame and animate smoothly. Only SUSTAINED silence (past
   * a short tail that lets a downstream smoother decay to rest) is dropped, so a
   * paused/quiet player stops spinning the chain.
   */
  protected emitSample(sample: AudioSampleData): void {
    const t = sampleClock();
    if (sample.peak >= SAMPLE_SILENCE_FLOOR || sample.rms >= SAMPLE_SILENCE_FLOOR) {
      this._lastAudibleSampleMs = t;
    } else if (t - this._lastAudibleSampleMs > SAMPLE_SILENCE_TAIL_MS) {
      return; // sustained silence — stop flooding the chain
    }
    this.emitEvent("sampleUpdate", sample);
  }

  /* Abstract audio surface --------------------------------------------------- */
  abstract setPlaybackRate(rate: number, pitchCorrection?: PitchCorrectionQuality): void;
  abstract setActiveForLockScreen(
    active: boolean,
    metadata?: AudioMetadata,
    options?: AudioLockScreenOptions,
  ): void;
  abstract updateLockScreenMetadata(metadata: AudioMetadata): void;
  abstract clearLockScreenControls(): void;
  abstract setSamplingEnabled(enabled: boolean): void;
}
