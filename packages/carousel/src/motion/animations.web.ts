import type { SharedValue } from "react-native-reanimated";

import type { SettleResult } from "../engine/types";
import type { WithAnimation } from "../types";
import { animate, type AnimationSpec, withDecay, withSpring, withTiming } from "./webMotion";

/**
 * Web twin of `./animations`: the same snap / settle motion, driven by the
 * plain-JS web runtime (`./webMotion`, `requestAnimationFrame`) instead of
 * Reanimated, so no web bundle reaches `react-native-reanimated`. Curves and
 * durations match native: ease-out cubic snaps, the settle 100 ms slower, the
 * same decay friction.
 */

/** Decay friction for free inertial scrolling (matches native). */
export const DECAY_DECELERATION = 0.999;

/** Ease-out cubic — native's `Easing.out(Easing.cubic)`. */
const defaultEasing = (t: number): number => 1 - (1 - t) ** 3;

function timingSpec(
  target: number,
  withAnimation: WithAnimation | undefined,
  duration: number,
): AnimationSpec {
  if (withAnimation?.type === "timing") {
    const config = withAnimation.config as { duration?: number; easing?: unknown } | undefined;
    return withTiming(target, { duration: config?.duration ?? duration, easing: config?.easing });
  }
  return withTiming(target, { duration, easing: defaultEasing });
}

function springSpec(target: number, withAnimation: WithAnimation): AnimationSpec {
  return withSpring(target, (withAnimation.config ?? {}) as Parameters<typeof withSpring>[1]);
}

/** Animate `offset` to `target`; `onFinished` fires only when it completes. */
export function animateOffset(
  offset: SharedValue<number>,
  target: number,
  withAnimation: WithAnimation | undefined,
  duration: number,
  onFinished?: () => void,
): void {
  const spec =
    withAnimation?.type === "spring"
      ? springSpec(target, withAnimation)
      : timingSpec(target, withAnimation, duration);
  animate(offset, spec, (finished) => {
    if (finished) onFinished?.();
  });
}

/** Apply a {@link SettleResult} to `offset`; `onSettled` fires when it rests. */
export function applySettle(
  offset: SharedValue<number>,
  result: SettleResult,
  withAnimation: WithAnimation | undefined,
  duration: number,
  onSettled?: () => void,
): void {
  const done = (finished: boolean) => {
    if (finished) onSettled?.();
  };
  if (result.kind === "decay") {
    animate(
      offset,
      withDecay({ velocity: result.velocity, deceleration: DECAY_DECELERATION }),
      done,
    );
    return;
  }
  const spec =
    withAnimation?.type === "spring"
      ? springSpec(result.target, withAnimation)
      : timingSpec(result.target, withAnimation, duration + 100);
  animate(offset, spec, done);
}
