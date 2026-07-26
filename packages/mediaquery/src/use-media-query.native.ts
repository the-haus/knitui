import { useEffect, useMemo, useSyncExternalStore } from "react";
import { AccessibilityInfo, Appearance, Dimensions } from "react-native";

import type { ColorScheme, MediaEnvironment, MediaQueryInput } from "./query.shared";
import { matchesQuery, parseMediaQuery, queryToString } from "./query.shared";
import type { UseMediaQueryOptions } from "./use-media-query.shared";

/** Query strings we've already warned about (so the dev warning fires once each). */
const warnedQueries = new Set<string>();

function toColorScheme(value: string | null | undefined): ColorScheme {
  return value === "dark" ? "dark" : "light";
}

/* -------------------------------------------------------------------------- */
/* Shared environment store                                                    */
/* -------------------------------------------------------------------------- */

/**
 * ONE module-level {@link MediaEnvironment} for the whole app, wired to React
 * Native's `Dimensions` / `Appearance` / `AccessibilityInfo` exactly once and
 * fanned out to every `useMediaQuery` caller.
 *
 * The previous per-hook `useState` + `useEffect` registered THREE native
 * subscriptions (plus an `isReduceMotionEnabled()` promise) per call site, so 20
 * call sites meant 60 live listeners; and because each handler did
 * `setEnv(prev => ({ ...prev, … }))` it always produced a NEW object, so a single
 * rotation re-rendered every instance even though the boolean each one derives
 * almost never flips.
 *
 * Two things fix that. (1) One store, three listeners total, regardless of call
 * count. (2) `getSnapshot` returns the resolved **boolean** rather than the
 * environment object, so React's own bailout absorbs the common case: an
 * environment change that doesn't cross the query's threshold produces the same
 * boolean and re-renders nothing. `setEnvironment` additionally value-compares
 * before notifying, so a `Dimensions` event that reports the same size is a
 * complete no-op.
 *
 * Mirrors the module-store shape of `@knitui/hooks`'
 * `use-keyboard-height.native` / `use-reduced-motion`.
 */
let environment: MediaEnvironment | null = null;
let wired = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function setEnvironment(next: Partial<MediaEnvironment>): void {
  const current = environment ?? readEnvironment();
  let changed = false;
  for (const key of Object.keys(next) as (keyof MediaEnvironment)[]) {
    if (next[key] !== undefined && next[key] !== current[key]) changed = true;
  }
  // Value-equality bail: `Dimensions` fires on every layout pass and often
  // reports an unchanged window, which must not wake a single subscriber.
  if (!changed) return;
  environment = { ...current, ...next };
  notify();
}

function readEnvironment(): MediaEnvironment {
  const { width, height } = Dimensions.get("window");
  environment = {
    width,
    height,
    colorScheme: toColorScheme(Appearance.getColorScheme()),
    // Resolved asynchronously by `wireOnce` — RN exposes reduced-motion only via
    // a promise, and native has no synchronous getter.
    reducedMotion: false,
  };
  return environment;
}

/** Attach the three native listeners exactly once, on first read or subscribe. */
function wireOnce(): void {
  if (wired) return;
  wired = true;

  Dimensions.addEventListener("change", ({ window }) => {
    setEnvironment({ width: window.width, height: window.height });
  });
  Appearance.addChangeListener(({ colorScheme }) => {
    setEnvironment({ colorScheme: toColorScheme(colorScheme) });
  });
  AccessibilityInfo.addEventListener("reduceMotionChanged", (reducedMotion) => {
    setEnvironment({ reducedMotion });
  });
  void AccessibilityInfo.isReduceMotionEnabled().then((reducedMotion) => {
    setEnvironment({ reducedMotion });
  });
  // The listeners are intentionally never removed: they are a fixed, tiny set
  // owned by the module (not by any component), and tearing them down on the last
  // unmount only to re-attach on the next mount is the churn we removed.
}

/** The live environment snapshot. Safe to call outside React. */
export function getMediaEnvironment(): MediaEnvironment {
  wireOnce();
  return environment ?? readEnvironment();
}

/** Subscribe to environment changes. Returns an unsubscribe. */
export function subscribeMediaEnvironment(listener: () => void): () => void {
  wireOnce();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Subscribe to a media query (React Native) — native counterpart of
 * `use-media-query`. Evaluates the query against the shared environment store.
 * `initialValue` / `options` are accepted for signature parity with the web hook
 * but are unused on native, which always has a real viewport.
 */
export function useMediaQuery(
  query: MediaQueryInput,
  _initialValue?: boolean,
  _options: UseMediaQueryOptions = {},
): boolean {
  // Key on the SERIALISED query so an inline descriptor object (a fresh identity
  // every render) doesn't invalidate the memo. Combined with the parse cache in
  // `query.shared`, evaluating a snapshot is then a handful of numeric compares.
  const queryKey = typeof query === "string" ? query : queryToString(query);
  const getSnapshot = useMemo(
    () => () => matchesQuery(queryKey, getMediaEnvironment()),
    [queryKey],
  );

  useEffect(() => {
    if (!__DEV__ || typeof query !== "string" || warnedQueries.has(query)) return;
    const { unsupportedFeatures } = parseMediaQuery(query);
    if (unsupportedFeatures.length > 0) {
      warnedQueries.add(query);
      console.warn(
        `[@knitui/mediaquery] Query "${query}" uses feature(s) not supported on native: ` +
          `${unsupportedFeatures.join(", ")}. Any OR group using them evaluates to false. ` +
          `Use a structured descriptor for guaranteed cross-platform behavior.`,
      );
    }
  }, [query]);

  return useSyncExternalStore(subscribeMediaEnvironment, getSnapshot, getSnapshot);
}
