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
  // Resolved once at closure-creation — this worklet runs per mounted slide per
  // frame, so the `perspective > 0` test does not belong inside it.
  const hasPerspective = perspective > 0;

  return (progress: number): ViewStyle => {
    "worklet";
    const clamped = Math.max(-1, Math.min(1, progress));
    const angle = clamped * 90;
    const translate = progress * size;
    const dist = Math.abs(progress);
    const zIndex = Math.round(interpolate(dist, [0, 1], [100, 0], Extrapolation.CLAMP));
    const opacity = dist >= 1 ? 0 : 1;

    // A slide past centre (progress > 0) hinges on its leading edge; before it, the
    // trailing edge. Vertical folds about X and hinges top/bottom; horizontal folds
    // about Y and hinges left/right.
    const move = vertical ? { translateY: translate } : { translateX: translate };
    const rotate = vertical ? { rotateX: `${-angle}deg` } : { rotateY: `${-angle}deg` };
    const transformOrigin = vertical
      ? progress > 0
        ? "50% 0%"
        : "50% 100%"
      : progress > 0
        ? "0% 50%"
        : "100% 50%";

    // Built in one shot instead of `[...persp, …]`, which allocated a throwaway
    // array and copied it element-by-element. The final array stays fresh per call
    // by design — reanimated converts it on assignment and it must not be reused.
    return {
      transform: hasPerspective ? [{ perspective }, move, rotate] : [move, rotate],
      transformOrigin,
      opacity,
      zIndex,
    };
  };
}
