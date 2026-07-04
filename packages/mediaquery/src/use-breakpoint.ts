import { useViewportSize } from "@knitui/hooks";

import type { BreakpointKey } from "./breakpoints";
import { resolveBreakpoint } from "./breakpoints";
import { useMediaQueryContext } from "./context";

/**
 * The active breakpoint band for the current viewport width — cross-platform
 * (web reads `window`, native reads `Dimensions`, both via `useViewportSize`).
 * Bands are min-width based and share `@knitui/core`'s breakpoint scale, so this
 * stays in lockstep with the `$gtSm`-style Tamagui media props.
 *
 * SSR-safe: before mount `useViewportSize` reports width `0`, so the band falls
 * back to the {@link MediaQueryProvider} seed width (if any) and otherwise to
 * `"base"` — the same value the server rendered, avoiding a hydration mismatch.
 */
export function useBreakpoint(): BreakpointKey {
  const { width } = useViewportSize();
  const { seed } = useMediaQueryContext();
  const effectiveWidth = width || seed?.width || 0;
  return resolveBreakpoint(effectiveWidth);
}
