/**
 * The headless, cross-platform `useAudioRecorderController` hook. Creates the
 * `expo-audio` recorder via `useAudioRecorder` (which owns its lifecycle and
 * auto-disposes it; resolves to the native module on device and `AudioRecorderWeb`
 * in the browser), wraps it in an {@link ExpoAudioRecorderController}, and mirrors
 * the snapshot into React via `useSyncExternalStore`.
 *
 * A single file works on both platforms — expo-audio's `.web` backend is a real
 * `MediaRecorder` recorder, so there is no platform split here anymore.
 */
import type { RecordingOptions as ExpoRecordingOptions } from "expo-audio";
import { useAudioRecorder } from "expo-audio";
import * as React from "react";

import type { MediaStore } from "../../core/react/useMediaSelector";
import { ExpoAudioRecorderController } from "../controller/expo-recorder-controller";
import type { RecorderControllerState } from "../controller/recorder-controller-base";
import {
  resolveRecordingOptions,
  type UseAudioRecorderOptions,
  type UseAudioRecorderResult,
} from "./useAudioRecorderController.shared";

export function useAudioRecorderController(
  options: UseAudioRecorderOptions,
): UseAudioRecorderResult {
  const resolved = resolveRecordingOptions(options);

  const recorder = useAudioRecorder(resolved as unknown as ExpoRecordingOptions);

  // One controller per recorder instance. useAudioRecorder keeps the same
  // recorder across renders; the controller follows it.
  const controller = React.useMemo(
    () => new ExpoAudioRecorderController(recorder, resolved),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recorder],
  );

  React.useEffect(() => () => controller.dispose(), [controller]);

  // Snapshot store bound to this controller. Stable while the controller is, so
  // the leaf selectors built on it never re-subscribe. `subscribeKeys` gives the
  // chrome state-level isolation: the per-frame `durationMillis` / `meteringLevel`
  // ticks wake only the Duration / LevelMeter leaves, never the record/stop
  // buttons (which read `isRecording` / `status`).
  const store = React.useMemo<MediaStore<RecorderControllerState>>(
    () => ({
      subscribe: (listener) => controller.subscribe(listener),
      getSnapshot: () => controller.state,
      subscribeKeys: (keys, listener) => controller.subscribeKeys(keys, listener),
    }),
    [controller],
  );

  return { controller, store };
}
