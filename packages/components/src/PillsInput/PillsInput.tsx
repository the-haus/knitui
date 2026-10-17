import * as React from "react";

import { type TamaguiElement, withStaticProperties } from "@knitui/core";
import { useCallbackRef, useMergedRef } from "@knitui/hooks";

import { type __BaseInputProps, Input, type InputProps } from "../Input";
import {
  InputChrome,
  type InputRootRef,
  type InputSize,
  type InputVariant,
  InputWrapper,
  InputWrapperContext,
} from "../Input/shared";
import { toEmbeddedControlSize } from "../internal/embedded-control-size";
import { PillGroupContext, type PillGroupContextValue } from "../Pill";

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

interface PillsInputContextValue {
  /** Ref to the inner editable field — pressing the shell focuses it. */
  fieldRef: React.RefObject<InputFieldElement | null>;
  size: InputSize;
  disabled?: boolean;
  hasError: boolean;
  variant?: InputVariant;
  /**
   * Field focus/blur reported up from `PillsInput.Field` so the shell can show
   * the same `focusRingColor` border every other text field gets — the field
   * is a SEPARATE child, so the shell can't read its focus state directly.
   */
  setFocused: (focused: boolean) => void;
}

type InputFieldElement = React.ComponentRef<typeof Input>;

const PillsInputContext = React.createContext<PillsInputContextValue | null>(null);

/** The shell lays the pills + field out as a wrapping row. */
const SHELL_ROOT = {
  flexWrap: "wrap",
  alignItems: "flex-start",
  padding: "xs",
  gap: "xs",
} as const;

/* -------------------------------------------------------------------------- */
/* PillsInput shell                                                           */
/* -------------------------------------------------------------------------- */

export interface PillsInputProps extends __BaseInputProps {
  /** Pills + a `PillsInput.Field`, usually inside a `Pill.Group`. */
  children?: React.ReactNode;
  /** Disable the whole control (inherited by child `Pill`s + the field). */
  disabled?: boolean;
  /** Render the field with a pointer cursor (non-searchable selects). */
  pointer?: boolean;
  /**
   * Extra ref to the bordered frame, merged with `ref`. Lets a wrapper (e.g.
   * `Combobox.Target`) anchor/measure a dropdown against the visible field.
   */
  rootRef?: React.Ref<InputRootRef>;
}

/**
 * Mirrors Mantine's `PillsInput` — an `Input`-styled **multiline** shell that
 * hosts a `Pill.Group` of pills followed by an editable `PillsInput.Field`. Built
 * on the shared `InputWrapper` (label/description/error) + `InputChrome` (bordered
 * frame) so it inherits the full input chrome surface. Pressing anywhere in the
 * shell focuses the field. Accent comes from the Tamagui `theme` prop + palette
 * ramp, never a Mantine `color` prop. Forwards its ref to the frame so it can act
 * as a `Combobox.Target`.
 */
const PillsInputComponent = React.forwardRef<InputRootRef, PillsInputProps>(
  function PillsInput(props, ref) {
    const {
      // Wrapper chrome
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
      id,
      // Frame chrome
      size = "md",
      variant = "default",
      radius,
      disabled,
      pointer,
      leftSection,
      leftSectionWidth,
      leftSectionProps,
      leftSectionPointerEvents,
      rightSection,
      rightSectionWidth,
      rightSectionProps,
      rightSectionPointerEvents,
      loading,
      loadingPosition,
      wrapperProps,
      rootRef: rootRefProp,
      children,
    } = props;

    const fieldRef = React.useRef<InputFieldElement | null>(null);
    const rootRef = useMergedRef<InputRootRef>(ref, rootRefProp ?? null);
    const [focused, setFocused] = React.useState(false);

    const ctx = React.useMemo<PillsInputContextValue>(
      () => ({ fieldRef, size, disabled, hasError: !!error, variant, setFocused }),
      [size, disabled, error, variant],
    );

    // Pills hosted in the shell scale WITH the field: a step-down from the field
    // size (so a `md` PillsInput gets `sm` pills that sit comfortably inside it),
    // provided to any child `Pill`/`Pill.Group` that doesn't set its own size.
    const pillGroupValue = React.useMemo<PillGroupContextValue>(
      () => ({ size: toEmbeddedControlSize(size), disabled }),
      [size, disabled],
    );

    const shellWrapperProps = React.useMemo(
      () => (wrapperProps ? { ...SHELL_ROOT, ...wrapperProps } : SHELL_ROOT),
      [wrapperProps],
    );
    const focusField = React.useCallback(() => fieldRef.current?.focus?.(), []);

    return (
      <PillsInputContext.Provider value={ctx}>
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
        >
          <InputChrome
            multiline
            size={size}
            variant={variant}
            radius={radius}
            error={error}
            disabled={disabled}
            pointer={pointer}
            focused={focused}
            rootRef={rootRef}
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
            wrapperProps={shellWrapperProps}
            onRootPress={focusField}
          >
            <PillGroupContext.Provider value={pillGroupValue}>{children}</PillGroupContext.Provider>
          </InputChrome>
        </InputWrapper>
      </PillsInputContext.Provider>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* PillsInput.Field                                                           */
/* -------------------------------------------------------------------------- */

export interface PillsInputFieldProps extends Omit<InputProps, "type" | "variant" | "size"> {
  /**
   * Field visibility. `'visible'` (default) is an editable text field;
   * `'hidden'` collapses it to a focusable sliver (non-searchable selects).
   * @default 'visible'
   */
  type?: "auto" | "visible" | "hidden";
  /** Change the cursor to a pointer. */
  pointer?: boolean;
}

const PillsInputField = React.forwardRef<InputFieldElement, PillsInputFieldProps>(
  function PillsInputField(props, ref) {
    const {
      type = "visible",
      pointer,
      disabled,
      id,
      wrapperProps,
      onFocus,
      onBlur,
      ...rest
    } = props;
    const ctx = React.useContext(PillsInputContext);
    const wrapperCtx = React.useContext(InputWrapperContext);
    const mergedRef = useMergedRef<InputFieldElement>(ref, ctx?.fieldRef ?? null);

    const isDisabled = disabled ?? ctx?.disabled;
    const hidden = type === "hidden";

    // Report focus up to the shell so its border lights up like any text field.
    // Stable identities (latest-closure) so the memoized `Input` below isn't
    // handed fresh handlers on every keystroke in the field.
    const handleFocus = useCallbackRef((event: FieldFocusEvent) => {
      ctx?.setFocused(true);
      onFocus?.(event);
    });
    const handleBlur = useCallbackRef((event: FieldFocusEvent) => {
      ctx?.setFocused(false);
      onBlur?.(event);
    });

    // The field sits bare inside the shell: no own height/inset, it flexes into
    // the free space after the pills. Static per `hidden` unless the caller adds
    // `wrapperProps`, so it never allocates on a keystroke.
    const fieldWrapperProps = React.useMemo(
      () =>
        wrapperProps
          ? { ...wrapperProps, ...(hidden ? HIDDEN_FIELD_ROOT : VISIBLE_FIELD_ROOT) }
          : hidden
            ? HIDDEN_FIELD_ROOT
            : VISIBLE_FIELD_ROOT,
      [wrapperProps, hidden],
    );

    return (
      <Input
        {...rest}
        ref={mergedRef as React.Ref<TamaguiElement>}
        id={wrapperCtx?.inputId ?? id}
        variant="unstyled"
        size={ctx?.size}
        disabled={isDisabled}
        pointer={pointer}
        onFocus={handleFocus}
        onBlur={handleBlur}
        opacity={hidden ? 0 : 1}
        wrapperProps={fieldWrapperProps}
      />
    );
  },
);

type FieldFocusEvent = Parameters<NonNullable<InputProps["onFocus"]>>[0];

const FIELD_ROOT = {
  flex: 1,
  height: "auto",
  minHeight: 0,
  paddingHorizontal: 0,
  paddingVertical: 0,
  backgroundColor: "transparent",
  alignSelf: "center",
} as const;
const VISIBLE_FIELD_ROOT = { ...FIELD_ROOT, minWidth: "xxl", width: "auto" } as const;
const HIDDEN_FIELD_ROOT = { ...FIELD_ROOT, minWidth: 1, width: 1 } as const;

export const PillsInput = withStaticProperties(PillsInputComponent, {
  Field: PillsInputField,
});

export { PillsInputContext };
export type { PillsInputContextValue };
