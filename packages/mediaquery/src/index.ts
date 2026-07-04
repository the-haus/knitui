// Breakpoint scale + pure resolvers (shared with @knitui/core).
export {
  BREAKPOINT_ORDER,
  type BreakpointKey,
  type BreakpointName,
  breakpoints,
  resolveBreakpoint,
  resolveResponsiveValue,
  type ResponsiveValue,
} from "./breakpoints";

// SSR seeding (Next.js): provider + server-side device detection.
export {
  MediaQueryProvider,
  type MediaQueryProviderProps,
  type MediaSeed,
  seedToEnvironment,
  useMediaQueryContext,
} from "./context";
// Query engine (pure, cross-platform, SSR-safe).
export {
  type ColorScheme,
  matchesQuery,
  type MediaEnvironment,
  type MediaQueryInput,
  type MediaQueryObject,
  type Orientation,
  type ParsedMediaQuery,
  parseMediaQuery,
  queryToString,
} from "./query.shared";
export {
  detectDeviceClass,
  DEVICE_SEEDS,
  type DeviceClass,
  deviceSeedFromDeviceClass,
  deviceSeedFromUserAgent,
} from "./ssr";
export { useBreakpoint } from "./use-breakpoint";

export { useBreakpointValue } from "./use-breakpoint-value";

// Hooks — platform-resolved (`.native` on RN, base file on web).
export { useMediaQuery } from "./use-media-query";
export type { UseMediaQueryOptions } from "./use-media-query.shared";
