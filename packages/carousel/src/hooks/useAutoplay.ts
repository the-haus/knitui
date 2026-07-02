import * as React from "react";

import type { CarouselRef } from "../types";

export interface AutoplayParams {
  enabled: boolean;
  reverse: boolean;
  interval: number;
  controller: CarouselRef;
}

export interface AutoplayHandle {
  pause: () => void;
  resume: () => void;
}

/**
 * Self-rescheduling autoplay: each tick advances one item and arms the next
 * timer only when that scroll settles (so the interval is the gap *between*
 * transitions, not wall-clock). `pause`/`resume` are wired to interaction
 * (touch, focus) and document visibility by the caller.
 */
export function useAutoplay({
  enabled,
  reverse,
  interval,
  controller,
}: AutoplayParams): AutoplayHandle {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopped = React.useRef(!enabled);

  const clear = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const tick = React.useCallback(() => {
    if (stopped.current || !enabled) return;
    clear();
    timer.current = setTimeout(() => {
      const move = reverse ? controller.prev : controller.next;
      move({ onFinished: tick });
    }, interval);
  }, [enabled, reverse, interval, controller, clear]);

  const resume = React.useCallback(() => {
    if (!enabled) return;
    stopped.current = false;
    tick();
  }, [enabled, tick]);

  const pause = React.useCallback(() => {
    stopped.current = true;
    clear();
  }, [clear]);

  React.useEffect(() => {
    if (enabled) resume();
    else pause();
    return pause;
  }, [enabled, resume, pause]);

  return React.useMemo(() => ({ pause, resume }), [pause, resume]);
}
