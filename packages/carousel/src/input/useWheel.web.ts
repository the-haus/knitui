import * as React from "react";

import type { AuxInputParams } from "./types";

/** Min wheel delta (px) to register, and the cooldown between page advances. */
const WHEEL_THRESHOLD = 8;
const WHEEL_COOLDOWN_MS = 320;

/**
 * Mouse-wheel / trackpad navigation: each decisive scroll along the axis
 * advances one page, throttled so a single inertial wheel gesture doesn't fly
 * through many items.
 *
 * A wheel event the carousel owns is consumed whole: `preventDefault` stops the
 * page scrolling and `stopPropagation` keeps it from a parent's own wheel
 * handler (a map zooming under a deck), including the small deltas under the
 * step threshold and the inertial tail inside the cooldown. A pinch
 * (`ctrlKey`) is never consumed.
 *
 * Single axis: a vertical carousel owns vertical wheel; a horizontal one owns
 * horizontal wheel and also takes a plain vertical wheel (a mouse has no
 * sideways wheel).
 * Two axes (`crossController`): each event goes to its dominant direction,
 * vertical wheel → the vertical axis, horizontal wheel (trackpad sideways, or
 * shift + wheel) → the horizontal axis, sharing one cooldown so the tail of one
 * gesture can't step the other axis.
 */
export function useWheel({
  hostRef,
  enabled,
  vertical,
  controller,
  crossController,
}: AuxInputParams): void {
  React.useEffect(() => {
    if (!enabled) return;
    const el = hostRef.current as HTMLElement | null;
    if (!el) return;

    let last = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      let delta: number;
      let target: { next: () => void; prev: () => void } = controller;
      if (crossController) {
        // Shift + wheel on a mouse that the browser didn't already turn sideways.
        const dx = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
        const dy = e.shiftKey && e.deltaX === 0 ? 0 : e.deltaY;
        const horizontal = Math.abs(dx) > Math.abs(dy);
        delta = horizontal ? dx : dy;
        if (horizontal === vertical) target = crossController;
      } else {
        delta = vertical ? e.deltaY : e.deltaX || e.deltaY;
      }
      if (delta === 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (Math.abs(delta) < WHEEL_THRESHOLD) return;
      const now = e.timeStamp;
      if (now - last < WHEEL_COOLDOWN_MS) return;
      last = now;
      if (delta > 0) target.next();
      else target.prev();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [hostRef, enabled, vertical, controller, crossController]);
}
