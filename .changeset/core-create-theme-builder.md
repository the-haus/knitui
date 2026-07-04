---
"@knitui/core": minor
---

Add the theme builder to `@knitui/core`, so consumers can brand and extend the
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
