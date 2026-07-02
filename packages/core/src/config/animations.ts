import { createAnimations } from "@tamagui/animations-css";

import { BOUNCY_BEZIER, DURATIONS, EASINGS } from "./motion";

/**
 * CSS animation driver (web). Native targets should resolve an
 * `animations.native.ts` sibling backed by `@tamagui/animations-react-native`.
 *
 * Two families of keys live here:
 *
 * - **Duration presets** (`100ms`/`fast`/`medium`/`slow`) and **named effects**
 *   (`bouncy`/`pulse`/`spin`/`stripe`) — semantic keys consumers reference
 *   directly (`transition="fast"`).
 * - **Easing curves** (`ease`/`ease-in`/`ease-out`/`ease-in-out`/`linear`) — one
 *   key per CSS `transition-timing-function` keyword. The baked `200ms` is a
 *   placeholder: callers pair the key with a `{ duration }` override
 *   (`transition={["ease-out", { duration: 250 }]}`) which the driver rewrites
 *   via `applyDurationOverride` while preserving the easing word. This is what
 *   lets `resolveTransition` honor an arbitrary `transitionTimingFunction`
 *   exactly instead of snapping every curve to `ease-in-out`.
 */
export const animations = createAnimations({
  "100ms": `${EASINGS.standard} ${DURATIONS.quick}ms`,
  fast: `${EASINGS.standard} ${DURATIONS.fast}ms`,
  medium: `${EASINGS.standard} ${DURATIONS.base}ms`,
  slow: `${EASINGS.standard} ${DURATIONS.slow}ms`,
  bouncy: `${BOUNCY_BEZIER} 250ms`,
  pulse: `${EASINGS.standard} ${DURATIONS.ambient}ms`,
  spin: `${EASINGS.linear} 700ms`,
  stripe: `${EASINGS.linear} 180ms`,
  // Easing-curve keys — duration is overridden per use; the easing word stays.
  linear: `${EASINGS.linear} ${DURATIONS.base}ms`,
  ease: `${EASINGS.gentle} ${DURATIONS.base}ms`,
  "ease-in": `${EASINGS.accelerate} ${DURATIONS.base}ms`,
  "ease-out": `${EASINGS.decelerate} ${DURATIONS.base}ms`,
  "ease-in-out": `${EASINGS.standard} ${DURATIONS.base}ms`,
});
