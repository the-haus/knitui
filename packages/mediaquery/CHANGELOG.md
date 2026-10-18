# @knitui/mediaquery

## 1.1.0

### Minor Changes

- 475f89d: Knit UI now targets Expo SDK 58: React Native 0.88, React 19.3, Reanimated 4.7, Worklets 0.13, React Native Gesture Handler 3.3 and Skia 2.14. Apps must be on SDK 58. Apps still on SDK 57 should pin `@knitui/*` to `~1.0.0` until they upgrade Expo. See the "Upgrading to Knit UI 1.1" guide.

  **Peer and dependency changes**

  - `@knitui/icons` and `@knitui/emoji` peer on `react@19.3.0` and `react-native-svg@15.16.0`.
  - `@knitui/graphics` peers on `@shopify/react-native-skia@2.14.0`.
  - `@knitui/components` depends on `expo-image ~58.0.15`.
  - `@knitui/media` depends on `expo-audio ~58.0.9` and `expo-video ~58.0.11`. The Android playback-sampling and iOS duration patches were ported to expo-audio 58.0.9.

  **React Native 0.88 fix in `@knitui/media`**

  `Audio`, `Video`, `AudioPlaylist` and `AudioRecorder` crashed on native with "undefined is not a function". They detected their web DOM element by checking for an `addEventListener` key, and React Native 0.88 elements now carry that key (set to `undefined`). They now check the platform instead.

  **Skia 2.14 fix in `@knitui/graphics`**

  `AudioMesh` crashed native apps with "Incorrect uniform size for: u_points. Expected 12 got 4". React Native Skia 2.14's native recorder reads only the first 4 values of a typed-array uniform. The mesh now passes its uniforms as plain arrays, still reused across frames.

  **Web fixes**

  - `@knitui/media` no longer crashes web apps without the `expo` entry (such as Next) with "Cannot read properties of undefined (reading 'SharedObject')". expo-audio 58's web player, recorder and playlist need `globalThis.expo` when they load, as expo-video's already did. The kit now installs it before both. On SDK 58, `expo-modules-core` resolves to a build entry that its `sideEffects` list leaves out, so production bundlers dropped the old bare import.
  - `@knitui/plugins/next-plugin` also maps `@react-native/assets-registry/registry` to react-native-web's asset registry. Its 0.88 source mixes ESM and CommonJS, which broke `react-native-svg` on web with "ES Modules may not assign module.exports".

  **Known iOS issue on SDK 58:** React Native 0.88 builds React from a precompiled framework, and both `react-native-teleport@1.2.2` (used by Portal) and `@maplibre/maplibre-react-native@11.5.0` fail to compile because of it. They import `"RCTFabricComponentsPlugins.h"` instead of `<React/RCTFabricComponentsPlugins.h>`. Until upstream fixes land, apply the same one-line include change with a pnpm or patch-package patch, or set `ios.buildReactNativeFromSource` to `true`.

  The precompiled framework also leaves out React Native's `SampleTurboModule`, which `react-native@0.88.0` still lists as a module to set up on the main queue at startup. Debug builds then show an "Unable to find module for SampleTurboModule" red box on every launch (release builds only log it). Remove the `SampleTurboModule` entry from `codegenConfig.libraries[0].ios.modules` in `react-native/package.json` with a patch and re-run `pod install`, or build React Native from source.

  **Gesture Handler 3**

  Every kit gesture now uses the Gesture Handler 3 hook API (`usePanGesture`, `useNativeGesture`) instead of the deprecated `Gesture.*` builder. This covers Modal and Drawer drag-to-dismiss, the ScrollArea 2D pan, Sheet drag, Carousel drag and SwipeCard.

  Reanimated 4.7 ignores hook dependency arrays on native and logs a warning when one is passed. The kit now passes them on the web only, so apps no longer see "Dependencies should only be used on the web" from kit components.

  Breaking change in `@knitui/carousel`: `gestureConfig` is now a config object (the new `CarouselGestureConfig` type) instead of a builder callback. Migrate like this:

  ```tsx
  // before
  <Carousel gestureConfig={(g) => g.activeOffsetX([-10, 10]).simultaneousWithExternalGesture(other)} />
  // after
  <Carousel gestureConfig={{ activeOffsetX: [-10, 10], simultaneousWith: other }} />
  ```

  **React Native 0.88 types**

  The kit's native ref types now use RN's instance types (`ScrollViewInstance`, `ViewInstance`). `EffectView`'s `ref` and `KeyboardAwareScrollView`'s forwarded ref are typed with these instance types. The `Input` `verticalAlign` prop still works: React Native 0.88 dropped it, so the kit now maps it onto `textAlignVertical`.

### Patch Changes

- Updated dependencies [475f89d]
- Updated dependencies [475f89d]
  - @knitui/core@1.1.0
  - @knitui/hooks@1.1.0

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

### Patch Changes

- Updated dependencies [af39617]
  - @knitui/core@1.0.0
  - @knitui/hooks@1.0.0

## 0.14.0

### Patch Changes

- @knitui/core@0.14.0
- @knitui/hooks@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [633e669]
  - @knitui/core@0.13.0
  - @knitui/hooks@0.13.0

## 0.12.2

### Patch Changes

- @knitui/core@0.12.2
- @knitui/hooks@0.12.2

## 0.12.1

### Patch Changes

- @knitui/core@0.12.1
- @knitui/hooks@0.12.1

## 0.12.0

### Patch Changes

- @knitui/core@0.12.0
- @knitui/hooks@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [c843078]
  - @knitui/core@0.11.0
  - @knitui/hooks@0.11.0

## 0.10.0

### Patch Changes

- @knitui/core@0.10.0
- @knitui/hooks@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [bf9eeb1]
  - @knitui/core@0.9.0
  - @knitui/hooks@0.9.0

## 0.8.1

### Patch Changes

- @knitui/core@0.8.1
- @knitui/hooks@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [8de27f7]
- Updated dependencies [85594a1]
  - @knitui/core@0.8.0
  - @knitui/hooks@0.8.0

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

- Updated dependencies [59d065b]
  - @knitui/core@0.7.0
  - @knitui/hooks@0.7.0

## 0.6.1

### Patch Changes

- Updated dependencies [ffc254e]
- Updated dependencies [ffb4133]
- Updated dependencies [caa2d7e]
  - @knitui/core@0.6.1
  - @knitui/hooks@0.6.1

## 0.6.0

### Patch Changes

- 5f44d20: Cut the shipped theme suite from 440 themes to 22, and stop the mediaquery hooks re-parsing / re-rendering per frame

  ## `@knitui/core` — 418 generated themes removed

  `config/themes.ts` called `createThemes(...)` without a `componentThemes`
  argument, so it inherited Tamagui's `defaultComponentThemes` — a 19-entry map
  that is itself `@deprecated` upstream ("component themes are no longer
  recommended"). Those entries cross-multiply with every scheme × palette, so the
  kit shipped **2 × 11 × 20 = 440 themes**, all built eagerly at module scope on
  every app start and again by the Tamagui babel/static compiler.

  Measured against the kit's real inputs (interpreter-only, `node --jitless`):

  |        | themes | theme keys | resolved `Variable`s  | heap     | build   |
  | ------ | ------ | ---------- | --------------------- | -------- | ------- |
  | before | 440    | 37,708     | 37,708 (2,822 unique) | 2,513 KB | 12.1 ms |
  | after  | 22     | 1,870      | 1,870 (1,010 unique)  | 208 KB   | 2.8 ms  |

  `componentThemes: false` is set both in the stock `config/themes.ts` and in
  `createTheme()`, so a consumer-built config has the same theme set as the shipped
  one (24 names there — the stock 22 plus the `brand` alias in both schemes).

  ### BREAKING for anyone naming a component theme

  Themes named `<scheme>[_<palette>]_<Component>` no longer exist. If you
  reference one by name — `<Theme name="light_Button">`, a `themes` override keyed
  `dark_gray_Card`, or a `createTheme({ themeBuilder: { componentThemes: … } })`
  extension — it will no longer resolve and the nearest parent theme is used
  instead. The removed names are the 20 Tamagui defaults (`Button`, `Card`,
  `Checkbox`, `Input`, `ListItem`, `Progress`, `ProgressIndicator`,
  `RadioGroupItem`, `SelectItem`, `SelectTrigger`, `SliderThumb`, `SliderTrack`,
  `SliderTrackActive`, `Switch`, `SwitchThumb`, `TextArea`, `Tooltip`,
  `TooltipArrow`, `TooltipContent`) × 22 scheme/palette combinations.

  To get them back, pass your own map:

  ```ts
  createTheme({ themeBuilder: { componentThemes: { Card: { template: "surface1" } } } });
  ```

  ### `@knitui/components` — offsets that were implicit are now explicit

  Nine of the kit's `styled()` names collided with that default map and were
  silently receiving a template offset. Every one of them has been PINNED so the
  rendered colour is unchanged — verified value-by-value across `light`, `dark`,
  `light_blue` and `dark_red` (100 probes, 0 differences):

  | component     | template | change                                                                                                                                                     |
  | ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `ListItem`    | surface1 | none — the frame paints nothing, and `surface*` leaves `$color1…$color12` and `$color` alone                                                               |
  | `Progress`    | surface1 | none — already explicit `$colorN`                                                                                                                          |
  | `Button`      | surface3 | `variant="default"` border pinned `$borderColor` → `$color7` (the only variant reading `$borderColor`)                                                     |
  | `Card`        | surface1 | frame + `Card.Section` border pinned to `$color2` / `$color5`                                                                                              |
  | `Checkbox`    | surface2 | unchecked box pinned to `$color3` / `$color6`                                                                                                              |
  | `SliderTrack` | inverse  | ramp steps written pre-mirrored (`$color3`→`$color10`; child `SliderBar` `$color9`→`$color4`)                                                              |
  | `SliderThumb` | inverse  | pre-mirrored (`$color1`→`$color12`, `$color9`→`$color4`, hover `$color10`→`$color3`; child `SliderLabelBubble` too)                                        |
  | `SwitchThumb` | inverse  | child `SwitchThumbIndicator` pre-mirrored (`$color5`→`$color8`, on `$color9`→`$color4`). The thumb itself uses `$white`, a token, so it was never inverted |
  | `Tooltip`     | inverse  | frame `$color9`→`$color4`, `Tooltip.Text` `$color1`→`$color12`                                                                                             |

  Two things worth flagging to whoever owns the visual design:

  1. The four `inverse` collisions were **reversing the entire `$color1…$color12`
     ramp** under those subtrees, not offsetting one step. So `Tooltip` was authored
     `$color9` fill + `$color1` label (the kit's canonical filled pairing) and
     actually painted step 4 + step 12; the slider's track/bar/thumb were likewise
     inverted. The pins preserve the shipped pixels, but they codify an appearance
     that came from a deprecated Tamagui default rather than a design decision.
     Un-mirroring them (back to `$color9`/`$color1` etc.) is a deliberate follow-up.
  2. **Descendants** of those nine frames no longer inherit the offset theme. A
     component placed inside a `Card` used to resolve `$background` one ramp step up
     (`$color2`); it now gets the page value (`$color1`). Only the nine frames' own
     painted surfaces are pinned — arbitrary user content inside them shifts by one
     step (or un-inverts, inside the Slider/Tooltip parts).

  `config/OVER_MEDIA` also moved to its own module (`config/over-media.ts`) so
  importing those five scrim literals no longer drags in the whole theme
  generation. No export surface change.

  ## `@knitui/mediaquery` — no per-render parsing, 3N listeners → 3
  - **`matchesQuery` no longer re-parses on every call.** The native `useMediaQuery`
    evaluated its query on the render path, and a string query re-ran the full
    parser each time: for `"(min-width: 768px) and (orientation: landscape)"` that
    is ~6 regex executions plus ~10 allocations, per render, per hook instance — so
    a 50-row list did ~300 regex ops per render pass to produce 50 identical
    booleans. Parses are now memoised in a bounded module-level cache
    (`parseMediaQuery` hands out copies, so a caller can't poison it).
  - **One shared environment store on native.** Each call site used to register
    THREE native subscriptions (`Dimensions`, `Appearance`,
    `AccessibilityInfo.reduceMotionChanged`) plus an `isReduceMotionEnabled()`
    promise — 20 call sites meant 60 live listeners. Worse, every handler did
    `setEnv(prev => ({ ...prev, … }))`, always a NEW object, so one rotation
    re-rendered every instance even though the boolean each derives almost never
    flips. There is now one store with three listeners total, read through
    `useSyncExternalStore` whose snapshot is the resolved **boolean**, so React
    bails per component unless that component's answer actually changed.
  - **`useBreakpoint` renders on band crossings, not resize pixels.** It was backed
    by `useViewportSize`, whose untreated `resize` listener allocates a fresh
    `{ width, height }` ~60×/s during a window drag, forcing a re-render at every
    call site before the band was even derived — though `resolveBreakpoint` yields
    only 8 values across 7 thresholds. `mediaquery` now owns a viewport store that
    wakes subscribers only when the band changes, and the hook's snapshot is the
    `BreakpointKey` string. (`@knitui/hooks`' `useViewportSize` is untouched — it
    has other consumers that want the pixel width.)
  - **`useSystemColorScheme`** builds its `MediaQueryList` once at module scope
    instead of constructing a live, document-registered query object inside
    `getSnapshot` (which React calls per render and per store-change check, twice
    over in StrictMode) and again in `subscribe`.

  No public API change in `@knitui/mediaquery`; `useBreakpoint` keeps its SSR
  contract (the server snapshot and first hydrating render both resolve the
  `MediaQueryProvider` seed).

- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5c6d758]
  - @knitui/core@0.6.0
  - @knitui/hooks@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [4f7830c]
  - @knitui/core@0.5.0
  - @knitui/hooks@0.5.0

## 0.4.0

### Patch Changes

- @knitui/core@0.4.0
- @knitui/hooks@0.4.0

## 0.3.0

### Patch Changes

- @knitui/core@0.3.0
- @knitui/hooks@0.3.0

## 0.2.0

### Minor Changes

- c346356: Add `@knitui/mediaquery`: cross-platform, SSR-safe media queries and responsive
  breakpoints for web (Next.js) and React Native (Expo). Ships `useMediaQuery`
  (matchMedia string or structured descriptor), `useBreakpoint` /
  `useBreakpointValue` over the shared `@knitui/core` breakpoint scale, an optional
  `MediaQueryProvider` with `User-Agent` device seeding for SSR, and a pure query
  engine (`parseMediaQuery` / `matchesQuery` / `queryToString`). `@knitui/core` now
  re-exports its `breakpoints` scale.

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0
  - @knitui/hooks@0.2.0
