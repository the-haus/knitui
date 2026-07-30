---
"@knitui/components": minor
---

**VirtualList: `keepMounted`, keyed identity, and cheaper re-renders.**

`VirtualList` gained a `keepMounted` prop — an escalating ladder for how much stays
mounted beyond the live window, so rows can keep their own state (a half-typed input,
a playing video, in-flight work) instead of losing it the moment they scroll out:

- `false` (default, unchanged) — pure virtualization; leaving the window unmounts.
- a number — keep at most that many already-seen rows outside the window, evicting
  the least-recently-visible first (a bounded LRU warm pool).
- `true` — keep every row that has ever mounted; unbounded, but still lazy.
- `"all"` — no windowing at all: every row in `data` is mounted immediately, whether
  or not it has been on screen. Mount cost is O(data), so keep it to lists you would
  have rendered with `.map()` anyway.

Supplying a `keyExtractor` now makes the list's caches follow **items instead of
slots**: measured heights live in a per-key cache, so a prepend, insert, removal, sort
or filter moves each row's height (and its retained mount) with its item rather than
shifting them onto the wrong row. Without a `keyExtractor` the index remains the
identity, which is only correct for append/pop — as before.

This subsumes the index-shifting prepend the backwards-pagination work added earlier in
this release: a prepend is one shape of data change among many, so it now goes through
the same keyed re-sync, and `prependLayoutState` is gone. `maintainVisibleContentPosition`
still detects the prepend by key — it needs to know how much height went in at the head
to absorb it into the scroll offset — it just no longer moves the measurements itself.

Rows now sit behind two memo boundaries instead of one. The inner boundary depends
only on `{ item, index, renderItem, extraData }`, so a shifted row offset — which
happens on every measurement in a variable-height list — or an inline
`ItemSeparatorComponent` / `styles.item` literal re-renders only the cheap positioned
wrapper and no longer re-runs your `renderItem`. `styles.item` is also identity-
stabilised internally, so writing it inline is now free.

Fixes a crash when `data` shrank below the current window (a filter, a reset, a page
rollback): the mounted window is clamped to the data, where it previously indexed past
the end of the array and handed `renderItem` an `undefined` item.
