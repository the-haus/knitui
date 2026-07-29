import * as React from "react";

import { Text } from "@knitui/components";

import { Carousel } from "../index";
import { render, screen } from "../test-utils";
import type { CarouselProps } from "../types";

/**
 * The web `grabbing` affordance (`useDragCursor`). Driven through the real
 * carousel so the host element and the `enabled` wiring are covered too.
 *
 * jsdom has no `PointerEvent` constructor, so RTL's `fireEvent.pointerDown`
 * would drop `pointerType`/`button`/`clientX` (the fields the hook keys off).
 * Dispatch a plain `Event` with those fields pinned on instead.
 */
function pointer(type: string, init: Partial<PointerEvent> = {}) {
  return Object.assign(new Event(type, { bubbles: true }), {
    pointerType: "mouse",
    button: 0,
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    ...init,
  });
}

function mount(props: Partial<CarouselProps<number>> = {}) {
  render(
    <Carousel
      data={[0, 1, 2]}
      itemSize={100}
      testID="carousel"
      style={{ width: 100, height: 100 }}
      renderItem={({ item }) => <Text>{`slide-${item}`}</Text>}
      {...props}
    />,
  );
  return screen.getByTestId("carousel") as HTMLElement;
}

describe("useDragCursor (web)", () => {
  it("leaves the idle cursor alone — nothing changes on hover or on a press", () => {
    const el = mount();
    expect(el.style.cursor).toBe("");

    // A press is not yet a drag, and neither is a sub-threshold twitch.
    el.dispatchEvent(pointer("pointerdown"));
    expect(el.style.cursor).toBe("");
    document.dispatchEvent(pointer("pointermove", { clientX: 3 }));
    expect(el.style.cursor).toBe("");

    // Releasing it stays a click: still no cursor change at any point.
    document.dispatchEvent(pointer("pointerup", { clientX: 3 }));
    expect(el.style.cursor).toBe("");
  });

  it("paints `grabbing` once travel passes the drag threshold, then restores it", () => {
    const el = mount();
    el.dispatchEvent(pointer("pointerdown"));
    document.dispatchEvent(pointer("pointermove", { clientX: 40 }));
    expect(el.style.cursor).toBe("grabbing");

    // Releases are heard on the document: a drag routinely ends outside the rail.
    document.dispatchEvent(pointer("pointerup", { clientX: 40 }));
    expect(el.style.cursor).toBe("");
  });

  it("restores the cursor when the gesture is cancelled", () => {
    const el = mount();
    el.dispatchEvent(pointer("pointerdown"));
    document.dispatchEvent(pointer("pointermove", { clientY: 40 }));
    expect(el.style.cursor).toBe("grabbing");
    document.dispatchEvent(pointer("pointercancel", { clientY: 40 }));
    expect(el.style.cursor).toBe("");
  });

  it("ignores moves and releases from a different pointer", () => {
    const el = mount();
    el.dispatchEvent(pointer("pointerdown", { pointerId: 1 }));
    document.dispatchEvent(pointer("pointermove", { pointerId: 7, clientX: 40 }));
    expect(el.style.cursor).toBe("");

    document.dispatchEvent(pointer("pointermove", { pointerId: 1, clientX: 40 }));
    document.dispatchEvent(pointer("pointerup", { pointerId: 7, clientX: 40 }));
    expect(el.style.cursor).toBe("grabbing");
  });

  it("leaves the cursor alone for touch/pen and for secondary buttons", () => {
    const el = mount();
    el.dispatchEvent(pointer("pointerdown", { pointerType: "touch" }));
    document.dispatchEvent(pointer("pointermove", { clientX: 40 }));
    expect(el.style.cursor).toBe("");

    el.dispatchEvent(pointer("pointerdown", { button: 2 }));
    document.dispatchEvent(pointer("pointermove", { clientX: 80 }));
    expect(el.style.cursor).toBe("");
  });

  it("adds no affordance when dragging is disabled", () => {
    const el = mount({ enabled: false });
    el.dispatchEvent(pointer("pointerdown"));
    document.dispatchEvent(pointer("pointermove", { clientX: 40 }));
    expect(el.style.cursor).toBe("");
  });

  it("adds no affordance in native scroll mode (the scroll surface owns it)", () => {
    // `useDragScroll` paints the cursor on the inner scroll node instead, so the
    // frame itself stays untouched.
    const el = mount({ scrollMode: "native" });
    el.dispatchEvent(pointer("pointerdown"));
    document.dispatchEvent(pointer("pointermove", { clientX: 40 }));
    expect(el.style.cursor).toBe("");
  });
});
