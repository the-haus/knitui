import * as React from "react";

/**
 * Shallow value-equality for a flat record of primitives. Bails on the first
 * difference and allocates nothing.
 */
function sameRecord<T extends object>(a: T | undefined, b: T | undefined): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  for (const key of aKeys) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) return false;
  }
  return true;
}

/**
 * Returns a referentially STABLE version of a flat config record: the previous
 * object is handed back whenever the new one is shallowly equal to it.
 *
 * For configs that are documented — and used — as inline object literals, so they
 * arrive with a fresh identity on every render even when nothing changed. That
 * identity is load-bearing downstream: `useSheetDrag` keys its `useMemo` on the
 * spring config, and rebuilding that memo rebuilds the `Gesture.Pan()`, which makes
 * RNGH tear down and re-attach the native handler.
 *
 * Only valid for records whose values are PRIMITIVES (the comparison is one level
 * deep) — `WithSpringConfig` is exactly that. Assigning the ref during render is a
 * pure cache (same input → same output), so a StrictMode double render is harmless.
 *
 * The sibling of `@knitui/carousel`'s `modeConfig` stabilization in `layouts/index`
 * and `@knitui/map`'s `useStableStyleValue`.
 */
export function useStableRecord<T extends object>(value: T | undefined): T | undefined {
  const ref = React.useRef(value);
  if (ref.current !== value && !sameRecord(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}
