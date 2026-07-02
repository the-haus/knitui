import type { MediaStore } from "../../core/react/useMediaSelector";
import type { AudioController } from "../controller/audio-controller-base";
/**
 * Shared contract for the headless `useAudioController` hook. The hook is
 * cross-platform (it joins the shared engine, whose backend `expo-audio` resolves
 * per platform), so callers are platform-agnostic.
 */
import type { AudioControllerState, AudioPlayerConfig, AudioSource } from "../types";

export interface UseAudioControllerOptions extends AudioPlayerConfig {
  /** The audio to load. */
  source: AudioSource;
  /** Enable real-time waveform sampling (gated by `capabilities.canSample`). */
  sampling?: boolean;
  /**
   * Stable identity for the shared-engine registry. Defaults to a `React.useId()`
   * so every `<Audio>` is its own player; pass an explicit `id` to make two
   * mounts address the SAME player slot.
   */
  id?: string;
}

export interface UseAudioControllerResult {
  /** The imperative + reactive controller. Stable across renders. */
  controller: AudioController;
  /** Per-player snapshot store; read slices via `useMediaSelector`. Stable. */
  store: MediaStore<AudioControllerState>;
}
