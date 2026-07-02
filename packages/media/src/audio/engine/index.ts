export { type Listener, TypedEmitter } from "../../shared";
/**
 * @knitui/media/audio engine — the DOM-free / RN-free core. Pure helpers and the typed
 * emitter shared by both the web (`HTMLAudioElement`) and native (`expo-audio`)
 * controllers, plus the capability descriptors the chrome reads. No React, no
 * platform imports — unit-tested directly.
 */
export {
  NATIVE_CAPABILITIES,
  resolveWebCapabilities,
  resolveWebRuntimeCapabilities,
  WEB_CAPABILITIES,
  type WebRuntimeProbes,
} from "./capabilities";
export { formatMillis, formatTime } from "./format-time";
export { type AudioKeyAction, type AudioKeyOptions, resolveKeyAction } from "./keyboard";
export {
  amplitudeToLevel,
  DEFAULT_MAX_DB,
  DEFAULT_MIN_DB,
  meteringToLevel,
  mixChannels,
  peakOf,
  rmsOf,
} from "./levels";
export {
  bufferedEndForTime,
  bufferedFractionOf,
  createInitialState,
  mergeState,
  progressOf,
} from "./state";
