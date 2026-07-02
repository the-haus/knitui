import { useEffect, useRef, useState } from "react";

export interface UseDebouncedValueOptions {
  /** Emit the first change immediately, then debounce the rest. @default false */
  leading?: boolean;
}

/**
 * Debounce a rapidly-changing value — port of Mantine's `useDebouncedValue`.
 * Returns `[debounced, cancel]`; `debounced` updates `wait` ms after `value`
 * stops changing. `leading` emits the first change immediately. Pure timers, so
 * identical on web and native — handy for search inputs (`Autocomplete`,
 * `Combobox`).
 */
export function useDebouncedValue<T>(
  value: T,
  wait: number,
  options: UseDebouncedValueOptions = {},
): [T, () => void] {
  const { leading = false } = options;
  const [debounced, setDebounced] = useState(value);
  const mountedRef = useRef(false);
  const cooldownRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    if (!mountedRef.current) return;

    if (!cooldownRef.current && leading) {
      cooldownRef.current = true;
      setDebounced(value);
    } else {
      cancel();
      timeoutRef.current = setTimeout(() => {
        cooldownRef.current = false;
        setDebounced(value);
      }, wait);
    }
  }, [value, leading, wait]);

  useEffect(() => {
    mountedRef.current = true;
    return cancel;
  }, []);

  return [debounced, cancel];
}
