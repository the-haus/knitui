---
"@knitui/core": major
"@knitui/hooks": major
"@knitui/mediaquery": major
"@knitui/components": major
"@knitui/icons": major
"@knitui/emoji": major
"@knitui/graphics": major
"@knitui/dates": major
"@knitui/media": major
"@knitui/sheet": major
"@knitui/carousel": major
"@knitui/plugins": major
"@knitui/map": patch
---

Knit UI 1.0 now runs on Tamagui v3 (3.0.18). This is a breaking release: every style prop uses the v3 value syntax. Run the codemod first, then follow the upgrade guide at `/docs/guides/upgrading-to-v1`.

**Styling syntax**

- **Bare tokens.** `$` is gone: write `p="md"` and `bg="color3"`. A string is always a token; a number is a raw value.
- **Conditions live inside the value.** `hoverStyle`, `pressStyle`, `focusStyle`, `focusVisibleStyle`, `disabledStyle`, `enterStyle` and `exitStyle` are removed. Write `bg="color2 hover:color3 press:color4"` instead, or the object form `{ default, hover }`. Media props become media clauses: `p="sm gtSm:lg"`.
- **Transitions.** Use `transition="fast"` or the object form `{ preset, properties, enter, exit }`. `animateOnly` is removed; use `transition.properties`. Motion presets are now unified across web and native, so some timings change, most noticeably `bouncy`.
- **Line height.** A numeric `lineHeight` is now a ratio of the font size. Use `"24px"` for an absolute value.

**Component authoring**

- `X.styleable(fn)` is replaced by `styleable(X, fn)` from `@knitui/core`. It is memoized and supports chaining.
- Prefer plain `styled()` with variants, `styled.dynamic` or `.resolve`. The compiler can flatten these; a styleable HOC can never be flattened.
- Many layout and typography primitives (Flex, Container, Spacer, AspectRatio, Paragraph, Kbd, Mark, VisuallyHidden, …) are now plain styled components.
- Variant precedence follows the order props are passed. An explicit `undefined` passed to a style prop clears the base value.

**Core**

- **Themes.** `@tamagui/theme-builder` is replaced by `@tamagui/config-v5/builder`. Default themes are precomputed at build time.
- **Tokens.** The `true` and `transparent` tokens are removed.
- **New helpers:** `resolveToken`, `isToken`, `splitStyleProps`, `ThemeUpdate`, and `focusRingColor` plus focus-ring variables.
- **Removed:** `useProps` and `usePropsAndStyle`.

**Tooling (`@knitui/plugins`)**

- **Native compilation** now goes through the Metro plugin (`@tamagui/cli/metro`). The babel plugin entry is a deprecated no-op.
- **Vite** now uses `@tamagui/cli/vite`.
- The Next and webpack adapters are on v3.

**Fixes made along the way**

- Hover now works on web.
- No `name="…"` attributes leak into the DOM or FormData.
- Overlay styles that were being wiped are restored: Modal max-width, Popover and Tooltip radius.
- Image radius and size now resolve.
- Text fields now show an accent focus border.
- The `@knitui/media` `sideEffects` setting no longer drops the expo-video web global.
- ARIA is improved in Menu, Combobox, Tree, Tabs and Stepper.

**Map:** dependency bump only.
