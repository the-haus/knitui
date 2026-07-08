# @knitui/carousel

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
