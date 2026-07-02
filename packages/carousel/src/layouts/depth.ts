import { Extrapolation, interpolate } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, DepthConfig } from "../types";
import type { BaseLayoutConfig } from "./normal";

/**
 * A depth / zoom transition (Material "zoom" style): slides stay pinned at the
 * centre. The leaving slide (progress < 0) scales up and fades, as if passing
 * through the viewer, while the incoming slide (progress > 0) rises from behind,
 * growing from `inactiveScale` into place. No horizontal travel.
 */
export function depthLayout(_base: BaseLayoutConfig, config: DepthConfig = {}): AnimationStyle {
  const inactiveScale = config.inactiveScale ?? 0.85;
  const outgoingScale = config.outgoingScale ?? 1.3;

  return (progress: number): ViewStyle => {
    "worklet";
    const dist = Math.abs(progress);
    const opacity = interpolate(dist, [0, 1], [1, 0], Extrapolation.CLAMP);
    const scale =
      progress <= 0
        ? interpolate(progress, [-1, 0], [outgoingScale, 1], Extrapolation.CLAMP)
        : interpolate(progress, [0, 1], [1, inactiveScale], Extrapolation.CLAMP);
    const zIndex = Math.round(interpolate(dist, [0, 1], [100, 0], Extrapolation.CLAMP));
    return { transform: [{ scale }], opacity, zIndex };
  };
}
