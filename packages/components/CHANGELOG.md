# @knitui/components

## 0.9.0

### Minor Changes

- bf9eeb1: Refresh dependencies to the latest Expo SDK 57 releases.

  - **core / components / plugins:** Tamagui 2.4.6 → 2.7.7 (pinned exactly, so the babel plugin and runtime always match) and `react-native-teleport` 1.1.7 → 1.2.2. The teleport Android `prepareToRecycleView` fix is now upstream, so the local patch is gone. `expo-image` → ~57.0.5.
  - **map:** now targets `maplibre-gl` v6 on web (peer `^6`, was `^5`) and `@maplibre/maplibre-react-native` ^11.4.0 on native. Both use `@maplibre/maplibre-gl-style-spec` 26. maplibre v6 is ESM-only and has no default export; the map package now imports it as a namespace. If your web app imports `maplibre-gl` itself, update it to v6. The canvas-leave handlers now listen to `mouseout`: v6 only fires `mouseleave` for layer-scoped listeners, so the long-press/cursor reset on leaving the map never ran.
  - **media:** `expo-audio` → ~57.0.5, `expo-video` → ~57.0.4.

### Patch Changes

- Updated dependencies [bf9eeb1]
  - @knitui/core@0.9.0
  - @knitui/hooks@0.9.0
  - @knitui/icons@0.9.0

## 0.8.1

### Patch Changes

- c25c51f: `Menu` is now operable from the keyboard: Arrow-key roving focus, focus moved into the dropdown on open, and focus returned to the trigger on close.

  `Menu` rendered `role="menu"` with `role="menuitem"` children but had no key handling at all, and `menuItemTabIndex` defaulted to `-1` — so every item was out of the tab order with nothing to put focus on them. An open menu could not be reached, navigated or activated with a keyboard, which for a `role="menu"` is worse than shipping no role: assistive technology announces a menu whose items cannot be got to. The items also carried `focusRingStyle` while being unfocusable — a dead ring, the exact invariant `src/__tests__/focus-ring.test.tsx` exists to catch, and `Menu` was missing from its case list, which is how this survived.

  What changed:

  - **Roving focus.** <kbd>↓</kbd>/<kbd>↑</kbd> move between enabled items (wrapping, unless `loop={false}`), <kbd>Home</kbd>/<kbd>End</kbd> jump to the ends. Disabled items are skipped. Items are enumerated from the DOM (`[role="menuitem"]`) rather than from cloned children, because a menu's children are arbitrary — items interleaved with labels, dividers and the consumer's own fragments.
  - **Opening from the trigger.** <kbd>↓</kbd> opens the menu focusing the first item, <kbd>↑</kbd> the last. This is also the only way to open a _hover_ menu from the keyboard without pressing it.
  - **Focus management.** `trapFocus` and `returnFocus` are now forwarded to the underlying `Popover`, which already implemented both. They default to `true` for `trigger="click"` and `false` for hover triggers: a menu opened by pointing at something never held focus, so taking it on hover-in — and pushing it onto the trigger on hover-out — would move the caret out of whatever the user was actually doing. Both are overridable per menu.

  `menuItemTabIndex` keeps its `-1` default and its meaning; it is no longer the only way to reach an item, and the docs now say so. Behaviour for pointer users is unchanged.

  `Menu` joins the focus-ring guardrail, along with `ColorPicker`, `Stepper` and `TreeSelect` — three more ring-bearing components the contract test never covered.
  - @knitui/core@0.8.1
  - @knitui/hooks@0.8.1
  - @knitui/icons@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [8de27f7]
- Updated dependencies [85594a1]
  - @knitui/core@0.8.0
  - @knitui/hooks@0.8.0
  - @knitui/icons@0.8.0

## 0.7.0

### Minor Changes

- edcec97: `VirtualList` can page backwards and hold the reading position while it does

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
    already claimed to know them. With a `keyExtractor`, measurements are now keyed by
    item rather than by slot, so a prepend carries each one to its row's new index —
    see the keyed size model in the same release.
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

- 15a329c: **VirtualList: `keepMounted`, keyed identity, and cheaper re-renders.**

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
  - @knitui/hooks@0.7.0
  - @knitui/icons@0.7.0

## 0.6.1

### Patch Changes

- 487dce4: Fix `NaN` colour channels for an out-of-range hue.

  `hsvaToRgbaObject` picks one of six channel tuples by `hue / 60` and never normalised the hue first, so a negative one indexed off the front of those tuples and produced `NaN` for red, green and blue. `ColorPicker` reaches this on every hue change — it passes the hue straight through as a plain number — which made `convertHsvaTo` serialise `rgb(NaN, NaN, NaN)`. Hues now wrap by Euclidean remainder, so `-60` resolves as `300` and `420` as `60`.

  Colour _strings_ were never affected: a negative hue fails validation and resolves to black, as before.

- caa2d7e: Point every `types` entry at the built declarations (`lib/typescript/*.d.ts`) instead of at the shipped TypeScript source.

  These packages ship their source and resolve it at runtime (`source`, `react-native` and `default` all still point into `src`), but `types` pointed there too — so a consumer's `tsc` typechecked the kit's raw source as part of their own build. That is slow, and it surfaces errors that depend on the consumer's own compiler settings, since `skipLibCheck` does not apply to `.ts` source files. Resolving `types` to real `.d.ts` files makes declaration handling both faster and inert.

  `@knitui/icons` also adds `lib/typescript` to `files`; its declarations were previously built but never published, so the new `types` path would not have existed in the tarball.

  `@knitui/emoji` deliberately keeps `types` on its source: its per-emoji modules ship as pre-generated `.js`/`.d.ts` pairs inside `src`, which `tsc` does not re-emit, so its built barrel cannot resolve them.

- Updated dependencies [ffc254e]
- Updated dependencies [ffb4133]
- Updated dependencies [caa2d7e]
  - @knitui/core@0.6.1
  - @knitui/hooks@0.6.1
  - @knitui/icons@0.6.1

## 0.6.0

### Minor Changes

- 5f44d20: Cut the shipped theme suite from 440 themes to 22, and stop the mediaquery hooks re-parsing / re-rendering per frame

  ## `@knitui/core` — 418 generated themes removed

  `config/themes.ts` called `createThemes(...)` without a `componentThemes`
  argument, so it inherited Tamagui's `defaultComponentThemes` — a 19-entry map
  that is itself `@deprecated` upstream ("component themes are no longer
  recommended"). Those entries cross-multiply with every scheme × palette, so the
  kit shipped **2 × 11 × 20 = 440 themes**, all built eagerly at module scope on
  every app start and again by the Tamagui babel/static compiler.

  Measured against the kit's real inputs (interpreter-only, `node --jitless`):

  |        | themes | theme keys | resolved `Variable`s  | heap     | build   |
  | ------ | ------ | ---------- | --------------------- | -------- | ------- |
  | before | 440    | 37,708     | 37,708 (2,822 unique) | 2,513 KB | 12.1 ms |
  | after  | 22     | 1,870      | 1,870 (1,010 unique)  | 208 KB   | 2.8 ms  |

  `componentThemes: false` is set both in the stock `config/themes.ts` and in
  `createTheme()`, so a consumer-built config has the same theme set as the shipped
  one (24 names there — the stock 22 plus the `brand` alias in both schemes).

  ### BREAKING for anyone naming a component theme

  Themes named `<scheme>[_<palette>]_<Component>` no longer exist. If you
  reference one by name — `<Theme name="light_Button">`, a `themes` override keyed
  `dark_gray_Card`, or a `createTheme({ themeBuilder: { componentThemes: … } })`
  extension — it will no longer resolve and the nearest parent theme is used
  instead. The removed names are the 20 Tamagui defaults (`Button`, `Card`,
  `Checkbox`, `Input`, `ListItem`, `Progress`, `ProgressIndicator`,
  `RadioGroupItem`, `SelectItem`, `SelectTrigger`, `SliderThumb`, `SliderTrack`,
  `SliderTrackActive`, `Switch`, `SwitchThumb`, `TextArea`, `Tooltip`,
  `TooltipArrow`, `TooltipContent`) × 22 scheme/palette combinations.

  To get them back, pass your own map:

  ```ts
  createTheme({ themeBuilder: { componentThemes: { Card: { template: "surface1" } } } });
  ```

  ### `@knitui/components` — offsets that were implicit are now explicit

  Nine of the kit's `styled()` names collided with that default map and were
  silently receiving a template offset. Every one of them has been PINNED so the
  rendered colour is unchanged — verified value-by-value across `light`, `dark`,
  `light_blue` and `dark_red` (100 probes, 0 differences):

  | component     | template | change                                                                                                                                                     |
  | ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `ListItem`    | surface1 | none — the frame paints nothing, and `surface*` leaves `$color1…$color12` and `$color` alone                                                               |
  | `Progress`    | surface1 | none — already explicit `$colorN`                                                                                                                          |
  | `Button`      | surface3 | `variant="default"` border pinned `$borderColor` → `$color7` (the only variant reading `$borderColor`)                                                     |
  | `Card`        | surface1 | frame + `Card.Section` border pinned to `$color2` / `$color5`                                                                                              |
  | `Checkbox`    | surface2 | unchecked box pinned to `$color3` / `$color6`                                                                                                              |
  | `SliderTrack` | inverse  | ramp steps written pre-mirrored (`$color3`→`$color10`; child `SliderBar` `$color9`→`$color4`)                                                              |
  | `SliderThumb` | inverse  | pre-mirrored (`$color1`→`$color12`, `$color9`→`$color4`, hover `$color10`→`$color3`; child `SliderLabelBubble` too)                                        |
  | `SwitchThumb` | inverse  | child `SwitchThumbIndicator` pre-mirrored (`$color5`→`$color8`, on `$color9`→`$color4`). The thumb itself uses `$white`, a token, so it was never inverted |
  | `Tooltip`     | inverse  | frame `$color9`→`$color4`, `Tooltip.Text` `$color1`→`$color12`                                                                                             |

  Two things worth flagging to whoever owns the visual design:

  1. The four `inverse` collisions were **reversing the entire `$color1…$color12`
     ramp** under those subtrees, not offsetting one step. So `Tooltip` was authored
     `$color9` fill + `$color1` label (the kit's canonical filled pairing) and
     actually painted step 4 + step 12; the slider's track/bar/thumb were likewise
     inverted. The pins preserve the shipped pixels, but they codify an appearance
     that came from a deprecated Tamagui default rather than a design decision.
     Un-mirroring them (back to `$color9`/`$color1` etc.) is a deliberate follow-up.
  2. **Descendants** of those nine frames no longer inherit the offset theme. A
     component placed inside a `Card` used to resolve `$background` one ramp step up
     (`$color2`); it now gets the page value (`$color1`). Only the nine frames' own
     painted surfaces are pinned — arbitrary user content inside them shifts by one
     step (or un-inverts, inside the Slider/Tooltip parts).

  `config/OVER_MEDIA` also moved to its own module (`config/over-media.ts`) so
  importing those five scrim literals no longer drags in the whole theme
  generation. No export surface change.

  ## `@knitui/mediaquery` — no per-render parsing, 3N listeners → 3
  - **`matchesQuery` no longer re-parses on every call.** The native `useMediaQuery`
    evaluated its query on the render path, and a string query re-ran the full
    parser each time: for `"(min-width: 768px) and (orientation: landscape)"` that
    is ~6 regex executions plus ~10 allocations, per render, per hook instance — so
    a 50-row list did ~300 regex ops per render pass to produce 50 identical
    booleans. Parses are now memoised in a bounded module-level cache
    (`parseMediaQuery` hands out copies, so a caller can't poison it).
  - **One shared environment store on native.** Each call site used to register
    THREE native subscriptions (`Dimensions`, `Appearance`,
    `AccessibilityInfo.reduceMotionChanged`) plus an `isReduceMotionEnabled()`
    promise — 20 call sites meant 60 live listeners. Worse, every handler did
    `setEnv(prev => ({ ...prev, … }))`, always a NEW object, so one rotation
    re-rendered every instance even though the boolean each derives almost never
    flips. There is now one store with three listeners total, read through
    `useSyncExternalStore` whose snapshot is the resolved **boolean**, so React
    bails per component unless that component's answer actually changed.
  - **`useBreakpoint` renders on band crossings, not resize pixels.** It was backed
    by `useViewportSize`, whose untreated `resize` listener allocates a fresh
    `{ width, height }` ~60×/s during a window drag, forcing a re-render at every
    call site before the band was even derived — though `resolveBreakpoint` yields
    only 8 values across 7 thresholds. `mediaquery` now owns a viewport store that
    wakes subscribers only when the band changes, and the hook's snapshot is the
    `BreakpointKey` string. (`@knitui/hooks`' `useViewportSize` is untouched — it
    has other consumers that want the pixel width.)
  - **`useSystemColorScheme`** builds its `MediaQueryList` once at module scope
    instead of constructing a live, document-registered query object inside
    `getSnapshot` (which React calls per render and per store-change check, twice
    over in StrictMode) and again in `subscribe`.

  No public API change in `@knitui/mediaquery`; `useBreakpoint` keeps its SSR
  contract (the server snapshot and first hydrating render both resolve the
  `MediaQueryProvider` seed).

- 5c6d758: Retune the line-height ladder so leading tracks font size consistently

  `lineHeightRatios` climbed with font size (1.35 → 1.65), so the largest text got
  the loosest leading and the smallest got the tightest — the opposite of what
  typography needs. `$xxl` headings rendered a 46px line box at 28px, reading as
  double-spaced, while several steps landed on odd pixel values (23px, 31px).

  The ladder is now a hump — 1.35 at the caption end, peaking at 1.5 for body,
  tapering to 1.3 for display — which matches the shape Mantine (body `lineHeights`
  plus `headings.sizes`) and Tailwind both use. Derived line heights per font step:

  | token | font | before | after |
  | ----- | ---- | ------ | ----- |
  | xxs   | 12   | 16     | 16    |
  | xs    | 14   | 20     | 20    |
  | sm    | 16   | 23     | 24    |
  | md    | 18   | 27     | 26    |
  | lg    | 20   | 31     | 28    |
  | xl    | 24   | 38     | 32    |
  | xxl   | 28   | 46     | 36    |

  Every value is now even, so a `(height − lineHeight) / 2` centering gap stays on
  whole pixels, and each one matches the leading Tailwind or Mantine gives that same
  font size.

  Also fixed: `getLineHeight()` multiplied a raw numeric size by the `md` ratio
  regardless of the number, so `fontSize={28}` and `fontSize="$xxl"` (also 28)
  produced different line heights. A number now takes the ratio of the nearest step
  on the font scale, so both resolve to 36. `TableOfContents` hardcoded its own
  `value * 1.4` for numeric sizes and now goes through the same ladder.

  This shifts rendered text metrics across the kit — anything measuring or pinning
  line boxes (notably `Textarea` row heights, which derive from `rows × lineHeight`)
  will lay out slightly differently. Consumers on `^0.5.x` opt in explicitly rather
  than picking it up as a patch.

### Patch Changes

- 5f44d20: Stop hot components re-rendering their whole subtree on every keystroke, drag frame and scroll sample

  A pass over the components whose cost scaled with the wrong thing — the number of
  options, marks, pills, rows or tree nodes rather than the number that actually
  changed. All of these are the same shape of defect: a memo that could never hit, or a
  derivation re-run per node instead of once.

  **The select family (`Select`, `MultiSelect`, `TagsInput`, `TreeSelect`,
  `Autocomplete`)** — each Root listed `__triggerProps` in its context `useMemo` dep
  array, but the sugar wrapper assembles that object fresh on every render from a rest
  spread (`...inputProps`), so its identity can never be preserved. The context value
  was therefore new every render and every consumer re-rendered — including the
  deliberately memoized option row, because context propagation walks _past_
  `React.memo`. A comment claimed the churn was intentional; it was self-inflicted.

  `__triggerProps` now rides its own context, read by the one node that consumes it
  (`Select.Trigger`), while the option rows keep subscribing to the behaviour context.
  Removing it from the deps only helps if the memo can then be trusted, so every Root
  handler is `useCallbackRef`-stable (fixed identity, latest closure) and each dep array
  is now complete with the `eslint-disable` gone — previously a hitting memo would have
  served a stale `onSearchChange` or a stale `__triggerProps` callback. `handleSubmit`
  matters twice over: it lands on `<Combobox onOptionSubmit>`, a dep of Combobox's own
  context memo, so churn there reached every `Combobox.Option` regardless.

  **`MultiSelect` / `TagsInput` pills** — the pills were mapped un-memoized, each one
  subscribing to the context that also carries `search`, so typing one character
  re-rendered every chip (a `Pill` + `CloseButton` + icon SVG each), and each got a
  fresh `onRemove` closure because `removeValue`/`removeTag` depended on the current
  value array. Keystroke latency scaled with the number of selected values. The chips now
  subscribe to a search-free context slice and are `React.memo`'d, with a stable
  remove callback, so a keystroke re-renders the field and skips the pills.

  **`Tree`** — `isNodeChecked` and `isNodeIndeterminate` each ran a full recursive
  traversal that allocated a status object per node and did `checkedState.includes(…)`
  per leaf. The documented pattern calls both for every node, so a render was two full
  traversals _per node_: for 200 nodes with 50 checked, roughly 80k object allocations
  and 2M string compares. `useTree` now builds one `Map<value, status>` per
  `(data, checkedState)` in a single pass (with a `Set` for membership) and both helpers
  are O(1) lookups. The exported pure helpers keep their signatures and semantics.

  **`Table`** — `Table.Tbody` cloned every row to inject an index and `Table.Tr` cloned
  every cell to mark the first one, so a 500×8 composed table allocated ~4,500 extra
  element objects and re-walked its children twice per render, with no memo on the
  context-consuming rows and cells. Both walks are replaced by small internal contexts,
  and each is skipped entirely when the feature that needs it is off: zero child walking
  for a default table, 500 provider elements (not 4,000 clones) with column dividers on.
  Rows are no longer cloned, so a memoized row can finally bail out. One incidental fix:
  first-cell marking used `Children.map`'s index, which counts `null`/`false` slots, so a
  conditionally-rendered leading cell drew a divider on the wrong cell.

  **`VirtualList`** — `slots.get("item") ?? {}` allocated a fresh object every render and
  handed it to the memoized `Row`, so every mounted row re-rendered on every windowing
  render and every measurement-driven layout bump; scroll jank scaled with the window
  size instead of with rows entering and leaving. Now a module-level constant. Fixing the
  memo exposed that `extraData` — documented as the re-render trigger for `renderItem` —
  was never passed to the row and only "worked" because the memo was broken; it is now a
  real row prop. Separately, `handleScroll` changed identity every render (through
  `headerH`/`footerH` state and inline range/end-reached callbacks) and lands on
  `ScrollArea`'s `onScrollPositionChange`, which is a dep of the native
  `useAnimatedScrollHandler` — so the Reanimated worklet scroll handler was rebuilt on
  every windowing render, i.e. mid-fling. The scroll callbacks are now
  `useCallbackRef`-stable with the chrome heights mirrored into refs (written
  synchronously alongside the state, so windowing can't read a stale header height
  between a chrome commit and the effect flush).

  **`ColorPicker`** — the saturation area and both sliders mirrored their position into
  state via an effect keyed on values that change every drag frame, always with a new
  object, so each pointermove cost two renders of the whole picker subtree. `position` is
  now derived during render from the parsed colour that was already the source of truth.
  The `[]`-deps `handleChange` workaround is gone with it: the stale-setter hazard it
  papered over is fixed in `useUncontrolled`, and an honest dep list keeps its identity
  stable — which matters, because it is a dep of the `ColorPickerContext` memo.

  **`Slider` / `RangeSlider` / `AngleSlider`** — marks were re-mapped inline in the render
  body, 2–3 styled components each with no memo, so a 20-mark slider rebuilt ~45 Tamagui
  frames per pointermove. Marks moved into a memoized layer: `Slider` memoizes per mark
  with the filled span passed as two numbers (so no unstable function prop breaks
  equality) and only the 0–1 marks whose filled state actually flips re-render;
  `AngleSlider` has no value-dependent mark styling, so its whole mark subtree is skipped.
  A parent re-render that doesn't touch the value (hover, focus, label bubble) now skips
  the marks entirely. The per-move `onChange` contract is unchanged.

  **Smaller ones** — `Combobox.OptionsDropdown` built a `Set` for the selected values
  instead of `value.includes(…)` per option (500 options × 50 selected: 25k string
  compares per recompute → 500 hash lookups); the single-select path still uses a scalar
  compare and allocates nothing. `Accordion` memoized its per-item context value, which
  was an inline object literal and so re-rendered every `Accordion.Control`/`Panel` on any
  item render. `SegmentedControl` compares the measured layout before setting state, so an
  `onLayout` re-fire from a parent reflow or a font change no longer re-renders the root
  and every segment with an identical value.

  No public API changes. `Table`'s internal `__index`/`__first` props are gone (no test or
  consumer asserted on them) and `Tree` gained an exported `getCheckedNodesMap` helper.

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

- 5f44d20: Stop the shared per-render path from doing work no component asked for

  These paths run for every one of the ~103 components on every render, so the
  waste multiplied. None of it is behavioural — the rendered output is unchanged.

  **`useGradient` read the theme for a feature that was off.** `useTheme()` was
  called before the `if (!gradient) return` bail, so `Button`, `ActionIcon`,
  `Badge`, `Avatar`, `CloseButton`, `ThemeIcon`, `Pill` and `Alert` each paid a full
  `useThemeWithState` — `useId` + `useRef` + `useReducer` + a dependency-less
  `useEffect` that fires after every render + snapshot bookkeeping — unless the
  caller actually passed `variant="gradient"`. On web the theme was never needed at
  all: a `$token` resolves to its CSS custom property by pure string transform, so
  there is now a theme-free `theme-color-web.ts` and the web path reads no context.
  On native the theme read moved into `<GradientLayer>`, which only mounts when a
  gradient exists. The bail path returns a frozen constant instead of two fresh
  objects.

  **`ControlIconProvider` made every icon-bearing control a theme subscriber.** It
  resolved its icon colour through `useTheme()` once per control _section_, so a
  `Button` with both a left and a right section instantiated two on top of its own
  frame. On native that read trips Tamagui's `track()`, which registers the instance
  in the global theme-listener map — 100 icon sites meant 100 listener entries and
  100 dependency-less effect fires per render pass. Web now resolves the token to
  `var(--…)` with no hook; native keeps the theme read, behind a new
  `use-icon-color` split.

  **`renderTextChild` cloned every child to answer a question it already knew.**
  `React.Children.toArray` flattens _and clones_ each element child, and the common
  branch then discarded the whole cloned array — for containers with element
  children (`Center`, `Modal.Body`, `Card`) that was pure waste on every render, and
  for a single string child it allocated an array to learn what `typeof children`
  already told it. Now: string/number, single-element and nullish children take fast
  paths before `toArray`, and the array scan is one loop instead of `some` + `every`.
  28 call sites.

  **`slotStyles` allocated for the case where there is nothing to do.** Called at
  ~105 sites, several of them per item (`Tree`'s memoized `TreeNode`, `TreeSelect`,
  and 6× each in `TagsInput`/`MultiSelect`/`ColorPicker`), it built an object plus
  two closures on every call even when no `styles` prop was passed. The empty case
  now returns one shared frozen accessor, and `merge` only builds a new object when
  both sides are present — which also means the props spread onto a part keep a
  stable identity, so downstream `React.memo` and Tamagui prop comparisons can bail
  out. (Verified safe: no call site mutates an accessor result.) The dev-only
  known-slot `Set` is cached in a `WeakMap` keyed by the `*_SLOT_KEYS` constant
  instead of being rebuilt per render.

  **`Button`'s slot collection re-walked its children every render.** An inline
  options literal, a `visit` closure, a per-child linear scan of the slot registry
  and a rest-spread per marker child — and because the pooled array became the
  label's children, the label's `children` identity changed on every render even for
  `<Button>Save</Button>`. Marker matching is now a `Map` built once in
  `defineSlots`, the options object is a module constant, and a non-array child with
  no marker skips collection entirely.

  **`useSlotTextWrapper` was remounting the text it exists to keep mounted.** The
  memo keyed on `slotProps` _identity_, but the documented usage is an inline
  `styles={{ label: { … } }}` — a fresh object every render. So the wrapper was a new
  element _type_ each render and React unmounted and remounted the wrapped text,
  which is precisely the failure the hook was written to prevent, affecting only the
  callers who used the feature. Slot props are now compared by shallow value.

  **Objects that never varied are now module constants.** `webButton()`,
  `webButtonTextReset()` and `Button`'s native id props were rebuilt per render even
  though `isWeb` is fixed at build time; `UnstyledButton` also built a fresh style
  _array_ every render, which defeated Tamagui's style caching. `Group`'s `grow`
  style and the `Tooltip`/`HoverCard` trigger-clone handler bundles are memoized, so
  cloning a child no longer hands it a new style object and break its `React.memo`
  — which is what was re-rendering memoized icons inside a `<Group grow>`.

  **`Paper` and `Typography` dropped a component layer each.** Both were
  `.styleable` wrappers that added zero or one prop, so they are now plain `styled()`
  exports.

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
- Updated dependencies [5c6d758]
  - @knitui/icons@0.6.0
  - @knitui/core@0.6.0
  - @knitui/hooks@0.6.0

## 0.5.0

### Patch Changes

- 4f7830c: Align published dependency ranges with Expo SDK 57

  The SDK pins exact versions for its native modules, and several of our
  published ranges had drifted from that set. Consumers on SDK 57 were
  resolving versions the SDK's prebuilt binaries don't expect, which fails at
  runtime rather than at build time.

  - `@knitui/components`: `expo-image` `~57.0.0` → `~57.0.1`
  - `@knitui/core`: `@tamagui/*` `^2.3.0` → `^2.4.6`
  - `@knitui/media`: `expo-audio` `~57.0.0` → `~57.0.2`, `expo-video` `~57.0.0` → `~57.0.1`
  - `@knitui/plugins`: `@tamagui/babel-plugin` `^2.3.0` → `^2.4.6`

  `@knitui/graphics` is a minor rather than a patch because its
  `@shopify/react-native-skia` peer is an exact pin and moves `2.6.6` → `2.6.2`,
  which is the version Expo SDK 57 expects. Consumers currently pinned to
  `2.6.6` will need to move to `2.6.2` to satisfy the peer.

- Updated dependencies [4f7830c]
  - @knitui/core@0.5.0
  - @knitui/hooks@0.5.0
  - @knitui/icons@0.5.0

## 0.4.0

### Minor Changes

- 5b5a3e0: Add `VirtualList` and reanimated-native scroll offsets
  - **`VirtualList`** — a new windowed list for large datasets. Renders only the
    visible slice (plus overscan) over `ScrollArea`, supports variable row heights
    via per-type average sizing, and exposes an imperative handle
    (`scrollToIndex` / `scrollToOffset`). One cross-platform component file over a
    platform-free measurement engine.
  - **`ScrollArea`** — new `scrollValueX` / `scrollValueY` props mirror the live
    scroll offset into caller-owned reanimated shared values on the UI thread, so
    parallax and collapsing-header animations run with no JS-thread round-trip.
    Native only; the web ScrollArea ignores them.
  - **`UnstyledButton`** — now carries the same reduced-motion-aware press-scale
    affordance as `Button` / `ActionIcon` / `Chip`, so custom controls built on it
    no longer read as dead on press. Descendant `pressStyle` merges with it.
  - **`Image`** — fix a crash when passing `transition` on web. expo-image's
    numeric `transition` collided with Tamagui v2's reserved animation prop, which
    marked the image animated and made the web driver call `getComputedStyle` on a
    non-DOM host. The value is now forwarded to the backend under an internal
    alias.

### Patch Changes

- @knitui/core@0.4.0
- @knitui/hooks@0.4.0
- @knitui/icons@0.4.0

## 0.3.0

### Minor Changes

- 89f8c36: chore(deps): move the supported baseline to Expo SDK 57 and Next.js 16.

  Upgrades the kit's external toolchain to the latest majors:
  - **Expo SDK 56 → 57** — `react-native` 0.85.3 → 0.86.0, `react-native-reanimated`
    4.3.1 → 4.5.0, `react-native-worklets` 0.8.3 → 0.10.0,
    `react-native-gesture-handler` ~2.31 → ~2.32, `babel-preset-expo` → ^57, and all
    `expo-*` packages to their SDK 57 versions. React stays 19.2.3.
  - **Next.js 15 → 16** — the web app opts back into the webpack builder (`next build
--webpack`) so the Tamagui compiler plugin keeps running; Turbopack has no Tamagui
    loader yet.

  Consumer-facing dependency changes:
  - `@knitui/components` now depends on `expo-image` `~57.0.0` (was a stale `~2.4.1`),
    which also resolves the Expo SDK 56 Android startup crash consumers hit from the
    old pin.
  - `@knitui/media` now depends on `expo-audio` / `expo-video` `~57.0.0`.

  The two version-pinned pnpm patches (`expo-audio`, `expo-modules-core`) were migrated
  to their SDK 57 releases and still apply. Everything typechecks and builds (28/28 turbo
  tasks, the Expo app `tsc`, and the Next.js 16 production build).

### Patch Changes

- @knitui/core@0.3.0
- @knitui/hooks@0.3.0
- @knitui/icons@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0
  - @knitui/hooks@0.2.0
  - @knitui/icons@0.2.0

## 0.1.1

### Patch Changes

- 407bef6: UnstyledButton: reset the semantic `<button>`'s user-agent `text-align: center` on web so text content is left-aligned, matching native (React Native starts pressable text at the inline edge). The same tree no longer diverges across platforms. The reset is web-only and applied ahead of the caller's `style`, so anyone who wants centred content still overrides it explicitly. Internally the button-host wiring now reuses the shared `webButton()` helper (correctly a no-op on native) instead of hardcoding `render="button"`.
  - @knitui/core@0.1.1
  - @knitui/hooks@0.1.1
  - @knitui/icons@0.1.1
