// ───────────────────────────────────────────────────────────────────────────
// MiniCalendar — mirrors @mantine/dates' MiniCalendar API, rebuilt on
// @knitui/components (`Box` / `Text` / `UnstyledButton`) + @knitui/core + dayjs. It
// is a standalone, compact horizontal day strip (NOT a `Calendar` composition):
// `numberOfDays` consecutive days from the displayed start date, flanked by
// prev/next controls that page the window by a full strip and respect
// `minDate` / `maxDate`.
//
// Cross-platform: one source renders on web + native. Web a11y (`role`/`aria-*`)
// and native a11y (`accessibility*` via `internal/a11y`) are set side-by-side —
// neither replaces the other. Accent on the selected day comes from the active
// Tamagui theme ramp (`theme="red"` recolors with zero per-component logic);
// there is no Mantine-style `color` prop and no hard-coded palette hex.
//
// COMPILER SAFETY (the bug that shipped here): the `apps/web` build runs the
// Tamagui optimizing compiler, which flattens `styled()` parts into atomic CSS.
// A DYNAMIC style prop that can evaluate to a hide value — e.g.
// `opacity={cond ? 0.65 : 0}` — gets its `0` branch extracted into an
// `._o-0 { opacity: 0 }` class and flattened onto the WHOLE day cell, blanking
// the month label AND the number. So every show/hide and per-state look here is
// expressed as a constant baked-in style or a boolean *variant*, never a
// per-render dynamic `opacity` / `display` / `color` style prop.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import dayjs from "dayjs";

import { Box, Text, UnstyledButton } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  slotStyles,
  type SlotStyles,
  styled,
  withStaticProperties,
} from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

import { type CalendarSize, CELL_FONT, CELL_WIDTH } from "../cell-metrics";
import { useDatesContext } from "../DatesProvider";
import { controlA11yProps } from "../internal/a11y";
import { webCursor } from "../internal/web-cursor";
import type { DateStringValue } from "../types";
import { isAfterMinDate, isBeforeMaxDate, toDateString } from "../utils";

// ── Shared context ────────────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to every styled part so the leaf
// controls + day cells read the SAME size the consumer set on the root WITHOUT
// prop-drilling and without each part exposing its own `size` on the public API.
const MiniCalendarContext = createStyledContext<{ size: CalendarSize }>({ size: "md" });

// ── Sizing derived from the shared `cell-metrics` ladders ─────────────────────
// Never hard-code pixels: every dimension scales on the shared `CELL_WIDTH` /
// `CELL_FONT` ladders (the calendar twin of components' `controlMetrics`), so
// retuning a ladder moves every grid component together. The raw values resolve
// at module-load — NOT `getTokenValue`, which needs the live config.

/** Square prev/next control size per `size`, from the shared `CELL_WIDTH` ladder. */
const controlSquareVariant = {
  xxs: { width: CELL_WIDTH.xxs, height: CELL_WIDTH.xxs },
  xs: { width: CELL_WIDTH.xs, height: CELL_WIDTH.xs },
  sm: { width: CELL_WIDTH.sm, height: CELL_WIDTH.sm },
  md: { width: CELL_WIDTH.md, height: CELL_WIDTH.md },
  lg: { width: CELL_WIDTH.lg, height: CELL_WIDTH.lg },
  xl: { width: CELL_WIDTH.xl, height: CELL_WIDTH.xl },
  xxl: { width: CELL_WIDTH.xxl, height: CELL_WIDTH.xxl },
} as const;

/** Day-cell minimum width per `size` (taller than wide — two stacked labels). */
const dayWidthVariant = {
  xxs: { minWidth: CELL_WIDTH.xxs },
  xs: { minWidth: CELL_WIDTH.xs },
  sm: { minWidth: CELL_WIDTH.sm },
  md: { minWidth: CELL_WIDTH.md },
  lg: { minWidth: CELL_WIDTH.lg },
  xl: { minWidth: CELL_WIDTH.xl },
  xxl: { minWidth: CELL_WIDTH.xxl },
} as const;

/** Day-number font per `size` (the shared cell-label ladder). */
const dayNumberFontVariant = {
  xxs: { fontSize: CELL_FONT.xxs },
  xs: { fontSize: CELL_FONT.xs },
  sm: { fontSize: CELL_FONT.sm },
  md: { fontSize: CELL_FONT.md },
  lg: { fontSize: CELL_FONT.lg },
  xl: { fontSize: CELL_FONT.xl },
  xxl: { fontSize: CELL_FONT.xxl },
} as const;

/** Month-label font per `size` (≈ 72% of the day-number font). */
const monthFontVariant = {
  xxs: { fontSize: Math.round(CELL_FONT.xxs * 0.72) },
  xs: { fontSize: Math.round(CELL_FONT.xs * 0.72) },
  sm: { fontSize: Math.round(CELL_FONT.sm * 0.72) },
  md: { fontSize: Math.round(CELL_FONT.md * 0.72) },
  lg: { fontSize: Math.round(CELL_FONT.lg * 0.72) },
  xl: { fontSize: Math.round(CELL_FONT.xl * 0.72) },
  xxl: { fontSize: Math.round(CELL_FONT.xxl * 0.72) },
} as const;

/** Chevron glyph font per `size` (≈ 55% of the control size). */
const chevronFontVariant = {
  xxs: { fontSize: Math.round(CELL_WIDTH.xxs * 0.55) },
  xs: { fontSize: Math.round(CELL_WIDTH.xs * 0.55) },
  sm: { fontSize: Math.round(CELL_WIDTH.sm * 0.55) },
  md: { fontSize: Math.round(CELL_WIDTH.md * 0.55) },
  lg: { fontSize: Math.round(CELL_WIDTH.lg * 0.55) },
  xl: { fontSize: Math.round(CELL_WIDTH.xl * 0.55) },
  xxl: { fontSize: Math.round(CELL_WIDTH.xxl * 0.55) },
} as const;

// ── Styled parts ────────────────────────────────────────────────────────────

/** The root row: prev control · day strip · next control. */
const MiniCalendarFrame = styled(Box, {
  name: "MiniCalendar",
  context: MiniCalendarContext,
  flexDirection: "row",
  alignItems: "center",
  gap: "$xs",
});

/** Prev/next square control — chevron button. */
const MiniCalendarControl = styled(UnstyledButton.Frame, {
  name: "MiniCalendarControl",
  context: MiniCalendarContext,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "$sm",
  backgroundColor: "transparent",
  ...webCursor("pointer"),
  hoverStyle: { backgroundColor: "$color2" },
  pressStyle: { backgroundColor: "$color3" },

  variants: {
    size: controlSquareVariant,

    /** Disabled control — dimmed, non-interactive (Mantine parity: 0.3). */
    disabled: {
      true: {
        opacity: 0.3,
        pointerEvents: "none",
        ...webCursor("not-allowed"),
        hoverStyle: { backgroundColor: "transparent" },
        pressStyle: { backgroundColor: "transparent" },
      },
    },
  } as const,

  defaultVariants: { size: "md" },
});

/** The horizontal day strip wrapping the day buttons. */
const MiniCalendarDays = styled(Box, {
  name: "MiniCalendarDays",
  context: MiniCalendarContext,
  flexDirection: "row",
  alignItems: "stretch",
  gap: "$xxs",
});

/**
 * A single day button — month label stacked over the day-of-month number.
 *
 * 12. Interaction lives in real Tamagui pseudo-state (`hoverStyle`/`pressStyle`)
 *     and a `disabled` variant (Mantine parity: 0.3 + non-interactive), never a
 *     runtime `onHoverIn` state machine.
 * 15. The selected look is a boolean `selected` VARIANT (accent fill via the
 *     theme ramp), not a per-render dynamic `backgroundColor`/`opacity` prop, so
 *     the compiler can never extract a hide value onto the cell.
 */
const MiniCalendarDay = styled(UnstyledButton.Frame, {
  name: "MiniCalendarDay",
  context: MiniCalendarContext,
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  paddingVertical: "$xs",
  paddingHorizontal: "$xxs",
  borderRadius: "$sm",
  backgroundColor: "transparent",
  ...webCursor("pointer"),
  hoverStyle: { backgroundColor: "$color2" },
  pressStyle: { backgroundColor: "$color3" },

  variants: {
    size: dayWidthVariant,

    /** Selected day — solid accent fill (the active theme's `$color9`). */
    selected: {
      true: {
        backgroundColor: "$color9",
        hoverStyle: { backgroundColor: "$color10" },
        pressStyle: { backgroundColor: "$color8" },
      },
    },

    /** Disabled day — dimmed, non-interactive (Mantine parity: 0.3). */
    disabled: {
      true: {
        opacity: 0.3,
        pointerEvents: "none",
        ...webCursor("not-allowed"),
        hoverStyle: { backgroundColor: "transparent" },
        pressStyle: { backgroundColor: "transparent" },
      },
    },
  } as const,

  defaultVariants: { size: "md" },
});

/**
 * The small month label rendered above every day's number (Mantine parity:
 * `.dayMonth` is always present, never toggled per-day). It's the regular
 * foreground dimmed to `opacity: 0.65` (NOT an accent-tinted label), so it uses
 * the neutral `$color` ramp here — `$color11` would paint it in the active
 * theme's accent and is what made the label read as "differently coloured".
 *
 * 15. The 0.65 dim is a CONSTANT baked into the style, and the selected-state
 *     contrast color is a boolean VARIANT. Neither is toggled per-day via a
 *     dynamic `opacity={... ? 0.65 : 0}` / `color={...}` prop: the Tamagui
 *     compiler that builds `apps/web` extracts the `0` branch into an
 *     `_o-0 { opacity: 0 }` atomic class and flattens it onto the day cell,
 *     blanking the WHOLE cell (number included).
 */
const MiniCalendarDayMonth = styled(Text, {
  name: "MiniCalendarDayMonth",
  context: MiniCalendarContext,
  userSelect: "none",
  opacity: 0.65,
  color: "$color",
  variants: {
    size: monthFontVariant,

    /** On a selected day's accent fill, the label flips to the contrast color. */
    selected: { true: { color: "$color1" } },
  } as const,
  defaultVariants: { size: "md" },
});

/** The day-of-month number. */
const MiniCalendarDayNumber = styled(Text, {
  name: "MiniCalendarDayNumber",
  context: MiniCalendarContext,
  userSelect: "none",
  color: "$color",
  variants: {
    size: dayNumberFontVariant,

    /** On a selected day's accent fill, the number flips to the contrast color. */
    selected: { true: { color: "$color1" } },
  } as const,
  defaultVariants: { size: "md" },
});

/** The default chevron glyph — shares `size` via context. */
const MiniCalendarChevron = styled(Text, {
  name: "MiniCalendarChevron",
  context: MiniCalendarContext,
  userSelect: "none",
  color: "$color",
  variants: { size: chevronFontVariant } as const,
  defaultVariants: { size: "md" },
});

/** Props passed down to each day button — a precise partial of the day control. */
type MiniCalendarDayProps = Partial<GetProps<typeof UnstyledButton>>;

/** Props passed to the prev/next control buttons. */
type MiniCalendarControlProps = GetProps<typeof UnstyledButton>;

/** Cross-platform press event for a day/control button (derived, never a DOM event). */
type MiniCalendarPressEvent = Parameters<
  NonNullable<GetProps<typeof UnstyledButton>["onPress"]>
>[0];

// ── Per-slot `styles` sugar ───────────────────────────────────────────────────
// The kit's ONE styling model is props on the parts. `styles` is thin sugar over
// that: a map from named slot → that part's props, resolved through
// `slotStyles().merge` so the precedence is fixed in one place —
//   defaults < styles[slot] < explicit xxxProps < inline props on a composed part.
// The slot vocabulary mirrors @mantine/dates' `MiniCalendarStylesNames`
// (`root | control | days | day | dayMonth | dayNumber`). Per-item dynamics that a
// static map can't express stay on the `getDayProps(date)` callback, which wins
// over `styles.day` (explicit beats sugar).

/** The named style slots and the styled part each targets. */
export interface MiniCalendarStyles {
  /** Props for the root row (`.Frame`). */
  root?: GetProps<typeof MiniCalendarFrame>;
  /** Props for each prev/next control button (`.Control`). */
  control?: GetProps<typeof MiniCalendarControl>;
  /** Props for the day strip wrapper (`.Days`). */
  days?: GetProps<typeof MiniCalendarDays>;
  /** Props for each day button (`.Day`). */
  day?: GetProps<typeof MiniCalendarDay>;
  /** Props for each day's month label (`.DayMonth`). */
  dayMonth?: GetProps<typeof MiniCalendarDayMonth>;
  /** Props for each day's number (`.DayNumber`). */
  dayNumber?: GetProps<typeof MiniCalendarDayNumber>;
}

const MINI_CALENDAR_SLOT_KEYS = [
  "root",
  "control",
  "days",
  "day",
  "dayMonth",
  "dayNumber",
] as const satisfies readonly (keyof MiniCalendarStyles)[];

type MiniCalendarFrameProps = Omit<
  GetProps<typeof MiniCalendarFrame>,
  "onChange" | "value" | "defaultValue" | "size"
>;

export interface MiniCalendarProps extends MiniCalendarFrameProps {
  /** Displayed start date of the strip, controlled. */
  date?: DateStringValue | Date;

  /** Displayed start date of the strip, uncontrolled default. */
  defaultDate?: DateStringValue | Date;

  /** Called with the new start date in `YYYY-MM-DD` format when it changes. */
  onDateChange?: (date: DateStringValue) => void;

  /** Selected date, controlled. */
  value?: DateStringValue | Date | null;

  /** Called with the selected date in `YYYY-MM-DD` format when it changes. */
  onChange?: (date: DateStringValue) => void;

  /** Maximum selectable date, `YYYY-MM-DD` string or `Date`. */
  maxDate?: DateStringValue | Date;

  /** Minimum selectable date, `YYYY-MM-DD` string or `Date`. */
  minDate?: DateStringValue | Date;

  /** Number of days to display in the strip. @default 7 */
  numberOfDays?: number;

  /** dayjs format string for the month label. @default 'MMM' */
  monthLabelFormat?: string;

  /** Called when the next button is pressed. */
  onNext?: () => void;

  /** Called when the previous button is pressed. */
  onPrevious?: () => void;

  /** Props passed down to each day button (wins over `styles.day`). */
  getDayProps?: (date: DateStringValue) => MiniCalendarDayProps;

  /** Width/font of the controls. @default 'md' */
  size?: CalendarSize;

  /** Props passed to the previous control button (wins over `styles.control`). */
  previousControlProps?: MiniCalendarControlProps;

  /** Props passed to the next control button (wins over `styles.control`). */
  nextControlProps?: MiniCalendarControlProps;

  /** dayjs locale used for formatting; falls back to `DatesProvider`. */
  locale?: string;

  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<MiniCalendarStyles>;
}

/**
 * `MiniCalendar` — a standalone compact horizontal day strip (NOT a `Calendar`
 * composition). Renders `numberOfDays` consecutive days starting at the displayed
 * start date, with prev/next controls that shift the window by a full page and
 * respect `minDate`/`maxDate`. Selecting a day commits it (controlled +
 * uncontrolled via `useUncontrolled`); each day shows its month label above the
 * day number. Accent on the selected day comes from the active Tamagui theme.
 * Built from `Box` / `Text` / `UnstyledButton`; forwards its ref + style props to
 * the root via `.styleable`.
 *
 * Per-slot style sugar mirrors `@mantine/dates`' `styles`:
 * `styles={{ day: { borderRadius: "$lg" } }}` spreads onto the matching part;
 * precedence is fixed (`defaults < styles[slot] < explicit props`).
 *
 * @example
 * <MiniCalendar
 *   defaultDate="2026-06-15"
 *   value={value}
 *   onChange={setValue}
 * />
 */
const MiniCalendarComponent = MiniCalendarFrame.styleable<MiniCalendarProps>(
  function MiniCalendar(props, ref) {
    const {
      date,
      defaultDate,
      onDateChange,
      value,
      onChange,
      onNext,
      onPrevious,
      getDayProps,
      numberOfDays = 7,
      size = "md",
      minDate,
      maxDate,
      monthLabelFormat = "MMM",
      nextControlProps,
      previousControlProps,
      locale,
      styles,
      ...others
    } = props;

    // Locale comes from `DatesProvider` (consumer `locale` prop wins).
    const ctx = useDatesContext();
    const _locale = ctx.getLocale(locale);

    // Normalize bounds once; a day is disabled when it falls outside them.
    const minString = toDateString(minDate);
    const maxString = toDateString(maxDate);

    // Typed per-slot accessor (dev-warns unknown keys against the known set).
    const s = slotStyles<MiniCalendarStyles>(styles, MINI_CALENDAR_SLOT_KEYS, "MiniCalendar");

    const [_startDate, setStartDate] = useUncontrolled<DateStringValue>({
      value: toDateString(date),
      defaultValue: toDateString(defaultDate),
      finalValue: dayjs().format("YYYY-MM-DD"),
      onChange: onDateChange,
    });

    const [_value, setValue] = useUncontrolled<DateStringValue | null>({
      value: toDateString(value),
      defaultValue: null,
      // The selection is only ever set to a concrete day (never cleared by a
      // press), so narrow the `string | null` stored value back to a
      // `DateStringValue` for the public `onChange`.
      onChange: onChange ? (next) => next !== null && onChange(next) : undefined,
    });

    const handleNext = () => {
      onNext?.();
      setStartDate(toDateString(dayjs(_startDate).add(numberOfDays, "day")));
    };

    const handlePrevious = () => {
      onPrevious?.();
      setStartDate(toDateString(dayjs(_startDate).subtract(numberOfDays, "day")));
    };

    // Stepping back is blocked once the day immediately before the window start
    // would fall before `minDate`; stepping forward once the next window start
    // would fall after `maxDate`. Expressed via the shared min/max date utils.
    const previousDisabled = minString
      ? !isAfterMinDate(toDateString(dayjs(_startDate).subtract(1, "day")), minString)
      : false;
    const nextDisabled = maxString
      ? !isBeforeMaxDate(toDateString(dayjs(_startDate).add(numberOfDays, "day")), maxString)
      : false;

    const days = Array.from({ length: numberOfDays }, (_, index) =>
      dayjs(_startDate).add(index, "day"),
    );

    const dayButtons = days.map((day) => {
      const dateString = toDateString(day);
      const disabled =
        !isAfterMinDate(dateString, minString) || !isBeforeMaxDate(dateString, maxString);
      const selected = _value !== null && day.isSame(_value, "day");
      const dayProps = getDayProps?.(dateString);

      return (
        <MiniCalendarDay
          key={dateString}
          size={size}
          selected={selected}
          disabled={disabled}
          // Web a11y (role/aria) and native a11y (`accessibility*`) side-by-side.
          role="button"
          aria-label={dateString}
          aria-selected={selected || undefined}
          aria-disabled={disabled || undefined}
          {...controlA11yProps({ role: "button", label: dateString, selected, disabled })}
          // explicit beats sugar: `styles.day` sits UNDER per-item `getDayProps`,
          // and the consumer's own `onPress` is preserved (called before ours).
          {...s.merge("day", dayProps)}
          onPress={(event: MiniCalendarPressEvent) => {
            dayProps?.onPress?.(event);
            setValue(dateString);
          }}
        >
          <MiniCalendarDayMonth size={size} selected={selected} {...s.get("dayMonth")}>
            {day.locale(_locale).format(monthLabelFormat)}
          </MiniCalendarDayMonth>
          <MiniCalendarDayNumber size={size} selected={selected} {...s.get("dayNumber")}>
            {day.date()}
          </MiniCalendarDayNumber>
        </MiniCalendarDay>
      );
    });

    return (
      <MiniCalendarFrame ref={ref} role="group" {...s.merge("root", others)}>
        <MiniCalendarControl
          size={size}
          disabled={previousDisabled}
          onPress={handlePrevious}
          aria-label="Previous"
          aria-disabled={previousDisabled || undefined}
          {...controlA11yProps({ role: "button", label: "Previous", disabled: previousDisabled })}
          // explicit beats sugar: `styles.control` sits UNDER `previousControlProps`
          // (Mantine parity — a consumer-supplied `onPress` overrides navigation).
          {...s.merge("control", previousControlProps)}
        >
          {previousControlProps?.children ?? (
            <MiniCalendarChevron size={size}>‹</MiniCalendarChevron>
          )}
        </MiniCalendarControl>

        <MiniCalendarDays {...s.get("days")}>{dayButtons}</MiniCalendarDays>

        <MiniCalendarControl
          size={size}
          disabled={nextDisabled}
          onPress={handleNext}
          aria-label="Next"
          aria-disabled={nextDisabled || undefined}
          {...controlA11yProps({ role: "button", label: "Next", disabled: nextDisabled })}
          {...s.merge("control", nextControlProps)}
        >
          {nextControlProps?.children ?? <MiniCalendarChevron size={size}>›</MiniCalendarChevron>}
        </MiniCalendarControl>
      </MiniCalendarFrame>
    );
  },
);

// ── Public surface ────────────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled parts so consumers can both target
// them via the `styles` sugar and extend them (`styled(MiniCalendar.Day, …)`).
export const MiniCalendar = withStaticProperties(MiniCalendarComponent, {
  /** The root row. */
  Frame: MiniCalendarFrame,
  /** A prev/next square chevron control. */
  Control: MiniCalendarControl,
  /** The horizontal day strip wrapper. */
  Days: MiniCalendarDays,
  /** A single day button. */
  Day: MiniCalendarDay,
  /** The month label above a day's number. */
  DayMonth: MiniCalendarDayMonth,
  /** The day-of-month number. */
  DayNumber: MiniCalendarDayNumber,
  /** The default chevron glyph. */
  Chevron: MiniCalendarChevron,
});
