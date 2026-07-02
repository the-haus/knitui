// ───────────────────────────────────────────────────────────────────────────
// DateInput — the free-typing single-date field.
//
// Mirrors the `@mantine/dates` `DateInput` API (`type:'default'` only) and is
// built on `@knitui/components` (`Input`/`Popover`/`Calendar`) + `@knitui/core` +
// dayjs. One cross-platform source serves web and native: the editable input
// uses the kit's `onChangeText`/`onFocus`/`onBlur` (never DOM events), parsing
// is deterministic dayjs, Escape-to-close is web-guarded, and outside-dismiss
// rides the kit Popover's adapter. Accent comes from the active Tamagui theme.
//
// DateInput composes already-styled kit parts rather than defining its own, so
// the styled-Frame / shared-context / cell-metrics rules apply to the parts it
// delegates to: `size` flows to `Input`/`Calendar` (both derive their sizing
// from the `cell-metrics`/`controlMetrics` ladders) and theme-ramp colors come
// from those parts. What this file owns from the checklist: the per-slot
// `styles` sugar (point 7) over the composed parts, the per-item
// `getDayProps`/`getMonthControlProps`/`getYearControlProps` passthrough
// (point 7), controlled/uncontrolled value (point 8), locale + dayjs formatting
// (point 9), min/max bounds (point 10), and the documented compiler-safe show/
// hide of the clear button (point 15). Marker slots (point 6) do NOT apply — a
// single-field input is a leaf, not a composable multi-section surface.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import dayjs from "dayjs";

import { Input, Popover } from "@knitui/components";
import {
  type GetProps,
  isWeb,
  slotStyles,
  type SlotStyles,
  type TamaguiElement,
} from "@knitui/core";
import { useDisclosure } from "@knitui/hooks";

import {
  Calendar,
  type CalendarBaseProps,
  type CalendarSettings,
  pickCalendarProps,
} from "../Calendar";
import { type CalendarSize } from "../cell-metrics";
import { useDatesContext } from "../DatesProvider";
import { type DayProps } from "../Day";
import { HiddenDatesInput } from "../HiddenDatesInput";
import { useUncontrolledDates } from "../hooks";
import { hasPreventDefault } from "../internal/has-prevent-default";
import { parseDateString } from "../internal/parse-date-string";
import { type DateInputSharedProps } from "../PickerInputBase";
import type { CalendarLevel, DateStringValue, DateValue } from "../types";
import { isDateValid, isSameMonth, toDateString, toDateTimeString } from "../utils";

/** Cross-platform day-press event, derived from `Day`'s own `onPress` signature. */
type DayPressEvent = Parameters<NonNullable<DayProps["onPress"]>>[0];

/**
 * Per-slot `styles` sugar — a map from named slot to that part's props. Resolved
 * through `slotStyles().merge`, so the precedence is fixed in one place:
 * `defaults < styles[slot] < explicit props the component sets`. Each slot
 * targets a composed kit part; per-day/per-control dynamics that a static map
 * can't express stay on the `getDayProps`/`getMonthControlProps`/
 * `getYearControlProps` callbacks.
 */
export interface DateInputStyles {
  /** Props for the `Input.Wrapper` (label/description/error surface). */
  wrapper?: GetProps<typeof Input.Wrapper>;
  /** Props for the editable trigger `Input`. */
  input?: GetProps<typeof Input>;
  /** Props for the `Popover.Dropdown` that holds the calendar. */
  dropdown?: GetProps<typeof Popover.Dropdown>;
  /** Props for the inline `Calendar` inside the dropdown. */
  calendar?: GetProps<typeof Calendar>;
}

const DATE_INPUT_SLOT_KEYS = [
  "wrapper",
  "input",
  "dropdown",
  "calendar",
] as const satisfies readonly (keyof DateInputStyles)[];

export interface DateInputProps
  extends Omit<DateInputSharedProps, "size">, CalendarBaseProps, CalendarSettings {
  /** Parse user input into a date string (or `Date`); falls back to the locale-aware default parser. */
  dateParser?: (value: string) => DateStringValue | Date | null;

  /** Controlled value. */
  value?: DateValue | Date;

  /** Uncontrolled default value. */
  defaultValue?: DateValue | Date;

  /** Called when the value changes. */
  onChange?: (value: DateStringValue | null) => void;

  /** `dayjs` format used to display (and parse) the value. @default 'MMMM D, YYYY' */
  valueFormat?: string;

  /** Preserve the time part of the value (set when `valueFormat` includes time). @default false */
  withTime?: boolean;

  /** Restore the last valid value on blur when input is invalid. @default true */
  fixOnBlur?: boolean;

  /** Allow clearing the value by emptying the input / clicking the selected day. @default `clearable` */
  allowDeselect?: boolean;

  /** Max level the user can zoom out to. @default 'decade' */
  maxLevel?: CalendarLevel;

  /** Trigger / control size. @default 'sm' */
  size?: CalendarSize;

  /** Per-slot style sugar — props spread onto the matching composed part (`wrapper`/`input`/`dropdown`/`calendar`). */
  styles?: SlotStyles<DateInputStyles>;
}

/**
 * `DateInput` — the free-typing single-date field. Composes a kit `Input.Wrapper`
 * around a `Popover` whose target is an EDITABLE `Input` and whose dropdown holds
 * an inline `Calendar`. Typing a value in `valueFormat` (`'MMMM D, YYYY'` by
 * default) parses + selects it and moves the calendar; an unparseable string is
 * preserved while typing and (with `fixOnBlur`) reverts on blur; emptying the
 * input deselects when `allowDeselect`/`clearable`; picking a day fills the input
 * and closes the dropdown.
 *
 * The `any`-free, cross-platform port of Mantine's `DateInput` (`type:'default'`
 * only). Parsing is deterministic dayjs (never `new Date(string)`); the editable
 * input uses the kit's cross-platform `onChangeText`/`onFocus`/`onBlur` (never DOM
 * events); Escape-to-close is web-guarded; outside-dismiss rides the kit Popover's
 * own adapter (no `useClickOutside`). Accent comes from the active Tamagui theme.
 */
export const DateInput = React.forwardRef<TamaguiElement, DateInputProps>(
  function DateInput(props, ref) {
    const {
      value,
      defaultValue,
      onChange,
      dateParser,
      valueFormat = "MMMM D, YYYY",
      withTime = false,
      fixOnBlur = true,
      allowDeselect,
      size = "sm",
      styles,
      variant,
      clearable = false,
      clearButtonProps,
      popoverProps,
      name,
      form,
      label,
      description,
      error,
      required,
      placeholder,
      readOnly,
      disabled,

      // Calendar settings handled / overridden here (kept out of `calendarProps`).
      getDayProps,
      getMonthControlProps,
      getYearControlProps,
      locale,
      minDate,
      maxDate,
      date,
      defaultDate,
      onDateChange,

      // Accepted for API parity but not applicable to a single free-text field;
      // referenced so the destructure stays exhaustive and they never leak.
      closeOnChange,
      sortDates,
      labelSeparator,
      valueFormatter,
      dropdownType,
      modalProps,
      __stopPropagation,

      ...rest
    } = props;

    void closeOnChange;
    void sortDates;
    void labelSeparator;
    void valueFormatter;
    void dropdownType;
    void modalProps;
    void __stopPropagation;

    const { calendarProps, others } = pickCalendarProps(rest);
    const ctx = useDatesContext();
    const [dropdownOpened, dropdownHandlers] = useDisclosure(false);

    // Typed per-slot accessor (dev-warns unknown keys against the known set).
    // Distributed with "explicit beats sugar" precedence: the component's own
    // props are spread AFTER `s.get(slot)` so they always win.
    const s = slotStyles<DateInputStyles>(styles, DATE_INPUT_SLOT_KEYS, "DateInput");

    const _dateParser =
      dateParser ??
      ((val: string) =>
        parseDateString({
          value: val,
          format: valueFormat,
          locale: ctx.getLocale(locale),
          withTime,
        }));

    const _allowDeselect = allowDeselect !== undefined ? allowDeselect : clearable;

    const formatValue = (val: DateStringValue | null): string =>
      val ? dayjs(val).locale(ctx.getLocale(locale)).format(valueFormat) : "";

    const [_value, setValue, controlled] = useUncontrolledDates({
      type: "default",
      value,
      defaultValue,
      onChange,
      withTime,
    });

    const [_date, setDate] = useUncontrolledDates({
      type: "default",
      value: date,
      defaultValue: defaultValue ?? defaultDate,
      // `onDateChange` is `(date: DateStringValue) => void`; the displayed date is
      // never cleared, so narrow the stored `string | null` back for the callback
      // (the same pattern `Calendar` uses) — never `as any`.
      onChange: onDateChange ? (next) => next !== null && onDateChange(next) : undefined,
    });

    React.useEffect(() => {
      if (controlled && value != null) {
        setDate(toDateString(value));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controlled, value]);

    const [inputValue, setInputValue] = React.useState(formatValue(_value));

    React.useEffect(() => {
      setInputValue(formatValue(_value));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctx.getLocale(locale)]);

    // Sync the input text when the value changes externally while the dropdown is
    // closed (the cross-platform stand-in for Mantine's `useDidUpdate`).
    React.useEffect(() => {
      if (!dropdownOpened) {
        setInputValue(formatValue(_value));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [_value]);

    const handleChange = (text: string) => {
      setInputValue(text);
      dropdownHandlers.open();

      if (text.trim() === "" && _allowDeselect) {
        setValue(null);
        return;
      }

      const parsed = _dateParser(text);
      if (parsed && isDateValid({ date: parsed, minDate, maxDate })) {
        setValue(withTime ? toDateTimeString(parsed) : toDateString(parsed));
        setDate(toDateString(parsed));
      }
    };

    const handleFocus = () => {
      dropdownHandlers.open();
    };

    const handleBlur = () => {
      dropdownHandlers.close();
      if (fixOnBlur) {
        setInputValue(formatValue(_value));
      }
    };

    // Escape closes the dropdown — web only (native has no key event here). The
    // structural `{ key }` param keeps this cross-platform (no DOM event type).
    const handleKeyDown = (event: { key: string }) => {
      if (isWeb && event.key === "Escape") {
        dropdownHandlers.close();
      }
    };

    const _getDayProps = (day: DateStringValue) => {
      const caller = getDayProps?.(day);
      return {
        ...caller,
        selected: dayjs(_value).isSame(day, "day"),
        onPress: (event: DayPressEvent) => {
          caller?.onPress?.(event);
          const next = _allowDeselect ? (dayjs(_value).isSame(day, "day") ? null : day) : day;
          setValue(next);
          if (!controlled && next) {
            setInputValue(formatValue(next));
          }
          dropdownHandlers.close();
        },
      };
    };

    const _clearable = clearable && !!_value && !readOnly && !disabled;
    const clearButton = (
      <Input.ClearButton
        size={size}
        {...clearButtonProps}
        onPress={() => {
          setValue(null);
          if (!controlled) {
            setInputValue("");
          }
          dropdownHandlers.close();
        }}
        onPressIn={(event) => {
          // Web: keep the press from stealing focus from the trigger. No-op on
          // native (no `preventDefault`).
          if (hasPreventDefault(event)) {
            event.preventDefault();
          }
          clearButtonProps?.onPressIn?.(event);
        }}
      />
    );

    return (
      <>
        <Input.Wrapper
          {...others}
          {...s.get("wrapper")}
          label={label}
          description={description}
          error={error}
          required={required}
          size={size}
        >
          <Popover
            position="bottom-start"
            trapFocus={false}
            withRoles={false}
            {...popoverProps}
            opened={dropdownOpened}
            disabled={popoverProps?.disabled || readOnly || disabled}
            onChange={(opened) => {
              popoverProps?.onChange?.(opened);
              if (opened) {
                dropdownHandlers.open();
              } else {
                dropdownHandlers.close();
              }
            }}
          >
            {/* `withPressToggle={false}`: DateInput's editable trigger drives the
                dropdown from its OWN `onFocus`/`onChangeText`/`onBlur` events, not
                a Popover press-toggle. With the default toggle on, a real tap/click
                (which delivers focus AND a press) would open via focus then the
                press would TOGGLE it back closed within one gesture (the same way a
                single tap broke the picker on native). Mirrors the Combobox wiring. */}
            <Popover.Target withPressToggle={false}>
              <Input
                {...s.get("input")}
                ref={ref}
                autoComplete="off"
                size={size}
                variant={variant}
                error={error}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={placeholder}
                value={inputValue}
                onChangeText={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                __clearSection={clearButton}
                __clearable={_clearable}
              />
            </Popover.Target>

            <Popover.Dropdown {...s.get("dropdown")}>
              <Calendar
                {...calendarProps}
                {...s.get("calendar")}
                __preventFocus
                minDate={minDate}
                maxDate={maxDate}
                locale={locale}
                size={size}
                date={_date ?? undefined}
                onDateChange={setDate}
                getDayProps={_getDayProps}
                getMonthControlProps={(controlDate) => ({
                  selected: typeof _value === "string" ? isSameMonth(controlDate, _value) : false,
                  ...getMonthControlProps?.(controlDate),
                })}
                getYearControlProps={(controlDate) => ({
                  selected:
                    typeof _value === "string" ? dayjs(controlDate).isSame(_value, "year") : false,
                  ...getYearControlProps?.(controlDate),
                })}
              />
            </Popover.Dropdown>
          </Popover>
        </Input.Wrapper>

        <HiddenDatesInput
          name={name}
          form={form}
          value={_value}
          type="default"
          withTime={withTime}
        />
      </>
    );
  },
);

DateInput.displayName = "@knitui/dates/DateInput";
