import { DEFAULT_SPRING, type SheetSpringConfig } from "./spring-config";

/**
 * A damped spring, integrated by hand — the web motion's physics (the native
 * build leaves this to reanimated's `withSpring`). Pure, so it is unit-tested
 * directly.
 */

/** Resolved physical constants of a spring. */
export interface SpringParams {
  mass: number;
  stiffness: number;
  damping: number;
  overshootClamping: boolean;
}

/** Where a spring is and how fast it moves (units/s). */
export interface SpringState {
  position: number;
  velocity: number;
}

/** The settled-enough thresholds: within half a pixel, slower than 2 px/s. */
const REST_DISPLACEMENT = 0.5;
const REST_SPEED = 2;
/** Integration sub-step (s): small enough to stay stable for stiff springs. */
const SUB_STEP = 1 / 240;

/**
 * Turn a {@link SheetSpringConfig} into constants. A duration-based spring
 * (`duration` + `dampingRatio`, reanimated's other mode) becomes the
 * stiffness whose natural period settles in about that time.
 */
export function resolveSpring(config: SheetSpringConfig | undefined): SpringParams {
  const c = { ...DEFAULT_SPRING, ...config };
  const mass = c.mass && c.mass > 0 ? c.mass : 1;
  let stiffness = c.stiffness && c.stiffness > 0 ? c.stiffness : 100;
  if (config?.duration && config.duration > 0 && config.stiffness === undefined) {
    // ω₀ ≈ 2π / T: one natural period over the requested duration.
    const omega = (2 * Math.PI) / (config.duration / 1000);
    stiffness = mass * omega * omega;
  }
  const damping =
    config?.dampingRatio !== undefined
      ? 2 * config.dampingRatio * Math.sqrt(stiffness * mass)
      : (c.damping ?? 10);
  return { mass, stiffness, damping, overshootClamping: Boolean(c.overshootClamping) };
}

/** Advance `state` toward `target` by `dt` seconds (semi-implicit Euler, sub-stepped). */
export function stepSpring(
  state: SpringState,
  target: number,
  params: SpringParams,
  dt: number,
): SpringState {
  let { position, velocity } = state;
  let left = Math.max(0, dt);
  while (left > 0) {
    const h = Math.min(SUB_STEP, left);
    left -= h;
    const force = -params.stiffness * (position - target) - params.damping * velocity;
    velocity += (force / params.mass) * h;
    position += velocity * h;
  }
  return { position, velocity };
}

/** Close enough to `target`, slowly enough, to stop and land exactly on it. */
export function springAtRest(state: SpringState, target: number): boolean {
  return (
    Math.abs(state.position - target) < REST_DISPLACEMENT && Math.abs(state.velocity) < REST_SPEED
  );
}

/** Whether moving from `from` to `to` crossed `target` (overshoot clamping). */
export function crossedTarget(from: number, to: number, target: number): boolean {
  return (from - target) * (to - target) < 0 || to === target;
}
