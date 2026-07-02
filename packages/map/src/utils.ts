import type { Position } from "geojson";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isPosition(value: unknown): value is Position {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1])
  );
}

export function createTrailingDebounce<T>(fn: (value: T) => void, wait: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArg: T | null = null;

  return {
    call(value: T) {
      lastArg = value;

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        timer = null;
        if (lastArg !== null) {
          fn(lastArg);
        }
      }, wait);
    },
    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

export function createThrottle<T>(fn: (value: T) => void, wait: number) {
  let lastCallTime = 0;
  let trailingTimer: ReturnType<typeof setTimeout> | null = null;
  let lastArg: T | null = null;

  return {
    call(value: T) {
      const now = Date.now();
      lastArg = value;

      if (now - lastCallTime >= wait) {
        lastCallTime = now;
        fn(value);
        return;
      }

      if (!trailingTimer) {
        trailingTimer = setTimeout(
          () => {
            trailingTimer = null;
            lastCallTime = Date.now();
            if (lastArg !== null) {
              fn(lastArg);
            }
          },
          wait - (now - lastCallTime),
        );
      }
    },
    cancel() {
      if (trailingTimer) {
        clearTimeout(trailingTimer);
        trailingTimer = null;
      }
    },
  };
}
