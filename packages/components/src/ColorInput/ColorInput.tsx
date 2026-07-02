import * as React from "react";

import { withStaticProperties } from "@knitui/core";
import { useDidUpdate, useUncontrolled } from "@knitui/hooks";

import {
  ColorPicker,
  type ColorPickerFormat,
  type ColorPickerProps,
  type ColorPickerStyles,
} from "../ColorPicker";
import { ColorSwatch, type ColorSwatchProps } from "../ColorSwatch";
import { type InputWrapperSlots } from "../Input/shared";
import { InputBase, type InputBaseProps } from "../InputBase";
import { convertHsvaTo, isColorValid, parseColor } from "../internal/color";
import { toEmbeddedControlSize } from "../internal/embedded-control-size";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";
import { Popover, type PopoverDropdownProps, type PopoverProps } from "../Popover";

type ColorInputBaseProps = Omit<InputBaseProps, "value" | "defaultValue" | "onChange" | "styles">;
export type ColorInputRef = React.ComponentRef<typeof InputBase>;

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`) for `ColorInput`. The
 * field-chrome slots (`wrapper` / `label` / `description` / `error` / `required`)
 * are inherited from `Input.Wrapper`'s vocabulary and forwarded through
 * `InputBase`, so `styles={{ label }}` means the same thing here as on a
 * `TextInput`. The remaining slots reach `ColorInput`'s own parts: the
 * left-section `preview` swatch, the `dropdown` surface, the dropdown `picker`,
 * and each predefined `swatch` inside it.
 */
export interface ColorInputStyles extends InputWrapperSlots {
  /** Props for the left-section preview swatch (`withPreview`). */
  preview?: Partial<ColorSwatchProps>;
  /** Props for the floating dropdown surface (`Popover.Dropdown`). */
  dropdown?: Partial<PopoverDropdownProps>;
  /** Props forwarded to the dropdown `ColorPicker`. */
  picker?: Partial<ColorPickerProps>;
  /** Per-slot styles reaching each predefined swatch in the dropdown picker. */
  swatch?: ColorPickerStyles["swatch"];
  /**
   * Props for the eyedropper affordance. The browser `EyeDropper` API has no
   * cross-platform equivalent, so the eyedropper is a documented no-op and this
   * slot is reserved for API parity / forward-compat only — it currently targets
   * nothing rendered.
   */
  eyedropper?: Record<string, unknown>;
}

const COLOR_INPUT_SLOT_KEYS = [
  "wrapper",
  "label",
  "description",
  "error",
  "required",
  "preview",
  "dropdown",
  "picker",
  "swatch",
  "eyedropper",
] as const satisfies readonly (keyof ColorInputStyles)[];

const CHROME_SLOT_KEYS = [
  "wrapper",
  "label",
  "description",
  "error",
  "required",
] as const satisfies readonly (keyof InputWrapperSlots)[];

export interface ColorInputProps extends ColorInputBaseProps {
  /** Controlled value. */
  value?: string;
  /** Uncontrolled initial value. @default '' */
  defaultValue?: string;
  /** Called on every value change (typing, dragging, swatch click). */
  onChange?: (value: string) => void;
  /** Called once a picker drag / keyboard change finishes. */
  onChangeEnd?: (value: string) => void;
  /** Output color format. @default 'hex' */
  format?: ColorPickerFormat;
  /** Predefined swatches shown in the dropdown. */
  swatches?: string[];
  /** Swatches per row in the dropdown. @default 7 */
  swatchesPerRow?: number;
  /** Render the saturation/sliders picker (vs. swatches only). @default true */
  withPicker?: boolean;
  /** Forbid typing — value can only be picked. @default false */
  disallowInput?: boolean;
  /** Reset the input to the last valid value on blur. @default true */
  fixOnBlur?: boolean;
  /** Show the current color as a preview swatch in the left section. @default true */
  withPreview?: boolean;
  /** Close the dropdown when a swatch is clicked. @default false */
  closeOnColorSwatchClick?: boolean;
  /**
   * @deprecated Use `styles={{ dropdown: … }}` for the dropdown surface. Props
   * forwarded to the underlying `Popover` (merged OVER any `dropdown` slot for
   * `Popover.Dropdown`-shaped keys is NOT done — this targets the `Popover` root).
   */
  popoverProps?: Partial<PopoverProps>;
  /**
   * Accepted for Mantine API parity. The browser `EyeDropper` API has no
   * cross-platform equivalent, so this is a documented no-op. @default false
   */
  withEyeDropper?: boolean;
  /** Custom eye-dropper icon (unused — see `withEyeDropper`). */
  eyeDropperIcon?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching part. */
  styles?: SlotStyles<ColorInputStyles>;
}

/**
 * `ColorInput` — mirrors Mantine's `ColorInput`, assembled like `Select`: an
 * `InputBase` target opening a `Popover` dropdown that hosts a `ColorPicker`.
 * Typing a valid color updates the value (and the left-section preview swatch);
 * the picker drives it back. Accent comes from the Tamagui `theme` prop + palette
 * ramp, never a Mantine `color` prop.
 *
 * This prop API is sugar over `InputBase` + `Popover` + the now-composable
 * `ColorPicker` parts; the `styles` map fans out to those parts (the field chrome
 * slots flow to `Input.Wrapper`, `preview`/`dropdown`/`picker`/`swatch` reach the
 * local parts).
 *
 * The dropdown closes on outside-click / Escape (the `Popover`'s own listeners,
 * wired back through `onChange`) rather than on input blur — more robust across
 * web/native than blur-driven closing (documented divergence). The web-only
 * `EyeDropper` API is a documented no-op (no cross-platform eyedropper).
 */
const ColorInputComponent = React.forwardRef<ColorInputRef, ColorInputProps>(
  function ColorInput(props, ref) {
    const {
      value,
      defaultValue,
      onChange,
      onChangeEnd,
      format = "hex",
      swatches,
      swatchesPerRow = 7,
      withPicker = true,
      disallowInput = false,
      fixOnBlur = true,
      withPreview = true,
      closeOnColorSwatchClick = false,
      popoverProps,
      withEyeDropper: _withEyeDropper,
      eyeDropperIcon: _eyeDropperIcon,
      leftSection,
      readOnly,
      disabled,
      size = "md",
      styles,
      ...inputProps
    } = props;

    const s = slotStyles<ColorInputStyles>(styles, COLOR_INPUT_SLOT_KEYS, "ColorInput");
    const chromeStyles = pick<ColorInputStyles, InputWrapperSlots>(styles, CHROME_SLOT_KEYS);

    const [dropdownOpened, setDropdownOpened] = React.useState(false);
    const [_value, setValue] = useUncontrolled<string>({
      value,
      defaultValue,
      finalValue: "",
      onChange,
    });

    // Last known-valid value, used to restore on blur (`fixOnBlur`). Tracked in a
    // ref and updated inline wherever the value is known-valid, so typing doesn't
    // trigger an extra render and the restore value never lags a render behind.
    const lastValidValueRef = React.useRef(_value);

    // Commit a value AND capture it as the last-valid restore target when it is a
    // valid color (or empty). Used by every value-setting path except raw typing
    // (`onChangeText`, which captures inline) so picker/swatch picks are restorable.
    const setValueTracked = React.useCallback(
      (next: string) => {
        if (isColorValid(next) || next.trim() === "") {
          lastValidValueRef.current = next;
        }
        setValue(next);
      },
      [setValue],
    );

    useDidUpdate(() => {
      if (isColorValid(_value)) {
        setValueTracked(convertHsvaTo(format, parseColor(_value)));
      }
    }, [format]);

    const handleFocus: React.FocusEventHandler<HTMLInputElement> = (event) => {
      setDropdownOpened(true);
      inputProps.onFocus?.(event);
    };

    const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
      if (fixOnBlur && !isColorValid(_value) && _value.trim() !== "") {
        setValue(lastValidValueRef.current);
      }
      inputProps.onBlur?.(event);
    };

    const handleClick: React.MouseEventHandler<HTMLInputElement> = (event) => {
      setDropdownOpened(true);
      inputProps.onClick?.(event);
    };

    // Preview swatch scales WITH the field: a step-down from the input size (so a
    // `md` ColorInput gets an `sm` swatch that sits comfortably in the left section),
    // matching how clear buttons and pills are sized inside inputs.
    const previewSwatch =
      leftSection ??
      (withPreview ? (
        <ColorSwatch
          color={isColorValid(_value) ? _value : "#ffffff"}
          size={toEmbeddedControlSize(size)}
          radius="$sm"
          {...s.get("preview")}
        />
      ) : undefined);

    const dropdownDisabled =
      readOnly || (withPicker === false && (!Array.isArray(swatches) || swatches.length === 0));

    // The `swatch` slot reaches the dropdown picker's own swatch slot; explicit
    // `styles={{ picker: { styles } }}` wins (it is spread last).
    const pickerSugar = s.get("picker");
    const pickerStyles: SlotStyles<ColorPickerStyles> | undefined =
      s.get("swatch") || pickerSugar?.styles
        ? { swatch: s.get("swatch"), ...pickerSugar?.styles }
        : undefined;

    return (
      <Popover
        position="bottom-start"
        offset={5}
        width="target"
        withinPortal
        {...popoverProps}
        opened={dropdownOpened && !dropdownDisabled && !disabled}
        onChange={setDropdownOpened}
        disabled={dropdownDisabled}
      >
        <Popover.Target withPressToggle={false} referenceRefProp="rootRef">
          <InputBase
            ref={ref}
            {...inputProps}
            styles={chromeStyles}
            size={size}
            disabled={disabled}
            value={_value}
            readOnly={disallowInput || readOnly}
            pointer={disallowInput}
            leftSection={previewSwatch}
            leftSectionPointerEvents="none"
            onChangeText={(text) => {
              setValue(text);
              if (isColorValid(text) || text.trim() === "") {
                lastValidValueRef.current = text;
              }
              if (isColorValid(text)) {
                onChangeEnd?.(convertHsvaTo(format, parseColor(text)));
              }
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onClick={handleClick}
          />
        </Popover.Target>

        <Popover.Dropdown padding="$sm" {...s.get("dropdown")}>
          <ColorPicker
            value={_value}
            onChange={setValueTracked}
            onChangeEnd={onChangeEnd}
            format={format}
            swatches={swatches}
            swatchesPerRow={swatchesPerRow}
            withPicker={withPicker}
            focusable={false}
            fullWidth
            // `picker` slot sugar UNDER the wired behaviour props.
            {...pickerSugar}
            styles={pickerStyles}
            onColorSwatchClick={() => {
              if (closeOnColorSwatchClick) setDropdownOpened(false);
            }}
          />
        </Popover.Dropdown>
      </Popover>
    );
  },
);

ColorInputComponent.displayName = "ColorInput";

/**
 * `ColorInput` composes a `Popover` dropdown (`Root`/`Target`/`Dropdown`) hosting a
 * `ColorPicker`, mirroring how `Select` exposes its `Popover`/`Combobox` parts. The
 * `<ColorInput … />` prop API renders exactly these parts; render them directly for
 * full control, or target them via the `styles` map (`dropdown`/`picker`/`swatch`/…).
 * The picker parts are re-exported from `ColorPicker` — reused, not duplicated.
 */
export const ColorInput = withStaticProperties(ColorInputComponent, {
  /** The floating root — a `Popover` owning open state. */
  Root: Popover,
  /** The field that toggles the dropdown (wraps `Popover.Target`). */
  Target: Popover.Target,
  /** The floating surface hosting the picker (`Popover.Dropdown`). */
  Dropdown: Popover.Dropdown,
  /** Re-export of `ColorPicker` (the dropdown body). */
  Picker: ColorPicker,
  /** Re-export of `ColorPicker.Swatch`. */
  Swatch: ColorPicker.Swatch,
  /** Re-export of `ColorPicker.Swatches`. */
  Swatches: ColorPicker.Swatches,
});
