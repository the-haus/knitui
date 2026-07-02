import { Extrapolation, interpolate } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, ParallaxConfig } from "../types";
import type { BaseLayoutConfig } from "./normal";

/**
 * Parallax: neighbours are pulled toward center (so they peek in at the edges),
 * the centered item is largest and on top, neighbours shrink — giving depth.
 */
export function parallaxLayout(
  { size, vertical }: BaseLayoutConfig,
  config: ParallaxConfig = {},
): AnimationStyle {
  const scrollingOffset = config.parallaxScrollingOffset ?? 100;
  const scrollingScale = config.parallaxScrollingScale ?? 0.8;
  const adjacentScale = config.parallaxAdjacentItemScale ?? scrollingScale ** 2;

  return (progress: number): ViewStyle => {
    "worklet";
    const translate = interpolate(
      progress,
      [-1, 0, 1],
      [-size + scrollingOffset, 0, size - scrollingOffset],
    );
    const zIndex = Math.round(interpolate(progress, [-1, 0, 1], [0, size, 0], Extrapolation.CLAMP));
    const scale = interpolate(
      progress,
      [-1, 0, 1],
      [adjacentScale, scrollingScale, adjacentScale],
      Extrapolation.CLAMP,
    );
    return {
      transform: [vertical ? { translateY: translate } : { translateX: translate }, { scale }],
      zIndex,
    };
  };
}
