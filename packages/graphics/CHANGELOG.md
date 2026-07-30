# @knitui/graphics

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
