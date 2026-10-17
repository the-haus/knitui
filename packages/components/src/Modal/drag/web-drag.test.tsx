import * as React from "react";

import { render } from "../../test-utils";
import { DragValue, springConstants } from "./drag-value";
import { DragDismissDetector } from "./DragDismissDetector";
import { useDragDismiss } from "./useDragDismiss";

// The web build of drag-to-dismiss (jest resolves `.web.*` / the default web
// files): `DragValue` + pointer events, no reanimated / RNGH / worklets.

/** jsdom has no `PointerEvent` constructor: a MouseEvent carrying the fields. */
function pointer(type: string, init: { x?: number; y?: number; id?: number } = {}): Event {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.x ?? 0,
    clientY: init.y ?? 0,
    button: 0,
  });
  Object.defineProperty(event, "pointerId", { value: init.id ?? 1 });
  Object.defineProperty(event, "pointerType", { value: "touch" });
  return event;
}

describe("DragValue", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("notifies listeners on write and springs to rest at the target", () => {
    const value = new DragValue(0);
    const seen: number[] = [];
    value.addListener(1, (v) => seen.push(v));
    value.value = 10;
    expect(seen).toEqual([10]);

    const done = jest.fn();
    value.animateTo(200, { damping: 29, stiffness: 300, mass: 1 }, 0, done);
    jest.advanceTimersByTime(3000);
    expect(value.value).toBe(200);
    expect(done).toHaveBeenCalledWith(true);
  });

  it("reports an interrupted spring as unfinished, and a write cancels it", () => {
    const value = new DragValue(0);
    const done = jest.fn();
    value.animateTo(300, {}, 0, done);
    jest.advanceTimersByTime(32);
    value.value = 50;
    expect(done).toHaveBeenCalledWith(false);
    jest.advanceTimersByTime(3000);
    expect(value.value).toBe(50);
  });

  it("derives physical constants from a duration-based config", () => {
    const { stiffness, damping, mass } = springConstants({ duration: 400, dampingRatio: 1 });
    expect(mass).toBe(1);
    expect(stiffness).toBeGreaterThan(0);
    expect(damping).toBeCloseTo(2 * Math.sqrt(stiffness * mass), 5);
  });
});

describe("web useDragDismiss", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function Harness({ offset, onDismiss }: { offset: DragValue; onDismiss: () => void }) {
    const gesture = useDragDismiss({
      offset,
      axis: "y",
      sign: -1,
      extent: 400,
      enabled: true,
      onDismiss,
    });
    return (
      <DragDismissDetector gesture={gesture}>
        <div data-testid="catcher">panel</div>
      </DragDismissDetector>
    );
  }

  it("ignores a tap, tracks a drag past the threshold, and dismisses on release", () => {
    const offset = new DragValue(0);
    const onDismiss = jest.fn();
    const { getByTestId } = render(<Harness offset={offset} onDismiss={onDismiss} />);
    const catcher = getByTestId("catcher");
    expect(catcher.style.touchAction).toBe("none");

    // A tap (under the activation threshold) never moves the panel.
    catcher.dispatchEvent(pointer("pointerdown", { y: 500 }));
    window.dispatchEvent(pointer("pointermove", { y: 496 }));
    window.dispatchEvent(pointer("pointerup", { y: 496 }));
    expect(offset.value).toBe(0);

    // Drag UP (sign -1) 200px: travel 200 toward the dismiss edge.
    catcher.dispatchEvent(pointer("pointerdown", { y: 500 }));
    window.dispatchEvent(pointer("pointermove", { y: 400 }));
    window.dispatchEvent(pointer("pointermove", { y: 300 }));
    expect(offset.value).toBe(200);
    window.dispatchEvent(pointer("pointerup", { y: 300 }));
    jest.advanceTimersByTime(3000);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("springs back without dismissing when released short of the threshold", () => {
    const offset = new DragValue(0);
    const onDismiss = jest.fn();
    const { getByTestId } = render(<Harness offset={offset} onDismiss={onDismiss} />);
    const catcher = getByTestId("catcher");

    catcher.dispatchEvent(pointer("pointerdown", { y: 500 }));
    window.dispatchEvent(pointer("pointermove", { y: 470 }));
    // Wrong way (down) clamps at rest.
    window.dispatchEvent(pointer("pointermove", { y: 600 }));
    expect(offset.value).toBe(0);
    window.dispatchEvent(pointer("pointermove", { y: 450 }));
    expect(offset.value).toBe(50);
    window.dispatchEvent(pointer("pointerup", { y: 450 }));
    jest.advanceTimersByTime(3000);
    expect(offset.value).toBe(0);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("springs back when the browser cancels the pointer", () => {
    const offset = new DragValue(0);
    const onDismiss = jest.fn();
    const { getByTestId } = render(<Harness offset={offset} onDismiss={onDismiss} />);
    const catcher = getByTestId("catcher");

    catcher.dispatchEvent(pointer("pointerdown", { y: 500 }));
    window.dispatchEvent(pointer("pointermove", { y: 200 }));
    window.dispatchEvent(pointer("pointercancel", { y: 200 }));
    jest.advanceTimersByTime(3000);
    expect(offset.value).toBe(0);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
