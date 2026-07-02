/**
 * Shared contract for the headless `useVideoController` hook. The hook is
 * cross-platform (it joins the shared engine, whose backend `expo-video` resolves
 * per platform), so callers are platform-agnostic.
 */
import type { MediaStore } from "../../core/react/useMediaSelector";
import type { VideoController } from "../controller/video-controller-base";
import type {
  VideoContentFit,
  VideoControllerState,
  VideoPlayerConfig,
  VideoSource,
  VideoTextTrack,
} from "../types";

export interface UseVideoControllerOptions extends VideoPlayerConfig {
  /** The media to load. */
  source: VideoSource;
  /**
   * External (sidecar) caption files. The controller fetches, parses, and
   * renders them with the kit's own overlay (`expo-video` can't load sidecar
   * tracks itself, on either platform).
   */
  textTracks?: VideoTextTrack[];
  /**
   * Stable identity for the shared-engine registry. Defaults to a `React.useId()`
   * so every `<Video>` is its own player; pass an explicit `id` to make two
   * mounts address the SAME player slot.
   */
  id?: string;
  /**
   * Surface-only props stowed on the registry descriptor so the shared engine's
   * single `VideoView` (teleported into the active player) renders correctly.
   */
  surface?: VideoSurfaceConfig;
}

/** Surface-only props for the shared `VideoView` (content fit, controls, captions). */
export interface VideoSurfaceConfig {
  contentFit?: VideoContentFit;
  nativeControls?: boolean;
  allowsPictureInPicture?: boolean;
  textTracks?: VideoTextTrack[];
}

export interface UseVideoControllerResult {
  /** The imperative + reactive controller. Stable across renders. */
  controller: VideoController;
  /** Per-player snapshot store; read slices via `useMediaSelector`. Stable. */
  store: MediaStore<VideoControllerState>;
}
