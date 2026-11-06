import * as React from "react";

import { styleable } from "@knitui/core";

import { Input, type InputProps } from "../Input";
import type { InputWrapperProps } from "../Input/shared";

type InputBaseWrapperProps = Omit<InputWrapperProps, "children">;
type InputBaseInputProps = Omit<InputProps, keyof InputBaseWrapperProps | "wrapperProps">;

export interface InputBaseProps extends InputBaseInputProps, InputBaseWrapperProps {
  /** Props passed down to the root element (`Input.Wrapper` component) */
  wrapperProps?: InputBaseWrapperProps & InputProps["wrapperProps"];
}

/**
 * Props that place the field among its siblings. They belong on the outer wrapper:
 * on the inner input, `flex={1}` in a row would size the input inside a wrapper that
 * stays at its content width.
 */
const LAYOUT_PROPS = new Set([
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "alignSelf",
  "width",
  "minWidth",
  "maxWidth",
  "margin",
  "marginHorizontal",
  "marginVertical",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
]);

const splitLayoutProps = (
  props: InputBaseInputProps,
): { layout: Record<string, unknown>; inputProps: InputBaseInputProps } => {
  const layout: Record<string, unknown> = {};
  const inputProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    (LAYOUT_PROPS.has(key) ? layout : inputProps)[key] = value;
  }
  return { layout, inputProps: inputProps as InputBaseInputProps };
};

export const InputBase = styleable<InputBaseProps>(Input, function InputBase(props, ref) {
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
    ...others
  } = props;
  const { layout, inputProps } = splitLayoutProps(others);

  return (
    <Input.Wrapper
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
      {...layout}
      {...wrapperProps}
    >
      <Input
        ref={ref}
        id={id}
        size={size}
        error={error}
        required={required}
        styles={styles}
        {...inputProps}
      />
    </Input.Wrapper>
  );
});
