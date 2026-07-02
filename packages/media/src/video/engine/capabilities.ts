/**
 * Backend capability descriptors. Web (`HTMLMediaElement`) and native
 * (`expo-video`) expose different feature sets; the chrome reads these flags to
 * hide controls it cannot wire up. Pure data + a resolver — no platform imports.
 */
import { detectVolumeControllable, refineCapabilities } from "../../core/capabilities";
import type { VideoCapabilities } from "../types";

/**
 * Baseline capabilities of the browser `<video>` element. Runtime checks
 * (PiP/fullscreen availability, the mobile-Safari volume lock) refine these in
 * {@link resolveWebCapabilities}.
 */
export const WEB_CAPABILITIES: VideoCapabilities = {
  canFullscreen: true,
  canPictureInPicture: true,
  canSetVolume: true,
  canSetPlaybackRate: true,
  // The browser surfaces text tracks via <track>, but not the rich audio/video
  // track selection expo-video offers, so we keep these off for the web chrome.
  canSelectAudioTracks: false,
  canSelectSubtitleTracks: true,
  canAirPlay: false,
  canGenerateThumbnails: false,
};

/** Baseline capabilities of the expo-video native backend. */
export const NATIVE_CAPABILITIES: VideoCapabilities = {
  canFullscreen: true,
  canPictureInPicture: true,
  canSetVolume: true,
  canSetPlaybackRate: true,
  canSelectAudioTracks: true,
  canSelectSubtitleTracks: true,
  canAirPlay: true,
  canGenerateThumbnails: true,
};

/** Runtime feature probes the web resolver consumes (injected, never read here). */
export interface WebRuntimeProbes {
  /** `document.pictureInPictureEnabled`, etc. */
  pictureInPictureEnabled?: boolean;
  /** `document.fullscreenEnabled`. */
  fullscreenEnabled?: boolean;
  /**
   * Whether the platform honors programmatic volume. iOS / mobile Safari force
   * volume to hardware control and ignore `el.volume`, so the volume slider is
   * hidden there.
   */
  volumeControllable?: boolean;
}

/** Refines {@link WEB_CAPABILITIES} with the actual runtime probes. */
export function resolveWebCapabilities(probes: WebRuntimeProbes = {}): VideoCapabilities {
  return refineCapabilities(WEB_CAPABILITIES, {
    canPictureInPicture: probes.pictureInPictureEnabled,
    canFullscreen: probes.fullscreenEnabled,
    canSetVolume: probes.volumeControllable,
  });
}

/**
 * Gather the live browser probes and refine {@link WEB_CAPABILITIES}. Called by
 * the controller on web (where `expo-video` resolves to its `.web` backend); the
 * `typeof` guards keep it inert if ever evaluated off the browser.
 */
export function resolveWebRuntimeCapabilities(): VideoCapabilities {
  return resolveWebCapabilities({
    pictureInPictureEnabled:
      typeof document !== "undefined" && Boolean(document.pictureInPictureEnabled),
    fullscreenEnabled: typeof document !== "undefined" && Boolean(document.fullscreenEnabled),
    volumeControllable: detectVolumeControllable(),
  });
}
