/**
 * @knitui/media/video — a cross-platform video component for the Tamagui kit.
 *
 * One backend behind one isolated contract ({@link VideoController}): `expo-video`,
 * which resolves to its native module on device and to its `.web` backend (an
 * `HTMLVideoElement` + the web `VideoView`) in the browser. The hooks, context and
 * chrome program against the single contract regardless of platform.
 *
 * Public surface (exports are kept alphabetical by source path per the repo's
 * `sort-exports` lint rule):
 *   - <Video> + compound parts (Video.PlayPause / .Scrubber / .Fullscreen / …)
 *   - useVideoController() — the headless hook (same shape on both platforms)
 *   - the VideoContext + useVideo() for fully custom chrome
 *   - the isolated type contract (VideoController, state, capabilities, tracks…)
 *   - pure engine helpers (formatTime, progressOf…) for advanced/headless use
 *   - the store contract (MediaStore) + selector hooks for custom chrome
 */

export { type MediaStore, shallowEqual, useMediaSelector } from "../core/react/useMediaSelector";
export { videoHostName } from "../provider/context";
export type { VideoController } from "./controller/video-controller-base";
export {
  bufferedFractionOf,
  formatTime,
  NATIVE_CAPABILITIES,
  progressOf,
  resolveKeyAction,
  type VideoKeyAction,
  type VideoKeyOptions,
  WEB_CAPABILITIES,
} from "./engine";
export { useVideoController } from "./hooks/useVideoController";
export type {
  UseVideoControllerOptions,
  UseVideoControllerResult,
  VideoSurfaceConfig,
} from "./hooks/useVideoController.shared";
export { createVideoEngine, getSharedVideoSession, useVideoEngine } from "./session/video-engine";
export type { VideoEngine } from "./session/video-engine.shared";
export type {
  AudioTrack,
  SubtitleTrack,
  VideoCapabilities,
  VideoContentFit,
  VideoContentType,
  VideoControllerEventMap,
  VideoControllerState,
  VideoDRMOptions,
  VideoDRMType,
  VideoError,
  VideoEventType,
  VideoMetadata,
  VideoPlayerConfig,
  VideoRange,
  VideoSource,
  VideoSourceObject,
  VideoStatus,
  VideoTrack,
  VideoTrackSize,
} from "./types";
export { Video } from "./Video";
export {
  BigPlayButton,
  BufferingOverlay,
  CaptionOverlay,
  ControlBar,
  ErrorOverlay,
  FullscreenButton,
  MuteButton,
  PiPButton,
  PlaybackRateMenu,
  PlayPauseButton,
  Scrubber,
  SeekButton,
  type SeekButtonProps,
  SettingsMenu,
  TimeCurrent,
  TimeDisplay,
  TimeDuration,
  VolumeControl,
  VolumeSlider,
  type VolumeSliderProps,
} from "./Video.chrome";
export {
  useVideo,
  useVideoState,
  VideoContext,
  type VideoContextValue,
  type VideoProps,
  type VideoSize,
  type VideoStyles,
  type VideoTextTrack,
} from "./Video.shared";
