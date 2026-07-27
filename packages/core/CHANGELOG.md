# @knitui/core

## 0.6.1

### Patch Changes

- ffc254e: Keep the Tamagui module augmentation reachable from the built declarations.

  `config/config.ts` carries the `declare module "@tamagui/core"` augmentation that teaches Tamagui this kit's token and shorthand vocabulary (`maw`, the `$token` unions). Nothing else on the barrel imported that module, so once consumers resolve the package by its built `index.d.ts` the augmentation was unreachable and every shorthand silently disappeared. A type-only re-export pulls it back in without eagerly evaluating the config at module load.

- caa2d7e: Point every `types` entry at the built declarations (`lib/typescript/*.d.ts`) instead of at the shipped TypeScript source.

  These packages ship their source and resolve it at runtime (`source`, `react-native` and `default` all still point into `src`), but `types` pointed there too — so a consumer's `tsc` typechecked the kit's raw source as part of their own build. That is slow, and it surfaces errors that depend on the consumer's own compiler settings, since `skipLibCheck` does not apply to `.ts` source files. Resolving `types` to real `.d.ts` files makes declaration handling both faster and inert.

  `@knitui/icons` also adds `lib/typescript` to `files`; its declarations were previously built but never published, so the new `types` path would not have existed in the tarball.

  `@knitui/emoji` deliberately keeps `types` on its source: its per-emoji modules ship as pre-generated `.js`/`.d.ts` pairs inside `src`, which `tsc` does not re-emit, so its built barrel cannot resolve them.

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

- 5f44d20: Memoize `.styleable()` output so a parent render stops re-rendering the whole kit

  Tamagui memoizes the component `styled()` returns unconditionally
  (`createComponent.tsx`: `res = React.memo(res)`). It does **not** memoize the
  component `.styleable()` returns — that is gated behind a flag:

  ```js
  // @tamagui/web/src/createComponent.tsx:1906
  if (extendedConfig.memo || process.env.TAMAGUI_MEMOIZE_STYLEABLE) {
    out = React.memo(out);
  }
  ```

  Every public component in this kit is `styled(...).styleable(...)`, and the
  `.styleable()` HOC **is** the exported component — 155 sites across
  `@knitui/components` (139) and `@knitui/dates` (16). The kit passed neither
  `memo` nor the env var, so the kit's own layer was the only unmemoized layer in
  the stack: any parent state change re-rendered every kit component in the
  subtree even when not one of its props had changed.

  Measured in jsdom on a 300-instance tree (100 rows × `Button` + `Badge` +
  `Text`), one parent `setState` with **identical** child props, median of 21 runs:

  |        | median update |
  | ------ | ------------- |
  | before | 86.9 ms       |
  | after  | 3.8 ms        |

  ≈23× on that shape. With props that genuinely change every render (an inline
  `onPress` per row) the win narrows to the low tens of percent — memo then pays
  for a comparison it cannot skip on. It is not meaningfully negative in either
  case, because the inner frame is _already_ memoized, so prop-equality skipping is
  already how this stack behaves.

  **`@knitui/core` now exports its own `styled`** (`src/styled.ts`), which is
  Tamagui's factory plus `staticConfig.memo = true` on the frame it returns.
  `styleable()` reads the flag off `extendStyledConfig()`, which spreads the
  frame's own `staticConfig` first and the per-call `options.staticConfig` second —
  so setting it on the frame reaches every `.styleable()` call from one place,
  including components added later, and a call site can still opt out explicitly
  with `.styleable(render, { staticConfig: { memo: false } })` because its spread
  wins. `styled()` does not forward a `memo` key into `staticConfig` (verified), so
  this is a post-hoc assignment rather than an option passed through, and
  `src/essentials.ts` no longer re-exports the raw Tamagui `styled` — there is one
  `styled` on the `@knitui/core` surface.

  `memo` is read in exactly **one** place in all of `@tamagui/web` — the branch
  quoted above — so setting it has precisely that one effect and no other
  behavioural change. The env var in the same condition is not a shipping option:
  it is read at module scope in the consumer's bundle, and neither Metro nor
  webpack reliably defines it.

  Verified: the full suite is green (27/27 packages; `@knitui/components` 120
  suites / 1606 tests, `@knitui/dates` 49 / 853), the Next production build
  succeeds, and the extracted CSS is **byte-identical** to before (69,935 B) — so
  the Tamagui compiler treats the wrapped factory exactly as it did the raw one.

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

## 0.4.0

## 0.3.0

## 0.2.0

### Minor Changes

- 737463e: Add the theme builder to `@knitui/core`, so consumers can brand and extend the
  kit's theme without editing source. New exports:
  - `createTheme(options)` — build a fully-configured Tamagui config from brand
    inputs. Every option is optional and layers onto the kit's stock defaults:
    `brand` / `neutral` / `accents` palettes (a hex seed with an auto-derived
    12-step ramp, a `@tamagui/colors` name, `{ light, dark }` seeds, or explicit
    ramps), `includeDefaultAccents` / `includeTamaguiColors`, `radius` / `space` /
    `size` / `fontSizes` scale presets or per-step overrides, `zIndex`, raw
    `colors`, `fonts`, `breakpoints` / `media`, `animations` / `shorthands` /
    `settings`, and `themeBuilder` / `themes` / `tamagui` escape hatches.
  - `extendTheme(...optionSets)` — deep-merge option sets left-to-right, then build.
  - `mergeThemeOptions(...optionSets)` — same merge, returns the options (no build).
  - `defineTheme(options)` — identity helper that preserves literal types.
  - `themePresets` — curated starting points (`minimal` / `vibrant` /
    `professional`).
  - Palette utilities: `resolvePalette`, `rampFromHex`, `isColorName`, `isHex`,
    `TAMAGUI_COLOR_NAMES`, the scale presets, and `validateThemeOptions`.

  Options are strictly validated (unknown option / scale step / preset, malformed
  hex, unknown color name, wrong-length ramp, reserved accent name, undefined
  `defaultFont`) with actionable "did you mean …?" messages.

  `<Provider>` now accepts an optional `config` prop (falls back to the built-in
  config) so builder output can be applied. The existing stock config is unchanged.

### Patch Changes

- c346356: Add `@knitui/mediaquery`: cross-platform, SSR-safe media queries and responsive
  breakpoints for web (Next.js) and React Native (Expo). Ships `useMediaQuery`
  (matchMedia string or structured descriptor), `useBreakpoint` /
  `useBreakpointValue` over the shared `@knitui/core` breakpoint scale, an optional
  `MediaQueryProvider` with `User-Agent` device seeding for SSR, and a pure query
  engine (`parseMediaQuery` / `matchesQuery` / `queryToString`). `@knitui/core` now
  re-exports its `breakpoints` scale.

## 0.1.1
