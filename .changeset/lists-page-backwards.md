---
"@knitui/components": minor
---

`VirtualList` can page backwards and hold the reading position while it does

`VirtualList` shipped with `onEndReached` only, which covers the ordinary infinite
feed but not the list whose history grows at the HEAD — a chat thread loading older
messages, a log tailing backwards. Two new props close that:

- **`onStartReached`** (+ `onStartReachedThreshold`, default `0.5` viewports) — the
  mirror of `onEndReached`, measured from offset 0, with the same one-shot latch: it
  re-arms only once the list has scrolled back out of the threshold band, so a caller
  whose page lands while still near the top is asked once rather than every frame.
  Like `onEndReached` on a short list it fires on mount at rest, because the list
  genuinely IS at the start.
- **`maintainVisibleContentPosition`** — holds the reading position across a layout
  change instead of letting the rows slide. Off by default: it takes over the scroll
  offset, which a list that only grows at the tail has no reason to hand over.

Backwards pagination needs the second prop to be usable at all, because an insert at
the head moves every row already on screen. With it on, a prepend has its inserted
height added to the scroll offset in the same frame — pre-paint, in a layout effect,
since a passive effect would show one frame of the content having dropped by a page's
worth of height. The anchor is re-derived on every layout bump, because the inserted
rows start on the ESTIMATE and each real measurement above the anchor moves it again;
against a 25-row page, a few px of per-row error is a visible drift. It is released
once nothing above the anchor can still move, or the moment the user's own gesture
arrives — correcting through a live gesture would fight it.

Two fixes fall out of the same work:

- **The size model mis-attributed a prepend.** `resizeLayoutState` preserves
  measurements by INDEX, which is right for an append or a pop and wrong for an
  insert at the head: row 0's measured height stayed on row 0, now a different row,
  and every other measurement read off by the number of rows inserted. The list then
  reflowed for the entire first scroll back up, re-learning heights in slots that
  already claimed to know them. A prepend now routes through a new
  `prependLayoutState`, which carries each measurement to its row's new index.
- **`scrollToEnd` landed short on unmeasured content.** The destination comes from
  the total height, and on a list opening deep into content it has never measured
  that total is mostly estimate — so hitting it once leaves the last rows short of
  the bottom by the accumulated error (25 chat bubbles a dozen px under their
  estimate is a third of a screen). Under `maintainVisibleContentPosition` a
  non-animated `scrollToEnd` now HOLDS the end and re-derives it as those rows
  measure. Animated calls stay one-shot: an animated scroll reports a stream of
  intermediate positions, and this cannot tell those apart from the user grabbing the
  list mid-flight.

Both props need `keyExtractor`: a prepend is recognised by finding the previous head
row at its new index (one key comparison, not a diff), and index keys carry no
identity to recognise it by. `scrollToIndex` / `scrollToOffset` / `scrollToTop` drop
any held anchor — an explicit destination outranks whatever the list was holding on
to.
