/**
 * @knitui/media/audio — a hybrid, cross-platform audio kit for the Tamagui kit.
 *
 * One isolated controller contract per surface, backed by `expo-audio`, which
 * resolves to its native module on device and its `.web` backend (over
 * `HTMLAudioElement` + Web Audio / MediaSession / MediaRecorder) in the browser.
 * The only remaining hand-written platform split is `useAudioStream` (real-time
 * PCM capture, `.tsx` web / `.native.tsx` native).
 *
 * Public surface (exports are kept alphabetical by source path per the repo's
 * `sort-exports` lint rule):
 *   - <Audio>          — single-track player + compound parts (Audio.PlayPause …)
 *   - <AudioPlaylist>  — queue player + parts (AudioPlaylist.Next …)
 *   - <AudioRecorder>  — recorder + parts (AudioRecorder.Record …)
 *   - <LiveAudioMeter> / useAudioStream — real-time PCM microphone capture
 *   - headless hooks (useAudioController / …PlaylistController / …RecorderController)
 *   - the audio session API (setAudioMode / preload / permissions)
 *   - the isolated type contracts + pure engine helpers
 */

export { Audio } from "./Audio";
export {
  BufferingIndicator,
  ControlBar,
  ErrorOverlay,
  LoopButton,
  MuteButton,
  PlaybackRateMenu,
  PlayPauseButton,
  Scrubber,
  SeekButton,
  type SeekButtonProps,
  TimeCurrent,
  TimeDisplay,
  TimeDuration,
  VolumeControl,
  VolumeSlider,
  type VolumeSliderProps,
} from "./Audio.chrome";
export {
  type AudioContextValue,
  type AudioProps,
  type AudioSize,
  type AudioStyles,
  useAudio,
} from "./Audio.shared";
export type { AudioController } from "./controller/audio-controller-base";
export type {
  AudioPlaylistCapabilities,
  AudioPlaylistController,
  AudioPlaylistEventMap,
  AudioPlaylistEventType,
  AudioPlaylistLoopMode,
  AudioPlaylistState,
  AudioPlaylistTrack,
} from "./controller/playlist-controller-base";
export type {
  AudioRecorderController,
  AudioRecorderStatus,
  AudioRecordingInput,
  RecorderCapabilities,
  RecorderControllerEventMap,
  RecorderControllerState,
  RecorderEventType,
  RecordingStartOptions,
} from "./controller/recorder-controller-base";
export {
  amplitudeToLevel,
  type AudioKeyAction,
  type AudioKeyOptions,
  bufferedFractionOf,
  formatMillis,
  formatTime,
  meteringToLevel,
  mixChannels,
  NATIVE_CAPABILITIES,
  peakOf,
  progressOf,
  resolveKeyAction,
  rmsOf,
  WEB_CAPABILITIES,
} from "./engine";
export {
  RECORDING_PRESETS,
  type RecordingOptions,
  type RecordingPresetName,
  resolveWebMimeType,
  WEB_MIME_TYPES,
} from "./engine/recording-presets";
export { useAudioController } from "./hooks/useAudioController";
export type {
  UseAudioControllerOptions,
  UseAudioControllerResult,
} from "./hooks/useAudioController.shared";
export { useAudioPlaylistController } from "./hooks/useAudioPlaylistController";
export type {
  UseAudioPlaylistControllerOptions,
  UseAudioPlaylistControllerResult,
} from "./hooks/useAudioPlaylistController.shared";
export { useAudioRecorderController } from "./hooks/useAudioRecorderController";
export {
  resolveRecordingOptions,
  type UseAudioRecorderOptions,
  type UseAudioRecorderResult,
} from "./hooks/useAudioRecorderController.shared";
export { useAudioSpectrum, type UseAudioSpectrumOptions } from "./hooks/useAudioSpectrum";
export { useAudioStream } from "./hooks/useAudioStream";
export type {
  AudioStreamBufferData,
  AudioStreamEncoding,
  AudioStreamLevel,
  UseAudioStreamOptions,
  UseAudioStreamResult,
} from "./hooks/useAudioStream.shared";
export { AudioPlaylist } from "./playlist/AudioPlaylist";
export {
  type AudioPlaylistContextValue,
  type AudioPlaylistProps,
  type AudioPlaylistStyles,
  useAudioPlaylistContext,
} from "./playlist/AudioPlaylist.shared";
export { AudioRecorder } from "./recorder/AudioRecorder";
export {
  type AudioRecorderContextValue,
  type AudioRecorderProps,
  type AudioRecorderSize,
  type AudioRecorderStyles,
  useAudioRecorder,
} from "./recorder/AudioRecorder.shared";
export { createAudioEngine, getSharedAudioSession, useAudioEngine } from "./session/audio-engine";
export type { AudioEngine } from "./session/audio-engine.shared";
export {
  requestNotificationPermissions,
  setAudioMode,
  setIsAudioActive,
} from "./session/audio-mode";
export type {
  AudioModeConfig,
  AudioSessionApi,
  InterruptionMode,
  NotificationPermissionResult,
} from "./session/audio-mode.shared";
export { getRecordingPermissions, requestRecordingPermissions } from "./session/permissions";
export type { AudioPermissionResponse, AudioPermissionStatus } from "./session/permissions.shared";
export {
  clearAllPreloadedSources,
  clearPreloadedSource,
  getPreloadedSources,
  preload,
} from "./session/preload";
export type { PreloadOptions } from "./session/preload.shared";
export { LiveAudioMeter, type LiveAudioMeterProps } from "./stream/LiveAudioMeter";
export type {
  AudioCapabilities,
  AudioControllerEventMap,
  AudioControllerState,
  AudioError,
  AudioEventType,
  AudioLockScreenOptions,
  AudioMetadata,
  AudioPlaybackStatus,
  AudioPlayerConfig,
  AudioSampleData,
  AudioSource,
  AudioSourceObject,
  AudioStatus,
  PitchCorrectionQuality,
} from "./types";
