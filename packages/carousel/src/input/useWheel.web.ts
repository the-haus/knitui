import * as React from "react";

import type { AuxInputParams } from "./types";

/** Min wheel delta (px) to register, and the cooldown between page advances. */
const WHEEL_THRESHOLD = 8;
const WHEEL_COOLDOWN_MS = 320;

/**
 * Mouse-wheel / trackpad navigation: each decisive scroll along the axis
 * advances one page, throttled so a single inertial wheel gesture doesn't fly
 * through many items. Prevents the page from scrolling while we consume it.
 */
export function useWheel({ hostRef, enabled, vertical, controller }: AuxInputParams): void {
  React.useEffect(() => {
    if (!enabled) return;
    const el = hostRef.current as HTMLElement | null;
    if (!el) return;

    let last = 0;
    const onWheel = (e: WheelEvent) => {
      const delta = vertical ? e.deltaY : e.deltaX || e.deltaY;
      if (Math.abs(delta) < WHEEL_THRESHOLD) return;
      e.preventDefault();
      const now = e.timeStamp;
      if (now - last < WHEEL_COOLDOWN_MS) return;
      last = now;
      if (delta > 0) controller.next();
      else controller.prev();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [hostRef, enabled, vertical, controller]);
}
