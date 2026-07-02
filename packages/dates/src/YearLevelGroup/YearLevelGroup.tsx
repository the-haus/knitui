// ───────────────────────────────────────────────────────────────────────────
// YearLevelGroup — mirrors the `@mantine/dates` `YearLevelGroup` API, built on
// `@knitui/components` (`Box`, via `LevelsGroup`) + `@knitui/core`
// (`withStaticProperties`) + dayjs. It is a multi-column GROUP wrapper: it lays
// `numberOfColumns` `YearLevel`s side by side inside a `LevelsGroup`, owns the
// 3-D `controlsRef` map, and wires cross-platform arrow-key roving focus across
// every panel via `handleControlKeyDown`. The month-grid analogue of
// `MonthLevelGroup`/`DecadeLevelGroup`, stepping one year per column over month cells.
//
// Cross-platform: web + native from this single source. The grid arrow-roving
// works everywhere (it routes through `YearLevel` → `MonthsList` →
// `PickerControl`, none of which use a react-native-web-only API). The root is
// the `styled(Box)` `LevelsGroup` frame (never an HTML element) and the ref is
// forwarded straight to it.
//
// On the kit checklist (see `_reference/README.md`): YearLevelGroup OWNS NO
// CELLS — like `Calendar`, it delegates every grid/control to the levels it
// composes. So the leaf-styling rules live DOWNSTREAM and intentionally do NOT
// live here:
//   - #2 shared `size` context, #3 derived `cell-metrics` sizing, #4 theme-ramp
//     colors, #12 hover/press/disabled interaction and #15 compiler-safe styling
//     all live in `MonthsList`/`PickerControl` (the month cells) and `CalendarHeader`.
//   - #6 marker slots / #5 styled leaf parts are not introduced here: a group is
//     pure layout with no consumer-composed sub-regions of its own (parity with
//     Mantine, which renders only the data-driven `YearLevel`s).
// What this wrapper DOES carry: provenance header (#1); the `LevelsGroup` root
// frame + composed `YearLevel` exposed via `withStaticProperties` (#14); ref +
// style-prop forwarding to that root (#13); per-item `getMonthControlProps`
// passthrough — the "explicit per-item beats sugar" callback (#7) — forwarded to
// every panel unchanged; locale (#9) and `minDate`/`maxDate` (#10) passthrough;
// and the group a11y role (#11), with the per-control web/native a11y owned by
// `CalendarHeader`/`PickerControl` downstream.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import dayjs from "dayjs";

import { type Box } from "@knitui/components";
import { type GetProps, type TamaguiElement, withStaticProperties } from "@knitui/core";

import { type CalendarSize } from "../cell-metrics";
import { LevelsGroup } from "../LevelsGroup";
import type { DateStringValue } from "../types";
import { type FocusableControlsMap, handleControlKeyDown } from "../utils";
import { YearLevel, type YearLevelSettings } from "../YearLevel";

// The group's own style props flow through to the `LevelsGroup` root, minus the
// ones this component owns/derives per panel (`size`/`children`).
type YearLevelGroupFrameProps = Omit<GetProps<typeof Box>, "size" | "children">;

export interface YearLevelGroupProps
  extends
    YearLevelGroupFrameProps,
    Omit<
      YearLevelSettings,
      "withPrevious" | "withNext" | "__onControlKeyDown" | "__getControlRef"
    > {
  /** Number of year panels to display next to each other. @default 1 */
  numberOfColumns?: number;

  /** Year of the first (left-most) panel, any date within it (`YYYY-MM-DD`). */
  year: DateStringValue;

  /** Level control `aria-label`, or a function resolving it from each panel's year. */
  levelControlAriaLabel?: ((year: DateStringValue) => string) | string;

  /** Stretch the group (and its panels) to the full width of its container. @default false */
  fullWidth?: boolean;

  /** Width/font of the header controls and month cells. @default 'md' */
  size?: CalendarSize;
}

/**
 * `YearLevelGroup` — renders `numberOfColumns` `YearLevel`s side by side inside a
 * `LevelsGroup`, owns the 3-D `controlsRef` map, and wires cross-platform arrow-key
 * roving focus across every panel via `handleControlKeyDown`. The month-grid analogue
 * of `MonthLevelGroup`/`DecadeLevelGroup`, stepping one year per column over month cells.
 *
 * A year is NOT the top level — it zooms out to a decade, so `YearLevel`'s level
 * control stays interactive (`onLevelClick`/`hasNextLevel` are forwarded). Only the
 * edge panels show navigation controls (`withPrevious` on the first, `withNext` on the
 * last); `levelControlAriaLabel` resolves per panel when given a function. Every shared
 * `YearLevel`/`CalendarHeader` setting is forwarded to each level unchanged, including
 * the per-item `getMonthControlProps` callback (#7 passthrough). Owns no cells of its
 * own — sizing/colors/interaction live downstream in `MonthsList`/`PickerControl` (see
 * the file header). Forwards its ref + style props to the `LevelsGroup` root, exposed
 * as `YearLevelGroup.Frame`.
 */
const YearLevelGroupComponent = React.forwardRef<TamaguiElement, YearLevelGroupProps>(
  function YearLevelGroup(props, ref) {
    const {
      // YearLevel settings
      year,
      locale,
      minDate,
      maxDate,
      monthsListFormat,
      getMonthControlProps,
      __onControlClick,
      __onControlMouseEnter,
      withCellSpacing,

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
      yearLabelFormat,
      size,
      fullWidth,
      ...others
    } = props;

    const controlsRef = React.useRef<FocusableControlsMap>([]);

    const years = Array.from({ length: numberOfColumns }, (_, yearIndex) => {
      const currentYear = dayjs(year).add(yearIndex, "years").format("YYYY-MM-DD");

      return (
        <YearLevel
          key={yearIndex}
          size={size}
          monthsListFormat={monthsListFormat}
          year={currentYear}
          withNext={yearIndex === numberOfColumns - 1}
          withPrevious={yearIndex === 0}
          yearLabelFormat={yearLabelFormat}
          __stopPropagation={__stopPropagation}
          __onControlClick={__onControlClick}
          __onControlMouseEnter={__onControlMouseEnter}
          __onControlKeyDown={(event, payload) =>
            handleControlKeyDown({
              levelIndex: yearIndex,
              rowIndex: payload.rowIndex,
              cellIndex: payload.cellIndex,
              event,
              controlsRef,
            })
          }
          __getControlRef={(rowIndex, cellIndex, control) => {
            if (!Array.isArray(controlsRef.current[yearIndex])) {
              controlsRef.current[yearIndex] = [];
            }

            if (!Array.isArray(controlsRef.current[yearIndex][rowIndex])) {
              controlsRef.current[yearIndex][rowIndex] = [];
            }

            controlsRef.current[yearIndex][rowIndex][cellIndex] = control;
          }}
          levelControlAriaLabel={
            typeof levelControlAriaLabel === "function"
              ? levelControlAriaLabel(currentYear)
              : levelControlAriaLabel
          }
          locale={locale}
          minDate={minDate}
          maxDate={maxDate}
          getMonthControlProps={getMonthControlProps}
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
          withCellSpacing={withCellSpacing}
          headerControlsOrder={headerControlsOrder}
          fullWidth={fullWidth}
        />
      );
    });

    // #11 a11y: the group is a presentational column layout around `role="grid"`
    // levels; the per-control web (`role`/`aria-*`) and native (`accessibility*`)
    // semantics are owned downstream by `CalendarHeader`/`PickerControl`.
    return (
      <LevelsGroup ref={ref} role="group" size={size} fullWidth={fullWidth} {...others}>
        {years}
      </LevelsGroup>
    );
  },
);

YearLevelGroupComponent.displayName = "@knitui/dates/YearLevelGroup";

/**
 * #14 `withStaticProperties` exposes the `LevelsGroup` root frame as
 * `YearLevelGroup.Frame` (the single extension point — `styled(YearLevelGroup.Frame, …)`)
 * and the composed `YearLevel` as `YearLevelGroup.Level`, so a consumer can reach
 * and extend the parts. The group owns no styled parts of its own — every
 * cell/control lives in `YearLevel`/`MonthsList`.
 */
export const YearLevelGroup = withStaticProperties(YearLevelGroupComponent, {
  Frame: LevelsGroup,
  Level: YearLevel,
});
