import * as React from "react";

import { act, render } from "@testing-library/react";

import { useMove } from "./use-move";
import type { MovePosition } from "./use-move.shared";

/**
 * Coverage for `useMove`'s web drag math, and specifically for the per-gesture
 * rect cache.
 *
 * The cache exists because `getBoundingClientRect()` inside `pointermove` is a
 * forced layout flush and `onChange` synchronously writes layout — a read → write
 * → read thrash at pointer rate. It is only safe because it is INVALIDATED
 * whenever the rect could have moved (any document scroll, a window resize), so
 * these tests pin both halves: that it measures once per gesture, and that it
 * re-measures after the events that would otherwise make it stale. Without the
 * second half a cached rect would silently drift the drag origin.
 */

const RECT = { left: 100, top: 50, width: 200, height: 100 } as DOMRect;

/**
 * Mount the hook on a real div with a stubbed, counted `getBoundingClientRect`.
 *
 * The ref is attached through a CALLBACK ref rather than assigned after mount:
 * `useMove` wires its `pointerdown` listener in an effect with an empty dep array,
 * so the node has to be in place before effects run — exactly as it is for a real
 * consumer rendering `<div ref={ref} />`. Stubbing the measure inside the callback
 * ref keeps it in place for the same reason.
 */
function setup(rect: DOMRect = RECT) {
  let node: HTMLDivElement | null = null;
  let measures = 0;
  let current = rect;
  const positions: MovePosition[] = [];

  function Harness() {
    const { ref } = useMove((p) => positions.push(p));
    return React.createElement("div", {
      ref: (el: HTMLDivElement | null) => {
        (ref as unknown as React.MutableRefObject<unknown>).current = el;
        if (el) {
          node = el;
          el.getBoundingClientRect = () => {
            measures += 1;
            return current;
          };
        }
      },
    });
  }

  const view = render(React.createElement(Harness));

  return {
    node: () => node as HTMLDivElement,
    positions,
    measureCount: () => measures,
    setRect: (next: DOMRect) => {
      current = next;
    },
    unmount: view.unmount,
  };
}

const pointer = (type: string, clientX: number, clientY: number) =>
  new (window as unknown as { PointerEvent: typeof MouseEvent }).PointerEvent(type, {
    clientX,
    clientY,
    bubbles: true,
  });

// jsdom has no PointerEvent; MouseEvent carries the clientX/clientY the hook reads.
beforeAll(() => {
  if (!("PointerEvent" in window)) {
    (window as unknown as Record<string, unknown>).PointerEvent = MouseEvent;
  }
});

describe("useMove (web)", () => {
  it("reports the normalized position on pointerdown and while moving", () => {
    const { node, positions } = setup();

    act(() => {
      node().dispatchEvent(pointer("pointerdown", 150, 75));
    });
    // (150-100)/200 = 0.25, (75-50)/100 = 0.25
    expect(positions.at(-1)).toEqual({ x: 0.25, y: 0.25 });

    act(() => {
      window.dispatchEvent(pointer("pointermove", 200, 100));
    });
    // (200-100)/200 = 0.5, (100-50)/100 = 0.5
    expect(positions.at(-1)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("clamps to [0, 1] outside the element", () => {
    const { node, positions } = setup();

    act(() => {
      node().dispatchEvent(pointer("pointerdown", 150, 75));
      window.dispatchEvent(pointer("pointermove", -500, -500));
    });
    expect(positions.at(-1)).toEqual({ x: 0, y: 0 });

    act(() => {
      window.dispatchEvent(pointer("pointermove", 5000, 5000));
    });
    expect(positions.at(-1)).toEqual({ x: 1, y: 1 });
  });

  it("measures the rect ONCE per gesture, not per move event", () => {
    const { node, measureCount } = setup();

    act(() => {
      node().dispatchEvent(pointer("pointerdown", 150, 75));
    });
    const afterDown = measureCount();
    expect(afterDown).toBe(1);

    act(() => {
      for (let i = 0; i < 25; i++) {
        window.dispatchEvent(pointer("pointermove", 150 + i, 75));
      }
    });
    expect(measureCount()).toBe(afterDown);
  });

  it("re-measures after a scroll, so a moved element does not drift", () => {
    const { node, positions, measureCount, setRect } = setup();

    act(() => {
      node().dispatchEvent(pointer("pointerdown", 150, 75));
      window.dispatchEvent(pointer("pointermove", 200, 100));
    });
    expect(positions.at(-1)).toEqual({ x: 0.5, y: 0.5 });
    const before = measureCount();

    // The element scrolls up by 50px; the same client point is now further down it.
    setRect({ left: 100, top: 0, width: 200, height: 100 } as DOMRect);
    act(() => {
      document.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(pointer("pointermove", 200, 100));
    });

    expect(measureCount()).toBeGreaterThan(before);
    // (100-0)/100 = 1 on the y axis against the new rect.
    expect(positions.at(-1)).toEqual({ x: 0.5, y: 1 });
  });

  it("re-measures after a window resize", () => {
    const { node, positions, setRect } = setup();

    act(() => {
      node().dispatchEvent(pointer("pointerdown", 150, 75));
    });

    setRect({ left: 100, top: 50, width: 400, height: 100 } as DOMRect);
    act(() => {
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(pointer("pointermove", 300, 75));
    });

    // (300-100)/400 = 0.5 against the widened rect (would be 1 against the old).
    expect(positions.at(-1)).toEqual({ x: 0.5, y: 0.25 });
  });

  it("re-measures for a NEW gesture even with no scroll or resize", () => {
    const { node, positions, setRect } = setup();

    act(() => {
      node().dispatchEvent(pointer("pointerdown", 150, 75));
      window.dispatchEvent(pointer("pointerup", 150, 75));
    });

    setRect({ left: 0, top: 0, width: 200, height: 100 } as DOMRect);
    act(() => {
      node().dispatchEvent(pointer("pointerdown", 100, 50));
    });
    // (100-0)/200 = 0.5 against the relocated rect.
    expect(positions.at(-1)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("stops tracking after pointerup", () => {
    const { node, positions } = setup();

    act(() => {
      node().dispatchEvent(pointer("pointerdown", 150, 75));
      window.dispatchEvent(pointer("pointerup", 150, 75));
    });
    const count = positions.length;

    act(() => {
      window.dispatchEvent(pointer("pointermove", 250, 100));
    });
    expect(positions.length).toBe(count);
  });
});
