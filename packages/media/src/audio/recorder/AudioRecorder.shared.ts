/**
 * Cross-platform presentation layer for `<AudioRecorder>`: the styled frames, the
 * runtime context the chrome consumes, the public prop/style types, and the
 * control-size scales. Everything here is platform-free so the single
 * `AudioRecorder` root and the chrome stay thin — the platform difference lives
 * entirely in the hook (`useAudioRecorderController`).
 *
 * Mirrors `Audio.shared.ts`.
 */
import * as React from "react";

import { Box, type Text } from "@knitui/components";
import type { GetProps, SlotAccessor, SlotStyles } from "@knitui/core";
import { styled } from "@knitui/core";

import type { MediaSize } from "../../control-size";
import { type MediaStore, shallowEqual, useMediaSelector } from "../../core/react/useMediaSelector";
import type {
  AudioRecorderController,
  RecorderCapabilities,
  RecorderControllerState,
  RecordingOptions,
} from "../controller/recorder-controller-base";

/** Recorder control size — the kit's full size scale (see `../../control-size`). */
export type AudioRecorderSize = MediaSize;

/* -------------------------------------------------------------------------- */
/* Styled frames                                                              */
/* -------------------------------------------------------------------------- */

/** Outer recorder card — a surface-toned container. */
export const RecorderFrame = styled(Box, {
  name: "AudioRecorder",
  position: "relative",
  width: "100%",
  flexDirection: "column",
  backgroundColor: "$color2",
  borderRadius: "$lg",
  borderWidth: 1,
  borderColor: "$borderColor",
  paddingHorizontal: "$md",
  paddingVertical: "$sm",
  gap: "$sm",
});

/** The control-bar container that holds the transport + meter rows. */
export const RecorderControlBarFrame = styled(Box, {
  name: "AudioRecorderControlBar",
  width: "100%",
  flexDirection: "column",
  gap: "$xs",
});

/** Horizontal level-meter track. */
export const RecorderMeterTrack = styled(Box, {
  name: "AudioRecorderMeterTrack",
  width: "100%",
  height: 6,
  borderRadius: "$xl",
  backgroundColor: "$color4",
  overflow: "hidden",
});

/** Level-meter fill. */
export const RecorderMeterFill = styled(Box, {
  name: "AudioRecorderMeterFill",
  height: "100%",
  borderRadius: "$xl",
  backgroundColor: "$green9",
});

/* -------------------------------------------------------------------------- */
/* Per-slot styles                                                            */
/* -------------------------------------------------------------------------- */

export type AudioRecorderStyles = {
  root: GetProps<typeof RecorderFrame>;
  controlBar: GetProps<typeof RecorderControlBarFrame>;
  meterTrack: GetProps<typeof RecorderMeterTrack>;
  meterFill: GetProps<typeof RecorderMeterFill>;
  duration: GetProps<typeof Text>;
};

export const AUDIO_RECORDER_SLOT_KEYS = [
  "root",
  "controlBar",
  "meterTrack",
  "meterFill",
  "duration",
] as const;

/* -------------------------------------------------------------------------- */
/* Runtime context                                                            */
/* -------------------------------------------------------------------------- */

export interface AudioRecorderContextValue {
  controller: AudioRecorderController;
  /**
   * The per-recorder snapshot store. Stable across renders — read slices with
   * {@link useRecorderState} so a control only re-renders when ITS fields change,
   * not on every per-tick `durationMillis` / `meteringLevel` update. (The live
   * snapshot is always at `store.getSnapshot()` for one-off imperative reads.)
   */
  store: MediaStore<RecorderControllerState>;
  capabilities: RecorderCapabilities;
  size: AudioRecorderSize;
  styles?: SlotAccessor<AudioRecorderStyles>;
}

export const AudioRecorderContext = React.createContext<AudioRecorderContextValue | null>(null);

/** Read the recorder runtime. Throws if used outside `<AudioRecorder>`. */
export function useAudioRecorder(component = "AudioRecorder"): AudioRecorderContextValue {
  const ctx = React.useContext(AudioRecorderContext);
  if (!ctx) {
    throw new Error(`<AudioRecorder.${component}> must be used inside <AudioRecorder>.`);
  }
  return ctx;
}

/**
 * Subscribe to a SLICE of the live recorder state. The component re-renders only
 * when `selector`'s output changes by `isEqual` (default `Object.is`; pass
 * {@link shallowEqual} for a multi-field object selection). This is the granular
 * alternative to reading the whole snapshot off context — a `RecordButton`
 * reading `s => s.isRecording` stays put through every `durationMillis` tick.
 */
export function useRecorderState<T>(
  selector: (state: RecorderControllerState) => T,
  isEqual?: (a: T, b: T) => boolean,
): T {
  const { store } = useAudioRecorder();
  return useMediaSelector(store, selector, isEqual);
}

export { shallowEqual };

/* -------------------------------------------------------------------------- */
/* Public props                                                               */
/* -------------------------------------------------------------------------- */

export interface AudioRecorderProps {
  /** Full recording options. Defaults to the `HIGH_QUALITY` preset. */
  options?: RecordingOptions;
  /** Enable input-level metering. Overrides `options.isMeteringEnabled`. */
  meteringEnabled?: boolean;
  /** Control sizing scale. Default `'md'`. */
  size?: AudioRecorderSize;
  /**
   * The control chrome. `true` (default) renders the built-in control bar;
   * `false` renders no chrome; a node renders custom chrome inside the context.
   */
  controls?: boolean | React.ReactNode;
  /** Accessible label for the recorder region. Default `"Audio recorder"`. */
  label?: string;
  /** Receives the controller once ready. */
  getController?: (controller: AudioRecorderController) => void;
  /** Fired when a recording is finalized, with its file URI. */
  onStop?: (uri: string | null) => void;
  /** Fired whenever recording starts/stops. */
  onRecordingChange?: (isRecording: boolean) => void;
  /** Per-slot style overrides. */
  styles?: SlotStyles<AudioRecorderStyles>;
  testID?: string;
  /** Frame width. */
  width?: GetProps<typeof RecorderFrame>["width"];
  /** Frame max width. */
  maxWidth?: GetProps<typeof RecorderFrame>["maxWidth"];
}
