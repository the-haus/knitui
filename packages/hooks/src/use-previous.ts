import { useEffect, useRef } from "react";

/**
 * The value from the previous render (`undefined` on the first render) — port of
 * Mantine's `usePrevious`. Pure React, so identical on web and native.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
