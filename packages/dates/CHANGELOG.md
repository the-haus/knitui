# @knitui/dates

## 0.8.0

### Patch Changes

- Updated dependencies [8de27f7]
- Updated dependencies [85594a1]
  - @knitui/core@0.8.0
  - @knitui/components@0.8.0
  - @knitui/hooks@0.8.0

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

- Updated dependencies [edcec97]
- Updated dependencies [15a329c]
- Updated dependencies [59d065b]
  - @knitui/components@0.7.0
  - @knitui/core@0.7.0
  - @knitui/hooks@0.7.0

## 0.6.1

### Patch Changes

- caa2d7e: Point every `types` entry at the built declarations (`lib/typescript/*.d.ts`) instead of at the shipped TypeScript source.

  These packages ship their source and resolve it at runtime (`source`, `react-native` and `default` all still point into `src`), but `types` pointed there too — so a consumer's `tsc` typechecked the kit's raw source as part of their own build. That is slow, and it surfaces errors that depend on the consumer's own compiler settings, since `skipLibCheck` does not apply to `.ts` source files. Resolving `types` to real `.d.ts` files makes declaration handling both faster and inert.

  `@knitui/icons` also adds `lib/typescript` to `files`; its declarations were previously built but never published, so the new `types` path would not have existed in the tarball.

  `@knitui/emoji` deliberately keeps `types` on its source: its per-emoji modules ship as pre-generated `.js`/`.d.ts` pairs inside `src`, which `tsc` does not re-emit, so its built barrel cannot resolve them.

- Updated dependencies [487dce4]
- Updated dependencies [ffc254e]
- Updated dependencies [ffb4133]
- Updated dependencies [caa2d7e]
  - @knitui/components@0.6.1
  - @knitui/core@0.6.1
  - @knitui/hooks@0.6.1

## 0.6.0

### Patch Changes

- 5f44d20: Stop the calendar grids re-deriving every cell on every render

  The package had no `useMemo`, `useCallback` or `React.memo` anywhere outside
  `use-dates-context`, so every render re-derived the entire month grid from scratch —
  and a web hover move is a render, because it updates `hoveredDate` on the picker
  root. Counted with a dayjs-prototype shim, one default `<DatePicker type="range">`
  (5-week month, 35 cells) cost **2,747 dayjs instances and 194 `format()` calls to
  mount, and 2,442 / 193 to cross a single cell with the pointer**. Each instance is a
  `new Date` plus an object; `format` with `MMMM` hits the locale table and runs a
  regex replace. Dragging across a row fires seven of those in ~150 ms.

  Per-render cost after this change, same measurements:

  | scenario                                 | dayjs before |   after | `format` before |   after |
  | ---------------------------------------- | -----------: | ------: | --------------: | ------: |
  | `Month` re-render (35 cells)             |          724 |  **81** |             187 |   **8** |
  | `DatePicker type="range"` mount          |        2,747 | **233** |             194 |  **49** |
  | `DatePicker type="range"` one hover move |        2,442 |  **68** |             193 |  **13** |
  | …with `numberOfColumns={2}`              |        6,442 | **646** |             523 | **134** |

  **Redundant per-cell prop getters.** `getDateInTabOrder` invoked `getDayProps(date)`
  twice for all 42 dates (once for `disabled`, once for `selected`) and `Month`'s cell
  loop invoked it a third time. `DatePicker` wires that getter to `useDatesState`'s
  `getControlProps`, which for a range picker runs `rangeView.some(isSame)` +
  `isDateInRange` + `isFirstInRange` + `isLastInRange` — ~20 dayjs instances a call. So
  ~1,400 instances went on deciding which single cell gets `tabIndex={0}`. The getter is
  now resolved once per date into a per-render `Map` shared by both consumers. Same fix
  in `MonthsList`/`YearsList` via `getMonthInTabOrder`/`getYearInTabOrder`.

  **String comparisons instead of dayjs round-trips.** `isSameMonth`,
  `isBeforeMaxDate`, `isAfterMinDate`, `isInRange` and `useDatesState`'s
  `isSame(date, level)` all took values that are ALREADY zero-padded `YYYY-MM-DD` —
  the package's canonical shape — and parsed them back into dayjs to compare. Fixed-width
  big-endian date strings sort chronologically, so a prefix compare is exact and
  allocation-free: `isInRange` went from ~11 instances plus a `[...range].sort()` per
  call (up to 3 calls per cell) to zero. Every one keeps its dayjs path as a fallback for
  `Date` objects and non-canonical strings, and each was verified against the original
  implementation over a dense input space (leap-year and month/year boundaries, both DST
  transitions; ~91k combinations for `isInRange`).

  **Memoized grid derivation.** `getMonthDays` (~70 instances + 35 `format` calls) is
  memoized behind a small module-level LRU, so navigating back to a visited month is
  free. The selection-INDEPENDENT per-cell facts — outside/hidden/weekend/disabled and
  each cell's `aria-label` — move into one `useMemo`; only `getDayProps` and the roving
  `tabIndex`, which read live state, stay in the loop. Same treatment for the 12-month
  and 10-year levels, whose labels are fixed for the whole year/decade but were
  re-formatted per cell per render.

  **Memoized cells.** Cell rendering moved into an internal memoized component (the
  pattern `Combobox`'s `OptionRow` and `TagsInput`'s chips already use) with a comparator
  that looks one level into plain-object props — necessary because `getDayProps(date)`
  and the `styles` slot accessors return fresh objects holding unchanged booleans. The
  grid's `__`-prefixed callbacks are stabilised with `useCallbackRef` so the comparator
  can bail. **A hover move now re-renders 1 cell instead of 35**, which also stops 42
  refs detaching and reattaching, re-running `__getDayRef` and rebuilding the level
  group's `daysRefs` matrix, on every render.

  **`Day` no longer computes a label that is thrown away.** `Month` always passes its own
  `aria-label` through `...rest`, spread after `Day`'s default — so the `day.locale(…)
.format("D MMMM YYYY")` on the `Day` side was discarded 42 times per render. The
  fallback is now built only when there is no explicit label (which also means native
  `accessibilityLabel` announces the custom label instead of the generic date). The
  today check skips its work unless `highlightToday` is set, and reads three calendar
  fields off the existing instance rather than allocating a `Date` plus three dayjs
  clones per cell.

  **`TimePicker` dropdown.** A `24h`-with-seconds dropdown renders 24 + 60 + 60 controls,
  and every keystroke in the segment inputs updates `controller.values`, rebuilding all
  144 plus their range arrays. The ranges are memoized, `TimeControl` is `React.memo`'d,
  and `onSelect` is stabilised so the compare can hold: an unrelated re-render now
  re-renders **0** controls (was all 144) and changing a column's value re-renders **2** —
  the one losing `active` and the one gaining it.

  No public API changes — `Day`'s and `Month`'s prop contracts are untouched, and the
  memoized cell is internal. `getMonthDays`, `isSameMonth`, `isInRange` and friends keep
  their exact signatures and return values.

  **`MonthsList` and `YearsList` got the memoized cell too.** `Month` had a memoized day
  cell; the other two grids did not, so a RANGE month/year picker — which updates
  `hoveredDate` on every web hover move — re-rendered all 12/10 `PickerControl` leaves
  and detached/reattached every ref (re-running `__getControlRef` and rebuilding the
  refs matrix) for a change that moved two cells' background colour. Both now use the
  same pattern, with the four `__`-prefixed grid callbacks stabilised via
  `useCallbackRef` so the compare can actually hold.

  The one-level-deep memo comparator is now shared by all three grids in
  `internal/are-cell-props-equal` (with tests) rather than living privately in `Month`.
  It stays deliberately shallow: anything it cannot prove equal — a nested object, a
  fresh function — reads as changed and simply re-renders the cell.

  **`WeekdaysRow` rebuilt its 7 labels on every render.** `getWeekdayNames` costs ~22
  dayjs instances plus 7 locale-table formats, and it ran unmemoized inside `Month` — so
  it was paid on every hover frame, times `numberOfColumns`. Now memoized on the locale,
  format and first-weekday.

- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5c6d758]
  - @knitui/components@0.6.0
  - @knitui/core@0.6.0
  - @knitui/hooks@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [4f7830c]
  - @knitui/components@0.5.0
  - @knitui/core@0.5.0
  - @knitui/hooks@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [5b5a3e0]
  - @knitui/components@0.4.0
  - @knitui/core@0.4.0
  - @knitui/hooks@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [89f8c36]
  - @knitui/components@0.3.0
  - @knitui/core@0.3.0
  - @knitui/hooks@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0
  - @knitui/components@0.2.0
  - @knitui/hooks@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [407bef6]
  - @knitui/components@0.1.1
  - @knitui/core@0.1.1
  - @knitui/hooks@0.1.1
