import { Extrapolation, interpolate } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, CubeConfig } from "../types";
import type { BaseLayoutConfig } from "./normal";

/**
 * A rotating-cube transition: each slide is offset one page and hinges on the
 * edge it shares with its neighbour (transform-origin), folding ±90° in 3D so the
 * adjacent faces meet at the cube's corner. `perspective` gives the fold depth.
 * Non-adjacent faces are hidden. An approximation of a true cube — faces meet at
 * the seam without a literal connecting side.
 */
export function cubeLayout(
  { size, vertical }: BaseLayoutConfig,
  config: CubeConfig = {},
): AnimationStyle {
  const perspective = config.perspective ?? 800;

  return (progress: number): ViewStyle => {
    "worklet";
    const clamped = Math.max(-1, Math.min(1, progress));
    const angle = clamped * 90;
    const translate = progress * size;
    const dist = Math.abs(progress);
    const zIndex = Math.round(interpolate(dist, [0, 1], [100, 0], Extrapolation.CLAMP));
    const opacity = dist >= 1 ? 0 : 1;

    const persp = perspective > 0 ? [{ perspective }] : [];
    if (vertical) {
      // A slide below centre (progress > 0) hinges on its top edge; above, bottom.
      const transformOrigin = progress > 0 ? "50% 0%" : "50% 100%";
      return {
        transform: [...persp, { translateY: translate }, { rotateX: `${-angle}deg` }],
        transformOrigin,
        opacity,
        zIndex,
      };
    }
    // A slide right of centre (progress > 0) hinges on its left edge; left, right.
    const transformOrigin = progress > 0 ? "0% 50%" : "100% 50%";
    return {
      transform: [...persp, { translateX: translate }, { rotateY: `${-angle}deg` }],
      transformOrigin,
      opacity,
      zIndex,
    };
  };
}
