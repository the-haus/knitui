import { useCallback, useEffect, useRef } from "react";

import { useCallbackRef } from "./use-callback-ref";

/**
 * Throttle a callback, returning `[throttled, clearTimeout]` — port of Mantine's
 * internal `useThrottledCallbackWithClearTimeout`. The leading call fires
 * immediately; subsequent calls within `wait` are coalesced and the last one is
 * flushed when the window elapses. Backs both `useThrottledCallback` and
 * `useThrottledValue`.
 */
export function useThrottledCallbackWithClearTimeout<Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait: number,
): [(...args: Args) => void, () => void] {
  const handleCallback = useCallbackRef(callback);
  const latestInArgsRef = useRef<Args | null>(null);
  const latestOutArgsRef = useRef<Args | null>(null);
  const active = useRef(true);
  const waitRef = useRef(wait);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const throttled = useCallback(
    (...args: Args) => {
      latestInArgsRef.current = args;

      if (active.current) {
        latestOutArgsRef.current = null;
        handleCallback(...args);
        timeoutRef.current = setTimeout(() => {
          if (latestOutArgsRef.current) {
            handleCallback(...latestOutArgsRef.current);
            latestOutArgsRef.current = null;
          }
          active.current = true;
        }, waitRef.current);
        active.current = false;
      } else {
        latestOutArgsRef.current = args;
      }
    },
    [handleCallback],
  );

  useEffect(() => {
    waitRef.current = wait;
  }, [wait]);

  return [throttled, clear];
}

/**
 * Throttle a callback — port of Mantine's `useThrottledCallback`. The returned
 * function has a stable identity and always calls the latest `callback`. Pure
 * timers, so identical on web and native — handy for high-frequency events
 * (drag, scroll).
 */
export function useThrottledCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait: number,
): (...args: Args) => void {
  return useThrottledCallbackWithClearTimeout(callback, wait)[0];
}
