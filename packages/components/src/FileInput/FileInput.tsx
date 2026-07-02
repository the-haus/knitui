import * as React from "react";

import { type GetProps } from "@knitui/core";
import { useMergedRef, useUncontrolled } from "@knitui/hooks";

import { CloseButton, type CloseButtonProps } from "../CloseButton";
import { FileButton, type FileButtonInputProps } from "../FileButton";
import { Input, type InputSize } from "../Input";
import { INPUT_WRAPPER_SLOTS, type InputWrapperSlots } from "../Input/shared";
import { InputBase, type InputBaseProps } from "../InputBase";
import { type EmbeddedControlSize, toEmbeddedControlSize } from "../internal/embedded-control-size";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

/** Picked file payload. `multiple` switches the runtime shape. */
export type FileInputValue = File | File[] | null;

type FileInputBaseProps = Omit<
  InputBaseProps,
  | "accept"
  | "capture"
  | "defaultValue"
  | "form"
  | "multiple"
  | "multiline"
  | "name"
  | "onChange"
  | "placeholder"
  | "pointer"
  | "readOnly"
  | "type"
  | "value"
>;

export interface FileInputProps extends FileInputBaseProps {
  /**
   * Called when the value changes. With `multiple`, the payload is `File[]`;
   * otherwise `File | null`.
   *
   * NOTE (pragmatic divergence): Mantine's `FileInput` is generic over
   * `Multiple` so the payload narrows at the type level. The kit fixes the
   * payload to the `File | File[] | null` union (the same approach as the rest
   * of the input family) to keep the component cast-free and strictly typed.
   */
  onChange?: (payload: FileInputValue) => void;

  /** Controlled value. */
  value?: FileInputValue;

  /** Uncontrolled default value. */
  defaultValue?: FileInputValue;

  /** Allow picking more than one file. @default false */
  multiple?: boolean;

  /** `accept` attribute, e.g. `"image/png,image/jpeg"`. */
  accept?: string;

  /** `name` attribute of the hidden file input. */
  name?: string;

  /** `form` attribute of the hidden file input. */
  form?: string;

  /** Renders the picked value. Defaults to a comma-joined list of file names. */
  valueComponent?: React.FC<{ value: FileInputValue }>;

  /** Show a clear button in the right section when a file is picked. @default false */
  clearable?: boolean;

  /**
   * Props passed down to the clear button.
   * @deprecated Use `styles={{ clearButton: … }}` instead. Kept as a
   * backward-compatible alias; when both are set it is spread OVER the
   * `clearButton` slot, so an explicit `clearButtonProps` still wins.
   */
  clearButtonProps?: Partial<CloseButtonProps>;

  /** Determines how clear button and rightSection are rendered. @default "both" */
  clearSectionMode?: "clear" | "default" | "rightSection" | "both";

  /** If set, the value cannot be changed (the picker is disabled). */
  readOnly?: boolean;

  /** Request a fresh capture from a device camera/mic. */
  capture?: boolean | "user" | "environment";

  /** Props passed down to the hidden `<input type="file">`. */
  fileInputProps?: FileButtonInputProps;

  /** Placeholder shown when no file is picked. */
  placeholder?: React.ReactNode;

  /** Ref populated with a function that clears the picked value. */
  resetRef?: React.Ref<() => void>;

  /** Per-slot style sugar — props spread onto the matching part. */
  styles?: SlotStyles<FileInputStyles>;
}

/* -------------------------------------------------------------------------- */
/* styles map (Pillar B)                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`) for `FileInput`. The
 * field-chrome slots (`wrapper` / `label` / `description` / `error` / `required`)
 * are inherited from `Input.Wrapper`'s vocabulary and forwarded through
 * `InputBase`, so `styles={{ label }}` means the same thing here as on a
 * `TextInput`. The remaining slots reach `FileInput`'s own parts:
 * `styles={{ clearButton: { variant: "filled" } }}` is sugar for the embedded
 * clear `CloseButton`.
 */
export interface FileInputStyles extends InputWrapperSlots {
  /** Props for the embedded clear button (`CloseButton`). */
  clearButton?: Partial<CloseButtonProps>;
  /** Props for the default value display `Text`. */
  value?: GetProps<typeof Text>;
  /** Props for the placeholder (`Input.Placeholder`). */
  placeholder?: GetProps<typeof Input.Placeholder>;
}

const FILE_INPUT_SLOT_KEYS = [
  ...INPUT_WRAPPER_SLOTS,
  "clearButton",
  "value",
  "placeholder",
] as const satisfies readonly (keyof FileInputStyles)[];

type FileInputRef = React.ComponentRef<typeof InputBase>;

const DefaultValue: React.FC<{ value: FileInputValue }> = ({ value }) => (
  <Text truncate>
    {Array.isArray(value) ? value.map((file) => file.name).join(", ") : (value?.name ?? "")}
  </Text>
);

const renderDefaultValue = (
  value: FileInputValue,
  valueProps: GetProps<typeof Text> | undefined,
) => (
  <Text truncate {...valueProps}>
    {Array.isArray(value) ? value.map((file) => file.name).join(", ") : (value?.name ?? "")}
  </Text>
);

const hasFiles = (value: FileInputValue): boolean =>
  Array.isArray(value) ? value.length !== 0 : value !== null;

/**
 * The clear button is embedded in the field, so derive its size one key DOWN from
 * the control size (`toEmbeddedControlSize`: field md → button sm). A same-key
 * button would be as tall as the field and overflow it. Routes the close button
 * through the shared control-derived sizing instead of mapping the field size 1:1.
 */
const toCloseSize = (size: InputSize | undefined): EmbeddedControlSize =>
  toEmbeddedControlSize(typeof size === "string" ? size : undefined);

/**
 * FileInput — an `Input`-styled control that opens the native file picker and
 * displays the picked file name(s). Mirrors Mantine's `FileInput`: built on
 * `FileButton` + `InputBase component="button"` (via the new host-tag override).
 * Clear the value with the optional clear button or imperatively via `resetRef`.
 * Accent/theme comes from the Tamagui `theme` prop + palette ramp — never a
 * Mantine `color` prop. The hidden `<input type="file">` is web-only (no native
 * file-picker primitive in the essentials); the styled trigger is cross-platform.
 */
export const FileInput = React.forwardRef<FileInputRef, FileInputProps>(
  function FileInput(props, ref) {
    const {
      onChange,
      value,
      defaultValue,
      multiple,
      accept,
      name,
      form,
      valueComponent: ValueComponent = DefaultValue,
      clearable = false,
      clearButtonProps,
      clearSectionMode,
      readOnly,
      capture,
      fileInputProps,
      rightSection,
      size = "md",
      placeholder,
      resetRef: resetRefProp,
      disabled,
      styles,
      ...others
    } = props;

    const s = slotStyles<FileInputStyles>(styles, FILE_INPUT_SLOT_KEYS, "FileInput");
    const chromeStyles = pick<FileInputStyles, InputWrapperSlots>(styles, INPUT_WRAPPER_SLOTS);
    const usingDefaultValue = ValueComponent === DefaultValue;

    const resetRef = React.useRef<() => void>(null);

    const [_value, setValue] = useUncontrolled<FileInputValue>({
      value,
      defaultValue,
      finalValue: multiple ? [] : null,
      onChange,
    });

    const valuePresent = hasFiles(_value);
    const _clearable = clearable && valuePresent && !readOnly && !disabled;
    const clearButtonOnPress = clearButtonProps?.onPress;
    const handleClear = React.useCallback<NonNullable<CloseButtonProps["onPress"]>>(
      (event) => {
        if (readOnly || disabled) {
          return;
        }

        clearButtonOnPress?.(event);
        setValue(multiple ? [] : null);
      },
      [clearButtonOnPress, disabled, multiple, readOnly, setValue],
    );

    const clearButton = (
      <CloseButton
        variant="subtle"
        size={toCloseSize(size)}
        // The `clearButton` slot sugar is the lowest precedence; the deprecated
        // `clearButtonProps` alias is spread OVER it (explicit beats sugar).
        {...s.merge("clearButton", clearButtonProps)}
        aria-label={
          clearButtonProps?.["aria-label"] ?? s.get("clearButton")?.["aria-label"] ?? "Clear file"
        }
        onPress={handleClear}
      />
    );

    // Reset the underlying file input's hidden `<input>` ONLY when a previously
    // present value transitions to empty (clear button or a controlled value
    // going empty), so the same file can be re-selected. Tracking the prior
    // presence avoids firing on mount, before any interaction.
    const wasPresent = React.useRef(valuePresent);
    React.useEffect(() => {
      if (wasPresent.current && !valuePresent) {
        resetRef.current?.();
      }
      wasPresent.current = valuePresent;
    }, [valuePresent]);

    return (
      <FileButton
        onChange={setValue}
        multiple={multiple}
        accept={accept}
        name={name}
        form={form}
        resetRef={useMergedRef(resetRef, resetRefProp)}
        disabled={readOnly || disabled}
        capture={capture}
        inputProps={fileInputProps}
      >
        {(fileButtonProps) => (
          <InputBase
            ref={ref}
            component="button"
            type="button"
            multiline
            pointer
            size={size}
            disabled={disabled}
            rightSection={rightSection}
            __clearSection={clearButton}
            __clearable={_clearable}
            __clearSectionMode={clearSectionMode}
            styles={chromeStyles}
            {...fileButtonProps}
            {...others}
            aria-disabled={readOnly || disabled || undefined}
          >
            {!valuePresent ? (
              <Input.Placeholder {...s.get("placeholder")}>{placeholder}</Input.Placeholder>
            ) : usingDefaultValue ? (
              renderDefaultValue(_value, s.get("value"))
            ) : (
              <ValueComponent value={_value} />
            )}
          </InputBase>
        )}
      </FileButton>
    );
  },
);

FileInput.displayName = "FileInput";
