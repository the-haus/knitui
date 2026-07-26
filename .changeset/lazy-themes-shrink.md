---
"@knitui/core": minor
"@knitui/components": minor
"@knitui/mediaquery": patch
---

Cut the shipped theme suite from 440 themes to 22, and stop the mediaquery hooks re-parsing / re-rendering per frame

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
