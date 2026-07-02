import { useState } from "react";

export interface UseUncontrolledOptions<T> {
  /** Value for controlled state. */
  value?: T;
  /** Initial value for uncontrolled state. */
  defaultValue?: T;
  /** Final value for uncontrolled state when neither `value` nor `defaultValue` is provided. */
  finalValue?: T;
  /** Called when the value changes (both controlled and uncontrolled). */
  onChange?: (value: T) => void;
}

/** `[value, setValue, controlled]` — the current value, a setter, and whether the state is controlled. */
export type UseUncontrolledReturnValue<T> = [T, (value: T) => void, boolean];

const noop = () => {};

/**
 * Controlled/uncontrolled state for an ARBITRARY value — port of Mantine's
 * `useUncontrolled`. Generalizes the boolean-only `internal/use-toggle`: when
 * `value` is provided the state is controlled (the setter just forwards to
 * `onChange`); otherwise it is tracked internally, seeded from `defaultValue`
 * then `finalValue`. Precisely generic — no `any`.
 */
export function useUncontrolled<T>({
  value,
  defaultValue,
  finalValue,
  onChange,
}: UseUncontrolledOptions<T>): UseUncontrolledReturnValue<T> {
  const [uncontrolledValue, setUncontrolledValue] = useState<T | undefined>(
    defaultValue !== undefined ? defaultValue : finalValue,
  );

  const handleUncontrolledChange = (val: T) => {
    setUncontrolledValue(val);
    onChange?.(val);
  };

  if (value !== undefined) {
    return [value, onChange ?? noop, true];
  }

  return [uncontrolledValue as T, handleUncontrolledChange, false];
}
