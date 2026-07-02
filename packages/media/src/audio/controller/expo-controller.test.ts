/**
 * Controller-level tests for {@link ExpoAudioController}, driven by a
 * `FakeAudioPlayer` that implements only the `expo-audio` `AudioPlayer` surface
 * the controller touches. Focused on event identity: a `playbackStatusUpdate`
 * stamped with a DIFFERENT player's `id` must be ignored, so two players loaded
 * from the same audio file can't drive each other's state.
 */
import type { AudioPlayer, AudioStatus } from "expo-audio";

import { ExpoAudioController } from "./expo-controller";

type StatusListener = (status: AudioStatus) => void;

/** Minimal stand-in for an expo-audio `AudioPlayer`. */
class FakeAudioPlayer {
  volume = 1;
  muted = false;
  playbackRate = 1;
  shouldCorrectPitch = true;
  loop = false;
  playing = false;
  currentTime = 0;
  duration = 0;
  isBuffering = false;
  isLoaded = false;
  isLive = false;
  crossOrigin: string | undefined = undefined;
  private listeners: StatusListener[] = [];

  constructor(public id: string) {}

  addListener(_event: "playbackStatusUpdate", cb: StatusListener): { remove(): void } {
    this.listeners.push(cb);
    return {
      remove: () => {
        this.listeners = this.listeners.filter((l) => l !== cb);
      },
    };
  }

  emit(status: AudioStatus): void {
    for (const l of this.listeners) l(status);
  }
}

/** Build a plausible `AudioStatus` carrying the given player `id`. */
function makeStatus(id: string, overrides: Partial<AudioStatus> = {}): AudioStatus {
  return {
    id,
    currentTime: 0,
    duration: 0,
    playing: false,
    mute: false,
    loop: false,
    didJustFinish: false,
    isBuffering: false,
    isLoaded: true,
    isLive: false,
    playbackRate: 1,
    shouldCorrectPitch: true,
    error: null,
    ...overrides,
  } as AudioStatus;
}

function make(id = "player-A"): { player: FakeAudioPlayer; controller: ExpoAudioController } {
  const player = new FakeAudioPlayer(id);
  const controller = new ExpoAudioController(player as unknown as AudioPlayer);
  return { player, controller };
}

describe("ExpoAudioController event identity", () => {
  it("processes its own status updates (adopting the id from the first event)", () => {
    const { player, controller } = make("player-A");
    player.emit(makeStatus("player-A", { playing: true, currentTime: 12 }));
    expect(controller.state.playing).toBe(true);
    expect(controller.state.currentTime).toBe(12);
  });

  it("ignores a DIFFERENT player's status once its own identity is known (same-file isolation)", () => {
    const { player, controller } = make("player-A");
    // The player establishes its identity from its own first status...
    player.emit(makeStatus("player-A", { currentTime: 5 }));
    const sub = jest.fn();
    controller.subscribe(sub);
    // ...then a sibling player (same audio file) leaking onto a shared bus is ignored.
    player.emit(makeStatus("player-B", { playing: true, currentTime: 99 }));
    expect(controller.state.playing).toBe(false);
    expect(controller.state.currentTime).toBe(5);
    expect(sub).not.toHaveBeenCalled();
  });

  it("never drops its own updates even if the id diverges from player.id", () => {
    // Regression guard: the listener must NOT compare against `player.id` (which
    // can differ from the event payload's id on the real web backend, freezing
    // state). It adopts whatever id its own event stream carries.
    const { player, controller } = make("player-A");
    player.emit(makeStatus("some-other-internal-id", { playing: true, currentTime: 7 }));
    expect(controller.state.playing).toBe(true);
    expect(controller.state.currentTime).toBe(7);
  });

  it("still processes events when the backend omits an id (never self-drop)", () => {
    const { player, controller } = make("player-A");
    player.emit(makeStatus(undefined as unknown as string, { playing: true }));
    expect(controller.state.playing).toBe(true);
  });

  it("re-adopts when the payload id rotates but matches the live player.id (never freeze)", () => {
    // The one shared player must never be permanently gated out: if a backend
    // rotates the status id across a `replace()` (the id still equals the live
    // `player.id`), the controller re-adopts it instead of dropping every tick —
    // otherwise audio plays while currentTime/scrubber freezes.
    const { player, controller } = make("player-A");
    player.emit(makeStatus("player-A", { playing: true, currentTime: 3 }));
    // The player's live id rotates (e.g. a new AVPlayerItem) and its status follows.
    player.id = "player-A#2";
    player.emit(makeStatus("player-A#2", { playing: true, currentTime: 8 }));
    expect(controller.state.currentTime).toBe(8);
  });
});
