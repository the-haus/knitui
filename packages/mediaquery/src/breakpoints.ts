/**
 * Breakpoint resolution built on the single source of truth in `@knitui/core`
 * (`config/scales.ts`), so the imperative `useBreakpoint` / `useBreakpointValue`
 * hooks stay in lockstep with the Tamagui `$gtSm`-style media props.
 *
 * Bands are **min-width** based (mobile-first): the active breakpoint is the
 * largest token whose value is `<= width`. Widths below the smallest token
 * resolve to the `"base"` band.
 */
import { breakpoints } from "@knitui/core";

export { breakpoints };

/** Named breakpoint tokens, plus `"base"` for the sub-smallest band. */
export type BreakpointName = keyof typeof breakpoints;
export type BreakpointKey = "base" | BreakpointName;

/** Breakpoint tokens ordered ascending by min-width, `"base"` first. */
export const BREAKPOINT_ORDER: BreakpointKey[] = [
  "base",
  ...(Object.keys(breakpoints) as BreakpointName[]).sort((a, b) => breakpoints[a] - breakpoints[b]),
];

/** The active breakpoint band for a given viewport width (min-width bands). */
export function resolveBreakpoint(width: number): BreakpointKey {
  let active: BreakpointKey = "base";
  for (const name of Object.keys(breakpoints) as BreakpointName[]) {
    if (width >= breakpoints[name]) active = name;
  }
  return active;
}

/**
 * Responsive value map: keys are breakpoint bands, values are the value to use
 * at that band and up. `base` is the mobile-first default.
 */
export type ResponsiveValue<T> = Partial<Record<BreakpointKey, T>>;

/**
 * Resolve a {@link ResponsiveValue} for a breakpoint, falling back down the
 * band order (mobile-first): the value for the active band, or the nearest
 * smaller band that defines one.
 */
export function resolveResponsiveValue<T>(
  value: ResponsiveValue<T>,
  breakpoint: BreakpointKey,
): T | undefined {
  const index = BREAKPOINT_ORDER.indexOf(breakpoint);
  for (let i = index; i >= 0; i--) {
    const key = BREAKPOINT_ORDER[i];
    if (value[key] !== undefined) return value[key];
  }
  return undefined;
}
