/**
 * Cross-platform control chrome for `<Audio>`. Pure presentation built from
 * `@knitui/components` + `@knitui/icons` — no platform-specific imports — driven
 * entirely by the {@link AudioContext}. Each control is capability-gated, so a
 * control the active backend can't support (e.g. a volume slider on mobile
 * Safari) simply doesn't render.
 *
 * The parts are exported individually AND attached to `Audio` (see Audio.tsx) so
 * consumers can compose a custom bar: `<Audio controls={<Audio.ControlBar/>}>`
 * or assemble their own from `Audio.PlayPause`, `Audio.Scrubber`, etc.
 *
 * The control implementations live in {@link ./Audio.chrome.controls} (split out
 * for file size) and are re-exported here so this module's surface is unchanged.
 */
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
} from "./Audio.chrome.controls";
