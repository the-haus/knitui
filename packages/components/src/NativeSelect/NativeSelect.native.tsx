import * as React from "react";

import { Combobox } from "../Combobox";
import type { InputSize } from "../Input";
import { InputBase, type InputBaseProps } from "../InputBase";
import {
  type ComboboxData,
  flattenComboboxOptions,
  getParsedComboboxData,
} from "../internal/combobox-data";

export interface NativeSelectProps extends Omit<InputBaseProps, "pointer" | "children"> {
  /**
   * Data used to render options on web. On native, there is no platform-neutral
   * select primitive in this kit, so the selected label is displayed read-only.
   */
  data?: ComboboxData;

  /** Web-only raw `<option>`/`<optgroup>` nodes; ignored on native. */
  children?: React.ReactNode;
}

type NativeSelectRef = React.ComponentRef<typeof InputBase>;

const getDisplayValue = (
  data: ComboboxData | undefined,
  value: unknown,
  defaultValue: unknown,
): string => {
  const options = flattenComboboxOptions(getParsedComboboxData(data));
  const selectedValue = value ?? defaultValue;
  const selected = options.find((item) => item.value === selectedValue);

  return selected?.label ?? (typeof selectedValue === "string" ? selectedValue : "");
};

/**
 * React Native fallback for `NativeSelect`. The web implementation uses real
 * `<select>`/`<option>` tags; those host tags are invalid in React Native, so
 * native renders a read-only input-shaped field with the selected label.
 */
export const NativeSelect = React.forwardRef<NativeSelectRef, NativeSelectProps>(
  function NativeSelect(props, ref) {
    const {
      data,
      children,
      size = "md",
      error,
      rightSection,
      value,
      defaultValue,
      readOnly,
      ...others
    } = props;

    void children;

    return (
      <InputBase
        ref={ref}
        size={size as InputSize}
        pointer
        readOnly={readOnly ?? true}
        value={getDisplayValue(data, value, defaultValue)}
        error={error}
        rightSection={rightSection}
        __defaultRightSection={<Combobox.Chevron size={size as InputSize} error={error} />}
        {...others}
      />
    );
  },
);

NativeSelect.displayName = "NativeSelect";
