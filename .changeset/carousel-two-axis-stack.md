---
"@knitui/carousel": minor
---

Two-axis decks and stack fixes.

- New `crossAxis` prop: a second drag axis on the same slides, `index` and callbacks. On a vertical stack, a vertical drag runs the stack and a horizontal drag pages sideways (`crossAxis.mode`, default `"normal"`). Each drag locks to its dominant axis over the first 10px. Wheel and arrow keys follow the same split. `next` / `prev` / `scrollTo` take `axis: "cross"` for side buttons. New types: `CarouselCrossAxis`, `CarouselAxis` and `CarouselModeConfig`.
- Stack modes showed the wrong cards behind the front one. Every slide past `showLength` stayed visible at the last step, all at `zIndex` 0. They then painted in mount order, so a slide from the end of the data covered the deck. Slides past the deck now fade out and the paint order is strict. Fade, depth, flip, cube, coverflow and parallax had the same `zIndex` tie from one page out and are fixed too. Flip also hides slides a full turn away.
- Android: slides now paint in stacking order. The track renders the window in paint order and gives each slide host a settled `zIndex` (+ `elevation`) prop. Reanimated's animated `zIndex` never re-sorted Android views.
- The pan now activates only along the carousel's axis and fails across it (`activeOffset*` / `failOffset*`, replaced by any activation config passed in `gestureConfig`), so a page, map or outer carousel keeps the other axis.
- A touch that never turns into a drag now settles. Each `onScrollStart` gets its `onScrollEnd`, autoplay resumes, and an animation the touch interrupted lands on a page.
- A controlled `index` that only echoes the carousel's own last `onScrollEnd`, committed late, no longer snaps the deck back mid-drag.
- A wheel event the carousel handles no longer reaches a parent's wheel handler, small deltas included.
