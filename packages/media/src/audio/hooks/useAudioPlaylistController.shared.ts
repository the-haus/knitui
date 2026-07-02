import type { MediaStore } from "../../core/react/useMediaSelector";
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
}
