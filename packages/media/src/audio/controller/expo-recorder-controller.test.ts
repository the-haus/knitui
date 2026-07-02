import type { AudioRecorder, RecordingStatus } from "expo-audio";

/**
 * Controller-level tests for {@link ExpoAudioRecorderController}, driven by a
 * `FakeRecorder` that implements only the `expo-audio` `AudioRecorder` surface
 * the controller touches (mirroring the playlist tests' `FakePlaylist`). This
 * exercises OUR controller logic — auto-prepare on a bare `record()`, the
 * finalize-once guard, polling-driven snapshots, input selection — without
 * depending on either backend's internals.
 */
import { RECORDING_PRESETS } from "../engine/recording-presets";
import { ExpoAudioRecorderController } from "./expo-recorder-controller";

type StatusListener = (status: RecordingStatus) => void;

/** Minimal stand-in for an expo-audio `AudioRecorder`. */
class FakeRecorder {
  uri: string | null = null;
  prepared = false;
  recording = false;
  durationMillis = 0;
  selectedInput: string | null = null;
  private listeners: StatusListener[] = [];

  addListener(_event: "recordingStatusUpdate", cb: StatusListener): { remove(): void } {
    this.listeners.push(cb);
    return {
      remove: () => {
        this.listeners = this.listeners.filter((l) => l !== cb);
      },
    };
  }

  emit(status: RecordingStatus): void {
    for (const l of this.listeners) l(status);
  }

  getStatus(): {
    canRecord: boolean;
    isRecording: boolean;
    durationMillis: number;
    metering: number;
    url: string | null;
  } {
    return {
      canRecord: this.prepared,
      isRecording: this.recording,
      durationMillis: this.durationMillis,
      metering: -30,
      url: this.uri,
    };
  }

  async prepareToRecordAsync(): Promise<void> {
    this.prepared = true;
  }

  record(): void {
    this.recording = true;
  }

  pause(): void {
    this.recording = false;
  }

  async stop(): Promise<void> {
    this.recording = false;
    this.uri = "blob:fake-recording";
    // The web backend emits this from stop(); the controller dedupes against its
    // own finalize() call.
    this.emit({
      id: "1",
      isFinished: true,
      hasError: false,
      error: null,
      url: this.uri,
    } as RecordingStatus);
  }

  getAvailableInputs(): Array<{ name: string; type: string; uid: string }> {
    return [{ name: "Mic", type: "Built-in", uid: "mic-1" }];
  }

  async getCurrentInput(): Promise<{ name: string; type: string; uid: string }> {
    return { name: "Mic", type: "Built-in", uid: "mic-1" };
  }

  setInput(uid: string): void {
    this.selectedInput = uid;
  }
}

function make(metering = true): {
  recorder: FakeRecorder;
  controller: ExpoAudioRecorderController;
} {
  const recorder = new FakeRecorder();
  const options = { ...RECORDING_PRESETS.HIGH_QUALITY, isMeteringEnabled: metering };
  const controller = new ExpoAudioRecorderController(recorder as unknown as AudioRecorder, options);
  return { recorder, controller };
}

describe("ExpoAudioRecorderController", () => {
  it("starts idle and reports cross-platform capabilities", () => {
    const { controller } = make();
    expect(controller.state.status).toBe("idle");
    expect(controller.capabilities.canPause).toBe(true);
    expect(controller.capabilities.canMeter).toBe(true);
    expect(controller.capabilities.canSelectInput).toBe(true);
  });

  it("derives canMeter from the recording options", () => {
    const { controller } = make(false);
    expect(controller.capabilities.canMeter).toBe(false);
  });

  it("auto-prepares on a bare record() and reflects the recording state", async () => {
    const { recorder, controller } = make();
    await controller.record();
    expect(recorder.prepared).toBe(true);
    expect(controller.state.isRecording).toBe(true);
    expect(controller.state.status).toBe("recording");
  });

  it("emits recordingChange when recording starts", async () => {
    const { controller } = make();
    const onChange = jest.fn();
    controller.on("recordingChange", onChange);
    await controller.record();
    expect(onChange).toHaveBeenCalledWith({ isRecording: true });
  });

  it("pauses and resumes without re-preparing", async () => {
    const { recorder, controller } = make();
    await controller.record();
    const prepareSpy = jest.spyOn(recorder, "prepareToRecordAsync");
    controller.pause();
    expect(controller.state.status).toBe("paused");
    expect(controller.state.isRecording).toBe(false);
    controller.resume();
    expect(controller.state.status).toBe("recording");
    expect(controller.state.isRecording).toBe(true);
    expect(prepareSpy).not.toHaveBeenCalled();
  });

  it("finalizes to stopped with the URI", async () => {
    const { controller } = make();
    await controller.record();
    const uri = await controller.stop();
    expect(controller.state.status).toBe("stopped");
    expect(controller.state.isRecording).toBe(false);
    expect(uri).toBe("blob:fake-recording");
  });

  it("emits recordingComplete exactly once on stop (event + stop() dedup)", async () => {
    const { controller } = make();
    const onComplete = jest.fn();
    controller.on("recordingComplete", onComplete);
    await controller.record();
    await controller.stop();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("re-prepares for a fresh recording after stop", async () => {
    const { recorder, controller } = make();
    await controller.record();
    await controller.stop();
    const prepareSpy = jest.spyOn(recorder, "prepareToRecordAsync");
    await controller.record();
    expect(prepareSpy).toHaveBeenCalledTimes(1);
    expect(controller.state.isRecording).toBe(true);
  });

  it("selects an input device", () => {
    const { recorder, controller } = make();
    controller.setInput("mic-1");
    expect(recorder.selectedInput).toBe("mic-1");
    expect(controller.state.currentInputUid).toBe("mic-1");
  });

  it("disposes cleanly while recording", async () => {
    const { controller } = make();
    await controller.record();
    expect(() => controller.dispose()).not.toThrow();
  });
});
