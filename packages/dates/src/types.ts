// Shared date types for @knitui/dates — ported from @mantine/dates `src/types/*`
// (GeneralTypes, DatePickerValue, PickerBaseProps, ControlsGroupSettings),
// keeping Mantine's PUBLIC prop NAMES so the package surface matches. Mantine's
// DOM-typed control callbacks (`HTMLButtonElement` / `React.MouseEvent`) are
// re-typed here for cross-platform use: control refs surface as `FocusableControl`
// descriptors (wrapping a `TamaguiElement` host node), and the
// press/keyboard event types are DERIVED from `PickerControl`'s own prop
// signatures (the same `Parameters<NonNullable<…>>` pattern `Month` uses for
// `Day`) — never web-only DOM types.

import type { ReactNode } from "react";

import type { PickerControlProps } from "./PickerControl";
import type { FocusableControl } from "./utils";

/* -------------------------------------------------------------------------- */
/* GeneralTypes                                                               */
/* -------------------------------------------------------------------------- */

/** Date value used by all date components, format: `YYYY-MM-DD`. */
export type DateStringValue = string;

/** Date-time value used by all date components, format: `YYYY-MM-DD HH:mm:ss`. */
export type DateTimeStringValue = string;

/** Day of the week as an index, `0` (Sunday) through `6` (Saturday). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Calendar zoom level. */
export type CalendarLevel = "month" | "year" | "decade";

/** Payload passed to a calendar control's keydown handler. */
export interface ControlKeydownPayload {
  cellIndex: number;
  rowIndex: number;
  date: DateStringValue;
}

/** A formatted date label — either a format string or a render function. */
export type DateLabelFormat = string | ((date: DateStringValue) => ReactNode);

/* -------------------------------------------------------------------------- */
/* Time layer primitives                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Clock display mode shared by the entire time layer (`TimeValue` and the later
 * `TimeInput`/`TimeGrid`/`TimePicker`). Mantine hosts this on `TimePicker`; we
 * host it here so leaves like `TimeValue` don't depend on an unbuilt component.
 */
export type TimePickerFormat = "12h" | "24h";

/** AM/PM labels used by the `12h` clock display mode. */
export interface TimePickerAmPmLabels {
  am: string;
  pm: string;
}

/**
 * `TimePicker` mode: `'time'` is a regular clock input; `'duration'` allows
 * hour values greater than 24 (and forces the `24h` format). Ported from
 * Mantine's `TimePicker.types`.
 */
export type TimePickerType = "time" | "duration";

/** Input passed to a {@link TimePickerPasteSplit} transform. */
export interface TimePickerPasteSplitInput {
  time: string;
  format: TimePickerFormat;
  amPmLabels: TimePickerAmPmLabels;
}

/** The parsed `{ hours, minutes, seconds, amPm }` a paste transform returns. */
export interface TimePickerPasteSplitReturnType {
  hours: number | null;
  minutes: number | null;
  seconds: number | null;
  amPm: string | null;
}

/**
 * Transform a pasted/typed free string into time segments. Defaults to the
 * built-in `getParsedTime` parser; consumers can override to accept other
 * formats. Ported from Mantine's `TimePicker.types`.
 */
export type TimePickerPasteSplit = (
  input: TimePickerPasteSplitInput,
) => TimePickerPasteSplitReturnType;

/** A labelled group of preset time strings shown in the `TimePicker` dropdown. */
export interface TimePickerPresetGroup {
  label: ReactNode;
  values: string[];
}

/** `TimePicker` presets — a flat `string[]` or labelled {@link TimePickerPresetGroup}s. */
export type TimePickerPresets = string[] | TimePickerPresetGroup[];

/* -------------------------------------------------------------------------- */
/* DatePickerValue                                                            */
/* -------------------------------------------------------------------------- */

/** A single selectable date value. */
export type DateValue = DateStringValue | Date | null;

/** A `[start, end]` range value. */
export type DatesRangeValue<ValueType = DateValue> = [ValueType | null, ValueType | null];

/** Selection mode of a date picker. */
export type DatePickerType = "default" | "multiple" | "range";

/**
 * The value shape for a picker, resolved from its `type`:
 * `range` → `[start, end]`, `multiple` → array, `default` → single value.
 */
export type DatePickerValue<
  Type extends DatePickerType = "default",
  ValueType = DateValue,
> = Type extends "range"
  ? DatesRangeValue<ValueType>
  : Type extends "multiple"
    ? ValueType[]
    : ValueType | null;

/* -------------------------------------------------------------------------- */
/* PickerBaseProps                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Base value props shared by every input-trigger picker. Defined now so the
 * surface is stable for later iterations even though no picker consumes it yet.
 */
export interface PickerBaseProps<Type extends DatePickerType = "default"> {
  /** Picker type: `range`, `multiple` or `default`. */
  type?: DatePickerType | Type;

  /** Value for controlled component. */
  value?: DatePickerValue<Type>;

  /** Default value for uncontrolled component. */
  defaultValue?: DatePickerValue<Type>;

  /** Called when value changes. */
  onChange?: (value: DatePickerValue<Type, DateStringValue>) => void;

  /** Whether the user can deselect a date by clicking it again — `type="default"` only. */
  allowDeselect?: Type extends "default" ? boolean : never;

  /** Whether a single day can be selected as a range — `type="range"` only. */
  allowSingleDateInRange?: Type extends "range" ? boolean : never;
}

/* -------------------------------------------------------------------------- */
/* ControlsGroupSettings                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Cross-platform press event for a calendar control, derived from
 * `PickerControl`'s own `onPress` prop signature — never `React.MouseEvent`.
 */
export type ControlPressEvent = Parameters<NonNullable<PickerControlProps["onPress"]>>[0];

/**
 * Cross-platform keyboard event for a calendar control, derived from
 * `PickerControl`'s own `onKeyDown` prop signature — never `React.KeyboardEvent`.
 */
export type ControlKeyboardEvent = Parameters<NonNullable<PickerControlProps["onKeyDown"]>>[0];

/**
 * Settings shared by the month/year selection grids (`MonthsList`/`YearsList`)
 * and consumed by the level groups for roving-focus arrow navigation. Ported
 * from Mantine `types/ControlsGroupSettings.ts`, re-typed cross-platform: control
 * refs surface as `FocusableControl` descriptors (host node + skip flags, built by
 * the grid), and the press/keyboard events are the kit's own
 * `ControlPressEvent`/`ControlKeyboardEvent` (above) instead of DOM events.
 */
export interface ControlsGroupSettings {
  /** Called when a control is pressed, with the press event and its date. */
  __onControlClick?: (event: ControlPressEvent, date: DateStringValue) => void;

  /** Called when the pointer enters a control (web hover); used for range preview. */
  __onControlMouseEnter?: (event: unknown, date: DateStringValue) => void;

  /** Called on a control keydown; used for arrow-key navigation. */
  __onControlKeyDown?: (event: ControlKeyboardEvent, payload: ControlKeydownPayload) => void;

  /**
   * Receives a `FocusableControl` descriptor for each control by grid position;
   * used for arrow-key roving focus. The grid builds it from the host node plus
   * the control's disabled state so the navigation engine can skip cross-platform.
   */
  __getControlRef?: (rowIndex: number, cellIndex: number, control: FocusableControl) => void;

  /** Minimum possible date in `YYYY-MM-DD` format or a `Date` object. */
  minDate?: DateStringValue | Date;

  /** Maximum possible date in `YYYY-MM-DD` format or a `Date` object. */
  maxDate?: DateStringValue | Date;

  /** dayjs locale; falls back to the value defined in `DatesProvider`. */
  locale?: string;
}
