// ───────────────────────────────────────────────────────────────────────────
// TimeInput — the standalone, free-typing single time field.
//
// Mirrors the `@mantine/dates` `TimeInput` API and is built on
// `@knitui/components` (`InputBase`) + `@knitui/core` + `@knitui/hooks`. Mantine
// renders a browser-native `<InputBase type="time">` (a widget with NO React
// Native equivalent), so ONE cross-platform source serves web and native: a
// controlled kit `InputBase` that free-edits the `HH:mm[:ss]` string via the
// kit's `value`/`onChangeText`/`onBlur` (never DOM events, never
// `event.currentTarget.value`). On blur the value is clamped into
// `[minTime, maxTime]` (numeric component comparison, ported from Mantine's
// `checkIfTimeLimitExceeded`).
//
// What this file owns from the `_reference` checklist: the controlled/
// uncontrolled value (point 8), `minTime`/`maxTime` bounds (the time twin of
// point 10), and the `step`-default parity with Mantine's native `type="time"`.
// The checklist items that do NOT apply, and why:
//   2/3/4/5  — TimeInput composes the already-styled kit `InputBase` rather than
//              defining its own Frame/parts, so shared `size` context, the
//              `cell-metrics` sizing ladder, theme-ramp colors and a styled Frame
//              all live in `InputBase` (which derives sizing from the
//              `controlMetrics` ladder); `size` flows straight through.
//   6        — marker slots: a single free-text field is a leaf, not a composable
//              multi-section surface (same call as `DateInput`).
//   7        — per-slot `styles` sugar: `InputBase` already exposes its own
//              label/description/error surface props (and a `styles` prop) through
//              the `GetProps<typeof InputBase>` spread, so a parallel `SlotStyles`
//              map would only duplicate the API — passthrough covers it.
//   9        — locale (12/24h): the value is always a 24h `HH:mm[:ss]` string (as
//              in Mantine's `type="time"`, whose VALUE is locale-independent);
//              12h labels live in the composed `TimePicker`, not this leaf.
//   11       — a11y: a labeled text field, so the web `textbox` role and the
//              label→input association are wired by `InputBase` on both platforms;
//              no extra `accessibility*` axis is needed (unlike the interactive
//              `Day`/segment leaves).
//   12/13/14/15 — interaction styling, `.styleable`, slot markers and the
//              compiler-safe show/hide trap all belong to styled parts; this leaf
//              owns none. Ref forwards to the `InputBase` host via `forwardRef`.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import { InputBase } from "@knitui/components";
import { type GetProps, type TamaguiElement } from "@knitui/core";
import { useUncontrolled } from "@knitui/hooks";

/**
 * `TimeInput` props. Mantine types this off `__BaseInputProps` +
 * `ElementProps<'input'>` and renders a browser-native `<InputBase type="time">`;
 * ours re-types onto a precise spread of the kit `InputBase` props via
 * `GetProps<typeof InputBase>` and renders a controlled text field (no
 * `type="time"`, which has no React Native equivalent). The styles-api
 * (`classNames`/`unstyled`/`vars`) and `withDropdown` are dropped.
 */
export interface TimeInputProps extends Omit<
  GetProps<typeof InputBase>,
  "value" | "defaultValue" | "onChange"
> {
  /** Controlled value — an `HH:mm[:ss]` string. */
  value?: string;

  /** Uncontrolled default value. */
  defaultValue?: string;

  /** Called when the value changes (the `HH:mm[:ss]` string). */
  onChange?: (value: string) => void;

  /** Whether a seconds segment should be expected/displayed. @default false */
  withSeconds?: boolean;

  /** Minimum allowed time — `HH:mm:ss` when `withSeconds`, otherwise `HH:mm`. */
  minTime?: string;

  /** Maximum allowed time — `HH:mm:ss` when `withSeconds`, otherwise `HH:mm`. */
  maxTime?: string;

  /**
   * Granularity of the underlying field, in seconds — mirrors Mantine's native
   * `<input type="time" step>`. When omitted the effective default is `1`
   * (second) if `withSeconds` is set and `60` (one minute) otherwise.
   */
  step?: number;
}

/**
 * Whether `val` is within `[minTime, maxTime]`: `0` inside, `-1` below `minTime`,
 * `1` above `maxTime`. Ported from Mantine's `checkIfTimeLimitExceeded` — numeric
 * component comparison so a missing seconds segment never breaks ordering.
 */
const checkIfTimeLimitExceeded = (
  val: string,
  minTime: string | undefined,
  maxTime: string | undefined,
  withSeconds: boolean,
): -1 | 0 | 1 => {
  if (minTime === undefined && maxTime === undefined) {
    return 0;
  }

  const [hours, minutes, seconds] = val.split(":").map(Number);

  if (minTime) {
    const [minHours, minMinutes, minSeconds] = minTime.split(":").map(Number);
    if (
      hours < minHours ||
      (hours === minHours && minutes < minMinutes) ||
      (withSeconds && hours === minHours && minutes === minMinutes && seconds < minSeconds)
    ) {
      return -1;
    }
  }

  if (maxTime) {
    const [maxHours, maxMinutes, maxSeconds] = maxTime.split(":").map(Number);
    if (
      hours > maxHours ||
      (hours === maxHours && minutes > maxMinutes) ||
      (withSeconds && hours === maxHours && minutes === maxMinutes && seconds > maxSeconds)
    ) {
      return 1;
    }
  }

  return 0;
};

/**
 * `TimeInput` — the standalone, controlled time field. The `any`-free,
 * cross-platform port of Mantine's `TimeInput`: Mantine renders an
 * `<InputBase type="time">` (a browser-native widget with NO React Native
 * equivalent), so ours is a controlled kit `InputBase` (`value`/`onChangeText`,
 * native `onBlur`) that free-edits the `HH:mm[:ss]` string. On blur the value is
 * clamped into `[minTime, maxTime]` (numeric component comparison, NEVER mutating
 * `event.currentTarget.value`). `withSeconds` widens the placeholder and sets the
 * `step` default (`1` vs `60`, matching Mantine's native `type="time"`); the kit
 * Input carries label/description/error/required/size. Ref forwards to the host.
 */
export const TimeInput = React.forwardRef<TamaguiElement, TimeInputProps>(
  function TimeInput(props, ref) {
    const {
      value,
      defaultValue,
      onChange,
      withSeconds = false,
      minTime,
      maxTime,
      step,
      onBlur,
      placeholder,
      inputMode,
      ...others
    } = props;

    const [_value, setValue] = useUncontrolled<string>({
      value,
      defaultValue,
      finalValue: "",
      onChange,
    });

    const handleBlur: GetProps<typeof InputBase>["onBlur"] = (event) => {
      onBlur?.(event);

      if (_value && (minTime !== undefined || maxTime !== undefined)) {
        const check = checkIfTimeLimitExceeded(_value, minTime, maxTime, withSeconds);
        if (check === 1 && maxTime) {
          setValue(maxTime);
        } else if (check === -1 && minTime) {
          setValue(minTime);
        }
      }
    };

    return (
      <InputBase
        ref={ref}
        inputMode={inputMode ?? "numeric"}
        placeholder={placeholder ?? (withSeconds ? "--:--:--" : "--:--")}
        // Mirror Mantine's `step ?? (withSeconds ? 1 : 60)`. The free-text field
        // has no native stepper UI, but the value carries through for parity and
        // for consumers wiring their own controls / native `type="time"` bridges.
        step={step ?? (withSeconds ? 1 : 60)}
        value={_value}
        onChangeText={setValue}
        onBlur={handleBlur}
        {...others}
      />
    );
  },
);

TimeInput.displayName = "@knitui/dates/TimeInput";
