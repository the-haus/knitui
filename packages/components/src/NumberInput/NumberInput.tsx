import * as React from "react";

import { type GetProps, isWeb, styled, withStaticProperties } from "@knitui/core";
import { useMergedRef, useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import { INPUT_WRAPPER_SLOTS, type InputWrapperSlots } from "../Input/shared";
import { InputBase, type InputBaseProps } from "../InputBase";
import { clampOptional, roundTo } from "../internal/number-utils";
import { focusRingStyle, type SizeKey, webCursor } from "../internal/style-props";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export interface NumberInputHandlers {
  increment: () => void;
  decrement: () => void;
}

type NumberInputControlSize = SizeKey;

/** A number, or an intermediate string while editing (`""`, `"-"`, `"1."`). */
export type NumberInputValue = number | string;

type NumberInputBaseProps = Omit<
  GetProps<typeof InputBase>,
  "pointer" | "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step"
>;

export interface NumberInputProps extends NumberInputBaseProps {
  /** Controlled component value. */
  value?: NumberInputValue;

  /** Uncontrolled component default value. */
  defaultValue?: NumberInputValue;

  /** Called when the value changes. */
  onChange?: (value: NumberInputValue) => void;

  /** Minimum possible value. */
  min?: number;

  /** Maximum possible value. */
  max?: number;

  /** Amount added/subtracted with the controls and arrow keys. @default 1 */
  step?: number;

  /** Value used when stepping from an empty input. @default 0 */
  startValue?: number;

  /**
   * How values are clamped to the `min`/`max` range:
   * - `"blur"` (default): typed freely, clamped on blur
   * - `"strict"`: out-of-range values cannot be typed
   * - `"none"`: `min`/`max` only constrain the controls and arrow keys
   * @default "blur"
   */
  clampBehavior?: "strict" | "blur" | "none";

  /** Whether negative values are allowed. @default true */
  allowNegative?: boolean;

  /** Whether decimal values are allowed. @default true */
  allowDecimal?: boolean;

  /** Limits the number of digits after the decimal point. */
  decimalScale?: number;

  /**
   * Whether leading zeros are preserved while typing. When `false`, leading
   * zeros are stripped as you type (e.g. `007` → `7`). Works together with
   * `trimLeadingZeroesOnBlur`. @default true
   */
  allowLeadingZeros?: boolean;

  /** Whether a preserved leading-zero value is normalised on blur. @default true */
  trimLeadingZeroesOnBlur?: boolean;

  /** Selects the input's contents when it receives focus (web only). @default false */
  selectAllOnFocus?: boolean;

  /** Hides the up/down controls. @default false */
  hideControls?: boolean;

  /** Whether ArrowUp/ArrowDown step the value. @default true */
  withKeyboardEvents?: boolean;

  /** Initial delay (ms) before hold-to-step repeats. Requires `stepHoldInterval`. */
  stepHoldDelay?: number;

  /** Interval (ms) between steps while a control is held. Number or `(count) => ms`. */
  stepHoldInterval?: number | ((count: number) => number);

  /** Ref populated with `{ increment, decrement }` handlers. */
  handlersRef?: React.Ref<NumberInputHandlers>;

  /** Called when the value reaches `max` via a control or ArrowUp. */
  onMaxReached?: () => void;

  /** Called when the value reaches the lower bound via a control or ArrowDown. */
  onMinReached?: () => void;

  /**
   * Prefix/suffix added before/after the value — accepted for Mantine API parity.
   * Inline display formatting (prefix/suffix in the value, live thousands
   * grouping) needs `react-number-format`, which is not a cross-platform
   * dependency here, so these are not rendered. The numeric stepping/clamping
   * behaviour below is complete.
   */
  prefix?: string;
  /** See `prefix`. */
  suffix?: string;

  /** Per-slot style sugar for the stepper — props spread onto the matching part. */
  styles?: SlotStyles<NumberInputStyles>;
}

const decimalPlaces = (n: number | string): number => {
  const m = String(n).match(/\.(\d+)$/);
  return m ? m[1].length : 0;
};

/** A "complete" number string that can be safely coerced to a number. */
const COMPLETE_NUMBER = /^-?\d+(\.\d+)?$/;

/** A string whose integer part carries a meaningless leading zero (`007`, `-010`). */
const LEADING_ZERO = /^-?0\d/;

const NUMBER_INPUT_CONTROL_SIZES: readonly NumberInputControlSize[] = [
  "xxs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "xxl",
];

const isNumberInputControlSize = (value: unknown): value is NumberInputControlSize =>
  typeof value === "string" && NUMBER_INPUT_CONTROL_SIZES.includes(value as NumberInputControlSize);

const hasSelectMethod = (value: unknown): value is { select: () => void } =>
  typeof value === "object" &&
  value !== null &&
  "select" in value &&
  typeof value.select === "function";

/** Strip meaningless leading zeros from the integer part (`007`→`7`, `00`→`0`). */
function stripLeadingZeros(s: string): string {
  return s.replace(/^(-?)0+(\d)/, "$1$2");
}

/** Strip a typed string to a valid numeric input respecting negative/decimal rules. */
function sanitize(raw: string, allowNegative: boolean, allowDecimal: boolean): string {
  const negative = allowNegative && raw.trim().startsWith("-");
  let s = raw.replace(/[^\d.]/g, "");
  if (allowDecimal) {
    const firstDot = s.indexOf(".");
    if (firstDot !== -1) {
      s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
    }
  } else {
    s = s.replace(/\./g, "");
  }
  return (negative ? "-" : "") + s;
}

// Width of the stepper column per field size. The default input section is a
// SQUARE (as wide as the field is tall), which is too wide for a pair of tiny
// up/down glyphs — so the stepper gets its own narrower track (~0.6 of the field
// height), keyed off the same `controlMetrics` heights the field uses.
const STEPPER_COLUMN_WIDTH: Record<NumberInputControlSize, number> = {
  xxs: 16,
  xs: 18,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 34,
  xxl: 40,
};

// Glyph size for the ▲/▼ controls. Deliberately much smaller than the field's
// text size (a `md` field uses an 18px font; a 9px triangle reads as a control
// affordance, not a character). `lineHeight` is pinned to the font size so the
// glyph centers exactly in its half of the column.
const stepperIconSizeVariant = {
  xxs: { fontSize: 6, lineHeight: 6 },
  xs: { fontSize: 7, lineHeight: 7 },
  sm: { fontSize: 8, lineHeight: 8 },
  md: { fontSize: 9, lineHeight: 9 },
  lg: { fontSize: 11, lineHeight: 11 },
  xl: { fontSize: 13, lineHeight: 13 },
  xxl: { fontSize: 15, lineHeight: 15 },
} as const;

const StepperColumn = styled(Box, {
  name: "NumberInputControls",
  flexDirection: "column",
  alignSelf: "stretch",
  // Fill the section's full height so the two `flex: 1` controls split it evenly
  // (the parent section centers its content, so without this the column collapses
  // to the glyph height and the buttons render as thin slivers).
  height: "100%",
  borderLeftWidth: 1,
  borderColor: "$borderColor",
});

const StepControl = styled(Box, {
  name: "NumberInputControl",
  flex: 1,
  minHeight: 0,
  alignItems: "center",
  justifyContent: "center",
  margin: 0,
  padding: 0,
  borderWidth: 0,
  borderColor: "transparent",
  outlineWidth: 0,
  outlineStyle: "none",
  boxShadow: "none",
  backgroundColor: "transparent",
  ...webCursor("pointer"),
  hoverStyle: { backgroundColor: "$color3" },
  pressStyle: { backgroundColor: "$color5" },
  ...focusRingStyle,
  variants: {
    type: {
      up: { borderBottomWidth: 1, borderColor: "$borderColor" },
      down: {},
    },
    disabled: {
      true: { opacity: 0.4, pointerEvents: "none", ...webCursor("default") },
    },
  } as const,
});

const StepControlIcon = styled(Text, {
  name: "NumberInputControlIcon",
  color: "$color11",
  userSelect: "none",
  variants: {
    size: stepperIconSizeVariant,
  } as const,
  defaultVariants: {
    size: "md",
  },
});

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`) for `NumberInput`. The
 * field-chrome slots (`wrapper` / `label` / `description` / `error` / `required`)
 * are inherited from `Input.Wrapper`'s vocabulary and forwarded through
 * `InputBase`, so `styles={{ label }}` means the same thing here as on a
 * `TextInput`. The remaining slots reach `NumberInput`'s own stepper parts, so
 * `styles={{ increment: { backgroundColor: "$color5" } }}` is sugar for
 * `<NumberInput.Increment backgroundColor="$color5" />`.
 */
export interface NumberInputStyles extends InputWrapperSlots {
  /** Props for the stepper column (`NumberInput.Controls`). */
  controls?: GetProps<typeof StepperColumn>;
  /** Props for the increment (up) control (`NumberInput.Increment`). */
  increment?: GetProps<typeof StepControl>;
  /** Props for the decrement (down) control (`NumberInput.Decrement`). */
  decrement?: GetProps<typeof StepControl>;
}

const NUMBER_INPUT_SLOT_KEYS = [
  ...INPUT_WRAPPER_SLOTS,
  "controls",
  "increment",
  "decrement",
] as const satisfies readonly (keyof NumberInputStyles)[];

const stepControlElementProps: { type: string } = { type: "button" };

/**
 * NumberInput — a numeric field with increment/decrement controls and keyboard
 * stepping. Mirrors Mantine's `NumberInput` public API (minus the
 * `react-number-format` display layer, which is not a cross-platform dependency).
 * Built on `InputBase`; the numeric value is controlled via `useUncontrolled`.
 * Accent/theme comes from the Tamagui `theme` prop + palette ramp.
 */
const NumberInputComponent = InputBase.styleable<NumberInputProps>(
  function NumberInput(props, ref) {
    const {
      value,
      defaultValue,
      onChange,
      min,
      max,
      step = 1,
      startValue = 0,
      clampBehavior = "blur",
      allowNegative = true,
      allowDecimal = true,
      decimalScale,
      allowLeadingZeros = true,
      trimLeadingZeroesOnBlur = true,
      selectAllOnFocus = false,
      hideControls = false,
      withKeyboardEvents = true,
      stepHoldDelay,
      stepHoldInterval,
      handlersRef,
      onMaxReached,
      onMinReached,
      prefix: _prefix,
      suffix: _suffix,
      size = "md",
      disabled,
      readOnly,
      rightSection,
      rightSectionPointerEvents,
      onFocus,
      onBlur,
      onKeyDown,
      onKeyUp,
      styles,
      ...others
    } = props;
    void _prefix;
    void _suffix;

    const s = slotStyles<NumberInputStyles>(styles, NUMBER_INPUT_SLOT_KEYS, "NumberInput");
    const chromeStyles = pick<NumberInputStyles, InputWrapperSlots>(styles, INPUT_WRAPPER_SLOTS);

    const [_value, setValue] = useUncontrolled<NumberInputValue>({
      value,
      defaultValue,
      finalValue: "",
      onChange,
    });

    // Latest value for the hold-to-step loop (avoids a stale closure).
    const latest = React.useRef<NumberInputValue>(_value);
    latest.current = _value;

    const lowerBound = min ?? (!allowNegative ? 0 : undefined);

    const doStep = React.useCallback(
      (sign: 1 | -1) => {
        if (readOnly || disabled) return;
        const current = latest.current;
        const numeric = typeof current === "number" ? current : Number(current);
        const isNumeric = current !== "" && Number.isFinite(numeric);

        let next: number;
        if (!isNumeric) {
          next = clampOptional(startValue, lowerBound, max);
        } else {
          const precision = Math.max(decimalPlaces(numeric), decimalPlaces(step));
          const factor = 10 ** precision;
          next = (Math.round(numeric * factor) + sign * Math.round(step * factor)) / factor;
        }

        const clamped = clampOptional(next, lowerBound, max);
        if (sign === 1 && max !== undefined && next >= max) onMaxReached?.();
        if (sign === -1 && lowerBound !== undefined && next <= lowerBound) onMinReached?.();

        setValue(decimalScale !== undefined ? roundTo(clamped, decimalScale) : clamped);
      },
      [
        readOnly,
        disabled,
        startValue,
        lowerBound,
        max,
        step,
        decimalScale,
        onMaxReached,
        onMinReached,
        setValue,
      ],
    );

    // Expose increment/decrement via handlersRef.
    const assignHandlers = useMergedRef(handlersRef);
    React.useEffect(() => {
      assignHandlers({ increment: () => doStep(1), decrement: () => doStep(-1) });
    }, [assignHandlers, doStep]);

    // Hold-to-step.
    const useHold = stepHoldDelay !== undefined && stepHoldInterval !== undefined;
    const holdTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const holdCount = React.useRef(0);

    const stepLoop = React.useCallback(
      (sign: 1 | -1) => {
        doStep(sign);
        holdCount.current += 1;
        if (useHold && stepHoldInterval !== undefined) {
          const interval =
            typeof stepHoldInterval === "number"
              ? stepHoldInterval
              : stepHoldInterval(holdCount.current);
          holdTimeout.current = setTimeout(() => stepLoop(sign), interval);
        }
      },
      [doStep, useHold, stepHoldInterval],
    );

    const startHold = (sign: 1 | -1) => {
      doStep(sign);
      if (useHold && stepHoldDelay !== undefined) {
        holdTimeout.current = setTimeout(() => stepLoop(sign), stepHoldDelay);
      }
    };

    const endHold = React.useCallback(() => {
      if (holdTimeout.current) clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
      holdCount.current = 0;
    }, []);

    React.useEffect(() => endHold, [endHold]);

    const handleText = (text: string) => {
      let sanitized = sanitize(text, allowNegative, allowDecimal);
      if (!allowLeadingZeros) sanitized = stripLeadingZeros(sanitized);
      if (clampBehavior === "strict" && COMPLETE_NUMBER.test(sanitized)) {
        const n = Number(sanitized);
        if ((min !== undefined && n < min) || (max !== undefined && n > max)) return;
      }
      // Preserve a leading-zero string verbatim (Mantine `allowLeadingZeros`);
      // otherwise a complete number coerces to `Number` (which drops the zeros).
      if (allowLeadingZeros && LEADING_ZERO.test(sanitized)) {
        setValue(sanitized);
      } else {
        setValue(COMPLETE_NUMBER.test(sanitized) ? Number(sanitized) : sanitized);
      }
    };

    const handleFocus: InputBaseProps["onFocus"] = (event) => {
      const el = event.currentTarget;
      if (selectAllOnFocus && isWeb && hasSelectMethod(el)) el.select();
      onFocus?.(event);
    };

    const handleBlur: InputBaseProps["onBlur"] = (event) => {
      onBlur?.(event);
      if (clampBehavior === "blur") {
        const numeric = typeof _value === "number" ? _value : Number(_value);
        if (_value !== "" && Number.isFinite(numeric)) {
          let clamped = clampOptional(numeric, min, max);
          if (decimalScale !== undefined) clamped = roundTo(clamped, decimalScale);
          if (clamped !== _value) setValue(clamped);
          return;
        }
      }
      // Normalise a preserved leading-zero string (`"007"` → `7`) on blur.
      if (
        trimLeadingZeroesOnBlur &&
        typeof _value === "string" &&
        LEADING_ZERO.test(_value) &&
        COMPLETE_NUMBER.test(_value)
      ) {
        setValue(Number(_value));
      }
    };

    const handleKeyDown: InputBaseProps["onKeyDown"] = (event) => {
      onKeyDown?.(event);
      if (readOnly || !withKeyboardEvents) return;
      if (event.key === "ArrowUp") startHold(1);
      if (event.key === "ArrowDown") startHold(-1);
    };

    const handleKeyUp: InputBaseProps["onKeyUp"] = (event) => {
      onKeyUp?.(event);
      if (event.key === "ArrowUp" || event.key === "ArrowDown") endHold();
    };

    const numericValue = typeof _value === "number" ? _value : Number(_value);
    const hasNumeric = _value !== "" && Number.isFinite(numericValue);
    const upDisabled = !!disabled || (hasNumeric && max !== undefined && numericValue >= max);
    const downDisabled =
      !!disabled || (hasNumeric && lowerBound !== undefined && numericValue <= lowerBound);
    const controlSize = isNumberInputControlSize(size) ? size : "md";

    const controls =
      hideControls || readOnly ? undefined : (
        <StepperColumn {...s.get("controls")}>
          <StepControl
            render="button"
            {...stepControlElementProps}
            {...s.get("increment")}
            type="up"
            disabled={upDisabled}
            aria-label="Increment value"
            aria-disabled={upDisabled || undefined}
            onPressIn={() => startHold(1)}
            onPressOut={endHold}
          >
            <StepControlIcon size={controlSize}>▲</StepControlIcon>
          </StepControl>
          <StepControl
            render="button"
            {...stepControlElementProps}
            {...s.get("decrement")}
            type="down"
            disabled={downDisabled}
            aria-label="Decrement value"
            aria-disabled={downDisabled || undefined}
            onPressIn={() => startHold(-1)}
            onPressOut={endHold}
          >
            <StepControlIcon size={controlSize}>▼</StepControlIcon>
          </StepControl>
        </StepperColumn>
      );

    return (
      <InputBase
        ref={ref}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        size={size}
        disabled={disabled}
        readOnly={readOnly}
        styles={chromeStyles}
        value={_value}
        onChangeText={handleText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        rightSection={rightSection ?? controls}
        rightSectionWidth={controls ? STEPPER_COLUMN_WIDTH[controlSize] : undefined}
        rightSectionPointerEvents={rightSectionPointerEvents ?? (controls ? "all" : undefined)}
        {...others}
      />
    );
  },
);

NumberInputComponent.displayName = "NumberInput";

/**
 * The composable stepper parts exposed by `NumberInput`. The `<NumberInput … />`
 * prop API renders exactly these parts as the field's `rightSection`; render them
 * directly (e.g. as a custom `rightSection`) or target them via the `styles` map
 * (`controls` / `increment` / `decrement`).
 */
export const NumberInput = withStaticProperties(NumberInputComponent, {
  /** The stepper column wrapping the two controls. */
  Controls: StepperColumn,
  /** The increment (up) control. */
  Increment: StepControl,
  /** The decrement (down) control. */
  Decrement: StepControl,
  /** The ▲/▼ glyph rendered inside a control. */
  ControlIcon: StepControlIcon,
});
