import * as React from "react";

import { isWeb, registerFocusable, styled, type TamaguiElement, useWebRef } from "@knitui/core";

import { Combobox } from "../Combobox";
import {
  INPUT_CHROME_SLOTS,
  InputChrome,
  inputHostSizeVariant,
  type InputSize,
  InputWrapper,
  InputWrapperContext,
  registerInputFocusable,
} from "../Input/shared";
import type { InputBaseProps } from "../InputBase";
import {
  type ComboboxData,
  type ComboboxParsedItem,
  getParsedComboboxData,
  isComboboxGroup,
} from "../internal/combobox-data";
import { pick } from "../internal/styles";
import { Text } from "../Text";

export interface NativeSelectProps extends Omit<
  InputBaseProps,
  "component" | "pointer" | "onChange" | "onFocus" | "onBlur"
> {
  /**
   * Data used to render `<option>`s. Accepts bare strings, `{ value, label,
   * disabled }` items, or `{ group, items }` groups. Ignored when `children`
   * (raw option nodes) are provided.
   */
  data?: ComboboxData;

  /** Raw `<option>`/`<optgroup>` nodes; when provided, `data` is ignored. */
  children?: React.ReactNode;

  /**
   * Native `<select>` events. NativeSelect renders a real `<select>` host (per
   * Mantine), so these are typed for `HTMLSelectElement` rather than the
   * text-input handlers inherited from `InputBaseProps`.
   */
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onFocus?: React.FocusEventHandler<HTMLSelectElement>;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
}

type NativeSelectRef = HTMLSelectElement & TamaguiElement;
type WebSelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;
type NativeSelectControlProps = Omit<NativeSelectProps, "label" | "description" | "withAsterisk">;

const SelectInput = styled(Text, {
  name: "NativeSelectInput",
  render: "select",
  flex: 1,
  minWidth: 0,
  height: "100%",
  outlineWidth: 0,
  borderWidth: 0,
  borderColor: "transparent",
  backgroundColor: "transparent",
  boxShadow: "none",
  color: "$color",
  fontFamily: "$body",

  focusStyle: {
    outlineWidth: 0,
    borderWidth: 0,
    borderColor: "transparent",
    boxShadow: "none",
  },

  focusVisibleStyle: {
    outlineWidth: 0,
    borderWidth: 0,
    borderColor: "transparent",
    boxShadow: "none",
  },

  variants: {
    size: inputHostSizeVariant,
  } as const,

  defaultVariants: {
    size: "md",
  },
});

function NativeSelectOption({ data }: { data: ComboboxParsedItem }) {
  if (isComboboxGroup(data)) {
    return (
      <optgroup label={data.group}>
        {data.items.map((item) => (
          <NativeSelectOption key={item.value} data={item} />
        ))}
      </optgroup>
    );
  }

  return (
    <option value={data.value} disabled={data.disabled}>
      {data.label}
    </option>
  );
}

const NativeSelectControl = React.forwardRef<NativeSelectRef, NativeSelectControlProps>(
  function NativeSelectControl(props, forwardedRef) {
    const {
      data,
      children,
      size = "md",
      error,
      rightSection,
      rightSectionWidth,
      rightSectionProps,
      rightSectionPointerEvents = "none",
      leftSection,
      leftSectionWidth,
      leftSectionProps,
      leftSectionPointerEvents = "none",
      variant = "default",
      radius,
      disabled,
      readOnly,
      required,
      wrapperProps,
      styles,
      rootRef,
      loading,
      loadingPosition,
      __clearSection,
      __clearable,
      __clearSectionMode,
      __defaultRightSection,
      inputSize,
      onChange,
      onChangeText,
      onInput,
      onFocus,
      onBlur,
      onKeyDown,
      style,
      id,
      unstyled,
      multiline,
      ...rest
    } = props;

    const { ref, composedRef } = useWebRef<HTMLSelectElement>(forwardedRef);
    const [focused, setFocused] = React.useState(false);
    const wrapperContext = React.useContext(InputWrapperContext);
    const inputId = wrapperContext?.inputId || id;
    const inputError = error ?? wrapperContext?.error;
    const effectiveSize = size || wrapperContext?.size || "md";

    void inputSize;
    void multiline;

    React.useEffect(() => {
      if (!inputId || disabled) return;
      const focusable = {
        focus: () => ref.current?.focus(),
        focusAndSelect: () => ref.current?.focus(),
      };
      const unregisterTamaguiFocusable = registerFocusable(inputId, focusable);
      const unregisterInputFocusable = registerInputFocusable(inputId, focusable);

      return () => {
        unregisterTamaguiFocusable?.();
        unregisterInputFocusable();
      };
    }, [disabled, inputId, ref]);

    const handleFocus = (event: React.FocusEvent<HTMLSelectElement>) => {
      setFocused(true);
      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLSelectElement>) => {
      setFocused(false);
      onBlur?.(event);
    };

    const handleChange = (event: WebSelectChangeEvent) => {
      onChangeText?.(event.target.value);
      onChange?.(event);
    };

    const options = getParsedComboboxData(data).map((item, index) => (
      <NativeSelectOption key={isComboboxGroup(item) ? `group-${index}` : item.value} data={item} />
    ));
    const selectHostProps: object = {
      disabled,
      readOnly,
      required,
      id: inputId,
      "aria-invalid": inputError ? true : undefined,
      "aria-describedby": wrapperContext?.describedBy,
      onBlur: handleBlur,
      onFocus: handleFocus,
      onInput,
      onKeyDown,
      onChange: onChangeText || onChange ? handleChange : undefined,
      style,
      ...rest,
    };

    const mergedStyle = isWeb
      ? { appearance: "none" as const, ...(typeof style === "object" ? style : {}) }
      : style;

    return (
      <InputChrome
        size={effectiveSize}
        variant={unstyled ? "unstyled" : variant}
        radius={radius}
        error={inputError}
        disabled={disabled}
        pointer
        focused={focused}
        rootRef={rootRef}
        wrapperProps={wrapperProps}
        styles={pick(styles, INPUT_CHROME_SLOTS)}
        leftSection={leftSection}
        leftSectionWidth={leftSectionWidth}
        leftSectionProps={leftSectionProps}
        leftSectionPointerEvents={leftSectionPointerEvents}
        rightSection={rightSection}
        rightSectionWidth={rightSectionWidth}
        rightSectionProps={rightSectionProps}
        rightSectionPointerEvents={rightSectionPointerEvents}
        loading={loading}
        loadingPosition={loadingPosition}
        __clearSection={__clearSection}
        __clearable={__clearable}
        __clearSectionMode={__clearSectionMode}
        __defaultRightSection={
          __defaultRightSection ?? (
            <Combobox.Chevron size={effectiveSize as InputSize} error={error} />
          )
        }
      >
        <SelectInput
          ref={composedRef as React.Ref<TamaguiElement>}
          flex={1}
          minWidth={0}
          size={effectiveSize}
          {...selectHostProps}
          style={mergedStyle}
        >
          {children ?? options}
        </SelectInput>
      </InputChrome>
    );
  },
);

/**
 * NativeSelect — a labeled native `<select>` field. Mirrors Mantine's
 * `NativeSelect`, while keeping the shared input label/description/error chrome.
 * This web entry renders a real `<select>`/`<option>` tree; the `.native.tsx`
 * sibling provides a React Native-safe fallback.
 */
export const NativeSelect = React.forwardRef<NativeSelectRef, NativeSelectProps>(
  function NativeSelect(props, ref) {
    const {
      label,
      description,
      error,
      required,
      withAsterisk,
      labelProps,
      descriptionProps,
      errorProps,
      styles,
      inputContainer,
      inputWrapperOrder,
      labelElement,
      wrapperProps,
      id,
      size = "md",
      rightSection,
      ...others
    } = props;

    return (
      <InputWrapper
        id={id}
        label={label}
        description={description}
        error={error}
        required={required}
        withAsterisk={withAsterisk}
        labelProps={labelProps}
        descriptionProps={descriptionProps}
        errorProps={errorProps}
        styles={styles}
        inputContainer={inputContainer}
        inputWrapperOrder={inputWrapperOrder}
        labelElement={labelElement}
        size={size}
        {...wrapperProps}
      >
        <NativeSelectControl
          ref={ref}
          id={id}
          size={size}
          error={error}
          rightSection={rightSection}
          styles={styles}
          {...others}
        />
      </InputWrapper>
    );
  },
);

NativeSelect.displayName = "NativeSelect";
