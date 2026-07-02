import { type SharedValue, withSpring, type WithSpringConfig } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

/**
 * Default spring for sheet motion. Tuned for a natural bottom-sheet settle:
 * roughly a 0.84 damping ratio (`damping / (2·√(stiffness·mass))`) so the panel
 * lands with a hint of overshoot rather than a robotic dead-stop. Overridable
 * per-instance via the `animationConfig` prop.
 */
export const DEFAULT_SPRING: WithSpringConfig = {
  damping: 29,
  stiffness: 300,
  mass: 1,
  overshootClamping: false,
};

/**
 * Spring `offset` to `target` carrying the release `velocity` (px/s) so the
 * motion is continuous through the finger-lift — no hitch from a spring that
 * restarts at rest. Worklet-only: called from the gesture's `onEnd`/`onFinalize`
 * on the UI thread. `onFinished` (JS) fires via `scheduleOnRN` only on a clean
 * settle, never on interruption/re-target.
 */
export function settleOffset(
  offset: SharedValue<number>,
  target: number,
  velocity: number,
  config: WithSpringConfig | undefined,
  onFinished?: () => void,
): void {
  "worklet";
  const cb = (finished?: boolean) => {
    "worklet";
    if (finished && onFinished) scheduleOnRN(onFinished);
  };
  offset.value = withSpring(target, { ...(config ?? DEFAULT_SPRING), velocity }, cb);
}

/**
 * Animate `offset` to `target` with a spring. Callable from the JS thread
 * (controller, `position` prop, handle tap) or a worklet (gesture `onEnd`).
 * `onFinished` is a JS callback fired via `scheduleOnRN` only when the spring
 * actually settles (not when it's interrupted/re-targeted).
 */
export function animateOffset(
  offset: SharedValue<number>,
  target: number,
  config: WithSpringConfig | undefined,
  onFinished?: () => void,
): void {
  "worklet";
  const cb = (finished?: boolean) => {
    "worklet";
    if (finished && onFinished) scheduleOnRN(onFinished);
  };
  offset.value = withSpring(target, config ?? DEFAULT_SPRING, cb);
}
