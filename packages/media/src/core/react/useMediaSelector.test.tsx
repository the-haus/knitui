import { act, renderHook } from "@testing-library/react";

import { type MediaStore, shallowEqual, useMediaSelector } from "./useMediaSelector";

interface State {
  currentTime: number;
  muted: boolean;
  volume: number;
}

/** A tiny external store standing in for a media session / controller. */
class FakeStore implements MediaStore<State> {
  private state: State = { currentTime: 0, muted: false, volume: 1 };
  private readonly listeners = new Set<() => void>();
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  getSnapshot(): State {
    return this.state;
  }
  set(patch: Partial<State>): void {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l();
  }
}

describe("shallowEqual", () => {
  it("treats Object.is-equal scalars and same refs as equal", () => {
    expect(shallowEqual(1, 1)).toBe(true);
    const obj = { a: 1 };
    expect(shallowEqual(obj, obj)).toBe(true);
  });
  it("compares own enumerable keys one level deep", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
  it("is not deep", () => {
    expect(shallowEqual({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false);
  });
});

describe("useMediaSelector", () => {
  it("returns the selected slice", () => {
    const store = new FakeStore();
    const { result } = renderHook(() => useMediaSelector(store, (s) => s.muted));
    expect(result.current).toBe(false);
  });

  it("re-renders only when the selected slice changes", () => {
    const store = new FakeStore();
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useMediaSelector(store, (s) => s.muted);
    });
    expect(renders).toBe(1);

    // A change to an UNSELECTED field must NOT re-render.
    act(() => store.set({ currentTime: 5 }));
    expect(renders).toBe(1);
    expect(result.current).toBe(false);

    // A change to the SELECTED field re-renders.
    act(() => store.set({ muted: true }));
    expect(renders).toBe(2);
    expect(result.current).toBe(true);
  });

  it("keeps a stable reference for object selections via shallowEqual", () => {
    const store = new FakeStore();
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useMediaSelector(store, (s) => ({ muted: s.muted, volume: s.volume }), shallowEqual);
    });
    const first = result.current;
    expect(renders).toBe(1);

    // Unrelated field churns the snapshot but not the selected object.
    act(() => store.set({ currentTime: 99 }));
    expect(renders).toBe(1);
    expect(result.current).toBe(first);

    // A selected field changes → new object, re-render.
    act(() => store.set({ volume: 0.5 }));
    expect(renders).toBe(2);
    expect(result.current).toEqual({ muted: false, volume: 0.5 });
  });

  it("does not tear when the selector closure changes between renders", () => {
    const store = new FakeStore();
    const { result, rerender } = renderHook(
      ({ field }: { field: "muted" | "volume" }) => useMediaSelector(store, (s) => s[field]),
      { initialProps: { field: "muted" } as { field: "muted" | "volume" } },
    );
    expect(result.current).toBe(false);
    rerender({ field: "volume" });
    expect(result.current).toBe(1);
  });
});

/** A store with per-field channels — the auto-tracking path. */
class FieldStore implements MediaStore<State> {
  private state: State = { currentTime: 0, muted: false, volume: 1 };
  private readonly fieldListeners = new Map<keyof State, Set<() => void>>();
  /** Coarse subscribe is unused by the field path; present to satisfy the type. */
  subscribe(): () => void {
    return () => {};
  }
  getSnapshot(): State {
    return this.state;
  }
  subscribeKeys(keys: Iterable<keyof State>, listener: () => void): () => void {
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
  set(patch: Partial<State>): void {
    const prev = this.state;
    this.state = { ...this.state, ...patch };
    const notified = new Set<() => void>();
    for (const key in patch) {
      const k = key as keyof State;
      if (this.state[k] === prev[k]) continue;
      this.fieldListeners.get(k)?.forEach((l) => notified.add(l));
    }
    for (const l of notified) l();
  }
}

describe("useMediaSelector — field-scoped (auto-tracking) store", () => {
  it("does not even RUN the selector when an untracked field changes", () => {
    const store = new FieldStore();
    const selector = jest.fn((s: State) => s.muted);
    const { result } = renderHook(() => useMediaSelector(store, selector));
    expect(result.current).toBe(false);
    const baseline = selector.mock.calls.length;

    // `currentTime` isn't read by the selector → the store never wakes it, so the
    // selector isn't re-run AT ALL (state-level isolation, not a render bail).
    act(() => store.set({ currentTime: 5 }));
    expect(selector.mock.calls.length).toBe(baseline);
    expect(result.current).toBe(false);

    // The tracked field wakes it and re-renders.
    act(() => store.set({ muted: true }));
    expect(selector.mock.calls.length).toBeGreaterThan(baseline);
    expect(result.current).toBe(true);
  });

  it("tracks every field a multi-field selector reads", () => {
    const store = new FieldStore();
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useMediaSelector(store, (s) => ({ muted: s.muted, volume: s.volume }), shallowEqual);
    });
    expect(renders).toBe(1);

    act(() => store.set({ currentTime: 9 })); // untracked → no wake
    expect(renders).toBe(1);

    act(() => store.set({ volume: 0.5 })); // tracked → wake + re-render
    expect(renders).toBe(2);
    expect(result.current).toEqual({ muted: false, volume: 0.5 });

    act(() => store.set({ muted: true })); // the other tracked field → wake
    expect(renders).toBe(3);
    expect(result.current).toEqual({ muted: true, volume: 0.5 });
  });

  it("re-subscribes when the selector's tracked field-set changes across renders", () => {
    // Regression for C1: a prop-driven field swap updates `keysRef` during render
    // but does not re-run `subscribe`; the live registration must still be
    // reconciled to the new field, or updates to it are silently missed.
    const store = new FieldStore();
    const { result, rerender } = renderHook(
      ({ field }: { field: "muted" | "volume" }) => useMediaSelector(store, (s) => s[field]),
      { initialProps: { field: "muted" } as { field: "muted" | "volume" } },
    );
    expect(result.current).toBe(false);

    rerender({ field: "volume" }); // tracked set: {muted} → {volume}
    expect(result.current).toBe(1);

    // The OLD field no longer matters — a change to it must NOT update.
    act(() => store.set({ muted: true }));
    expect(result.current).toBe(1);

    // A change to the NEWLY-tracked field MUST update (the bug: stayed at 1).
    act(() => store.set({ volume: 0.25 }));
    expect(result.current).toBe(0.25);
  });
});
