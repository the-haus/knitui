import { Extrapolation, interpolate } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, RotateConfig } from "../types";
import type { BaseLayoutConfig } from "./normal";

/**
 * A fanned slider: slides travel one full page like `normal`, but neighbours tilt
 * (rotateZ) away from the upright centred item — like spreading a hand of cards —
 * and shrink slightly. The tilt direction follows the side the slide sits on.
 */
export function rotateLayout(
  { size, vertical }: BaseLayoutConfig,
  config: RotateConfig = {},
): AnimationStyle {
  const rotateZDeg = config.rotateZDeg ?? 12;
  const inactiveScale = config.inactiveScale ?? 0.92;

  return (progress: number): ViewStyle => {
    "worklet";
    const translate = progress * size;
    const rotate = interpolate(
      progress,
      [-1, 0, 1],
      [-rotateZDeg, 0, rotateZDeg],
      Extrapolation.CLAMP,
    );
    const dist = Math.abs(progress);
    const scale = interpolate(dist, [0, 1], [1, inactiveScale], Extrapolation.CLAMP);
    return {
      transform: [
        vertical ? { translateY: translate } : { translateX: translate },
        { rotateZ: `${rotate}deg` },
        { scale },
      ],
    };
  };
}
