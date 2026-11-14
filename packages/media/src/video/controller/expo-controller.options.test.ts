/**
 * The video controller's playback options (quality cap, keep-awake, background
 * playback, buffering) and its sampling, which runs on the same pump as audio's.
 */
import type { VideoPlayer } from "@knitui/media/native/video";

import { buildVideoEngine } from "../session/video-engine.shared";
import { ExpoVideoController } from "./expo-controller";

class FakeVideoPlayer {
  status = "readyToPlay";
  playing = false;
  currentTime = 0;
  duration = 30;
  bufferedPosition = -1;
  volume = 1;
  muted = false;
  playbackRate = 1;
  loop = false;
  isLive = false;
  timeUpdateEventInterval = 0;
  subtitleTrack: unknown = null;
  audioTrack: unknown = null;
  showNowPlayingNotification = false;

  staysActiveInBackground = false;
  keepScreenOnWhilePlaying = true;
  maxResolution: { width: number; height: number } | null = null;
  bufferOptions: Record<string, unknown> = { preferredForwardBufferDuration: 20 };

  samplingEnabled = false;
  reads = 0;
  next: number[] | null = null;

  play(): void {}
  pause(): void {}
  replay(): void {}
  async replaceAsync(): Promise<void> {}
  addListener(): { remove(): void } {
    return { remove: () => {} };
  }

  setAudioSamplingEnabled(enabled: boolean): void {
    this.samplingEnabled = enabled;
  }

  readAudioSamples(target: Float32Array): number {
    this.reads++;
    const frames = this.next;
    if (!frames) return 0;
    this.next = null;
    target.set(frames);
    return frames.length;
  }
}

function make(): { player: FakeVideoPlayer; controller: ExpoVideoController } {
  const player = new FakeVideoPlayer();
  const controller = new ExpoVideoController(player as unknown as VideoPlayer);
  return { player, controller };
}

describe("ExpoVideoController.setPlaybackOptions", () => {
  it("applies only the fields that were passed", () => {
    const { player, controller } = make();

    controller.setPlaybackOptions({ maxResolution: { width: 1280, height: 720 } });
    expect(player.maxResolution).toEqual({ width: 1280, height: 720 });
    expect(player.keepScreenOnWhilePlaying).toBe(true);
    expect(player.staysActiveInBackground).toBe(false);

    controller.setPlaybackOptions({ keepAwake: false, backgroundPlayback: true });
    expect(player.keepScreenOnWhilePlaying).toBe(false);
    expect(player.staysActiveInBackground).toBe(true);
    expect(player.maxResolution).toEqual({ width: 1280, height: 720 });

    controller.setPlaybackOptions({ maxResolution: null });
    expect(player.maxResolution).toBeNull();
    controller.dispose();
  });

  it("merges buffer fields into what the player already has", () => {
    const { player, controller } = make();
    controller.setPlaybackOptions({ buffer: { minForPlayback: 4, maxBytes: 1_000_000 } });
    expect(player.bufferOptions).toEqual({
      preferredForwardBufferDuration: 20,
      minBufferForPlayback: 4,
      maxBufferBytes: 1_000_000,
    });

    controller.setPlaybackOptions({
      buffer: { forwardDuration: 60, waitToMinimizeStalling: false },
    });
    expect(player.bufferOptions).toEqual({
      preferredForwardBufferDuration: 60,
      minBufferForPlayback: 4,
      maxBufferBytes: 1_000_000,
      waitsToMinimizeStalling: false,
    });
    controller.dispose();
  });
});

describe("playback options across players that share one engine", () => {
  it("gives each player its own options, and defaults to one that set none", () => {
    const { player, controller } = make();
    const engine = buildVideoEngine(controller);
    engine.session.register("a", { source: "a.mp4", config: {} });
    engine.session.register("b", { source: "b.mp4", config: {} });
    const a = engine.getFacade("a");
    const b = engine.getFacade("b");

    a.play();

    // Set on the player that is NOT playing: remembered, not applied.
    b.setPlaybackOptions({ maxResolution: { width: 640, height: 360 }, backgroundPlayback: true });
    expect(player.maxResolution).toBeNull();
    expect(player.staysActiveInBackground).toBe(false);

    b.play();
    expect(player.maxResolution).toEqual({ width: 640, height: 360 });
    expect(player.staysActiveInBackground).toBe(true);

    // The first player never asked for a cap: it must not inherit the other's.
    a.play();
    expect(player.maxResolution).toBeNull();
    expect(player.staysActiveInBackground).toBe(false);
    expect(player.keepScreenOnWhilePlaying).toBe(true);

    b.play();
    expect(player.maxResolution).toEqual({ width: 640, height: 360 });
    engine.dispose();
  });
});

describe("sampling across players that share one engine", () => {
  it("comes back when the sampled player takes the engine again", () => {
    const { player, controller } = make();
    const engine = buildVideoEngine(controller);
    engine.session.register("a", { source: "a.mp4", config: {} });
    engine.session.register("b", { source: "b.mp4", config: {} });
    const a = engine.getFacade("a");
    const b = engine.getFacade("b");

    a.play();
    a.setSamplingEnabled(true); // while it owns the player
    expect(player.samplingEnabled).toBe(true);

    b.play();
    expect(player.samplingEnabled).toBe(false);

    a.play();
    expect(player.samplingEnabled).toBe(true);
    engine.dispose();
  });
});

describe("ExpoVideoController.setSamplingEnabled", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("pulls windows from the player only while a listener is attached", () => {
    const { player, controller } = make();
    controller.setSamplingEnabled(true);
    expect(player.samplingEnabled).toBe(true);

    jest.advanceTimersByTime(40);
    expect(player.reads).toBe(0);

    const peaks: number[] = [];
    const off = controller.on("sampleUpdate", (sample) => peaks.push(sample.peak));
    player.next = [0.25, -0.5, 0.1];
    jest.advanceTimersByTime(20);
    expect(peaks).toHaveLength(1);
    expect(peaks[0]).toBeCloseTo(0.5);

    off();
    controller.setSamplingEnabled(false);
    expect(player.samplingEnabled).toBe(false);
    const before = player.reads;
    jest.advanceTimersByTime(40);
    expect(player.reads).toBe(before);
    controller.dispose();
  });
});
