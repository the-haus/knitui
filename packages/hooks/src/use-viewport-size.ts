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
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Bail on unchanged dimensions, exactly as `use-element-size` does. `resize` is
    // unthrottled (~60 events/s while a window is dragged) and `orientationchange`
    // can fire alongside it, so without this a fresh object is allocated and every
    // consumer re-renders per event — very often for dimensions it already had (a
    // drag along one axis leaves the other identical, and `orientationchange` fires
    // after `resize` has already reported the new box).
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
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
