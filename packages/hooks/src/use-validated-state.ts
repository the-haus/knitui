import { useCallback, useState } from "react";

export interface ValidatedState<T> {
  /** The current value (valid or not). */
  value: T;
  /** The most recent value that passed validation. */
  lastValidValue: T | undefined;
  /** Whether `value` currently passes validation. */
  valid: boolean;
}

/**
 * Track a value alongside its validation result and the last valid value — port
 * of Mantine's `useValidatedState`. Pure React, so identical on web and native.
 */
export function useValidatedState<T>(
  initialValue: T,
  validation: (value: T) => boolean,
  initialValidationState?: boolean,
): [ValidatedState<T>, (value: T) => void] {
  const [value, setValue] = useState<ValidatedState<T>>({
    value: initialValue,
    lastValidValue: validation(initialValue) ? initialValue : undefined,
    valid:
      typeof initialValidationState === "boolean"
        ? initialValidationState
        : validation(initialValue),
  });

  const onChange = useCallback(
    (val: T) => {
      if (validation(val)) {
        setValue({ value: val, lastValidValue: val, valid: true });
      } else {
        setValue((current) => ({
          value: val,
          lastValidValue: current.lastValidValue,
          valid: false,
        }));
      }
    },
    [validation],
  );

  return [value, onChange];
}
