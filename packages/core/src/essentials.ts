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
  // code resolve a token colour WITHOUT subscribing to the theme via
  // `useTheme()` (see `components/internal/theme-color-web.ts`).
  createCSSVariable,
  // composition helpers
  createStyledContext,
  // the v3 behaviour-HOC factory. INTERNAL: kit code wraps a frame with
  // `styleable()` from `@knitui/core` (memoized, chain-safe), never with this
  // directly — see `./styled.ts` and docs/v3/conventions.md §5.
  createStyledHOC,
  // config access
  getConfig,
  // one authored style prop, longhand or configured shorthand (`getExpandedShorthand("padding", props)`
  // reads `padding` or `p`). Does not resolve tokens or conditions.
  getExpandedShorthand,
  getToken,
  // tokens
  getTokens,
  getTokenValue,
  getVariable,
  getVariableValue,
  // platform branches. `isWeb` is true on web / react-native-web; `isIos` /
  // `isAndroid` are true only in the NATIVE iOS / Android runtimes (a browser on
  // an iPhone is `isWeb`, not `isIos`). All three are build-time constants, so a
  // bundler can drop the dead arm — prefer them over `Platform.OS`, which would
  // pull `react-native` into the consumer.
  isAndroid,
  isIos,
  isWeb,
  // the write half of `getConfig` — makes a config THE active one process-wide.
  // `<Provider>` already does this for the config it is handed (see
  // `provider/Provider.shared.tsx`), so an app should rarely reach for it; it is
  // exported because an app that wants to assert the invariant itself, or repair
  // it after some third party's stray `createTamagui`, previously had no way to
  // do so without importing `@tamagui/*` directly.
  setConfig,
  // v3 replacement for v2's `useProps` / `usePropsAndStyle`: partition authored
  // props into [style props, everything else] (optionally expanding shorthands
  // or filtering to a key subset) so a behaviour wrapper can route them. It does
  // NOT resolve tokens or pick an active condition clause — pass flat values on
  // to a styled component instead.
  splitStyleProps,
  // statically-shaped style fragments for `style`-typed props
  // (`contentContainerStyle={style({ p: 16 })}`), and the v3 `useStyle(piece)`
  // that resolves one to an inline RN style for compatibility props. (v2's
  // `useStyle(props)` is gone.)
  style,
  // raw Tamagui text primitive (the kit's styled `Text` lives in components;
  // the vendored Input reads `Text.staticConfig.validStyles`)
  Text,
  // theming
  Theme,
  // animated numbers (drive a value without re-rendering; reanimated on native,
  // the CSS driver's `/extras` on web)
  useAnimatedNumber,
  useAnimatedNumberReaction,
  useAnimatedNumbersStyle,
  useAnimatedNumberStyle,
  // responsive
  useMedia,
  useStyle,
  useTheme,
  useThemeName,
  variableToString,
  View,
  withStaticProperties,
} from "@tamagui/core";
export type {
  ColorTokens,
  FlatStyleValue,
  FontSizeTokens,
  GetProps,
  GetRef,
  OnTransition,
  RadiusTokens,
  SizeTokens,
  SpaceTokens,
  SplitStylePropsOptions,
  SplitStylePropsResult,
  StylePiece,
  TamaguiComponent,
  TamaguiElement,
  TamaguiElementMethods,
  TextStyle,
  ThemeKeys,
  ThemeName,
  TransitionEvent,
  TransitionKeys,
  TransitionProp,
  UniversalAnimatedNumber,
  Variable,
  ViewProps,
} from "@tamagui/core";

// `<ThemeUpdate keyName="value dark:value">` — override theme keys / config
// variables for a subtree. On web it restyles through CSS custom properties with
// no React re-render, which makes it the fast path for local overrides (error
// states, a re-coloured focus ring) that would otherwise mount `<Theme name>`.
export { ThemeUpdate, type ThemeUpdateProps } from "@tamagui/core/theme-update";

export { useNativeInputRef, useWebRef } from "@tamagui/element";

// Input/Image building blocks, re-exported so components never import
// `@tamagui/*` directly (the deps live here in `@knitui/core`).
export { registerFocusable } from "@tamagui/focusable";
