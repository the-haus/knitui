import { useCallback, useEffect, useRef } from "react";

/**
 * Wrap a callback so its identity stays stable across renders while always
 * invoking the latest version — port of Mantine's `useCallbackRef`. Lets event
 * handlers and timers avoid stale closures without re-subscribing. This is the
 * "always-latest" pattern hand-rolled as `stateRef` inside `use-move` /
 * `use-radial-move`; pure React, so identical on web and native.
 */
export function useCallbackRef<Args extends unknown[], Return>(
  callback: ((...args: Args) => Return) | undefined,
): (...args: Args) => Return | undefined {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args: Args) => callbackRef.current?.(...args), []);
}
