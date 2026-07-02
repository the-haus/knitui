import { MediaFacadeBase } from "./media-facade.shared";
import {
  type FacadeController,
  type MediaDescriptor,
  MediaSession,
  type MediaSessionState,
} from "./media-session.shared";

type FakeState = MediaSessionState;

function fakeState(overrides?: Partial<FakeState>): FakeState {
  return {
    status: "idle",
    playing: false,
    currentTime: 0,
    duration: 0,
    bufferedPosition: -1,
    volume: 1,
    muted: false,
    playbackRate: 1,
    loop: false,
    isLive: false,
    ended: false,
    error: null,
    ...overrides,
  };
}

/** A minimal in-memory controller standing in for Html/Expo controllers. */
class FakeController implements FacadeController<FakeState> {
  state: FakeState = fakeState();
  readonly capabilities = {};
  readonly replaceCalls: string[] = [];
  readonly seekCalls: number[] = [];
  private readonly listeners = new Set<(s: FakeState) => void>();

  subscribe(listener: (s: FakeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  on(): () => void {
    return () => {};
  }
  play(): void {
    this.patch({ playing: true });
  }
  pause(): void {
    this.patch({ playing: false });
  }
  replay(): void {
    this.patch({ currentTime: 0, playing: true });
  }
  seekTo(seconds: number): void {
    this.seekCalls.push(seconds);
    this.patch({ currentTime: seconds });
  }
  setVolume(volume: number): void {
    this.patch({ volume });
  }
  setMuted(muted: boolean): void {
    this.patch({ muted });
  }
  setPlaybackRate(rate: number): void {
    this.patch({ playbackRate: rate });
  }
  setLoop(loop: boolean): void {
    this.patch({ loop });
  }
  replace(source: string): void {
    this.replaceCalls.push(source);
    this.patch({ currentTime: 0, duration: 0, playing: false });
  }
  retry(): void {}
  dispose(): void {}

  /** Test helper: simulate playback / load progress. */
  patch(p: Partial<FakeState>): void {
    this.state = { ...this.state, ...p };
    for (const l of [...this.listeners]) l(this.state);
  }
}

/** A controller that also exposes per-field channels (like the real ones). */
class FieldFakeController extends FakeController {
  private readonly fieldListeners = new Map<keyof FakeState, Set<() => void>>();
  subscribeKeys(keys: Iterable<keyof FakeState>, listener: () => void): () => void {
    const list = [...keys];
    for (const k of list) {
      let set = this.fieldListeners.get(k);
      if (!set) {
        set = new Set();
        this.fieldListeners.set(k, set);
      }
      set.add(listener);
    }
    return () => {
      for (const k of list) this.fieldListeners.get(k)?.delete(listener);
    };
  }
  override patch(p: Partial<FakeState>): void {
    const prev = this.state;
    super.patch(p);
    const notified = new Set<() => void>();
    for (const key in p) {
      const k = key as keyof FakeState;
      if (this.state[k] === prev[k]) continue;
      this.fieldListeners.get(k)?.forEach((l) => notified.add(l));
    }
    for (const l of notified) l();
  }
}

function makeSession(c: FakeController): MediaSession<FakeController, FakeState, string> {
  return new MediaSession<FakeController, FakeState, string>({
    controller: c,
    createIdleState: (d: MediaDescriptor<string>) =>
      fakeState({
        currentTime: d.lastPosition,
        duration: d.lastDuration,
        volume: typeof d.config.volume === "number" ? d.config.volume : 1,
      }),
  });
}

class TestFacade extends MediaFacadeBase<FakeController, FakeState, string> {}

describe("MediaSession", () => {
  it("activates a player: swaps source and becomes active", () => {
    const c = new FakeController();
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" });
    s.register("B", { source: "b.mp3" });

    s.activate("A");
    expect(s.activeId).toBe("A");
    expect(c.replaceCalls).toEqual(["a.mp3"]);
  });

  it("captures the outgoing player's position and resumes on return", () => {
    const c = new FakeController();
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" });
    s.register("B", { source: "b.mp3" });

    s.activate("A");
    c.patch({ currentTime: 12, duration: 100 }); // A plays to 12s

    s.activate("B");
    expect(s.activeId).toBe("B");
    expect(c.replaceCalls).toEqual(["a.mp3", "b.mp3"]);

    // A is now idle, remembering 12s.
    const aIdle = s.snapshotFor("A");
    expect(aIdle.currentTime).toBe(12);
    expect(aIdle.duration).toBe(100);
    expect(aIdle.playing).toBe(false);

    // Returning to A re-seeks to the remembered position.
    c.seekCalls.length = 0;
    s.activate("A");
    expect(c.replaceCalls).toEqual(["a.mp3", "b.mp3", "a.mp3"]);
    expect(c.seekCalls).toContain(12);
  });

  it("returns the LIVE snapshot for the active player", () => {
    const c = new FakeController();
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" });
    s.activate("A");
    c.patch({ currentTime: 7 });
    expect(s.snapshotFor("A")).toBe(c.state);
    expect(s.snapshotFor("A").currentTime).toBe(7);
  });

  it("memoizes the idle snapshot (stable ref until the descriptor changes)", () => {
    const c = new FakeController();
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" });
    s.register("B", { source: "b.mp3" });
    s.activate("A");

    const first = s.snapshotFor("B");
    expect(s.snapshotFor("B")).toBe(first); // same ref → no useSyncExternalStore loop

    s.update("B", { lastPosition: 30 });
    const second = s.snapshotFor("B");
    expect(second).not.toBe(first);
    expect(second.currentTime).toBe(30);
  });

  it("auto-activates the first registered player when none is active", () => {
    const c = new FakeController();
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" });
    expect(s.activeId).toBe("A");
    expect(c.replaceCalls).toEqual(["a.mp3"]);
    // A second registration does NOT steal focus.
    s.register("B", { source: "b.mp3" });
    expect(s.activeId).toBe("A");
  });

  it("notifies subscribers on activation and on live changes", () => {
    const c = new FakeController();
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" }); // auto-activates A
    s.register("B", { source: "b.mp3" });
    const fn = jest.fn();
    s.subscribe(fn);

    s.activate("B");
    expect(fn).toHaveBeenCalled();
    fn.mockClear();
    c.patch({ currentTime: 1 });
    expect(fn).toHaveBeenCalled();
  });

  it("unregister never disposes the engine; dispose tears it down", () => {
    const c = new FakeController();
    const disposeSpy = jest.spyOn(c, "dispose");
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" });
    s.activate("A");
    s.unregister("A");
    expect(s.activeId).toBeNull();
    expect(disposeSpy).not.toHaveBeenCalled();
    s.dispose();
    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it("pauses the shared controller when the ACTIVE player unregisters", () => {
    // Guards the "plays double on mount" StrictMode bug: an active player's
    // playback must not outlive its component, or a remount stacks a second
    // stream on the first.
    const c = new FakeController();
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" }); // auto-activates A
    c.play();
    expect(c.state.playing).toBe(true);

    s.unregister("A");
    expect(s.activeId).toBeNull();
    expect(c.state.playing).toBe(false); // controller was stopped
  });

  it("leaves the controller alone when an INACTIVE player unregisters", () => {
    const c = new FakeController();
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" }); // active
    s.register("B", { source: "b.mp3" }); // inactive
    c.play();

    s.unregister("B"); // dropping the inactive slot must not stop playback
    expect(s.activeId).toBe("A");
    expect(c.state.playing).toBe(true);
  });
});

describe("MediaFacadeBase", () => {
  it("play() activates this player and drives the engine", () => {
    const c = new FakeController();
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" });
    s.register("C", { source: "c.mp3" });
    const f = new TestFacade(s, "C");

    f.play();
    expect(s.activeId).toBe("C");
    expect(c.state.playing).toBe(true);
    expect(c.replaceCalls).toContain("c.mp3");
  });

  it("an inactive seek stores the resume point instead of touching the engine", () => {
    const c = new FakeController();
    const s = makeSession(c);
    s.register("A", { source: "a.mp3" });
    s.register("C", { source: "c.mp3" });
    const f = new TestFacade(s, "C");

    s.activate("A"); // C inactive
    c.seekCalls.length = 0;
    f.seekTo(5);
    expect(c.seekCalls).toEqual([]); // engine untouched
    expect(f.state.currentTime).toBe(5); // idle snapshot reflects the stored point
  });

  it("reads the active player's live state through the facade", () => {
    const c = new FakeController();
    const s = makeSession(c);
    s.register("C", { source: "c.mp3" });
    const f = new TestFacade(s, "C");
    f.play();
    c.patch({ currentTime: 3, volume: 0.5 });
    expect(f.state.currentTime).toBe(3);
    expect(f.state.volume).toBe(0.5);
  });
});

describe("MediaSession field-scoped subscription", () => {
  function makeFieldSession(
    c: FieldFakeController,
  ): MediaSession<FieldFakeController, FakeState, string> {
    return new MediaSession<FieldFakeController, FakeState, string>({
      controller: c,
      createIdleState: (d: MediaDescriptor<string>) => fakeState({ currentTime: d.lastPosition }),
    });
  }

  it("subscribeControllerKeys fires only when one of the given fields changes", () => {
    const c = new FieldFakeController();
    const s = makeFieldSession(c);
    s.register("A", { source: "a.mp3" });
    const fn = jest.fn();
    const off = s.subscribeControllerKeys(["volume"], fn);

    c.patch({ currentTime: 5 }); // unrelated field
    expect(fn).not.toHaveBeenCalled();

    c.patch({ volume: 0.3 });
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    s.dispose();
  });

  it("subscribeStructural fires on activation and descriptor edits, never on a per-frame tick", () => {
    const c = new FieldFakeController();
    const s = makeFieldSession(c);
    s.register("A", { source: "a.mp3" }); // auto-activates A
    s.register("B", { source: "b.mp3" });
    const fn = jest.fn();
    s.subscribeStructural(fn);

    c.patch({ currentTime: 1 }); // a per-frame controller tick is NOT structural
    expect(fn).not.toHaveBeenCalled();

    s.activate("B"); // activation flip → structural
    expect(fn).toHaveBeenCalledTimes(1);

    s.update("B", { lastPosition: 9 }); // descriptor edit → structural
    expect(fn).toHaveBeenCalledTimes(2);
    s.dispose();
  });
});
