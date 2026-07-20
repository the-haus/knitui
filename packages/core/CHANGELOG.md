# @knitui/core

## 0.5.0

### Patch Changes

- 4f7830c: Align published dependency ranges with Expo SDK 57

  The SDK pins exact versions for its native modules, and several of our
  published ranges had drifted from that set. Consumers on SDK 57 were
  resolving versions the SDK's prebuilt binaries don't expect, which fails at
  runtime rather than at build time.

  - `@knitui/components`: `expo-image` `~57.0.0` → `~57.0.1`
  - `@knitui/core`: `@tamagui/*` `^2.3.0` → `^2.4.6`
  - `@knitui/media`: `expo-audio` `~57.0.0` → `~57.0.2`, `expo-video` `~57.0.0` → `~57.0.1`
  - `@knitui/plugins`: `@tamagui/babel-plugin` `^2.3.0` → `^2.4.6`

  `@knitui/graphics` is a minor rather than a patch because its
  `@shopify/react-native-skia` peer is an exact pin and moves `2.6.6` → `2.6.2`,
  which is the version Expo SDK 57 expects. Consumers currently pinned to
  `2.6.6` will need to move to `2.6.2` to satisfy the peer.

## 0.4.0

## 0.3.0

## 0.2.0

### Minor Changes

- 737463e: Add the theme builder to `@knitui/core`, so consumers can brand and extend the
  kit's theme without editing source. New exports:
  - `createTheme(options)` — build a fully-configured Tamagui config from brand
    inputs. Every option is optional and layers onto the kit's stock defaults:
    `brand` / `neutral` / `accents` palettes (a hex seed with an auto-derived
    12-step ramp, a `@tamagui/colors` name, `{ light, dark }` seeds, or explicit
    ramps), `includeDefaultAccents` / `includeTamaguiColors`, `radius` / `space` /
    `size` / `fontSizes` scale presets or per-step overrides, `zIndex`, raw
    `colors`, `fonts`, `breakpoints` / `media`, `animations` / `shorthands` /
    `settings`, and `themeBuilder` / `themes` / `tamagui` escape hatches.
  - `extendTheme(...optionSets)` — deep-merge option sets left-to-right, then build.
  - `mergeThemeOptions(...optionSets)` — same merge, returns the options (no build).
  - `defineTheme(options)` — identity helper that preserves literal types.
  - `themePresets` — curated starting points (`minimal` / `vibrant` /
    `professional`).
  - Palette utilities: `resolvePalette`, `rampFromHex`, `isColorName`, `isHex`,
    `TAMAGUI_COLOR_NAMES`, the scale presets, and `validateThemeOptions`.

  Options are strictly validated (unknown option / scale step / preset, malformed
  hex, unknown color name, wrong-length ramp, reserved accent name, undefined
  `defaultFont`) with actionable "did you mean …?" messages.

  `<Provider>` now accepts an optional `config` prop (falls back to the built-in
  config) so builder output can be applied. The existing stock config is unchanged.

### Patch Changes

- c346356: Add `@knitui/mediaquery`: cross-platform, SSR-safe media queries and responsive
  breakpoints for web (Next.js) and React Native (Expo). Ships `useMediaQuery`
  (matchMedia string or structured descriptor), `useBreakpoint` /
  `useBreakpointValue` over the shared `@knitui/core` breakpoint scale, an optional
  `MediaQueryProvider` with `User-Agent` device seeding for SSR, and a pure query
  engine (`parseMediaQuery` / `matchesQuery` / `queryToString`). `@knitui/core` now
  re-exports its `breakpoints` scale.

## 0.1.1
