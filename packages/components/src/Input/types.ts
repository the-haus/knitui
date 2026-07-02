import type { TextStyle } from "@knitui/core";

import type { SlotStyles } from "../internal/styles";
import type {
  InputRootFrameProps,
  InputRootRef,
  InputSectionFrameProps,
  InputSectionPointerEvents,
  InputSize,
  InputVariant,
  InputWrapperProps,
  InputWrapperSlots,
} from "./shared";

/**
 * Extra props that Input adds on top of the base styled component.
 * Used with .styleable<InputExtraProps>() - the Styleable merge
 * Consumer-facing InputProps is derived via GetProps<typeof Input>.
 *
 * Per docs/component-specification.md, input-family components do NOT expose
 * placeholder/selection/caret color props, `withErrorStyles`, or the Mantine
 * styles-API passthrough (classNames/styles/vars/mod/attributes/…). Styling is
 * otherwise fixed through the `styled(...)` host config + theme tokens. The
 * text-layout props below (`textAlign`, font props, …) are intentionally kept:
 * components like `PinInput` need them, and they resolve cross-platform (web
 * forwards them to the host element, native resolves them through Tamagui's
 * style internals onto the bare TextInput).
 */

// Text-layout/typography props supported by the underlying input hosts.
// TextStyle gives these props theme-enhanced token types.
type InputTextStyleProps = Pick<
  TextStyle,
  | "color"
  | "fontFamily"
  | "fontSize"
  | "fontStyle"
  | "fontWeight"
  | "letterSpacing"
  | "textAlign"
  | "textTransform"
>;

export type InputValueChangePayload = {
  target: { value: string };
  currentTarget: { value: string };
  type: "change";
};

export type InputValueInputPayload = {
  target: { value: string };
  currentTarget: { value: string };
  type: "input";
};

export type InputKeyDownPayload = {
  key: string;
  type: "keydown";
  /**
   * No-op on native so consumers (Autocomplete, Select, etc.) can call it
   * unconditionally. On web the host forwards the real KeyboardEvent, whose
   * `preventDefault` does the actual work.
   */
  preventDefault: () => void;
  /** No-op on native; real on the web KeyboardEvent. */
  stopPropagation: () => void;
};

/** Native text-edit event (`onSubmitEditing` / `onEndEditing`). */
export type InputTextEventPayload = { nativeEvent: { text: string } };

/** Native selection-change event. */
export type InputSelectionChangePayload = {
  nativeEvent: { selection: { start: number; end: number } };
};

/** Native content-size-change event (multiline autosize). */
export type InputContentSizeChangePayload = {
  nativeEvent: { contentSize: { width: number; height: number } };
};

/** Native scroll event (multiline). */
export type InputScrollPayload = { nativeEvent: { contentOffset: { x: number; y: number } } };

/** Native key-press event, fired before `onChange`. */
export type InputKeyPressPayload = { nativeEvent: { key: string } };

/**
 * The single, unified callback surface for every Input-family component. Every
 * payload type is declared exactly once here; each platform host then exposes a
 * subset via `Pick<InputCallbacks, …>` (cross-platform callbacks land on
 * `InputSharedProps`, native-only ones on `InputNativeProps`). This keeps the
 * callback API and its payload types from drifting between web and native.
 */
export interface InputCallbacks {
  /** Web-style change event with a normalized `{ value }` target. */
  onChange?: (event: InputValueChangePayload) => void;

  /** Web-style input event with a normalized `{ value }` target. */
  onInput?: (event: InputValueInputPayload) => void;

  /** Normalized key-down event (Backspace, Enter, and printable keys). */
  onKeyDown?: (event: InputKeyDownPayload) => void;

  /** Fires on every change with just the string value. */
  onChangeText?: (text: string) => void;

  /** Fires when Enter/Return is pressed. */
  onSubmitEditing?: (event: InputTextEventPayload) => void;

  /** Fires when the text selection changes. */
  onSelectionChange?: (event: InputSelectionChangePayload) => void;

  /**
   * Fires when text input ends.
   * @platform native
   */
  onEndEditing?: (event: InputTextEventPayload) => void;

  /**
   * Fires when the content size changes. Only for multiline inputs.
   * @platform native
   */
  onContentSizeChange?: (event: InputContentSizeChangePayload) => void;

  /**
   * Invoked on content scroll. Only works with `multiline`.
   * @platform native
   */
  onScroll?: (event: InputScrollPayload) => void;

  /**
   * Fires when a key is pressed, before `onChange`. On Android only soft-keyboard
   * input is reported.
   * @platform native
   */
  onKeyPress?: (event: InputKeyPressPayload) => void;
}

/** Cross-platform callbacks exposed on every Input host. */
export type InputSharedCallbacks = Pick<
  InputCallbacks,
  "onChange" | "onInput" | "onKeyDown" | "onChangeText" | "onSubmitEditing" | "onSelectionChange"
>;

/** Native-only callbacks exposed on the React Native Input host. */
export type InputNativeCallbacks = Pick<
  InputCallbacks,
  "onEndEditing" | "onContentSizeChange" | "onScroll" | "onKeyPress"
>;

export interface __InputProps {
  /** Content section displayed on the left side of the input */
  leftSection?: React.ReactNode;

  /** Left section width, by default equals to the input height */
  leftSectionWidth?: InputSectionFrameProps["width"];

  /** Props passed down to the left section element */
  leftSectionProps?: Partial<InputSectionFrameProps>;

  /** Sets pointer-events styles on the left section element @default "none" */
  leftSectionPointerEvents?: InputSectionPointerEvents;

  /** Content section displayed on the right side of the input */
  rightSection?: React.ReactNode;

  /** Right section width, by default equals to the input height */
  rightSectionWidth?: InputSectionFrameProps["width"];

  /** Props passed down to the right section element */
  rightSectionProps?: Partial<InputSectionFrameProps>;

  /** Sets pointer-events styles on the right section element @default "none" */
  rightSectionPointerEvents?: InputSectionPointerEvents;

  /** Key of theme radius or a valid CSS value to set border-radius */
  radius?: string | number;

  /** Controls input height, horizontal padding, and font-size @default "sm" */
  size?: InputSize;

  /** Visual variant @default "default" */
  variant?: InputVariant;

  /** Removes the host chrome so the input renders bare (used by composite inputs). */
  unstyled?: boolean;

  /** Determines whether the input should have cursor: pointer style */
  pointer?: boolean;

  /** Host size attribute for the input element */
  inputSize?: string;

  /** Section to display when the input is clearable and rightSection is not defined */
  __clearSection?: React.ReactNode;

  /** Determines whether __clearSection should be displayed */
  __clearable?: boolean;

  /** Determines how clear button and rightSection are rendered */
  __clearSectionMode?: "clear" | "default" | "rightSection" | "both";

  /** Right section displayed when clearSection and rightSection are not defined */
  __defaultRightSection?: React.ReactNode;

  /** Displays loading indicator in the left or right section */
  loading?: boolean;

  /** Position of the loading indicator @default "right" */
  loadingPosition?: "left" | "right";
}

export interface __BaseInputProps extends InputWrapperProps, __InputProps {
  /**
   * @deprecated Use `styles={{ root }}` instead. Props passed down to the input root
   * wrapper element; merges OVER the `root` slot.
   */
  wrapperProps?: Partial<InputRootFrameProps>;
}

export type InputSharedProps = __InputProps &
  InputTextStyleProps &
  InputSharedCallbacks & {
    /** Determines whether the input should have error styles and aria-invalid attribute */
    error?: React.ReactNode;

    /** Adjusts padding and sizing calculations for multiline inputs */
    multiline?: boolean;

    /** Determines whether accessibility attributes should be added @default true */
    withAria?: boolean;

    /**
     * @deprecated Use `styles={{ root }}` instead. Props passed down to the root
     * element (`InputRootFrame`) of the Input component; merges OVER the `root` slot.
     */
    wrapperProps?: Partial<InputRootFrameProps>;

    /**
     * Uniform per-slot style passthrough — sugar over the composable parts. The
     * `Input` host consumes the adornment slots (`root`/`leftSection`/`rightSection`);
     * the field-chrome slots (`wrapper`/`label`/`description`/`error`/`required`) are
     * consumed by `Input.Wrapper`. Forwarding the same map to both is safe — each
     * applies only the slots it owns.
     */
    styles?: SlotStyles<InputWrapperSlots>;

    /** Root element ref */
    rootRef?: React.Ref<InputRootRef>;

    /**
     * Controls automatic spelling correction.
     *
     * Cross-platform values:
     * - `true` or `'on'` - Enable auto-correction
     * - `false` or `'off'` - Disable auto-correction
     *
     * @example
     * ```tsx
     * <Input autoCorrect={false} />
     * <Input autoCorrect="off" />
     * ```
     */
    autoCorrect?: boolean | "on" | "off";

    /**
     * Controls automatic text capitalization.
     *
     * Native values (work on all platforms):
     * - `'none'` - No automatic capitalization
     * - `'sentences'` - Capitalize first letter of sentences
     * - `'words'` - Capitalize first letter of each word
     * - `'characters'` - Capitalize all characters
     *
     * String compatibility values:
     * - `'off'` - Maps to `'none'` on native
     * - `'on'` - Maps to `'sentences'` on native
     *
     * @example
     * ```tsx
     * <Input autoCapitalize="none" />
     * <Input autoCapitalize="words" />
     * ```
     */
    autoCapitalize?: "none" | "sentences" | "words" | "characters" | "off" | "on";

    /**
     * Controls spell checking.
     */
    spellCheck?: boolean;

    value?: string | number | readonly string[];
    defaultValue?: string | number | readonly string[];
    type?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    id?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
    name?: string;
    pattern?: string;
    min?: string | number;
    max?: string | number;
    minLength?: number;
    maxLength?: number;
    multiple?: boolean;
    step?: string | number;
    placeholder?: string;

    /**
     * Rows for textarea (when render="textarea")
     */
    rows?: number;

    /**
     * Grows with content on web (scrollHeight-based); tracks onContentSizeChange on native.
     * @default false
     */
    autosize?: boolean;

    /**
     * Minimum number of rows. Sets initial/minimum height on web; maps to numberOfLines on native.
     */
    minRows?: number;

    /**
     * Maximum number of rows before scrolling (web). Caps height on native when autosize is on.
     */
    maxRows?: number;

    /**
     * Selection range
     */
    selection?: { start: number; end?: number };

    /**
     * Text content type for iOS autofill.
     * Use `autoComplete` where available.
     * @platform ios
     */
    textContentType?: InputTextContentType;
  };

export type InputExtraProps = InputSharedProps;

/**
 * iOS text content types for autofill
 */
export type InputTextContentType =
  | "none"
  | "URL"
  | "addressCity"
  | "addressCityAndState"
  | "addressState"
  | "countryName"
  | "creditCardNumber"
  | "creditCardExpiration"
  | "creditCardExpirationMonth"
  | "creditCardExpirationYear"
  | "creditCardSecurityCode"
  | "creditCardType"
  | "creditCardName"
  | "creditCardGivenName"
  | "creditCardMiddleName"
  | "creditCardFamilyName"
  | "emailAddress"
  | "familyName"
  | "fullStreetAddress"
  | "givenName"
  | "jobTitle"
  | "location"
  | "middleName"
  | "name"
  | "namePrefix"
  | "nameSuffix"
  | "nickname"
  | "organizationName"
  | "postalCode"
  | "streetAddressLine1"
  | "streetAddressLine2"
  | "sublocality"
  | "telephoneNumber"
  | "username"
  | "password"
  | "newPassword"
  | "oneTimeCode"
  | "birthdate"
  | "birthdateDay"
  | "birthdateMonth"
  | "birthdateYear"
  | "cellularEID"
  | "cellularIMEI"
  | "dateTime"
  | "flightNumber"
  | "shipmentTrackingNumber";
