import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle, CarouselMode } from "../types";

/** Paint level of a card taking the cross motion over a kept deck. */
export const CROSS_MOTION_Z = 10000;

type MutableStyle = {
  opacity?: ViewStyle["opacity"];
  zIndex?: number;
  transformOrigin?: ViewStyle["transformOrigin"];
  backfaceVisibility?: ViewStyle["backfaceVisibility"];
};

/**
 * Fill the keys a two-axis deck's two layouts may disagree on. Reanimated
 * keeps the last value of a key an animated style STOPS returning, so after a
 * switch from a layout that sets `opacity: 0` to one that sets no opacity the
 * slide would stay invisible on native. With both layouts always returning
 * these four keys, a switch fully replaces the previous look. (The web painter
 * already clears missing keys.)
 */
export function withMotionDefaults(style: ViewStyle): ViewStyle {
  "worklet";
  const s = style as MutableStyle;
  if (s.opacity === undefined) s.opacity = 1;
  if (s.zIndex === undefined) s.zIndex = 0;
  if (s.transformOrigin === undefined) s.transformOrigin = "50% 50%";
  if (s.backfaceVisibility === undefined) s.backfaceVisibility = "visible";
  return style;
}

/** Does `mode` keep a deck behind the front card (the stack modes)? */
export function keepsDeck(mode: CarouselMode | undefined): boolean {
  return mode === "vertical-stack" || mode === "horizontal-stack";
}

/** The main layout of a two-axis deck: `main` with the shared key defaults. */
export function mainMotion(main: AnimationStyle): AnimationStyle {
  return (progress, index) => {
    "worklet";
    return withMotionDefaults(main(progress, index));
  };
}

/**
 * The layout a two-axis deck renders during a CROSS-axis motion.
 *
 * Progress is the same as on the main axis (a cross drag moves the same
 * offset), so `progress < 0` is the card leaving forward / coming back, `0` the
 * front card, `> 0` the cards after it.
 *
 * - Stack `mode` (`deck`): the deck stays a deck. Cards at `progress >= 0`
 *   keep the stack layout, so the next card comes forward from behind exactly as
 *   in a stack step, and only a card at `progress < 0` takes the cross motion,
 *   painted above the deck: forward, the front card slides out sideways; back,
 *   the previous card slides in over the deck. Both halves meet at progress 0,
 *   where every built-in cross mode is the identity, so there is no jump.
 * - Any other `mode`: every slide takes the cross motion.
 */
export function crossMotion(
  main: AnimationStyle,
  cross: AnimationStyle,
  deck: boolean,
): AnimationStyle {
  return (progress, index) => {
    "worklet";
    if (deck && progress >= 0) return withMotionDefaults(main(progress, index));
    const style = withMotionDefaults(cross(progress, index));
    if (deck) (style as MutableStyle).zIndex = CROSS_MOTION_Z;
    return style;
  };
}
