import { Extrapolation, interpolate } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, StackConfig } from "../types";
import type { BaseLayoutConfig } from "./normal";

/** Cubic ease applied to the fractional part of progress for a snappier deck. */
function easeInOutCubic(v: number): number {
  "worklet";
  return v < 0.5 ? 4 * v * v * v : 1 - (-2 * v + 2) ** 3 / 2;
}

/** Re-shape raw progress: integer page steps stay linear, fraction eases. */
function easedProgress(value: number): number {
  "worklet";
  const page = Math.floor(Math.abs(value));
  const frac = Math.abs(value) % 1;
  const eased = page + easeInOutCubic(frac);
  return value < 0 ? -eased : eased;
}

/**
 * A fanned card deck (Tinder-style). The active card (progress 0) is upright and
 * full size; upcoming cards (progress 1..showLength-1) are stepped, shrunk, and
 * faded behind it; the leaving card (progress < 0) flies off and rotates.
 *
 * Unlike the reference, this uses the same `{ size, vertical }` base config as
 * the other modes — the deck steps and the exit fling both run along the scroll
 * axis (`vertical` picks Y vs X). `snapDirection` mirrors left/right.
 */
export function stackLayout(
  { size, vertical }: BaseLayoutConfig,
  config: StackConfig = {},
): AnimationStyle {
  const showLength = config.showLength ?? 3;
  const moveSize = config.moveSize ?? size;
  const stackInterval = config.stackInterval ?? 18;
  const scaleInterval = config.scaleInterval ?? 0.04;
  const opacityInterval = config.opacityInterval ?? 0.1;
  const rotateZDeg = config.rotateZDeg ?? 30;
  const snapDirection = config.snapDirection ?? "left";

  const valid = Math.max(1, showLength - 1);
  const dir = snapDirection === "right" ? -1 : 1;

  return (rawProgress: number): ViewStyle => {
    "worklet";
    const value = easedProgress(rawProgress);

    // Along the scroll axis: leaving card flies to ∓moveSize; stacked cards step.
    const translate =
      dir *
      interpolate(
        value,
        [-1, 0, valid],
        [-moveSize * dir, 0, valid * stackInterval],
        Extrapolation.CLAMP,
      );
    const scale = interpolate(
      value,
      [-1, 0, valid],
      [1, 1, 1 - valid * scaleInterval],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      value,
      [-1, 0, valid],
      [0, 1, 1 - valid * opacityInterval],
      Extrapolation.CLAMP,
    );
    const rotate = interpolate(value, [-1, 0, 1], [-rotateZDeg * dir, 0, 0], Extrapolation.CLAMP);
    // Paint order, kept NON-NEGATIVE (like every other overlapping layout): the
    // active card (0) sits above the stacked deck (positive value → toward 0),
    // and a leaving card (negative value) rises above the active card as it flies
    // off. A negative zIndex is unsafe against the `position: relative` Viewport
    // — on native it can drop the deck behind the frame, hiding the cards that
    // should peek out behind the active one.
    const zIndex = Math.round(
      interpolate(value, [-1, 0, valid], [(valid + 1) * 100, valid * 100, 0], Extrapolation.CLAMP),
    );

    return {
      transform: [
        vertical ? { translateY: translate } : { translateX: translate },
        { scale },
        { rotateZ: `${rotate}deg` },
      ],
      opacity,
      zIndex,
    };
  };
}
