import { Easing } from "react-native-reanimated";

import { createAnimations } from "@tamagui/animations-reanimated";

import { CSS_EASING_BEZIER } from "./easing";
import { DURATIONS } from "./motion";

/**
 * Reanimated native driver. Web resolves `animations.ts`; native resolves this
 * sibling so the same `transition` keys run off-thread on native.
 *
 * The easing-curve keys (`ease`/`ease-in`/`ease-out`/`ease-in-out`/`linear`)
 * mirror the web config's CSS keywords, with the matching cubic-bezier control
 * points so a given `transitionTimingFunction` looks the same on both platforms.
 * The driver forwards every config field except `type`/`delay` straight to
 * `withTiming`, so the `easing` is applied; a `{ duration }` override merges in
 * on top (see `buildTransitionConfig`), keeping the curve while retiming it.
 */
export const animations = createAnimations({
  "100ms": { type: "timing", duration: DURATIONS.quick },
  fast: { type: "timing", duration: DURATIONS.fast },
  medium: { type: "timing", duration: DURATIONS.base },
  slow: { type: "timing", duration: DURATIONS.slow },
  bouncy: {
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  pulse: { type: "timing", duration: DURATIONS.ambient },
  spin: { type: "timing", duration: 700 },
  stripe: { type: "timing", duration: 180 },
  // Easing-curve keys — control points come from the shared `CSS_EASING_BEZIER`
  // table (the same one `CollapseBox.native` builds its easing from) so the web
  // CSS keywords, the reanimated driver, and the hand-rolled clip all render the
  // identical curve.
  linear: { type: "timing", duration: DURATIONS.base, easing: Easing.linear },
  ease: {
    type: "timing",
    duration: DURATIONS.base,
    easing: Easing.bezier(...CSS_EASING_BEZIER.ease),
  },
  "ease-in": {
    type: "timing",
    duration: DURATIONS.base,
    easing: Easing.bezier(...CSS_EASING_BEZIER["ease-in"]),
  },
  "ease-out": {
    type: "timing",
    duration: DURATIONS.base,
    easing: Easing.bezier(...CSS_EASING_BEZIER["ease-out"]),
  },
  "ease-in-out": {
    type: "timing",
    duration: DURATIONS.base,
    easing: Easing.bezier(...CSS_EASING_BEZIER["ease-in-out"]),
  },
});
