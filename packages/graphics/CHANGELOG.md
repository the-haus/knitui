# @knitui/graphics

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
- Updated dependencies [475f89d]
  - @knitui/core@1.1.0
  - @knitui/components@1.1.0

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
  - @knitui/components@1.0.0

## 0.14.0

### Patch Changes

- Updated dependencies [9955de3]
  - @knitui/components@0.14.0
  - @knitui/core@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [069938f]
- Updated dependencies [8626180]
- Updated dependencies [633e669]
- Updated dependencies [5991b24]
- Updated dependencies [326ce54]
- Updated dependencies [e282fbd]
- Updated dependencies [574ac98]
  - @knitui/components@0.13.0
  - @knitui/core@0.13.0

## 0.12.2

### Patch Changes

- Updated dependencies [10b4ce3]
- Updated dependencies [784af02]
- Updated dependencies [e6492e4]
  - @knitui/components@0.12.2
  - @knitui/core@0.12.2

## 0.12.1

### Patch Changes

- Updated dependencies [c372c5d]
  - @knitui/components@0.12.1
  - @knitui/core@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [8b4d429]
  - @knitui/components@0.12.0
  - @knitui/core@0.12.0

## 0.11.0

### Patch Changes

- Updated dependencies [c843078]
- Updated dependencies [c843078]
  - @knitui/core@0.11.0
  - @knitui/components@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [26d50da]
- Updated dependencies [26d50da]
  - @knitui/components@0.10.0
  - @knitui/core@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [bf9eeb1]
  - @knitui/core@0.9.0
  - @knitui/components@0.9.0

## 0.8.1

### Patch Changes

- Updated dependencies [c25c51f]
  - @knitui/components@0.8.1
  - @knitui/core@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [8de27f7]
- Updated dependencies [85594a1]
  - @knitui/core@0.8.0
  - @knitui/components@0.8.0

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

- Updated dependencies [edcec97]
- Updated dependencies [15a329c]
- Updated dependencies [59d065b]
  - @knitui/components@0.7.0
  - @knitui/core@0.7.0

## 0.6.1

### Patch Changes

- caa2d7e: Point every `types` entry at the built declarations (`lib/typescript/*.d.ts`) instead of at the shipped TypeScript source.

  These packages ship their source and resolve it at runtime (`source`, `react-native` and `default` all still point into `src`), but `types` pointed there too — so a consumer's `tsc` typechecked the kit's raw source as part of their own build. That is slow, and it surfaces errors that depend on the consumer's own compiler settings, since `skipLibCheck` does not apply to `.ts` source files. Resolving `types` to real `.d.ts` files makes declaration handling both faster and inert.

  `@knitui/icons` also adds `lib/typescript` to `files`; its declarations were previously built but never published, so the new `types` path would not have existed in the tarball.

  `@knitui/emoji` deliberately keeps `types` on its source: its per-emoji modules ship as pre-generated `.js`/`.d.ts` pairs inside `src`, which `tsc` does not re-emit, so its built barrel cannot resolve them.

- Updated dependencies [487dce4]
- Updated dependencies [ffc254e]
- Updated dependencies [caa2d7e]
  - @knitui/components@0.6.1
  - @knitui/core@0.6.1

## 0.6.0

### Patch Changes

- 5f44d20: Take the allocations out of the audio sampler and the Skia visualizer's paint

  The media store's design was already right — per-field channels, auto-tracked
  selectors, one FFT per painted frame — so this is a pass over the two paths that run
  at 60 Hz rather than at tick rate: the PCM sample bridge and the visualizer painter.

  **The sampler did full peak/RMS work per frame, before the silence gate, and even
  when nothing was listening.** The backend posts a ~2048-frame window per display
  frame for as long as sampling is on, and `setSamplingEnabled` is driven by mount
  effects that can outlive the visualizer that asked for it — so with no
  `sampleUpdate` listener at all, every frame still allocated a channel array (`.map`)
  plus a result object and walked every frame twice (`peakOf` then `rmsOf`, ≈245k
  typed-array reads/second on a stereo source), only for `emitSample` to then drop it
  at the silence gate. The handler now returns on `hasListeners("sampleUpdate")` as its
  first statement (the same gate `timeUpdate` already had), fuses peak and RMS into ONE
  pass over the frames (≈123k reads/second, byte-identical results — the per-channel
  clamps land exactly where `peakOf`/`rmsOf` applied them), and refills a reused channel
  list + envelope instead of allocating two objects per frame. `AudioSampleData` already
  documented its buffers as read-synchronously; that now explicitly covers the channel
  list too. `mixChannels` takes an optional result object for the same reason.

  **Time labels subscribed to a raw float although `formatTime` floors to seconds.**
  `useAudioState(s => s.currentTime)` fails `Object.is` on every tick, so the `<Text>`
  re-rendered at tick rate — 4 Hz on video, higher on native audio — and 3 of every 4
  renders produced a byte-identical string. The five timecode labels (`TimeCurrent` and
  `TimeDisplay` on `<Audio>`, `<Video>` and `<AudioPlaylist>`) now select
  `Math.floor(s.currentTime)`. The scrubbers keep the float — they need sub-second
  thumb positions.

  **`useMediaSelector` allocated a `Proxy` and a sorted key signature per notification
  AND per render.** Every store change per subscribed leaf built a fresh tracking
  `Proxy` in `runTracked`, a `[...keys].map(String).sort().join()` in `register()`, then
  a second `Proxy` + signature during the re-render and a third signature in the
  post-commit effect — ≈3 proxies and 3 sorted strings per leaf per tick. Snapshots are
  immutable, so the tracking proxy is now cached per snapshot identity in a `WeakMap`
  (one proxy serves every leaf that reads that snapshot, and it dies with it) and the
  tracked key set is compared by size + membership against the registered list, so the
  steady state allocates nothing. This is noise at the current 4 Hz tick and stops being
  noise the moment a caller drives position at frame rate.

  **The visualizer built 2 Skia host objects per bar, per frame.** `Skia.XYWHRect` +
  `Skia.RRectXY` each return a real host object — a JSI `HostObject` holding a C++
  `shared_ptr` on native, a `JsiSkRect` wrapping a fresh `Float32Array` on web — so
  `variant="mirror"` at the default `count=48` created and discarded 96 of them per
  painted frame, ≈5,800/second, on the UI thread. Both bindings also accept a plain
  object and copy out of it synchronously (`JsiSkRect::fromValue` / `JsiSkRRect::fromValue`,
  and their web twins), so the fill builder now reuses ONE mutable rect/rrect pair for
  the whole frame: 96 host objects per frame → 2 plain objects. The resulting `SkRRect`
  comes from the identical `SkRRect::MakeRectXY` call, and a zero radius takes `addRect`,
  which is what Skia's `addRRect` degenerates to for a radius-less rrect — the drawn
  path is unchanged, and a new suite records the exact op sequence (`addRRect`/`addRect`/
  `addCircle`/`moveTo`/`lineTo`/`close`) with the values each call received to keep it that
  way.

  **And it rebuilt the whole shape list as objects every frame to hand it to the
  builder in the next statement.** A `useDerivedValue` published `count` fresh
  `{kind,x,y,w,h,r}` objects plus a fresh array into a SharedValue per frame (≈2,900
  objects/second at the default `count`, plus another array whenever `gain`/`floor`/
  `reverse` was set), read once by the two path worklets and thrown away. Each variant
  now also exists as a writer into a flat `Float64Array` that the component owns and
  reuses forever, and geometry + path building are fused into the two path worklets, so
  the intermediate never exists: the steady-state paint allocates nothing but the
  `SkPath` itself. `strokeWidth` no longer builds a `count`-length zero array and runs
  the whole variant to read one number either. The cost is one extra variant pass per
  frame (pure arithmetic into a buffer) in exchange for a SharedValue write, a mapper,
  and every allocation on the path. `Float64Array` rather than `Float32Array` so the
  coordinates round-trip exactly.

  `VisualizerVariant`, `registerVisualizerVariant` and the six exported variants are
  UNCHANGED — the object-shaped variants are now thin decoders over their writers (one
  implementation of each variant's geometry, so the two forms cannot drift), and a
  foreign variant is adapted by a shim that encodes its returned shapes, paying exactly
  the allocation it paid before.

  **`<AudioMesh>` repainted a full-canvas fragment shader 60 times a second even with
  its drift frozen.** It drove its uniforms from Skia's `useClock()`, whose frame
  callback runs for as long as the component is mounted; every tick dirtied the uniforms
  mapper, so `prefers-reduced-motion` (which pins the drift at `t = 0`) and `speed={0}`
  (documented as "freezes the orbit") both kept rebuilding uniforms and repainting
  pixel-identical output forever. The clock is now local and stopped whenever the drift
  is frozen — no writes, so no mapper run, so no repaint — and a frozen mesh repaints
  only when the AUDIO moves it. Its uniforms also go into buffers the component owns
  (`buildMeshUniformsInto`): 3 arrays + a `[w, h]` tuple + the record per frame → just
  the record, which has to stay fresh or reanimated skips the SharedValue write and
  `<Shader>` never sees the frame. `buildMeshUniforms` keeps its exact allocating shape
  for other callers, over the same single implementation of the math.

  Also, in the same spirit:

  - `useVisualizerSource` built a `${count}|${fftScale}|…|${bins}` memo key on EVERY
    pushed FFT row (up to display rate) to prove nothing had changed; the mapper cache
    now lives in the reducer's closure, keyed by the settings, so only the pushed length
    is compared.
  - `TypedEmitter.emit` copied its listener `Set` into a fresh array on every emit —
    including per audio frame. The single-listener case (a visualizer on `sampleUpdate`,
    a scrubber on `timeUpdate`) now dispatches without the copy, with identical
    semantics: a listener it removes was already dispatched, and one it ADDS is still not
    delivered to in the same emit (which plain live iteration WOULD do — a `Set` grown
    during iteration yields the new entries; there is a test for exactly that).
  - The mic-stream reductions (`frameFromTimeDomain`, native `useAudioStream`) write the
    envelope straight into the frame/level object through a reused one-slot channel
    list: 3 allocations per captured buffer → 1 (the level object stays fresh — it is
    handed to `onLevel` and to React state).

  No public API changes in either package.

  Deferred: moving `useLevelTransition`'s smoother from the JS thread onto the UI thread,
  and/or publishing its eased row as a ping-ponged typed array (today: 60 boxed
  48-element arrays per second, each converted element-by-element into a reanimated
  serializable on native — a shared `ArrayBuffer` would skip both). The allocation counts
  are certain, but it touches the documented Reanimated-4 SharedValue rules, changes the
  public `SharedValue<number[]>` level type, and trades a fresh-array-per-frame guarantee
  for double buffering, so the win wants on-device measurement first.

- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5c6d758]
  - @knitui/components@0.6.0
  - @knitui/core@0.6.0

## 0.5.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [4f7830c]
  - @knitui/components@0.5.0
  - @knitui/core@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [5b5a3e0]
  - @knitui/components@0.4.0
  - @knitui/core@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [89f8c36]
  - @knitui/components@0.3.0
  - @knitui/core@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0
  - @knitui/components@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [407bef6]
  - @knitui/components@0.1.1
  - @knitui/core@0.1.1
