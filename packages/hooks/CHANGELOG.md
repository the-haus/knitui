# @knitui/hooks

## 0.9.0

### Patch Changes

- Updated dependencies [bf9eeb1]
  - @knitui/core@0.9.0

## 0.8.1

### Patch Changes

- @knitui/core@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [8de27f7]
- Updated dependencies [85594a1]
  - @knitui/core@0.8.0

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

- Updated dependencies [59d065b]
  - @knitui/core@0.7.0

## 0.6.1

### Patch Changes

- ffb4133: Stop `useListState` corrupting the list on an out-of-range index.

  `reorder` destructured the spliced-out item, so a `from` beyond the end inserted a literal `undefined` into the list. `swap` wrote `undefined` over a real row when either index was out of range, and `setItemProp` spread a missing row into a bare `{ [prop]: value }` object masquerading as a `T`. All three now leave the list untouched when an index does not resolve.

- Updated dependencies [ffc254e]
- Updated dependencies [caa2d7e]
  - @knitui/core@0.6.1

## 0.6.0

### Patch Changes

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

- 5f44d20: Give `useUncontrolled` a referentially stable setter

  `handleUncontrolledChange` was a plain function declaration, so the setter had a
  new identity on every render — and the controlled branch handed back the caller's
  raw `onChange`, which callers almost always pass as an inline arrow. Either way,
  every consumer got a fresh setter every render.

  Around 48 files across `components`, `dates` and `sheet` call this hook and pass
  that setter straight into a child, a context value, or a `useMemo`/`useEffect`
  dependency list, so the churn cascaded. The clearest case was `Combobox`: a new
  `setOpen` made `use-combobox`'s `useMemo` store a new object, which made the
  `ComboboxContext` value a new object — and because context propagation walks
  _past_ `React.memo`, the deliberately memoized option row re-rendered anyway.
  Typing one character re-resolved every option frame in an open dropdown, with the
  cost scaling in the option count. `NumberInput`'s handler-assignment effect
  re-ran on every render for the same reason.

  Both branches now return one stable setter, with the latest `onChange` read
  through a ref (`useCallbackRef`) rather than closed over. That second half fixes
  a class of stale-closure bug as well: a consumer that memoized a handler with
  `[]` deps around the setter previously kept calling the `onChange` from its first
  render — `ColorPicker`'s `handleChange` did exactly that — and now always invokes
  the current one.

  Behaviour is otherwise unchanged: the controlled branch still never tracks its
  own state, `defaultValue` still wins over `finalValue`, and a missing `onChange`
  is still a no-op. Added a test suite covering the value semantics, the setter's
  identity across re-renders and state changes in both branches, and the
  always-latest-`onChange` guarantee.

- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5c6d758]
  - @knitui/core@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [4f7830c]
  - @knitui/core@0.5.0

## 0.4.0

### Patch Changes

- @knitui/core@0.4.0

## 0.3.0

### Patch Changes

- @knitui/core@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0

## 0.1.1

### Patch Changes

- @knitui/core@0.1.1
