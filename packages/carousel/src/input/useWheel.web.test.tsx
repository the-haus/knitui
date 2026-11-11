import * as React from "react";

import { render, screen } from "../test-utils";
import type { CarouselRef } from "../types";
import { useWheel } from "./useWheel.web";

/**
 * The web wheel input (`useWheel`), driven on a bare host element so the timing
 * of a gesture is the only thing under test. jsdom's `WheelEvent` has no settable
 * `timeStamp`, so a plain `Event` carries the fields the hook reads.
 */
function wheel(at: number, deltaY: number, deltaX = 0) {
  const event = Object.assign(new Event("wheel", { bubbles: true, cancelable: true }), {
    deltaX,
    deltaY,
    ctrlKey: false,
    shiftKey: false,
  });
  Object.defineProperty(event, "timeStamp", { value: at });
  return event;
}

function mount(vertical: boolean) {
  const controller = { next: jest.fn(), prev: jest.fn() };
  function Host() {
    const hostRef = React.useRef<HTMLDivElement>(null);
    useWheel({
      hostRef,
      enabled: true,
      vertical,
      count: 5,
      controller: controller as unknown as CarouselRef,
    });
    return <div ref={hostRef} data-testid="host" />;
  }
  render(<Host />);
  return { controller, host: screen.getByTestId("host") };
}

describe("useWheel (web)", () => {
  it("steps once for a swipe and its inertia, however long the tail runs", () => {
    const { controller, host } = mount(true);
    // A trackpad swipe: speed gathers, then decays for well over a second.
    const deltas = [4, 20, 60, 90, 70, 55, 44, 36, 30, 25, 21, 18, 15, 13, 11, 10, 9, 9, 8, 8];
    deltas.forEach((delta, i) => host.dispatchEvent(wheel(1000 + i * 60, delta)));

    expect(controller.next).toHaveBeenCalledTimes(1);
  });

  it("steps again after a pause", () => {
    const { controller, host } = mount(true);
    host.dispatchEvent(wheel(1000, 40));
    host.dispatchEvent(wheel(1060, 30));
    host.dispatchEvent(wheel(1600, 40));

    expect(controller.next).toHaveBeenCalledTimes(2);
  });

  it("takes a second swipe made inside the first one's tail", () => {
    const { controller, host } = mount(true);
    [60, 50, 40, 32, 26, 21, 17, 14].forEach((delta, i) =>
      host.dispatchEvent(wheel(1000 + i * 60, delta)),
    );
    // No pause, but the deltas grow again once the cooldown is over.
    host.dispatchEvent(wheel(1480, 70));

    expect(controller.next).toHaveBeenCalledTimes(2);
  });

  it("gives each notch of a mouse wheel its own step", () => {
    const { controller, host } = mount(true);
    host.dispatchEvent(wheel(1000, 100));
    host.dispatchEvent(wheel(1400, 100));
    host.dispatchEvent(wheel(1800, -100));

    expect(controller.next).toHaveBeenCalledTimes(2);
    expect(controller.prev).toHaveBeenCalledTimes(1);
  });

  it("leaves a mostly sideways scroll to a horizontal carousel around a vertical one", () => {
    const { controller, host } = mount(true);
    const event = wheel(1000, 2, 40);
    host.dispatchEvent(event);

    expect(controller.next).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
