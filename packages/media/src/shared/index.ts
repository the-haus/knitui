/**
 * `@knitui/media` shared internals — dependency-free building blocks shared by both
 * media subpaths (`@knitui/media/audio`, `@knitui/media/video`): a typed event emitter
 * and the clock-string formatter. No platform, no React.
 */
export { type Listener, TypedEmitter } from "./emitter";
export { formatTime } from "./format-time";
export {
  applyMediaKeyAction,
  type MediaKeyAction,
  type MediaKeyOptions,
  type MediaKeyState,
  type MediaKeyTarget,
  resolveMediaKeyAction,
} from "./media-keyboard";
export {
  booleanOr,
  bufferedEndForTime,
  bufferedFractionOf,
  createBaseState,
  mergeState,
  numberOr,
  progressOf,
} from "./media-state";
export type {
  BaseMediaCapabilities,
  BaseMediaEventMap,
  BaseMediaMetadata,
  BaseMediaPlayerConfig,
  BaseMediaSourceObject,
  BaseMediaState,
  MediaError,
  MediaSessionState,
  MediaStatus,
  MediaTimeUpdate,
} from "./media-types";
