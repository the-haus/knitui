/**
 * Controller-level tests for {@link ExpoAudioController}, driven by a
 * `FakeAudioPlayer` that implements only the `expo-audio` `AudioPlayer` surface
 * the controller touches. Focused on event identity: a `playbackStatusUpdate`
 * stamped with a DIFFERENT player's `id` must be ignored, so two players loaded
 * from the same audio file can't drive each other's state.
 */
import type { AudioPlayer, AudioStatus } from "expo-audio";

import { STREAM_STALL_MESSAGE, STREAM_STALL_TIMEOUT_MS } from "../../shared";
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
  /** Every transport call, in order, so a test can assert their sequence. */
  calls: string[] = [];
  /** Settles the seek in flight; a test holds it open to observe the ordering. */
  finishSeek: () => void = () => {};
  private listeners: StatusListener[] = [];

  constructor(public id: string) {}

  play(): void {
    this.calls.push("play");
  }

  pause(): void {
    this.calls.push("pause");
  }

  replace(): void {
    this.calls.push("replace");
  }

  seekTo(seconds: number): Promise<void> {
    this.calls.push(`seek:${seconds}`);
    return new Promise((resolve) => {
      this.finishSeek = resolve;
    });
  }

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

describe("ExpoAudioController transport", () => {
  const flush = (): Promise<void> => Promise.resolve().then(() => undefined);

  it("keeps an error once later statuses stop mentioning it", () => {
    const { player, controller } = make();
    player.emit(makeStatus("player-A", { isLoaded: false, error: "404" } as Partial<AudioStatus>));
    player.emit(makeStatus("player-A", { isLoaded: false, isBuffering: true }));

    expect(controller.state.status).toBe("error");
    expect(controller.state.error).toEqual({ message: "404" });
    expect(controller.state.isBuffering).toBe(false);
  });

  it("clears an error when the source loads", () => {
    const { player, controller } = make();
    player.emit(makeStatus("player-A", { isLoaded: false, error: "404" } as Partial<AudioStatus>));
    player.emit(makeStatus("player-A", { isLoaded: true }));

    expect(controller.state.status).toBe("readyToPlay");
    expect(controller.state.error).toBeNull();
  });

  it("stays playing through a rebuffer, so the toggle can still pause", () => {
    const { player, controller } = make();
    controller.play();
    player.emit(makeStatus("player-A", { playing: true }));
    player.emit(makeStatus("player-A", { playing: false, isBuffering: true }));

    expect(controller.state.playing).toBe(true);
    expect(controller.state.isBuffering).toBe(true);
  });

  it("stops reporting playing when the backend pauses on its own", () => {
    const { player, controller } = make();
    controller.play();
    player.emit(makeStatus("player-A", { playing: true }));
    player.emit(makeStatus("player-A", { playing: false }));
    player.emit(makeStatus("player-A", { playing: false, isBuffering: true }));

    expect(controller.state.playing).toBe(false);
  });

  it("restarts from the top when played after the end", async () => {
    const { player, controller } = make();
    player.currentTime = 30;
    player.emit(makeStatus("player-A", { didJustFinish: true, currentTime: 30, duration: 30 }));
    expect(controller.state.ended).toBe(true);
    player.currentTime = 0;

    controller.play();
    expect(player.calls).toEqual(["seek:0"]);
    expect(controller.state.ended).toBe(false);

    player.finishSeek();
    await flush();
    expect(player.calls).toEqual(["seek:0", "play"]);
  });

  it("drops a replay that was paused before its seek landed", async () => {
    const { player, controller } = make();
    controller.replay();
    controller.pause();
    player.finishSeek();
    await flush();

    expect(player.calls).toEqual(["seek:0", "pause"]);
  });

  it("retries a failed source when played", () => {
    const { player, controller } = make();
    player.emit(makeStatus("player-A", { isLoaded: false, error: "gone" } as Partial<AudioStatus>));

    controller.play();

    expect(player.calls).toEqual(["replace", "play"]);
    expect(controller.state.status).toBe("loading");
    expect(controller.state.error).toBeNull();
  });

  it("resumes a retry at the position it failed", () => {
    const { player, controller } = make();
    player.emit(makeStatus("player-A", { currentTime: 40, duration: 100 }));
    player.emit(
      makeStatus("player-A", {
        isLoaded: false,
        currentTime: 40,
        error: "x",
      } as Partial<AudioStatus>),
    );

    controller.retry();
    expect(controller.state.currentTime).toBe(40);

    player.emit(makeStatus("player-A", { isLoaded: true, duration: 100 }));
    expect(player.calls).toEqual(["replace", "seek:40"]);
  });

  it("holds a seek made before the source has loaded", () => {
    const { player, controller } = make();
    controller.replace("https://a.test/x.mp3");
    void controller.seekTo(12);
    expect(player.calls).toEqual(["replace"]);

    player.emit(makeStatus("player-A", { isLoaded: true, duration: 100 }));
    expect(player.calls).toEqual(["replace", "seek:12"]);
  });

  it("keeps playing across a source change", () => {
    const { player, controller } = make();
    controller.play();
    player.calls = [];

    controller.replace("https://a.test/next.mp3");

    expect(player.calls).toEqual(["replace", "play"]);
  });
});

describe("ExpoAudioController stream failures", () => {
  it("reports a stream that gave out as an error, not as the end", () => {
    const { player, controller } = make();
    player.currentTime = 16;
    player.emit(makeStatus("player-A", { didJustFinish: true, currentTime: 372, duration: 372 }));
    player.emit(makeStatus("player-A", { currentTime: 16, duration: 372 }));

    expect(controller.state.ended).toBe(false);
    expect(controller.state.status).toBe("error");
    expect(controller.state.currentTime).toBe(16);
  });

  it("treats finishing near an inexact duration as the end", () => {
    const { player, controller } = make();
    player.currentTime = 366;
    player.emit(makeStatus("player-A", { didJustFinish: true, currentTime: 370, duration: 370 }));

    expect(controller.state.ended).toBe(true);
    expect(controller.state.status).toBe("readyToPlay");
  });

  it("clears the failure on retry", () => {
    const { player, controller } = make();
    player.currentTime = 16;
    player.emit(makeStatus("player-A", { didJustFinish: true, currentTime: 372, duration: 372 }));

    controller.retry();
    player.emit(makeStatus("player-A", { currentTime: 0, duration: 372 }));

    expect(controller.state.error).toBeNull();
  });
});

describe("ExpoAudioController finish reports after a load", () => {
  it("ignores the replaced source's finish when it is reported again", () => {
    const { player, controller } = make();
    const finished = makeStatus("player-A", { didJustFinish: true, currentTime: 30, duration: 30 });
    player.currentTime = 30;
    player.emit(finished);
    expect(controller.state.ended).toBe(true);

    // The playlist moves on; the same report then arrives a second time (iOS:
    // the listener, then the status bridge), with the new track at its start.
    controller.replace("https://a.test/next.mp3");
    player.currentTime = 0;
    controller.applyStatus(finished);

    expect(controller.state.error).toBeNull();
    expect(controller.state.status).toBe("loading");
    expect(controller.state.ended).toBe(false);

    player.currentTime = 1;
    player.emit(makeStatus("player-A", { playing: true, currentTime: 1, duration: 30 }));
    expect(controller.state.status).toBe("readyToPlay");
    expect(controller.state.playing).toBe(true);
    expect(controller.state.error).toBeNull();
  });

  it("takes one status object once, whichever feed brings it again", () => {
    const { player, controller } = make();
    const playing = makeStatus("player-A", { playing: true, currentTime: 12, duration: 30 });
    player.emit(playing);
    controller.pause();
    player.emit(makeStatus("player-A", { currentTime: 13, duration: 30 }));
    expect(controller.state.playing).toBe(false);

    // The bridge, a render behind, with the object the listener already delivered.
    controller.applyStatus(playing);

    expect(controller.state.playing).toBe(false);
    expect(controller.state.currentTime).toBe(13);
  });

  it("ignores a copy of the old finish that arrives while the new source loads", () => {
    const { player, controller } = make();
    player.currentTime = 30;
    player.emit(makeStatus("player-A", { didJustFinish: true, currentTime: 30, duration: 30 }));

    controller.replace("https://a.test/next.mp3");
    player.currentTime = 0;
    player.emit(makeStatus("player-A", { isLoaded: false, isBuffering: true }));
    // Not the same object this time: a backend that reports the finish again.
    player.emit(makeStatus("player-A", { didJustFinish: true, currentTime: 30, duration: 30 }));

    expect(controller.state.error).toBeNull();
    expect(controller.state.ended).toBe(false);

    player.emit(makeStatus("player-A", { playing: true, currentTime: 1, duration: 30 }));
    expect(controller.state.status).toBe("readyToPlay");
  });

  it("still ends the new source when it finishes", () => {
    const { player, controller } = make();
    controller.replace("https://a.test/next.mp3");
    player.emit(makeStatus("player-A", { playing: true, currentTime: 1, duration: 30 }));
    player.currentTime = 30;
    player.emit(makeStatus("player-A", { didJustFinish: true, currentTime: 30, duration: 30 }));

    expect(controller.state.ended).toBe(true);
    expect(controller.state.error).toBeNull();
  });
});

describe("ExpoAudioController play requests the backend dropped", () => {
  it("asks once more when the next track loads and stays silent", () => {
    const { player, controller } = make();
    controller.play();
    player.emit(makeStatus("player-A", { playing: true, currentTime: 29, duration: 30 }));
    player.currentTime = 30;
    player.emit(makeStatus("player-A", { didJustFinish: true, currentTime: 30, duration: 30 }));

    // What a playlist does on a finish.
    controller.replace("https://a.test/next.mp3");
    controller.play();
    player.calls = [];
    player.currentTime = 0;
    player.emit(makeStatus("player-A", { isLoaded: false, isBuffering: true }));
    expect(player.calls).toEqual([]);

    player.emit(makeStatus("player-A", { duration: 30 }));
    expect(player.calls).toEqual(["play"]);

    // Once only: a backend that will not play is not asked on every status.
    player.emit(makeStatus("player-A", { duration: 30 }));
    expect(player.calls).toEqual(["play"]);
  });

  it("leaves a request alone once the backend has honoured it", () => {
    const { player, controller } = make();
    controller.play();
    player.emit(makeStatus("player-A", { playing: true, currentTime: 1, duration: 30 }));
    player.calls = [];

    // The backend pausing on its own (an interruption) is not ours to undo.
    player.emit(makeStatus("player-A", { currentTime: 2, duration: 30 }));

    expect(player.calls).toEqual([]);
    expect(controller.state.playing).toBe(false);
  });

  it("does not ask again after a pause", () => {
    const { player, controller } = make();
    controller.play();
    controller.pause();
    player.calls = [];

    player.emit(makeStatus("player-A", { duration: 30 }));

    expect(player.calls).toEqual([]);
  });
});

describe("ExpoAudioController stall watchdog (web)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function withElement(): {
    player: FakeAudioPlayer;
    controller: ExpoAudioController;
    media: HTMLAudioElement;
  } {
    const player = new FakeAudioPlayer("player-A");
    const media = document.createElement("audio");
    (player as unknown as { media: HTMLAudioElement }).media = media;
    const controller = new ExpoAudioController(player as unknown as AudioPlayer);
    return { player, controller, media };
  }

  it("fails a stream that never recovers, and retry keeps the intent to play", () => {
    const { player, controller, media } = withElement();
    controller.play();
    player.emit(makeStatus("player-A", { playing: true, duration: 100 }));
    media.dispatchEvent(new Event("waiting"));
    expect(controller.state.isBuffering).toBe(true);

    jest.advanceTimersByTime(STREAM_STALL_TIMEOUT_MS);

    expect(controller.state.status).toBe("error");
    expect(controller.state.error?.message).toBe(STREAM_STALL_MESSAGE);
    expect(controller.state.playing).toBe(false);
    expect(controller.state.isBuffering).toBe(false);

    player.emit(makeStatus("player-A", { playing: false, duration: 100 }));
    expect(controller.state.status).toBe("error");

    player.calls = [];
    controller.retry();
    expect(player.calls).toEqual(["replace", "play"]);
  });

  it("stands down when playback resumes", () => {
    const { player, controller, media } = withElement();
    controller.play();
    player.emit(makeStatus("player-A", { playing: true, duration: 100 }));
    media.dispatchEvent(new Event("waiting"));
    jest.advanceTimersByTime(STREAM_STALL_TIMEOUT_MS - 1);
    media.dispatchEvent(new Event("playing"));
    jest.advanceTimersByTime(STREAM_STALL_TIMEOUT_MS);

    expect(controller.state.status).toBe("readyToPlay");
  });

  it("ignores a stall while paused", () => {
    const { controller, media } = withElement();
    media.dispatchEvent(new Event("waiting"));
    jest.advanceTimersByTime(STREAM_STALL_TIMEOUT_MS);

    expect(controller.state.status).not.toBe("error");
  });
});
