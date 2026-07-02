import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

/** Monotonic ids for `SharedValue.addListener` (must be unique per subscription). */
let _nextId = 0;

/**
 * Subscribe to a reanimated `SharedValue` on BOTH platforms via its
 * `addListener` API. This is the cross-platform replacement for the old
 * native-`useAnimatedReaction` / web-`rAF` platform split: `addListener` fires
 * on every `.value` write — on native and on web — and crucially fires
 * *synchronously* on direct writes, which is exactly how the jest suite drives
 * the carousel, so this path is actually exercised in tests (the rAF loops it
 * replaces were skipped under jsdom).
 *
 * `fn` is read through a ref, so passing a fresh closure each render does not
 * restart the subscription. The current value is delivered once on subscribe so
 * consumers are in sync even if it changed between render and effect.
 *
 * `enabled` (default true) gates the subscription — pass `isWeb` to run the
 * listener only on web while a UI-thread `useAnimatedReaction` covers native.
 */
export function useSharedValueListener<T>(
  sv: SharedValue<T>,
  fn: (value: T) => void,
  enabled = true,
): void {
  const latest = React.useRef(fn);
  latest.current = fn;

  React.useEffect(() => {
    if (!enabled) return undefined;
    const id = _nextId++;
    latest.current(sv.value);
    sv.addListener(id, (value) => latest.current(value));
    return () => sv.removeListener(id);
  }, [sv, enabled]);
}
