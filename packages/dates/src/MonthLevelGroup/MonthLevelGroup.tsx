// ───────────────────────────────────────────────────────────────────────────
// MonthLevelGroup — mirrors the `@mantine/dates` `MonthLevelGroup` API, built on
// `@knitui/components` (`Box`, via `LevelsGroup`) + `@knitui/core`
// (`withStaticProperties`) + dayjs. It is a multi-column GROUP wrapper: it lays
// `numberOfColumns` `MonthLevel`s side by side inside a `LevelsGroup`, owns the
// 3-D `daysRefs` map, and wires cross-platform arrow-key roving focus across
// every panel via `handleControlKeyDown`. The day-grid analogue of
// `YearLevelGroup`/`DecadeLevelGroup`, stepping one month per column over day cells.
//
// Cross-platform: web + native from this single source. The grid arrow-roving
// works everywhere (it routes through `MonthLevel` → `Month` → `Day`, none of
// which use a react-native-web-only API). The root is the `styled(Box)`
// `LevelsGroup` frame (never an HTML element) and the ref is forwarded straight
// to it.
//
// On the kit checklist (see `_reference/README.md`): MonthLevelGroup OWNS NO
// CELLS — like `Calendar`, it delegates every grid/control to the levels it
// composes. So the leaf-styling rules live DOWNSTREAM and intentionally do NOT
// live here:
//   - #2 shared `size` context, #3 derived `cell-metrics` sizing, #4 theme-ramp
//     colors, #12 hover/press/disabled interaction and #15 compiler-safe styling
//     all live in `Month`/`Day` (the day cells) and `CalendarHeader`.
//   - #6 marker slots / #5 styled leaf parts are not introduced here: a group is
//     pure layout with no consumer-composed sub-regions of its own (parity with
//     Mantine, which renders only the data-driven `MonthLevel`s).
// What this wrapper DOES carry: provenance header (#1); the `LevelsGroup` root
// frame + composed `MonthLevel` exposed via `withStaticProperties` (#14); ref +
// style-prop forwarding to that root (#13); per-item `getDayProps` passthrough —
// the "explicit per-item beats sugar" callback (#7) — forwarded to every panel
// unchanged; locale (#9) and `minDate`/`maxDate` (#10) passthrough; and the group
// a11y role (#11), with the per-control web/native a11y owned by
// `CalendarHeader`/`Day` downstream.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import dayjs from "dayjs";

import { type Box } from "@knitui/components";
import { type GetProps, type TamaguiElement, withStaticProperties } from "@knitui/core";

import { type CalendarSize } from "../cell-metrics";
import { LevelsGroup } from "../LevelsGroup";
import { MonthLevel, type MonthLevelSettings } from "../MonthLevel";
import type { DateStringValue } from "../types";
import { type FocusableControlsMap, handleControlKeyDown } from "../utils";

// The group's own style props flow through to the `LevelsGroup` root, minus the
// ones this component owns/derives per panel (`size`/`children`).
type MonthLevelGroupFrameProps = Omit<GetProps<typeof Box>, "size" | "children">;

export interface MonthLevelGroupProps
  extends
    MonthLevelGroupFrameProps,
    Omit<MonthLevelSettings, "withPrevious" | "withNext" | "__onDayKeyDown" | "__getDayRef"> {
  /** Number of month panels to display next to each other. @default 1 */
  numberOfColumns?: number;

  /** Month of the first (left-most) panel, any date within it (`YYYY-MM-DD`). */
  month: DateStringValue;

  /** Level control `aria-label`, or a function resolving it from each panel's month. */
  levelControlAriaLabel?: ((month: DateStringValue) => string) | string;

  /** Render days as static (non-interactive) display cells. @default false */
  static?: boolean;

  /** Stretch the group (and its panels) to the full width of its container. @default false */
  fullWidth?: boolean;

  /** Width/font of the header controls and day cells. @default 'md' */
  size?: CalendarSize;
}

/**
 * `MonthLevelGroup` — renders `numberOfColumns` `MonthLevel`s side by side inside
 * a `LevelsGroup`, owns the 3-D `daysRefs` map, and wires cross-platform arrow-key
 * roving focus across every panel via `handleControlKeyDown`. The day-grid analogue
 * of `YearLevelGroup`/`DecadeLevelGroup`, stepping one month per column.
 *
 * A month is NOT the top level — it zooms out to a year, so `MonthLevel`'s level
 * control stays interactive (`onLevelClick`/`hasNextLevel` are forwarded). Only the
 * edge panels show navigation controls (`withPrevious` on the first, `withNext` on
 * the last); `levelControlAriaLabel` resolves per panel when given a function. Every
 * shared `Month`/`CalendarHeader` setting is forwarded to each level unchanged,
 * including the per-item `getDayProps` callback (#7 passthrough). Owns no cells of
 * its own — sizing/colors/interaction live downstream in `Month`/`Day` (see the file
 * header). Forwards its ref + style props to the `LevelsGroup` root, exposed as
 * `MonthLevelGroup.Frame`.
 */
const MonthLevelGroupComponent = React.forwardRef<TamaguiElement, MonthLevelGroupProps>(
  function MonthLevelGroup(props, ref) {
    const {
      // Month settings
      month,
      locale,
      firstDayOfWeek,
      weekdayFormat,
      weekendDays,
      getDayProps,
      excludeDate,
      minDate,
      maxDate,
      renderDay,
      hideOutsideDates,
      hideWeekdays,
      getDayAriaLabel,
      __onDayClick,
      __onDayMouseEnter,
      withCellSpacing,
      highlightToday,
      withWeekNumbers,

      // CalendarHeader settings
      __preventFocus,
      __stopPropagation,
      nextIcon,
      previousIcon,
      nextLabel,
      previousLabel,
      onNext,
      onPrevious,
      onLevelClick,
      nextDisabled,
      previousDisabled,
      hasNextLevel,
      headerControlsOrder,

      // Group-specific
      numberOfColumns = 1,
      levelControlAriaLabel,
      monthLabelFormat,
      size,
      static: isStatic,
      fullWidth,
      ...others
    } = props;

    const daysRefs = React.useRef<FocusableControlsMap>([]);

    const months = Array.from({ length: numberOfColumns }, (_, monthIndex) => {
      const currentMonth = dayjs(month).add(monthIndex, "months").format("YYYY-MM-DD");

      return (
        <MonthLevel
          key={monthIndex}
          month={currentMonth}
          withNext={monthIndex === numberOfColumns - 1}
          withPrevious={monthIndex === 0}
          monthLabelFormat={monthLabelFormat}
          __stopPropagation={__stopPropagation}
          __onDayClick={__onDayClick}
          __onDayMouseEnter={__onDayMouseEnter}
          __onDayKeyDown={(event, payload) =>
            handleControlKeyDown({
              levelIndex: monthIndex,
              rowIndex: payload.rowIndex,
              cellIndex: payload.cellIndex,
              event,
              controlsRef: daysRefs,
            })
          }
          __getDayRef={(rowIndex, cellIndex, control) => {
            if (!Array.isArray(daysRefs.current[monthIndex])) {
              daysRefs.current[monthIndex] = [];
            }

            if (!Array.isArray(daysRefs.current[monthIndex][rowIndex])) {
              daysRefs.current[monthIndex][rowIndex] = [];
            }

            daysRefs.current[monthIndex][rowIndex][cellIndex] = control;
          }}
          levelControlAriaLabel={
            typeof levelControlAriaLabel === "function"
              ? levelControlAriaLabel(currentMonth)
              : levelControlAriaLabel
          }
          locale={locale}
          firstDayOfWeek={firstDayOfWeek}
          weekdayFormat={weekdayFormat}
          weekendDays={weekendDays}
          getDayProps={getDayProps}
          excludeDate={excludeDate}
          minDate={minDate}
          maxDate={maxDate}
          renderDay={renderDay}
          hideOutsideDates={hideOutsideDates}
          hideWeekdays={hideWeekdays}
          getDayAriaLabel={getDayAriaLabel}
          __preventFocus={__preventFocus}
          nextIcon={nextIcon}
          previousIcon={previousIcon}
          nextLabel={nextLabel}
          previousLabel={previousLabel}
          onNext={onNext}
          onPrevious={onPrevious}
          onLevelClick={onLevelClick}
          nextDisabled={nextDisabled}
          previousDisabled={previousDisabled}
          hasNextLevel={hasNextLevel}
          size={size}
          static={isStatic}
          withCellSpacing={withCellSpacing}
          highlightToday={highlightToday}
          withWeekNumbers={withWeekNumbers}
          headerControlsOrder={headerControlsOrder}
          fullWidth={fullWidth}
        />
      );
    });

    // #11 a11y: the group is a presentational column layout around `role="grid"`
    // levels; the per-control web (`role`/`aria-*`) and native (`accessibility*`)
    // semantics are owned downstream by `CalendarHeader`/`Day`.
    return (
      <LevelsGroup ref={ref} role="group" size={size} fullWidth={fullWidth} {...others}>
        {months}
      </LevelsGroup>
    );
  },
);

MonthLevelGroupComponent.displayName = "@knitui/dates/MonthLevelGroup";

/**
 * #14 `withStaticProperties` exposes the `LevelsGroup` root frame as
 * `MonthLevelGroup.Frame` (the single extension point — `styled(MonthLevelGroup.Frame, …)`)
 * and the composed `MonthLevel` as `MonthLevelGroup.Level`, so a consumer can reach
 * and extend the parts. The group owns no styled parts of its own — every
 * cell/control lives in `MonthLevel`/`Month`.
 */
export const MonthLevelGroup = withStaticProperties(MonthLevelGroupComponent, {
  Frame: LevelsGroup,
  Level: MonthLevel,
});
