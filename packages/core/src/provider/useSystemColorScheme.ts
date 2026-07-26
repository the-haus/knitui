import { useSyncExternalStore } from "react";

import type { ColorScheme } from "./Provider.types";

const darkSchemeQuery = "(prefers-color-scheme: dark)";

/**
 * ONE `MediaQueryList` for the whole module, created lazily on first use.
 *
 * `window.matchMedia(...)` constructs a live, document-registered query object —
 * not a cheap value read. Both `getSnapshot` (which React calls on every render
 * and again on every store-change check, twice over in StrictMode) and
 * `subscribe` used to build their own, so a single `MediaQueryList` shared by
 * both removes that allocation from the render path entirely.
 *
 * `undefined` = not yet probed, `null` = no `matchMedia` here (SSR / native).
 */
let mql: MediaQueryList | null | undefined;

function getMql(): MediaQueryList | null {
  if (mql === undefined) {
    mql =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia(darkSchemeQuery)
        : null;
  }
  return mql;
}

function getSnapshot(): ColorScheme {
  return getMql()?.matches ? "dark" : "light";
}

function subscribe(onStoreChange: () => void): () => void {
  const mediaQuery = getMql();
  if (!mediaQuery) return () => {};

  mediaQuery.addEventListener("change", onStoreChange);
  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

export function useSystemColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, getSnapshot, () => "light");
}
