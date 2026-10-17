// Shared cell-size ladders for every calendar grid component (Day, WeekdaysRow,
// Month, PickerControl, CalendarHeader, MiniCalendar, TimeGrid, TimeControlsList,
// TimePresets). ONE source of truth: `CELL_METRICS` below — the calendar twin of
// components' `controlMetrics` — and every per-part variant map is DERIVED from it
// at module load into a plain, exact-key, literal-shaped object (Tamagui v3's
// fastest variant shape: static bodies, per-clause friendly, compiler-evaluable).
// INTERNAL — deliberately NOT re-exported from the public `src/index.ts` barrel.
//
// Why raw pixels, not control-height tokens: a calendar cell is not a control.
// It mirrors @mantine/dates' grid sizing (square cell per size, label ≈ size / 2.8),
// so a 7-column month at `md` is 7 × 42 = 294px. `controlMetrics`' heights
// (18…96) would make an `xxl` month 672px wide. The KEY scale (`xxs…xxl`,
// default `md`) is the kit's; only the numbers are calendar-specific.
//
// ─── THEMING: the accent palette-ramp convention (read before styling a cell) ───
// Accent colour is ALWAYS the Tamagui `theme=` prop (e.g. `<DatePicker theme="blue" />`)
// — there is NO Mantine-style `color` prop, and palette hex is NEVER hard-coded.
// Every cell reads the ACTIVE theme's ramp with this fixed mapping so they don't
// drift (v3 flat values — conditions live inside the property they change):
//   color9 hover:color10 press:color8   solid accent — selected cell background
//   color1                               contrast text ON the solid accent
//   color4 hover:color5 press:color5     subtle accent tint — in-range background
//   transparent hover:color2 press:color3  idle cell background
//   color7                               accent borders (the "today" outline)
//   color11                              muted / accented label text
//   background / color / borderColor     semantic neutrals
// States are `hover:` / `press:` clauses + a `disabled` variant — never runtime
// hover state, never a Pressable wrapper. `cursor` is a `web:` clause (dropped on
// native by the style engine, no `isWeb` branching at module load).

/** Calendar grid size — the kit's shared control size scale. */
export type CalendarSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/** The size keys in ascending order. */
export const CALENDAR_SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

/**
 * THE canonical calendar-cell table. Every column is a raw px number.
 *
 *  key   cell  font  picker(7/3)  header  icon
 *  xxs    24    11       56          9      13
 *  xs     30    13       70         12      17
 *  sm     36    14       84         14      20
 *  md     42    15       98         16      23
 *  lg     48    17      112         18      26
 *  xl     54    19      126         21      30
 *  xxl    60    21      140         23      33
 *
 * `cell` is the square day cell (and the header control / column width), `font`
 * the cell label (≈ cell / 2.8), `picker` the wide month/year cell
 * (Mantine: width = height × 7/3, so a 3-column grid spans a 7-column month),
 * `header` the level label (≈ cell / 2.6) and `icon` the chevron glyph (≈ 55%).
 */
export const CELL_METRICS = {
  xxs: { cell: 24, font: 11, picker: 56, header: 9, icon: 13 },
  xs: { cell: 30, font: 13, picker: 70, header: 12, icon: 17 },
  sm: { cell: 36, font: 14, picker: 84, header: 14, icon: 20 },
  md: { cell: 42, font: 15, picker: 98, header: 16, icon: 23 },
  lg: { cell: 48, font: 17, picker: 112, header: 18, icon: 26 },
  xl: { cell: 54, font: 19, picker: 126, header: 21, icon: 30 },
  xxl: { cell: 60, font: 21, picker: 140, header: 23, icon: 33 },
} as const satisfies Record<CalendarSize, Record<string, number>>;

/** Square column/cell width per `size`, shared so every grid's columns align. */
export const CELL_WIDTH: Record<CalendarSize, number> = ladder((k) => CELL_METRICS[k].cell);

/** Cell label font per `size` (≈ size / 2.8, matching the day label). */
export const CELL_FONT: Record<CalendarSize, number> = ladder((k) => CELL_METRICS[k].font);

/** Gap inserted between cells/rows when `withCellSpacing` is on. */
export const CELL_SPACING = 2;

/** Build one exact-key `xxs…xxl` table at module scope. */
function ladder<T>(body: (key: CalendarSize) => T): Record<CalendarSize, T> {
  const out = {} as Record<CalendarSize, T>;
  for (const key of CALENDAR_SIZES) out[key] = body(key);
  return out;
}

// ── Derived variant maps (static exact-key bodies; spread only at module scope) ──

/**
 * Square cell. `minHeight` mirrors `height` so it acts as a FLOOR: when
 * `fullWidth` swaps `height` to `"100%"` to fill a constrained calendar height,
 * an UNCONSTRAINED parent resolves that percentage to "auto" and the cell would
 * otherwise collapse to its label's line-height.
 */
export const cellSquareVariant = ladder((k) => ({
  width: CELL_METRICS[k].cell,
  height: CELL_METRICS[k].cell,
  minHeight: CELL_METRICS[k].cell,
}));

/** The wide month/year cell (`PickerControl`), with the same `minHeight` floor. */
export const pickerCellVariant = ladder((k) => ({
  width: CELL_METRICS[k].picker,
  height: CELL_METRICS[k].cell,
  minHeight: CELL_METRICS[k].cell,
}));

/** Cell height only (header level control). */
export const cellHeightVariant = ladder((k) => ({ height: CELL_METRICS[k].cell }));

/** Cell min-height only (time-grid controls grow with their label). */
export const cellMinHeightVariant = ladder((k) => ({ minHeight: CELL_METRICS[k].cell }));

/** Column width only (week-number column). */
export const cellWidthVariant = ladder((k) => ({ width: CELL_METRICS[k].cell }));

/** Column min-width only (mini-calendar days, example options). */
export const cellMinWidthVariant = ladder((k) => ({ minWidth: CELL_METRICS[k].cell }));

/** Cell label font. */
export const cellFontVariant = ladder((k) => ({ fontSize: CELL_METRICS[k].font }));

/** Weekday header column: cell width + label font, so it lines up with the days. */
export const weekdayCellVariant = ladder((k) => ({
  width: CELL_METRICS[k].cell,
  fontSize: CELL_METRICS[k].font,
}));

/** Header level label font. */
export const headerFontVariant = ladder((k) => ({ fontSize: CELL_METRICS[k].header }));

/** Chevron glyph font. */
export const iconFontVariant = ladder((k) => ({ fontSize: CELL_METRICS[k].icon }));
