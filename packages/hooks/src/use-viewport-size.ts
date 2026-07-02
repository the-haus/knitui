import { useCallback, useEffect, useState } from "react";

import type { ViewportSize } from "./use-viewport-size.shared";

/**
 * Current viewport size, kept in sync on resize/orientation change (web) — port
 * of Mantine's `useViewportSize`. Reads `window.innerWidth/Height`; SSR-safe
 * (returns `{ 0, 0 }` until mounted). The `use-viewport-size.native` sibling
 * uses React Native's `Dimensions` API.
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 });

  const onResize = useCallback(() => {
    setSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [onResize]);

  return size;
}
