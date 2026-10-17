# @knitui/emoji

## 1.0.0

### Major Changes

- af39617: Knit UI 1.0 now runs on Tamagui v3 (3.0.18). This is a breaking release: every style prop uses the v3 value syntax. Run the codemod first, then follow the upgrade guide at `/docs/guides/upgrading-to-v1`.

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

## 0.14.0

## 0.13.0

## 0.12.2

## 0.12.1

## 0.12.0

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.1

## 0.8.0

## 0.7.0

### Patch Changes

- 59d065b: Dependency refresh, all within the current majors and validated against Expo SDK 57
  (`expo install --check` reports the workspace aligned):

  - `react-native` 0.86.0 → 0.86.2 (and `@react-native/metro-config` to match; both stay
    pinned as singletons in the root `pnpm.overrides`)
  - `react-native-reanimated` 4.5.0 → 4.5.1 and `react-native-worklets` 0.10.0 → 0.10.1 —
    the versions Expo SDK 57 expects
  - `expo` 57.0.7 → 57.0.9 and the SDK-managed modules along with it (`expo-router`,
    `expo-constants`, `expo-linking`, `expo-system-ui`, `expo-video`,
    `@expo/metro-runtime`, `expo-build-properties`)
  - `babel-preset-expo` 57.0.3 → 57.0.5, Storybook 10.5.3 → 10.5.5,
    `@vitejs/plugin-react` 6.0.3 → 6.0.4, `next` 16.2.10 → 16.2.12,
    `@react-navigation/*` patch bumps

  The vendored `expo-modules-core` patch was re-pointed from 57.0.6 to 57.0.8 and still
  applies cleanly. `expo-audio` deliberately stays on 57.0.2, where our native sampling
  patch is pinned. Peer requirements for consumers are unchanged.

## 0.6.1

## 0.6.0

### Patch Changes

- 5f44d20: Stop publishing the `lib/` build output that nothing can resolve

  Both packages listed `"lib"` in `files` and ran `bob build`, but **every**
  resolver key — `main`, `module`, `types`, `react-native`, `source` and every
  `exports` condition — points at `./src/...`. Nothing in either package, the
  workspace, or a consumer's resolution can reach `lib/`: these two src-ship, like
  the rest of the kit. The build output was shipped to npm as dead weight.

  Measured with `npm pack --dry-run`:

  | package         | before                 | after                 |
  | --------------- | ---------------------- | --------------------- |
  | `@knitui/icons` | 23.6 MB / 43,096 files | 3.6 MB / 6,159 files  |
  | `@knitui/emoji` | —                      | 26.9 MB / 7,614 files |

  `lib/` was 36,937 of the 43,096 icon entries — 85% of that tarball — and 180 MB
  on disk for `emoji`. Install size only; no bundle, API or resolution change,
  which is exactly why it was invisible.

  `bob build` still runs, so the artefact is still produced locally and in CI. If
  that turns out to have no consumer either, the build target itself can go — but
  that is a separate call from what gets published.

## 0.5.0

## 0.4.0

## 0.3.0

## 0.2.0

### Minor Changes

- d46fbad: Add `@knitui/emoji`: a cross-platform (React + React Native) emoji kit generated
  from Google Noto Emoji SVG data. Each emoji is parsed once at generate time into
  a render-ready node tree (no runtime XML parsing on native, DOM `<svg>` on web),
  with per-emoji id namespacing and `.js`+`.d.ts` output so the ~3.8k modules stay
  tree-shakeable and cheap to typecheck. Exposes named `Emoji*` components, per-emoji
  subpath imports, a dynamic name-based `Emoji`, and an `EmojiProvider` for ambient
  size.
