import { Extrapolation, interpolate } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, CoverflowConfig } from "../types";
import type { BaseLayoutConfig } from "./normal";

/**
 * Cover-flow: neighbours overlap the centred item (offset by a fraction of a
 * page), rotate in 3D to face the middle, and shrink — the iTunes album-wall look.
 * `perspective` (the first transform) gives the rotation real depth on both
 * platforms; set it to 0 for a flat foreshortened rotation.
 */
export function coverflowLayout(
  { size, vertical }: BaseLayoutConfig,
  config: CoverflowConfig = {},
): AnimationStyle {
  const rotateYDeg = config.rotateYDeg ?? 50;
  const inactiveScale = config.inactiveScale ?? 0.85;
  const spacing = config.spacing ?? 0.55;
  const perspective = config.perspective ?? 800;

  return (progress: number): ViewStyle => {
    "worklet";
    const clamped = Math.max(-1, Math.min(1, progress));
    const translate = progress * size * spacing;
    // A slide left of centre (progress < 0) turns its inner edge toward the
    // viewer; the sign flips for the right side.
    const angle = -clamped * rotateYDeg;
    const dist = Math.abs(progress);
    const scale = interpolate(dist, [0, 1], [1, inactiveScale], Extrapolation.CLAMP);
    const zIndex = Math.round(interpolate(dist, [0, 1], [100, 0], Extrapolation.CLAMP));

    const persp = perspective > 0 ? [{ perspective }] : [];
    if (vertical) {
      return {
        transform: [...persp, { translateY: translate }, { rotateX: `${angle}deg` }, { scale }],
        zIndex,
      };
    }
    return {
      transform: [...persp, { translateX: translate }, { rotateY: `${angle}deg` }, { scale }],
      zIndex,
    };
  };
}
