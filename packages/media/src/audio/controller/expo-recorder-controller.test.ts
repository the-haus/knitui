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
  /** When set, `prepareToRecordAsync()` rejects with it (denied mic prompt). */
  failPrepare: Error | null = null;
  /** When set, `stop()` rejects with it (faulted / null `mediaRecorder`). */
  failStop: Error | null = null;
  /** Hold `prepareToRecordAsync()` open so a dispose can land mid-await. */
  blockPrepare = false;
  /** When set, `prepareToRecordAsync()` blocks until `releasePrepare()`. */
  private pendingPrepare: (() => void) | null = null;
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
    if (this.blockPrepare) {
      await new Promise<void>((resolve) => {
        this.pendingPrepare = resolve;
      });
    }
    if (this.failPrepare) throw this.failPrepare;
    this.prepared = true;
  }

  releasePrepare(): void {
    const resolve = this.pendingPrepare;
    this.pendingPrepare = null;
    resolve?.();
  }

  record(): void {
    this.recording = true;
  }

  pause(): void {
    this.recording = false;
  }

  async stop(): Promise<void> {
    if (this.failStop) throw this.failStop;
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

  /* error paths ------------------------------------------------------------- */

  describe("error paths", () => {
    it("lands in the terminal error state when the mic prompt is denied", async () => {
      const { recorder, controller } = make();
      const onError = jest.fn();
      const onStatus = jest.fn();
      controller.on("error", onError);
      controller.on("statusChange", onStatus);
      recorder.failPrepare = new Error("NotAllowedError: Permission denied");

      // Must not reject: the chrome calls this as `void controller.record()`, so a
      // rejection here is an unhandled rejection with no UI recovery.
      await expect(controller.record()).resolves.toBeUndefined();

      expect(controller.state.status).toBe("error");
      expect(controller.state.error).toEqual({
        message: "NotAllowedError: Permission denied",
      });
      expect(controller.state.canRecord).toBe(false);
      expect(controller.state.isRecording).toBe(false);
      expect(recorder.recording).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onStatus).toHaveBeenLastCalledWith({
        status: "error",
        error: { message: "NotAllowedError: Permission denied" },
      });
    });

    it("matches the hasError status shape exactly", async () => {
      const denied = make();
      denied.recorder.failPrepare = new Error("boom");
      await denied.controller.record();

      const reported = make();
      reported.recorder.emit({
        id: "1",
        isFinished: false,
        hasError: true,
        error: "boom",
        url: null,
      } as RecordingStatus);

      const shape = (s: typeof denied.controller.state) => ({
        status: s.status,
        isRecording: s.isRecording,
        canRecord: s.canRecord,
        error: s.error,
      });
      expect(shape(denied.controller.state)).toEqual(shape(reported.controller.state));
    });

    it("recovers on a retry once permission is granted", async () => {
      const { recorder, controller } = make();
      recorder.failPrepare = new Error("NotAllowedError");
      await controller.record();
      expect(controller.state.status).toBe("error");

      const onError = jest.fn();
      controller.on("error", onError);
      recorder.failPrepare = null;
      await controller.record();

      expect(controller.state.status).toBe("recording");
      expect(controller.state.isRecording).toBe(true);
      expect(controller.state.error).toBeNull();
      expect(onError).not.toHaveBeenCalled();
    });

    it("re-emits error on a second consecutive denial", async () => {
      const { recorder, controller } = make();
      recorder.failPrepare = new Error("NotAllowedError");
      const onError = jest.fn();
      controller.on("error", onError);
      await controller.record();
      await controller.record();
      expect(onError).toHaveBeenCalledTimes(2);
    });

    it("does not strand the recorder at 'recording' when stop() rejects", async () => {
      const { recorder, controller } = make();
      const onError = jest.fn();
      controller.on("error", onError);
      await controller.record();
      recorder.failStop = new Error("mediaRecorder is null");

      await expect(controller.stop()).resolves.toBeNull();

      expect(controller.state.status).toBe("error");
      expect(controller.state.isRecording).toBe(false);
      expect(controller.state.canRecord).toBe(false);
      expect(controller.state.error).toEqual({ message: "mediaRecorder is null" });
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("keeps a finished recording when stop() throws after the isFinished event", async () => {
      const { recorder, controller } = make();
      await controller.record();
      recorder.stop = async () => {
        recorder.emit({
          id: "1",
          isFinished: true,
          hasError: false,
          error: null,
          url: "blob:late",
        } as RecordingStatus);
        throw new Error("stop called twice");
      };

      await expect(controller.stop()).resolves.toBe("blob:late");
      expect(controller.state.status).toBe("stopped");
      expect(controller.state.error).toBeNull();
    });

    it("emits no state after a dispose lands mid-prepare", async () => {
      const { recorder, controller } = make();
      recorder.blockPrepare = true;
      const pending = controller.record();
      // `prepare()` has published "preparing" and is parked on the await.
      expect(controller.state.status).toBe("preparing");

      const onChange = jest.fn();
      controller.subscribe(onChange);
      controller.dispose();
      recorder.releasePrepare();
      await expect(pending).resolves.toBeUndefined();

      expect(onChange).not.toHaveBeenCalled();
      expect(controller.state.status).toBe("preparing");
      expect(controller.state.isRecording).toBe(false);
      expect(recorder.recording).toBe(false);
    });

    it("emits no state after a dispose lands mid-prepare that then rejects", async () => {
      const { recorder, controller } = make();
      recorder.blockPrepare = true;
      recorder.failPrepare = new Error("NotAllowedError");
      const pending = controller.record();

      controller.dispose();
      recorder.releasePrepare();
      await expect(pending).resolves.toBeUndefined();

      // The disposed guard wins over the error path — no state, no events.
      expect(controller.state.status).toBe("preparing");
      expect(controller.state.error).toBeNull();
    });
  });
});
