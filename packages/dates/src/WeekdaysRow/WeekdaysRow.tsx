// ───────────────────────────────────────────────────────────────────────────
// WeekdaysRow — the localized weekday header row for a calendar month grid.
//
// Mirrors `@mantine/dates`' `WeekdaysRow` API (props, defaults, `weekday`/
// `weekdaysRow` style slots) but is built on `@knitui/components` (`Box`/`Text`) +
// `@knitui/core` (`styled`/`createStyledContext`/slot sugar) + dayjs — NEVER HTML
// `<tr>`/`<th>`, so it renders on web AND native from one source. The labels are
// muted neutral text (`$color11`); there is NO Mantine-style `color` prop.
//
// This is a DISPLAY component (no selection, no min/max, no marker slots), so the
// checklist's controlled-value (#8), bounds (#10) and marker-slot (#6) rules are
// N/A. Column width/font scale on the shared `cell-metrics` ladders (#3) so the
// header columns line up with the `Day` cells below; `fullWidth` is a boolean
// VARIANT (not a per-render spread) so the web optimiser has nothing dynamic to
// fold (#15). a11y is set on both axes (#11): web `role="row"`/`role="columnheader"`
// plus a native `accessibilityRole` counterpart.
// ───────────────────────────────────────────────────────────────────────────
import { useMemo } from "react";

import { Box, Text } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  isWeb,
  slotStyles,
  type SlotStyles,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { type CalendarSize, CELL_FONT, CELL_WIDTH } from "../cell-metrics";
import { useDatesContext } from "../DatesProvider";
import type { DateLabelFormat, DayOfWeek } from "../types";
import { getWeekdayNames } from "./get-weekdays-names/get-weekdays-names";

/** Weekday header size — the kit's shared control size scale (mirrors `Day`). */
type WeekdaySize = CalendarSize;

// ── 2. Shared context ───────────────────────────────────────────────────────
// One `createStyledContext` carries `size` down to each `Weekday` label so they
// share the SAME size the consumer set on the root without prop-drilling — the
// same mechanism `Day`/`Month` use.
const WeekdaysRowContext = createStyledContext<{ size: WeekdaySize }>({ size: "md" });

// ── 3. Sizing derived from the shared ladders ─────────────────────────────────
// Column width matches `Day`'s square `size` ladder so the header columns line up
// with the day grid below; font tracks the same proportional ladder (≈ size / 2.8).
// The numeric ladders live in `../cell-metrics` (`CELL_WIDTH`/`CELL_FONT`) so every
// grid component stays in lockstep. Raw ladder values (resolve at module-load) —
// never `getTokenValue`, which needs the live config.
const weekdayCellVariant = {
  xxs: { width: CELL_WIDTH.xxs, fontSize: CELL_FONT.xxs },
  xs: { width: CELL_WIDTH.xs, fontSize: CELL_FONT.xs },
  sm: { width: CELL_WIDTH.sm, fontSize: CELL_FONT.sm },
  md: { width: CELL_WIDTH.md, fontSize: CELL_FONT.md },
  lg: { width: CELL_WIDTH.lg, fontSize: CELL_FONT.lg },
  xl: { width: CELL_WIDTH.xl, fontSize: CELL_FONT.xl },
  xxl: { width: CELL_WIDTH.xxl, fontSize: CELL_FONT.xxl },
} as const;

// ── 5. Styled parts ───────────────────────────────────────────────────────────

/** The header row — a flex row, never a `<tr>`. */
const WeekdaysRowFrame = styled(Box, {
  name: "WeekdaysRow",
  context: WeekdaysRowContext,
  flexDirection: "row",
});

/**
 * A single weekday label cell.
 *
 * 4. Colour is a theme-ramp token ONLY: the muted neutral `$color11`, never hex
 *    and never a Mantine-style `color` prop.
 * 15. `fullWidth` stretches each column to an equal share of the row via a boolean
 *     VARIANT (mirrors Mantine's `data-full-width` header behaviour) — not a
 *     per-render dynamic style prop the optimiser could flatten.
 */
const Weekday = styled(Text, {
  name: "Weekday",
  context: WeekdaysRowContext,
  color: "$color11",
  textAlign: "center",
  userSelect: "none",
  fontWeight: "500",

  variants: {
    size: weekdayCellVariant,

    /** Stretch each column to an equal share of the row width. */
    fullWidth: {
      true: { width: "auto", flexGrow: 1, flexBasis: 0 },
    },
  } as const,

  defaultVariants: { size: "md" },
});

// ── 11. Native a11y counterpart ──────────────────────────────────────────────
// Web screen readers are driven by the `role="columnheader"` set at the call site;
// these `accessibility*` props are the NATIVE (VoiceOver/TalkBack) counterpart,
// set side-by-side. On web this is empty — react-native-web would only leak an
// unrecognised `accessibility*` attribute onto the DOM. RN's `accessibilityRole`
// union has no `columnheader` member, so `"header"` is the portable native value.
// The role type is DERIVED from `Weekday`'s own props so it can't drift from what
// the host actually accepts.
type WeekdayA11yRole = NonNullable<GetProps<typeof Weekday>["accessibilityRole"]>;
const COLUMN_HEADER_A11Y: { accessibilityRole?: WeekdayA11yRole } = isWeb
  ? {}
  : { accessibilityRole: "header" };

// ── 7. Per-slot `styles` sugar ──────────────────────────────────────────────
// The kit's ONE styling model is props on the parts. `styles` is thin sugar over
// that: a map from named slot → that part's props, resolved through
// `slotStyles().merge` so precedence is fixed in one place —
//   defaults < styles[slot] < explicit props.
// Slot names mirror Mantine's `weekdaysRow`/`weekday` Styles API names.

/** The named style slots and the styled part each targets. */
export interface WeekdaysRowStyles {
  /** Props for the header row (`.Frame`). */
  weekdaysRow?: GetProps<typeof WeekdaysRowFrame>;
  /** Props for each weekday label cell (`.Weekday`). */
  weekday?: GetProps<typeof Weekday>;
}

const WEEKDAYS_ROW_SLOT_KEYS = [
  "weekdaysRow",
  "weekday",
] as const satisfies readonly (keyof WeekdaysRowStyles)[];

type WeekdaysRowFrameProps = GetProps<typeof WeekdaysRowFrame>;

export interface WeekdaysRowProps extends Omit<WeekdaysRowFrameProps, "size" | "children"> {
  /** Width/font of the header columns. @default 'md' */
  size?: WeekdaySize;

  /** dayjs locale; falls back to `DatesProvider`. */
  locale?: string;

  /** First weekday of the row, `0` (Sunday) … `6` (Saturday). @default `DatesProvider` (1) */
  firstDayOfWeek?: DayOfWeek;

  /** dayjs format for weekday names, or a custom renderer. @default 'dd' */
  weekdayFormat?: DateLabelFormat;

  /** Render a leading `#` heading for the week-number column. @default false */
  withWeekNumbers?: boolean;

  /**
   * Stretch columns to fill the row (matches a full-width `Month`). Coordinates
   * with `Month`'s `fullWidth` so the header aligns with the day grid; mirrors
   * Mantine's `data-full-width` table behaviour. @default false
   */
  fullWidth?: boolean;

  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<WeekdaysRowStyles>;
}

/**
 * The weekday header for a calendar month — 7 localized labels (8 with
 * `withWeekNumbers`, a leading `#`). Built from `Box`/`Text` (never HTML table
 * elements) so it renders on web + native. Reads locale/`firstDayOfWeek` from
 * `DatesProvider` (the consumer `locale`/`firstDayOfWeek` props win). Labels are
 * muted neutral text; offers per-slot `styles` sugar over its parts. Forwards its
 * ref + style props to the row host (the dates norm).
 *
 * a11y: the row is `role="row"`, each label `role="columnheader"`, with native
 * `accessibilityRole` counterparts (`columnheader` on web, `text` on native).
 */
const WeekdaysRowComponent = WeekdaysRowFrame.styleable<WeekdaysRowProps>(
  function WeekdaysRow(props, ref) {
    const {
      size = "md",
      locale,
      firstDayOfWeek,
      weekdayFormat,
      withWeekNumbers = false,
      fullWidth = false,
      styles,
      ...rest
    } = props;

    // 9. Locale + `firstDayOfWeek` come from `DatesProvider` (consumer props win).
    const ctx = useDatesContext();

    const resolvedLocale = ctx.getLocale(locale);
    const resolvedFirstDayOfWeek = ctx.getFirstDayOfWeek(firstDayOfWeek);

    // The 7 labels are a pure function of these three inputs, and building them is
    // not cheap: `getWeekdayNames` spends ~22 dayjs instances (a base date plus, per
    // day, an `add` → `locale` → `format` clone chain) and 7 locale-table lookups.
    // `Month` renders this row unconditionally, so unmemoized it was rebuilt on
    // every grid render — including the ones caused by nothing but a web hover
    // moving one cell over (`hoveredDate` lives above the whole calendar), ×
    // `numberOfColumns`. Memoized on the resolved primitives, a hover frame reuses
    // the labels and only a real locale/format/first-day change rebuilds them.
    //
    // Deliberately a per-instance `useMemo` and NOT a module-level cache (the
    // pattern `../internal/month-days-cache.ts` uses for the day grid): the labels
    // are only pure for a WEEKDAY-shaped format. `getWeekdayNames` derives its base
    // date from `dayjs()` — today — so a date-bearing `weekdayFormat` (or a function
    // renderer, whose identity is not a usable cache key) would produce output that
    // a process-lifetime cache could serve stale across a midnight rollover.
    const weekdays = useMemo(
      () =>
        getWeekdayNames({
          locale: resolvedLocale,
          format: weekdayFormat,
          firstDayOfWeek: resolvedFirstDayOfWeek,
        }),
      [resolvedLocale, weekdayFormat, resolvedFirstDayOfWeek],
    );

    // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
    const s = slotStyles<WeekdaysRowStyles>(styles, WEEKDAYS_ROW_SLOT_KEYS, "WeekdaysRow");

    return (
      <WeekdaysRowFrame ref={ref} role="row" {...s.get("weekdaysRow")} {...rest}>
        {withWeekNumbers && (
          <Weekday
            size={size}
            fullWidth={fullWidth}
            role="columnheader"
            {...COLUMN_HEADER_A11Y}
            {...s.get("weekday")}
          >
            #
          </Weekday>
        )}
        {weekdays.map((weekday, index) => (
          <Weekday
            key={index}
            size={size}
            fullWidth={fullWidth}
            role="columnheader"
            {...COLUMN_HEADER_A11Y}
            {...s.get("weekday")}
          >
            {weekday}
          </Weekday>
        ))}
      </WeekdaysRowFrame>
    );
  },
);

WeekdaysRowComponent.displayName = "@knitui/dates/WeekdaysRow";

// ── 14. Public surface ─────────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled parts so consumers can target/extend
// them (`styled(WeekdaysRow.Weekday, …)`) — the single source of truth for the parts.
export const WeekdaysRow = withStaticProperties(WeekdaysRowComponent, {
  Frame: WeekdaysRowFrame,
  Weekday,
});

export type { WeekdaySize };
