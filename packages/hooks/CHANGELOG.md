# @knitui/hooks

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

## 0.14.0

### Patch Changes

- @knitui/core@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [633e669]
  - @knitui/core@0.13.0

## 0.12.2

### Patch Changes

- @knitui/core@0.12.2

## 0.12.1

### Patch Changes

- @knitui/core@0.12.1

## 0.12.0

### Patch Changes

- @knitui/core@0.12.0

## 0.11.0

### Minor Changes

- c843078: Platform services, so apps never import `react-native` for them.

  - `@knitui/core`: `isIos` / `isAndroid` alongside `isWeb`; a structural `PressEvent` type (like `LayoutChangeEvent`).
  - `@knitui/hooks`: `getAppState()` / `subscribeAppState()` (the imperative half of `useAppState`, which now runs on them via `useSyncExternalStore`; web also reports `pagehide` as `background`), `getViewportSize()`, `openURL()` / `canOpenURL()` / `openAppSettings()`, `share()` (native `Share` / Web Share API, per-platform URL handling), and `announce()` (VoiceOver/TalkBack on native, a lazily mounted live region on web). Web `openURL` detaches the new tab by hand instead of `noopener`, which makes `window.open` return `null` even on success.
  - `@knitui/plugins/next`: `NextTamaguiProvider` takes `config` and `exclude`, for apps that build their config at runtime.

### Patch Changes

- Updated dependencies [c843078]
  - @knitui/core@0.11.0

## 0.10.0

### Patch Changes

- @knitui/core@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [bf9eeb1]
  - @knitui/core@0.9.0

## 0.8.1

### Patch Changes

- @knitui/core@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [8de27f7]
- Updated dependencies [85594a1]
  - @knitui/core@0.8.0

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

## 0.6.1

### Patch Changes

- ffb4133: Stop `useListState` corrupting the list on an out-of-range index.

  `reorder` destructured the spliced-out item, so a `from` beyond the end inserted a literal `undefined` into the list. `swap` wrote `undefined` over a real row when either index was out of range, and `setItemProp` spread a missing row into a bare `{ [prop]: value }` object masquerading as a `T`. All three now leave the list untouched when an index does not resolve.

- Updated dependencies [ffc254e]
- Updated dependencies [caa2d7e]
  - @knitui/core@0.6.1

## 0.6.0

### Patch Changes

- 5f44d20: Stop overlays, scrolling and looping animations from doing per-frame work

  A pass over every hot path that runs while something is moving — a scroll, a drag,
  an open/close animation — removing work that ran once per frame and did not need to.

  **Floating overlays (web)** — `autoUpdate`'s scroll/resize/element-resize triggers are
  now coalesced into one `requestAnimationFrame`. The capture-phase `scroll` listener
  fires for every scrollable ancestor in the app, and each trigger ran a full
  `getBoundingClientRect` → `computePosition` → `setState` cycle: layout reads
  interleaved with the previous pass's style writes, i.e. a forced synchronous reflow
  per event, several per frame. The first position is still computed synchronously, so
  nothing flashes at an un-positioned origin. The repositioning bail-out also stopped
  `JSON.stringify`-ing both middleware-data bags (twice per pass, per open overlay) in
  favour of a shallow compare.

  **`ScrollArea`** — the scrollbar auto-hide no longer crosses the JS/UI boundary every
  frame on native: `type="hover"`/`"scroll"` (the default) needs only a boolean plus a
  trailing timer, so its `runOnJS` hop is rate-limited on the UI thread, while a real
  consumer (`onScrollPositionChange`, `onScrollEnd`, the reach callbacks,
  `stickToBottom`, `shadows`) still gets every sample. The thumb's per-frame animated
  style carries a transform ONLY — the hover-grow inset moved into its own style — so a
  scroll no longer pushes layout props (`left`/`right`/`height`) through Yoga on every
  frame. Edge fades (`shadows`) keep four booleans in state instead of mirroring the raw
  offset, so a fling re-renders at most once per edge crossing rather than once per
  frame. The web `ResizeObserver` is created once and its observations reconciled per
  commit, instead of being torn down and rebuilt over every child whenever the child
  count changed — which, for a windowed list inside a `ScrollArea`, happened mid-fling
  on every window advance.

  **Looping animations** — `Skeleton`, `Loader`, `Progress` and `Indicator` declare their
  loops unconditionally for stable hook order but render only some of them; every
  undisplayed loop was still scheduled, as a live compositor animation on web and a
  `withRepeat` re-evaluating a worklet every frame on native. A `Loader` paid for four,
  a static `Indicator` and a non-`animate` `Skeleton` for one each. Loops are now
  scheduled only when they actually animate.

  **`useReducedMotion`** — one shared subscription per app instead of one `matchMedia` /
  `AccessibilityInfo` listener per component (nearly every animated part in the kit calls
  it), and the correct value on first render, removing a mount-time re-render per
  instance.

  **`useElementSize`** — bails when a re-measure reports the size it already had, so a
  `ResizeObserver`/`onLayout` re-fire from a visibility flip or a sibling's reflow no
  longer re-renders `Collapse`/`Spoiler`/`Marquee` content.

  **`Sheet`** — the close watcher's gate is evaluated on the UI thread, so a dragging or
  springing panel stops waking the JS thread on every frame with an offset the
  subscriber immediately discards.

  **`Sheet`'s pan gesture was rebuilt on every render.** `animationConfig` is a flat
  record that every call site writes inline, and it is a dependency of `useSheetDrag`'s
  `useMemo` — so a fresh identity rebuilt the `Gesture.Pan()` object each render, and
  RNGH responds by tearing down and re-attaching the native gesture handler. Mid-drag,
  that is a dropped gesture. It is now collapsed to a stable reference while its values
  are unchanged, via a new internal `useStableRecord` (with tests) — the sibling of
  carousel's `modeConfig` stabilisation and map's `useStableStyleValue`.
  `withAnimation`/`gestureConfig` are deliberately left alone: they are functions
  consumed inside worklets, where a JS-thread ref wrapper would break worklet semantics.

  No public API changes; `useLoopingAnimation` (internal) gained an `enabled` option.

- 5f44d20: Give `useUncontrolled` a referentially stable setter

  `handleUncontrolledChange` was a plain function declaration, so the setter had a
  new identity on every render — and the controlled branch handed back the caller's
  raw `onChange`, which callers almost always pass as an inline arrow. Either way,
  every consumer got a fresh setter every render.

  Around 48 files across `components`, `dates` and `sheet` call this hook and pass
  that setter straight into a child, a context value, or a `useMemo`/`useEffect`
  dependency list, so the churn cascaded. The clearest case was `Combobox`: a new
  `setOpen` made `use-combobox`'s `useMemo` store a new object, which made the
  `ComboboxContext` value a new object — and because context propagation walks
  _past_ `React.memo`, the deliberately memoized option row re-rendered anyway.
  Typing one character re-resolved every option frame in an open dropdown, with the
  cost scaling in the option count. `NumberInput`'s handler-assignment effect
  re-ran on every render for the same reason.

  Both branches now return one stable setter, with the latest `onChange` read
  through a ref (`useCallbackRef`) rather than closed over. That second half fixes
  a class of stale-closure bug as well: a consumer that memoized a handler with
  `[]` deps around the setter previously kept calling the `onChange` from its first
  render — `ColorPicker`'s `handleChange` did exactly that — and now always invokes
  the current one.

  Behaviour is otherwise unchanged: the controlled branch still never tracks its
  own state, `defaultValue` still wins over `finalValue`, and a missing `onChange`
  is still a no-op. Added a test suite covering the value semantics, the setter's
  identity across re-renders and state changes in both branches, and the
  always-latest-`onChange` guarantee.

- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5c6d758]
  - @knitui/core@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [4f7830c]
  - @knitui/core@0.5.0

## 0.4.0

### Patch Changes

- @knitui/core@0.4.0

## 0.3.0

### Patch Changes

- @knitui/core@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0

## 0.1.1

### Patch Changes

- @knitui/core@0.1.1
