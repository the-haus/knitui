import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle } from "../types";

export interface BaseLayoutConfig {
  /** Page size px along the scroll axis. */
  size: number;
  vertical: boolean;
}

/**
 * The standard side-by-side slider: each item is translated exactly one page
 * (`size`) per unit of progress along the scroll axis. `progress` is linear and
 * unclamped, so an item N pages away sits N×size away.
 */
export function normalLayout({ size, vertical }: BaseLayoutConfig): AnimationStyle {
  return (progress: number): ViewStyle => {
    "worklet";
    const translate = progress * size;
    return {
      transform: [vertical ? { translateY: translate } : { translateX: translate }],
    };
  };
}
