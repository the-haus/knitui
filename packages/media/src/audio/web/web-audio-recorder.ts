/**
 * The kit's WEB audio recorder: `MediaRecorder` over a `getUserMedia` stream,
 * with an `AnalyserNode` for input metering — behind the subset of expo-audio's
 * `AudioRecorder` API that {@link ExpoAudioRecorderController} drives (same
 * `recordingStatusUpdate` event, same `getStatus()` shape, dBFS metering on the
 * native scale). The native build uses expo-audio itself
 * (`hooks/useAudioRecorderController.native.tsx`).
 *
 * Adapted from expo-audio's `AudioRecorder.web` (MIT, © 650 Industries).
 */
import {
  getSharedAudioContext,
  getUserMedia,
  nextMediaId,
  WebEventSource,
} from "../../shared/web-media";
import { RECORDING_PRESETS } from "../engine/recording-presets";

export const RECORDING_STATUS_UPDATE = "recordingStatusUpdate";

/** The flattened options the web recorder reads (common fields + `web`). */
export interface WebRecordingOptions {
  isMeteringEnabled?: boolean;
  bitRate?: number;
  mimeType?: string;
  bitsPerSecond?: number;
}

export interface WebRecordingInput {
  uid: string;
  name: string;
  type: string;
}

export interface WebRecorderStatus {
  canRecord: boolean;
  isRecording: boolean;
  durationMillis: number;
  mediaServicesDidReset: boolean;
  url: string | null;
  metering?: number;
}

const NOT_PREPARED = "Cannot record without a MediaRecorder: call prepareToRecordAsync() first.";

export class WebAudioRecorder extends WebEventSource {
  readonly id = nextMediaId();
  currentTime = 0;
  uri: string | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private uptimeOfLastStartResume = 0;
  private recording = false;
  private timeoutIds: ReturnType<typeof setTimeout>[] = [];
  private cachedInputs: WebRecordingInput[] = [];
  private selectedDeviceId: string | null = null;
  private stream: MediaStream | null = null;
  private handleDeviceChange: (() => void) | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserBuffer: Float32Array<ArrayBuffer> | null = null;
  private analyserSource: MediaStreamAudioSourceNode | null = null;
  private meteringEnabled = false;

  constructor(private readonly options: WebRecordingOptions) {
    super();
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  async prepareToRecordAsync(): Promise<void> {
    this.mediaRecorder = await this.createMediaRecorder();
  }

  record(options?: { forDuration?: number; atTime?: number }): void {
    if (!this.mediaRecorder) throw new Error(NOT_PREPARED);
    this.clearTimeouts();
    // `atTime` has no browser equivalent and is ignored; `forDuration` is a timer.
    if (this.mediaRecorder.state === "paused") this.mediaRecorder.resume();
    else this.mediaRecorder.start();
    const forDuration = options?.forDuration;
    if (forDuration !== undefined) {
      this.timeoutIds.push(setTimeout(() => void this.stop(), forDuration * 1000));
    }
  }

  pause(): void {
    if (!this.mediaRecorder) throw new Error(NOT_PREPARED);
    this.mediaRecorder.pause();
  }

  async stop(): Promise<void> {
    const recorder = this.mediaRecorder;
    if (!recorder) throw new Error(NOT_PREPARED);
    const data = new Promise<Blob>((resolve) =>
      recorder.addEventListener("dataavailable", (e) => resolve((e as BlobEvent).data)),
    );
    recorder.stop();
    this.mediaRecorder = null;
    const url = URL.createObjectURL(await data);
    this.uri = url;
    this.emit(RECORDING_STATUS_UPDATE, {
      id: this.id,
      isFinished: true,
      hasError: false,
      error: null,
      url,
    });
  }

  getStatus(): WebRecorderStatus {
    const state = this.mediaRecorder?.state;
    const status: WebRecorderStatus = {
      canRecord: state === "recording" || state === "inactive",
      isRecording: state === "recording",
      durationMillis: this.durationMillis(),
      mediaServicesDidReset: false,
      url: this.uri,
    };
    if (this.meteringEnabled && this.recording) status.metering = this.meteringLevel();
    return status;
  }

  getAvailableInputs(): WebRecordingInput[] {
    return this.cachedInputs;
  }

  getCurrentInput(): Promise<WebRecordingInput> {
    const deviceId =
      this.selectedDeviceId ?? this.stream?.getAudioTracks()[0]?.getSettings().deviceId;
    const matched = this.cachedInputs.find((input) => input.uid === deviceId);
    return Promise.resolve(
      matched ?? this.cachedInputs[0] ?? { type: "Default", name: "Default", uid: "Default" },
    );
  }

  setInput(uid: string): void {
    if (!this.cachedInputs.some((input) => input.uid === uid)) {
      throw new Error(`No audio input device found for uid: ${uid}`);
    }
    this.selectedDeviceId = uid;
  }

  clearTimeouts(): void {
    for (const id of this.timeoutIds) clearTimeout(id);
    this.timeoutIds = [];
  }

  /** Stop any live stream and drop listeners (the hook calls this on unmount). */
  release(): void {
    this.clearTimeouts();
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  private async createMediaRecorder(): Promise<MediaRecorder> {
    if (typeof navigator !== "undefined" && !navigator.mediaDevices) {
      throw new Error("No media devices available");
    }
    this.uptimeOfLastStartResume = 0;
    this.currentTime = 0;
    const audio = this.selectedDeviceId ? { deviceId: { exact: this.selectedDeviceId } } : true;
    const stream = await getUserMedia({ audio });
    this.stream = stream;
    await this.updateCachedInputs();
    this.handleDeviceChange = () => void this.updateCachedInputs();
    navigator.mediaDevices.addEventListener("devicechange", this.handleDeviceChange);

    if (this.options.isMeteringEnabled) {
      const ctx = getSharedAudioContext();
      if (ctx.state === "suspended") void ctx.resume();
      this.analyserSource = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyserSource.connect(this.analyser);
      this.analyserBuffer = new Float32Array(this.analyser.fftSize);
      this.meteringEnabled = true;
    }

    const defaults = RECORDING_PRESETS.HIGH_QUALITY.web;
    const init: MediaRecorderOptions = {};
    const mimeType = this.options.mimeType ?? defaults.mimeType;
    if (mimeType && MediaRecorder.isTypeSupported(mimeType)) init.mimeType = mimeType;
    if (this.options.bitsPerSecond) init.bitsPerSecond = this.options.bitsPerSecond;
    else if (this.options.bitRate) init.audioBitsPerSecond = this.options.bitRate;
    else if (defaults.bitsPerSecond) init.bitsPerSecond = defaults.bitsPerSecond;

    const recorder = new MediaRecorder(stream, init);
    recorder.addEventListener("pause", () => {
      this.currentTime = this.durationMillis();
      this.recording = false;
    });
    recorder.addEventListener("resume", () => {
      this.uptimeOfLastStartResume = Date.now();
      this.recording = true;
    });
    recorder.addEventListener("start", () => {
      this.uptimeOfLastStartResume = Date.now();
      this.currentTime = 0;
      this.recording = true;
    });
    recorder.addEventListener("stop", () => {
      this.currentTime = 0;
      this.recording = false;
      this.stream = null;
      this.analyserSource?.disconnect();
      this.analyserSource = null;
      this.analyser?.disconnect();
      this.analyser = null;
      this.analyserBuffer = null;
      if (this.handleDeviceChange) {
        navigator.mediaDevices?.removeEventListener("devicechange", this.handleDeviceChange);
        this.handleDeviceChange = null;
      }
      // Clears the recording indicator in the browser tab.
      stream.getTracks().forEach((track) => track.stop());
    });
    return recorder;
  }

  private async updateCachedInputs(): Promise<void> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.cachedInputs = devices
      .filter((device) => device.kind === "audioinput")
      .map((device) => ({
        uid: device.deviceId,
        name: device.label || "Unknown Device",
        type: device.deviceId === "default" ? "Default" : "Unknown",
      }));
  }

  /** dBFS from the RMS of the current window, -160 for silence (native's scale). */
  private meteringLevel(): number {
    if (!this.analyser || !this.analyserBuffer) return -160;
    this.analyser.getFloatTimeDomainData(this.analyserBuffer);
    let sumSquares = 0;
    for (const sample of this.analyserBuffer) sumSquares += sample * sample;
    const rms = Math.sqrt(sumSquares / this.analyserBuffer.length);
    return rms === 0 ? -160 : 20 * Math.log10(rms);
  }

  private durationMillis(): number {
    let duration = this.currentTime;
    if (this.recording && this.uptimeOfLastStartResume > 0) {
      duration += Date.now() - this.uptimeOfLastStartResume;
    }
    return duration;
  }
}

/** expo's `createRecordingOptions` for the web: the common fields plus `web`. */
export function webRecordingOptions(options: {
  bitRate?: number;
  isMeteringEnabled?: boolean;
  web?: { mimeType?: string; bitsPerSecond?: number };
}): WebRecordingOptions {
  return {
    bitRate: options.bitRate,
    isMeteringEnabled: options.isMeteringEnabled ?? false,
    ...options.web,
  };
}
