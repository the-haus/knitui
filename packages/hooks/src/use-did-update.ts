import { type DependencyList, type EffectCallback, useEffect, useRef } from "react";

/**
 * Like `useEffect`, but skips the initial mount — port of Mantine's
 * `useDidUpdate`. Runs `fn` only when `dependencies` change after the first
 * render. Pure React, so identical on web and native.
 */
export function useDidUpdate(fn: EffectCallback, dependencies?: DependencyList): void {
  const mounted = useRef(false);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  useEffect(() => {
    if (mounted.current) {
      return fn();
    }
    mounted.current = true;
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
