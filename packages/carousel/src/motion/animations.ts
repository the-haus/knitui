import {
  Easing,
  type SharedValue,
  withDecay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { SettleResult } from "../engine/types";
import type { WithAnimation } from "../types";

/** Decay friction for free inertial scrolling (matches the reference). */
export const DECAY_DECELERATION = 0.999;

/** Default ease-out timing curve for snaps. */
const defaultEasing = Easing.out(Easing.cubic);

function timingConfig(withAnimation: WithAnimation | undefined, duration: number) {
  "worklet";
  if (withAnimation?.type === "timing") return withAnimation.config;
  return { duration, easing: defaultEasing };
}

/**
 * Animate `offset` to a target value. Callable from the JS thread (controller,
 * keyboard, autoplay). `onFinished` is a JS callback, invoked via `scheduleOnRN`
 * only when the animation actually completes.
 */
export function animateOffset(
  offset: SharedValue<number>,
  target: number,
  withAnimation: WithAnimation | undefined,
  duration: number,
  onFinished?: () => void,
): void {
  const cb = (finished?: boolean) => {
    "worklet";
    if (finished && onFinished) scheduleOnRN(onFinished);
  };
  if (withAnimation?.type === "spring") {
    offset.value = withSpring(target, withAnimation.config, cb);
  } else {
    offset.value = withTiming(target, timingConfig(withAnimation, duration), cb);
  }
}

/**
 * Apply a {@link SettleResult} to `offset`. A worklet — call it from a gesture
 * `onEnd` on the UI thread. `onSettled` is a JS callback fired when the motion
 * comes to rest.
 */
export function applySettle(
  offset: SharedValue<number>,
  result: SettleResult,
  withAnimation: WithAnimation | undefined,
  duration: number,
  onSettled?: () => void,
): void {
  "worklet";
  const cb = (finished?: boolean) => {
    "worklet";
    if (finished && onSettled) scheduleOnRN(onSettled);
  };
  if (result.kind === "decay") {
    offset.value = withDecay({ velocity: result.velocity, deceleration: DECAY_DECELERATION }, cb);
    return;
  }
  if (withAnimation?.type === "spring") {
    offset.value = withSpring(result.target, withAnimation.config, cb);
  } else {
    // Settle is a touch slower than a tap-driven snap (reference adds 100ms).
    offset.value = withTiming(result.target, timingConfig(withAnimation, duration + 100), cb);
  }
}
