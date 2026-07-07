---
"@knitui/carousel": minor
---

feat(carousel): add `SwipeDeck` — a Tinder-style, cross-platform (React Native + Web) swipe deck.

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
