/**
 * Controller-level tests for the play INTENT that {@link ExpoVideoController}
 * carries across a surface swap — the seam that makes the shared, teleported
 * `<video>` usable by more than one player.
 *
 * The bug these pin down: `expo-video`'s web backend applies `play()` by iterating
 * the elements currently MOUNTED into the player, so a call made while no view is
 * attached is dropped in silence — no throw, no error status, nothing to retry
 * from. That happens on a plain cold mount (the play call beats the surface's own
 * effect) and on every handoff in a shared session (the surface is destroyed and a
 * NEW element is built for the incoming player). Consumers saw a loaded, ready
 * clip sitting at `paused: true` with a controller reporting `playing: true`.
 *
 * {@link FakeVideoPlayer} reproduces exactly that behaviour — `play()` only takes
 * when a view is mounted — so these tests fail against a controller that fires
 * and forgets.
 */
import type { VideoPlayer } from "expo-video";

import { ExpoVideoController, type ExpoVideoViewHandle } from "./expo-controller";

/**
 * Minimal stand-in for an `expo-video` `VideoPlayer`, faithful in the ONE respect
 * these tests are about: a `play()`/`replay()` with no view mounted is accepted
 * and dropped.
 */
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

  /** How many views are mounted. Zero ⇒ playback commands go nowhere. */
  mountedViews = 0;
  playCalls = 0;
  pauseCalls = 0;
  replayCalls = 0;

  private listeners = new Map<string, Array<(payload: unknown) => void>>();

  /**
   * Only a MOUNTED element reports playback, matching the web backend: the events
   * are wired per element as it mounts, so a command that reached no element also
   * emits nothing — which is precisely why the controller can end up out of step
   * with reality.
   */
  play(): void {
    this.playCalls += 1;
    if (this.mountedViews > 0) {
      this.playing = true;
      this.emit("playingChange", { isPlaying: true });
    }
  }

  pause(): void {
    this.pauseCalls += 1;
    const wasPlaying = this.playing;
    this.playing = false;
    if (this.mountedViews > 0 && wasPlaying) this.emit("playingChange", { isPlaying: false });
  }

  replay(): void {
    this.replayCalls += 1;
    if (this.mountedViews > 0) {
      this.currentTime = 0;
      this.playing = true;
      this.emit("playingChange", { isPlaying: true });
    }
  }

  async replaceAsync(): Promise<void> {}

  addListener(event: string, cb: (payload: unknown) => void): { remove(): void } {
    const existing = this.listeners.get(event) ?? [];
    existing.push(cb);
    this.listeners.set(event, existing);
    return {
      remove: () => {
        this.listeners.set(
          event,
          (this.listeners.get(event) ?? []).filter((l) => l !== cb),
        );
      },
    };
  }

  emit(event: string, payload: unknown): void {
    for (const l of this.listeners.get(event) ?? []) l(payload);
  }
}

/** A view handle whose fullscreen/PiP surface is irrelevant to these tests. */
const VIEW: ExpoVideoViewHandle = {
  enterFullscreen: async () => {},
  exitFullscreen: async () => {},
  startPictureInPicture: async () => {},
  stopPictureInPicture: async () => {},
};

function make(config?: { autoPlay?: boolean }): {
  player: FakeVideoPlayer;
  controller: ExpoVideoController;
} {
  const player = new FakeVideoPlayer();
  const controller = new ExpoVideoController(player as unknown as VideoPlayer, config);
  return { player, controller };
}

/** The surface arriving: the element mounts first, then the handle registers. */
function attachSurface(player: FakeVideoPlayer, controller: ExpoVideoController): void {
  player.mountedViews += 1;
  controller.attachView(VIEW);
}

/** The surface going away — the element leaves with it. */
function detachSurface(player: FakeVideoPlayer, controller: ExpoVideoController): void {
  player.mountedViews -= 1;
  controller.attachView(null);
}

describe("ExpoVideoController play intent across a surface swap", () => {
  it("re-applies a play() that was dropped because no view was attached yet", () => {
    const { player, controller } = make();

    // The cold-mount case: play lands before the surface exists.
    controller.play();
    expect(player.playCalls).toBe(1);
    expect(player.playing).toBe(false);

    attachSurface(player, controller);
    expect(player.playCalls).toBe(2);
    expect(player.playing).toBe(true);
  });

  it("re-applies the intent on the NEW surface when the element is handed over", () => {
    const { player, controller } = make();
    attachSurface(player, controller);
    controller.play();
    expect(player.playing).toBe(true);

    // The session hands the shared element to another player and back: the old
    // surface is destroyed, a new one is built. Nothing replays the play call.
    detachSurface(player, controller);
    player.playing = false;
    attachSurface(player, controller);

    expect(player.playing).toBe(true);
  });

  it("carries a constructor autoPlay through to a late attach", () => {
    const { player, controller } = make({ autoPlay: true });
    expect(player.playing).toBe(false);

    attachSurface(player, controller);
    expect(player.playing).toBe(true);
  });

  it("treats replay() as a play intent too", () => {
    const { player, controller } = make();
    controller.replay();
    expect(player.playing).toBe(false);

    attachSurface(player, controller);
    expect(player.playing).toBe(true);
  });

  it("does NOT start playback when the standing intent is paused", () => {
    const { player, controller } = make();
    controller.play();
    controller.pause();
    const before = player.playCalls;

    attachSurface(player, controller);
    expect(player.playCalls).toBe(before);
    expect(player.playing).toBe(false);
  });

  it("never starts playback for a player that was never asked to play", () => {
    const { player, controller } = make();
    attachSurface(player, controller);
    expect(player.playCalls).toBe(0);
    expect(player.playing).toBe(false);
  });

  it("reports playing: false once the surface detaches", () => {
    const { player, controller } = make();
    attachSurface(player, controller);
    controller.play();
    expect(controller.state.playing).toBe(true);

    // The outgoing element takes playback with it and never reports a `pause`
    // (it is unmounted from the player first), so the snapshot has to be
    // corrected here or it keeps claiming a torn-down element is playing —
    // which is what made consumers' play/pause toggles do the opposite.
    detachSurface(player, controller);
    expect(controller.state.playing).toBe(false);
  });

  it("does not resurrect playback on a disposed controller", () => {
    const { player, controller } = make();
    controller.play();
    controller.dispose();
    const before = player.playCalls;

    attachSurface(player, controller);
    expect(player.playCalls).toBe(before);
    expect(player.playing).toBe(false);
  });
});
