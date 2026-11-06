import * as React from "react";
import { Dimensions } from "react-native";

import type { LayoutChangeEvent } from "@knitui/core";

interface Measurable {
  measureInWindow?: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

/**
 * How far the sheet's layer ends above the bottom of the window. A modal sheet in the
 * root host reads 0; an inline sheet above a tab bar or inside a `KeyboardAvoidingView`
 * reads what already separates it from the keyboard. Measured on layout, since each of
 * those moves the layer's edge by resizing it.
 */
export function useLayerBottomGap(): [number, (event: LayoutChangeEvent) => void] {
  const [gap, setGap] = React.useState(0);
  const measure = React.useCallback((event: LayoutChangeEvent) => {
    (event as unknown as { target?: Measurable }).target?.measureInWindow?.((_x, y, _w, height) => {
      const next = Math.max(0, Math.round(Dimensions.get("window").height - (y + height)));
      setGap((current) => (current === next ? current : next));
    });
  }, []);
  return [gap, measure];
}
