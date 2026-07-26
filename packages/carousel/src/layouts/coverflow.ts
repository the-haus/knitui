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
  // Resolved once at closure-creation, not per frame: this worklet runs for every
  // MOUNTED SLIDE on every frame of a fling (on the UI thread on native, inside
  // the web painter's `paintAll` on web), so an allocation here is multiplied by
  // the window size × the frame rate — and on native the resulting GC pressure
  // shows up directly as fling jank.
  const hasPerspective = perspective > 0;

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

    // The transform array is built in ONE shot per branch rather than as
    // `[...persp, …]`, which allocated a throwaway `persp` array and then copied
    // it element-by-element into the real one. The final array itself must stay
    // fresh (never hoisted/reused): a transform array handed to reanimated is
    // converted on assignment and must not be mutated afterwards.
    const move = vertical ? { translateY: translate } : { translateX: translate };
    const rotate = vertical ? { rotateX: `${angle}deg` } : { rotateY: `${angle}deg` };
    return {
      transform: hasPerspective
        ? [{ perspective }, move, rotate, { scale }]
        : [move, rotate, { scale }],
      zIndex,
    };
  };
}
