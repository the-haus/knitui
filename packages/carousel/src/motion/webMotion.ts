import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

/**
 * The carousel's WEB motion runtime: the few Reanimated / Worklets primitives
 * the web path uses, in plain JS, so a web build never reaches
 * `react-native-reanimated`, `react-native-worklets` or
 * `react-native-gesture-handler` (native-only libraries).
 *
 * Imported ONLY by `.web` files (and by `motion/runtime.web.ts`, the web twin
 * of the internal `motion/runtime` seam). Native never loads it: there the
 * same names come straight from Reanimated (`motion/runtime.ts`).
 *
 * What is here, and why it is enough:
 *  - SHARED VALUES. A JS object with `.value` / `get` / `set` / `modify` and
 *    `addListener` / `removeListener`. The web path already paints through
 *    listeners (see `view/painter.web.ts`, `hooks/useSharedValueListener`);
 *    Reanimated's reactive hooks never re-ran on web under this repo's tooling,
 *    so nothing here needs a UI thread.
 *  - ANIMATIONS. `animate(sv, withTiming | withSpring | withDecay, onDone)`
 *    drives a value with `requestAnimationFrame`, writing plain numbers. It
 *    therefore also drives a consumer's own Reanimated shared value (passed as
 *    `scrollOffsetValue` / `progress`): a write from anywhere else cancels the
 *    animation, exactly like a direct `.value =` on native.
 *  - `interpolate` / `Extrapolation`: Reanimated's piecewise-linear mapping,
 *    ported verbatim in behaviour, for the layouts and the pagination.
 */

/* ── shared values ─────────────────────────────────────────────────────── */

type Listener<T> = (value: T) => void;

/** A running animation, cancellable from a write or `cancelAnimation`. */
interface Running {
  cancel: () => void;
}

const running = new WeakMap<object, Running>();

class WebSharedValue<T> {
  private current: T;
  private readonly listeners = new Map<number, Listener<T>>();

  constructor(initial: T) {
    this.current = initial;
  }

  get value(): T {
    return this.current;
  }

  /** A write from outside an animation cancels the one in flight (as on native). */
  set value(next: T) {
    stopRunning(this);
    this.write(next);
  }

  get(): T {
    return this.current;
  }

  set(next: T | ((prev: T) => T)): void {
    this.value = typeof next === "function" ? (next as (prev: T) => T)(this.current) : next;
  }

  modify(modifier?: (value: T) => T): void {
    if (modifier) this.value = modifier(this.current);
  }

  addListener(id: number, listener: Listener<T>): void {
    this.listeners.set(id, listener);
  }

  removeListener(id: number): void {
    this.listeners.delete(id);
  }

  /** The animator's write: does NOT cancel the animation that is making it. */
  write(next: T): void {
    this.current = next;
    this.listeners.forEach((listener) => listener(next));
  }
}

function stopRunning(sv: object): void {
  const r = running.get(sv);
  if (r) r.cancel();
}

/** A shared value outside React (Reanimated's `makeMutable`). */
export function makeMutable<T>(initial: T): SharedValue<T> {
  return new WebSharedValue(initial) as unknown as SharedValue<T>;
}

/** Reanimated's `useSharedValue`: one stable value for the component's life. */
export function useSharedValue<T>(initial: T): SharedValue<T> {
  const [sv] = React.useState(() => makeMutable(initial));
  return sv;
}

/**
 * Reanimated's `useAnimatedReaction`, as it behaved on web here: it never
 * re-ran on value changes, so every web consumer pairs it with a listener
 * (`useSharedValueListener`). A no-op keeps the shared hook order intact.
 */
export function useAnimatedReaction<T>(
  _prepare: () => T,
  _react: (current: T, previous: T | null) => void,
  _deps?: unknown[],
): void {}

/** Worklets' `scheduleOnRN`: on web there is one thread, so call it now. */
export function scheduleOnRN<A extends unknown[]>(fn: (...args: A) => unknown, ...args: A): void {
  fn(...args);
}

/* ── animations ────────────────────────────────────────────────────────── */

type EasingFn = (t: number) => number;

export interface TimingSpec {
  kind: "timing";
  to: number;
  duration?: number;
  easing?: unknown;
}

export interface SpringSpec {
  kind: "spring";
  to: number;
  damping?: number;
  mass?: number;
  stiffness?: number;
  duration?: number;
  dampingRatio?: number;
  overshootClamping?: boolean;
  velocity?: number;
}

export interface DecaySpec {
  kind: "decay";
  velocity: number;
  deceleration?: number;
  clamp?: readonly [number, number];
}

export type AnimationSpec = TimingSpec | SpringSpec | DecaySpec;

/** `withTiming(to, { duration, easing })` (Reanimated's defaults: 300 ms, ease-in-out quad). */
export function withTiming(
  to: number,
  config?: { duration?: number; easing?: unknown },
): TimingSpec {
  return { kind: "timing", to, ...config };
}

/** `withSpring(to, config)`: physics (`damping`/`mass`/`stiffness`) or `duration`/`dampingRatio`. */
export function withSpring(to: number, config?: Omit<SpringSpec, "kind" | "to">): SpringSpec {
  return { kind: "spring", to, ...config };
}

/** `withDecay({ velocity, deceleration })`: inertial glide from the current value. */
export function withDecay(config: Omit<DecaySpec, "kind">): DecaySpec {
  return { kind: "decay", ...config };
}

/** Reanimated's `Easing.inOut(Easing.quad)` — `withTiming`'s default curve. */
const inOutQuad: EasingFn = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** A Reanimated easing is a function, or (Reanimated 4 `bezier`) a `{ factory }`. */
function easingOf(easing: unknown): EasingFn {
  if (typeof easing === "function") return easing as EasingFn;
  if (easing && typeof (easing as { factory?: unknown }).factory === "function") {
    return (easing as { factory: () => EasingFn }).factory();
  }
  return inOutQuad;
}

const now = (): number =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const frame = (cb: (t: number) => void): unknown =>
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame(cb)
    : setTimeout(() => cb(now()), 16);

const cancelFrame = (handle: unknown): void => {
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(handle as number);
  else clearTimeout(handle as ReturnType<typeof setTimeout>);
};

/** Reanimated 4's spring defaults (`GentleSpringConfig`). */
const SPRING_DEFAULTS = { damping: 120, mass: 4, stiffness: 900 } as const;

/** A step function: advance by `dtMs`, return the new value and whether it rests. */
type Stepper = (dtMs: number) => { value: number; done: boolean };

function stepperFor(spec: AnimationSpec, from: number): Stepper {
  if (spec.kind === "timing") {
    const duration = Math.max(0, spec.duration ?? 300);
    const ease = easingOf(spec.easing);
    let elapsed = 0;
    return (dt) => {
      elapsed += dt;
      if (duration === 0 || elapsed >= duration) return { value: spec.to, done: true };
      return { value: from + (spec.to - from) * ease(elapsed / duration), done: false };
    };
  }
  if (spec.kind === "decay") {
    const deceleration = spec.deceleration ?? 0.998;
    let v = spec.velocity; // px/s
    let x = from;
    return (dt) => {
      // Per-millisecond friction, integrated in 1 ms slices for stability.
      for (let i = 0; i < dt; i++) {
        v *= deceleration;
        x += v / 1000;
      }
      if (spec.clamp) {
        const [lo, hi] = spec.clamp;
        if (x <= lo || x >= hi) return { value: Math.min(hi, Math.max(lo, x)), done: true };
      }
      return { value: x, done: Math.abs(v) < 1 };
    };
  }
  // Spring: a damped oscillator, integrated in 1 ms slices.
  const target = spec.to;
  let mass: number = spec.mass ?? SPRING_DEFAULTS.mass;
  let stiffness: number = spec.stiffness ?? SPRING_DEFAULTS.stiffness;
  let damping: number = spec.damping ?? SPRING_DEFAULTS.damping;
  const physical =
    spec.damping !== undefined || spec.stiffness !== undefined || spec.mass !== undefined;
  if (!physical && (spec.duration !== undefined || spec.dampingRatio !== undefined)) {
    // Duration-based: settle in about `duration` at the given damping ratio.
    const ratio = spec.dampingRatio ?? 1;
    const seconds = Math.max(0.05, (spec.duration ?? 550) / 1000);
    mass = 1;
    const omega = 4 / (Math.max(ratio, 0.3) * seconds);
    stiffness = omega * omega;
    damping = 2 * ratio * omega;
  }
  let x = from;
  let v = spec.velocity ?? 0; // px/s
  const span = Math.max(1, Math.abs(target - from));
  return (dt) => {
    for (let i = 0; i < dt; i++) {
      const force = -stiffness * (x - target) - damping * v;
      v += (force / mass) * 0.001;
      x += v * 0.001;
      if (spec.overshootClamping && (from - target) * (x - target) <= 0) {
        return { value: target, done: true };
      }
    }
    const resting = Math.abs(x - target) < span * 1e-3 + 0.01 && Math.abs(v) < 2;
    return resting ? { value: target, done: true } : { value: x, done: false };
  };
}

/** The user asked the system for less motion (`prefers-reduced-motion`). */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Where `spec` comes to rest when it is not animated at all. */
function restingValue(spec: AnimationSpec, from: number): number {
  return spec.kind === "decay" ? from : spec.to;
}

/**
 * Animate `sv` with `spec`; `onDone(finished)` fires once — `true` at rest,
 * `false` when cancelled (a new animation, `cancelAnimation`, or any other
 * write to the value).
 *
 * Under `prefers-reduced-motion: reduce` it lands on the next frame without
 * moving through the in-between values — Reanimated's default
 * (`ReduceMotion.System`) on native.
 */
export function animate(
  sv: SharedValue<number>,
  spec: AnimationSpec,
  onDone?: (finished: boolean) => void,
): void {
  stopRunning(sv);
  const own = sv instanceof WebSharedValue;
  const write = (n: number) => {
    if (own) (sv as unknown as WebSharedValue<number>).write(n);
    else sv.value = n;
  };
  const from = sv.value;
  const step: Stepper = prefersReducedMotion()
    ? () => ({ value: restingValue(spec, from), done: true })
    : stepperFor(spec, from);
  let last = now();
  let lastWritten = sv.value;
  let handle: unknown = null;
  let settled = false;
  const finish = (finished: boolean) => {
    if (settled) return;
    settled = true;
    if (handle !== null) cancelFrame(handle);
    if (running.get(sv) === entry) running.delete(sv);
    onDone?.(finished);
  };
  const entry: Running = { cancel: () => finish(false) };
  running.set(sv, entry);
  const tick = (t: number) => {
    if (settled) return;
    // Someone else wrote the value (a drag, a consumer): that ends this animation.
    if (!own && sv.value !== lastWritten) {
      finish(false);
      return;
    }
    const dt = Math.min(64, Math.max(0, Math.round((typeof t === "number" ? t : now()) - last)));
    last = typeof t === "number" ? t : now();
    const { value, done } = step(dt);
    lastWritten = value;
    write(value);
    if (done) finish(true);
    else handle = frame(tick);
  };
  handle = frame(tick);
}

/** Is an animation running on `sv` right now? */
export function isAnimating<T>(sv: SharedValue<T>): boolean {
  return running.has(sv);
}

/** Reanimated's `cancelAnimation`. */
export function cancelAnimation<T>(sv: SharedValue<T>): void {
  stopRunning(sv);
}

/* ── interpolate ───────────────────────────────────────────────────────── */

/** Reanimated's `Extrapolation` (same string values). */
export enum Extrapolation {
  IDENTITY = "identity",
  CLAMP = "clamp",
  EXTEND = "extend",
}

type ExtrapolationType =
  | Extrapolation
  | "identity"
  | "clamp"
  | "extend"
  | { extrapolateLeft?: Extrapolation | string; extrapolateRight?: Extrapolation | string }
  | undefined;

function edge(
  type: string,
  coef: number,
  val: number,
  leftOut: number,
  rightOut: number,
  x: number,
): number {
  if (type === Extrapolation.IDENTITY) return x;
  if (type === Extrapolation.CLAMP) return coef * val < coef * leftOut ? leftOut : rightOut;
  return val;
}

/** Reanimated's `interpolate` (piecewise linear, per-side extrapolation). */
export function interpolate(
  value: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  type?: ExtrapolationType,
): number {
  if (inputRange.length < 2 || outputRange.length < 2) {
    throw new Error("interpolate: input and output ranges need at least two values.");
  }
  let left: string = Extrapolation.EXTEND;
  let right: string = Extrapolation.EXTEND;
  if (typeof type === "string") {
    left = type;
    right = type;
  } else if (type) {
    left = type.extrapolateLeft ?? left;
    right = type.extrapolateRight ?? right;
  }
  const n = inputRange.length;
  let i: number;
  if (value > inputRange[n - 1]!) {
    i = n - 1;
  } else {
    let lo = 1;
    let hi = n - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (value <= inputRange[mid]!) hi = mid;
      else lo = mid + 1;
    }
    i = lo;
  }
  const inL = inputRange[i - 1]!;
  const inR = inputRange[i]!;
  const outL = outputRange[i - 1]!;
  const outR = outputRange[i]!;
  if (inR - inL === 0) return outL;
  const val = outL + ((value - inL) / (inR - inL)) * (outR - outL);
  const coef = outR >= outL ? 1 : -1;
  if (coef * val < coef * outL) return edge(left, coef, val, outL, outR, value);
  if (coef * val > coef * outR) return edge(right, coef, val, outL, outR, value);
  return val;
}
