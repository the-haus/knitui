import * as React from "react";

import type { AuxInputParams } from "./types";

/** Min wheel delta (px) to register, and the cooldown between page advances. */
const WHEEL_THRESHOLD = 8;
const WHEEL_COOLDOWN_MS = 320;
/** A pause this long between wheel events ends a gesture (a swipe and its inertia). */
const WHEEL_GESTURE_GAP_MS = 140;
/**
 * A delta this much larger than the event before it is a NEW push, not the
 * tail of the last one: inertia only decays, with a pixel or two of jitter.
 */
const WHEEL_PUSH_FACTOR = 1.5;
const WHEEL_PUSH_MIN = 8;

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
 * ONE step per gesture: a trackpad swipe keeps sending wheel events for a
 * second or more of inertia, well past the cooldown, and each stretch of it
 * over the threshold used to page again (one swipe: two or three pages). A
 * gesture ends on a pause (`WHEEL_GESTURE_GAP_MS`) or when the deltas grow
 * again after decaying (a second swipe made inside the first one's tail); a
 * mouse wheel's notches are far enough apart to each be their own.
 *
 * Single axis: a vertical carousel owns vertical wheel; a horizontal one owns
 * horizontal wheel and also takes a plain vertical wheel (a mouse has no
 * sideways wheel). A vertical carousel leaves a mostly SIDEWAYS scroll alone:
 * a trackpad's sideways swipe always carries a pixel of vertical jitter, and
 * consuming it kept every such swipe from a horizontal carousel around it (a
 * rail of vertical stacks).
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
    let lastEvent = 0;
    let lastSize = 0;
    let stepped = false;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      // Not this carousel's scroll: left for a horizontal one around it.
      if (!crossController && vertical && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
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
      const now = e.timeStamp;
      const size = Math.abs(delta);
      const push = size >= lastSize * WHEEL_PUSH_FACTOR && size - lastSize >= WHEEL_PUSH_MIN;
      // A push inside the cooldown is the same swipe still gathering speed.
      const settled = now - last >= WHEEL_COOLDOWN_MS;
      if (now - lastEvent > WHEEL_GESTURE_GAP_MS || (push && settled)) stepped = false;
      lastEvent = now;
      lastSize = size;
      if (size < WHEEL_THRESHOLD) return;
      if (stepped || now - last < WHEEL_COOLDOWN_MS) return;
      stepped = true;
      last = now;
      if (delta > 0) target.next();
      else target.prev();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [hostRef, enabled, vertical, controller, crossController]);
}
