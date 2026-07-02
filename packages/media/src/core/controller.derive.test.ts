/**
 * Verifies the central event derivation in {@link BaseMediaController.deriveEvents}:
 * a single `setState` fans out the granular playback events ONCE each, directly
 * from the state diff. This is what lets the platform adapters stay pure
 * translators (backend event → `setState`) instead of hand-emitting — which used
 * to double-fire `statusChange` and diff every other event three different ways.
 *
 * Driven by a minimal concrete `BaseAudioController` subclass (the derivation is
 * backend-agnostic) whose `setState` is exposed so the test can push snapshots.
 */
import { BaseAudioController } from "../audio/controller/audio-controller-base";
import { NATIVE_CAPABILITIES } from "../audio/engine";
import type { AudioCapabilities, AudioControllerState, AudioSource } from "../audio/types";

/** A no-op controller that exposes the inherited `setState` for the test to drive. */
class TestController extends BaseAudioController {
  readonly capabilities: AudioCapabilities = NATIVE_CAPABILITIES;
  push(patch: Partial<AudioControllerState>): boolean {
    return this.setState(patch);
  }
  play(): void {}
  pause(): void {}
  replay(): void {}
  seekTo(): void {}
  setVolume(): void {}
  setMuted(): void {}
  setPlaybackRate(): void {}
  setLoop(): void {}
  replace(_source: AudioSource): void {}
  retry(): void {}
  setActiveForLockScreen(): void {}
  updateLockScreenMetadata(): void {}
  clearLockScreenControls(): void {}
  setSamplingEnabled(): void {}
}

describe("BaseMediaController.deriveEvents", () => {
  it("emits statusChange exactly once per transition (no double-emit)", () => {
    const c = new TestController();
    const status = jest.fn();
    c.on("statusChange", status);

    c.push({ status: "readyToPlay" });
    expect(status).toHaveBeenCalledTimes(1);
    expect(status).toHaveBeenCalledWith({ status: "readyToPlay", error: null });

    // A setState that does NOT move `status` must not re-fire statusChange.
    c.push({ currentTime: 5 });
    expect(status).toHaveBeenCalledTimes(1);
    c.dispose();
  });

  it("derives playingChange / volumeChange / playbackRateChange from one setState", () => {
    const c = new TestController();
    const playing = jest.fn();
    const volume = jest.fn();
    const rate = jest.fn();
    c.on("playingChange", playing);
    c.on("volumeChange", volume);
    c.on("playbackRateChange", rate);

    c.push({ playing: true, volume: 0.5, playbackRate: 2 });

    expect(playing).toHaveBeenCalledWith({ playing: true });
    expect(volume).toHaveBeenCalledWith({ volume: 0.5, muted: false });
    expect(rate).toHaveBeenCalledWith({ playbackRate: 2 });
    c.dispose();
  });

  it("fires volumeChange when only `muted` moves", () => {
    const c = new TestController();
    const volume = jest.fn();
    c.on("volumeChange", volume);
    c.push({ muted: true });
    expect(volume).toHaveBeenCalledWith({ volume: 1, muted: true });
    c.dispose();
  });

  it("gates timeUpdate on having a listener (hot path)", () => {
    const c = new TestController();
    // No listener yet → the per-tick payload is never built/emitted, but the
    // snapshot still advances.
    expect(c.push({ currentTime: 1 })).toBe(true);

    const time = jest.fn();
    c.on("timeUpdate", time);
    c.push({ currentTime: 2 });
    expect(time).toHaveBeenCalledTimes(1);
    expect(time).toHaveBeenCalledWith({ currentTime: 2, duration: 0, bufferedPosition: -1 });
    c.dispose();
  });

  it("fires playToEnd once on the false→true `ended` edge", () => {
    const c = new TestController();
    const end = jest.fn();
    c.on("playToEnd", end);
    c.push({ ended: true });
    c.push({ currentTime: 9 }); // still ended — must not re-fire
    expect(end).toHaveBeenCalledTimes(1);
    c.dispose();
  });

  it("does not emit anything when setState is a no-op", () => {
    const c = new TestController();
    const change = jest.fn();
    const playing = jest.fn();
    c.subscribe(change);
    c.on("playingChange", playing);
    expect(c.push({ playing: false })).toBe(false); // already false
    expect(change).not.toHaveBeenCalled();
    expect(playing).not.toHaveBeenCalled();
    c.dispose();
  });
});
