import * as React from "react";

import { type GetProps, styled, withStaticProperties } from "@knitui/core";
import { useCallbackRef, useId, useMergedRef, useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import { Input, type InputProps, type InputSize } from "../Input";
import { gapVariant, type SizeKey, squareSizeVariant } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";

/** The element a single field's ref resolves to. */
type PinFieldRef = React.ComponentRef<typeof Input>;
/** Minimal focusable shape used to advance focus between fields, cross-platform. */
type Focusable = { focus?: () => void };

export type PinInputType = "alphanumeric" | "number" | RegExp;
export type PinInputSize = InputSize;

/** Host `type` attribute override (inferred from `type`/`mask` when unset). */
export type PinInputHostType = React.HTMLInputTypeAttribute;

/** Host `inputmode` override (inferred from `type` when unset). */
export type PinInputMode =
  | "none"
  | "text"
  | "tel"
  | "url"
  | "email"
  | "numeric"
  | "decimal"
  | "search";

const REGEX = {
  number: /^[0-9]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/i,
};

type PinInputTokenSize = SizeKey;
type PinInputWrapperProps = NonNullable<InputProps["wrapperProps"]>;

const PIN_INPUT_SIZE_KEYS: readonly PinInputTokenSize[] = [
  "xxs",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "xxl",
];

const isPinInputTokenSize = (value: InputSize | undefined): value is PinInputTokenSize =>
  typeof value === "string" && PIN_INPUT_SIZE_KEYS.includes(value as PinInputTokenSize);

const toFieldSize = (size: InputSize | undefined): PinInputWrapperProps["width"] => {
  const key = isPinInputTokenSize(size) ? size : "md";

  if (size && !isPinInputTokenSize(size)) return size as PinInputWrapperProps["width"];

  return squareSizeVariant[key].width as PinInputWrapperProps["width"];
};

/** Build a fixed-length character array seeded from `value` (mirrors Mantine). */
function createPinArray(length: number, value: string): string[] {
  if (length < 1) return [];
  const values = new Array<string>(length).fill("");
  if (value) {
    const split = value.trim().split("");
    for (let i = 0; i < Math.min(length, split.length); i += 1) {
      values[i] = split[i] === " " ? "" : split[i];
    }
  }
  return values;
}

const PinInputRow = styled(Box, {
  name: "PinInput",
  role: "group",
  flexDirection: "row",
  alignItems: "center",
  variants: {
    gap: gapVariant,
  } as const,
  defaultVariants: {
    gap: "$xs",
  },
});

type PinInputRowProps = GetProps<typeof PinInputRow>;

/**
 * Named style slots (Pillar B / `internal/styles.ts`) for `PinInput`. The
 * `field` slot is spread onto every per-character `Input`, so
 * `styles={{ field: { borderColor: "$color8" } }}` styles all fields at once —
 * sugar over the functional `getInputProps(index)` escape hatch (which still
 * works and, being per-index and more explicit, wins where they overlap).
 */
export interface PinInputStyles {
  /** Props spread onto each per-character `Input`. */
  field?: Partial<InputProps>;
}

const PIN_INPUT_SLOT_KEYS = ["field"] as const satisfies readonly (keyof PinInputStyles)[];

export interface PinInputProps extends Omit<
  PinInputRowProps,
  "onChange" | "children" | "mask" | "inputMode" | "size"
> {
  /** Controlled component value. */
  value?: string;

  /** Uncontrolled component default value. */
  defaultValue?: string;

  /** Called when the value changes. */
  onChange?: (value: string) => void;

  /** Called once when every input has a value. */
  onComplete?: (value: string) => void;

  /** Number of inputs. @default 4 */
  length?: number;

  /** Determines which characters are accepted. @default "alphanumeric" */
  type?: PinInputType;

  /** Renders the inputs as `type="password"` (masked). @default false */
  mask?: boolean;

  /** Host `type` attribute, inferred from `type`/`mask` if unset. */
  inputType?: PinInputHostType;

  /** Host `inputmode` attribute, inferred from `type` if unset. */
  inputMode?: PinInputMode;

  /** Inputs placeholder. @default "○" */
  placeholder?: string;

  /** Controls each input's width/height. @default "md" */
  size?: PinInputSize;

  /** Border radius of each input. */
  radius?: InputProps["radius"];

  /** Gap between inputs. Token, CSS value or number. @default "$xs" */
  gap?: PinInputRowProps["gap"];

  /** Disables every input. */
  disabled?: boolean;

  /** Applies error styles + `aria-invalid` to every input. */
  error?: boolean;

  /** When set, the user cannot edit the value. */
  readOnly?: boolean;

  /** Focuses the first input on mount. @default false */
  autoFocus?: boolean;

  /** Whether focus advances automatically to the next input. @default true */
  manageFocus?: boolean;

  /** Sets `autocomplete="one-time-code"` on the inputs. @default true */
  oneTimeCode?: boolean;

  /** `aria-label` applied to every input. @default "PinInput" */
  ariaLabel?: string;

  /** Base id used to generate per-input ids. */
  id?: string;

  /** Props applied to each input, by index. */
  getInputProps?: (index: number) => Partial<InputProps>;

  /** Per-slot style sugar — props spread onto each per-character `Input`. */
  styles?: SlotStyles<PinInputStyles>;
}

/**
 * PinInput — a row of single-character inputs for codes / OTP entry. Mirrors
 * Mantine's `PinInput`. Built on the base `Input` host, so masking
 * (`mask` → `type="password"` → native `secureTextEntry`) and focus advance work
 * cross-platform. Accent/theme comes from the Tamagui `theme` prop + palette ramp.
 *
 * Web-form parity (`name`/`form` hidden input) and multi-field paste distribution
 * are deferred; single-field paste of a full code is handled.
 */
const PinInputComponent = PinInputRow.styleable<PinInputProps>(function PinInput(props, ref) {
  const {
    value,
    defaultValue,
    onChange,
    onComplete,
    length = 4,
    type = "alphanumeric",
    mask = false,
    inputType,
    inputMode,
    placeholder = "○",
    size = "md",
    radius,
    gap = "$xs",
    disabled,
    error,
    readOnly,
    autoFocus,
    manageFocus = true,
    oneTimeCode = true,
    ariaLabel = "PinInput",
    id,
    getInputProps,
    styles,
    ...others
  } = props;

  const s = slotStyles<PinInputStyles>(styles, PIN_INPUT_SLOT_KEYS, "PinInput");
  const uuid = useId(id);
  const inputsRef = React.useRef<Array<Focusable | null>>([]);
  const setFirstRef = useMergedRef(ref);
  const completedRef = React.useRef(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);

  const [_value, setValues] = useUncontrolled<string[]>({
    value: value !== undefined ? createPinArray(length, value) : undefined,
    defaultValue: defaultValue ? defaultValue.split("").slice(0, length) : undefined,
    finalValue: createPinArray(length, ""),
    onChange: (val) => {
      const stringValue = val.join("").trim();
      onChange?.(stringValue);
      if (stringValue.length === length && !completedRef.current) {
        completedRef.current = true;
        onComplete?.(stringValue);
      } else if (stringValue.length < length) {
        completedRef.current = false;
      }
    },
  });

  // Single normalized source of truth for the field characters; only recomputed
  // when the underlying value or `length` actually changes (avoids allocating a
  // fresh array on every render).
  const currentValue = React.useMemo(
    () => (_value.length === length ? _value : createPinArray(length, _value.join(""))),
    [_value, length],
  );

  // Compile the accepted-character pattern once per `type`.
  const pattern = React.useMemo(() => (typeof type === "string" ? REGEX[type] : type), [type]);

  // Event handlers keep a STABLE identity across renders (so per-field props and
  // ref callbacks below never churn) while always reading the latest state via
  // `useCallbackRef`. No manual dependency lists, no stale closures.
  const handleChange = useCallbackRef((text: string, index: number) => {
    const setFieldValue = (val: string) => {
      const next = [...currentValue];
      next[index] = val;
      setValues(next);
    };
    const focusNext = (from: number) => {
      if (manageFocus && from + 1 < length) inputsRef.current[from + 1]?.focus?.();
    };
    const focusPrev = (from: number) => {
      if (manageFocus && from > 0) inputsRef.current[from - 1]?.focus?.();
    };

    if (text === "") {
      setFieldValue("");
      // Backspace that deletes the current character. RN — especially Android —
      // does NOT reliably fire onKeyPress for Backspace, so onChangeText → "" is
      // the dependable cross-platform "go back" signal: move focus to the previous
      // field here rather than relying on the keydown handler below.
      focusPrev(index);
      return;
    }
    // A full code pasted into one field — distribute across the fields.
    if (text.length > 2 && pattern.test(text)) {
      setValues(createPinArray(length, text));
      const filled = Math.min(text.length, length);
      if (filled < length) focusNext(filled - 1);
      return;
    }
    const char = text[text.length - 1];
    if (!pattern.test(char)) {
      // Reject: re-assert the current character (new array → controlled reset).
      setFieldValue(currentValue[index] ?? "");
      return;
    }
    // The last field has nowhere to advance focus to, so continued typing would
    // otherwise keep overwriting it. Once it holds a character, keep that digit —
    // re-assert it (new array → controlled reset) so the typed char is discarded;
    // only Backspace can clear it.
    if (index === length - 1 && (currentValue[index] ?? "") !== "") {
      setFieldValue(currentValue[index]);
      return;
    }
    setFieldValue(char);
    focusNext(index);
  });

  const handleKeyDown = useCallbackRef((key: string, index: number) => {
    if (!manageFocus) return;
    if (key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus?.();
    } else if (key === "ArrowRight" && index + 1 < length) {
      inputsRef.current[index + 1]?.focus?.();
    } else if (key === "Backspace" && (currentValue[index] ?? "") === "" && index > 0) {
      inputsRef.current[index - 1]?.focus?.();
    }
  });

  // Per-field props (ref + handlers) are memoized so React only attaches/detaches
  // refs and rebinds listeners when `length` changes — not on every keystroke.
  const fields = React.useMemo(
    () =>
      Array.from({ length }, (_, index) => ({
        id: `${uuid}-${index}`,
        ref: (node: PinFieldRef | null) => {
          inputsRef.current[index] = node;
          if (index === 0) setFirstRef(node);
        },
        onChangeText: (text: string) => handleChange(text, index),
        onKeyDown: (event: { key: string }) => handleKeyDown(event.key, index),
        onFocus: () => setFocusedIndex(index),
        onBlur: () => setFocusedIndex(-1),
      })),
    [length, uuid, setFirstRef, handleChange, handleKeyDown],
  );

  const fieldSize = React.useMemo(() => toFieldSize(size), [size]);
  const wrapperProps = React.useMemo(
    () => ({ width: fieldSize, minWidth: fieldSize, paddingHorizontal: 0 }),
    [fieldSize],
  );
  const resolvedType = React.useMemo(
    () => inputType ?? (mask ? "password" : type === "number" ? "tel" : "text"),
    [inputType, mask, type],
  );
  const resolvedInputMode = React.useMemo(
    () => inputMode ?? (type === "number" ? "numeric" : "text"),
    [inputMode, type],
  );

  return (
    <PinInputRow gap={gap} {...others}>
      {fields.map((field, index) => (
        <Input
          key={field.id}
          id={field.id}
          ref={field.ref}
          size={size}
          radius={radius}
          error={error}
          disabled={disabled}
          readOnly={readOnly}
          type={resolvedType}
          inputMode={resolvedInputMode}
          textAlign="center"
          paddingHorizontal={0}
          value={currentValue[index] ?? ""}
          placeholder={focusedIndex === index ? "" : placeholder}
          autoFocus={autoFocus && index === 0}
          autoComplete={oneTimeCode ? "one-time-code" : "off"}
          aria-label={ariaLabel}
          wrapperProps={wrapperProps}
          onChangeText={field.onChangeText}
          onKeyDown={field.onKeyDown}
          onFocus={field.onFocus}
          onBlur={field.onBlur}
          // The `field` style slot is sugar under the per-index `getInputProps`,
          // which is more explicit and wins where the two overlap.
          {...s.get("field")}
          {...getInputProps?.(index)}
        />
      ))}
    </PinInputRow>
  );
});

export const PinInput = withStaticProperties(PinInputComponent, {
  Row: PinInputRow,
  /** The per-character `Input` field (target of the `field` style slot). */
  Field: Input,
});
