/**
 * Backend capability descriptors. Web (`HTMLAudioElement` + Web Audio) and
 * native (`expo-audio`) expose different feature sets; the chrome reads these
 * flags to hide controls it cannot wire up. Pure data + a resolver — no platform
 * imports.
 */
import { detectVolumeControllable, refineCapabilities } from "../../core/capabilities";
import type { AudioCapabilities } from "../types";

/**
 * Baseline capabilities of the browser `HTMLAudioElement`. Runtime checks (the
 * mobile-Safari volume lock, `MediaSession` availability, Web Audio support)
 * refine these in {@link resolveWebCapabilities}.
 */
export const WEB_CAPABILITIES: AudioCapabilities = {
  canSetVolume: true,
  canSetPlaybackRate: true,
  canCorrectPitch: true,
  canSample: true,
  canLockScreen: true,
};

/** Baseline capabilities of the expo-audio native backend. */
export const NATIVE_CAPABILITIES: AudioCapabilities = {
  canSetVolume: true,
  canSetPlaybackRate: true,
  canCorrectPitch: true,
  canSample: true,
  canLockScreen: true,
};

/** Runtime feature probes the web resolver consumes (injected, never read here). */
export interface WebRuntimeProbes {
  /**
   * Whether the platform honors programmatic volume. iOS / mobile Safari force
   * volume to hardware control and ignore `el.volume`, so the volume slider is
   * hidden there.
   */
  volumeControllable?: boolean;
  /** `'mediaSession' in navigator`. */
  mediaSessionAvailable?: boolean;
  /** Whether the Web Audio API (`AudioContext`) is available for sampling. */
  webAudioAvailable?: boolean;
}

/** Refines {@link WEB_CAPABILITIES} with the actual runtime probes. */
export function resolveWebCapabilities(probes: WebRuntimeProbes = {}): AudioCapabilities {
  return refineCapabilities(WEB_CAPABILITIES, {
    canSetVolume: probes.volumeControllable,
    canLockScreen: probes.mediaSessionAvailable,
    canSample: probes.webAudioAvailable,
  });
}

/**
 * Gather the live browser probes and refine {@link WEB_CAPABILITIES}. Called by
 * the controller on web (where `expo-audio` resolves to its `.web` backend); the
 * `typeof` guards keep it inert if ever evaluated off the browser.
 */
export function resolveWebRuntimeCapabilities(): AudioCapabilities {
  return resolveWebCapabilities({
    volumeControllable: detectVolumeControllable(),
    mediaSessionAvailable: typeof navigator !== "undefined" && "mediaSession" in navigator,
    webAudioAvailable:
      typeof globalThis !== "undefined" &&
      typeof (globalThis as { AudioContext?: unknown }).AudioContext !== "undefined",
  });
}
