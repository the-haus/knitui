import React from "react";
import { type TextInputProps as RNTextInputProps, TextInput } from "react-native";

import {
  getLineHeight,
  registerFocusable,
  styled,
  useNativeInputRef,
  withStaticProperties,
} from "@knitui/core";
import { useCallbackRef } from "@knitui/hooks";

import { controlMetrics as M } from "../internal/control-metrics";
import { pick } from "../internal/styles";
import type { InputNativeProps } from "./InputNativeProps";
import {
  DEFAULT_PLACEHOLDER_COLOR,
  DEFAULT_SELECTION_COLOR,
  getTextareaPaddingVertical,
  INPUT_CHROME_SLOTS,
  InputChrome,
  InputClearButton,
  InputDescription,
  InputError,
  InputLabel,
  InputPlaceholder,
  InputWrapper,
  InputWrapperContext,
  registerInputFocusable,
  styledBody,
} from "./shared";
import type {
  InputKeyDownPayload,
  InputSharedProps,
  InputValueChangePayload,
  InputValueInputPayload,
} from "./types";

// The native host is `styled(TextInput, …)` rendered directly — the same
// pattern Tamagui's own `Input` uses. The wrapper-owned chrome (border, sections,
// states) lives in `InputChrome`; this host stays visually bare via `unstyled`.
// Styling flows through Tamagui's `styled()` internals (size/unstyled variants,
// tokens, the `accept` color mapping), and the underlying RN TextInput identity
// stays stable across renders, so the controlled input is state-safe.
const InputHostStyle = styled(TextInput, styledBody[0], styledBody[1]);

// Native key payloads have no DOM event to defer to; consumers still call
// `preventDefault`/`stopPropagation`, so hand them a no-op.
const noop = () => {};

type NativeKeyPressEvent = Parameters<NonNullable<RNTextInputProps["onKeyPress"]>>[0];
type NativeSubmitEvent = Parameters<NonNullable<RNTextInputProps["onSubmitEditing"]>>[0];
type NativeSelectionEvent = Parameters<NonNullable<RNTextInputProps["onSelectionChange"]>>[0];
type NativeContentSizeEvent = Parameters<NonNullable<RNTextInputProps["onContentSizeChange"]>>[0];
type NativeFocusEvent = Parameters<NonNullable<RNTextInputProps["onFocus"]>>[0];
type NativeBlurEvent = Parameters<NonNullable<RNTextInputProps["onBlur"]>>[0];
type NativeChangeKey = NativeKeyPressEvent["nativeEvent"]["key"];
type OverlappingNativeProps = "autoCorrect" | "autoCapitalize" | "spellCheck";
type NativeInputProps = InputSharedProps &
  Omit<InputNativeProps, OverlappingNativeProps> & {
    dirname?: string;
  };
// The host is a bare RN TextInput. Keep the prop object constrained to RN's
// TextInput surface plus Tamagui v2's normalized ARIA state props.
type NativeInputHostProps = RNTextInputProps & {
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

// One text row's height in px, resolved from the FONT CONFIG (not hand-tuned
// numbers): each size maps to the same `fontSize` token the host renders (via the
// canonical `controlMetrics` table, which clamps xxs/xs to the 12px font), and
// `getLineHeight` returns exactly the line height Tamagui derives for that token
// (`round(fontSize * ratio)`). So row-count → pixel-height math for `minRows` /
// `maxRows` always matches the rendered line height and tracks any font retune.
const NATIVE_LINE_HEIGHT_SIZE_KEYS = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const getNativeLineHeight = (size: InputSharedProps["size"]) => {
  if (typeof size === "number") return getLineHeight(size);
  const key = (NATIVE_LINE_HEIGHT_SIZE_KEYS as readonly string[]).includes(size as string)
    ? (size as (typeof NATIVE_LINE_HEIGHT_SIZE_KEYS)[number])
    : "md";
  return getLineHeight(M[key].fontSize);
};

/**
 * A cross-platform input component for React Native.
 * @see — Docs https://tamagui.dev/ui/inputs#input
 */
const InputComponent = InputHostStyle.styleable<NativeInputProps>((props, forwardedRef) => {
  const {
    // Cross-platform props we need to convert
    type,
    disabled,
    readOnly,
    id,
    error,
    required,
    size = "md",
    variant = "default",
    radius,
    pointer,
    withAria: _withAria = true,
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
    rows,
    autosize,
    minRows,
    maxRows,
    autoComplete,
    autoFocus,
    enterKeyHint,
    value,
    defaultValue,

    // Callbacks
    onChange,
    onInput,
    onKeyDown,
    onChangeText,
    onSubmitEditing,
    onSelectionChange,
    onEndEditing,
    onContentSizeChange,
    onFocus,
    onBlur,
    onScroll,
    onKeyPress: onKeyPressProp,
    onPress: onPressProp,
    selection,

    // Native-only props (pass through directly)
    keyboardAppearance,
    returnKeyType: returnKeyTypeProp,
    submitBehavior,
    blurOnSubmit,
    caretHidden,
    contextMenuHidden,
    selectTextOnFocus,
    secureTextEntry: secureTextEntryProp,
    maxFontSizeMultiplier,
    allowFontScaling,
    multiline: multilineProp,
    keyboardType: keyboardTypeProp,
    inputMode: inputModeProp,
    autoCapitalize: autoCapitalizeProp,
    autoCorrect: autoCorrectProp,
    autoFocusNative,
    textContentType,

    // iOS-only props
    clearButtonMode,
    clearTextOnFocus,
    enablesReturnKeyAutomatically,
    dataDetectorTypes,
    scrollEnabled,
    passwordRules,
    rejectResponderTermination,
    spellCheck,
    lineBreakStrategyIOS,
    lineBreakModeIOS,
    smartInsertDelete,
    inputAccessoryViewID,
    inputAccessoryViewButtonLabel,
    disableKeyboardShortcuts,

    // Android-only props
    importantForAutofill,
    disableFullscreenUI,
    inlineImageLeft,
    inlineImagePadding,
    returnKeyLabel,
    textBreakStrategy,
    textAlignVertical,
    verticalAlign,
    showSoftInputOnFocus,
    numberOfLines: numberOfLinesProp,

    // Host props to filter out on native
    dirname: _dirname,
    min: _min,
    max: _max,
    minLength: _minLength,
    multiple: _multiple,
    name: _name,
    pattern: _pattern,
    step: _step,
    render,

    // Removes the host chrome so the input renders bare (composite inputs).
    unstyled,

    ...rest
  } = props;

  const { ref, composedRef } = useNativeInputRef(forwardedRef);
  const [focused, setFocused] = React.useState(false);
  const wrapperContext = React.useContext(InputWrapperContext);
  const inputId = wrapperContext?.inputId || id;
  const inputError = error ?? wrapperContext?.error;
  const effectiveSize = size || wrapperContext?.size || "md";

  void inputSize;
  void required;
  // Destructured purely to keep it out of `rest` (and thus off the host) — it is
  // not a valid TextInput prop, so it must never leak onto the native element.
  void inputAccessoryViewButtonLabel;

  // Convert string input `type` to native keyboard props, but only when the
  // explicit native props weren't set. Memoized so a keystroke-driven re-render
  // doesn't rebuild the switch or hand the host a fresh value object.
  const { secureTextEntry, keyboardType, inputMode } = React.useMemo(() => {
    if (secureTextEntryProp || keyboardTypeProp || inputModeProp) {
      return {
        secureTextEntry: secureTextEntryProp ?? false,
        keyboardType: keyboardTypeProp ?? ("default" as RNTextInputProps["keyboardType"]),
        inputMode: inputModeProp,
      };
    }
    switch (type) {
      case "password":
        return { secureTextEntry: true, keyboardType: "default" as const, inputMode: undefined };
      case "email":
        return {
          secureTextEntry: false,
          keyboardType: "email-address" as const,
          inputMode: "email" as const,
        };
      case "tel":
        return {
          secureTextEntry: false,
          keyboardType: "phone-pad" as const,
          inputMode: "tel" as const,
        };
      case "number":
        return {
          secureTextEntry: false,
          keyboardType: "numeric" as const,
          inputMode: "numeric" as const,
        };
      case "url":
        return { secureTextEntry: false, keyboardType: "url" as const, inputMode: "url" as const };
      case "search":
        return {
          secureTextEntry: false,
          keyboardType: "default" as const,
          inputMode: "search" as const,
        };
      default:
        return { secureTextEntry: false, keyboardType: "default" as const, inputMode: undefined };
    }
  }, [type, secureTextEntryProp, keyboardTypeProp, inputModeProp]);

  // Use explicit returnKeyType if provided, otherwise convert enterKeyHint.
  const returnKeyType = React.useMemo<RNTextInputProps["returnKeyType"]>(() => {
    if (returnKeyTypeProp) return returnKeyTypeProp;
    switch (enterKeyHint) {
      case "done":
        return "done";
      case "go":
        return "go";
      case "next":
        return "next";
      case "search":
        return "search";
      case "send":
        return "send";
      default:
        return undefined;
    }
  }, [returnKeyTypeProp, enterKeyHint]);

  const multiline = multilineProp ?? (render === "textarea" || !!(rows && rows > 1));
  // Multiline height is controlled entirely via style (minHeight/maxHeight bounds
  // below) on BOTH platforms, so DON'T auto-derive `numberOfLines` from
  // `rows`/`minRows`: on Android `numberOfLines` calls `EditText.setLines()`, which
  // pins the line count and fights the style height (iOS ignores it for multiline)
  // — that conflict makes a "fixed N rows" textarea render broken on Android while
  // working on iOS. Only forward an explicitly consumer-provided value.
  const numberOfLines = numberOfLinesProp;

  // Row counts → pixel bounds via the per-size font line height. The multiline host
  // is sized with minHeight/maxHeight ONLY (never an explicit `height`), letting the
  // native TextInput size itself to its content between those bounds — the reliable
  // cross-platform approach. Driving `height` from `onContentSizeChange` instead
  // collapses/oscillates on Android, because the reported contentSize feeds back
  // into the height we set (iOS tolerates it, which is why it only broke on Android).
  //   • autosize   → grow from minRows (minHeight) up to maxRows (maxHeight), then scroll
  //   • fixed rows → pinned to minRows (minHeight === maxHeight); content scrolls
  const { multilineMinHeight, multilineMaxHeight } = React.useMemo(() => {
    if (!multiline) return { multilineMinHeight: undefined, multilineMaxHeight: undefined };
    const lineHeight = getNativeLineHeight(effectiveSize);
    // React Native uses the border-box model, so the host's vertical padding is
    // SUBTRACTED from minHeight/maxHeight to get the text area. Add it back (top +
    // bottom) so `minRows`/`maxRows` count FULL text lines — matching the web
    // autosize hook, which likewise adds the padding to its row-count height.
    // Without this a 2-row field's padding eats into the rows and shows ~1 line.
    const chrome = getTextareaPaddingVertical(effectiveSize) * 2;
    const minH = typeof minRows === "number" ? lineHeight * minRows + chrome : undefined;
    const maxH = typeof maxRows === "number" ? lineHeight * maxRows + chrome : undefined;
    return {
      multilineMinHeight: minH,
      // Autosize caps at maxRows (unbounded when maxRows is unset). A non-autosize
      // field with a row count is FIXED to that height and scrolls its overflow.
      multilineMaxHeight: autosize ? maxH : minH,
    };
  }, [multiline, effectiveSize, minRows, maxRows, autosize]);

  // Normalize the string `autoCorrect`/`autoCapitalize` props to native values.
  const autoCorrect =
    autoCorrectProp === "on" ? true : autoCorrectProp === "off" ? false : autoCorrectProp;
  const autoCapitalize =
    autoCapitalizeProp === "on"
      ? "sentences"
      : autoCapitalizeProp === "off"
        ? "none"
        : autoCapitalizeProp;

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

  // Every handler below is wrapped in `useCallbackRef`: a stable identity that
  // always invokes the latest closure. The native `TextInput` therefore keeps the
  // SAME listener props across every keystroke-driven re-render, so the controlled
  // value stays state-safe and PinInput's memoized per-field props never churn.
  const focusInput = useCallbackRef(() => {
    if (!disabled) {
      ref.current?.focus();
    }
  });

  // Bridge cross-platform onChange/onInput callbacks to native onChangeText.
  const handleChangeText = useCallbackRef((text: string) => {
    onChangeText?.(text);
    onChange?.({
      target: { value: text },
      currentTarget: { value: text },
      type: "change",
    } satisfies InputValueChangePayload);
    onInput?.({
      target: { value: text },
      currentTarget: { value: text },
      type: "input",
    } satisfies InputValueInputPayload);
  });

  // Bridge onKeyDown via onKeyPress for Backspace + printable keys. Enter is
  // emitted ONLY from onSubmitEditing — emitting it here too would fire onKeyDown
  // twice for a single return press (one keypress + one submit).
  const handleKeyPress = useCallbackRef((e: NativeKeyPressEvent) => {
    onKeyPressProp?.(e);
    if (!onKeyDown) return;
    const key: NativeChangeKey = e.nativeEvent.key;
    // RN reports named keys ("Enter"/"Backspace") and the literal typed character
    // (length 1, including " "). Anything else is a non-text key we don't bridge.
    if (key === "Backspace" || key.length === 1) {
      onKeyDown({
        key,
        type: "keydown",
        preventDefault: noop,
        stopPropagation: noop,
      } satisfies InputKeyDownPayload);
    }
  });

  const handleSubmitEditing = useCallbackRef((e: NativeSubmitEvent) => {
    onKeyDown?.({
      key: "Enter",
      type: "keydown",
      preventDefault: noop,
      stopPropagation: noop,
    } satisfies InputKeyDownPayload);
    onSubmitEditing?.(e);
  });

  const handleSelectionChange = useCallbackRef((e: NativeSelectionEvent) => {
    onSelectionChange?.(e);
  });

  // Pure passthrough — height is no longer derived from content size (see the
  // multilineMinHeight/multilineMaxHeight note above).
  const handleContentSizeChange = useCallbackRef((e: NativeContentSizeEvent) => {
    onContentSizeChange?.(e);
  });

  const handleFocus = useCallbackRef((e: NativeFocusEvent) => {
    setFocused(true);
    onFocus?.(e);
  });

  const handleBlur = useCallbackRef((e: NativeBlurEvent) => {
    setFocused(false);
    onBlur?.(e);
  });

  // Press-trigger mode: a readOnly input used as a press target (the picker
  // trigger pattern — `Popover.Target` clones an `onPress` onto the field) can't
  // take its press on the TextInput host. Android maps `editable={false}` to
  // `setEnabled(false)`, and RN demotes a disabled view's pointer events to
  // `box-none` (`TouchTargetHelper`), so the host can never be the touch target
  // and the press would silently never fire there. Route the press to the root
  // frame instead (a plain View, always pressable) and make the host transparent
  // to touches so the whole field is one uniform tap target on both platforms.
  const isPressTrigger = !!readOnly && !disabled && typeof onPressProp === "function";

  const handleRootPress = useCallbackRef((event: unknown) => {
    focusInput();
    if (isPressTrigger) {
      (onPressProp as (e: unknown) => void)(event);
    }
  });

  const nativeInputProps: NativeInputHostProps = {
    editable: !disabled && !readOnly,
    value: value == null ? undefined : String(value),
    defaultValue: defaultValue == null ? undefined : String(defaultValue),
    secureTextEntry,
    keyboardType,
    keyboardAppearance,
    inputMode,
    returnKeyType,
    multiline,
    numberOfLines,
    selection,
    autoComplete: autoComplete as RNTextInputProps["autoComplete"],
    autoFocus: autoFocusNative ?? autoFocus,
    "aria-disabled": disabled || undefined,
    "aria-invalid": _withAria && inputError ? true : undefined,
    "aria-describedby": _withAria ? wrapperContext?.describedBy : undefined,

    // callbacks
    onChangeText: handleChangeText,
    onKeyPress: onKeyPressProp || onKeyDown ? handleKeyPress : undefined,
    onSubmitEditing: onKeyDown || onSubmitEditing ? handleSubmitEditing : undefined,
    onSelectionChange: onSelectionChange ? handleSelectionChange : undefined,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onEndEditing,
    onContentSizeChange: onContentSizeChange ? handleContentSizeChange : undefined,
    onScroll,

    // cross-platform native props
    submitBehavior,
    blurOnSubmit,
    caretHidden,
    contextMenuHidden,
    selectTextOnFocus,
    maxFontSizeMultiplier,
    allowFontScaling,
    autoCapitalize,
    autoCorrect,
    textContentType,

    // iOS-only props
    clearButtonMode,
    clearTextOnFocus,
    enablesReturnKeyAutomatically,
    dataDetectorTypes,
    scrollEnabled,
    passwordRules,
    rejectResponderTermination,
    spellCheck,
    lineBreakStrategyIOS,
    lineBreakModeIOS,
    smartInsertDelete,
    inputAccessoryViewID,
    // inputAccessoryViewButtonLabel is NOT a TextInput prop — never forwarded.
    disableKeyboardShortcuts,

    // Android-only props
    importantForAutofill,
    disableFullscreenUI,
    inlineImageLeft,
    inlineImagePadding,
    returnKeyLabel,
    textBreakStrategy,
    // Top-align multiline text by default so the explicit vertical padding is
    // measured from the top edge consistently (Android otherwise centers it). A
    // consumer-passed `textAlignVertical` still wins.
    textAlignVertical: textAlignVertical ?? (multiline ? "top" : undefined),
    verticalAlign,
    showSoftInputOnFocus,
  };

  return (
    <InputChrome
      size={effectiveSize}
      variant={unstyled ? "unstyled" : variant}
      radius={radius}
      error={inputError}
      disabled={disabled}
      pointer={pointer}
      focused={focused}
      multiline={multiline}
      onRootPress={handleRootPress}
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
      <InputHostStyle
        ref={composedRef}
        flex={1}
        // Single-line fills the chrome height; multiline sets NO explicit height and
        // is bounded by minHeight/maxHeight so the native TextInput sizes itself.
        height={multiline ? undefined : "100%"}
        minHeight={multilineMinHeight}
        maxHeight={multilineMaxHeight}
        minWidth={0}
        paddingVertical={multiline ? getTextareaPaddingVertical(effectiveSize) : 0}
        // Android's TextInput adds asymmetric font padding (extra space above
        // ascenders / below descenders) that iOS doesn't, making top/bottom look
        // uneven across platforms. Disabling it (no-op on iOS) lets the explicit
        // `paddingVertical` above be the single source of vertical inset on both.
        includeFontPadding={false}
        unstyled
        size={effectiveSize}
        // The host always renders `unstyled`, so `defaultStyles.color` (the only
        // place the text color is set) never applies. Native `TextInput` doesn't
        // inherit color from ancestors the way web does, so without this the typed
        // text falls back to the platform default and ignores the theme. Set before
        // `{...rest}` so a consumer-passed `color` still wins.
        color="$color"
        placeholderTextColor={DEFAULT_PLACEHOLDER_COLOR}
        selectionColor={DEFAULT_SELECTION_COLOR}
        underlineColorAndroid="$transparent"
        // Trigger mode: the root frame owns the press (see `handleRootPress`);
        // otherwise forward the consumer's press to the host as before.
        onPress={isPressTrigger ? undefined : onPressProp}
        pointerEvents={isPressTrigger ? "none" : undefined}
        {...(rest as object)}
        {...(nativeInputProps as object)}
      />
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

export type InputProps = NativeInputProps;
export type InputRef = TextInput;
