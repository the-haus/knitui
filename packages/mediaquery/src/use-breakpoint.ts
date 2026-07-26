import { useCallback, useSyncExternalStore } from "react";

import type { BreakpointKey } from "./breakpoints";
import { resolveBreakpoint } from "./breakpoints";
import { useMediaQueryContext } from "./context";
import { getViewportWidth, subscribeViewportWidth } from "./viewport-store";

/**
 * The active breakpoint band for the current viewport width — cross-platform
 * (web reads `window`, native reads `Dimensions`, both via the shared
 * `viewport-store`). Bands are min-width based and share `@knitui/core`'s
 * breakpoint scale, so this stays in lockstep with the `$gtSm`-style Tamagui
 * media props.
 *
 * SSR-safe: the server snapshot resolves the {@link MediaQueryProvider} seed
 * width (and otherwise `"base"`), which is also what the first hydrating client
 * render returns — so the server and client agree, no hydration mismatch.
 *
 * PERF: `getSnapshot` returns the band STRING, not a size object, so React bails
 * out of the re-render unless the band actually changed. A window drag used to
 * force ~60 re-renders/second at every call site (`useViewportSize` allocates a
 * fresh `{ width, height }` per `resize` event and the band was derived only
 * AFTER that render was already committed); now only real band crossings render.
 */
export function useBreakpoint(): BreakpointKey {
  const { seed } = useMediaQueryContext();
  const seedWidth = seed?.width ?? 0;

  const getSnapshot = useCallback(
    (): BreakpointKey => resolveBreakpoint(getViewportWidth() || seedWidth),
    [seedWidth],
  );
  const getServerSnapshot = useCallback(
    (): BreakpointKey => resolveBreakpoint(seedWidth),
    [seedWidth],
  );

  return useSyncExternalStore(subscribeViewportWidth, getSnapshot, getServerSnapshot);
}
