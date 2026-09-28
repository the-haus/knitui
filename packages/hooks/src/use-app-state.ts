import { useSyncExternalStore } from "react";

import type { AppVisibility } from "./use-app-state.shared";

const read = (): AppVisibility =>
  typeof document !== "undefined" && document.visibilityState === "hidden"
    ? "background"
    : "active";

/**
 * Current coarse foreground/background state (web), readable from plain JS —
 * the Page Visibility API mapped onto the cross-platform `AppVisibility` union.
 * `"active"` where there is no `document` (SSR). The `use-app-state.native`
 * sibling reads React Native's `AppState`.
 */
export function getAppState(): AppVisibility {
  return read();
}

/**
 * Subscribe to foreground/background transitions (web). Fires with the NEW state
 * on each change — never for the state the page is already in. Tracks
 * `visibilitychange` plus `pagehide` / `pageshow`, so a page being unloaded or
 * put into the back/forward cache reports `"background"` even where no
 * `visibilitychange` precedes it — the last chance to flush pending writes.
 * Returns the unsubscribe; a no-op on the server.
 */
export function subscribeAppState(listener: (state: AppVisibility) => void): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};

  let last = read();
  const emit = (next: AppVisibility) => {
    if (next === last) return;
    last = next;
    listener(next);
  };
  const onVisibility = () => emit(read());
  const onPageHide = () => emit("background");

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onVisibility);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onVisibility);
  };
}

const serverSnapshot = (): AppVisibility => "active";

/**
 * Coarse foreground/background state (web) — {@link getAppState} as a hook,
 * re-rendering on each {@link subscribeAppState} change. SSR-safe (`"active"` on
 * the server and during hydration). Use it to pause intervals / animations when
 * backgrounded.
 */
export function useAppState(): AppVisibility {
  return useSyncExternalStore(subscribeAppState, getAppState, serverSnapshot);
}
