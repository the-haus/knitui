/**
 * Regression test for the web waveform/spectrum: `setSamplingEnabled` must turn
 * sampling on by ASKING the backend first, then checking whether it took — never
 * pre-gating on `isAudioSamplingSupported`.
 *
 * The web `AudioPlayer` initializes `isAudioSamplingSupported = false` and only
 * flips it to `true` *inside* `setAudioSamplingEnabled` (after lazily building the
 * Web-Audio analyser graph). A controller that checked the flag BEFORE calling
 * therefore short-circuited forever — `audioSampleUpdate` never fired and the
 * visualizer stayed flat. `FakeWebAudioPlayer` reproduces exactly that lazy flag.
 */
import type { AudioPlayer } from "expo-audio";

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
  private crossOriginTainted: boolean;
  private sampleListeners: Array<(s: unknown) => void> = [];

  constructor(opts: { tainted?: boolean } = {}) {
    this.crossOriginTainted = opts.tainted ?? false;
  }

  addListener(event: string, cb: (s: never) => void): { remove(): void } {
    if (event === "audioSampleUpdate") this.sampleListeners.push(cb as (s: unknown) => void);
    return { remove: () => {} };
  }

  setAudioSamplingEnabled(enabled: boolean): void {
    if (!enabled) return;
    if (this.crossOriginTainted) {
      this.isAudioSamplingSupported = false; // browser refuses tainted audio
      return;
    }
    this.isAudioSamplingSupported = true; // analyser graph built → now supported
  }

  /** Test hook: simulate the backend pushing a PCM frame. */
  pushSample(frames: number[]): void {
    for (const l of this.sampleListeners) {
      l({ channels: [{ frames }], timestamp: 0 } as never);
    }
  }

  /**
   * Like {@link pushSample}, but counts how many times the bridge actually READS
   * the frames — the observable proxy for "did the 60 Hz handler do any work".
   */
  pushSampleCountingReads(frames: number[]): number {
    let reads = 0;
    const channel = {
      get frames() {
        reads++;
        return frames;
      },
    };
    for (const l of this.sampleListeners) {
      l({ channels: [channel], timestamp: 0 } as never);
    }
    return reads;
  }
}

describe("ExpoAudioController.setSamplingEnabled (web lazy support)", () => {
  it("enables sampling even though support is false until the first enable call", () => {
    const player = new FakeWebAudioPlayer();
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    const samples: unknown[] = [];
    controller.on("sampleUpdate", (s) => samples.push(s));

    controller.setSamplingEnabled(true);
    expect(player.isAudioSamplingSupported).toBe(true); // the call flipped it on

    player.pushSample([0.5, -0.5, 0.5]); // audible → passes the silence gate
    expect(samples).toHaveLength(1);
    controller.dispose();
  });

  it("does no per-frame work while nothing listens for sampleUpdate", () => {
    // The backend keeps posting a ~2048-frame window per display frame for as long
    // as sampling is on, which can outlive the visualizer that asked for it. With no
    // `sampleUpdate` listener the handler must not touch the frames at all.
    const player = new FakeWebAudioPlayer();
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    controller.setSamplingEnabled(true);

    expect(player.pushSampleCountingReads([0.5, -0.5])).toBe(0);

    const off = controller.on("sampleUpdate", () => {});
    expect(player.pushSampleCountingReads([0.5, -0.5])).toBe(1);

    off();
    expect(player.pushSampleCountingReads([0.5, -0.5])).toBe(0);
    controller.dispose();
  });

  it("reuses the channel list across frames (read-synchronously contract)", () => {
    const player = new FakeWebAudioPlayer();
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    const samples: { channels: ReadonlyArray<ArrayLike<number>>; peak: number }[] = [];
    controller.on("sampleUpdate", (s) => samples.push(s));

    controller.setSamplingEnabled(true);
    player.pushSample([0.5, -0.5]);
    player.pushSample([0.25, -0.25]);

    expect(samples).toHaveLength(2);
    // Same list object, refilled — the payload is documented as valid only inside
    // the callback, and this is what keeps the 60 Hz path allocation-free.
    expect(samples[0].channels).toBe(samples[1].channels);
    expect(samples[1].channels[0]).toEqual([0.25, -0.25]);
    expect(samples[1].peak).toBeCloseTo(0.25);
    controller.dispose();
  });

  it("does NOT bridge samples when the backend declines (tainted cross-origin)", () => {
    const player = new FakeWebAudioPlayer({ tainted: true });
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    const samples: unknown[] = [];
    controller.on("sampleUpdate", (s) => samples.push(s));

    controller.setSamplingEnabled(true);
    expect(player.isAudioSamplingSupported).toBe(false);
    player.pushSample([0.5, -0.5]);
    expect(samples).toHaveLength(0); // no subscription was wired
    controller.dispose();
  });
});
