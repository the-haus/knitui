import { useCallback, useEffect, useRef } from "react";

export interface UseTimeoutOptions {
  /** Start the timeout as soon as the hook mounts. @default false */
  autoInvoke?: boolean;
}

export interface UseTimeoutReturn {
  /** Start the timeout (no-op if one is already pending). Extra args are forwarded to the callback. */
  start: (...args: unknown[]) => void;
  /** Cancel a pending timeout. */
  clear: () => void;
}

/**
 * Declarative `setTimeout` with automatic cleanup — port of Mantine's
 * `useTimeout`. The callback is read through a ref so a re-render never restarts
 * a pending timer, and any pending timer is cleared on unmount. Replaces the
 * hand-rolled `blurTimer` ref + cleanup-effect pattern; pure timers, so
 * identical on web and native.
 */
export function useTimeout(
  callback: (...args: unknown[]) => void,
  delay: number,
  options: UseTimeoutOptions = {},
): UseTimeoutReturn {
  const { autoInvoke = false } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const start = useCallback(
    (...args: unknown[]) => {
      if (timeoutRef.current === null) {
        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args);
          timeoutRef.current = null;
        }, delay);
      }
    },
    [delay],
  );

  const clear = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoInvoke) start();
    return clear;
  }, [autoInvoke, start, clear]);

  return { start, clear };
}
