// Adds jest-dom matchers (toBeVisible, toHaveTextContent, toBeDisabled, …) to
// `expect` for the jsdom-rendered component trees.
import "@testing-library/jest-dom";

// The media engines are PROCESS-WIDE singletons in production (one real `<audio>`
// / `<video>`). Reset them between tests so each starts from a clean shared
// player — otherwise one test's playback/active-player state would leak into the
// next (jsdom never fires the `pause`/status events that correct it live).
//
// Required LAZILY inside the hook (not a top-level import) so this setup file
// doesn't pull expo-audio's side-effecting web init at setup-eval time, before
// the jsdom environment + stubs below exist. By the time `afterEach` runs, the
// test has already loaded these modules, so `require` returns the same cached
// singleton the test exercised. (`require`, not `import()`, because this CJS jest
// transform doesn't support dynamic import.)
afterEach(() => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { resetSharedAudioSessionForTests } = require("./src/audio/session/audio-engine");
  const { resetSharedVideoSessionForTests } = require("./src/video/session/video-engine");
  /* eslint-enable @typescript-eslint/no-require-imports */
  resetSharedAudioSessionForTests();
  resetSharedVideoSessionForTests();
});

// Reanimated / the shared Tamagui config expect React Native's development
// global to exist when imported in tests.
(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// jsdom does not implement ResizeObserver; the web visualizer measures its
// canvas with it. Provide an inert stub.
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
}

// jsdom does not implement the HTMLMediaElement playback methods that the web
// AudioController drives. Stub them so the controller can be exercised under
// test without throwing. Tests drive state transitions by dispatching media
// events on the element directly.
const mediaProto = window.HTMLMediaElement.prototype;
if (typeof mediaProto.play !== "function" || !jest.isMockFunction(mediaProto.play)) {
  Object.defineProperty(mediaProto, "play", {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
}
Object.defineProperty(mediaProto, "pause", {
  configurable: true,
  writable: true,
  value: jest.fn(),
});
Object.defineProperty(mediaProto, "load", {
  configurable: true,
  writable: true,
  value: jest.fn(),
});

// jsdom does not implement the Web Audio API (AudioContext / AnalyserNode) used
// by the web sampling path, nor MediaRecorder / getUserMedia used by the web
// recorder and stream. Provide inert stubs so the controllers construct under
// test; behaviour is driven by dispatching events / calling listeners directly.
class AnalyserNodeStub {
  fftSize = 2048;
  frequencyBinCount = 1024;
  smoothingTimeConstant = 0.8;
  connect(): void {}
  disconnect(): void {}
  getByteTimeDomainData(array: Uint8Array): void {
    array.fill(128);
  }
  getByteFrequencyData(array: Uint8Array): void {
    array.fill(0);
  }
  getFloatTimeDomainData(array: Float32Array): void {
    array.fill(0);
  }
}

class AudioContextStub {
  state = "running";
  destination = {};
  // The shared web sampler prefers an AudioWorklet; jsdom can't run worklet code,
  // so `addModule` resolves inertly and frames are driven directly in tests.
  audioWorklet = { addModule: jest.fn().mockResolvedValue(undefined) };
  createAnalyser(): AnalyserNodeStub {
    return new AnalyserNodeStub();
  }
  createMediaElementSource(): { connect(): void; disconnect(): void } {
    return { connect: () => {}, disconnect: () => {} };
  }
  createMediaStreamSource(): { connect(): void; disconnect(): void } {
    return { connect: () => {}, disconnect: () => {} };
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
  resume(): Promise<void> {
    return Promise.resolve();
  }
}

if (!("AudioContext" in globalThis)) {
  (globalThis as { AudioContext?: unknown }).AudioContext = AudioContextStub;
  (window as unknown as { AudioContext?: unknown }).AudioContext = AudioContextStub;
}

// The AudioWorkletNode the sampler constructs once `addModule` resolves. Its port
// never posts under jsdom (no audio thread), so sampling is driven via direct
// `emitSample` / listener calls in tests.
class AudioWorkletNodeStub {
  port = { postMessage: jest.fn(), onmessage: null as unknown, close: jest.fn() };
  constructor(
    public context?: unknown,
    public name?: string,
    public options?: unknown,
  ) {}
  connect(): void {}
  disconnect(): void {}
}
if (!("AudioWorkletNode" in globalThis)) {
  (globalThis as { AudioWorkletNode?: unknown }).AudioWorkletNode = AudioWorkletNodeStub;
  (window as unknown as { AudioWorkletNode?: unknown }).AudioWorkletNode = AudioWorkletNodeStub;
}

// jsdom lacks URL.createObjectURL, used to load the worklet processor as a Blob.
if (typeof URL !== "undefined" && typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = jest.fn(() => "blob:knitui-audio-sampler");
  URL.revokeObjectURL = jest.fn();
}

// expo-audio's web recorder (`AudioRecorderWeb`) drives `MediaRecorder` through
// `addEventListener` (not the `on*` properties) and awaits a `dataavailable`
// event inside `stop()`. Extend `EventTarget` and dispatch the lifecycle events
// so the real expo backend runs under jsdom.
class MediaRecorderStub extends EventTarget {
  static isTypeSupported(): boolean {
    return true;
  }
  state: "inactive" | "recording" | "paused" = "inactive";
  constructor(
    public stream?: unknown,
    public options?: unknown,
  ) {
    super();
  }
  start(): void {
    this.state = "recording";
    this.dispatchEvent(new Event("start"));
  }
  stop(): void {
    this.state = "inactive";
    // expo's `stop()` adds a `dataavailable` listener then calls `stop()`, and
    // awaits the event's `.data` Blob — dispatch one synchronously so it resolves.
    const data = new Event("dataavailable") as Event & { data: Blob };
    data.data = new Blob([]);
    this.dispatchEvent(data);
    this.dispatchEvent(new Event("stop"));
  }
  pause(): void {
    this.state = "paused";
    this.dispatchEvent(new Event("pause"));
  }
  resume(): void {
    this.state = "recording";
    this.dispatchEvent(new Event("resume"));
  }
}
if (!("MediaRecorder" in globalThis)) {
  (globalThis as { MediaRecorder?: unknown }).MediaRecorder = MediaRecorderStub;
  (window as unknown as { MediaRecorder?: unknown }).MediaRecorder = MediaRecorderStub;
}

// jsdom does not implement the MediaSession API the web lock-screen path uses.
// Provide an inert stub so `capabilities.canLockScreen` resolves true and the
// controller's now-playing wiring is exercised under test.
if (typeof navigator !== "undefined" && !("mediaSession" in navigator)) {
  Object.defineProperty(navigator, "mediaSession", {
    configurable: true,
    writable: true,
    value: {
      metadata: null,
      playbackState: "none",
      setActionHandler: jest.fn(),
      setPositionState: jest.fn(),
    },
  });
}
if (!("MediaMetadata" in globalThis)) {
  class MediaMetadataStub {
    title = "";
    artist = "";
    album = "";
    artwork: unknown[] = [];
    constructor(init: { title?: string; artist?: string; album?: string; artwork?: unknown[] }) {
      Object.assign(this, init);
    }
  }
  (globalThis as { MediaMetadata?: unknown }).MediaMetadata = MediaMetadataStub;
  (window as unknown as { MediaMetadata?: unknown }).MediaMetadata = MediaMetadataStub;
}

if (typeof navigator !== "undefined" && !navigator.mediaDevices) {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    writable: true,
    value: {
      getUserMedia: jest
        .fn()
        .mockResolvedValue({ getTracks: () => [{ stop: () => {} }], getAudioTracks: () => [] }),
      enumerateDevices: jest.fn().mockResolvedValue([]),
      // expo's web recorder subscribes to `devicechange` to refresh its input
      // list; provide inert listener methods so `setup()` doesn't throw.
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  });
}

// jsdom does not implement the Fullscreen API or the Picture-in-Picture API that
// the web VideoController drives. Stub them so the controller can be exercised
// under test without throwing, and report the capability flags available so the
// capability-gated video chrome (fullscreen / PiP) renders under test.
if (!("requestPictureInPicture" in mediaProto)) {
  Object.defineProperty(mediaProto, "requestPictureInPicture", {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue({}),
  });
}
if (!("exitPictureInPicture" in document)) {
  Object.defineProperty(document, "exitPictureInPicture", {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
}
if (!("requestFullscreen" in window.HTMLElement.prototype)) {
  Object.defineProperty(window.HTMLElement.prototype, "requestFullscreen", {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
}
if (!("exitFullscreen" in document)) {
  Object.defineProperty(document, "exitFullscreen", {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
}
Object.defineProperty(document, "fullscreenEnabled", { configurable: true, get: () => true });
Object.defineProperty(document, "pictureInPictureEnabled", { configurable: true, get: () => true });

// jsdom's CSS parser rejects some of the rules react-native-web injects on mount
// and emits a non-fatal "Could not parse CSS stylesheet" jsdomError. Rendering and
// assertions are unaffected, so filter that one message to keep test output clean.
const originalError = console.error.bind(console);
console.error = (...args: unknown[]): void => {
  const first = args[0];
  const text = first instanceof Error ? first.message : String(first ?? "");
  if (text.includes("Could not parse CSS stylesheet")) return;
  // jsdom logs (then throws) for the canvas 2d context it doesn't implement; the
  // visualizer guards the throw and degrades to a no-op, so filter the noise.
  if (text.includes("Not implemented: HTMLCanvasElement.prototype.getContext")) return;
  originalError(...args);
};
