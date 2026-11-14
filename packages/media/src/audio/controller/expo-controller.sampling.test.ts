/**
 * Sampling on the player controller is PULL-based: while sampling is on and a
 * `sampleUpdate` listener is attached, a `SamplePump` reads the newest window from
 * the player (`readAudioSamples`) once per display frame.
 *
 * Also the regression test for the web waveform/spectrum: `setSamplingEnabled` must
 * turn sampling on by ASKING the backend first, then checking whether it took. The
 * web `AudioPlayer` initializes `isAudioSamplingSupported = false` and only flips
 * it to `true` inside `setAudioSamplingEnabled` (after lazily building the Web
 * Audio analyser graph), so a controller that checked the flag first never sampled.
 * `FakeWebAudioPlayer` reproduces that lazy flag.
 */
import type { AudioPlayer } from "@knitui/media/native/audio";

import { ExpoAudioController } from "./expo-controller";

/** Stand-in modeling the web backend's LAZY sampling support (false until enabled). */
class FakeWebAudioPlayer {
  id = "p1";
  volume = 1;
  muted = false;
  playbackRate = 1;
  shouldCorrectPitch = true;
  loop = false;
  playing = false;
  currentTime = 0;
  duration = 0;
  isBuffering = false;
  isLoaded = true;
  isLive = false;
  crossOrigin: string | undefined = undefined;

  // Mirrors AudioPlayer.web.ts: starts false, set true only when enabling succeeds.
  isAudioSamplingSupported = false;
  samplingEnabled = false;
  /** How often the controller pulled a window. */
  reads = 0;
  /** The window the next read returns; `null` models "nothing new" (paused). */
  next: number[] | null = null;
  private crossOriginTainted: boolean;

  constructor(opts: { tainted?: boolean } = {}) {
    this.crossOriginTainted = opts.tainted ?? false;
  }

  addListener(): { remove(): void } {
    return { remove: () => {} };
  }

  setAudioSamplingEnabled(enabled: boolean): void {
    this.samplingEnabled = enabled;
    if (!enabled) return;
    // A tainted source is refused by the browser; otherwise the analyser graph is
    // built and support turns on.
    this.isAudioSamplingSupported = !this.crossOriginTainted;
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

/** One display frame: the pump is driven by `requestAnimationFrame`. */
function frame(): void {
  jest.advanceTimersByTime(20);
}

describe("ExpoAudioController.setSamplingEnabled", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("enables sampling even though support is false until the first enable call", () => {
    const player = new FakeWebAudioPlayer();
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    const samples: unknown[] = [];
    controller.on("sampleUpdate", (s) => samples.push(s));

    controller.setSamplingEnabled(true);
    expect(player.isAudioSamplingSupported).toBe(true); // the call flipped it on

    player.next = [0.5, -0.5, 0.5]; // audible, so it passes the silence gate
    frame();
    expect(samples).toHaveLength(1);
    controller.dispose();
  });

  it("does no per-frame work while nothing listens for sampleUpdate", () => {
    // Sampling can stay on after the visualizer that asked for it unmounts. With no
    // `sampleUpdate` listener the pump must not even read the player.
    const player = new FakeWebAudioPlayer();
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    controller.setSamplingEnabled(true);

    frame();
    frame();
    expect(player.reads).toBe(0);

    const off = controller.on("sampleUpdate", () => {});
    frame();
    expect(player.reads).toBeGreaterThan(0);

    off();
    const before = player.reads;
    frame();
    expect(player.reads).toBe(before);
    controller.dispose();
  });

  it("emits nothing for a read that returns no new frames", () => {
    const player = new FakeWebAudioPlayer();
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    const samples: unknown[] = [];
    controller.on("sampleUpdate", (s) => samples.push(s));
    controller.setSamplingEnabled(true);

    frame(); // `next` is null: the player has nothing new (paused / buffering)
    expect(player.reads).toBeGreaterThan(0);
    expect(samples).toHaveLength(0);
    controller.dispose();
  });

  it("reuses the payload across frames (read-synchronously contract)", () => {
    const player = new FakeWebAudioPlayer();
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    const samples: { channels: ReadonlyArray<ArrayLike<number>>; peak: number }[] = [];
    const peaks: number[] = [];
    controller.on("sampleUpdate", (s) => {
      samples.push(s);
      peaks.push(s.peak);
    });

    controller.setSamplingEnabled(true);
    player.next = [0.5, -0.5];
    frame();
    player.next = [0.25, -0.25];
    frame();

    expect(samples).toHaveLength(2);
    // Same payload and channel list, refilled: valid only inside the callback, and
    // this is what keeps the sampling path allocation-free.
    expect(samples[0]).toBe(samples[1]);
    expect(samples[0].channels).toBe(samples[1].channels);
    expect(Array.from(samples[1].channels[0])).toEqual([0.25, -0.25]);
    expect(peaks[0]).toBeCloseTo(0.5);
    expect(peaks[1]).toBeCloseTo(0.25);
    controller.dispose();
  });

  it("does NOT sample when the backend declines (tainted cross-origin)", () => {
    const player = new FakeWebAudioPlayer({ tainted: true });
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    const samples: unknown[] = [];
    controller.on("sampleUpdate", (s) => samples.push(s));

    controller.setSamplingEnabled(true);
    expect(player.isAudioSamplingSupported).toBe(false);
    player.next = [0.5, -0.5];
    frame();
    expect(player.reads).toBe(0); // the pump was never started
    expect(samples).toHaveLength(0);
    controller.dispose();
  });

  it("stops reading once sampling is turned off or the controller is disposed", () => {
    const player = new FakeWebAudioPlayer();
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    controller.on("sampleUpdate", () => {});
    controller.setSamplingEnabled(true);
    frame();

    controller.setSamplingEnabled(false);
    expect(player.samplingEnabled).toBe(false);
    const before = player.reads;
    frame();
    expect(player.reads).toBe(before);

    controller.setSamplingEnabled(true);
    controller.dispose();
    const afterDispose = player.reads;
    frame();
    expect(player.reads).toBe(afterDispose);
  });
});
