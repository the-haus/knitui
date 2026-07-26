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
export function useSharedValueListener<T>(
  sv: SharedValue<T>,
  fn: (value: T) => void,
  filter?: (value: T) => boolean,
): void {
  const latest = React.useRef(fn);
  latest.current = fn;
  // Read through a ref so a fresh predicate per render doesn't restart the
  // subscription (the native twin takes it as a worklet dependency instead).
  const latestFilter = React.useRef(filter);
  latestFilter.current = filter;

  React.useEffect(() => {
    const id = _nextId++;
    const notify = (value: T) => {
      const test = latestFilter.current;
      if (test && !test(value)) return;
      latest.current(value);
    };
    notify(sv.value);
    sv.addListener(id, notify);
    return () => sv.removeListener(id);
  }, [sv]);
}
