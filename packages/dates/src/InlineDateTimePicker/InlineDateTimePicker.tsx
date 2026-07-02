// ───────────────────────────────────────────────────────────────────────────
// InlineDateTimePicker — mirrors the `@mantine/dates` `InlineDateTimePicker`
// API, built on the kit's date family: a `DatePicker` (date selection in
// `default` / `range` mode) composed inline with one or two `TimePicker`s and a
// submit `ActionIcon`. There is NO popover here — the calendar and the time row
// are always rendered together; `DateTimePicker` is what wraps this in an
// input-trigger popover/modal. Like `DatePicker` / `DateTimePicker`, this is a
// thin COMPOSING wrapper over already-styled kit parts — it owns no cells,
// controls, or theme of its own.
//
// Cross-platform: web + native from this single source. Every prop forwarded
// here is itself cross-platform — date cells/time inputs/the submit button are
// `UnstyledButton`/`Input`/`ActionIcon` surfaces, and `__stopPropagation` /
// `__onEnter` are web refinements that are no-ops on native. No web-only API is
// reached (the time-row layout is plain Tamagui `Box` flex, and Enter handling
// rides `TimePicker`'s cross-platform `onKeyDown`).
//
// On the kit checklist (see `_reference/README.md`): the cell-level rules live
// DOWNSTREAM and are DELEGATED, while the wrapper-level rules are carried here.
//   1.  This provenance header.
//   2/3/4/5/6/12. Shared `size` context, derived `cell-metrics` sizing,
//       theme-ramp colors, styled cell parts + marker slots and
//       interaction-in-style all live DOWNSTREAM in `DatePicker` → level groups
//       / cells and in `TimePicker` / `ActionIcon`. The public `size` is
//       forwarded straight through to every composed part, so re-declaring them
//       here would reach no consumer (the same call `DatePicker` documents).
//   7.  Per-slot `styles` sugar over the wrapper parts (`SlotStyles` +
//       `slotStyles().merge`) PLUS the per-part `timePickerProps` /
//       `endTimePickerProps` / `submitButtonProps` passthrough — the wrapper's
//       flavour of "explicit beats sugar" (explicit `*Props` win over the slot).
//   8.  Controlled / uncontrolled selection via `useUncontrolledDates`.
//   9.  Locale + value formatting via `useDatesContext` + dayjs (consumer
//       `locale` prop wins over the provider).
//   10. min/max bounds via the shared `clampDate` util on selection plus the
//       `getMinTime`/`getMaxTime` clamps on the time inputs.
//   11. a11y is delegated to the composed parts — the calendar cells, the
//       labelled `TimePicker` segments, and the submit `ActionIcon`.
//   13. The `<Type>` generic is preserved through `forwardRef` (which would
//       otherwise pin it at `"default"`), so the ref is forwarded via a typed
//       `forwardRef` rather than `.styleable` — the documented sibling-picker
//       pattern (`DatePicker` / `DateTimePicker`).
//   14. The styled wrapper parts (`.TimeWrapper` / `.TimeInput` / `.SubmitButton`
//       / `.RangeInfo`) are attached as static properties so consumers can
//       compose and `styled(InlineDateTimePicker.TimeWrapper, …)`.
//   15. Compiler-safe show/hide: the time row is mounted/unmounted via the
//       `currentLevel === "month"` conditional subtree — never a dynamic
//       `opacity`/`display` style prop.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";
import { useRef, useState } from "react";

import dayjs from "dayjs";

import { ActionIcon, type ActionIconProps, Box, Text } from "@knitui/components";
import {
  type GetProps,
  slotStyles,
  type SlotStyles,
  styled,
  type TamaguiElement,
  withStaticProperties,
} from "@knitui/core";
import { useDidUpdate, useMergedRef } from "@knitui/hooks";

import { pickCalendarProps } from "../Calendar";
import { DatePicker, type DatePickerBaseProps } from "../DatePicker";
import { useDatesContext } from "../DatesProvider";
import { useUncontrolledDates } from "../hooks";
import { focusElement } from "../internal/focus-element";
import { TimePicker, type TimePickerKeyDownEvent, type TimePickerProps } from "../TimePicker";
import type {
  CalendarLevel,
  DatePickerType,
  DatePickerValue,
  DatesRangeValue,
  DateStringValue,
} from "../types";
import { assignTime, clampDate, getDefaultClampedDate, getMaxTime, getMinTime } from "../utils";

/** Sizes accepted by the inline date-time picker — the kit's xs–xl scale. */
export type InlineDateTimePickerSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Props passed to the submit button — the kit `ActionIcon` surface (NO web `<button>` props). */
export type InlineDateTimePickerSubmitButtonProps = ActionIconProps;

// ── Styled wrapper parts ─────────────────────────────────────────────────────
// The time row is the only layout this wrapper owns (the calendar, time inputs
// and submit button are already-styled kit parts). These thin `Box`/`Text`
// parts give the `styles` sugar and consumer `styled(…)` extension a real target
// to land on — the calendar twin of Mantine's `timeWrapper` / `rangeInfo`
// class-name slots.

/** Row wrapping the time input(s) and the submit button. */
const InlineDateTimePickerTimeWrapper = styled(Box, {
  name: "InlineDateTimePickerTimeWrapper",
  flexDirection: "row",
  alignItems: "center",
  gap: "$xs",
  marginTop: "$xs",
});

/** Read-only summary of the selected range (range mode only). */
const InlineDateTimePickerRangeInfo = styled(Text, {
  name: "InlineDateTimePickerRangeInfo",
  marginTop: "$xs",
});

/**
 * The named style slots and the part each targets.
 *
 * The cell-level slots (days/months/years) are NOT re-declared here — they live
 * on `DatePicker` and are reached through `calendarProps`. These cover the time
 * row this wrapper owns plus the composed time inputs / submit button.
 */
export interface InlineDateTimePickerStyles {
  /** Props for the root frame (the column wrapping the calendar and time row). */
  root?: GetProps<typeof Box>;
  /** Props for the time row wrapper (`.TimeWrapper`). */
  timeWrapper?: GetProps<typeof InlineDateTimePickerTimeWrapper>;
  /** Props for each time input (merged UNDER `timePickerProps` / `endTimePickerProps`). */
  timeInput?: Omit<TimePickerProps, "defaultValue" | "value">;
  /** Props for the submit button (merged UNDER `submitButtonProps`). */
  submitButton?: InlineDateTimePickerSubmitButtonProps;
  /** Props for the range summary text (`.RangeInfo`, range mode only). */
  rangeInfo?: GetProps<typeof InlineDateTimePickerRangeInfo>;
}

const INLINE_DATE_TIME_PICKER_SLOT_KEYS = [
  "root",
  "timeWrapper",
  "timeInput",
  "submitButton",
  "rangeInfo",
] as const satisfies readonly (keyof InlineDateTimePickerStyles)[];

/**
 * Box frame props the inline picker exposes, omitting the value/state keys plus
 * `size`/`onMouseLeave` (re-declared cross-platform below / by the calendar) so it
 * can extend both the Box frame and {@link DatePickerBaseProps} without a clash.
 */
type InlineDateTimePickerFrameProps = Omit<
  GetProps<typeof Box>,
  "size" | "children" | "value" | "defaultValue" | "onChange" | "onMouseLeave"
>;

export interface InlineDateTimePickerProps<Type extends DatePickerType = "default">
  extends InlineDateTimePickerFrameProps, DatePickerBaseProps<Type> {
  /** Default time value in `HH:mm` or `HH:mm:ss` format. Assigned to the time when a date is selected. */
  defaultTimeValue?: string;

  /** Props passed down to the `TimePicker` component. */
  timePickerProps?: Omit<TimePickerProps, "defaultValue" | "value">;

  /** Props passed down to the end time `TimePicker` component in range mode. */
  endTimePickerProps?: Omit<TimePickerProps, "defaultValue" | "value">;

  /** Props passed down to the submit button. */
  submitButtonProps?: InlineDateTimePickerSubmitButtonProps;

  /** Whether the seconds input is displayed. @default false */
  withSeconds?: boolean;

  /** Called when the submit button is pressed. */
  onSubmit?: () => void;

  /**
   * `dayjs` format for range display, or a function that receives the value as a
   * `YYYY-MM-DD HH:mm:ss` string and returns the formatted value.
   * @default "DD/MM/YYYY HH:mm"
   */
  valueFormat?: string | ((date: DateStringValue) => string);

  /** Separator between the two range values. */
  labelSeparator?: string;

  /** Component size. @default 'sm' */
  size?: InlineDateTimePickerSize;

  /** Stretch the picker to the full width of its container. @default true */
  fullWidth?: boolean;

  /**
   * Per-slot style sugar — props spread onto the matching wrapper part. Sits
   * UNDER the explicit `timePickerProps` / `endTimePickerProps` /
   * `submitButtonProps` (explicit beats sugar).
   */
  styles?: SlotStyles<InlineDateTimePickerStyles>;

  /** @internal Called when Enter is pressed in a time input. */
  __onEnter?: () => void;
}

/**
 * Preserves the `<Type>` generic through `forwardRef` (which would otherwise pin
 * `Type` at its `"default"` instantiation), mirroring the other pickers'
 * `*Component` aliases — NOT Mantine's `genericFactory`.
 */
type InlineDateTimePickerComponent = <Type extends DatePickerType = "default">(
  props: InlineDateTimePickerProps<Type> & { ref?: React.Ref<TamaguiElement> },
) => React.JSX.Element;

/**
 * `InlineDateTimePicker` — the always-open composite of a `DatePicker` (date
 * selection in `default` / `range` mode) plus one or two `TimePicker`s and a
 * submit `ActionIcon`. The `any`-free, cross-platform port of Mantine's
 * `InlineDateTimePicker`: selecting a date assigns the current time string onto
 * it (clamped to `min`/`max`) and focuses the hours input; the time inputs
 * re-assign the time portion onto the selected date. The time row is shown only
 * on the `month` level. `DateTimePicker` wraps this in an input-trigger popover.
 * Per-slot `styles` sugar targets the time-row wrapper parts; per-part
 * `timePickerProps` / `submitButtonProps` win over it. Accent comes from the
 * active Tamagui theme.
 *
 * @example
 * <InlineDateTimePicker value={value} onChange={setValue} defaultDate="2026-06-15" />
 */
function InlineDateTimePickerInner<Type extends DatePickerType = "default">(
  props: InlineDateTimePickerProps<Type>,
  ref: React.ForwardedRef<TamaguiElement>,
): React.JSX.Element {
  const {
    type = "default",
    value,
    defaultValue,
    onChange,
    valueFormat,
    locale,
    timePickerProps,
    endTimePickerProps,
    submitButtonProps,
    withSeconds,
    level,
    defaultLevel,
    size = "sm",
    minDate,
    maxDate,
    defaultDate,
    defaultTimeValue,
    presets,
    allowSingleDateInRange,
    onSubmit,
    labelSeparator,
    fullWidth,
    styles,
    __stopPropagation,
    __onEnter,
    __onPresetSelect,
    ...rest
  } = props;

  const ctx = useDatesContext();
  // `fullWidth` defaults to `true` here (Mantine parity): the inline picker
  // stretches unless the consumer opts out. The root frame must opt in too — the
  // composed `DatePicker` / time row resolve their stretch against it.
  const _fullWidth = fullWidth ?? true;
  const _valueFormat = valueFormat || (withSeconds ? "DD/MM/YYYY HH:mm:ss" : "DD/MM/YYYY HH:mm");
  const _labelSeparator = ctx.getLabelSeparator(labelSeparator);
  const isRange = type === "range";

  // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
  const s = slotStyles<InlineDateTimePickerStyles>(
    styles,
    INLINE_DATE_TIME_PICKER_SLOT_KEYS,
    "InlineDateTimePicker",
  );

  const startTimePickerRef = useRef<TamaguiElement | null>(null);
  const startTimePickerRefMerged = useMergedRef(startTimePickerRef, timePickerProps?.hoursRef);
  const endTimePickerRef = useRef<TamaguiElement | null>(null);
  const endTimePickerRefMerged = useMergedRef(endTimePickerRef, endTimePickerProps?.hoursRef);

  const { calendarProps, others } = pickCalendarProps(rest);

  const [_value, setValue] = useUncontrolledDates<Type>({
    type: type as Type,
    value,
    defaultValue,
    onChange,
    withTime: true,
  });

  // The current selection split into the two shapes the component cares about.
  // `typeof` narrows the single value with no cast; the range shape needs one
  // (the generic `_value` is an unresolved conditional `Array.isArray` can't
  // narrow on its own).
  const rangeValue: DatesRangeValue<DateStringValue> | null =
    isRange && Array.isArray(_value) ? (_value as DatesRangeValue<DateStringValue>) : null;
  const singleValue: DateStringValue | null =
    !isRange && typeof _value === "string" ? _value : null;

  const formatTime = (dateValue: DateStringValue | null): string =>
    dateValue ? dayjs(dateValue).format(withSeconds ? "HH:mm:ss" : "HH:mm") : "";

  const getInitialStartTime = (): string => {
    if (defaultTimeValue) {
      return defaultTimeValue;
    }
    if (isRange) {
      return rangeValue ? formatTime(rangeValue[0]) : "";
    }
    return formatTime(singleValue);
  };

  const getInitialEndTime = (): string => {
    if (defaultTimeValue) {
      return defaultTimeValue;
    }
    return isRange && rangeValue ? formatTime(rangeValue[1]) : "";
  };

  const [startTimeValue, setStartTimeValue] = useState(getInitialStartTime);
  const [endTimeValue, setEndTimeValue] = useState(getInitialEndTime);
  const [currentLevel, setCurrentLevel] = useState<CalendarLevel>(level || defaultLevel || "month");

  const _defaultDate =
    (isRange ? (rangeValue ? rangeValue[0] : null) : singleValue) ??
    defaultDate ??
    getDefaultClampedDate({ minDate, maxDate });

  const focusStartTime = (): void => {
    const node = startTimePickerRef.current;
    if (node) {
      focusElement(node);
    }
  };

  const applyTime = (date: DateStringValue, time: string): DateStringValue | null =>
    assignTime(clampDate(minDate, maxDate, date), time || defaultTimeValue || "");

  const handleDateChange = (date: DatePickerValue<Type, DateStringValue>): void => {
    if (isRange && Array.isArray(date)) {
      const [start, end] = date as DatesRangeValue<DateStringValue>;
      const newStart = start ? applyTime(start, startTimeValue) : null;
      const newEnd = end ? applyTime(end, endTimeValue) : null;
      setValue([newStart, newEnd] as DatePickerValue<Type, DateStringValue>);

      if (start && end) {
        focusStartTime();
      }
    } else {
      const single = typeof date === "string" ? date : null;
      if (single) {
        setValue(applyTime(single, startTimeValue) as DatePickerValue<Type, DateStringValue>);
      }
      focusStartTime();
    }
  };

  const handleStartTimeChange = (timeString: string): void => {
    timePickerProps?.onChange?.(timeString);
    setStartTimeValue(timeString);

    if (!timeString) {
      return;
    }

    if (isRange && rangeValue) {
      if (rangeValue[0]) {
        const newStart = assignTime(rangeValue[0], timeString);
        setValue([newStart, rangeValue[1]] as DatePickerValue<Type, DateStringValue>);
      }
    } else {
      setValue(assignTime(singleValue, timeString) as DatePickerValue<Type, DateStringValue>);
    }
  };

  const handleEndTimeChange = (timeString: string): void => {
    endTimePickerProps?.onChange?.(timeString);
    setEndTimeValue(timeString);

    if (timeString && isRange && rangeValue && rangeValue[1]) {
      const newEnd = assignTime(rangeValue[1], timeString);
      setValue([rangeValue[0], newEnd] as DatePickerValue<Type, DateStringValue>);
    }
  };

  const handleTimeInputKeyDown = (event: TimePickerKeyDownEvent): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      __onEnter?.();
    }
  };

  const getFormattedRange = (): string => {
    if (!isRange || !rangeValue) {
      return "";
    }

    const formatDate = (v: DateStringValue | null): string => {
      if (!v) {
        return "";
      }
      if (typeof _valueFormat === "function") {
        return _valueFormat(v);
      }
      return dayjs(v).locale(ctx.getLocale(locale)).format(_valueFormat);
    };

    const start = formatDate(rangeValue[0]);
    const end = formatDate(rangeValue[1]);

    if (start && end) {
      return `${start} ${_labelSeparator} ${end}`;
    }

    if (start) {
      return `${start} ${_labelSeparator} ...`;
    }

    return "";
  };

  useDidUpdate(() => {
    if (isRange && rangeValue) {
      setStartTimeValue(formatTime(rangeValue[0]));
      setEndTimeValue(formatTime(rangeValue[1]));
    } else {
      setStartTimeValue(formatTime(singleValue));
    }
  }, [_value]);

  const startMinTime = getMinTime({
    minDate,
    value: isRange ? (rangeValue?.[0] ?? null) : singleValue,
  });
  const startMaxTime = getMaxTime({
    maxDate,
    value: isRange ? (rangeValue?.[0] ?? null) : singleValue,
  });
  const endMinTime = isRange ? getMinTime({ minDate, value: rangeValue?.[1] ?? null }) : undefined;
  const endMaxTime = isRange ? getMaxTime({ maxDate, value: rangeValue?.[1] ?? null }) : undefined;

  const submitButton = (
    <ActionIcon
      variant="default"
      size={size}
      // explicit beats sugar: the `submitButton` slot sits UNDER `submitButtonProps`.
      {...s.merge("submitButton", submitButtonProps)}
      onPress={(event) => {
        submitButtonProps?.onPress?.(event);
        onSubmit?.();
      }}
    >
      {submitButtonProps?.children ?? <Text>✓</Text>}
    </ActionIcon>
  );

  return (
    <Box ref={ref} width={_fullWidth ? "100%" : undefined} {...s.get("root")} {...others}>
      <DatePicker
        // `fullWidth` makes the calendar fill BOTH axes (its frame carries
        // `flexGrow: 1`), so when the picker is given a height the calendar fills
        // the space left by the fixed time row — no extra `flexGrow` needed here.
        fullWidth={_fullWidth}
        {...calendarProps}
        minDate={minDate}
        maxDate={maxDate}
        size={size}
        type={type as Type}
        value={_value}
        defaultDate={_defaultDate}
        onChange={handleDateChange}
        locale={locale}
        level={level}
        defaultLevel={defaultLevel}
        onLevelChange={(_level) => {
          setCurrentLevel(_level);
          calendarProps.onLevelChange?.(_level);
        }}
        presets={presets}
        allowSingleDateInRange={allowSingleDateInRange}
        __onPresetSelect={__onPresetSelect}
        __stopPropagation={__stopPropagation}
      />

      {currentLevel === "month" && !isRange ? (
        <InlineDateTimePickerTimeWrapper {...s.get("timeWrapper")}>
          <TimePicker
            value={startTimeValue}
            withSeconds={withSeconds}
            min={startMinTime}
            max={startMaxTime}
            flex={1}
            // explicit beats sugar: the `timeInput` slot sits UNDER `timePickerProps`.
            {...s.merge("timeInput", timePickerProps)}
            onChange={handleStartTimeChange}
            onKeyDown={handleTimeInputKeyDown}
            size={size}
            hoursRef={startTimePickerRefMerged}
          />
          {submitButton}
        </InlineDateTimePickerTimeWrapper>
      ) : null}

      {currentLevel === "month" && isRange ? (
        <>
          <InlineDateTimePickerRangeInfo {...s.get("rangeInfo")}>
            {getFormattedRange()}
          </InlineDateTimePickerRangeInfo>

          <InlineDateTimePickerTimeWrapper {...s.get("timeWrapper")}>
            <TimePicker
              value={startTimeValue}
              withSeconds={withSeconds}
              min={startMinTime}
              max={startMaxTime}
              flex={1}
              {...s.merge("timeInput", timePickerProps)}
              onChange={handleStartTimeChange}
              onKeyDown={handleTimeInputKeyDown}
              size={size}
              hoursRef={startTimePickerRefMerged}
            />

            <TimePicker
              value={endTimeValue}
              withSeconds={withSeconds}
              min={endMinTime}
              max={endMaxTime}
              flex={1}
              {...s.merge("timeInput", endTimePickerProps)}
              onChange={handleEndTimeChange}
              onKeyDown={handleTimeInputKeyDown}
              size={size}
              hoursRef={endTimePickerRefMerged}
            />

            {submitButton}
          </InlineDateTimePickerTimeWrapper>
        </>
      ) : null}
    </Box>
  );
}

// ── Public surface ────────────────────────────────────────────────────────────
// The typed `forwardRef` cast preserves the `<Type>` generic (the sibling-picker
// pattern). `withStaticProperties` then attaches the styled wrapper parts so
// consumers can compose and `styled(InlineDateTimePicker.TimeWrapper, …)`.
const InlineDateTimePickerComponentBase = React.forwardRef(
  InlineDateTimePickerInner,
) as InlineDateTimePickerComponent & { displayName?: string };

InlineDateTimePickerComponentBase.displayName = "@knitui/dates/InlineDateTimePicker";

export const InlineDateTimePicker = withStaticProperties(InlineDateTimePickerComponentBase, {
  TimeWrapper: InlineDateTimePickerTimeWrapper,
  RangeInfo: InlineDateTimePickerRangeInfo,
});
