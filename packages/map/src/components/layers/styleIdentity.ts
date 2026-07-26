/**
 * Structural comparison + identity stabilization for layer style values.
 *
 * Layer paint/layout/filter values are expression trees (`["step", ["get", …], …]`)
 * and the public API is a camelCase `style` **object literal**, which every call
 * site writes inline. So the objects have a fresh identity on every render even
 * when nothing changed, which defeats:
 *
 * - `useMemo`/`useEffect` deps keyed on them (web `useWebLayer`),
 * - the native prop diff (upstream `Layer` rebuilds `reactStyle` and Fabric ships it),
 * - maplibre's own guards, which only kick in *after* `getPaintProperty()` has
 *   deep-cloned the current expression tree.
 *
 * Comparing the value ourselves is strictly cheaper than any of those: it bails on
 * the first difference and never allocates.
 */

import { useRef } from "react";

/**
 * Deep structural equality for style values (primitives, expression arrays, and
 * plain objects). Bails on the first difference; allocates nothing.
 */
export function styleValueEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!styleValueEquals(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object") {
    if (typeof b !== "object" || Array.isArray(b)) return false;
    const aRec = a as Record<string, unknown>;
    const bRec = b as Record<string, unknown>;
    const aKeys = Object.keys(aRec);
    if (aKeys.length !== Object.keys(bRec).length) return false;
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(bRec, key)) return false;
      if (!styleValueEquals(aRec[key], bRec[key])) return false;
    }
    return true;
  }

  // Different primitives (`a === b` already covered equality).
  return false;
}

/**
 * Returns a referentially **stable** version of `value`: the previous object is
 * handed back whenever the new one is structurally equal to it. Turns an inline
 * `style={{ … }}` / `filter={[…]}` literal into something `useMemo` deps and
 * native prop diffing can actually rely on.
 */
export function useStableStyleValue<T>(value: T): T {
  const ref = useRef<T>(value);
  if (ref.current !== value && !styleValueEquals(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}
