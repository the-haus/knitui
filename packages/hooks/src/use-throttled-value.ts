import { useEffect, useRef, useState } from "react";

import { useThrottledCallbackWithClearTimeout } from "./use-throttled-callback";

/**
 * Throttle a rapidly-changing value — port of Mantine's `useThrottledValue`. The
 * returned value updates at most once per `wait` ms (leading + trailing). Pure
 * timers, so identical on web and native — handy for `ColorPicker` drag or
 * scroll-driven state.
 */
export function useThrottledValue<T>(value: T, wait: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const valueRef = useRef(value);
  const [throttledSetValue, clear] = useThrottledCallbackWithClearTimeout(setThrottledValue, wait);

  useEffect(() => {
    if (!Object.is(value, valueRef.current)) {
      valueRef.current = value;
      throttledSetValue(value);
    }
  }, [value, throttledSetValue]);

  useEffect(() => clear, [clear]);

  return throttledValue;
}
