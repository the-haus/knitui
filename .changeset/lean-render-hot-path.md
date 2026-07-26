---
"@knitui/components": patch
"@knitui/core": patch
---

Stop the shared per-render path from doing work no component asked for

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
