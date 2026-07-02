import { useCallback, useState } from "react";

export interface UseCounterOptions {
  /** Lower bound (inclusive). */
  min?: number;
  /** Upper bound (inclusive). */
  max?: number;
}

export interface UseCounterHandlers {
  /** Increment by one (clamped to `max`). */
  increment: () => void;
  /** Decrement by one (clamped to `min`). */
  decrement: () => void;
  /** Set an explicit value (clamped to `[min, max]`). */
  set: (value: number) => void;
  /** Reset to the initial value. */
  reset: () => void;
}

const clamp = (value: number, min?: number, max?: number): number => {
  let next = value;
  if (typeof min === "number") next = Math.max(next, min);
  if (typeof max === "number") next = Math.min(next, max);
  return next;
};

/**
 * Integer counter state with optional bounds — port of Mantine's `useCounter`.
 * Returns `[count, handlers]`. Pure React state, so identical on web and native.
 */
export function useCounter(
  initialValue = 0,
  options: UseCounterOptions = {},
): [number, UseCounterHandlers] {
  const { min, max } = options;
  const [count, setCount] = useState(clamp(initialValue, min, max));

  const increment = useCallback(
    () => setCount((current) => clamp(current + 1, min, max)),
    [min, max],
  );

  const decrement = useCallback(
    () => setCount((current) => clamp(current - 1, min, max)),
    [min, max],
  );

  const set = useCallback((value: number) => setCount(clamp(value, min, max)), [min, max]);

  const reset = useCallback(
    () => setCount(clamp(initialValue, min, max)),
    [initialValue, min, max],
  );

  return [count, { increment, decrement, set, reset }];
}
