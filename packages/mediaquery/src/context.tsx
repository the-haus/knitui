/**
 * Optional SSR seeding context. Cross-platform (plain React, no platform split).
 *
 * Media queries are inherently viewport-based, and a server has no viewport, so
 * width/height/color-scheme cannot be *measured* during SSR — the hooks resolve
 * to their fallback and then correct after mount. To avoid a first-paint flash
 * (e.g. rendering the desktop layout before the client discovers it is a phone),
 * wrap the app in a `MediaQueryProvider` seeded with a best-effort guess derived
 * on the server — typically from the request `User-Agent` (see `./ssr`) or a
 * `Sec-CH-UA-*` client hint. Every hook reads the seed as its initial value, so
 * the server render and the first client render agree (no hydration mismatch).
 */
import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import type { ColorScheme, MediaEnvironment } from "./query.shared";

/** A best-effort environment guess supplied by the server (all fields optional). */
export interface MediaSeed {
  width?: number;
  height?: number;
  colorScheme?: ColorScheme;
  reducedMotion?: boolean;
}

export interface MediaQueryContextValue {
  seed: MediaSeed | null;
  /**
   * When `true` (default) hooks return the SSR-safe seed value on the first
   * render and read the real value in an effect — the only hydration-safe mode.
   * Set `false` only in pure client-side apps to read the true value immediately.
   */
  getInitialValueInEffect: boolean;
}

const DEFAULT_CONTEXT: MediaQueryContextValue = { seed: null, getInitialValueInEffect: true };

const MediaQueryContext = createContext<MediaQueryContextValue>(DEFAULT_CONTEXT);

export interface MediaQueryProviderProps {
  /** Server-derived environment guess (e.g. from `deviceSeedFromUserAgent`). */
  seed?: MediaSeed;
  getInitialValueInEffect?: boolean;
  children?: ReactNode;
}

export function MediaQueryProvider({
  seed,
  getInitialValueInEffect = true,
  children,
}: MediaQueryProviderProps): ReactNode {
  const value = useMemo<MediaQueryContextValue>(
    () => ({ seed: seed ?? null, getInitialValueInEffect }),
    [seed, getInitialValueInEffect],
  );
  return <MediaQueryContext.Provider value={value}>{children}</MediaQueryContext.Provider>;
}

/** Read the ambient SSR seed / config (defaults when no provider is mounted). */
export function useMediaQueryContext(): MediaQueryContextValue {
  return useContext(MediaQueryContext);
}

/** Fill a partial {@link MediaSeed} into a complete {@link MediaEnvironment}. */
export function seedToEnvironment(seed: MediaSeed): MediaEnvironment {
  return {
    width: seed.width ?? 0,
    height: seed.height ?? 0,
    colorScheme: seed.colorScheme ?? "light",
    reducedMotion: seed.reducedMotion ?? false,
  };
}
