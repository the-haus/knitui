import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

/** Monotonic ids for `SharedValue.addListener` (must be unique per subscription). */
let _nextId = 0;

/**
 * Subscribe to a reanimated `SharedValue` (WEB build). Uses the `addListener`
 * API, which on web fires on every `.value` write and *synchronously* on direct
 * writes (how the jest suite drives the sheet, so this path is exercised in
 * tests). On native, `addListener` may only be called from the UI runtime
 * (Reanimated 4 throws "Adding listeners is only possible on the UI runtime" from
 * JS) AND this repo's web tooling makes `useAnimatedReaction` inert — so the
 * platforms split: the native build (`useSharedValueListener.native.ts`) reacts
 * via `useAnimatedReaction` instead.
 *
 * `fn` is read through a ref, so passing a fresh closure each render does not
 * restart the subscription. The current value is delivered once on subscribe so
 * consumers are in sync even if it changed between render and effect.
 */
export function useSharedValueListener<T>(sv: SharedValue<T>, fn: (value: T) => void): void {
  const latest = React.useRef(fn);
  latest.current = fn;

  React.useEffect(() => {
    const id = _nextId++;
    latest.current(sv.value);
    sv.addListener(id, (value) => latest.current(value));
    return () => sv.removeListener(id);
  }, [sv]);
}
