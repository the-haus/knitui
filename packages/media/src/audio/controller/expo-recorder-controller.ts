/**
 * The {@link AudioRecorderController} backend over an `expo-audio` `AudioRecorder`.
 * This is cross-platform: `expo-audio` resolves to its native module on device
 * and to its `.web` backend (`AudioRecorderWeb` — `MediaRecorder` + `getUserMedia`
 * + an `AnalyserNode` for metering) in the browser, so the SAME wrapper drives
 * both. There is no hand-written web recorder anymore.
 *
 * The recorder is created and disposed by the React hook (`useAudioRecorder`);
 * this controller only wraps it, binds its `recordingStatusUpdate` event, and
 * polls `getStatus()` on an interval for `durationMillis` / `metering` (which the
 * event stream does not carry). `metering` (dBFS, identical scale on both
 * backends) maps to a normalized `meteringLevel` via the engine's `meteringToLevel`.
 */
import type {
  AudioRecorder,
  RecordingOptions as ExpoRecordingOptions,
  RecorderState,
  RecordingInput,
  RecordingStatus,
} from "expo-audio";

import { meteringToLevel } from "../engine";
import type { RecordingOptions } from "../engine/recording-presets";
import type { AudioError } from "../types";
import {
  type AudioRecorderController,
  type AudioRecordingInput,
  BaseAudioRecorderController,
  type RecorderCapabilities,
  type RecordingStartOptions,
} from "./recorder-controller-base";

interface ExpoSubscription {
  remove(): void;
}

const POLL_INTERVAL_MS = 100;

/** Statuses from which a fresh `record()` must (re-)prepare the recorder. */
const NEEDS_PREPARE = new Set(["idle", "stopped", "error"]);

export class ExpoAudioRecorderController
  extends BaseAudioRecorderController
  implements AudioRecorderController
{
  readonly capabilities: RecorderCapabilities;

  /** The wrapped expo-audio recorder (native module or `AudioRecorderWeb`). */
  readonly recorder: AudioRecorder;
  private subscriptions: ExpoSubscription[] = [];
  private poll: ReturnType<typeof setInterval> | null = null;
  /** Guards `recordingComplete` to exactly once per recording (event + `stop()`). */
  private finalized = false;

  constructor(recorder: AudioRecorder, options: RecordingOptions) {
    super(options);
    this.recorder = recorder;
    // expo-audio supports pause, metering (`AnalyserNode` on web) and input
    // selection (device enumeration on web) on BOTH backends.
    this.capabilities = {
      canPause: true,
      canMeter: Boolean(options.isMeteringEnabled),
      canSelectInput: true,
    };
    this.bindEvents();
    this.syncFromRecorder();
  }

  /* event binding ----------------------------------------------------------- */

  private bindEvents(): void {
    this.subscriptions.push(
      this.recorder.addListener("recordingStatusUpdate", (status: RecordingStatus) =>
        this.ingestStatus(status),
      ),
    );
  }

  private ingestStatus(status: RecordingStatus): void {
    if (status.hasError) {
      const error: AudioError = { message: status.error ?? "Recording failed." };
      // `error` + `statusChange` fan out from the diff in deriveEvents.
      this.setState({ status: "error", isRecording: false, canRecord: false, error });
      this.stopPolling();
      return;
    }
    if (status.isFinished) {
      // The web backend emits `isFinished` (with the object URL) from `stop()`;
      // native reports it through `getStatus()`. `finalize()` dedupes either way.
      this.finalize(status.url ?? this.recorder.uri ?? this._state.uri);
    }
  }

  private syncFromRecorder(): void {
    this.applyRecorderState(this.recorder.getStatus());
  }

  private applyRecorderState(s: RecorderState): void {
    // recordingChange / durationChange / meteringUpdate all fan out from the diff
    // in BaseAudioRecorderController.deriveEvents.
    this.setState({
      canRecord: s.canRecord,
      isRecording: s.isRecording,
      durationMillis: s.durationMillis,
      meteringLevel: this.capabilities.canMeter ? meteringToLevel(s.metering) : 0,
      uri: s.url ?? this._state.uri,
    });
  }

  private startPolling(): void {
    if (this.poll != null) return;
    this.poll = setInterval(() => {
      this.applyRecorderState(this.recorder.getStatus());
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.poll != null) {
      clearInterval(this.poll);
      this.poll = null;
    }
  }

  /** Finalize a recording exactly once: stop polling, publish the URI + events. */
  private finalize(uri: string | null): void {
    if (this.finalized) return;
    this.finalized = true;
    this.stopPolling();
    // recordingChange + statusChange fan out from the diff; recordingComplete is a
    // one-shot (not a state field), so it's emitted here.
    this.setState({
      status: "stopped",
      isRecording: false,
      canRecord: false,
      meteringLevel: 0,
      uri,
    });
    this.emitEvent("recordingComplete", { uri });
  }

  /* imperative API ---------------------------------------------------------- */

  async prepare(): Promise<void> {
    this.setState({ status: "preparing", error: null });
    await this.recorder.prepareToRecordAsync(
      this.options as unknown as Partial<ExpoRecordingOptions>,
    );
    const inputs = this.mapInputs();
    let currentInputUid: string | null = null;
    try {
      const current = await this.recorder.getCurrentInput();
      currentInputUid = current?.uid ?? null;
    } catch {
      /* getCurrentInput throws if unavailable — leave null. */
    }
    this.setState({ status: "ready", canRecord: true, inputs, currentInputUid });
  }

  /**
   * Start recording. Auto-prepares first when the recorder isn't ready (the web
   * backend throws on `record()` before `prepareToRecordAsync()`), so a single
   * tap on the record button works without an explicit `prepare()`. A paused
   * recording resumes instead — `resume()` handles that.
   */
  async record(options?: RecordingStartOptions): Promise<void> {
    if (NEEDS_PREPARE.has(this._state.status) || !this._state.canRecord) {
      await this.prepare();
    }
    this.finalized = false;
    this.recorder.record(options);
    // recordingChange + statusChange fan out from the diff in deriveEvents.
    this.setState({ status: "recording", isRecording: true, uri: null, error: null });
    this.startPolling();
  }

  pause(): void {
    this.recorder.pause();
    this.stopPolling();
    this.setState({ status: "paused", isRecording: false, meteringLevel: 0 });
  }

  override resume(): void {
    // expo-audio resumes a paused recorder from `record()` (web `startActualRecording`
    // calls `MediaRecorder.resume()`; native resumes the session). No re-prepare.
    this.recorder.record();
    this.setState({ status: "recording", isRecording: true });
    this.startPolling();
  }

  async stop(): Promise<string | null> {
    this.stopPolling();
    // The web backend emits `recordingStatusUpdate({ isFinished })` during this
    // await, which finalizes via `ingestStatus`; the call below is then a no-op.
    await this.recorder.stop();
    const uri = this.recorder.uri ?? this._state.uri;
    this.finalize(uri);
    return this._state.uri ?? uri;
  }

  /* inputs ------------------------------------------------------------------ */

  private mapInputs(): AudioRecordingInput[] {
    try {
      return this.recorder.getAvailableInputs().map((i: RecordingInput) => ({
        name: i.name,
        type: i.type,
        uid: i.uid,
      }));
    } catch {
      return [];
    }
  }

  override getInputs(): AudioRecordingInput[] {
    const inputs = this.mapInputs();
    if (inputs.length) this.setState({ inputs });
    return inputs.length ? inputs : this._state.inputs;
  }

  setInput(uid: string): void {
    this.recorder.setInput(uid);
    this.setState({ currentInputUid: uid });
  }

  override dispose(): void {
    this.stopPolling();
    for (const subscription of this.subscriptions) subscription.remove();
    this.subscriptions = [];
    // The recorder itself is owned/released by the useAudioRecorder hook.
    super.dispose();
  }
}
