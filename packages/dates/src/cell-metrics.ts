// Shared cell-size ladders for every calendar grid component (Day, WeekdaysRow,
// Month, PickerControl). ONE source of truth for the `xxs…xxl → width/font`
// ladders that were previously duplicated per component. INTERNAL — deliberately
// NOT re-exported from the public `src/index.ts` barrel.
//
// Mirrors @mantine/dates' control sizing: a square cell width per size and a
// proportional label font (≈ size / 2.8). PickerControl derives its wider
// month/year cell from `CELL_WIDTH` too (Mantine: width = height * 7/3).
//
// ─── THEMING: the accent palette-ramp convention (read before styling a cell) ───
// Accent colour is ALWAYS the Tamagui `theme=` prop (e.g. `<DatePicker theme="blue" />`)
// — there is NO Mantine-style `color` prop, and palette hex is NEVER hard-coded.
// Every cell (Day, PickerControl, MiniCalendar days, TimeGrid/TimeControlsList
// controls) reads the ACTIVE theme's ramp with this fixed mapping so they don't
// drift:
//   $color9            solid accent — selected cell background
//   $color1            contrast text ON the solid accent (selected label)
//   $color4 / $color5  subtle accent tint — in-range background
//   $color2 / $color3  hover / press background (hoverStyle / pressStyle)
//   $color7            accent borders (e.g. the "today" outline)
//   $color11           accent text (unselected-but-accented label)
//   $background / $color / $borderColor   semantic neutrals (idle cell)
// States use `hoverStyle`/`pressStyle`/`focusVisibleStyle` + a `disabled` variant —
// never runtime hover state, never a Pressable wrapper.

/** Calendar grid size — the kit's shared control size scale. */
export type CalendarSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/** Square column/cell width per `size`, shared so every grid's columns align. */
export const CELL_WIDTH: Record<CalendarSize, number> = {
  xxs: 24,
  xs: 30,
  sm: 36,
  md: 42,
  lg: 48,
  xl: 54,
  xxl: 60,
};

/** Cell label font per `size` (≈ size / 2.8, matching the day label). */
export const CELL_FONT: Record<CalendarSize, number> = {
  xxs: 11,
  xs: 13,
  sm: 14,
  md: 15,
  lg: 17,
  xl: 19,
  xxl: 21,
};

/** Gap inserted between cells/rows when `withCellSpacing` is on. */
export const CELL_SPACING = 2;
