import React from "react";

import {
  type GetProps,
  registerFocusable,
  styled,
  type TamaguiElement,
  useTheme,
  useWebRef,
  variableToString,
  withStaticProperties,
} from "@knitui/core";
import { useId } from "@knitui/hooks";

import { Box } from "../Box";
import { webCursor } from "../internal/style-props";
import { pick } from "../internal/styles";
import { Text } from "../Text";
import {
  DEFAULT_PLACEHOLDER_COLOR,
  DEFAULT_SELECTION_COLOR,
  INPUT_CHROME_SLOTS,
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
  styledBody,
  styledTextareaBody,
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

type WebInputProps = Omit<
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

const StyledInput = styled(Box, styledBody[0], styledBody[1]);
const StyledTextareaInput = styled(Box, styledTextareaBody[0], styledTextareaBody[1]);
const StyledButtonInput = styled(Text, {
  name: "InputButton",
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
  fontFamily: "$body",
  textAlign: "left",

  focusStyle: {
    outlineWidth: 0,
    outlineStyle: "none",
    borderWidth: 0,
    borderColor: "transparent",
    boxShadow: "none",
  },

  focusVisibleStyle: {
    outlineWidth: 0,
    outlineStyle: "none",
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
type StyledInputProps = GetProps<typeof StyledInput>;
type InputStyle = StyledInputProps["style"] & Record<`--${string}`, string | undefined>;

const resolveThemeColor = (theme: ReturnType<typeof useTheme>, color: string) => {
  const themeKey = color.startsWith("$") ? color.slice(1) : color;
  const themeValue = themeKey ? theme[themeKey as keyof typeof theme] : undefined;

  return themeValue ? variableToString(themeValue) : color;
};

const InputComponent = StyledInput.styleable<WebInputProps>((props, _forwardedRef) => {
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
    style,
    onBlur,
    onChange,
    onFocus,
    onInput,
    onKeyDown,
    children,

    multiline,
    component,
    autoCapitalize: autoCapitalizeProp,
    autoCorrect: autoCorrectProp,
    onScroll,
    spellCheck,
    textContentType,

    // Removes the host chrome so the input renders bare (composite inputs).
    unstyled,

    ...rest
  } = props;

  const { ref, composedRef } = useWebRef<WebInputElement>(_forwardedRef);
  const [focused, setFocused] = React.useState(false);
  const theme = useTheme();
  const wrapperContext = React.useContext(InputWrapperContext);
  const generatedInputId = useId(id);
  const inputId = wrapperContext?.inputId || generatedInputId;
  const inputError = error ?? wrapperContext?.error;
  const effectiveSize = size || wrapperContext?.size || "md";
  const isMultiline = multiline || (typeof rows === "number" && rows > 1);
  const inputTag = isMultiline ? "textarea" : "input";
  // A `component` override (e.g. NativeSelect's `"select"`, FileInput's `"button"`)
  // wins over the computed text-host tag; default path is unchanged.
  const hostTag = component ?? inputTag;

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

  // Handle selection changes
  React.useEffect(() => {
    if (!onSelectionChange) return;

    const node = ref.current;
    if (!node) return;

    const handleSelectionChange = () => {
      onSelectionChange({
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
  }, [onSelectionChange, ref]);

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

  const focusInput = React.useCallback(() => {
    if (!disabled) {
      ref.current?.focus();
    }
  }, [disabled, ref]);

  const handleFocus = (e: React.FocusEvent<WebInputElement>) => {
    setFocused(true);
    onFocus?.(e as React.FocusEvent<HTMLInputElement>);
  };

  const handleBlur = (e: React.FocusEvent<WebInputElement>) => {
    setFocused(false);
    onBlur?.(e as React.FocusEvent<HTMLInputElement>);
  };

  // Handle keyboard submit. For multiline inputs Enter inserts a newline, not a submit.
  const handleKeyDown = (e: React.KeyboardEvent<WebInputElement>) => {
    if (e.key === "Enter" && onSubmitEditing && !isMultiline) {
      onSubmitEditing({
        nativeEvent: { text: "value" in e.target ? String(e.target.value) : "" },
      });
    }
    onKeyDown?.(e as React.KeyboardEvent<HTMLInputElement>);
  };

  // Handle change with onChangeText support
  const handleChange = (e: React.ChangeEvent<WebInputElement>) => {
    onChangeText?.("value" in e.target ? String(e.target.value) : "");
    onChange?.(e as React.ChangeEvent<HTMLInputElement>);
  };

  const incomingStyle =
    style && typeof style === "object" && !Array.isArray(style) ? style : undefined;
  const inputStyle: InputStyle = {
    ...(incomingStyle as object),
    "--t_placeholderColor": resolveThemeColor(theme, DEFAULT_PLACEHOLDER_COLOR),
    "--t_selectionColor": resolveThemeColor(theme, DEFAULT_SELECTION_COLOR),
  };

  const inputHostProps = {
    ...rest,
    disabled,
    readOnly,
    id: inputId,
    value,
    rows: rows ?? (isMultiline ? minRows : undefined),
    autoCorrect,
    autoCapitalize,
    spellCheck,
    required,
    "aria-invalid": withAria && inputError ? true : undefined,
    "aria-describedby": withAria ? wrapperContext?.describedBy : undefined,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onScroll,
    onInput,
    onKeyDown: onSubmitEditing || onKeyDown ? handleKeyDown : undefined,
    onChange: onChangeText || onChange ? handleChange : undefined,
    style: inputStyle,
  };
  const restWithButtonType = rest as { type?: string };
  const buttonHostProps = {
    ...rest,
    disabled,
    id: inputId,
    type: restWithButtonType.type ?? "button",
    required,
    "aria-invalid": withAria && inputError ? true : undefined,
    "aria-describedby": withAria ? wrapperContext?.describedBy : undefined,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onKeyDown: onSubmitEditing || onKeyDown ? handleKeyDown : undefined,
    style: inputStyle,
  };
  const sharedInputProps = {
    ref: composedRef as React.Ref<TamaguiElement>,
    flex: 1,
    minWidth: 0,
    unstyled: true,
    size: effectiveSize,
    ...(inputHostProps as object),
  };
  const styledInput =
    hostTag === "button" ? (
      <StyledButtonInput
        ref={composedRef as React.Ref<TamaguiElement>}
        size={effectiveSize}
        {...(buttonHostProps as object)}
      >
        {children}
      </StyledButtonInput>
    ) : hostTag === "select" ? (
      <StyledInput render={hostTag} {...sharedInputProps}>
        {children}
      </StyledInput>
    ) : isMultiline ? (
      <StyledTextareaInput {...sharedInputProps} />
    ) : (
      <StyledInput {...sharedInputProps} />
    );

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
      {styledInput}
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
