/**
 * Shared contract for the headless `useAudioRecorderController` hook. The hook is
 * a single cross-platform module (over expo-audio's `AudioRecorder`, which
 * resolves per platform), so callers are platform-agnostic.
 */
import type { MediaStore } from "../../core/react/useMediaSelector";
import type {
  AudioRecorderController,
  RecorderControllerState,
  RecordingOptions,
} from "../controller/recorder-controller-base";

export interface UseAudioRecorderOptions {
  /** The full recording options (use a `RECORDING_PRESETS` value as a base). */
  options: RecordingOptions;
  /**
   * Force-enable input metering. Defaults to the preset's `isMeteringEnabled`.
   * Folded into `options.isMeteringEnabled` before the controller is built.
   */
  meteringEnabled?: boolean;
}

export interface UseAudioRecorderResult {
  /** The imperative + reactive controller. Stable across renders. */
  controller: AudioRecorderController;
  /** Snapshot store; read slices via `useMediaSelector`. Stable. */
  store: MediaStore<RecorderControllerState>;
}

/** Apply the `meteringEnabled` override onto the recording options. */
export function resolveRecordingOptions(opts: UseAudioRecorderOptions): RecordingOptions {
  const metering = opts.meteringEnabled ?? opts.options.isMeteringEnabled;
  if (metering === opts.options.isMeteringEnabled) return opts.options;
  return { ...opts.options, isMeteringEnabled: metering };
}
