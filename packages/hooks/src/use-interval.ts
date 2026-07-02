import { useCallback, useEffect, useRef, useState } from "react";

export interface UseIntervalOptions {
  /** Start the interval as soon as the hook mounts. @default false */
  autoInvoke?: boolean;
}

export interface UseIntervalReturn {
  /** Start the interval. */
  start: () => void;
  /** Stop the interval. */
  stop: () => void;
  /** Toggle the interval on/off. */
  toggle: () => void;
  /** Whether the interval is currently running. */
  active: boolean;
}

/**
 * Declarative `setInterval` with start/stop/toggle and an `active` flag — port
 * of Mantine's `useInterval`. The callback is read through a ref so changing it
 * never tears down a running interval; the interval is cleared on unmount. Uses
 * the global `setInterval` (no `window`), so it runs on web and native alike.
 */
export function useInterval(
  fn: () => void,
  interval: number,
  options: UseIntervalOptions = {},
): UseIntervalReturn {
  const { autoInvoke = false } = options;
  const [active, setActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const start = useCallback(() => {
    setActive((isActive) => {
      if (!isActive && intervalRef.current === null) {
        intervalRef.current = setInterval(() => fnRef.current(), interval);
      }
      return true;
    });
  }, [interval]);

  const stop = useCallback(() => {
    setActive(false);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (active) {
      stop();
    } else {
      start();
    }
  }, [active, start, stop]);

  useEffect(() => {
    if (autoInvoke) start();
    return stop;
    // Mount-only: start/stop intentionally excluded so the interval isn't
    // recreated on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { start, stop, toggle, active };
}
