import { useCallback, useState } from "react";

/** Controlled/uncontrolled boolean state helper shared by Switch & Checkbox. */
export function useToggle(
  controlled: boolean | undefined,
  fallback: boolean,
  onChange?: (v: boolean) => void,
) {
  const [internal, setInternal] = useState(fallback);
  const value = controlled ?? internal;
  const toggle = useCallback(() => {
    const next = !value;
    if (controlled === undefined) setInternal(next);
    onChange?.(next);
  }, [value, controlled, onChange]);
  return [value, toggle] as const;
}
