import { useEffect, useMemo, useRef } from "react";

import { useCallbackRef } from "./use-callback-ref";

export interface DebouncedFunction<Args extends unknown[]> {
  (...args: Args): void;
  /** Cancel a pending call. */
  cancel: () => void;
  /** Immediately invoke the pending call with its last arguments. */
  flush: () => void;
}

/**
 * Debounce a callback — port of Mantine's `useDebouncedCallback`. The returned
 * function keeps a stable identity, always calls the latest `callback` (via
 * `useCallbackRef`), and carries `cancel` / `flush`. The pending timer is
 * cleared on unmount. Pure timers, so identical on web and native.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): DebouncedFunction<Args> {
  const handleCallback = useCallbackRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Args | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return useMemo(() => {
    const debounced = ((...args: Args) => {
      lastArgsRef.current = args;
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        handleCallback(...args);
      }, delay);
    }) as DebouncedFunction<Args>;

    debounced.cancel = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    debounced.flush = () => {
      if (timeoutRef.current !== null && lastArgsRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        handleCallback(...lastArgsRef.current);
      }
    };

    return debounced;
  }, [handleCallback, delay]);
}
