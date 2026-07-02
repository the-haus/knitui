/**
 * Verifies the playlist's converged event derivation in
 * {@link BaseAudioPlaylistController.deriveEvents}. Before the convergence the
 * adapter hand-emitted `timeUpdate` / `playingChange` / `playToEnd` (ungated,
 * sometimes double) and left `statusChange` / `volumeChange` / `durationChange` /
 * `trackChange`-from-index declared-but-never-fired. Now every granular event
 * fans out ONCE from the snapshot diff, exactly like the player and recorder.
 *
 * Driven by a minimal concrete subclass whose `setState` is exposed to the test.
 */
import {
  type AudioPlaylistCapabilities,
  type AudioPlaylistState,
  BaseAudioPlaylistController,
} from "./playlist-controller-base";

class TestPlaylistController extends BaseAudioPlaylistController {
  readonly capabilities: AudioPlaylistCapabilities = {
    canSetVolume: true,
    canSetPlaybackRate: true,
  };
  push(patch: Partial<AudioPlaylistState>): boolean {
    return this.setState(patch);
  }
  play(): void {}
  pause(): void {}
  seekTo(): void {}
  next(): void {}
  previous(): void {}
  skipTo(): void {}
  setVolume(): void {}
  setMuted(): void {}
  setPlaybackRate(): void {}
  setLoop(): void {}
  add(): void {}
  insert(): void {}
  remove(): void {}
  clear(): void {}
}

describe("BaseAudioPlaylistController.deriveEvents", () => {
  it("derives trackChange from the currentIndex diff (previous → current)", () => {
    const c = new TestPlaylistController();
    const track = jest.fn();
    c.on("trackChange", track);

    c.push({ currentIndex: 2 });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith({ previousIndex: 0, currentIndex: 2 });

    c.push({ currentTime: 5 }); // unrelated → no re-fire
    expect(track).toHaveBeenCalledTimes(1);
    c.dispose();
  });

  it("emits the previously-dead statusChange / volumeChange / durationChange", () => {
    const c = new TestPlaylistController();
    const status = jest.fn();
    const volume = jest.fn();
    const duration = jest.fn();
    c.on("statusChange", status);
    c.on("volumeChange", volume);
    c.on("durationChange", duration);

    c.push({ status: "readyToPlay", volume: 0.4, duration: 120 });
    expect(status).toHaveBeenCalledWith({ status: "readyToPlay", error: null });
    expect(volume).toHaveBeenCalledWith({ volume: 0.4, muted: false });
    expect(duration).toHaveBeenCalledWith({ duration: 120 });
    c.dispose();
  });

  it("gates timeUpdate on having a listener (hot path)", () => {
    const c = new TestPlaylistController();
    expect(c.push({ currentTime: 1 })).toBe(true); // advances; no listener → no emit

    const time = jest.fn();
    c.on("timeUpdate", time);
    c.push({ currentTime: 2 });
    expect(time).toHaveBeenCalledTimes(1);
    expect(time).toHaveBeenCalledWith({ currentTime: 2, duration: 0 });
    c.dispose();
  });

  it("fires playingChange and playToEnd once on their edges", () => {
    const c = new TestPlaylistController();
    const playing = jest.fn();
    const end = jest.fn();
    c.on("playingChange", playing);
    c.on("playToEnd", end);

    c.push({ playing: true });
    expect(playing).toHaveBeenCalledWith({ playing: true });

    c.push({ ended: true });
    c.push({ currentTime: 9 }); // still ended → no re-fire
    expect(end).toHaveBeenCalledTimes(1);
    c.dispose();
  });

  it("does not emit anything when setState is a no-op", () => {
    const c = new TestPlaylistController();
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
