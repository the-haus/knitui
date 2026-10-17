import React from "react";

import {
  type GetProps,
  registerFocusable,
  styleable,
  styled,
  type TamaguiElement,
  useWebRef,
  withStaticProperties,
} from "@knitui/core";
import { useCallbackRef, useId } from "@knitui/hooks";

import { Box } from "../Box";
import { webCursor } from "../internal/style-props";
import { pick } from "../internal/styles";
import { Text } from "../Text";
import {
  getInputSectionInsets,
  INPUT_CHROME_SLOTS,
  INPUT_HOST_CONFIG,
  INPUT_HOST_STATIC,
  InputChrome,
  InputClearButton,
  InputDescription,
  InputError,
  inputHostSizeVariant,
  InputLabel,
  InputPlaceholder,
  InputWrapper,
  InputWrapperContext,
  registerInputFocusable,
  TEXTAREA_HOST_CONFIG,
} from "./shared";
import type { InputSharedProps } from "./types";
import { useTextareaAutosize } from "./useAutosize";

type WebInputElement = HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement;
type WebInputHostProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Host element the `Input` renders. Defaults to the computed `input`/`textarea`
 * choice; consumers that need a different host (`NativeSelect` → `"select"`,
 * `FileInput` → `"button"`) pass `component` to override it. On native a non-text
 * host degrades to a plain `View` (documented per-component).
 */
export type InputHostTag = "input" | "textarea" | "select" | "button";

const StyledInput = styled(Box, { ...INPUT_HOST_CONFIG, render: "input" }, INPUT_HOST_STATIC);
const StyledTextareaInput = styled(Box, TEXTAREA_HOST_CONFIG, INPUT_HOST_STATIC);
const StyledButtonInput = styled(Text, {
  displayName: "InputButton",
  render: "button",
  flex: 1,
  minWidth: 0,
  height: "100%",
  alignItems: "stretch",
  justifyContent: "center",
  outlineWidth: 0,
  outlineStyle: "none",
  borderWidth: 0,
  borderColor: "transparent",
  backgroundColor: "transparent",
  boxShadow: "none",
  ...webCursor("inherit"),
  fontFamily: "body",
  textAlign: "left",

  variants: {
    size: inputHostSizeVariant,
  } as const,

  defaultVariants: {
    size: "md",
  },
});

/**
 * The host frame's own props: every style prop of the text host (padding, text
 * styles, `placeholderTextColor`, `selectionColor`, …) is part of `Input`'s public
 * surface, as it was under v2's `.styleable()` merge.
 */
type InputHostFrameProps = GetProps<typeof StyledInput>;

type WebInputOwnProps = Omit<
  InputSharedProps,
  "autoCorrect" | "autoCapitalize" | "onChange" | "onInput" | "onKeyDown"
> &
  Omit<
    WebInputHostProps,
    keyof InputSharedProps | "size" | "color" | "style" | "children" | "className"
  > & {
    autoCorrect?: InputSharedProps["autoCorrect"] | WebInputHostProps["autoCorrect"];
    autoCapitalize?: InputSharedProps["autoCapitalize"] | WebInputHostProps["autoCapitalize"];
    onChange?: WebInputHostProps["onChange"];
    onInput?: WebInputHostProps["onInput"];
    onKeyDown?: WebInputHostProps["onKeyDown"];
    /** Override the host element tag (defaults to `input`/`textarea`). */
    component?: InputHostTag;
    /**
     * Rendered inside the host element. Only meaningful for the `button` host
     * (e.g. FileInput's trigger displays the picked file name); ignored for the
     * native `input`/`textarea`/`select` hosts.
     */
    children?: React.ReactNode;
  };

type WebInputProps = Omit<InputHostFrameProps, keyof WebInputOwnProps> & WebInputOwnProps;

/** `component="select"` reuses the text host with the `<select>` tag. */
const SELECT_HOST = { render: "select" } as const;
/** A `<button>` host defaults to `type="button"` so it never submits a form. */
const BUTTON_TYPE = { type: "button" } as const;

const InputComponent = styleable<WebInputProps>(StyledInput, function Input(props, forwardedRef) {
  const {
    disabled,
    id,
    error,
    required,
    readOnly,
    size = "md",
    variant = "default",
    radius,
    pointer,
    withAria = true,
    wrapperProps,
    styles,
    rootRef,
    leftSection,
    leftSectionWidth,
    leftSectionProps,
    leftSectionPointerEvents = "none",
    rightSection,
    rightSectionWidth,
    rightSectionProps,
    rightSectionPointerEvents = "none",
    inputSize,
    __clearSection,
    __clearable,
    __clearSectionMode,
    __defaultRightSection,
    loading = false,
    loadingPosition = "right",
    onChangeText,
    onSubmitEditing,
    onSelectionChange,
    selection,
    rows,
    autosize,
    minRows,
    maxRows,
    value,
    onBlur,
    onChange,
    onFocus,
    onKeyDown,
    children,

    multiline,
    component,
    autoCapitalize: autoCapitalizeProp,
    autoCorrect: autoCorrectProp,
    textContentType,

    // Removes the host chrome so the input renders bare (composite inputs).
    unstyled,

    ...rest
  } = props;

  const { ref, composedRef } = useWebRef<WebInputElement>(forwardedRef);
  const [focused, setFocused] = React.useState(false);
  const wrapperContext = React.useContext(InputWrapperContext);
  const generatedInputId = useId(id);
  const inputId = wrapperContext?.inputId || generatedInputId;
  const inputError = error ?? wrapperContext?.error;
  const effectiveSize = size || wrapperContext?.size || "md";
  const isMultiline = multiline || (typeof rows === "number" && rows > 1);
  // A `component` override (e.g. NativeSelect's `"select"`, FileInput's `"button"`)
  // wins over the computed text-host tag; default path is unchanged.
  const hostTag = component ?? (isMultiline ? "textarea" : "input");

  void inputSize;
  void textContentType;

  // convert native-style values to web equivalents
  const autoCorrect =
    autoCorrectProp === true ? "on" : autoCorrectProp === false ? "off" : autoCorrectProp;
  const autoCapitalize =
    autoCapitalizeProp === "sentences" || autoCapitalizeProp === "words"
      ? "on"
      : autoCapitalizeProp === "none" || autoCapitalizeProp === "characters"
        ? "off"
        : autoCapitalizeProp;

  // Handle selection changes.
  //
  // `onSelectionChange` is held in a `useCallbackRef` (stable identity, always
  // calls the latest version) and deliberately kept OUT of the effect deps:
  // callers pass an inline arrow, so a fresh identity every render used to tear
  // the DOM listener down and re-attach it on EVERY keystroke. `hasSelectionChange`
  // gates attaching at all, so the "no handler = no listener" behaviour is kept
  // while the listener itself now attaches once.
  const selectionChangeRef = useCallbackRef(onSelectionChange);
  const hasSelectionChange = Boolean(onSelectionChange);
  React.useEffect(() => {
    if (!hasSelectionChange) return;

    const node = ref.current;
    if (!node) return;

    const handleSelectionChange = () => {
      selectionChangeRef({
        nativeEvent: {
          selection: {
            start: "selectionStart" in node ? (node.selectionStart ?? 0) : 0,
            end: "selectionEnd" in node ? (node.selectionEnd ?? 0) : 0,
          },
        },
      });
    };

    node.addEventListener("select", handleSelectionChange);
    return () => node.removeEventListener("select", handleSelectionChange);
  }, [hasSelectionChange, selectionChangeRef, ref]);

  // Sync selection prop
  React.useEffect(() => {
    if (selection && ref.current && "setSelectionRange" in ref.current) {
      ref.current.setSelectionRange(selection.start, selection.end ?? selection.start);
    }
  }, [selection, ref]);

  // Register focusable
  React.useEffect(() => {
    if (!inputId || disabled) return;
    const focusable = {
      focusAndSelect: () => ref.current?.focus(),
      focus: () => ref.current?.focus(),
    };
    const unregisterTamaguiFocusable = registerFocusable(inputId, focusable);
    const unregisterInputFocusable = registerInputFocusable(inputId, focusable);

    return () => {
      unregisterTamaguiFocusable?.();
      unregisterInputFocusable();
    };
  }, [inputId, disabled, ref]);

  // Track the textarea node for autosize (web multiline only).
  const [textareaNode, setTextareaNode] = React.useState<HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    if (!isMultiline) {
      setTextareaNode(null);
      return;
    }
    const el = ref.current;
    setTextareaNode(el instanceof HTMLTextAreaElement ? el : null);
    return () => setTextareaNode(null);
  }, [isMultiline]); // eslint-disable-line react-hooks/exhaustive-deps

  useTextareaAutosize(textareaNode, autosize, minRows, maxRows, value);

  // Every handler keeps a STABLE identity (latest-closure pattern): the field
  // re-renders on every keystroke, and fresh listener props would re-bind the
  // host's listeners each time.
  const focusInput = useCallbackRef(() => {
    if (!disabled) {
      ref.current?.focus();
    }
  });

  const handleFocus = useCallbackRef((e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    onFocus?.(e);
  });

  const handleBlur = useCallbackRef((e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    onBlur?.(e);
  });

  // Handle keyboard submit. For multiline inputs Enter inserts a newline, not a submit.
  const handleKeyDown = useCallbackRef((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSubmitEditing && !isMultiline) {
      onSubmitEditing({
        nativeEvent: { text: "value" in e.target ? String(e.target.value) : "" },
      });
    }
    onKeyDown?.(e);
  });

  // Handle change with onChangeText support
  const handleChange = useCallbackRef((e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeText?.("value" in e.target ? String(e.target.value) : "");
    onChange?.(e);
  });

  // After `size` so it beats the variant's `paddingHorizontal`; before `rest` so a
  // consumer-passed padding still wins. A shared constant (never allocates).
  const sectionInsets = getInputSectionInsets({
    leftSection,
    rightSection,
    loading,
    loadingPosition,
    __clearSection,
    __clearable,
    __clearSectionMode,
    __defaultRightSection,
  });

  // DOM-only attributes of the real element (the frame types only Tamagui/RN
  // props), passed as one bag.
  const domAttrs = {
    disabled,
    readOnly,
    id: inputId,
    required,
    "aria-invalid": withAria && inputError ? true : undefined,
    "aria-describedby": withAria ? wrapperContext?.describedBy : undefined,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onKeyDown: onSubmitEditing || onKeyDown ? handleKeyDown : undefined,
  };

  let host: React.ReactNode;
  if (hostTag === "button") {
    host = (
      <StyledButtonInput
        ref={composedRef as React.Ref<TamaguiElement>}
        size={effectiveSize}
        {...sectionInsets}
        {...(rest as object)}
        {...(domAttrs as object)}
        {...((rest as { type?: string }).type ? null : BUTTON_TYPE)}
      >
        {children}
      </StyledButtonInput>
    );
  } else {
    const Host = hostTag === "textarea" ? StyledTextareaInput : StyledInput;
    const textAttrs = {
      value,
      rows: rows ?? (isMultiline ? minRows : undefined),
      autoCorrect,
      autoCapitalize,
      onChange: onChangeText || onChange ? handleChange : undefined,
    };
    host = (
      <Host
        ref={composedRef as React.Ref<TamaguiElement>}
        flex={1}
        minWidth={0}
        size={effectiveSize}
        {...(hostTag === "select" ? SELECT_HOST : null)}
        {...sectionInsets}
        {...(rest as object)}
        {...(domAttrs as object)}
        {...(textAttrs as object)}
      >
        {hostTag === "select" ? children : null}
      </Host>
    );
  }

  return (
    <InputChrome
      size={effectiveSize}
      variant={unstyled ? "unstyled" : variant}
      radius={radius}
      error={inputError}
      disabled={disabled}
      pointer={pointer}
      focused={focused}
      multiline={isMultiline}
      onRootPress={focusInput}
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
      __defaultRightSection={__defaultRightSection}
    >
      {host}
    </InputChrome>
  );
});

export const Input = withStaticProperties(InputComponent, {
  Wrapper: InputWrapper,
  Chrome: InputChrome,
  Label: InputLabel,
  Error: InputError,
  Description: InputDescription,
  Placeholder: InputPlaceholder,
  ClearButton: InputClearButton,
});

export type InputProps = WebInputProps;
export type InputRef = HTMLInputElement & TamaguiElement;
