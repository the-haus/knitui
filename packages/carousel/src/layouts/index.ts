import * as React from "react";

import type { ViewStyle } from "@knitui/core";

import type {
  AnimationStyle,
  CarouselMode,
  CoverflowConfig,
  CubeConfig,
  DepthConfig,
  FadeConfig,
  FlipConfig,
  ParallaxConfig,
  RotateConfig,
  ScaleConfig,
  StackConfig,
} from "../types";
import { coverflowLayout } from "./coverflow";
import { cubeLayout } from "./cube";
import { depthLayout } from "./depth";
import { fadeLayout } from "./fade";
import { flipLayout } from "./flip";
import { type BaseLayoutConfig, normalLayout } from "./normal";
import { parallaxLayout } from "./parallax";
import { rotateLayout } from "./rotate";
import { scaleLayout } from "./scale";
import { stackLayout } from "./stack";

export {
  coverflowLayout,
  cubeLayout,
  depthLayout,
  fadeLayout,
  flipLayout,
  normalLayout,
  parallaxLayout,
  rotateLayout,
  scaleLayout,
  stackLayout,
};
export type { BaseLayoutConfig };

/**
 * Normalize a layout worklet's output: a non-finite `zIndex` crashes native, so
 * coerce it to a finite integer (or drop it). Worklet — runs in `useAnimatedStyle`.
 */
export function sanitizeAnimationStyle(style: ViewStyle): ViewStyle {
  "worklet";
  if (style.zIndex !== undefined) {
    style.zIndex = Number.isFinite(style.zIndex) ? Math.round(style.zIndex as number) : 0;
  }
  return style;
}

export interface UseLayoutParams {
  mode: CarouselMode | undefined;
  modeConfig:
    | ParallaxConfig
    | StackConfig
    | FadeConfig
    | ScaleConfig
    | RotateConfig
    | CoverflowConfig
    | FlipConfig
    | CubeConfig
    | DepthConfig
    | undefined;
  customAnimation: AnimationStyle | undefined;
  size: number;
  vertical: boolean;
}

/** Select the active animation worklet from `mode` (or `customAnimation`). */
export function useLayout({
  mode,
  modeConfig,
  customAnimation,
  size,
  vertical,
}: UseLayoutParams): AnimationStyle {
  return React.useMemo(() => {
    if (customAnimation) return customAnimation;
    const base: BaseLayoutConfig = { size, vertical };
    switch (mode) {
      case "parallax":
        return parallaxLayout(base, modeConfig as ParallaxConfig);
      case "horizontal-stack":
        return stackLayout({ ...base, vertical: false }, modeConfig as StackConfig);
      case "vertical-stack":
        return stackLayout({ ...base, vertical: true }, modeConfig as StackConfig);
      case "fade":
        return fadeLayout(base, modeConfig as FadeConfig);
      case "scale":
        return scaleLayout(base, modeConfig as ScaleConfig);
      case "rotate":
        return rotateLayout(base, modeConfig as RotateConfig);
      case "coverflow":
        return coverflowLayout(base, modeConfig as CoverflowConfig);
      case "flip":
        return flipLayout(base, modeConfig as FlipConfig);
      case "cube":
        return cubeLayout(base, modeConfig as CubeConfig);
      case "depth":
        return depthLayout(base, modeConfig as DepthConfig);
      default:
        return normalLayout(base);
    }
  }, [mode, modeConfig, customAnimation, size, vertical]);
}
