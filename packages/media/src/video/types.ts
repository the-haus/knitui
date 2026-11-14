/**
 * @knitui/media/video — the isolated, provider-agnostic type contract.
 *
 * This module is the heart of the hybrid design: it defines ONE vocabulary that
 * both backends implement — the browser `HTMLMediaElement` adapter on web and the
 * `expo-video` adapter on native. It is deliberately free of any platform import
 * (no `expo-video` types, no DOM `lib` types). That isolation is what lets the
 * web build exclude expo-video entirely and the native build never touch the DOM,
 * while the chrome and hooks program against a single, stable surface.
 *
 * The shape is a trimmed, normalized projection of the expo-video SDK 56 API
 * (see docs/expo-video.md) so the native adapter is a thin pass-through, yet
 * everything here is equally implementable from the browser media element.
 *
 * The platform-free fields shared with `@knitui/media/audio` live in
 * `../shared/media-types`; the interfaces here `extend` those bases and add only
 * the video-specific deltas.
 */

import type {
  BaseMediaCapabilities,
  BaseMediaEventMap,
  BaseMediaMetadata,
  BaseMediaPlayerConfig,
  BaseMediaSourceObject,
  BaseMediaState,
  MediaError,
  MediaStatus,
} from "../shared";

/* -------------------------------------------------------------------------- */
/* Source                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Content type of a source. `auto` lets the backend infer it from the URI.
 * `dash`/`smoothStreaming` are Android-only in expo-video and unsupported by the
 * browser `<video>` element; the web adapter ignores them.
 */
export type VideoContentType = "auto" | "progressive" | "hls" | "dash" | "smoothStreaming";

/** DRM scheme. Android: clearkey/playready/widevine. iOS: fairplay. */
export type VideoDRMType = "clearkey" | "fairplay" | "playready" | "widevine";

/** DRM configuration applied while loading a protected source. Native-only. */
export interface VideoDRMOptions {
  type: VideoDRMType;
  licenseServer: string;
  headers?: Record<string, string>;
  contentId?: string;
  certificateUrl?: string;
  base64CertificateData?: string;
  multiKey?: boolean;
}

/** Now-playing / lock-screen metadata. Native-only. */
export interface VideoMetadata extends BaseMediaMetadata {}

/** The rich source object. Prefer this when you need more than a bare URI. */
export interface VideoSourceObject extends BaseMediaSourceObject {
  /** Streaming format hint. */
  contentType?: VideoContentType;
  /** Now-playing metadata (native-only). */
  metadata?: VideoMetadata;
  /** DRM options (native-only). */
  drm?: VideoDRMOptions;
  /** Whether the native player should cache the asset (native-only). */
  useCaching?: boolean;
}

/**
 * Anything that can be loaded. `string` is a URI, `number` is a bundled asset
 * (native), `null` is "no source / detach".
 */
export type VideoSource = string | number | VideoSourceObject | null;

/* -------------------------------------------------------------------------- */
/* Status & errors                                                            */
/* -------------------------------------------------------------------------- */

/** Lifecycle status, normalized across both backends. */
export type VideoStatus = MediaStatus;

/** A normalized playback error. */
export type VideoError = MediaError;

/** How the video frame is scaled inside its container. */
export type VideoContentFit = "contain" | "cover" | "fill";

/* -------------------------------------------------------------------------- */
/* Tracks                                                                     */
/* -------------------------------------------------------------------------- */

export interface VideoTrackSize {
  width: number;
  height: number;
}

export type VideoRange = "sdr" | "hlg" | "pq";

export interface AudioTrack {
  /** Stable identifier used to select the track. */
  id: string;
  label: string;
  language: string;
  isDefault?: boolean;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  isDefault?: boolean;
}

/**
 * An external (sidecar) subtitle/caption file supplied via the `<Video>`
 * `textTracks` prop. On web it becomes a `<track>` element the browser decodes;
 * on native — where `expo-video` can only read tracks embedded in the manifest —
 * the kit fetches and parses it and renders the cues with its own overlay.
 */
export interface VideoTextTrack {
  /** VTT/SRT file URI. May be a remote URL or a `data:` URI. */
  src: string;
  label: string;
  language?: string;
  kind?: "subtitles" | "captions";
  /** Show this track by default once the source is ready. */
  default?: boolean;
}

export interface VideoTrack {
  id: string;
  size: VideoTrackSize;
  averageBitrate?: number | null;
  peakBitrate?: number | null;
  frameRate?: number | null;
  mimeType?: string | null;
  videoRange?: VideoRange;
}

/* -------------------------------------------------------------------------- */
/* Capabilities                                                               */
/* -------------------------------------------------------------------------- */

/**
 * What the active backend can actually do. Web (`HTMLMediaElement`) and native
 * (`expo-video`) differ substantially, so the chrome reads these flags to hide
 * controls it cannot wire up (e.g. a volume slider on mobile Safari, which
 * ignores programmatic volume).
 */
/** Buffer tuning. Every field is optional; an omitted one keeps its current value. */
export interface VideoBufferOptions {
  /** How much media to buffer ahead of the playhead, in seconds. `0` lets iOS decide. */
  forwardDuration?: number;
  /** Seconds that must be buffered before playback resumes after a stall. Android only. */
  minForPlayback?: number;
  /** Upper bound on buffered bytes; `0` or `null` lets the player decide. Android only. */
  maxBytes?: number | null;
  /** Reach `forwardDuration` even when that passes `maxBytes`. Android only. */
  prioritizeTime?: boolean;
  /** Delay the start of playback to avoid stalling later. Default `true`. iOS only. */
  waitToMinimizeStalling?: boolean;
}

/**
 * Playback behaviour beyond the transport controls. Set declaratively on `<Video>`
 * / `useVideoController`, or at any time with `controller.setPlaybackOptions`. Only
 * the fields you pass change. Each is gated by a capability, and is a no-op where
 * the platform has no such control.
 */
export interface VideoPlaybackOptions {
  /**
   * The largest picture an adaptive stream may select, e.g. `{ width: 1280, height:
   * 720 }` to save data. `null` removes the cap. (`capabilities.canLimitResolution`)
   */
  maxResolution?: VideoTrackSize | null;
  /** Keep the screen on while this video plays. Default `true`. (`canKeepAwake`) */
  keepAwake?: boolean;
  /**
   * Keep playing when the app goes to the background. Default `false`. Needs
   * `backgroundPlayback` in the config plugin. (`canPlayInBackground`)
   */
  backgroundPlayback?: boolean;
  /** Buffer tuning; `null` goes back to the player's own buffering. (`canTuneBuffer`) */
  buffer?: VideoBufferOptions | null;
  /**
   * How this video's sound sits with other audio, from this app or another:
   * `"auto"` (the platform default: take over), `"mixWithOthers"`, `"duckOthers"`
   * or `"doNotMix"`. `<MediaProvider exclusive={false}>` sets `"mixWithOthers"`
   * for you. Native only.
   */
  audioMixingMode?: VideoAudioMixingMode;
}

export type VideoAudioMixingMode = "auto" | "mixWithOthers" | "duckOthers" | "doNotMix";

export interface VideoCapabilities extends BaseMediaCapabilities {
  canFullscreen: boolean;
  canPictureInPicture: boolean;
  canSelectAudioTracks: boolean;
  canSelectSubtitleTracks: boolean;
  /** AirPlay / external playback (iOS-only). */
  canAirPlay: boolean;
  /** `generateThumbnails` (native-only). */
  canGenerateThumbnails: boolean;
  /** Cap the resolution an adaptive stream may select (`maxResolution`). */
  canLimitResolution: boolean;
  /** Hold the screen awake during playback (`keepAwake`). */
  canKeepAwake: boolean;
  /** Continue playing with the app in the background (`backgroundPlayback`). */
  canPlayInBackground: boolean;
  /** Tune buffering (`buffer`). */
  canTuneBuffer: boolean;
}

/* -------------------------------------------------------------------------- */
/* Reactive state snapshot                                                    */
/* -------------------------------------------------------------------------- */

/**
 * An immutable snapshot of everything the UI needs to render. The controller
 * recomputes it on every backend event and publishes it to subscribers; the
 * hook mirrors it into React state.
 */
export interface VideoControllerState extends BaseMediaState {
  fullscreen: boolean;
  pictureInPicture: boolean;
  availableAudioTracks: AudioTrack[];
  availableSubtitleTracks: SubtitleTrack[];
  availableVideoTracks: VideoTrack[];
  /** Currently active audio track id, or `null`. */
  audioTrackId: string | null;
  /** Currently active subtitle track id, or `null`. */
  subtitleTrackId: string | null;
  /**
   * The caption text to paint right now, or `null` for none. Driven by the
   * native custom-caption pipeline (sidecar `textTracks`); stays `null` on web,
   * where the browser paints `<track>` cues itself.
   */
  activeCueText: string | null;
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Typed event payloads emitted by a controller. `statusChange` carries the full
 * snapshot for convenience; `error` carries the normalized error.
 */
export interface VideoControllerEventMap extends BaseMediaEventMap<VideoControllerState> {
  fullscreenChange: { fullscreen: boolean };
  pictureInPictureChange: { pictureInPicture: boolean };
  tracksChange: {
    availableAudioTracks: AudioTrack[];
    availableSubtitleTracks: SubtitleTrack[];
    availableVideoTracks: VideoTrack[];
  };
}

export type VideoEventType = keyof VideoControllerEventMap;

/* -------------------------------------------------------------------------- */
/* Player configuration                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Initial / declarative player configuration shared by the hook and the
 * `<Video>` component. These map to settable controller properties.
 */
export interface VideoPlayerConfig extends BaseMediaPlayerConfig, VideoPlaybackOptions {
  /**
   * Seconds the controller waits between `timeUpdate` emissions (native).
   * @deprecated Use {@link BaseMediaPlayerConfig.updateInterval}. Folded in Phase 6.
   */
  timeUpdateInterval?: number;
}
