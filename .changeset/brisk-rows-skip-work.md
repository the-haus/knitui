---
"@knitui/components": patch
---

Stop hot components re-rendering their whole subtree on every keystroke, drag frame and scroll sample

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
