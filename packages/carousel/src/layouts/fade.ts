import { Extrapolation, interpolate } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, FadeConfig } from "../types";
import type { BaseLayoutConfig } from "./normal";

/**
 * Crossfade: every slide stays pinned at the centre (no translation — slides are
 * stacked at the origin) and fades by distance, so the active item dissolves into
 * the next instead of sliding. Optionally shrinks the fading slide for a soft zoom.
 */
export function fadeLayout(_base: BaseLayoutConfig, config: FadeConfig = {}): AnimationStyle {
  const minScale = config.scale ?? 1;

  return (progress: number): ViewStyle => {
    "worklet";
    const dist = Math.abs(progress);
    const opacity = interpolate(dist, [0, 1], [1, 0], Extrapolation.CLAMP);
    const scale = interpolate(dist, [0, 1], [1, minScale], Extrapolation.CLAMP);
    const zIndex = Math.round(interpolate(dist, [0, 1], [100, 0], Extrapolation.CLAMP));
    return { transform: [{ scale }], opacity, zIndex };
  };
}
