// ───────────────────────────────────────────────────────────────────────────
// DecadeLevelGroup — mirrors the `@mantine/dates` `DecadeLevelGroup` API, built
// on `@knitui/components` (`Box`, via `LevelsGroup`) + `@knitui/core`
// (`withStaticProperties`) + dayjs. It is a multi-column GROUP wrapper: it lays
// `numberOfColumns` `DecadeLevel`s side by side inside a `LevelsGroup`, owns the
// 3-D `controlsRef` map, and wires cross-platform arrow-key roving focus across
// every panel via `handleControlKeyDown`. The decade analogue of
// `YearLevelGroup`/`MonthLevelGroup`, stepping ten years (one decade) per column.
//
// Cross-platform: web + native from this single source. The grid arrow-roving
// works everywhere (it routes through `DecadeLevel` → `YearsList` →
// `PickerControl`, none of which use a react-native-web-only API). The root is
// the `styled(Box)` `LevelsGroup` frame (never an HTML element) and the ref is
// forwarded straight to it.
//
// On the kit checklist (see `_reference/README.md`): DecadeLevelGroup OWNS NO
// CELLS — like `Calendar`, it delegates every grid/control to the levels it
// composes. So the leaf-styling rules live DOWNSTREAM and intentionally do NOT
// live here:
//   - #2 shared `size` context, #3 derived `cell-metrics` sizing, #4 theme-ramp
//     colors, #12 hover/press/disabled interaction and #15 compiler-safe styling
//     all live in `YearsList`/`PickerControl` (the year cells) and `CalendarHeader`.
//   - #6 marker slots / #5 styled leaf parts are not introduced here: a group is
//     pure layout with no consumer-composed sub-regions of its own (parity with
//     Mantine, which renders only the data-driven `DecadeLevel`s).
// What this wrapper DOES carry: provenance header (#1); the `LevelsGroup` root
// frame + composed `DecadeLevel` exposed via `withStaticProperties` (#14);
// ref + style-prop forwarding to that root (#13); per-item `getYearControlProps`
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
import { DecadeLevel, type DecadeLevelSettings } from "../DecadeLevel";
import { LevelsGroup } from "../LevelsGroup";
import type { DateStringValue } from "../types";
import { type FocusableControlsMap, handleControlKeyDown } from "../utils";

// The group's own style props flow through to the `LevelsGroup` root, minus the
// ones this component owns/derives per panel (`size`/`children`).
type DecadeLevelGroupFrameProps = Omit<GetProps<typeof Box>, "size" | "children">;

export interface DecadeLevelGroupProps
  extends
    DecadeLevelGroupFrameProps,
    Omit<
      DecadeLevelSettings,
      "withPrevious" | "withNext" | "__onControlKeyDown" | "__getControlRef"
    > {
  /** Number of decade panels to display next to each other. @default 1 */
  numberOfColumns?: number;

  /** Decade of the first (left-most) panel, any date within it (`YYYY-MM-DD`). */
  decade: DateStringValue;

  /** Level control `aria-label`, or a function resolving it from each panel's decade. */
  levelControlAriaLabel?: ((decade: DateStringValue) => string) | string;

  /** Stretch the group (and its panels) to the full width of its container. @default false */
  fullWidth?: boolean;

  /** Width/font of the header controls and year cells. @default 'md' */
  size?: CalendarSize;
}

/**
 * `DecadeLevelGroup` — renders `numberOfColumns` `DecadeLevel`s side by side inside
 * a `LevelsGroup`, owns the 3-D `controlsRef` map, and wires cross-platform arrow-key
 * roving focus across every panel via `handleControlKeyDown`. The decade analogue of
 * `YearLevelGroup`, stepping ten years (one decade) per column over year cells.
 *
 * This is the TOP level — there is no level above a decade, so `DecadeLevel` accepts
 * neither `onLevelClick` nor `hasNextLevel` and neither is forwarded. Only the edge
 * panels show navigation controls (`withPrevious` on the first, `withNext` on the
 * last); `levelControlAriaLabel` resolves per panel when given a function. Every
 * shared `DecadeLevel`/`CalendarHeader` setting is forwarded to each level unchanged,
 * including the per-item `getYearControlProps` callback (#7 passthrough). Owns no
 * cells of its own — sizing/colors/interaction live downstream in
 * `YearsList`/`PickerControl` (see the file header). Forwards its ref + style props
 * to the `LevelsGroup` root, exposed as `DecadeLevelGroup.Frame`.
 */
const DecadeLevelGroupComponent = React.forwardRef<TamaguiElement, DecadeLevelGroupProps>(
  function DecadeLevelGroup(props, ref) {
    const {
      // DecadeLevel settings
      decade,
      locale,
      minDate,
      maxDate,
      yearsListFormat,
      getYearControlProps,
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
      nextDisabled,
      previousDisabled,
      headerControlsOrder,

      // Group-specific
      numberOfColumns = 1,
      levelControlAriaLabel,
      decadeLabelFormat,
      size,
      fullWidth,
      ...others
    } = props;

    const controlsRef = React.useRef<FocusableControlsMap>([]);

    const decades = Array.from({ length: numberOfColumns }, (_, decadeIndex) => {
      const currentDecade = dayjs(decade)
        .add(decadeIndex * 10, "years")
        .format("YYYY-MM-DD");

      return (
        <DecadeLevel
          key={decadeIndex}
          size={size}
          yearsListFormat={yearsListFormat}
          decade={currentDecade}
          withNext={decadeIndex === numberOfColumns - 1}
          withPrevious={decadeIndex === 0}
          decadeLabelFormat={decadeLabelFormat}
          __stopPropagation={__stopPropagation}
          __onControlClick={__onControlClick}
          __onControlMouseEnter={__onControlMouseEnter}
          __onControlKeyDown={(event, payload) =>
            handleControlKeyDown({
              levelIndex: decadeIndex,
              rowIndex: payload.rowIndex,
              cellIndex: payload.cellIndex,
              event,
              controlsRef,
            })
          }
          __getControlRef={(rowIndex, cellIndex, control) => {
            if (!Array.isArray(controlsRef.current[decadeIndex])) {
              controlsRef.current[decadeIndex] = [];
            }

            if (!Array.isArray(controlsRef.current[decadeIndex][rowIndex])) {
              controlsRef.current[decadeIndex][rowIndex] = [];
            }

            controlsRef.current[decadeIndex][rowIndex][cellIndex] = control;
          }}
          levelControlAriaLabel={
            typeof levelControlAriaLabel === "function"
              ? levelControlAriaLabel(currentDecade)
              : levelControlAriaLabel
          }
          locale={locale}
          minDate={minDate}
          maxDate={maxDate}
          getYearControlProps={getYearControlProps}
          __preventFocus={__preventFocus}
          nextIcon={nextIcon}
          previousIcon={previousIcon}
          nextLabel={nextLabel}
          previousLabel={previousLabel}
          onNext={onNext}
          onPrevious={onPrevious}
          nextDisabled={nextDisabled}
          previousDisabled={previousDisabled}
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
        {decades}
      </LevelsGroup>
    );
  },
);

DecadeLevelGroupComponent.displayName = "@knitui/dates/DecadeLevelGroup";

/**
 * #14 `withStaticProperties` exposes the `LevelsGroup` root frame as
 * `DecadeLevelGroup.Frame` (the single extension point — `styled(DecadeLevelGroup.Frame, …)`)
 * and the composed `DecadeLevel` as `DecadeLevelGroup.Level`, so a consumer can
 * reach and extend the parts. The group owns no styled parts of its own — every
 * cell/control lives in `DecadeLevel`/`YearsList`.
 */
export const DecadeLevelGroup = withStaticProperties(DecadeLevelGroupComponent, {
  Frame: LevelsGroup,
  Level: DecadeLevel,
});
