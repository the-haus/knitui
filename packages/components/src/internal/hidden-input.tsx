import * as React from "react";

import { type GetProps, isWeb } from "@knitui/core";

import { Box } from "../Box";

export interface HiddenInputProps {
  /** Form field name. Without it the helper renders nothing. */
  name?: string;
  /** Associated `<form>` id. */
  form?: string;
  /** Field value, already stringified/joined by the caller. */
  value: string;
  /** Disable the field. */
  disabled?: boolean;
  /** Extra host props merged last (e.g. a control's deprecated `hiddenInputProps`). */
  extraProps?: object;
}

/**
 * Web-form parity helper shared by the form-participating controls
 * (`Combobox`/`MultiSelect`/`TagsInput`, `SegmentedControl`, `Rating`, `Slider`,
 * `AngleSlider`): renders a single `<input type="hidden">` (as a `Box` host
 * element) carrying `value` so a surrounding `<form>` submits it.
 *
 * No-op on native or without a `name`. Web `<input>` attributes aren't part of
 * the `View` style-prop type, so they're spread as a precisely-typed host-prop
 * object (the `as object` pattern used across the kit — no `any`).
 */
export function HiddenInput(props: HiddenInputProps): React.JSX.Element | null {
  const { name, form, value, disabled, extraProps } = props;
  if (!isWeb || !name) return null;
  const hostProps: object = {
    render: "input",
    type: "hidden",
    name,
    form,
    disabled,
    value,
    readOnly: true,
    tabIndex: -1,
    "aria-hidden": true,
    ...extraProps,
  };
  return <Box {...(hostProps as GetProps<typeof Box>)} />;
}
