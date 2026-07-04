import type { ResponsiveValue } from "./breakpoints";
import { resolveResponsiveValue } from "./breakpoints";
import { useBreakpoint } from "./use-breakpoint";

/**
 * Pick a value from a mobile-first {@link ResponsiveValue} map for the active
 * breakpoint, falling back down to the nearest smaller band that defines one.
 *
 * ```ts
 * const columns = useBreakpointValue({ base: 1, sm: 2, lg: 4 });
 * ```
 */
export function useBreakpointValue<T>(value: ResponsiveValue<T>): T | undefined {
  const breakpoint = useBreakpoint();
  return resolveResponsiveValue(value, breakpoint);
}
