/**
 * The provider-agnostic *recorder* controller contract — the recorder twin of
 * {@link ./audio-controller-base AudioController}. The single, cross-platform backend
 * ({@link ./expo-recorder-controller}) wraps an `expo-audio` `AudioRecorder`,
 * which resolves to the native module on device and to `AudioRecorderWeb`
 * (`MediaRecorder` + `getUserMedia`) in the browser. It implements
 * `AudioRecorderController`, so the `useAudioRecorderController` hook, the
 * `<AudioRecorder>` context and its chrome program against ONE API regardless of
 * platform.
 *
 * `BaseAudioRecorderController` inherits its plumbing — the immutable state
 * snapshot, the typed emitter, subscription, and the merge-and-fan-out `setState`
 * — from the generic {@link ../../core/stateful-emitter StatefulEmitter}, the same
 * store base the player and playlist controllers extend. The recorder's state
 * shape is its own (it is not playback), but the store mechanics are identical.
 */
import { StatefulEmitter } from "../../core/stateful-emitter";
import type { RecordingOptions } from "../engine/recording-presets";
import type { AudioError } from "../types";

/* Re-export the platform-free recording-options type so consumers (the hook, the
   component) have a single import site. */
export type { RecordingOptions } from "../engine/recording-presets";

/* -------------------------------------------------------------------------- */
/* Inputs                                                                     */
/* -------------------------------------------------------------------------- */

/** An available audio input device (microphone). Mirrors expo-audio's `RecordingInput`. */
export interface AudioRecordingInput {
  /** Human-readable device name. */
  name: string;
  /** Device category, e.g. `'Built-in Microphone'`. */
  type: string;
  /** Unique identifier used to select the input. */
  uid: string;
}

/** Options that control how a recording is started. Mirrors `RecordingStartOptions`. */
export interface RecordingStartOptions {
  /** Stop automatically after this many seconds. */
  forDuration?: number;
  /** Delay before starting capture (seconds; native iOS only). */
  atTime?: number;
}

/* -------------------------------------------------------------------------- */
/* Status & state                                                             */
/* -------------------------------------------------------------------------- */

/** Lifecycle status of the recorder, normalized across both backends. */
export type AudioRecorderStatus =
  "idle" | "preparing" | "ready" | "recording" | "paused" | "stopped" | "error";

/**
 * An immutable snapshot of everything the recorder UI needs to render. The
 * controller recomputes it on every backend event and publishes it to
 * subscribers; the hook mirrors it into React state.
 */
export interface RecorderControllerState {
  status: AudioRecorderStatus;
  isRecording: boolean;
  /** Whether the recorder is prepared and able to record. */
  canRecord: boolean;
  /** Length of the current recording, milliseconds. */
  durationMillis: number;
  /** Normalized input level `[0, 1]` (when metering is enabled). */
  meteringLevel: number;
  /** The file URI of the finished recording, or `null`. */
  uri: string | null;
  error: AudioError | null;
  /** Available input devices (populated after `prepare()` where supported). */
  inputs: AudioRecordingInput[];
  /** The uid of the selected input, or `null`. */
  currentInputUid: string | null;
}

/** Default empty recorder snapshot. */
export function createInitialRecorderState(
  initial?: Partial<RecorderControllerState>,
): RecorderControllerState {
  return {
    status: "idle",
    isRecording: false,
    canRecord: false,
    durationMillis: 0,
    meteringLevel: 0,
    uri: null,
    error: null,
    inputs: [],
    currentInputUid: null,
    ...initial,
  };
}

/* -------------------------------------------------------------------------- */
/* Capabilities                                                               */
/* -------------------------------------------------------------------------- */

/**
 * What the active recorder backend can do. The chrome reads these to gate
 * controls it can't wire up (e.g. input selection on web).
 */
export interface RecorderCapabilities {
  /** Pause / resume mid-recording. */
  canPause: boolean;
  /** Real-time input level metering. */
  canMeter: boolean;
  /** Choose between available input devices. */
  canSelectInput: boolean;
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

/** Typed event payloads emitted by a recorder controller. */
export interface RecorderControllerEventMap {
  /** Fired on every state change, with the fresh snapshot. */
  change: RecorderControllerState;
  statusChange: { status: AudioRecorderStatus; error: AudioError | null };
  recordingChange: { isRecording: boolean };
  durationChange: { durationMillis: number };
  meteringUpdate: { level: number };
  /** Fired once a recording is finalized, with its file URI (or `null`). */
  recordingComplete: { uri: string | null };
  error: AudioError;
}

export type RecorderEventType = keyof RecorderControllerEventMap;

/* -------------------------------------------------------------------------- */
/* Controller contract                                                        */
/* -------------------------------------------------------------------------- */

/** The imperative + reactive API shared by every recorder backend. */
export interface AudioRecorderController {
  /** The live, immutable state snapshot. Replaced (never mutated) on change. */
  readonly state: RecorderControllerState;
  /** What this backend can do — read by the chrome to gate controls. */
  readonly capabilities: RecorderCapabilities;

  /** Subscribe to the full-snapshot `change` event. Returns an unsubscribe fn. */
  subscribe(listener: (state: RecorderControllerState) => void): () => void;
  /** Subscribe to a granular typed event. Returns an unsubscribe fn. */
  on<K extends RecorderEventType>(
    type: K,
    listener: (payload: RecorderControllerEventMap[K]) => void,
  ): () => void;

  /** Acquire the input + prepare the recorder. Idempotent. */
  prepare(): Promise<void>;
  /** Start (or restart) recording. */
  record(options?: RecordingStartOptions): void | Promise<void>;
  /** Record for a fixed number of seconds, then stop automatically. */
  recordForDuration(seconds: number): void;
  /** Pause the in-progress recording (no-op where unsupported). */
  pause(): void;
  /** Resume a paused recording (no-op where unsupported). */
  resume(): void;
  /** Stop and finalize the recording. Resolves to the file URI (or `null`). */
  stop(): Promise<string | null>;

  /** The available input devices (call after `prepare()`). */
  getInputs(): AudioRecordingInput[];
  /** Select an input device by uid (no-op where unsupported). */
  setInput(uid: string): void;

  /** Release platform resources and drop all listeners. */
  dispose(): void;
}

/* -------------------------------------------------------------------------- */
/* Shared base                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Shared base: inherits the state store + emitter from {@link StatefulEmitter}
 * and adds only the recorder's convenience commands + abstract platform surface.
 */
export abstract class BaseAudioRecorderController
  extends StatefulEmitter<RecorderControllerState, RecorderControllerEventMap>
  implements AudioRecorderController
{
  protected readonly options: RecordingOptions;
  abstract readonly capabilities: RecorderCapabilities;

  constructor(options: RecordingOptions, initial?: Partial<RecorderControllerState>) {
    super(createInitialRecorderState(initial));
    this.options = options;
  }

  /**
   * Fan out the recorder's granular events from a state transition — the single
   * place they're derived, so the adapter only translates its backend into
   * `setState` and never hand-emits. `recordingComplete` is a one-shot (not a
   * pure state diff), so it stays emitted at the adapter's finalize site.
   */
  protected override deriveEvents(
    prev: RecorderControllerState,
    next: RecorderControllerState,
  ): void {
    if (next.status !== prev.status) {
      this.emitEvent("statusChange", { status: next.status, error: next.error });
    }
    if (next.isRecording !== prev.isRecording) {
      this.emitEvent("recordingChange", { isRecording: next.isRecording });
    }
    if (next.durationMillis !== prev.durationMillis) {
      this.emitEvent("durationChange", { durationMillis: next.durationMillis });
    }
    if (next.meteringLevel !== prev.meteringLevel) {
      this.emitEvent("meteringUpdate", { level: next.meteringLevel });
    }
    if (prev.error == null && next.error != null) {
      this.emitEvent("error", next.error);
    }
  }

  /** Resume = record again after a pause. Adapters may override. */
  resume(): void {
    void this.record();
  }

  recordForDuration(seconds: number): void {
    void this.record({ forDuration: seconds });
  }

  getInputs(): AudioRecordingInput[] {
    return this._state.inputs;
  }

  /* `dispose()` (clears the emitter) is inherited from StatefulEmitter; adapters
     override it to also release platform resources, then call `super.dispose()`. */

  /* Abstract platform surface ------------------------------------------------ */
  abstract prepare(): Promise<void>;
  abstract record(options?: RecordingStartOptions): void | Promise<void>;
  abstract pause(): void;
  abstract stop(): Promise<string | null>;
  abstract setInput(uid: string): void;
}
