import * as React from "react";

import { act, renderHook } from "@testing-library/react";

import {
  createMediaControllerHook,
  type MediaControllerFacade,
  type MediaControllerHookContext,
  type MediaControllerHookOptionsBase,
  type MediaEngineLike,
} from "./createMediaControllerHook";

interface FakeState {
  playing: boolean;
  tick: number;
}

interface FakeOptions extends MediaControllerHookOptionsBase<string> {
  sampling?: boolean;
}

/** Minimal in-memory engine standing in for the audio/video shared engines. */
class FakeSession {
  readonly listeners = new Set<() => void>();
  readonly registered: Array<{ id: string; source: string; config: Record<string, unknown> }> = [];
  readonly updates: Array<{ id: string; patch: unknown }> = [];
  readonly unregistered: string[] = [];
  private readonly snapshots = new Map<string, FakeState>();

  register(id: string, descriptor: { source: string; config: Record<string, unknown> }): void {
    this.registered.push({ id, ...descriptor });
    this.snapshots.set(id, { playing: false, tick: 0 });
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  snapshotFor(id: string): FakeState {
    return this.snapshots.get(id) ?? { playing: false, tick: 0 };
  }
  update(id: string, patch: { source?: string; config?: Record<string, unknown> }): void {
    this.updates.push({ id, patch });
  }
  unregister(id: string): void {
    this.unregistered.push(id);
  }
  /** Test helper: publish a fresh snapshot and notify subscribers. */
  emit(id: string, next: FakeState): void {
    this.snapshots.set(id, next);
    for (const listener of this.listeners) listener();
  }
}

class FakeFacade implements MediaControllerFacade<string> {
  readonly calls: string[] = [];
  replace(source: string): void {
    this.calls.push(`replace:${source}`);
  }
  setLoop(loop: boolean): void {
    this.calls.push(`setLoop:${loop}`);
  }
  setMuted(muted: boolean): void {
    this.calls.push(`setMuted:${muted}`);
  }
  setVolume(volume: number): void {
    this.calls.push(`setVolume:${volume}`);
  }
  setPlaybackRate(rate: number): void {
    this.calls.push(`setPlaybackRate:${rate}`);
  }
  play(): void {
    this.calls.push("play");
  }
}

function makeFixture() {
  const session = new FakeSession();
  const facade = new FakeFacade();
  const engine: MediaEngineLike<string, FakeState, FakeFacade> = {
    session,
    getFacade: () => facade,
  };
  const extraSyncCalls: string[] = [];
  function useExtraSync(
    ctx: MediaControllerHookContext<string, FakeState, FakeFacade, FakeOptions>,
  ): void {
    const { options } = ctx;
    React.useEffect(() => {
      extraSyncCalls.push(`sampling:${Boolean(options.sampling)}`);
    }, [options.sampling]);
  }
  const useController = createMediaControllerHook<string, FakeState, FakeFacade, FakeOptions>({
    useEngine: () => engine,
    configBag: (o) => ({ volume: o.volume, sampling: Boolean(o.sampling) }),
    useExtraSync,
  });
  return { session, facade, extraSyncCalls, useController };
}

describe("createMediaControllerHook", () => {
  it("registers the player slot exactly once with the source + config bag", () => {
    const { session, useController } = makeFixture();
    const { rerender } = renderHook((props: FakeOptions) => useController(props), {
      initialProps: { source: "a", volume: 0.5 },
    });
    rerender({ source: "a", volume: 0.5 });

    expect(session.registered).toHaveLength(1);
    expect(session.registered[0].source).toBe("a");
    expect(session.registered[0].config).toEqual({ volume: 0.5, sampling: false });
  });

  it("exposes a store whose snapshot reflects engine changes", () => {
    const { session, useController } = makeFixture();
    const { result } = renderHook(() => useController({ source: "a" }));
    const id = session.registered[0].id;

    expect(result.current.store.getSnapshot()).toEqual({ playing: false, tick: 0 });

    act(() => session.emit(id, { playing: true, tick: 1 }));
    expect(result.current.store.getSnapshot()).toEqual({ playing: true, tick: 1 });
  });

  it("notifies store subscribers when the engine emits", () => {
    const { session, useController } = makeFixture();
    const { result } = renderHook(() => useController({ source: "a" }));
    const id = session.registered[0].id;

    let calls = 0;
    const unsub = result.current.store.subscribe(() => {
      calls++;
    });
    act(() => session.emit(id, { playing: true, tick: 1 }));
    expect(calls).toBe(1);
    unsub();
  });

  it("keeps a stable store reference across renders", () => {
    const { useController } = makeFixture();
    const { result, rerender } = renderHook(() => useController({ source: "a" }));
    const first = result.current.store;
    rerender();
    expect(result.current.store).toBe(first);
  });

  it("does NOT replace on the first render but DOES on a source change", () => {
    const { facade, useController } = makeFixture();
    const { rerender } = renderHook((props: FakeOptions) => useController(props), {
      initialProps: { source: "a" },
    });
    expect(facade.calls).not.toContain("replace:a");

    rerender({ source: "b" });
    expect(facade.calls).toContain("replace:b");
  });

  it("autoplays on mount only when autoPlay is set", () => {
    const withAutoplay = makeFixture();
    renderHook(() => withAutoplay.useController({ source: "a", autoPlay: true }));
    expect(withAutoplay.facade.calls).toContain("play");

    const without = makeFixture();
    renderHook(() => without.useController({ source: "a" }));
    expect(without.facade.calls).not.toContain("play");
  });

  it("runs the domain extra-sync effect", () => {
    const { extraSyncCalls, useController } = makeFixture();
    renderHook(() => useController({ source: "a", sampling: true }));
    expect(extraSyncCalls).toEqual(["sampling:true"]);
  });

  it("unregisters the slot on unmount", () => {
    const { session, useController } = makeFixture();
    const { unmount } = renderHook(() => useController({ source: "a" }));
    const id = session.registered[0].id;
    unmount();
    expect(session.unregistered).toContain(id);
  });
});
