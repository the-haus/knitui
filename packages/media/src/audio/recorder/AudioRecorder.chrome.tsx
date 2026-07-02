/**
 * Cross-platform control chrome for `<AudioRecorder>`. Pure presentation built
 * from `@knitui/components` + `@knitui/icons` — no platform-specific imports —
 * driven entirely by the {@link AudioRecorderContext}. Each control is
 * capability-gated, so a control the active backend can't support (e.g. input
 * selection on web) simply doesn't render.
 *
 * The parts are exported individually AND attached to `AudioRecorder` (see
 * AudioRecorder.tsx) so consumers can compose a custom bar.
 */
import * as React from "react";

import { ActionIcon, Group, Select, Stack, Text } from "@knitui/components";
import { ControlIconProvider } from "@knitui/components/control-system";
import {
  IconMicrophone,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerRecordFilled,
  IconPlayerStopFilled,
} from "@knitui/icons";

import { clampMediaSize, mediaIconSize } from "../../control-size";
import { formatMillis } from "../engine";
import {
  RecorderMeterFill,
  RecorderMeterTrack,
  shallowEqual,
  useAudioRecorder,
  useRecorderState,
} from "./AudioRecorder.shared";

/* -------------------------------------------------------------------------- */
/* Record / stop toggle                                                       */
/* -------------------------------------------------------------------------- */

/** Toggles between starting a recording and stopping it. Red while recording. */
export const RecordButton = React.memo(function RecordButton(): React.ReactElement {
  const { controller, size } = useAudioRecorder("RecordButton");
  const active = useRecorderState((s) => s.isRecording);
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="filled"
      radius="xl"
      theme={active ? "red" : undefined}
      aria-label={active ? "Stop recording" : "Start recording"}
      onPress={() => {
        if (active) void controller.stop();
        else void controller.record();
      }}
    >
      {active ? (
        <IconPlayerStopFilled />
      ) : (
        // The idle record dot reads red regardless of the button fill; the
        // provider resolves the `$red9` token to a concrete color for the glyph
        // while re-asserting the button's icon size (it would otherwise reset).
        <ControlIconProvider size={clampMediaSize(size)} color="$red9">
          <IconPlayerRecordFilled />
        </ControlIconProvider>
      )}
    </ActionIcon>
  );
});

/* -------------------------------------------------------------------------- */
/* Pause / resume                                                             */
/* -------------------------------------------------------------------------- */

/** Pause / resume the in-progress recording. Gated by `canPause`. */
export const PauseResumeButton = React.memo(
  function PauseResumeButton(): React.ReactElement | null {
    const { controller, capabilities, size } = useAudioRecorder("PauseResume");
    const { status, isRecording } = useRecorderState(
      (s) => ({ status: s.status, isRecording: s.isRecording }),
      shallowEqual,
    );
    if (!capabilities.canPause) return null;
    const paused = status === "paused";
    // Only meaningful while a recording is active or paused.
    if (!isRecording && !paused) return null;
    return (
      <ActionIcon
        size={clampMediaSize(size)}
        variant="subtle"
        aria-label={paused ? "Resume recording" : "Pause recording"}
        onPress={() => {
          if (paused) controller.resume();
          else controller.pause();
        }}
      >
        {paused ? <IconPlayerPlay /> : <IconPlayerPause />}
      </ActionIcon>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Stop                                                                       */
/* -------------------------------------------------------------------------- */

/** A dedicated stop button (separate from the record/stop toggle). */
export const StopButton = React.memo(function StopButton(): React.ReactElement | null {
  const { controller, size } = useAudioRecorder("Stop");
  const { isRecording, status } = useRecorderState(
    (s) => ({ isRecording: s.isRecording, status: s.status }),
    shallowEqual,
  );
  if (!isRecording && status !== "paused") return null;
  return (
    <ActionIcon
      size={clampMediaSize(size)}
      variant="subtle"
      aria-label="Stop recording"
      onPress={() => void controller.stop()}
    >
      <IconPlayerStopFilled />
    </ActionIcon>
  );
});

/* -------------------------------------------------------------------------- */
/* Duration                                                                   */
/* -------------------------------------------------------------------------- */

export const Duration = React.memo(function Duration(): React.ReactElement {
  const { styles } = useAudioRecorder("Duration");
  const durationMillis = useRecorderState((s) => s.durationMillis);
  return (
    <Text size="sm" fontVariant={["tabular-nums"]} {...styles?.get("duration")}>
      {formatMillis(durationMillis)}
    </Text>
  );
});

/* -------------------------------------------------------------------------- */
/* Level meter                                                                */
/* -------------------------------------------------------------------------- */

/** Horizontal input-level meter. Gated by `canMeter`. */
export const LevelMeter = React.memo(function LevelMeter(): React.ReactElement | null {
  const { capabilities, styles } = useAudioRecorder("LevelMeter");
  const meteringLevel = useRecorderState((s) => s.meteringLevel);
  if (!capabilities.canMeter) return null;
  const pct = `${Math.round(Math.max(0, Math.min(1, meteringLevel)) * 100)}%`;
  return (
    <RecorderMeterTrack role="progressbar" aria-label="Input level" {...styles?.get("meterTrack")}>
      <RecorderMeterFill
        width={pct as never}
        backgroundColor={meteringLevel > 0.9 ? "$red9" : "$green9"}
        {...styles?.get("meterFill")}
      />
    </RecorderMeterTrack>
  );
});

/* -------------------------------------------------------------------------- */
/* Input selection                                                            */
/* -------------------------------------------------------------------------- */

/** Microphone selector. Gated by `canSelectInput` and a non-empty input list. */
export const InputSelect = React.memo(function InputSelect(): React.ReactElement | null {
  const { controller, capabilities, size } = useAudioRecorder("InputSelect");
  const { inputs, currentInputUid } = useRecorderState(
    (s) => ({ inputs: s.inputs, currentInputUid: s.currentInputUid }),
    shallowEqual,
  );
  if (!capabilities.canSelectInput || inputs.length === 0) return null;
  const data = inputs.map((i) => ({ value: i.uid, label: i.name }));
  return (
    <Group gap="$xs" align="center" wrap="nowrap">
      <IconMicrophone size={mediaIconSize(size)} />
      <Select
        size={clampMediaSize(size)}
        data={data}
        value={currentInputUid}
        aria-label="Microphone input"
        placeholder="Microphone"
        allowDeselect={false}
        onChange={(value: string | null) => {
          if (value) controller.setInput(value);
        }}
      />
    </Group>
  );
});

/* -------------------------------------------------------------------------- */
/* Default control bar                                                        */
/* -------------------------------------------------------------------------- */

export const ControlBar = React.memo(function ControlBar(): React.ReactElement {
  return (
    <Stack gap="$xs" width="100%">
      <LevelMeter />
      <Group justify="space-between" align="center" gap="$xs" wrap="nowrap">
        <Group gap="$xxs" align="center" wrap="nowrap">
          <RecordButton />
          <PauseResumeButton />
        </Group>
        <Duration />
      </Group>
      <InputSelect />
    </Stack>
  );
});
