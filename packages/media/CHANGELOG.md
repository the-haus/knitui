# @knitui/media

## 0.3.3

### Patch Changes

- caa2d7e: Point every `types` entry at the built declarations (`lib/typescript/*.d.ts`) instead of at the shipped TypeScript source.

  These packages ship their source and resolve it at runtime (`source`, `react-native` and `default` all still point into `src`), but `types` pointed there too — so a consumer's `tsc` typechecked the kit's raw source as part of their own build. That is slow, and it surfaces errors that depend on the consumer's own compiler settings, since `skipLibCheck` does not apply to `.ts` source files. Resolving `types` to real `.d.ts` files makes declaration handling both faster and inert.

  `@knitui/icons` also adds `lib/typescript` to `files`; its declarations were previously built but never published, so the new `types` path would not have existed in the tarball.

  `@knitui/emoji` deliberately keeps `types` on its source: its per-emoji modules ship as pre-generated `.js`/`.d.ts` pairs inside `src`, which `tsc` does not re-emit, so its built barrel cannot resolve them.

- Updated dependencies [487dce4]
- Updated dependencies [ffc254e]
- Updated dependencies [ffb4133]
- Updated dependencies [caa2d7e]
  - @knitui/components@0.6.1
  - @knitui/core@0.6.1
  - @knitui/hooks@0.6.1
  - @knitui/icons@0.6.1

## 0.3.2

### Patch Changes

- 5f44d20: Stop the icon barrel from being pulled into every component

  `@knitui/components` dragged all ~6.1k icon modules into any app that imported a
  single component. The kit SRC-SHIPS, so Metro compiles what it resolves and does
  NOT tree-shake: one line in `internal/ControlIconProvider.tsx` —
  `import { IconProvider } from "@knitui/icons"` — resolved the root barrel
  (`packages/icons/src/index.ts`, 378 KB / 6,153 export lines), and because that
  module is reachable from `Button`, `Chip`, `Accordion` and friends, every glyph
  became part of the graph. Walking the import graph from each package entry,
  honouring `exports` conditions and `.web`/`.native` order:

  | entry                | before                   | after                  |
  | -------------------- | ------------------------ | ---------------------- |
  | `@knitui/components` | 6,490 modules / 4,896 KB | 344 modules / 1,635 KB |
  | `@knitui/sheet`      | 6,506 modules / 4,960 KB | 360 modules / 1,700 KB |
  | `@knitui/carousel`   | 6,541 modules / 5,068 KB | 398 modules / 1,808 KB |
  | `@knitui/media`      | 6,530 modules / 5,056 KB | 384 modules / 1,796 KB |

  That is −94.7% modules and −3,261 KB of source off the components graph, and it
  lands on Metro cold start, on every clear-cache rebuild, and on the JS bundle
  itself for consumers whose bundler cannot shake a src-shipped barrel.

  **`@knitui/icons` gains two subpath exports** (the minor):

  - `@knitui/icons/context` — `IconProvider`, `useIconContext` and their types
  - `@knitui/icons/types` — `IconProps`, `IconNode`, `IconComponent`, `IconType`

  Per-glyph deep imports (`@knitui/icons/IconCheck`) already resolved through the
  existing `./Icon*` wildcard; the provider was the one thing that had no subpath
  and therefore forced the barrel. Nothing was removed — the root barrel still
  exports everything it did.

  **Internal import rewrites** (patch, no API change) across the shipped source of
  `@knitui/components` (`ControlIconProvider`, `Accordion`, `Checkbox/CheckIcon`,
  `Chip`, `CloseButton`, `Combobox`, `Stepper`), `@knitui/carousel` (`Carousel`)
  and `@knitui/media` (the audio/video chrome + `LiveAudioMeter`), each now naming
  the glyph module it actually uses. An ESLint `no-restricted-imports` guardrail in
  `eslint.config.base.mjs` blocks the bare `@knitui/icons` / `@knitui/emoji`
  specifier in shipped `src/**` so this cannot regress; stories, tests and the
  private `@knitui/demo` galleries (which render the whole registry on purpose) are
  exempt.

  **Bundler hygiene, same theme:**

  - `sideEffects` was missing from `@knitui/media`, `@knitui/sheet` and
    `@knitui/plugins`, so webpack/Next had to keep every module of those packages
    even when nothing referenced it. `media` and `sheet` are declared
    `sideEffects: false` (audited: their only module-scope statements are pure
    const initialisers and a `displayName` assignment — the one
    `registerProcessor()` call in `media` lives inside an AudioWorklet source
    string, not in the module). `plugins` lists just its `babel-plugin` entry,
    which really does mutate `process.env.TAMAGUI_IGNORE_BUNDLE_ERRORS` on load.
  - `@knitui/plugins/next-plugin` now sets
    `experimental.optimizePackageImports` for `@knitui/icons`, `@knitui/emoji`,
    `@knitui/components`, `@knitui/dates` and `@knitui/map`, so every Next
    consumer inherits it instead of having to know. Next has to build a barrel's
    full module graph before it can shake it, and `transpilePackages` means it
    compiles the kit's source to do so — with this, a bare-barrel glyph import in
    app code is rewritten to that glyph's own module and the other 6,145 files are
    never compiled. Any `experimental` the app already set is
    merged, not replaced, and its own `optimizePackageImports` entries are kept.

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
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5c6d758]
  - @knitui/components@0.6.0
  - @knitui/icons@0.6.0
  - @knitui/core@0.6.0
  - @knitui/hooks@0.6.0

## 0.3.1

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

- Updated dependencies [4f7830c]
  - @knitui/components@0.5.0
  - @knitui/core@0.5.0
  - @knitui/hooks@0.5.0
  - @knitui/icons@0.5.0

## 0.3.0

### Minor Changes

- 5b5a3e0: Expose the media store for custom chrome, and harden the audio recorder
  - **Selector hooks** — `useMediaSelector`, `shallowEqual` and the `MediaStore`
    contract are now public from both `@knitui/media/audio` and
    `@knitui/media/video`, alongside per-surface `useAudioState`,
    `useVideoState`, `useRecorderState` and `usePlaylistState` (plus
    `AudioContext`). Custom chrome can now subscribe to exactly the fields it
    renders instead of re-rendering on every controller tick.
  - **`setAudioMode`** — fix a hard webpack/Next build failure. The web backend
    does not export `requestNotificationPermissionsAsync`, and a named import of
    a missing binding is an "Attempted import error" even behind a runtime guard.
    The module now takes a namespace import so the lookup defers to runtime.
  - **`AudioRecorder`** — a denied mic prompt or a faulted `stop()` no longer
    strands the recorder mid-`recording` or surfaces as an unhandled rejection;
    both land in the terminal `error` state and recover on retry.
  - **`shouldCorrectPitch`** — seed the initial state from the browser default on
    web rather than from expo's `player.shouldCorrectPitch`, which reads `false`
    until the first `setPlaybackRate` and so misreported correction as off.
  - **`useAudioStream`** — document that `channels` is native-only; the web
    backend always down-mixes to mono and reports `1` regardless of the request.

### Patch Changes

- Updated dependencies [5b5a3e0]
  - @knitui/components@0.4.0
  - @knitui/core@0.4.0
  - @knitui/hooks@0.4.0
  - @knitui/icons@0.4.0

## 0.2.0

### Minor Changes

- 89f8c36: chore(deps): move the supported baseline to Expo SDK 57 and Next.js 16.

  Upgrades the kit's external toolchain to the latest majors:
  - **Expo SDK 56 → 57** — `react-native` 0.85.3 → 0.86.0, `react-native-reanimated`
    4.3.1 → 4.5.0, `react-native-worklets` 0.8.3 → 0.10.0,
    `react-native-gesture-handler` ~2.31 → ~2.32, `babel-preset-expo` → ^57, and all
    `expo-*` packages to their SDK 57 versions. React stays 19.2.3.
  - **Next.js 15 → 16** — the web app opts back into the webpack builder (`next build
--webpack`) so the Tamagui compiler plugin keeps running; Turbopack has no Tamagui
    loader yet.

  Consumer-facing dependency changes:
  - `@knitui/components` now depends on `expo-image` `~57.0.0` (was a stale `~2.4.1`),
    which also resolves the Expo SDK 56 Android startup crash consumers hit from the
    old pin.
  - `@knitui/media` now depends on `expo-audio` / `expo-video` `~57.0.0`.

  The two version-pinned pnpm patches (`expo-audio`, `expo-modules-core`) were migrated
  to their SDK 57 releases and still apply. Everything typechecks and builds (28/28 turbo
  tasks, the Expo app `tsc`, and the Next.js 16 production build).

### Patch Changes

- Updated dependencies [89f8c36]
  - @knitui/components@0.3.0
  - @knitui/core@0.3.0
  - @knitui/hooks@0.3.0
  - @knitui/icons@0.3.0

## 0.1.2

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0
  - @knitui/components@0.2.0
  - @knitui/hooks@0.2.0
  - @knitui/icons@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [407bef6]
  - @knitui/components@0.1.1
  - @knitui/core@0.1.1
  - @knitui/hooks@0.1.1
  - @knitui/icons@0.1.1
