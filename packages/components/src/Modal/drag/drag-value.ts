import type { WithSpringConfig } from "react-native-reanimated";

import type { DragOffset } from "./types";

/**
 * The web drag offset: a number with listeners and a spring, standing in for the
 * Reanimated `SharedValue` the native gesture writes (`useDragOffset.native`).
 * No React and no reanimated — the web build of the drag-to-dismiss primitive
 * reaches neither react-native-reanimated nor react-native-worklets.
 *
 * Mirrors the SharedValue semantics the drag code relies on:
 * - writing `.value` cancels a running animation (as assigning a plain number to
 *   a shared value does) and notifies every listener;
 * - `animateTo` springs toward a target from the current value and velocity and
 *   reports `finished: false` when it is cancelled (re-grabbed) mid-flight.
 */
export class DragValue implements DragOffset {
  private current: number;
  private readonly listeners = new Map<number, (value: number) => void>();
  private frame: number | null = null;
  private onFinish: ((finished: boolean) => void) | null = null;

  constructor(initial = 0) {
    this.current = initial;
  }

  get value(): number {
    return this.current;
  }

  set value(next: number) {
    this.cancel();
    this.write(next);
  }

  addListener(listenerId: number, listener: (value: number) => void): void {
    this.listeners.set(listenerId, listener);
  }

  removeListener(listenerId: number): void {
    this.listeners.delete(listenerId);
  }

  /** Stop a running spring where it is; its callback hears `finished: false`. */
  cancel(): void {
    if (this.frame != null) {
      cancelFrame(this.frame);
      this.frame = null;
    }
    const done = this.onFinish;
    this.onFinish = null;
    done?.(false);
  }

  /**
   * Spring from the current value to `target`, starting at `velocity` (units/s),
   * with Reanimated's `withSpring` parameters. `onFinish(true)` once at rest.
   */
  animateTo(
    target: number,
    config: WithSpringConfig = {},
    velocity = 0,
    onFinish?: (finished: boolean) => void,
  ): void {
    this.cancel();
    const { stiffness, damping, mass } = springConstants(config);
    const clamp = config.overshootClamping === true;
    const from = this.current;
    let x = from;
    let v = velocity;
    let last: number | null = null;
    this.onFinish = onFinish ?? null;

    const step = (now: number) => {
      // A fixed sub-step keeps the integration stable across frame-rate hiccups.
      const elapsed = last == null ? 1 / 60 : Math.min((now - last) / 1000, 1 / 15);
      last = now;
      const steps = Math.max(1, Math.ceil(elapsed / SUB_STEP));
      const dt = elapsed / steps;
      for (let i = 0; i < steps; i++) {
        const force = -stiffness * (x - target) - damping * v;
        v += (force / mass) * dt;
        x += v * dt;
      }
      const crossed = clamp && (from - target) * (x - target) <= 0;
      const atRest = Math.abs(x - target) < REST_DISPLACEMENT && Math.abs(v) < REST_SPEED;
      if (crossed || atRest) {
        this.frame = null;
        this.write(target);
        const done = this.onFinish;
        this.onFinish = null;
        done?.(true);
        return;
      }
      this.write(x);
      this.frame = requestFrame(step);
    };
    this.frame = requestFrame(step);
  }

  private write(next: number): void {
    this.current = next;
    this.listeners.forEach((listener) => listener(next));
  }
}

const SUB_STEP = 1 / 240;
/** px: close enough to the target to call the spring settled. */
const REST_DISPLACEMENT = 0.5;
/** px/s: slow enough to call the spring settled. */
const REST_SPEED = 2;

/**
 * Stiffness / damping / mass from either of `withSpring`'s parameter sets:
 * physical (`stiffness`, `damping`, `mass`) or perceptual (`duration` in ms,
 * `dampingRatio`), with Reanimated's own defaults (stiffness 900, damping 120,
 * mass 4 — the 4.x defaults) where nothing is given.
 */
export function springConstants(config: WithSpringConfig): {
  stiffness: number;
  damping: number;
  mass: number;
} {
  const c = config as {
    stiffness?: number;
    damping?: number;
    mass?: number;
    duration?: number;
    dampingRatio?: number;
  };
  const mass = c.mass ?? (c.duration != null ? 1 : 4);
  if (c.duration != null && c.stiffness == null && c.damping == null) {
    const ratio = c.dampingRatio ?? 1;
    // Settles (to ~2%) in about `duration`: ωn ≈ 4 / (ζ · T).
    const omega = 4 / ((Math.max(ratio, 0.1) * Math.max(c.duration, 1)) / 1000);
    return { stiffness: mass * omega * omega, damping: 2 * ratio * mass * omega, mass };
  }
  return { stiffness: c.stiffness ?? 900, damping: c.damping ?? 120, mass };
}

const requestFrame = (callback: (now: number) => void): number =>
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame(callback)
    : (setTimeout(() => callback(Date.now()), 16) as unknown as number);

const cancelFrame = (id: number): void => {
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(id);
  else clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
};
