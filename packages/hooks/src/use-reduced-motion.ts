import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/* -------------------------------------------------------------------------- */
/* Shared subscription                                                        */
/* -------------------------------------------------------------------------- */

/**
 * ONE `MediaQueryList` + ONE `change` listener for the whole app, fanned out to
 * every caller. This hook is called by nearly every animated part in the kit
 * (`Transition`/`Popover`/`Tooltip`, `Collapse`, `Skeleton`, `Loader`, `Progress`,
 * `Indicator`, `ScrollArea`, `Marquee`, …), so a per-instance `matchMedia` +
 * listener meant hundreds of live media-query subscriptions on a busy screen — and,
 * because the old implementation seeded `false` and then `setState`d the real value
 * from an effect, an extra render pass per instance on mount.
 *
 * Reading the live value through `useSyncExternalStore` fixes both: the first render
 * already sees the correct value (no mount re-render), and all callers share a
 * single listener.
 */
let mql: MediaQueryList | null | undefined;

const getMql = (): MediaQueryList | null => {
  if (mql !== undefined) return mql;
  mql =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(QUERY)
      : null;
  return mql;
};

const listeners = new Set<() => void>();
let attached = false;
const notify = () => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  const query = getMql();
  if (query && !attached) {
    attached = true;
    query.addEventListener("change", notify);
  }
  return () => {
    listeners.delete(listener);
    // Keep the (single, cheap) listener attached once created: components mount and
    // unmount constantly, and re-attaching per instance is what we set out to avoid.
  };
};

const getSnapshot = (): boolean => getMql()?.matches ?? false;

/**
 * Whether the user prefers reduced motion (web) — port of Mantine's
 * `useReducedMotion`. Tracks the `prefers-reduced-motion` media query; SSR-safe
 * (the server snapshot is `initialValue`). The `use-reduced-motion.native` sibling
 * uses React Native's `AccessibilityInfo`. Use it to gate animations (`Skeleton`,
 * `Spinner`, `Collapse`).
 */
export function useReducedMotion(initialValue = false): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => initialValue);
}
