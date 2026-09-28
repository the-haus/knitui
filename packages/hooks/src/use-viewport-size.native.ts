import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

import type { ViewportSize } from "./use-viewport-size.shared";

/**
 * The window size right now on React Native, readable from plain JS —
 * `Dimensions.get("window")`. See the web sibling for when to prefer it over
 * {@link useViewportSize}.
 */
export function getViewportSize(): ViewportSize {
  const { width, height } = Dimensions.get("window");
  return { width, height };
}

/**
 * Current viewport size on React Native — native counterpart of
 * `use-viewport-size`. Seeds from `Dimensions.get("window")` and updates on the
 * `"change"` event (resize / rotation / fold).
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setSize({ width: window.width, height: window.height });
    });
    return () => subscription.remove();
  }, []);

  return size;
}
