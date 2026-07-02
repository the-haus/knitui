/**
 * `<AudioRecorder>` — the composed, cross-platform audio recorder.
 *
 * A SINGLE root works on both platforms because the backend lives in
 * `useAudioRecorderController`, a cross-platform wrapper over expo-audio's
 * `AudioRecorder` (native module on device, `AudioRecorderWeb` in the browser).
 * This root wires the controller into the {@link AudioRecorderContext}, renders
 * the control bar, and forwards callbacks.
 *
 * Composition: the chrome parts are attached as `AudioRecorder.Record`,
 * `AudioRecorder.Duration`, … so a custom bar can be passed via `controls`.
 */
import * as React from "react";

import { slotStyles, type TamaguiElement, withStaticProperties } from "@knitui/core";

import { RECORDING_PRESETS } from "../engine/recording-presets";
import { useAudioRecorderController } from "../hooks/useAudioRecorderController";
import {
  ControlBar,
  Duration,
  InputSelect,
  LevelMeter,
  PauseResumeButton,
  RecordButton,
  StopButton,
} from "./AudioRecorder.chrome";
import {
  AUDIO_RECORDER_SLOT_KEYS,
  AudioRecorderContext,
  type AudioRecorderContextValue,
  type AudioRecorderProps,
  RecorderControlBarFrame,
  RecorderFrame,
  useAudioRecorder,
} from "./AudioRecorder.shared";

function AudioRecorderRoot(props: AudioRecorderProps): React.ReactElement {
  const {
    options = RECORDING_PRESETS.HIGH_QUALITY,
    meteringEnabled,
    size = "md",
    controls = true,
    label = "Audio recorder",
    getController,
    onStop,
    onRecordingChange,
    styles,
    testID,
    width = "100%",
    maxWidth,
  } = props;

  const { controller, store } = useAudioRecorderController({ options, meteringEnabled });

  /* Forward declarative callbacks. ----------------------------------------- */
  React.useEffect(() => {
    getController?.(controller);
  }, [controller, getController]);

  React.useEffect(() => {
    const unsubs = [
      onStop && controller.on("recordingComplete", (p) => onStop(p.uri)),
      onRecordingChange &&
        controller.on("recordingChange", (p) => onRecordingChange(p.isRecording)),
    ].filter(Boolean) as Array<() => void>;
    return () => unsubs.forEach((u) => u());
  }, [controller, onStop, onRecordingChange]);

  /* Focusable, labelled region (web). -------------------------------------- */
  const [frameEl, setFrameEl] = React.useState<HTMLElement | null>(null);
  const setFrameRef = React.useCallback((node: TamaguiElement | null) => {
    setFrameEl(node && "addEventListener" in node ? (node as unknown as HTMLElement) : null);
  }, []);
  React.useEffect(() => {
    const el = frameEl;
    if (!el) return;
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", label);
  }, [frameEl, label]);

  const accessor = React.useMemo(() => slotStyles(styles, AUDIO_RECORDER_SLOT_KEYS), [styles]);

  const ctx: AudioRecorderContextValue = React.useMemo(
    () => ({
      controller,
      store,
      capabilities: controller.capabilities,
      size,
      styles: accessor,
    }),
    [controller, store, size, accessor],
  );

  return (
    <AudioRecorderContext.Provider value={ctx}>
      <RecorderFrame
        ref={setFrameRef}
        testID={testID}
        width={width}
        maxWidth={maxWidth}
        {...accessor.get("root")}
      >
        {controls === false ? null : (
          <RecorderControlBarFrame {...accessor.get("controlBar")}>
            {controls === true ? <ControlBar /> : controls}
          </RecorderControlBarFrame>
        )}
      </RecorderFrame>
    </AudioRecorderContext.Provider>
  );
}

/**
 * `<AudioRecorder>` with attached compound parts for custom layouts:
 *
 *   <AudioRecorder controls={
 *     <Group><AudioRecorder.Record /><AudioRecorder.Duration /></Group>
 *   } />
 */
export const AudioRecorder = withStaticProperties(AudioRecorderRoot, {
  ControlBar,
  Record: RecordButton,
  Stop: StopButton,
  PauseResume: PauseResumeButton,
  Duration,
  LevelMeter,
  InputSelect,
  /** Escape hatch for advanced custom chrome. */
  useAudioRecorder,
});
