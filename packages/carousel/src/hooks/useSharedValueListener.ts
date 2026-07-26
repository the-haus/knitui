import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

/** Monotonic ids for `SharedValue.addListener` (must be unique per subscription). */
let _nextId = 0;

/**
 * Subscribe to a reanimated `SharedValue` from the JS thread via its
 * `addListener` API. This is the WEB mechanism: `addListener` fires on every
 * `.value` write and — crucially — fires *synchronously* on direct writes, which
 * is exactly how the jest suite drives the carousel, so this path is actually
 * exercised in tests (the rAF loops it replaces were skipped under jsdom).
 *
 * ⚠️ WEB ONLY (or an explicitly web-only module). In Reanimated 4 a listener can
 * only be added on the UI runtime, so calling this from the JS thread on NATIVE
 * throws. Every native-reachable call site must pass `enabled = isWeb` and pair
 * it with a UI-thread `useAnimatedReaction` for native (see
 * `motion/useCarouselCore` and `pagination/selectedDot`); a `.web` file may call
 * it ungated. Note that `useAnimatedReaction` is the exact mirror image: it is
 * the native mechanism and does not re-run on value changes under this repo's
 * web tooling.
 *
 * `fn` is read through a ref, so passing a fresh closure each render does not
 * restart the subscription. The current value is delivered once on subscribe so
 * consumers are in sync even if it changed between render and effect.
 *
 * `enabled` (default true) gates the subscription.
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
