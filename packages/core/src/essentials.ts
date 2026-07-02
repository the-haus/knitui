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
  // factory + primitive
  styled,
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
