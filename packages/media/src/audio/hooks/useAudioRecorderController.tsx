/**
 * The headless `useAudioRecorderController` hook — WEB. Creates the kit's own
 * {@link WebAudioRecorder} (`MediaRecorder` + `getUserMedia`), wraps it in the
 * same {@link ExpoAudioRecorderController} the native build uses, and mirrors the
 * snapshot into React. The native build creates an `expo-audio` recorder instead
 * (`useAudioRecorderController.native.tsx`).
 */
import type { AudioRecorder } from "expo-audio";
import * as React from "react";

import type { MediaStore } from "../../core/react/useMediaSelector";
import { ExpoAudioRecorderController } from "../controller/expo-recorder-controller";
import type { RecorderControllerState } from "../controller/recorder-controller-base";
import { WebAudioRecorder, webRecordingOptions } from "../web/web-audio-recorder";
import {
  resolveRecordingOptions,
  type UseAudioRecorderOptions,
  type UseAudioRecorderResult,
} from "./useAudioRecorderController.shared";

export function useAudioRecorderController(
  options: UseAudioRecorderOptions,
): UseAudioRecorderResult {
  const resolved = resolveRecordingOptions(options);
  const key = JSON.stringify(webRecordingOptions(resolved));

  // One recorder per distinct option set, like expo's `useAudioRecorder`.
  const recorder = React.useMemo(() => new WebAudioRecorder(JSON.parse(key)), [key]);
  React.useEffect(() => () => recorder.release(), [recorder]);

  const controller = React.useMemo(
    () => new ExpoAudioRecorderController(recorder as unknown as AudioRecorder, resolved),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recorder],
  );

  React.useEffect(() => () => controller.dispose(), [controller]);

  // Snapshot store bound to this controller (see the native file for why the
  // per-frame keys are isolated).
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
