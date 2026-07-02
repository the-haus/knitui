import * as React from "react";

import { Input } from "@knitui/components";
import { type GetProps, isWeb, type TamaguiElement } from "@knitui/core";

import { CELL_WIDTH } from "../cell-metrics";
import { hasPreventDefault } from "../internal/has-prevent-default";
import { selectAllOnFocus } from "../internal/select-on-focus";
import { padTime } from "../utils";

/**
 * Fixed standalone segment width, taken from the shared `cell-metrics` ladder
 * (the calendar twin of components' `controlMetrics`) instead of a magic pixel —
 * `xl` (54px) is the comfortable two-digit width the time segments share with
 * `AmPmInput`'s `SEGMENT_WIDTH`. `TimePicker` overrides it per size via the
 * spread `width` prop, so this is only the default for a bare `SpinInput`.
 */
const SEGMENT_WIDTH = CELL_WIDTH.xl;

/**
 * The segmented two-digit number leaf that the composed `TimePicker` builds its
 * hour/minute/second fields from. Mantine types this off `React.ComponentProps<
 * 'input'>`; ours re-types onto a precise spread of the kit `Input` props via
 * `GetProps<typeof Input>` (every other component in the kit spreads this way),
 * so no DOM `<input>` type ever leaks.
 */
export interface SpinInputProps extends Omit<
  GetProps<typeof Input>,
  "value" | "onChange" | "min" | "max" | "step"
> {
  /** Current numeric value, or `null` when empty. */
  value: number | null;

  /** Smallest allowed value. */
  min: number;

  /** Largest allowed value. */
  max: number;

  /** Called when the value changes (cleared → `null`). */
  onChange: (value: number | null) => void;

  /** Whether the field participates in the tab order / can receive focus. */
  focusable: boolean;

  /** Arrow-key increment/decrement step. */
  step: number;

  /** Advance focus to the next segment (auto-advance + ArrowRight/typing). */
  onNextInput?: () => void;

  /** Return focus to the previous segment (Backspace when empty / ArrowLeft). */
  onPreviousInput?: () => void;

  /** Permit a transient `0` even when `min > 0` (typing `0` then a second digit). @default false */
  allowTemporaryZero?: boolean;

  /** Placeholder shown when the value is `null`. @default '--' */
  placeholder?: string;

  /** Disable the auto-advance-to-next-segment behaviour. @default false */
  disableAutoAdvance?: boolean;

  /** Whether the field rejects edits. */
  readOnly?: boolean;
}

/** Clamp `value` into `[min, max]` (inline — no `@mantine/hooks`). */
const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Leading digit of `max` — the threshold past which a single keystroke auto-advances. */
const getMaxDigit = (max: number): number => Number(max.toFixed(0)[0]);

/**
 * `SpinInput` — the controlled two-digit number leaf used by the time layer
 * (`TimePicker` composes one per hour/minute/second segment). The `any`-free,
 * cross-platform port of Mantine's internal `SpinInput`.
 *
 * Digit entry rides the kit `Input`'s `onChangeText` (strip non-digits → clamp →
 * auto-advance) on BOTH platforms. The crucial parity fix vs. a naive port:
 * focusing a segment selects all its text (web `.select()` / native
 * `selectTextOnFocus`), so typing into an already-filled segment replaces the
 * value instead of appending garbage — without this, native entry is unusable.
 *
 * The Arrow/Home/End "0"-skip keyboard machine reads `event.key` and only fires
 * on web (native never delivers those keys). `Backspace`/`Delete` is the
 * exception: the kit native `Input` bridges `Backspace` through `onKeyPress`, so
 * backspace-to-previous-segment works on native too — when the segment already
 * holds a value, web clears via the keydown machine while native lets the empty
 * `onChangeText` drive the clear (see `handleChange`). `preventDefault` is called
 * only behind the `has-prevent-default` guard. Renders through a kit `Input`
 * (never a raw `<input>`) with web `spinbutton`/`aria-value*` and a native
 * `adjustable` role; ref forwards to the host node. Its standalone width comes
 * from the shared `cell-metrics` ladder (`SEGMENT_WIDTH`, no magic pixel),
 * which `TimePicker` overrides per size via the spread `width` prop.
 */
export const SpinInput = React.forwardRef<TamaguiElement, SpinInputProps>(
  function SpinInput(props, ref) {
    const {
      value,
      min,
      max,
      onChange,
      focusable,
      step,
      onNextInput,
      onPreviousInput,
      allowTemporaryZero = false,
      placeholder = "--",
      disableAutoAdvance = false,
      readOnly,
      onFocus,
      ...others
    } = props;

    const maxDigit = getMaxDigit(max);
    const arrowsMax = max + 1 - step;

    const handleChange = (text: string) => {
      if (readOnly) {
        return;
      }

      const clearValue = text.replace(/\D/g, "");
      if (clearValue === "") {
        // Native: deleting all the digits clears the segment to empty. On web the
        // keydown machine owns clearing (Backspace), and an empty change is a
        // deliberate no-op there, so this stays native-only.
        if (!isWeb) {
          onChange(null);
        }
        return;
      }

      const parsedValue = parseInt(clearValue, 10);
      const clampedValue =
        allowTemporaryZero && parsedValue === 0 && min > 0 ? 0 : clamp(parsedValue, min, max);

      onChange(clampedValue);

      if (!disableAutoAdvance && (clampedValue > maxDigit || text.startsWith("00"))) {
        onNextInput?.();
      }
    };

    const handleFocus: SpinInputProps["onFocus"] = (event) => {
      selectAllOnFocus(event);
      onFocus?.(event);
    };

    const handleKeyDown = (event: { key: string }) => {
      if (readOnly) {
        return;
      }

      const prevent = () => {
        if (hasPreventDefault(event)) {
          event.preventDefault();
        }
      };

      // Backspace/Delete works on web AND native (the kit native `Input` bridges
      // `Backspace` via `onKeyPress`). When the segment holds a value, web clears
      // it here; native lets the resulting empty `onChangeText` clear it (above),
      // so we don't double-handle. When already empty, both platforms step back.
      if (event.key === "Backspace" || event.key === "Delete") {
        if (value !== null) {
          if (isWeb) {
            prevent();
            onChange(null);
          }
        } else {
          prevent();
          onPreviousInput?.();
        }
        return;
      }

      // The remaining keys are a web-only keyboard machine — native delivers no
      // Arrow/Home/End/standalone-digit keydown here, and number entry rides
      // `onChangeText` regardless.
      if (!isWeb) {
        return;
      }

      if (event.key === "0" || event.key === "Num0") {
        if (value === 0) {
          prevent();
          onNextInput?.();
        }
        return;
      }

      if (event.key === "Home") {
        prevent();
        onChange(min);
        return;
      }

      if (event.key === "End") {
        prevent();
        onChange(max);
        return;
      }

      if (event.key === "ArrowRight") {
        prevent();
        onNextInput?.();
        return;
      }

      if (event.key === "ArrowLeft") {
        prevent();
        onPreviousInput?.();
        return;
      }

      if (event.key === "ArrowUp") {
        prevent();
        onChange(value === null ? min : clamp(value + step, min, arrowsMax));
        return;
      }

      if (event.key === "ArrowDown") {
        prevent();
        onChange(value === null ? arrowsMax : clamp(value - step, min, arrowsMax));
      }
    };

    // Web exposes the `spinbutton` ARIA contract (role + aria-value*, plus
    // `tabIndex` to drop non-active segments out of the tab order); native maps to
    // the `adjustable` accessibility role (RN has no `spinbutton`) and skips the
    // web-only `tabIndex`, which would otherwise leak onto the RN host.
    const a11yProps = isWeb
      ? {
          role: "spinbutton" as const,
          tabIndex: focusable ? undefined : -1,
        }
      : {
          accessibilityRole: "adjustable" as const,
          // Native: select the whole segment when it gains focus so the first
          // keystroke replaces it (the declarative counterpart to web `.select()`).
          // Web-only props like `selectTextOnFocus` must never reach the DOM host.
          selectTextOnFocus: true,
        };

    return (
      <Input
        ref={ref}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value === null ? 0 : value}
        {...a11yProps}
        inputMode="numeric"
        placeholder={placeholder}
        value={value === null ? "" : padTime(value)}
        readOnly={readOnly}
        textAlign="center"
        width={SEGMENT_WIDTH}
        onChangeText={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        {...others}
      />
    );
  },
);

SpinInput.displayName = "@knitui/dates/SpinInput";
