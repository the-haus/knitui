import * as React from "react";

import type { SheetValue } from "./value.types";

export type { SheetValue } from "./value.types";

/**
 * An observable value (WEB build) — the web twin of a reanimated `SharedValue`,
 * so the web bundle needs no reanimated at all.
 *
 * Same contract as the shared value the sheet used on web before: listeners are
 * called synchronously on every write (the painters in `view/animated.tsx`
 * move the panel straight from them), and ASSIGNING `.value` stops any
 * animation driving it — exactly as assigning a number to a shared value
 * replaces its animation. An animation writes through {@link MotionValue.drive}
 * instead, which does not stop itself.
 */
export class MotionValue<T> implements SheetValue<T> {
  private current: T;
  private readonly listeners = new Map<number, (value: T) => void>();
  private stop: (() => void) | null = null;
  /** Velocity (units/s) of the animation driving the value, 0 at rest. */
  velocity = 0;

  constructor(initial: T) {
    this.current = initial;
  }

  get value(): T {
    return this.current;
  }

  set value(next: T) {
    this.cancel();
    this.drive(next);
  }

  /** Write without stopping the animation — what an animation's frame calls. */
  drive(next: T): void {
    this.current = next;
    for (const listener of [...this.listeners.values()]) listener(next);
  }

  /** Hand the value to an animation; `stop` ends it (called on any cancel). */
  animate(stop: () => void): void {
    this.cancel();
    this.stop = stop;
  }

  /** Whether an animation is driving the value. */
  get animating(): boolean {
    return this.stop !== null;
  }

  /** Stop the driving animation (if any), leaving the value where it is. */
  cancel(): void {
    const stop = this.stop;
    this.stop = null;
    this.velocity = 0;
    stop?.();
  }

  /** The animation ended on its own: release it without calling its `stop`. */
  settle(): void {
    this.stop = null;
    this.velocity = 0;
  }

  addListener(id: number, listener: (value: T) => void): void {
    this.listeners.set(id, listener);
  }

  removeListener(id: number): void {
    this.listeners.delete(id);
  }
}

/** One {@link MotionValue} per component instance (web build). */
export function useMotionValue<T>(initial: T): SheetValue<T> {
  const ref = React.useRef<MotionValue<T> | null>(null);
  if (ref.current === null) ref.current = new MotionValue(initial);
  return ref.current;
}

/** Stop whatever animation is driving `value`, leaving it where it is. */
export function cancelMotion(value: SheetValue<number>): void {
  if (value instanceof MotionValue) value.cancel();
}
