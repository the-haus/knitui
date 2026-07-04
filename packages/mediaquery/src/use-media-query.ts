import { useEffect, useState } from "react";

import { seedToEnvironment, useMediaQueryContext } from "./context";
import type { MediaQueryInput } from "./query.shared";
import { matchesQuery, queryToString } from "./query.shared";
import type { UseMediaQueryOptions } from "./use-media-query.shared";

/**
 * Subscribe to a media query (web) — the cross-platform twin lives in
 * `use-media-query.native`. Accepts a matchMedia string (full CSS fidelity) or a
 * structured {@link MediaQueryInput} descriptor, which is serialised to a string.
 *
 * SSR-safe: on the server and the first client render it returns `initialValue`
 * (or the {@link MediaQueryProvider} seed), then reads the real `matchMedia`
 * value in an effect. This avoids hydration mismatches in Next.js. Set
 * `getInitialValueInEffect: false` only in pure client-side apps.
 */
export function useMediaQuery(
  query: MediaQueryInput,
  initialValue?: boolean,
  options: UseMediaQueryOptions = {},
): boolean {
  const context = useMediaQueryContext();
  const queryString = typeof query === "string" ? query : queryToString(query);
  const getInitialValueInEffect =
    options.getInitialValueInEffect ?? context.getInitialValueInEffect;

  const getSeedValue = (): boolean => {
    if (initialValue !== undefined) return initialValue;
    if (context.seed) return matchesQuery(query, seedToEnvironment(context.seed));
    return false;
  };

  const [matches, setMatches] = useState<boolean>(() =>
    getInitialValueInEffect ? getSeedValue() : readMatch(queryString, getSeedValue()),
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    const mql = window.matchMedia(queryString);
    const update = () => setMatches(mql.matches);
    update();

    // `addEventListener` is the modern API; `addListener` is the Safari <14 fallback.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    }
    mql.addListener(update);
    return () => mql.removeListener(update);
  }, [queryString]);

  return matches;
}

function readMatch(queryString: string, fallback: boolean): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return fallback;
  return window.matchMedia(queryString).matches;
}
