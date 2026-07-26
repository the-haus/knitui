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

/**
 * Shallow value-equality for the flat `*Config` records `modeConfig` accepts
 * (every field is a primitive), so an inline literal can be compared by value.
 */
function sameModeConfig(
  a: UseLayoutParams["modeConfig"],
  b: UseLayoutParams["modeConfig"],
): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  const ak = Object.keys(a);
  if (ak.length !== Object.keys(b).length) return false;
  for (const k of ak) {
    if ((a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k]) return false;
  }
  return true;
}

/** Select the active animation worklet from `mode` (or `customAnimation`). */
export function useLayout({
  mode,
  modeConfig,
  customAnimation,
  size,
  vertical,
}: UseLayoutParams): AnimationStyle {
  // `modeConfig` is documented — and used — as an INLINE OBJECT LITERAL, so it is
  // a fresh reference on every render. Keying the memo on its identity would
  // rebuild the layout worklet every render, and that closure is a dependency of
  // every mounted slide's `useAnimatedStyle` (native) plus the web painter: a new
  // one makes Reanimated tear down and re-install the style mapper of EVERY
  // mounted slide, breaks the slide `React.memo`, and forces a full `paintAll()`.
  // Collapse it to a stable reference while its values are unchanged. Assigning
  // the ref during render is a pure cache (same input → same output), so a
  // StrictMode double render is harmless.
  const configRef = React.useRef(modeConfig);
  if (!sameModeConfig(configRef.current, modeConfig)) configRef.current = modeConfig;
  const stableConfig = configRef.current;

  return React.useMemo(() => {
    if (customAnimation) return customAnimation;
    const base: BaseLayoutConfig = { size, vertical };
    switch (mode) {
      case "parallax":
        return parallaxLayout(base, stableConfig as ParallaxConfig);
      case "horizontal-stack":
        return stackLayout({ ...base, vertical: false }, stableConfig as StackConfig);
      case "vertical-stack":
        return stackLayout({ ...base, vertical: true }, stableConfig as StackConfig);
      case "fade":
        return fadeLayout(base, stableConfig as FadeConfig);
      case "scale":
        return scaleLayout(base, stableConfig as ScaleConfig);
      case "rotate":
        return rotateLayout(base, stableConfig as RotateConfig);
      case "coverflow":
        return coverflowLayout(base, stableConfig as CoverflowConfig);
      case "flip":
        return flipLayout(base, stableConfig as FlipConfig);
      case "cube":
        return cubeLayout(base, stableConfig as CubeConfig);
      case "depth":
        return depthLayout(base, stableConfig as DepthConfig);
      default:
        return normalLayout(base);
    }
  }, [mode, stableConfig, customAnimation, size, vertical]);
}
