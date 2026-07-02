import * as React from "react";

import { assignRef, renderTrigger, toSelection } from "./FileButton.shared";
import type { FileButtonComponent, FileButtonInternalProps } from "./FileButton.types";

/* -------------------------------------------------------------------------- */
/* Native implementation                                                      */
/* -------------------------------------------------------------------------- */

/**
 * React Native has no `<input type="file">` host, so this build resolves the
 * trigger's `onClick` against a `pickFiles` resolver instead of a hidden DOM
 * input. Wire `pickFiles` to a native picker (e.g. `expo-document-picker` or
 * `expo-image-picker`) — the objects it returns flow straight through to
 * `onChange`, mirroring the web build's `File`/`File[]` payload shape.
 *
 * Metro resolves this file on native; web bundlers resolve `FileButton.tsx`.
 * The two share `FileButton.types` and `FileButton.shared` (including the
 * `Button` trigger), so the public API and the `onChange` payload shape are
 * identical on both platforms.
 */
const FileButtonImpl = React.forwardRef<never, FileButtonInternalProps>(
  function FileButton(props, _ref) {
    const {
      onChange,
      children,
      multiple,
      accept,
      capture,
      disabled,
      resetRef,
      pickFiles,
      // Web-only props; pull them off so they never reach the Button.
      name: _name,
      form: _form,
      inputProps: _inputProps,
      ...triggerProps
    } = props;

    const onClick = React.useCallback(() => {
      if (disabled) {
        return;
      }

      if (!pickFiles) {
        console.warn(
          "[FileButton] No `pickFiles` resolver provided. On native, pass `pickFiles` " +
            "wired to a native picker such as expo-document-picker or expo-image-picker.",
        );
        return;
      }

      Promise.resolve(pickFiles({ multiple: Boolean(multiple), accept, capture }))
        .then((picked) => {
          onChange(toSelection(picked, multiple));
        })
        .catch((error: unknown) => {
          console.error("[FileButton] `pickFiles` rejected:", error);
        });
    }, [disabled, pickFiles, multiple, accept, capture, onChange]);

    // No input element to clear on native; the selection is delivered eagerly
    // by `pickFiles`. The reset fn is still published so callers can invoke it
    // safely on either platform.
    const reset = React.useCallback(() => {}, []);

    React.useEffect(() => {
      assignRef(resetRef, reset);
    }, [resetRef, reset]);

    return <>{renderTrigger(children, onClick, { ...triggerProps, disabled })}</>;
  },
);

/**
 * FileButton (native) — opens a platform file/image picker from a `Button`
 * trigger (or any trigger you render). API-compatible with the web `FileButton`:
 * pass `children` as the Button label (or a `({ onClick }) => ReactNode` child
 * for a custom trigger), and the picked file(s) are delivered through
 * `onChange`. Native picking is delegated to the `pickFiles` resolver.
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
