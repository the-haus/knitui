import { useCallback, useState } from "react";

import { useCallbackRef } from "./use-callback-ref";

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

/**
 * Controlled/uncontrolled state for an ARBITRARY value — port of Mantine's
 * `useUncontrolled`. Generalizes the boolean-only `internal/use-toggle`: when
 * `value` is provided the state is controlled (the setter just forwards to
 * `onChange`); otherwise it is tracked internally, seeded from `defaultValue`
 * then `finalValue`. Precisely generic — no `any`.
 *
 * The returned setter is REFERENTIALLY STABLE in both the controlled and the
 * uncontrolled branch, and that stability is load-bearing rather than a nicety.
 * ~48 files across `components`, `dates` and `sheet` call this hook and hand the
 * setter straight to a child, a context value, or a `useMemo`/`useEffect` dep
 * list. When the setter changed identity every render, the invalidation
 * cascaded: in `Combobox` a fresh `setOpen` made the `use-combobox` store a new
 * object, which made the `ComboboxContext` value a new object — and because
 * context propagation walks *past* `React.memo`, every option row re-rendered
 * on every keystroke no matter how carefully it was memoized.
 *
 * Callers almost always pass `onChange` as an inline arrow, so the latest
 * version is read through a ref (`useCallbackRef`) instead of being closed over.
 * That also means a consumer who memoized a handler with `[]` deps around the
 * setter still invokes the current `onChange` rather than the one from its first
 * render.
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

  // Stable identity, always-latest `onChange`. Doubles as the controlled-branch
  // setter, so both branches hand back a setter that never changes identity.
  const emitChange = useCallbackRef(onChange);

  const handleUncontrolledChange = useCallback(
    (val: T) => {
      setUncontrolledValue(val);
      emitChange(val);
    },
    [emitChange],
  );

  if (value !== undefined) {
    return [value, emitChange, true];
  }

  return [uncontrolledValue as T, handleUncontrolledChange, false];
}
