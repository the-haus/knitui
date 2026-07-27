# @knitui/sheet

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

- **Sheet.Header / Sheet.Footer: fixed slots around the scrollable content.**

  The slot system gains two fixed (non-scrolling) regions that frame a
  `Sheet.ScrollView`:
  - `Sheet.Header` — pinned below the drag handle and above the content. A good
    home for a title, tabs, or a segmented control that must stay put while the
    body scrolls.
  - `Sheet.Footer` — pinned below the content. A good home for an action bar
    (e.g. a "Done" button) that stays visible regardless of scroll position.

  Both are `styled(Box)` parts with `flexShrink: 0`, so a nested
  `Sheet.ScrollView` (`flex: 1`) fills and scrolls the space between them. They
  are opt-in markers (rendered only when present) and are targetable via the
  per-slot `styles` map (`styles={{ header, footer }}`) alongside the existing
  `root` / `overlay` / `handle` slots.

## 0.2.0

### Minor Changes

- f37a436: **Sheet.ScrollView: scroll↔drag handoff on React Native (nested scroll fix).**

  A `Sheet.ScrollView` nested in the panel now cooperates with the sheet's drag gesture instead of fighting it. Previously the sheet's pan claimed every vertical drag, so the inner list wouldn't scroll on native. The two are now coordinated so a single vertical drag either moves the sheet or scrolls the list — never both:
  - At the top snap the list scrolls normally. Drag it back to the top and keep pulling down and the sheet takes over (collapses toward the next snap, then dismisses), with the panel's motion anchored to the finger so there's no jump.
  - From a partially-open snap the drag moves the sheet, and the list stays pinned to the top so it can't scroll mid-collapse.
  - A downward fling on the list no longer collapses the sheet.

  Implementation notes:
  - On native, `Sheet.ScrollView` is a purpose-built `Animated.ScrollView` bound to the sheet's `Gesture.Native` (so the two recognise simultaneously) and reports its scroll offset back to the pan; it uses the platform scroll indicators. On web it stays a `ScrollArea` wrapper (the browser owns nested scrolling), so behaviour there is unchanged.
  - The handoff decision logic lives in a pure, unit-tested engine module (`engine/handoff.ts`); no public API changed.

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
