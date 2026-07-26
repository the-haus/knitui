---
"@knitui/components": patch
"@knitui/hooks": patch
"@knitui/sheet": patch
---

Stop overlays, scrolling and looping animations from doing per-frame work

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
