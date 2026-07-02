import * as React from "react";

import type { GetProps, TamaguiElement } from "@knitui/core";
import { getLineHeight, getTokenValue, styled, Theme } from "@knitui/core";
import { useId } from "@knitui/hooks";

import { Box } from "../Box";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
import { controlIconSize } from "../internal/control-icon-size";
import { controlMetrics as M } from "../internal/control-metrics";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import {
  fieldHeightVariant,
  fontSizePassthroughVariant,
  radiusVariant,
  type SizeKey,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Loader } from "../Loader";
import { Text } from "../Text";

export const defaultStyles = {
  size: "$true",
  fontFamily: "$body",
  borderWidth: 1,
  outlineWidth: 0,
  color: "$color",

  tabIndex: 0 as const,

  borderColor: "$borderColor",
  backgroundColor: "$background",

  // this fixes a flex bug where it overflows container
  minWidth: 0,

  hoverStyle: {
    borderColor: "$borderColorHover",
  },

  focusStyle: {
    borderColor: "$borderColorFocus",
  },

  focusVisibleStyle: {
    outlineColor: "$outlineColor",
    outlineWidth: 2,
    outlineStyle: "solid",
  },
} as const;

export const INPUT_NAME = "Input";
export const DEFAULT_PLACEHOLDER_COLOR = "$color8";
// Tamagui emits `.is_Input::selection { background-color: var(--t_selectionColor) }`
// with no fallback. If we never set the var, the value is invalid at
// computed-value time and `background-color` resolves to its initial value
// (`transparent`) — making the selection highlight invisible on web. So we
// always provide a visible default, the same way we do for the placeholder.
export const DEFAULT_SELECTION_COLOR = "$blue5";

type InputTokenSize = SizeKey;
type InputLegacyHostSize = "xs" | "sm" | "md" | "lg" | "xl";

export type InputSize = InputTokenSize | (string & {});
export type InputVariant = "default" | "filled" | "unstyled";
export type InputSectionPointerEvents = "none" | "all";

type InputFocusable = {
  focus: () => void;
  focusAndSelect?: () => void;
};

const inputFocusables = new Map<string, InputFocusable>();

export const registerInputFocusable = (id: string, input: InputFocusable) => {
  inputFocusables.set(id, input);

  return () => {
    if (inputFocusables.get(id) === input) {
      inputFocusables.delete(id);
    }
  };
};

const focusInputById = (id: string | undefined) => {
  if (id) {
    inputFocusables.get(id)?.focus();
  }
};

const INPUT_SIZE_KEYS: readonly InputTokenSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

const isInputSize = (value: unknown): value is InputTokenSize =>
  typeof value === "string" && INPUT_SIZE_KEYS.includes(value as InputTokenSize);

// Square sections (left/right adornments) match the control height, resolved
// directly from the canonical `controlMetrics` table (`M[key].height`) — the SAME
// scale Button/ActionIcon read — so a `md` Input and a `md` Button are both 40px
// tall. A custom (non-token) size is passed through verbatim so the section stays
// square.

// The input root frame's per-size HEIGHT comes from the shared `fieldHeightVariant`
// (in internal/style-props.ts, derived from the same canonical control heights).
// It lives there rather than here to avoid a circular type reference: the styled
// frame's `size` variant would otherwise depend on the frame's own props.

const toInputSizeToken = (size: InputSize | undefined): InputRootFrameProps["width"] => {
  if (!size) return M.md.height as InputRootFrameProps["width"];
  if (isInputSize(size)) return M[size].height as InputRootFrameProps["width"];
  return size as InputRootFrameProps["width"];
};

const toInputTokenSizeKey = (size: InputSize | undefined): InputTokenSize =>
  isInputSize(size) ? size : "md";

export const toInputSizeKey = (size: InputSize | undefined): InputLegacyHostSize => {
  const key = toInputTokenSizeKey(size);

  if (key === "xxs") return "xs";
  if (key === "xxl") return "xl";

  return key;
};

/**
 * Default corner rounding for every input frame — a SINGLE configurable default
 * (change it here to retune all inputs at once); the per-instance `radius` prop
 * overrides it. Replaces the old per-size radius that lived in the size variant.
 */
export const INPUT_DEFAULT_RADIUS = "$sm" as const;

// Horizontal text inset per size (space scale) — the gap between the typed text /
// placeholder and the field border (and any adornment section). Without it the
// text sits flush against the edge. Paired with the per-size fontSize so the host
// scales as one unit; the `:string`/`:number` catch-alls size font only.
// fontSize + horizontal inset come from the canonical `controlMetrics` table, so
// an input's text size and edge gap match a Button of the same key. The
// `:string`/`:number` catch-alls size font only (height is set separately from the
// token map above).
export const inputHostSizeVariant = {
  xxs: { fontSize: M.xxs.fontSize, paddingHorizontal: M.xxs.paddingHorizontal },
  xs: { fontSize: M.xs.fontSize, paddingHorizontal: M.xs.paddingHorizontal },
  sm: { fontSize: M.sm.fontSize, paddingHorizontal: M.sm.paddingHorizontal },
  md: { fontSize: M.md.fontSize, paddingHorizontal: M.md.paddingHorizontal },
  lg: { fontSize: M.lg.fontSize, paddingHorizontal: M.lg.paddingHorizontal },
  xl: { fontSize: M.xl.fontSize, paddingHorizontal: M.xl.paddingHorizontal },
  xxl: { fontSize: M.xxl.fontSize, paddingHorizontal: M.xxl.paddingHorizontal },
  ":string": fontSizePassthroughVariant[":string"],
  ":number": fontSizePassthroughVariant[":number"],
} as const;

// A textarea shares the single-line host's HORIZONTAL padding, font and height
// tokens (so the family scales as one unit), but its VERTICAL inset is its own
// concern: a multi-line field needs more symmetric top/bottom breathing room than
// a single-line field's `(height − lineHeight) / 2` centering gap (which reads as
// almost no padding). So the inset is a deliberate `$space` token ladder, peaking at
// `$sm` (12px) for the default `md` and stepping with size — the SINGLE source that
// feeds both the web size variant below (as a token string, resolved at the style
// layer) AND the native host, where `getTextareaPaddingVertical` resolves it to a px
// NUMBER at render via the token system and folds it into the row-height math so N
// rows renders as N full lines PLUS this inset on both platforms (see `Input.native.tsx`).
const TEXTAREA_INSET_TOKEN = {
  xxs: "$xs",
  xs: "$xs",
  sm: "$sm",
  md: "$sm",
  lg: "$sm",
  xl: "$md",
  xxl: "$md",
} as const satisfies Record<InputTokenSize, `$${string}`>;

export const getTextareaPaddingVertical = (size: InputSize | undefined): number => {
  const token = TEXTAREA_INSET_TOKEN[toInputTokenSizeKey(size)];
  const resolved = getTokenValue(token as Parameters<typeof getTokenValue>[0], "space");
  return typeof resolved === "number" ? resolved : 0;
};

// Same font + horizontal inset as the single-line host, plus the derived vertical
// inset above so a multiline field shares the single-line control's padding system.
//
// `lineHeight` is set EXPLICITLY per size and is load-bearing here (unlike the
// single-line host, where it doesn't matter): a textarea's rendered height is
// `rows × lineHeight + padding`, so line height — not font size — drives how the
// field grows. Without it Tamagui's font pairing resolves the SAME line height
// (the `md` step, 27px) for every `fontSize` token, so changing `size` only changed
// the text size while the box height stayed put — i.e. `size` looked ignored on web.
// The values match the native host's `getNativeLineHeight` (`round(fontSize × ratio)`
// off the same clamped per-size `fontSize`), so a textarea row is the same height on
// web, iOS and Android.
const textareaHostSizeVariant = {
  xxs: {
    fontSize: M.xxs.fontSize,
    lineHeight: getLineHeight(M.xxs.fontSize),
    paddingHorizontal: M.xxs.paddingHorizontal,
    paddingVertical: TEXTAREA_INSET_TOKEN.xxs,
  },
  xs: {
    fontSize: M.xs.fontSize,
    lineHeight: getLineHeight(M.xs.fontSize),
    paddingHorizontal: M.xs.paddingHorizontal,
    paddingVertical: TEXTAREA_INSET_TOKEN.xs,
  },
  sm: {
    fontSize: M.sm.fontSize,
    lineHeight: getLineHeight(M.sm.fontSize),
    paddingHorizontal: M.sm.paddingHorizontal,
    paddingVertical: TEXTAREA_INSET_TOKEN.sm,
  },
  md: {
    fontSize: M.md.fontSize,
    lineHeight: getLineHeight(M.md.fontSize),
    paddingHorizontal: M.md.paddingHorizontal,
    paddingVertical: TEXTAREA_INSET_TOKEN.md,
  },
  lg: {
    fontSize: M.lg.fontSize,
    lineHeight: getLineHeight(M.lg.fontSize),
    paddingHorizontal: M.lg.paddingHorizontal,
    paddingVertical: TEXTAREA_INSET_TOKEN.lg,
  },
  xl: {
    fontSize: M.xl.fontSize,
    lineHeight: getLineHeight(M.xl.fontSize),
    paddingHorizontal: M.xl.paddingHorizontal,
    paddingVertical: TEXTAREA_INSET_TOKEN.xl,
  },
  xxl: {
    fontSize: M.xxl.fontSize,
    lineHeight: getLineHeight(M.xxl.fontSize),
    paddingHorizontal: M.xxl.paddingHorizontal,
    paddingVertical: TEXTAREA_INSET_TOKEN.xxl,
  },
  ":string": fontSizePassthroughVariant[":string"],
  ":number": fontSizePassthroughVariant[":number"],
} as const;

// The loading `Loader` stands in for a section icon, so it takes the SAME
// canonical in-control icon px (`controlIconSize`) rather than the full input
// height — otherwise the ring nearly fills the field.
const toInputLoaderSize = (size: InputSize | undefined) =>
  controlIconSize(toInputTokenSizeKey(size));

export const InputRootFrame = styled(Box, {
  name: "InputRoot",
  flexDirection: "row",
  alignItems: "center",
  minWidth: 0,
  borderWidth: 1,
  borderColor: "$borderColor",
  backgroundColor: "$background",
  borderRadius: INPUT_DEFAULT_RADIUS,
  ...webCursor("text"),
  overflow: "hidden",

  variants: {
    size: fieldHeightVariant,
    radius: radiusVariant,
    variant: {
      default: {},
      filled: {
        backgroundColor: "$color2",
      },
      unstyled: {
        borderWidth: 0,
        backgroundColor: "transparent",
      },
    },
    focused: {
      true: {
        borderColor: "$borderColorFocus",
      },
    },
    // Error border stays red under every accent theme. `$red9` is a raw palette
    // token exposed on every theme via the base theme's `extra` (see
    // core/config/themes.ts), so it reads red without a hardcoded hex and
    // without theming the frame (which would tint the background and children).
    error: {
      true: {
        borderColor: "$red9",
      },
    },
    disabled: {
      true: {
        opacity: 0.6,
        pointerEvents: "none",
      },
    },
    pointer: {
      true: {
        ...webCursor("pointer"),
      },
    },
    multiline: {
      true: {
        alignItems: "flex-start",
        height: "auto",
      },
    },
  } as const,

  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export const InputSectionFrame = styled(Box, {
  name: "InputSection",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  alignSelf: "stretch",

  variants: {
    sectionPointerEvents: {
      none: {
        pointerEvents: "none",
      },
      all: {
        pointerEvents: "auto",
      },
    },
  } as const,
});

export type InputRootFrameProps = GetProps<typeof InputRootFrame>;
export type InputSectionFrameProps = GetProps<typeof InputSectionFrame>;

type InputClearSectionMode = "clear" | "default" | "rightSection" | "both";

/**
 * The adornment-layer subset of `InputWrapperSlots` that `InputChrome` owns and
 * applies (the field-chrome slots — `wrapper`/`label`/`description`/`error`/`required`
 * — are applied by `Input.Wrapper`, not here). `Input`/`InputBase` forward the same
 * `styles` map to both; each consumes only the slots it owns.
 */
export type InputChromeSlots = Pick<InputWrapperSlots, "root" | "leftSection" | "rightSection">;

export const INPUT_CHROME_SLOTS = [
  "root",
  "leftSection",
  "rightSection",
] as const satisfies readonly (keyof InputChromeSlots)[];

type InputChromeProps = {
  children: React.ReactNode;
  disabled?: boolean;
  error?: React.ReactNode;
  leftSection?: React.ReactNode;
  leftSectionPointerEvents?: InputSectionPointerEvents;
  /** @deprecated Use `styles={{ leftSection }}`. Merges OVER the `leftSection` slot. */
  leftSectionProps?: Partial<InputSectionFrameProps>;
  leftSectionWidth?: InputSectionFrameProps["width"];
  loading?: boolean;
  loadingPosition?: "left" | "right";
  multiline?: boolean;
  pointer?: boolean;
  radius?: string | number;
  rightSection?: React.ReactNode;
  rightSectionPointerEvents?: InputSectionPointerEvents;
  /** @deprecated Use `styles={{ rightSection }}`. Merges OVER the `rightSection` slot. */
  rightSectionProps?: Partial<InputSectionFrameProps>;
  rightSectionWidth?: InputSectionFrameProps["width"];
  rootRef?: React.Ref<InputRootRef>;
  size?: InputSize;
  focused?: boolean;
  onRootPress?: InputRootFrameProps["onPress"];
  variant?: InputVariant;
  /** @deprecated Use `styles={{ root }}`. Merges OVER the `root` slot. */
  wrapperProps?: Partial<InputRootFrameProps>;
  /**
   * Adornment-layer slots (`root`/`leftSection`/`rightSection`). Sugar under the
   * deprecated `wrapperProps`/`leftSectionProps`/`rightSectionProps` aliases.
   */
  styles?: SlotStyles<InputChromeSlots>;
  __clearSection?: React.ReactNode;
  __clearable?: boolean;
  __clearSectionMode?: InputClearSectionMode;
  __defaultRightSection?: React.ReactNode;
};

type SectionContentOptions = {
  loading?: boolean;
  loadingPosition?: "left" | "right";
  position: "left" | "right";
  section?: React.ReactNode;
  clearSection?: React.ReactNode;
  clearable?: boolean;
  clearSectionMode?: InputClearSectionMode;
  defaultSection?: React.ReactNode;
  size?: InputSize;
};

const getSectionContent = (options: SectionContentOptions) => {
  const {
    loading,
    loadingPosition,
    position,
    section,
    clearSection,
    clearable,
    clearSectionMode = "both",
    defaultSection,
    size,
  } = options;

  if (loading && loadingPosition === position) {
    return <Loader size={toInputLoaderSize(size)} />;
  }

  if (position === "right" && clearSectionMode === "rightSection") {
    return section ?? defaultSection ?? null;
  }

  if (position === "right" && clearable && clearSection && section) {
    if (clearSectionMode === "both") {
      return (
        <React.Fragment>
          {clearSection}
          {section}
        </React.Fragment>
      );
    }

    return clearSectionMode === "clear" ? clearSection : section;
  }

  if (position === "right" && clearable && clearSection && !section) {
    return clearSection;
  }

  return section ?? (position === "right" ? defaultSection : null);
};

const getSectionPointerEvents = (
  value: InputSectionPointerEvents,
): InputSectionFrameProps["sectionPointerEvents"] => (value === "all" ? "all" : "none");

export function InputChrome(props: InputChromeProps) {
  const {
    children,
    disabled,
    error,
    leftSection,
    leftSectionPointerEvents = "none",
    leftSectionProps,
    leftSectionWidth,
    loading = false,
    loadingPosition = "right",
    multiline,
    pointer,
    radius,
    rightSection,
    rightSectionPointerEvents = "none",
    rightSectionProps,
    rightSectionWidth,
    rootRef,
    size = "md",
    focused,
    onRootPress,
    variant = "default",
    wrapperProps,
    styles,
    __clearSection,
    __clearable,
    __clearSectionMode,
    __defaultRightSection,
  } = props;

  // Adornment slots are the LOWEST-precedence sugar; the deprecated
  // `wrapperProps`/`leftSectionProps`/`rightSectionProps` aliases merge OVER them
  // ("explicit beats sugar"), and the component's own controlled props win over both.
  const s = slotStyles<InputChromeSlots>(styles, INPUT_CHROME_SLOTS, "Input");
  const mergedLeftSectionProps = s.merge("leftSection", leftSectionProps);
  const mergedRightSectionProps = s.merge("rightSection", rightSectionProps);
  const { onPress: wrapperOnPress, ...rootProps } = s.merge("root", wrapperProps);

  const leftContent = getSectionContent({
    loading,
    loadingPosition,
    position: "left",
    section: leftSection,
    size,
  });
  const rightContent = getSectionContent({
    loading,
    loadingPosition,
    position: "right",
    section: rightSection,
    clearSection: __clearSection,
    clearable: __clearable,
    clearSectionMode: __clearSectionMode,
    defaultSection: __defaultRightSection,
    size,
  });
  const sectionWidth = toInputSizeToken(size);
  // In-control icon size from the canonical ladder; adornment icons take the
  // input's text color (`$color`) so a bare `<IconSearch/>` in `leftSection`
  // matches the typed text without the caller sizing/coloring it.
  const sectionIconSize: SizeKey = isInputSize(size) ? size : "md";
  const effectiveRightSectionPointerEvents =
    __clearable && __clearSection ? "all" : rightSectionPointerEvents;

  // Plain handler (InputChrome is a presentational wrapper that re-renders with
  // fresh children/section nodes anyway, so a stable identity buys nothing — and
  // keeping InputChrome hook-free avoids paying the rules-of-hooks cost here). The
  // `typeof === "function"` guards make it resilient to a consumer passing a
  // truthy non-function as `wrapperProps.onPress`/`onRootPress` — optional
  // chaining alone would still throw "not a function".
  const handleRootPress: InputRootFrameProps["onPress"] = (event) => {
    if (typeof wrapperOnPress === "function") wrapperOnPress(event);
    if (typeof onRootPress === "function") onRootPress(event);
  };

  return (
    <InputRootFrame
      // Consumer wrapperProps are spread FIRST so the component's own controlled
      // state (size/variant/error/disabled/focused/…, ref, and the press handler)
      // always wins and can never be overridden into an inconsistent state.
      {...rootProps}
      ref={rootRef}
      size={size}
      radius={radius as InputRootFrameProps["radius"]}
      variant={variant}
      error={!!error}
      disabled={disabled}
      pointer={pointer}
      focused={focused}
      multiline={multiline}
      onPress={disabled ? undefined : handleRootPress}
    >
      {leftContent ? (
        <InputSectionFrame
          width={leftSectionWidth ?? sectionWidth}
          sectionPointerEvents={getSectionPointerEvents(leftSectionPointerEvents)}
          {...mergedLeftSectionProps}
        >
          <ControlIconProvider size={sectionIconSize} color="$color">
            {leftContent}
          </ControlIconProvider>
        </InputSectionFrame>
      ) : null}

      {children}

      {rightContent ? (
        <InputSectionFrame
          width={rightSectionWidth ?? sectionWidth}
          sectionPointerEvents={getSectionPointerEvents(effectiveRightSectionPointerEvents)}
          {...mergedRightSectionProps}
        >
          <ControlIconProvider size={sectionIconSize} color="$color">
            {rightContent}
          </ControlIconProvider>
        </InputSectionFrame>
      ) : null}
    </InputRootFrame>
  );
}

export const InputWrapperFrame = styled(Box, {
  name: "InputWrapper",
  flexDirection: "column",
  minWidth: 0,
  gap: 4,
});

export const InputLabelFrame = styled(Text, {
  name: "InputLabel",
  color: "$color",
  fontWeight: "500",
  userSelect: "none",

  variants: {
    size: fontSizePassthroughVariant,
  } as const,

  defaultVariants: {
    size: "md",
  },
});

const InputMetaText = styled(Text, {
  color: "$color",
  opacity: 0.65,

  variants: {
    size: fontSizePassthroughVariant,
  } as const,

  defaultVariants: {
    size: "md",
  },
});

export const InputDescriptionFrame = styled(InputMetaText, {
  name: "InputDescription",
});

export const InputErrorFrame = styled(InputMetaText, {
  name: "InputError",
  opacity: 1,
  color: "$color9",
});

export const InputPlaceholderFrame = styled(Text, {
  name: "InputPlaceholder",
  color: "$color",
  opacity: 0.55,
});

export type InputWrapperOrderItem = "label" | "description" | "input" | "error";

export interface InputWrapperContextValue {
  inputId?: string;
  describedBy?: string;
  size?: InputSize;
  error?: React.ReactNode;
}

export const InputWrapperContext = React.createContext<InputWrapperContextValue | null>(null);

export interface InputLabelProps extends GetProps<typeof InputLabelFrame> {
  required?: boolean;
  labelElement?: "label" | "div";
  htmlFor?: string;
  /** Props for the required asterisk `Text` rendered after the label. */
  requiredProps?: Partial<GetProps<typeof Text>>;
}

type InputLabelMouseDownEvent = Parameters<
  NonNullable<GetProps<typeof InputLabelFrame>["onMouseDown"]>
>[0];

export const InputLabel = InputLabelFrame.styleable<InputLabelProps>(
  function InputLabel(props, ref) {
    const {
      children,
      required,
      labelElement = "label",
      htmlFor,
      onMouseDown,
      requiredProps,
      ...rest
    } = props;

    return (
      <InputLabelFrame
        ref={ref}
        render={labelElement}
        {...(labelElement === "label" ? { htmlFor } : {})}
        onMouseDown={(event: InputLabelMouseDownEvent) => {
          onMouseDown?.(event);
          if (!event.defaultPrevented && event.detail > 1) {
            event.preventDefault();
          }
        }}
        {...rest}
      >
        {children}
        {required ? (
          <Theme name="red">
            <Text aria-hidden color="$color" {...requiredProps}>
              {" *"}
            </Text>
          </Theme>
        ) : null}
      </InputLabelFrame>
    );
  },
);

export type InputDescriptionProps = GetProps<typeof InputDescriptionFrame>;

export const InputDescription = InputDescriptionFrame.styleable<InputDescriptionProps>(
  function InputDescription(props, ref) {
    return <InputDescriptionFrame ref={ref} render="p" {...props} />;
  },
);

export type InputErrorProps = GetProps<typeof InputErrorFrame>;

export const InputError = InputErrorFrame.styleable<InputErrorProps>(
  function InputError(props, ref) {
    return <InputErrorFrame ref={ref} render="p" {...props} theme={"red"} />;
  },
);

export interface InputPlaceholderProps extends GetProps<typeof InputPlaceholderFrame> {
  error?: React.ReactNode;
}

export const InputPlaceholder = InputPlaceholderFrame.styleable<InputPlaceholderProps>(
  function InputPlaceholder(props, ref) {
    const { error, ...rest } = props;
    return (
      <InputPlaceholderFrame
        ref={ref}
        color={error ? "$color10" : undefined}
        render="span"
        {...rest}
      />
    );
  },
);

export type InputClearButtonProps = CloseButtonProps;
export const InputClearButton = CloseButton;

/**
 * Slot → part-props map for the labeled-field chrome's uniform `styles` prop
 * (Pillar B / `internal/styles.ts`). Each key resolves to plain props spread onto
 * the matching styled part, so `styles` can never express anything the parts
 * can't. It is sugar layered on top of the still-supported per-part props
 * (`labelProps` / `descriptionProps` / `errorProps`); when both target the same
 * part the per-part prop wins (it is spread last).
 */
export interface InputWrapperSlots {
  /** The outer `InputWrapperFrame` column. */
  wrapper: Partial<GetProps<typeof InputWrapperFrame>>;
  /** The `Input.Label`. */
  label: Partial<InputLabelProps>;
  /** The `Input.Description`. */
  description: Partial<InputDescriptionProps>;
  /** The `Input.Error`. */
  error: Partial<InputErrorProps>;
  /** The required asterisk `Text` inside the label. */
  required: Partial<GetProps<typeof Text>>;
  /**
   * The input frame/container (`InputRootFrame`) that `InputChrome` lays the
   * control and its left/right sections out in. Applied by `Input`/`InputChrome`,
   * not by `Input.Wrapper`. The deprecated `wrapperProps` alias merges OVER this.
   */
  root: Partial<InputRootFrameProps>;
  /**
   * The left adornment section (`InputSectionFrame`). Applied by `InputChrome`.
   * The deprecated `leftSectionProps` alias merges OVER this.
   */
  leftSection: Partial<InputSectionFrameProps>;
  /**
   * The right adornment section (`InputSectionFrame`). Applied by `InputChrome`.
   * The deprecated `rightSectionProps` alias merges OVER this.
   */
  rightSection: Partial<InputSectionFrameProps>;
}

export const INPUT_WRAPPER_SLOTS = [
  "wrapper",
  "label",
  "description",
  "error",
  "required",
  "root",
  "leftSection",
  "rightSection",
] as const satisfies readonly (keyof InputWrapperSlots)[];

export interface InputWrapperProps extends GetProps<typeof InputWrapperFrame> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  withAsterisk?: boolean;
  labelProps?: InputLabelProps;
  descriptionProps?: InputDescriptionProps;
  errorProps?: InputErrorProps;
  /**
   * Uniform per-slot style passthrough — sugar over the composable parts. Slots:
   * `wrapper` / `label` / `description` / `error` / `required`.
   */
  styles?: SlotStyles<InputWrapperSlots>;
  inputContainer?: (children: React.ReactNode) => React.ReactNode;
  inputWrapperOrder?: InputWrapperOrderItem[];
  labelElement?: "label" | "div";
  id?: string;
  size?: InputSize;
}

export type InputRootRef = TamaguiElement;

export const InputWrapper = InputWrapperFrame.styleable<InputWrapperProps>(
  function InputWrapper(props, ref) {
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
      inputContainer = (children) => children,
      inputWrapperOrder = ["label", "description", "input", "error"],
      labelElement = "label",
      children,
      id,
      size = "md",
      ...rest
    } = props;

    // Uniform `styles` slots, distributed onto the parts below. Per-part props
    // (`labelProps`/`descriptionProps`/`errorProps`/`rest`) are spread AFTER the
    // slot props, so an explicit per-part prop always wins.
    const s = slotStyles<InputWrapperSlots>(styles, INPUT_WRAPPER_SLOTS, "Input.Wrapper");

    const idBase = useId(id);
    const inputId = idBase;
    const errorId = errorProps?.id || `${idBase}-error`;
    const descriptionId = descriptionProps?.id || `${idBase}-description`;
    const hasError = !!error && typeof error !== "boolean";
    const hasDescription = !!description;
    const describedBy =
      [hasDescription ? descriptionId : undefined, hasError ? errorId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;
    const isRequired = typeof withAsterisk === "boolean" ? withAsterisk : required;
    const { onPress: labelOnPress, ...restLabelProps } = labelProps ?? {};
    const handleLabelPress: NonNullable<InputLabelProps["onPress"]> = (event) => {
      labelOnPress?.(event);
      focusInputById(inputId);
    };

    const nodes: Record<InputWrapperOrderItem, React.ReactNode> = {
      label: label ? (
        <InputLabel
          key="label"
          htmlFor={inputId}
          required={isRequired}
          labelElement={labelElement}
          size={size}
          onPress={handleLabelPress}
          requiredProps={s.get("required")}
          {...s.merge("label", restLabelProps)}
        >
          {label}
        </InputLabel>
      ) : null,
      description: hasDescription ? (
        <InputDescription
          key="description"
          id={descriptionId}
          size={size}
          {...s.merge("description", descriptionProps)}
        >
          {description}
        </InputDescription>
      ) : null,
      input: <React.Fragment key="input">{inputContainer(children)}</React.Fragment>,
      error: hasError ? (
        <Theme key="error" name="red">
          <InputError id={errorId} size={size} {...s.merge("error", errorProps)}>
            {error}
          </InputError>
        </Theme>
      ) : null,
    };

    return (
      <InputWrapperContext.Provider value={{ inputId, describedBy, size, error }}>
        <InputWrapperFrame ref={ref} {...s.get("wrapper")} {...rest}>
          {inputWrapperOrder.map((part) => nodes[part])}
        </InputWrapperFrame>
      </InputWrapperContext.Provider>
    );
  },
);

export const styledTextareaBody = [
  {
    name: INPUT_NAME,
    render: "textarea",
    // Anchor the font family on the host itself (not only in `defaultStyles`).
    // The host is always rendered `unstyled`, so the `unstyled: { false: … }`
    // branch never runs — without a family here, a `fontSize` TOKEN (`"$md"`)
    // has no font scale to resolve against and the per-size font size is lost.
    // (The `button` host sets the same family inline for the same reason.)
    fontFamily: "$body",
    // Same reason: `defaultStyles.color` only applies in the never-run
    // `unstyled: { false: … }` branch, and a bare `<textarea>` doesn't inherit
    // `color` from ancestors — so the typed text would fall back to the browser
    // default and ignore the theme. A consumer-passed `color` prop still wins.
    color: "$color",
    variants: {
      unstyled: {
        true: {
          outlineWidth: 0,
          outlineStyle: "none" as const,
          outlineColor: "transparent",
          borderWidth: 0,
          borderColor: "transparent",
          backgroundColor: "transparent",
          boxShadow: "none",
          focusStyle: {
            outlineWidth: 0,
            outlineStyle: "none" as const,
            borderWidth: 0,
            borderColor: "transparent",
            boxShadow: "none",
          },
          focusVisibleStyle: {
            outlineWidth: 0,
            outlineStyle: "none" as const,
            borderWidth: 0,
            borderColor: "transparent",
            boxShadow: "none",
          },
        },
        false: defaultStyles,
      },
      size: textareaHostSizeVariant,
      disabled: {
        true: {},
      },
    } as const,
    defaultVariants: {
      unstyled: process.env.TAMAGUI_HEADLESS === "1",
    },
  },
  {
    isInput: true,
    accept: {
      placeholderTextColor: "color",
      selectionColor: "color",
      cursorColor: "color",
      selectionHandleColor: "color",
      underlineColorAndroid: "color",
    } as const,
    validStyles: Text.staticConfig.validStyles,
  },
] as const;

export const styledBody = [
  {
    name: INPUT_NAME,
    render: "input",
    // Anchor the font family on the host itself (not only in `defaultStyles`).
    // The host is always rendered `unstyled`, so the `unstyled: { false: … }`
    // branch never runs — without a family here, a `fontSize` TOKEN (`"$md"`)
    // has no font scale to resolve against and the per-size font size is lost.
    // (The `button` host sets the same family inline for the same reason.)
    fontFamily: "$body",
    // Same reason: `defaultStyles.color` only applies in the never-run
    // `unstyled: { false: … }` branch, and a bare `<input>` doesn't inherit
    // `color` from ancestors — so the typed text would fall back to the browser
    // default and ignore the theme. A consumer-passed `color` prop still wins.
    color: "$color",
    variants: {
      unstyled: {
        true: {
          // The wrapper owns all input chrome; the host control should stay visually bare.
          outlineWidth: 0,
          outlineStyle: "none",
          outlineColor: "transparent",
          borderWidth: 0,
          borderColor: "transparent",
          backgroundColor: "transparent",
          boxShadow: "none",
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
        },
        false: defaultStyles,
      },

      size: inputHostSizeVariant,

      disabled: {
        true: {},
      },
    } as const,

    defaultVariants: {
      unstyled: process.env.TAMAGUI_HEADLESS === "1",
    },
  },

  {
    isInput: true,
    accept: {
      placeholderTextColor: "color",
      selectionColor: "color",
      cursorColor: "color",
      selectionHandleColor: "color",
      underlineColorAndroid: "color",
    } as const,

    validStyles: Text.staticConfig.validStyles,
  },
] as const;
