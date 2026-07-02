/**
 * Platform-free media type contract shared by BOTH media domains
 * (`@knitui/media/audio` and `@knitui/media/video`). These are the ~12 state fields,
 * the status/error/time-update shapes, the common event payloads, and the base
 * capability/source/config/metadata records that drifted between the two domains.
 *
 * Each domain's public `types.ts` `extends` these (which keeps the nominal
 * `Audio*` / `Video*` names in errors and tooltips) and adds only its own deltas,
 * so the common contract lives in exactly one place and divergence becomes
 * impossible by construction. No platform import, no React, no DOM `lib`.
 */

/* -------------------------------------------------------------------------- */
/* Status & errors                                                            */
/* -------------------------------------------------------------------------- */

/** Lifecycle status, normalized across every backend. */
export type MediaStatus = "idle" | "loading" | "readyToPlay" | "error";

/** A normalized playback error. */
export interface MediaError {
  message: string;
  /** Platform-specific error code, when available. */
  code?: string | number;
}

/**
 * The `timeUpdate` event payload. The superset of what both domains report so a
 * single consumer signature works for audio and video. (Adapters fold their
 * available fields in at the emit site — see Phase 6 of the media refactor.)
 */
export interface MediaTimeUpdate {
  currentTime: number;
  duration: number;
  bufferedPosition: number;
}

/* -------------------------------------------------------------------------- */
/* Reactive state snapshot                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The state fields common to every media controller. Each domain's
 * `*ControllerState` extends this and adds its own fields (audio: pitch / lock
 * screen / metadata; video: fullscreen / PiP / tracks).
 */
export interface BaseMediaState {
  status: MediaStatus;
  playing: boolean;
  /** Current playback position, seconds. */
  currentTime: number;
  /** Total duration, seconds. `0` until known; large/`Infinity` for live. */
  duration: number;
  /** How far the media has buffered, seconds. `-1` when unknown. */
  bufferedPosition: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  loop: boolean;
  isLive: boolean;
  /** Whether playback has reached the end of the current source. */
  ended: boolean;
  error: MediaError | null;
}

/**
 * The minimal state shape the domain-agnostic media-session core reads. Widened
 * to the full {@link BaseMediaState} — both domain states satisfy it, and the
 * session only ever reads the common fields.
 */
export type MediaSessionState = BaseMediaState;

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Typed event payloads common to both media controllers. Each domain's event map
 * extends this with its own events (audio: `sampleUpdate`; video: fullscreen /
 * PiP / tracks).
 */
export interface BaseMediaEventMap<State extends BaseMediaState> {
  /** Fired on every state change, with the fresh snapshot. */
  change: State;
  statusChange: { status: MediaStatus; error: MediaError | null };
  playingChange: { playing: boolean };
  /** Position tick — the superset both domains emit (see {@link MediaTimeUpdate}). */
  timeUpdate: MediaTimeUpdate;
  volumeChange: { volume: number; muted: boolean };
  playbackRateChange: { playbackRate: number };
  durationChange: { duration: number };
  sourceLoad: { duration: number };
  playToEnd: void;
  error: MediaError;
}

/* -------------------------------------------------------------------------- */
/* Capabilities                                                               */
/* -------------------------------------------------------------------------- */

/** The capability flags every backend reports. Domains add their own. */
export interface BaseMediaCapabilities {
  /** Programmatic volume control. `false` on iOS / mobile Safari. */
  canSetVolume: boolean;
  canSetPlaybackRate: boolean;
}

/* -------------------------------------------------------------------------- */
/* Source / config / metadata                                                 */
/* -------------------------------------------------------------------------- */

/** The fields a rich source object shares across domains. */
export interface BaseMediaSourceObject {
  /** Remote or local file URI. Exclusive with {@link assetId}. */
  uri?: string;
  /** Result of `require('./media-file')`. Native-only; the web adapter ignores it. */
  assetId?: number;
  /** Request headers (native + web with CORS; the browser controls some headers). */
  headers?: Record<string, string>;
}

/** The declarative player configuration fields common to both domains. */
export interface BaseMediaPlayerConfig {
  /** Begin playback as soon as the source is ready. */
  autoPlay?: boolean;
  /** Replay automatically on end. */
  loop?: boolean;
  /** Start muted (required by browsers for unattended autoplay). */
  muted?: boolean;
  /** Initial volume, 0..1. */
  volume?: number;
  /** Initial playback rate. */
  playbackRate?: number;
  /** Status / `timeUpdate` interval, ms (native). The unified name. */
  updateInterval?: number;
}

/** Now-playing / lock-screen metadata fields common to both domains. */
export interface BaseMediaMetadata {
  title?: string;
  artist?: string;
  artwork?: string;
}
