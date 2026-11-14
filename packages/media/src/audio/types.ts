/**
 * @knitui/media/audio — the isolated, provider-agnostic type contract.
 *
 * This module is the heart of the hybrid design: it defines ONE vocabulary that
 * both backends implement — the browser `HTMLAudioElement` adapter on web and
 * the `expo-audio` adapter on native. It is deliberately free of any platform
 * import (no `expo-audio` types, no DOM `lib` types). That isolation is what lets
 * the web build exclude expo-audio entirely and the native build never touch the
 * DOM, while the chrome and hooks program against a single, stable surface.
 *
 * The shape is a trimmed, normalized projection of the expo-audio SDK 56 API
 * (see docs/expo-audio.md) so the native adapter is a thin pass-through, yet
 * everything here is equally implementable from the browser media element.
 *
 * The platform-free fields shared with `@knitui/media/video` live in
 * `../shared/media-types`; the interfaces here `extend` those bases and add only
 * the audio-specific deltas.
 */

import type {
  BaseMediaCapabilities,
  BaseMediaEventMap,
  BaseMediaMetadata,
  BaseMediaPlayerConfig,
  BaseMediaSourceObject,
  BaseMediaState,
  MediaError,
  MediaSampleData,
  MediaStatus,
} from "../shared";

/* -------------------------------------------------------------------------- */
/* Source                                                                     */
/* -------------------------------------------------------------------------- */

/** The rich source object. Prefer this when you need more than a bare URI. */
export interface AudioSourceObject extends BaseMediaSourceObject {
  /** Display name for track queues / playlist UI. */
  name?: string;
}

/**
 * Anything that can be loaded. `string` is a URI, `number` is a bundled asset
 * (native), `null` is "no source / detach".
 */
export type AudioSource = string | number | AudioSourceObject | null;

/* -------------------------------------------------------------------------- */
/* Status & errors                                                            */
/* -------------------------------------------------------------------------- */

/** Lifecycle status, normalized across both backends. */
export type AudioStatus = MediaStatus;

/** @deprecated Use {@link AudioStatus}. Retained as an alias for one cycle. */
export type AudioPlaybackStatus = AudioStatus;

/** A normalized playback error. */
export type AudioError = MediaError;

/** Quality of iOS pitch correction applied when the playback rate changes. */
export type PitchCorrectionQuality = "low" | "medium" | "high";

/* -------------------------------------------------------------------------- */
/* Now-playing / lock-screen metadata                                         */
/* -------------------------------------------------------------------------- */

/**
 * Now-playing metadata for the lock screen / Control Center (native) or the
 * `MediaSession` now-playing card (web). Mirrors expo-audio's `AudioMetadata`.
 */
export interface AudioMetadata extends BaseMediaMetadata {
  albumTitle?: string;
  /** @deprecated Use {@link BaseMediaMetadata.artwork}. Read for one cycle by the lock-screen adapter. */
  artworkUrl?: string;
}

/** Options that tune the lock-screen / now-playing controls. */
export interface AudioLockScreenOptions {
  /** Hide the duration/scrub bar and disable seeking (for live streams). */
  isLiveStream?: boolean;
  showSeekBackward?: boolean;
  showSeekForward?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Capabilities                                                               */
/* -------------------------------------------------------------------------- */

/**
 * What the active player backend can actually do. Web (`HTMLAudioElement`) and
 * native (`expo-audio`) differ, so the chrome reads these flags to hide controls
 * it cannot wire up (e.g. a volume slider on mobile Safari, which ignores
 * programmatic volume).
 */
export interface AudioCapabilities extends BaseMediaCapabilities {
  /** Pitch-corrected rate changes (`preservesPitch` / `shouldCorrectPitch`). */
  canCorrectPitch: boolean;
  /** Lock-screen / now-playing controls (native lock screen / web `MediaSession`). */
  canLockScreen: boolean;
}

/* -------------------------------------------------------------------------- */
/* Reactive state snapshot                                                    */
/* -------------------------------------------------------------------------- */

/**
 * An immutable snapshot of everything the UI needs to render. The controller
 * recomputes it on every backend event and publishes it to subscribers; the
 * hook mirrors it into React state.
 */
export interface AudioControllerState extends BaseMediaState {
  /** Whether pitch is corrected for a changed rate. */
  shouldCorrectPitch: boolean;
  isBuffering: boolean;
  isLoaded: boolean;
  /** Whether this player currently owns the lock-screen / now-playing controls. */
  lockScreenActive: boolean;
  /** The now-playing metadata last set on this player, or `null`. */
  metadata: AudioMetadata | null;
}

/* -------------------------------------------------------------------------- */
/* Sampling                                                                   */
/* -------------------------------------------------------------------------- */

/** A normalized sample for visualization (see {@link MediaSampleData}). */
export type AudioSampleData = MediaSampleData;

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

/** Typed event payloads emitted by a player controller. */
export interface AudioControllerEventMap extends BaseMediaEventMap<AudioControllerState> {}

export type AudioEventType = keyof AudioControllerEventMap;

/* -------------------------------------------------------------------------- */
/* Player configuration                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Initial / declarative player configuration shared by the hook and the
 * `<Audio>` component. These map to settable controller properties.
 */
export interface AudioPlayerConfig extends BaseMediaPlayerConfig {
  /** Correct pitch when the rate changes. Default `true`. */
  shouldCorrectPitch?: boolean;
}
