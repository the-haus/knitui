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
}

/**
 * Audio specialization of {@link BaseMediaController}: adds the lock-screen
 * abstract surface. Sampling and its silence gate live in the shared base.
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
  constructor(initial?: Partial<AudioControllerState>) {
    super(createInitialState, initial);
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
}
