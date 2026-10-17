import type { WithSpringConfig } from "react-native-reanimated";

/**
 * Platform-neutral pieces of the drag-to-dismiss primitive: the axis type and
 * the default settle spring. Type-only reanimated import (erased at build), so
 * the web gesture shares the exact tuning without bundling reanimated.
 */
export type DragAxis = "x" | "y";

/**
 * Spring for the dismiss / spring-back settle. Tuned (like `@knitui/sheet`) for a
 * natural settle — roughly a 0.84 damping ratio so the panel lands with a hint of
 * give rather than a robotic dead-stop. Overridable per-instance via `spring`.
 */
export const DEFAULT_DISMISS_SPRING: WithSpringConfig = {
  damping: 29,
  stiffness: 300,
  mass: 1,
  overshootClamping: false,
};

/**
 * Travel (px) the finger must cover along the drag axis before the pan claims the
 * touch. Below this a tap on the scrim still dismisses, a press on a control still
 * fires, and a swipe across the other axis is never stolen.
 */
export const ACTIVATION_THRESHOLD = 8;
