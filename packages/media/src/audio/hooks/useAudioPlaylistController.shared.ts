import type { MediaStore } from "../../core/react/useMediaSelector";
import type { AudioController } from "../controller/audio-controller-base";
import type {
  AudioPlaylistController,
  AudioPlaylistLoopMode,
  AudioPlaylistState,
} from "../controller/playlist-controller-base";
/**
 * Shared contract for the headless `useAudioPlaylistController` hook. The hook is
 * cross-platform (a queue over the shared engine, whose `expo-audio` backend
 * resolves per platform), so callers are platform-agnostic.
 */
import type { AudioSource } from "../types";

export interface UseAudioPlaylistControllerOptions {
  /** Initial playlist sources. */
  sources?: AudioSource[];
  /** Initial loop mode. Default `'none'`. */
  loop?: AudioPlaylistLoopMode;
  /** Initial volume, 0..1. */
  volume?: number;
  /** Start muted. */
  muted?: boolean;
  /** Initial playback rate. */
  playbackRate?: number;
  /** Status update interval, ms (native). */
  updateInterval?: number;
}

export interface UseAudioPlaylistControllerResult {
  controller: AudioPlaylistController;
  /** Snapshot store; read slices via `useMediaSelector`. Stable. */
  store: MediaStore<AudioPlaylistState>;
  /**
   * The shared-engine SLOT this playlist drives — the single-track
   * {@link AudioController} underneath the queue. Stable for the hook's lifetime.
   *
   * Exposed for the surfaces the playlist contract itself can't serve, because
   * they belong to the PLAYER rather than the queue. The motivating one is
   * spectrum sampling: `useAudioSpectrum` needs `setSamplingEnabled` +
   * `sampleUpdate`, which live on the single-track controller only — a playlist
   * has no notion of PCM. Without this, a visualizer over a playlist had no
   * supported way to reach the sampler at all (the facade is private on the
   * controller, and its slot id is an internal `useId`).
   *
   *   const { controller, store, player } = useAudioPlaylistController({ sources });
   *   useAudioSpectrum(player, { onFrame: (b) => viz.current?.push(b) });
   *
   * Drive PLAYBACK through `controller` — calling transport methods here moves
   * the slot without telling the queue, so the two snapshots disagree.
   */
  player: AudioController;
}
