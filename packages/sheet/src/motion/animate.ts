import { crossedTarget, resolveSpring, springAtRest, stepSpring } from "./spring";
import { DEFAULT_SPRING, type SheetSpringConfig } from "./spring-config";
import { MotionValue } from "./value";
import type { SheetValue } from "./value.types";

export { DEFAULT_SPRING } from "./spring-config";

/**
 * Sheet springs (WEB build): a `requestAnimationFrame` loop over the pure
 * integrator in `spring.ts`, driving a {@link MotionValue}. Same contract as the
 * native build (`animate.native.ts`, reanimated's `withSpring`):
 *
 *   - a new spring replaces the one running (no `onFinished` for the old one);
 *   - assigning the value directly stops it (a drag catching the panel);
 *   - `onFinished` fires once, only when the spring comes to rest on its target.
 *
 * With `prefers-reduced-motion: reduce` the value jumps to its target and the
 * spring finishes at once.
 */

/** Longest frame step integrated (s): a backgrounded tab must not fling the panel. */
const MAX_FRAME = 0.064;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const nextFrame: (cb: (now: number) => void) => unknown =
  typeof requestAnimationFrame === "function"
    ? (cb) => requestAnimationFrame(cb)
    : (cb) => setTimeout(() => cb(Date.now()), 16);
const cancelFrame: (handle: unknown) => void =
  typeof cancelAnimationFrame === "function"
    ? (handle) => cancelAnimationFrame(handle as number)
    : (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>);

function spring(
  value: SheetValue<number>,
  target: number,
  velocity: number | undefined,
  config: SheetSpringConfig | undefined,
  onFinished?: () => void,
): void {
  if (!(value instanceof MotionValue)) {
    value.value = target;
    onFinished?.();
    return;
  }
  // Carry the running spring's speed into the new one when none is given, so a
  // re-target mid-flight bends the motion instead of stopping it dead.
  const start = velocity ?? value.velocity;
  if (prefersReducedMotion()) {
    value.value = target;
    onFinished?.();
    return;
  }
  const params = resolveSpring(config ?? DEFAULT_SPRING);
  let state = { position: value.value, velocity: start };
  let last: number | null = null;
  let handle: unknown = null;
  let running = true;
  value.animate(() => {
    running = false;
    if (handle !== null) cancelFrame(handle);
  });
  value.velocity = start;
  const frame = (now: number) => {
    if (!running) return;
    const dt = last === null ? 1 / 60 : Math.min(Math.max((now - last) / 1000, 0), MAX_FRAME);
    last = now;
    const from = state.position;
    state = stepSpring(state, target, params, dt);
    const clamped = params.overshootClamping && crossedTarget(from, state.position, target);
    if (clamped || springAtRest(state, target)) {
      running = false;
      value.settle();
      value.drive(target);
      onFinished?.();
      return;
    }
    value.velocity = state.velocity;
    value.drive(state.position);
    handle = nextFrame(frame);
  };
  handle = nextFrame(frame);
}

/**
 * Spring `offset` to `target` carrying the release `velocity` (px/s) so the
 * motion is continuous through the finger-lift. `onFinished` fires only on a
 * clean settle, never on interruption/re-target.
 */
export function settleOffset(
  offset: SheetValue<number>,
  target: number,
  velocity: number,
  config: SheetSpringConfig | undefined,
  onFinished?: () => void,
): void {
  spring(offset, target, velocity, config, onFinished);
}

/**
 * Animate `offset` to `target` with a spring. `onFinished` fires only when the
 * spring actually settles (not when it's interrupted/re-targeted).
 */
export function animateOffset(
  offset: SheetValue<number>,
  target: number,
  config: SheetSpringConfig | undefined,
  onFinished?: () => void,
): void {
  spring(offset, target, undefined, config, onFinished);
}
