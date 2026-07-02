import * as React from "react";

import { useMergedRef } from "@knitui/hooks";

import { assignRef, renderTrigger, toSelection } from "./FileButton.shared";
import type { FileButtonComponent, FileButtonInternalProps } from "./FileButton.types";

/* -------------------------------------------------------------------------- */
/* Web implementation                                                         */
/* -------------------------------------------------------------------------- */

const FileButtonImpl = React.forwardRef<HTMLInputElement, FileButtonInternalProps>(
  function FileButton(props, ref) {
    const {
      onChange,
      children,
      multiple,
      accept,
      name,
      form,
      resetRef,
      disabled,
      capture,
      inputProps,
      // `pickFiles` is native-only; pull it off so it never reaches the Button.
      pickFiles: _pickFiles,
      ...triggerProps
    } = props;

    const inputRef = React.useRef<HTMLInputElement>(null);
    const mergedRef = useMergedRef<HTMLInputElement>(ref, inputRef);

    const onClick = React.useCallback(() => {
      if (!disabled) {
        inputRef.current?.click();
      }
    }, [disabled]);

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.currentTarget.files;
        onChange(toSelection(files ? Array.from(files) : null, multiple));
      },
      [multiple, onChange],
    );

    const reset = React.useCallback(() => {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }, []);

    React.useEffect(() => {
      assignRef(resetRef, reset);
    }, [resetRef, reset]);

    return (
      <>
        <input
          {...inputProps}
          ref={mergedRef}
          type="file"
          accept={accept}
          multiple={multiple}
          name={name}
          form={form}
          capture={capture}
          disabled={disabled}
          onChange={handleChange}
          style={{ display: "none" }}
        />
        {renderTrigger(children, onClick, { ...triggerProps, disabled })}
      </>
    );
  },
);

/**
 * FileButton — opens the native file picker from a `Button` trigger (or any
 * trigger you render). Mirrors Mantine's `FileButton`, with the picked
 * `File`/`File[]` delivered through `onChange`. By default it renders the kit's
 * `Button` (pass `children` as the label and `variant`/`size`/`leftSection`/…
 * straight through); pass a `({ onClick }) => ReactNode` child to supply your
 * own trigger. Use `resetRef` to imperatively clear the selection. The actual
 * `<input type="file">` is hidden.
 *
 * On native (`FileButton.native.tsx`) the hidden input is replaced by a
 * `pickFiles` resolver — see {@link FileButtonProps.pickFiles}.
 */
export const FileButton = FileButtonImpl as FileButtonComponent;

FileButton.displayName = "FileButton";

export type {
  FileButtonChildren,
  FileButtonInputProps,
  FileButtonPicker,
  FileButtonPickOptions,
  FileButtonProps,
  FileButtonTriggerProps,
  FileButtonValue,
} from "./FileButton.types";
