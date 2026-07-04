import * as React from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

import { act, render } from "../test-utils";
import { useWebPainter } from "./painter.web";

/**
 * The web painter writes slide transforms directly to the DOM on every offset
 * change. These guard its performance contract: it promotes each slide to its
 * own compositor layer, writes the right transform, and — crucially — does *no*
 * DOM work for a repaint at an unchanged scroll position (a redundant listener
 * fire, or a settle animation's final duplicate frame).
 */
describe("useWebPainter — paint output & redundant-write guard", () => {
  interface Handle {
    offset: SharedValue<number>;
    size: SharedValue<number>;
  }

  /** A progress value that counts how many times the painter writes to it. */
  interface CountingProgress {
    _v: number;
    writes: number;
    value: number;
  }
  const countingProgress = (): CountingProgress => ({
    _v: 0,
    writes: 0,
    get value() {
      return this._v;
    },
    set value(v: number) {
      this._v = v;
      this.writes++;
    },
  });

  function Host({
    handle,
    el,
    progress,
  }: {
    handle: { current: Handle | null };
    el: HTMLElement;
    progress: CountingProgress;
  }) {
    const offset = useSharedValue(0);
    const size = useSharedValue(100);
    handle.current = { offset, size };
    const register = useWebPainter({
      offset,
      size,
      count: 10,
      loop: false,
      // Standard side-by-side layout: item i sits progress×100px away.
      animationStyle: (p: number) => ({ transform: [{ translateX: p * 100 }] }),
    });
    React.useEffect(() => {
      register(2, { el, progress: progress as never });
      return () => register(2, null);
    }, [register, el, progress]);
    return null;
  }

  it("promotes the slide to its own layer and paints its transform", () => {
    const handle: { current: Handle | null } = { current: null };
    const el = document.createElement("div");
    render(<Host handle={handle} el={el} progress={countingProgress()} />);

    // Compositor-layer hint set once on registration.
    expect(el.style.willChange).toBe("transform");
    // At offset 0, item 2's progress is 2 → translateX(200px).
    expect(el.style.transform).toBe("translateX(200px)");

    act(() => {
      handle.current!.offset.value = -100; // scroll 1 → item 2 progress 1
    });
    expect(el.style.transform).toBe("translateX(100px)");
  });

  it("skips the repaint entirely when the scroll position is unchanged", () => {
    const handle: { current: Handle | null } = { current: null };
    const el = document.createElement("div");
    const progress = countingProgress();
    render(<Host handle={handle} el={el} progress={progress} />);

    act(() => {
      handle.current!.offset.value = -100;
    });
    const writes = progress.writes;

    // Re-assigning the same offset fires the listener but resolves to the same
    // scroll → the guard short-circuits before touching any entry.
    act(() => {
      handle.current!.offset.value = -100;
    });
    expect(progress.writes).toBe(writes);

    // A genuinely different offset paints again.
    act(() => {
      handle.current!.offset.value = -150;
    });
    expect(progress.writes).toBeGreaterThan(writes);
  });

  it("does not rewrite constant properties frame to frame (diffing)", () => {
    const handle: { current: Handle | null } = { current: null };
    const el = document.createElement("div");
    render(<Host handle={handle} el={el} progress={countingProgress()} />);

    // The normal layout never sets opacity/zIndex, so after the first paint they
    // stay empty and the diff leaves them untouched as the transform animates.
    act(() => {
      handle.current!.offset.value = -100;
    });
    expect(el.style.opacity).toBe("");
    expect(el.style.zIndex).toBe("");
    // Transform still tracks the offset.
    expect(el.style.transform).toBe("translateX(100px)");
  });
});
