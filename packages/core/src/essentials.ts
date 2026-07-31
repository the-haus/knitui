export { AnimatePresence } from "@tamagui/animate-presence";

/**
 * The wrapped Tamagui essentials.
 *
 * Everything the design system needs from the Tamagui styling engine is
 * re-exported here under the `@knitui/core` namespace — `styled`, the `View`
 * primitive, theme hooks, token helpers, the styled-context/compound helpers,
 * media + animation presence, and the core types. Components and apps import
 * these from `@knitui/core`; they never depend on `@tamagui/*` directly.
 *
 * (`Box` and `Text` — the styled primitives — live in `./elements`.)
 */
export {
  // token → CSS custom property name (`"color5"` → `"var(--color5)"`), applying
  // Tamagui's own name hashing + `TAMAGUI_CSS_VARIABLE_PREFIX`. Lets web-only
  // code resolve a `$token` colour WITHOUT subscribing to the theme via
  // `useTheme()` (see `components/internal/theme-color-web.ts`).
  createCSSVariable,
  // composition helpers
  createStyledContext,
  // config access
  getConfig,
  getToken,
  // tokens
  getTokens,
  getTokenValue,
  getVariable,
  getVariableValue,
  // platform branch (true on web / react-native-web, false on native)
  isWeb,
  // the write half of `getConfig` — makes a config THE active one process-wide.
  // `<Provider>` already does this for the config it is handed (see
  // `provider/Provider.shared.tsx`), so an app should rarely reach for it; it is
  // exported because an app that wants to assert the invariant itself, or repair
  // it after some third party's stray `createTamagui`, previously had no way to
  // do so without importing `@tamagui/*` directly.
  setConfig,
  // raw Tamagui text primitive (the kit's styled `Text` lives in components;
  // the vendored Input reads `Text.staticConfig.validStyles`)
  Text,
  // theming
  Theme,
  // responsive
  useMedia,
  useProps,
  // style resolution — flatten Tamagui tokens/variants to plain RN styles
  // without rendering a styled host (used by the native Input to keep the
  // underlying RN TextInput state-safe; see Input/Input.native.tsx)
  usePropsAndStyle,
  useStyle,
  useTheme,
  useThemeName,
  variableToString,
  View,
  withStaticProperties,
} from "@tamagui/core";
export type {
  ColorTokens,
  FontSizeTokens,
  GetProps,
  GetRef,
  RadiusTokens,
  SizeTokens,
  SizeVariantSpreadFunction,
  SpaceTokens,
  TamaguiElement,
  TamaguiElementMethods,
  TextStyle,
  ThemeKeys,
  ThemeName,
  Variable,
  VariantSpreadFunction,
  ViewProps,
} from "@tamagui/core";

export { useNativeInputRef, useWebRef } from "@tamagui/element";

// Input/Image building blocks, re-exported so components never import
// `@tamagui/*` directly (the deps live here in `@knitui/core`).
export { registerFocusable } from "@tamagui/focusable";
