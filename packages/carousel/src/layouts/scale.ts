import { Extrapolation, interpolate } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, ScaleConfig } from "../types";
import type { BaseLayoutConfig } from "./normal";

/**
 * A standard side-by-side slider (slides travel one full page like `normal`) that
 * also shrinks — and optionally dims — off-centre slides, so the active item pops.
 * Pair with an `itemSize` smaller than the container to reveal the scaled
 * neighbours peeking in on either side.
 */
export function scaleLayout(
  { size, vertical }: BaseLayoutConfig,
  config: ScaleConfig = {},
): AnimationStyle {
  const inactiveScale = config.inactiveScale ?? 0.85;
  const inactiveOpacity = config.inactiveOpacity ?? 1;

  return (progress: number): ViewStyle => {
    "worklet";
    const translate = progress * size;
    const dist = Math.abs(progress);
    const scale = interpolate(dist, [0, 1], [1, inactiveScale], Extrapolation.CLAMP);
    const opacity = interpolate(dist, [0, 1], [1, inactiveOpacity], Extrapolation.CLAMP);
    return {
      transform: [vertical ? { translateY: translate } : { translateX: translate }, { scale }],
      opacity,
    };
  };
}
