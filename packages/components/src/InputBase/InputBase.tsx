import * as React from "react";

import { Input, type InputProps } from "../Input";
import type { InputWrapperProps } from "../Input/shared";

type InputBaseWrapperProps = Omit<InputWrapperProps, "children">;
type InputBaseInputProps = Omit<InputProps, keyof InputBaseWrapperProps | "wrapperProps">;

export interface InputBaseProps extends InputBaseInputProps, InputBaseWrapperProps {
  /** Props passed down to the root element (`Input.Wrapper` component) */
  wrapperProps?: InputBaseWrapperProps & InputProps["wrapperProps"];
}

export const InputBase = Input.styleable<InputBaseProps>(function InputBase(props, ref) {
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
  const inputProps: InputBaseInputProps = others;

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
