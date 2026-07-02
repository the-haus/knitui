import { Extrapolation, interpolate } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, FlipConfig } from "../types";
import type { BaseLayoutConfig } from "./normal";

/**
 * A flip deck: slides stay pinned at the centre and rotate 180° about the chosen
 * axis. The active card faces front; the next card is turned away (its back face
 * hidden via `backfaceVisibility`) and rotates into view as you advance — so the
 * stack appears to flip from one slide to the next. `perspective` adds depth.
 */
export function flipLayout(_base: BaseLayoutConfig, config: FlipConfig = {}): AnimationStyle {
  const perspective = config.perspective ?? 0;
  const axis = config.axis ?? "y";

  return (progress: number): ViewStyle => {
    "worklet";
    const angle = progress * 180;
    const dist = Math.abs(progress);
    const zIndex = Math.round(interpolate(dist, [0, 1], [100, 0], Extrapolation.CLAMP));

    const persp = perspective > 0 ? [{ perspective }] : [];
    const rot = axis === "x" ? { rotateX: `${angle}deg` } : { rotateY: `${angle}deg` };

    // Once a card turns past 90° its back faces the viewer; hide it so only the
    // front-facing slide shows through the stack.
    return { transform: [...persp, rot], backfaceVisibility: "hidden", zIndex };
  };
}
