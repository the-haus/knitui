import { useEffect, useState } from "react";
import { AccessibilityInfo, Appearance, Dimensions } from "react-native";

import type { ColorScheme, MediaEnvironment, MediaQueryInput } from "./query.shared";
import { matchesQuery, parseMediaQuery } from "./query.shared";
import type { UseMediaQueryOptions } from "./use-media-query.shared";

/** Query strings we've already warned about (so the dev warning fires once each). */
const warnedQueries = new Set<string>();

function toColorScheme(value: string | null | undefined): ColorScheme {
  return value === "dark" ? "dark" : "light";
}

/**
 * A live {@link MediaEnvironment} snapshot from React Native's `Dimensions`
 * (size / orientation), `Appearance` (color scheme) and `AccessibilityInfo`
 * (reduced motion). Native has real dimensions synchronously at first render,
 * so there is no SSR fallback to worry about here.
 */
function useMediaEnvironment(): MediaEnvironment {
  const [env, setEnv] = useState<MediaEnvironment>(() => {
    const { width, height } = Dimensions.get("window");
    return {
      width,
      height,
      colorScheme: toColorScheme(Appearance.getColorScheme()),
      reducedMotion: false,
    };
  });

  useEffect(() => {
    let mounted = true;

    const dimensions = Dimensions.addEventListener("change", ({ window }) => {
      setEnv((prev) => ({ ...prev, width: window.width, height: window.height }));
    });
    const appearance = Appearance.addChangeListener(({ colorScheme }) => {
      setEnv((prev) => ({ ...prev, colorScheme: toColorScheme(colorScheme) }));
    });
    const reduceMotion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (reducedMotion) => {
        setEnv((prev) => ({ ...prev, reducedMotion }));
      },
    );
    AccessibilityInfo.isReduceMotionEnabled().then((reducedMotion) => {
      if (mounted) setEnv((prev) => ({ ...prev, reducedMotion }));
    });

    return () => {
      mounted = false;
      dimensions.remove();
      appearance.remove();
      reduceMotion.remove();
    };
  }, []);

  return env;
}

/**
 * Subscribe to a media query (React Native) — native counterpart of
 * `use-media-query`. Evaluates the query against a live environment snapshot.
 * `initialValue` / `options` are accepted for signature parity with the web hook
 * but are unused on native, which always has a real viewport.
 */
export function useMediaQuery(
  query: MediaQueryInput,
  _initialValue?: boolean,
  _options: UseMediaQueryOptions = {},
): boolean {
  const env = useMediaEnvironment();

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

  return matchesQuery(query, env);
}
