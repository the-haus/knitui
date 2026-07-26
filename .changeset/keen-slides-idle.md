---
"@knitui/carousel": patch
---

Cut the per-frame and per-slide work the carousel does while scrolling

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
