# @knitui/carousel

## 0.3.5

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

## 0.3.4

### Patch Changes

- 5f44d20: Cut the per-frame and per-slide work the carousel does while scrolling

  Six verified hot paths, all in the scroll/fling loop:

  **`modeConfig` was memoized by object identity.** `modeConfig` is documented (and
  used everywhere) as an inline literal, so it was a fresh object every render and
  `useLayout` rebuilt the layout worklet every render. That closure is a dependency
  of every mounted slide's `useAnimatedStyle`, so Reanimated tore down and
  re-installed the style mapper of EVERY mounted slide on every render, the slide
  `React.memo` never held, and on web the painter ran a full `paintAll()` over all
  entries. It is now compared shallowly and collapsed to a stable reference, so an
  unchanged config produces the same worklet. The public prop is unchanged — keep
  passing it inline.

  **Every mounted slide had its own JS-thread listener on `offset` (web).**
  `scrollMode="native"` mounts all slides — `count * 3` in loop mode — and each one
  subscribed to `offset` separately. A 30-item looped rail therefore turned a single
  `offset.value` write into 90 JS callbacks and 90 shared-value writes, on the main
  thread, for every scroll event the browser fired. There is now ONE listener in the
  track over a registered-slot map (the same design the web painter uses), computing
  the scroll position once: 90 callbacks → 1, 90 writes stay but cost one loop.

  **The tracks are memoized.** `Track` / `NativeTrack` re-rendered on every settled
  index change (once per page crossed during a fling), rebuilding the element — and
  re-running `getItem` / `keyExtractor` — for every mounted slide. Both are now
  `React.memo`; combined with the `modeConfig` fix every prop is identity-stable on
  such an internal re-render, so the slides are left alone. `useResolvedSource` now
  folds the source version into its accessor identity, which is what lets a
  memoized track still notice that an async page has landed.

  Slide content is deliberately NOT insulated from a parent re-render: making
  `renderItem`'s identity permanently stable (a render-time ref proxy) would hold
  the memo across parent renders too, but it silently freezes slide content whenever
  an inline `renderItem` closes over changed state — the classic `FlatList`
  `extraData` bug. Two tests now guard that in both scroll modes.

  **`onProgressChange`'s callback form is coalesced — a cadence change.** The
  UI-thread reaction hopped to JS on every single frame while dragging or flinging;
  a consumer that puts the value in React state (the natural thing to write) paid a
  full render per frame, which is guaranteed jank on Android. The callback form is
  now throttled to ~30 Hz (one hop per 32 ms) and is always flushed with the exact
  final value when the scroll settles, so "where did we land" logic is unaffected —
  but a callback wired straight to an animation will now see roughly half as many
  samples. Pass a `SharedValue` instead for per-frame fidelity: it is written on the
  UI thread with no hop, is unthrottled, and is now documented as the preferred form.

  **Pagination derived selection per dot.** Each dot installed its own
  `useAnimatedReaction` over `progress`, which the carousel writes every frame — one
  mapper evaluation per dot per frame on the UI thread, linear in dot count. The
  selected index is now derived ONCE per row (`useSelectedIndex`) and handed down as
  a boolean; a 10-dot row goes from 10 subscriptions to 1. Each dot keeps its own
  declarative transition, and the fill variants (`Pagination.Basic` / `.Custom`)
  keep their per-dot fill `useAnimatedStyle`. Minor behaviour change: at the loop
  seam the fill variants now select dot 0 (rounding wraps into real-item space)
  instead of selecting no dot at all.

  **A side effect inside a `setState` updater.** `Track` assigned its travel
  direction inside the `setCenter` reducer, which React may invoke twice (StrictMode
  / concurrent replay); the second pass compared against the already-advanced value
  and could record the wrong direction, costing a mis-aimed prefetch. It is now
  derived outside the updater against a ref.

  Also corrected `useSharedValueListener`'s docstring, which claimed `addListener`
  works "on native and on web". In Reanimated 4 a listener can only be added on the
  UI runtime, so an ungated call from the JS thread throws on native — every call
  site is gated to web or lives in a `.web` file, and the docstring now says so.

  **The 3D layout worklets allocated a throwaway array per slide per frame.**
  `coverflow`, `flip` and `cube` built their transform as `[...persp, …]`, which
  allocates an intermediate `persp` array and then copies it element by element into the
  real one — multiplied by the mounted window size times the frame rate, on the UI thread
  on native, where the resulting GC pressure is visible as fling jank. The array is now
  built in one shot per branch, and the `perspective > 0` test and the axis/vertical
  choice are hoisted to closure-creation. The returned array stays fresh per call on
  purpose: reanimated converts it on assignment and it must not be reused or mutated.

  **The web painter rewrote four style properties per slide per painted frame.**
  `opacity`, `zIndex`, `transformOrigin` and `backfaceVisibility` were re-assigned every
  paint even though the default `normalLayout` emits none of them — four wasted CSSOM
  writes per slide per frame, each dirtying the element's inline style. They are now
  diffed against a per-entry cache, so the steady state is zero writes. `transform` is
  deliberately still written unconditionally: `Item.web` also writes it via
  `initialStyle`, so a cached value could read as already-applied and strand the slide
  at a stale transform.

  **Each pagination dot re-rendered on every page change.** Only one dot's `selected`
  flips, but every dot rebuilt its `useReducedTransition` and its Tamagui `CarouselDot`.
  `Dot` is now `React.memo`'d, with the row stabilising `onPress` (every caller writes it
  inline). `renderDot` is deliberately NOT stabilised — an inline renderer closes over
  its own state, and freezing it is the `FlatList` `extraData` trap.

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

## 0.3.3

### Patch Changes

- Updated dependencies [4f7830c]
  - @knitui/components@0.5.0
  - @knitui/core@0.5.0
  - @knitui/hooks@0.5.0
  - @knitui/icons@0.5.0

## 0.3.2

### Patch Changes

- Updated dependencies [5b5a3e0]
  - @knitui/components@0.4.0
  - @knitui/core@0.4.0
  - @knitui/hooks@0.4.0
  - @knitui/icons@0.4.0

## 0.3.1

### Patch Changes

- Updated dependencies [89f8c36]
  - @knitui/components@0.3.0
  - @knitui/core@0.3.0
  - @knitui/hooks@0.3.0
  - @knitui/icons@0.3.0

## 0.3.0

### Minor Changes

- 05b8d7b: feat(carousel): add `SwipeDeck` — a Tinder-style, cross-platform (React Native + Web) swipe deck.

  The top card free-drags in 2-D and commits a like / nope / super-like past a directional
  threshold (distance or flick velocity), flying off while the next card rises. The visual is a
  pluggable **effect** (`tinder` / `stack` / `fan` / `swipe`, or a custom worklet), driven by a
  richer `DeckCardState` (animated stack `depth` + live drag) — the deck's analogue of the
  carousel's scalar `progress`.

  Includes per-direction **stamps** (custom `renderStamp` or built-in `stampLabels`), an imperative
  `ref` (`swipe` / `swipeLeft` / `swipeRight` / `swipeUp` / `getActiveIndex`), `onSwipe*` /
  `onActiveIndexChange` / `onEmpty` callbacks, `renderEmpty`, a mounted-window `stackSize`, and the
  kit's standard `styles` per-slot map (`root` / `card` / `stamp`). Additive — no changes to the
  existing `<Carousel>` / `<Pagination>` surface.

## 0.2.0

### Minor Changes

- ef6db30: feat(carousel): support `loop` in `scrollMode="native"`

  Native scroll mode now honours `loop` instead of forcing it off (and no longer
  warns when `loop` is requested). Looping is realised by cloning the data ring
  `LOOP_COPIES` times in the scroll content and silently recentring the scroll
  position into the middle copy on settle — the jump is exactly one ring of
  pixel-identical clones, so it's invisible, and mod-invariant to the engine's
  progress/index math. Programmatic `next`/`prev`/`scrollTo` travel to the
  nearest ring copy (shortest visual path). Works on web and native, horizontal
  and vertical; `loop={false}` keeps the finite start-aligned behaviour.

## 0.1.2

### Patch Changes

- 77ee0bb: Carousel: add `scrollMode="native"` — an opt-in "normal scroll" mode backed by a
  real platform scroll container (an `Animated.ScrollView` on native, an
  overflow-scroll surface with CSS scroll-snap on web). Scrolling, momentum and
  rubber-band overscroll are the OS's own and nothing runs per frame on the JS
  thread. The live scroll position is mirrored into the same scroll-offset shared
  value the transform engine uses, so pagination, `progress`/`onProgressChange`,
  the active index, controlled `index` and the imperative `ref`
  (`next`/`prev`/`scrollTo`) keep working. `snapEnabled` / `pagingEnabled` /
  `overscrollEnabled`, `vertical` and `itemSize`/`itemWidth`/`itemHeight` are
  honoured. Native mode mounts every slide (no windowed virtualization), forces
  `loop` off, and ignores the transition `mode`/`customAnimation` (slides lay out
  in normal flow). Default stays `scrollMode="transform"` — no behaviour change for
  existing usage.
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
