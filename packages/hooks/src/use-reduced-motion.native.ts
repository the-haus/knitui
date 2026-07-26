import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

/* -------------------------------------------------------------------------- */
/* Shared subscription                                                        */
/* -------------------------------------------------------------------------- */

/**
 * ONE `AccessibilityInfo` subscription for the whole app, fanned out to every
 * caller. Nearly every animated part in the kit calls this hook (`Transition`,
 * `Collapse`, `Skeleton`, `Loader`, `Progress`, `Indicator`, `ScrollArea`,
 * `Marquee`, the looping primitive, …), and the previous per-instance version paid
 * a native `isReduceMotionEnabled()` round-trip PLUS an `addEventListener` for each
 * one — every mount hit the bridge and then re-rendered when the promise resolved.
 * Now the bridge is queried once per app and the value is served synchronously.
 */
let reduced = false;
let primed = false;

const listeners = new Set<() => void>();
const notify = () => {
  for (const listener of listeners) listener();
};

const setReduced = (value: boolean) => {
  if (value === reduced) return;
  reduced = value;
  notify();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  if (!primed) {
    primed = true;
    // One bridge round-trip per app lifetime, plus one long-lived listener.
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
  }
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): boolean => reduced;

/**
 * Whether the user prefers reduced motion on React Native — native counterpart
 * of `use-reduced-motion`. Seeds from `AccessibilityInfo.isReduceMotionEnabled()`
 * and tracks the `"reduceMotionChanged"` event, through a single app-wide
 * subscription shared by every caller.
 */
export function useReducedMotion(initialValue = false): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialValue);
}
