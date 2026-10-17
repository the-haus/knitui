import * as React from "react";

import type { GetProps, TamaguiElement } from "@knitui/core";
import { resolveToken, styleable, styled, Theme } from "@knitui/core";
import { useCallbackRef, useId } from "@knitui/hooks";

import { Box } from "../Box";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
import { controlIconSize } from "../internal/control-icon-size";
import { controlMetrics as M } from "../internal/control-metrics";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import {
  fieldHeightVariant,
  fontSizeOf,
  fontSizePassthroughVariant,
  radiusVariant,
  type SizeKey,
  tableVariant,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Loader } from "../Loader";
import { Text } from "../Text";

export const INPUT_NAME = "Input";
export const DEFAULT_PLACEHOLDER_COLOR = "color8";
// The host's default selection highlight. v3 resolves `selectionColor` like any
// colour style prop (web: a `::selection` rule on the host's atomic class; native:
// the resolved value handed to `TextInput`), so a theme name tracks the theme.
export const DEFAULT_SELECTION_COLOR = "blue5";

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
export const INPUT_DEFAULT_RADIUS = "sm" as const;

// Horizontal text inset per size (space scale) — the gap between the typed text /
// placeholder and the field border (and any adornment section). Without it the
// text sits flush against the edge. Paired with the per-size fontSize so the host
// scales as one unit; the `:string`/`:number` catch-alls size font only.
// fontSize + horizontal inset come from the canonical `controlMetrics` table, so
// an input's text size and edge gap match a Button of the same key. The
// `:string`/`:number` catch-alls size font only (height is set separately from the
// token map above).
export const inputHostSizeVariant = tableVariant(
  {
    xxs: { fontSize: M.xxs.fontSize, paddingHorizontal: M.xxs.paddingHorizontal },
    xs: { fontSize: M.xs.fontSize, paddingHorizontal: M.xs.paddingHorizontal },
    sm: { fontSize: M.sm.fontSize, paddingHorizontal: M.sm.paddingHorizontal },
    md: { fontSize: M.md.fontSize, paddingHorizontal: M.md.paddingHorizontal },
    lg: { fontSize: M.lg.fontSize, paddingHorizontal: M.lg.paddingHorizontal },
    xl: { fontSize: M.xl.fontSize, paddingHorizontal: M.xl.paddingHorizontal },
    xxl: { fontSize: M.xxl.fontSize, paddingHorizontal: M.xxl.paddingHorizontal },
  },
  fontSizeOf,
);

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
  xxs: "xs",
  xs: "xs",
  sm: "sm",
  md: "sm",
  lg: "sm",
  xl: "md",
  xxl: "md",
} as const satisfies Record<InputTokenSize, `${string}`>;

export const getTextareaPaddingVertical = (size: InputSize | undefined): number => {
  const token = TEXTAREA_INSET_TOKEN[toInputTokenSizeKey(size)];
  const resolved = resolveToken(token, "space");
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
// It names the line-height TOKEN of the same step as the clamped per-size
// `fontSize` (the value `getLineHeight` computes, `round(fontSize × ratio)`), so it
// matches the native host's `getNativeLineHeight` and a textarea row is the same
// height on web, iOS and Android — and, being a token, it is `rem` on the web, so
// browser text zoom grows the line box together with the text.
const textareaHostSizeVariant = tableVariant(
  {
    xxs: {
      fontSize: M.xxs.fontSize,
      lineHeight: M.xxs.fontSize,
      paddingHorizontal: M.xxs.paddingHorizontal,
      paddingVertical: TEXTAREA_INSET_TOKEN.xxs,
    },
    xs: {
      fontSize: M.xs.fontSize,
      lineHeight: M.xs.fontSize,
      paddingHorizontal: M.xs.paddingHorizontal,
      paddingVertical: TEXTAREA_INSET_TOKEN.xs,
    },
    sm: {
      fontSize: M.sm.fontSize,
      lineHeight: M.sm.fontSize,
      paddingHorizontal: M.sm.paddingHorizontal,
      paddingVertical: TEXTAREA_INSET_TOKEN.sm,
    },
    md: {
      fontSize: M.md.fontSize,
      lineHeight: M.md.fontSize,
      paddingHorizontal: M.md.paddingHorizontal,
      paddingVertical: TEXTAREA_INSET_TOKEN.md,
    },
    lg: {
      fontSize: M.lg.fontSize,
      lineHeight: M.lg.fontSize,
      paddingHorizontal: M.lg.paddingHorizontal,
      paddingVertical: TEXTAREA_INSET_TOKEN.lg,
    },
    xl: {
      fontSize: M.xl.fontSize,
      lineHeight: M.xl.fontSize,
      paddingHorizontal: M.xl.paddingHorizontal,
      paddingVertical: TEXTAREA_INSET_TOKEN.xl,
    },
    xxl: {
      fontSize: M.xxl.fontSize,
      lineHeight: M.xxl.fontSize,
      paddingHorizontal: M.xxl.paddingHorizontal,
      paddingVertical: TEXTAREA_INSET_TOKEN.xxl,
    },
  },
  fontSizeOf,
);

// The loading `Loader` stands in for a section icon, so it takes the SAME
// canonical in-control icon px (`controlIconSize`) rather than the full input
// height — otherwise the ring nearly fills the field.
const toInputLoaderSize = (size: InputSize | undefined) =>
  controlIconSize(toInputTokenSizeKey(size));

export const InputRootFrame = styled(Box, {
  displayName: "InputRoot",
  flexDirection: "row",
  alignItems: "center",
  minWidth: 0,
  borderWidth: 1,
  borderColor: "borderColor",
  backgroundColor: "background",
  borderRadius: INPUT_DEFAULT_RADIUS,
  ...webCursor("text"),
  overflow: "hidden",

  variants: {
    size: fieldHeightVariant,
    radius: radiusVariant,
    variant: {
      default: {},
      filled: {
        backgroundColor: "color2",
      },
      unstyled: {
        borderWidth: 0,
        backgroundColor: "transparent",
      },
    },
    focused: {
      true: {
        // The accent-aware focus key (each theme's color8). The generated
        // `borderColorFocus` equals `borderColor`, so it showed no change.
        borderColor: "focusRingColor",
      },
    },
    // Error border stays red under every accent theme. `red9` is a raw palette
    // token exposed on every theme via the base theme's `extra` (see
    // core/config/themes.ts), so it reads red without a hardcoded hex and
    // without theming the frame (which would tint the background and children).
    error: {
      true: {
        borderColor: "red9",
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
  displayName: "InputSection",
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

type InputSectionInsetOptions = Pick<
  InputChromeProps,
  | "leftSection"
  | "rightSection"
  | "loading"
  | "loadingPosition"
  | "__clearSection"
  | "__clearable"
  | "__clearSectionMode"
  | "__defaultRightSection"
>;

/**
 * Host padding overrides for the sides that carry an adornment section.
 *
 * A section is a control-height square with its content centered, so it already
 * holds the content→edge gap on BOTH of its sides (`(height − icon) / 2`). The
 * host's own `paddingHorizontal` on that side would stack on top of it and push
 * the text ~2.5× further from the icon than the icon sits from the border, so it
 * is zeroed there. Resolved through `getSectionContent` — the same rule
 * `InputChrome` renders by — so the inset can't drift from what is on screen.
 */
export const getInputSectionInsets = (
  options: InputSectionInsetOptions,
): { paddingLeft?: 0; paddingRight?: 0 } => {
  const { loading = false, loadingPosition = "right" } = options;
  const left = getSectionContent({
    loading,
    loadingPosition,
    position: "left",
    section: options.leftSection,
  });
  const right = getSectionContent({
    loading,
    loadingPosition,
    position: "right",
    section: options.rightSection,
    clearSection: options.__clearSection,
    clearable: options.__clearable,
    clearSectionMode: options.__clearSectionMode,
    defaultSection: options.__defaultRightSection,
  });

  // Shared constant objects: the result is spread onto the host on every
  // keystroke-driven render, so it must not allocate.
  return left ? (right ? INSET_BOTH : INSET_LEFT) : right ? INSET_RIGHT : INSET_NONE;
};

const INSET_NONE: { paddingLeft?: 0; paddingRight?: 0 } = Object.freeze({});
const INSET_LEFT: { paddingLeft: 0 } = Object.freeze({ paddingLeft: 0 as const });
const INSET_RIGHT: { paddingRight: 0 } = Object.freeze({ paddingRight: 0 as const });
const INSET_BOTH: { paddingLeft: 0; paddingRight: 0 } = Object.freeze({
  paddingLeft: 0 as const,
  paddingRight: 0 as const,
});

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
      pointer={pointer}
      multiline={multiline}
      // v3 resolves overlapping variants in CALL-SITE prop order (last wins), so
      // the state flags go weakest → strongest: a focused field in error keeps
      // its red border, and disabled caps everything.
      focused={focused}
      error={!!error}
      disabled={disabled}
      onPress={disabled ? undefined : handleRootPress}
    >
      {leftContent ? (
        <InputSectionFrame
          width={leftSectionWidth ?? sectionWidth}
          sectionPointerEvents={getSectionPointerEvents(leftSectionPointerEvents)}
          {...mergedLeftSectionProps}
        >
          <ControlIconProvider size={sectionIconSize} color="color">
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
          <ControlIconProvider size={sectionIconSize} color="color">
            {rightContent}
          </ControlIconProvider>
        </InputSectionFrame>
      ) : null}
    </InputRootFrame>
  );
}

export const InputWrapperFrame = styled(Box, {
  displayName: "InputWrapper",
  flexDirection: "column",
  minWidth: 0,
  gap: 4,
});

export const InputLabelFrame = styled(Text, {
  displayName: "InputLabel",
  color: "color",
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
  color: "color",
  opacity: 0.65,

  variants: {
    size: fontSizePassthroughVariant,
  } as const,

  defaultVariants: {
    size: "md",
  },
});

// The three meta parts only map props to styles, so they are plain `styled()`
// frames (flatten-first): the host tag rides `render` in the base, the error
// colour is the theme-independent `red9` (exposed on every theme, see
// core/config/themes.source.ts `extra`), and the placeholder's error tint is a
// static variant.
export const InputDescriptionFrame = styled(InputMetaText, {
  displayName: "InputDescription",
  render: "p",
});

export const InputErrorFrame = styled(InputMetaText, {
  displayName: "InputError",
  render: "p",
  opacity: 1,
  color: "red9",
});

export const InputPlaceholderFrame = styled(Text, {
  displayName: "InputPlaceholder",
  render: "span",
  color: "color",
  opacity: 0.55,

  variants: {
    error: {
      true: { color: "color10" },
    },
  } as const,
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

export const InputLabel = styleable<InputLabelProps>(
  InputLabelFrame,
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
            <Text aria-hidden color="color" {...requiredProps}>
              {" *"}
            </Text>
          </Theme>
        ) : null}
      </InputLabelFrame>
    );
  },
);

export type InputDescriptionProps = GetProps<typeof InputDescriptionFrame>;
export const InputDescription = InputDescriptionFrame;

export type InputErrorProps = GetProps<typeof InputErrorFrame>;
export const InputError = InputErrorFrame;

export type InputPlaceholderProps = GetProps<typeof InputPlaceholderFrame>;
export const InputPlaceholder = InputPlaceholderFrame;

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

export const InputWrapper = styleable<InputWrapperProps>(
  InputWrapperFrame,
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
    // Stable identity (latest-callback pattern) so the memoized `InputLabel` isn't
    // handed a fresh `onPress` on every keystroke in the field.
    const handleLabelPress = useCallbackRef<
      Parameters<NonNullable<InputLabelProps["onPress"]>>,
      void
    >((event) => {
      labelOnPress?.(event);
      focusInputById(inputId);
    });

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

    // The consumers of this context are the actual input elements of EVERY wrapped
    // field in the kit (`Input`, `PillsInput`, `NativeSelect`, …), and context
    // propagation walks straight past `React.memo` — so a fresh value object here
    // re-rendered each of them on every render of the wrapper. Note `error` is a
    // `ReactNode`: a consumer passing an inline element still gets a new value each
    // render, which is honest (the value really did change identity).
    const wrapperContext = React.useMemo<InputWrapperContextValue>(
      () => ({ inputId, describedBy, size, error }),
      [inputId, describedBy, size, error],
    );

    return (
      <InputWrapperContext.Provider value={wrapperContext}>
        <InputWrapperFrame ref={ref} {...s.get("wrapper")} {...rest}>
          {inputWrapperOrder.map((part) => nodes[part])}
        </InputWrapperFrame>
      </InputWrapperContext.Provider>
    );
  },
);

/**
 * The bare text-host skin shared by the single-line and multiline hosts (web
 * `<input>`/`<textarea>`, native `TextInput`). The wrapper (`InputChrome`) owns all
 * field chrome — border, background, focus border, sections — so the host itself
 * only resets the platform chrome and carries the text styles:
 *
 * - `fontFamily` / `color` sit on the host itself: a bare `<input>` doesn't inherit
 *   `color`, and a `fontSize` token needs a font family to resolve against.
 * - `placeholderTextColor` / `selectionColor` are v3 INPUT colour style props
 *   (`isInput: true` below opts the frame into them): on web they compile to
 *   `::placeholder` / `::selection` rules on the host's atomic classes, on native
 *   they resolve against the theme and reach `TextInput` as props. A call-site
 *   `placeholderTextColor="red9"` simply overrides the base value — no CSS custom
 *   property bridge, no `useTheme()`, nothing allocated per render.
 */
const INPUT_HOST_SKIN = {
  fontFamily: "body",
  color: "color",
  outlineWidth: 0,
  outlineStyle: "none",
  outlineColor: "transparent",
  borderWidth: 0,
  borderColor: "transparent",
  backgroundColor: "transparent",
  boxShadow: "none",
  placeholderTextColor: DEFAULT_PLACEHOLDER_COLOR,
  selectionColor: DEFAULT_SELECTION_COLOR,
} as const;

/**
 * `styled()` config of the single-line text host:
 * `styled(Box, { ...INPUT_HOST_CONFIG, render: "input" }, INPUT_HOST_STATIC)` on web,
 * `styled(TextInput, INPUT_HOST_CONFIG, INPUT_HOST_STATIC)` on native (no `render`:
 * the host IS the RN `TextInput`).
 */
export const INPUT_HOST_CONFIG = {
  displayName: INPUT_NAME,
  ...INPUT_HOST_SKIN,
  variants: {
    size: inputHostSizeVariant,
  } as const,
  defaultVariants: {
    size: "md",
  },
} as const;

/** `styled()` config of the web multiline host (`<textarea>`). */
export const TEXTAREA_HOST_CONFIG = {
  displayName: "InputTextarea",
  render: "textarea",
  ...INPUT_HOST_SKIN,
  variants: {
    size: textareaHostSizeVariant,
  } as const,
  defaultVariants: {
    size: "md",
  },
} as const;

/**
 * Static config of both text hosts: `isInput` gives the frame v3's input style
 * surface (text styles + the input colour props) and forwards `disabled` to the
 * real element.
 */
export const INPUT_HOST_STATIC = { isInput: true } as const;
