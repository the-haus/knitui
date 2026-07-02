import type { CalendarProps } from "../Calendar";

/**
 * Split a props bag into the subset `Calendar` consumes (`calendarProps`) and the
 * remainder (`others`, the root/`Box` frame props) — the `any`-free port of
 * Mantine's `pickCalendarProps`. The inline pickers spread their `rest` through
 * here so the calendar settings flow to `<Calendar />` while frame props land on
 * the wrapper `Box`.
 *
 * Re-typed from Mantine's loose untyped-record constraint to
 * `<T extends Partial<CalendarProps>>`: the constraint guarantees every key below
 * exists (so the destructure is safe), `calendarProps` is the precise
 * Calendar-consumable subset, and `others` is the precisely-typed remainder.
 * Unlike Mantine we forward BOTH `__setDateRef` AND `__setLevelRef` (Mantine drops
 * the latter and re-attaches it at the call site — here the pickers rely on the
 * helper) and we omit the styles-api split (`pick-calendar-levels-props`).
 */
export function pickCalendarProps<T extends Partial<CalendarProps>>(props: T) {
  const {
    maxLevel,
    minLevel,
    defaultLevel,
    level,
    onLevelChange,
    nextIcon,
    previousIcon,
    date,
    defaultDate,
    onDateChange,
    numberOfColumns,
    columnsToScroll,
    ariaLabels,
    nextLabel,
    previousLabel,
    onYearSelect,
    onMonthSelect,
    onYearMouseEnter,
    onMonthMouseEnter,
    onNextMonth,
    onPreviousMonth,
    onNextYear,
    onPreviousYear,
    onNextDecade,
    onPreviousDecade,
    withCellSpacing,
    highlightToday,
    __updateDateOnYearSelect,
    __updateDateOnMonthSelect,
    __setDateRef,
    __setLevelRef,
    withWeekNumbers,
    headerControlsOrder,

    // MonthLevelGroup props
    firstDayOfWeek,
    weekdayFormat,
    weekendDays,
    getDayProps,
    excludeDate,
    renderDay,
    hideOutsideDates,
    hideWeekdays,
    getDayAriaLabel,
    monthLabelFormat,

    // YearLevelGroup props
    monthsListFormat,
    getMonthControlProps,
    yearLabelFormat,

    // DecadeLevelGroup props
    yearsListFormat,
    getYearControlProps,
    decadeLabelFormat,

    // Other props
    minDate,
    maxDate,
    locale,
    ...others
  } = props;

  return {
    calendarProps: {
      maxLevel,
      minLevel,
      defaultLevel,
      level,
      onLevelChange,
      nextIcon,
      previousIcon,
      date,
      defaultDate,
      onDateChange,
      numberOfColumns,
      columnsToScroll,
      ariaLabels,
      nextLabel,
      previousLabel,
      onYearSelect,
      onMonthSelect,
      onYearMouseEnter,
      onMonthMouseEnter,
      onNextMonth,
      onPreviousMonth,
      onNextYear,
      onPreviousYear,
      onNextDecade,
      onPreviousDecade,
      withCellSpacing,
      highlightToday,
      __updateDateOnYearSelect,
      __updateDateOnMonthSelect,
      __setDateRef,
      __setLevelRef,
      withWeekNumbers,
      headerControlsOrder,

      // MonthLevelGroup props
      firstDayOfWeek,
      weekdayFormat,
      weekendDays,
      getDayProps,
      excludeDate,
      renderDay,
      hideOutsideDates,
      hideWeekdays,
      getDayAriaLabel,
      monthLabelFormat,

      // YearLevelGroup props
      monthsListFormat,
      getMonthControlProps,
      yearLabelFormat,

      // DecadeLevelGroup props
      yearsListFormat,
      getYearControlProps,
      decadeLabelFormat,

      // Other props
      minDate,
      maxDate,
      locale,
    },
    others,
  };
}
