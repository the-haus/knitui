// The kit's Tamagui component packages — what every compiler entry point
// (metro / vite / next / webpack, and the repo's `tamagui.build.ts`) is told to
// evaluate up front. v3's loader defaults to the `tamagui` package, so this list
// must be explicit.
//
// The compiler also discovers other packages a JSX element or `styled()` base
// imports from as it compiles, so this is a warm-up list, not a whitelist.

/** Packages the compiler scans for kit components to optimize. */
const DEFAULT_COMPONENTS = [
  "@knitui/core",
  "@knitui/components",
  "@knitui/dates",
  "@knitui/media",
  "@knitui/sheet",
  "@knitui/carousel",
];

/** The kit's design-system config module, as the compiler should load it. */
const KNIT_CONFIG = "@knitui/core/config";

/**
 * Modules the compiler must NOT evaluate while it loads the kit in Node (both
 * platforms). Each one touches a TurboModule or a React Native internal at
 * import time, which neither Node nor `@tamagui/react-native-web-lite` (the
 * compiler's `react-native` stand-in) provides:
 *
 *  - react-native-gesture-handler: `TurboModuleRegistry.getEnforcing` on native,
 *    `Animated.createAnimatedComponent` on web (core's Provider.native, Sheet,
 *    Carousel, drag-dismiss);
 *  - expo / expo-modules-core / expo-image: expo's winter runtime and
 *    `react-native/Libraries/...` subpaths (components' Image);
 *  - expo-audio / expo-video: native views and modules (media).
 *
 * None of their exports create Tamagui config or `styled()` components, so the
 * compiler stubs them as `{}` during static evaluation only; the app bundle is
 * unaffected. Upstream already stubs react-native-safe-area-context and
 * react-native-worklets the same way.
 */
const STATIC_EVALUATION_IGNORED_MODULES = [
  "react-native-gesture-handler",
  "expo",
  "expo-modules-core",
  "expo-image",
  "expo-audio",
  "expo-video",
];

/**
 * The kit's ignore list plus whatever an app adds (merged, never replaced, so
 * an override cannot silently drop a module the kit needs stubbed).
 *
 * @param {{ dangerouslyIgnoreStaticEvaluationModules?: string[] }} [overrides]
 * @returns {string[]}
 */
function ignoredStaticEvaluationModules(overrides = {}) {
  return [
    ...new Set([
      ...STATIC_EVALUATION_IGNORED_MODULES,
      ...(overrides.dangerouslyIgnoreStaticEvaluationModules ?? []),
    ]),
  ];
}

module.exports = {
  DEFAULT_COMPONENTS,
  KNIT_CONFIG,
  STATIC_EVALUATION_IGNORED_MODULES,
  ignoredStaticEvaluationModules,
};
