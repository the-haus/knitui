import { type SharedValue, withSpring, type WithSpringConfig } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { DEFAULT_SPRING, type SheetSpringConfig } from "./spring-config";
import type { SheetValue } from "./value.types";

export { DEFAULT_SPRING } from "./spring-config";

/**
 * Spring `offset` to `target` carrying the release `velocity` (px/s) so the
 * motion is continuous through the finger-lift — no hitch from a spring that
 * restarts at rest. Worklet-only: called from the gesture's `onEnd`/`onFinalize`
 * on the UI thread. `onFinished` (JS) fires via `scheduleOnRN` only on a clean
 * settle, never on interruption/re-target.
 */
export function settleOffset(
  offset: SheetValue<number>,
  target: number,
  velocity: number,
  config: SheetSpringConfig | undefined,
  onFinished?: () => void,
): void {
  "worklet";
  const cb = (finished?: boolean) => {
    "worklet";
    if (finished && onFinished) scheduleOnRN(onFinished);
  };
  (offset as SharedValue<number>).value = withSpring(
    target,
    { ...((config ?? DEFAULT_SPRING) as WithSpringConfig), velocity },
    cb,
  );
}

/**
 * Animate `offset` to `target` with a spring. Callable from the JS thread
 * (controller, `position` prop, handle tap) or a worklet (gesture `onEnd`).
 * `onFinished` is a JS callback fired via `scheduleOnRN` only when the spring
 * actually settles (not when it's interrupted/re-targeted).
 */
export function animateOffset(
  offset: SheetValue<number>,
  target: number,
  config: SheetSpringConfig | undefined,
  onFinished?: () => void,
): void {
  "worklet";
  const cb = (finished?: boolean) => {
    "worklet";
    if (finished && onFinished) scheduleOnRN(onFinished);
  };
  (offset as SharedValue<number>).value = withSpring(
    target,
    (config ?? DEFAULT_SPRING) as WithSpringConfig,
    cb,
  );
}
