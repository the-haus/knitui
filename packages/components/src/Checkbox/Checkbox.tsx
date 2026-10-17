import * as React from "react";

import {
  type GetProps,
  styleable,
  styled,
  type TamaguiElement,
  withStaticProperties,
} from "@knitui/core";
import { useId, useKeyboardActions, useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import {
  INLINE_CONTROL_SLOTS,
  InlineControl,
  type InlineControlProps,
  type InlineControlSlots,
} from "../internal/InlineControl";
import { useReducedTransition } from "../internal/motion";
import {
  FOCUS_RING,
  focusRingStyle,
  radiusVariant,
  scopeTransition,
  shadowVariant,
  type SizeKey,
  squareSizeVariant,
  webCursor,
} from "../internal/style-props";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";
import { Text, type TextProps } from "../Text";
import { CheckboxIcon, type CheckboxIconComponent, type CheckboxIconProps } from "./CheckIcon";

export type CheckboxVariant = "filled" | "outline";
export type CheckboxSize = SizeKey;

/* -------------------------------------------------------------------------- */
/* Group + Card context                                                       */
/* -------------------------------------------------------------------------- */

interface CheckboxGroupContextValue {
  value: string[];
  onChange: (itemValue: string) => void;
  size?: CheckboxSize;
  isDisabled: (itemValue: string) => boolean;
}

const CheckboxGroupContext = React.createContext<CheckboxGroupContextValue | null>(null);

interface CheckboxCardContextValue {
  checked: boolean;
}

const CheckboxCardContext = React.createContext<CheckboxCardContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* Shared visual (box + glyph) — used by Checkbox and Checkbox.Indicator       */
/* -------------------------------------------------------------------------- */

/**
 * The square box. Its colours are a STATIC `tone` variant (resolved once per
 * render from variant + checked + error), so the fill/border are compiler-known
 * variant bodies instead of per-render JSX colour props:
 *
 *  tone      fill          border    glyph
 *  off       color3        color6    —        (faint fill + a border that reads as a target)
 *  filled    color9        color9    color1
 *  outline   transparent   color9    color9
 *  error     red3          red8      —        (unchecked + `error`; base-theme red keys,
 *                                              so it stays red under any accent theme)
 *
 * The focus ring is NOT in this base: `Checkbox.Indicator` reuses the box and is
 * not focusable, so the ring is spread only where the box is focusable (two-layer
 * focus contract).
 */
const CheckboxBox = styled(Box, {
  displayName: "Checkbox",
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
  ...webCursor("pointer"),

  variants: {
    size: {
      ...squareSizeVariant,
    },
    radius: radiusVariant,
    tone: {
      off: { backgroundColor: "color3", borderColor: "color6" },
      filled: { backgroundColor: "color9", borderColor: "color9" },
      outline: { backgroundColor: "transparent", borderColor: "color9" },
      error: { backgroundColor: "red3", borderColor: "red8" },
    },
    disabled: {
      true: { opacity: 0.6 },
    },
  } as const,

  defaultVariants: { size: "md", tone: "off" },
});

type CheckboxTone = "off" | "filled" | "outline" | "error";

type CheckboxAriaProps = {
  role: "checkbox";
  "aria-checked": boolean | "mixed";
  "aria-disabled"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

/** The box tone for variant + active (checked / indeterminate) + error. */
const checkboxTone = (variant: CheckboxVariant, active: boolean, error: boolean): CheckboxTone =>
  active ? variant : error ? "error" : "off";

/** Glyph colour on each active tone. */
const ICON_COLOR = { filled: "color1", outline: "color9" } as const;

/** Only the box colours ease between checked states. */
const BOX_TRANSITION_PROPERTIES = ["backgroundColor", "borderColor"] as const;

interface CheckboxVisualProps extends Omit<GetProps<typeof CheckboxBox>, "size" | "tone"> {
  checked?: boolean;
  indeterminate?: boolean;
  size?: CheckboxSize;
  variant?: CheckboxVariant;
  icon?: CheckboxIconComponent;
  iconColor?: TextProps["color"];
  /** `icon` slot props spread onto the glyph (under the resolved size/colour). */
  iconProps?: Partial<CheckboxIconProps>;
  error?: React.ReactNode;
  withErrorStyles?: boolean;
}

const CheckboxVisual = styleable<CheckboxVisualProps>(
  CheckboxBox,
  function CheckboxVisual(props, ref) {
    const {
      checked,
      indeterminate,
      size = "md",
      variant = "filled",
      icon: Icon = CheckboxIcon,
      iconColor,
      iconProps,
      error,
      withErrorStyles = true,
      ...rest
    } = props;

    const active = !!(checked || indeterminate);
    // Reduced-motion aware; memoised, and `scopeTransition` caches per result.
    const fade = useReducedTransition("fast");

    // No `<Theme name="red">` wrapper for the error state: switching the tree
    // shape would remount the (focused) box. The `error` tone reads the base
    // theme's red keys directly.
    return (
      <CheckboxBox
        ref={ref}
        size={size}
        tone={checkboxTone(variant, active, !!error && withErrorStyles)}
        {...scopeTransition(fade, BOX_TRANSITION_PROPERTIES)}
        {...rest}
      >
        {active ? (
          <Icon
            indeterminate={indeterminate}
            size={size}
            color={iconColor ?? ICON_COLOR[variant]}
            {...iconProps}
          />
        ) : null}
      </CheckboxBox>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Slot map                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Slot → part-props map for Checkbox's own visual parts (Pillar B /
 * `internal/styles.ts`). Layered ON TOP of the inherited chrome slots
 * (`label` / `description` / `error` / `root`, see {@link InlineControlSlots}):
 * a Checkbox's `styles={{ box, icon, label }}` styles the box, the glyph, AND the
 * chrome label in one map. `box` is the square `CheckboxBox`; `icon` reaches the
 * check / indeterminate glyph component.
 */
export interface CheckboxStyles extends InlineControlSlots {
  /** Props for the square `CheckboxBox` (size / tone stay owned by the Checkbox). */
  box: Partial<Omit<GetProps<typeof CheckboxBox>, "size" | "tone">>;
  /** Props for the check / indeterminate glyph (`Checkbox.icon`). */
  icon: Partial<CheckboxIconProps>;
}

const CHECKBOX_SLOTS = [
  ...INLINE_CONTROL_SLOTS,
  "box",
  "icon",
] as const satisfies readonly (keyof CheckboxStyles)[];

/* -------------------------------------------------------------------------- */
/* Checkbox                                                                   */
/* -------------------------------------------------------------------------- */

export interface CheckboxProps
  extends
    Omit<GetProps<typeof CheckboxBox>, "size" | "tone" | "onChange" | "role">,
    Pick<InlineControlProps, "label" | "description" | "error" | "labelPosition"> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state for the uncontrolled case. @default false */
  defaultChecked?: boolean;
  /**
   * Called with the next checked state. Mirrors Mantine's `onChange` name; the
   * payload is a boolean (not a DOM event) because the kit is cross-platform.
   */
  onChange?: (checked: boolean) => void;
  /** @deprecated Tamagui-style alias for {@link CheckboxProps.onChange}. */
  onCheckedChange?: (checked: boolean) => void;
  /** Controls the size of the component. @default 'md' */
  size?: CheckboxSize;
  /** Visual style of the box. @default 'filled' */
  variant?: CheckboxVariant;
  /** Indeterminate state. When set, `checked` is ignored for display. */
  indeterminate?: boolean;
  /** Icon component for the checked / indeterminate state. */
  icon?: CheckboxIconComponent;
  /** Override the icon colour (defaults to the contrast/accent colour). */
  iconColor?: TextProps["color"];
  /** If set, the value cannot be changed but the control stays focusable. */
  readOnly?: boolean;
  /** Apply error styles to the box when `error` is set. @default true */
  withErrorStyles?: boolean;
  /**
   * Uniform per-slot style passthrough — sugar over the composable parts. Own
   * slots: `box` (the square) / `icon` (the glyph); plus the inherited chrome
   * slots `label` / `description` / `error` / `root` forwarded to the
   * `InlineControl`.
   */
  styles?: SlotStyles<CheckboxStyles>;
  /** Id used to bind the control and label; auto-generated when omitted. */
  id?: string;
  /** Value reported to a surrounding `Checkbox.Group`. */
  value?: string;
  /** Disables the checkbox. */
  disabled?: boolean;
  /** Ref of the root wrapper element. */
  rootRef?: React.Ref<TamaguiElement>;
  /** Extra element id(s) to merge into the control's `aria-describedby`. */
  "aria-describedby"?: string;
}

const CheckboxComponent = styleable<CheckboxProps>(CheckboxBox, function Checkbox(props, ref) {
  const {
    checked,
    defaultChecked,
    onChange,
    onCheckedChange,
    size: sizeProp,
    radius = "md",
    variant = "filled",
    indeterminate,
    icon,
    iconColor,
    readOnly,
    withErrorStyles = true,
    label,
    description,
    error,
    labelPosition = "right",
    styles,
    id,
    value,
    disabled,
    rootRef,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedByProp,
    ...rest
  } = props;

  const ctx = React.useContext(CheckboxGroupContext);
  const inGroup = ctx != null && value != null;
  const size = sizeProp ?? ctx?.size ?? "md";

  const uuid = useId(id);
  const descriptionId = description != null ? `${uuid}-description` : undefined;
  const errorId = error != null && error !== true ? `${uuid}-error` : undefined;

  const [isOn, setOn] = useUncontrolled<boolean>({
    value: inGroup ? ctx!.value.includes(value!) : checked,
    defaultValue: defaultChecked,
    finalValue: false,
    onChange: (next) => {
      onChange?.(next);
      onCheckedChange?.(next);
    },
  });

  const resolvedDisabled = !!(disabled || (inGroup && ctx!.isDisabled(value!)));
  const ariaDescribedBy =
    [ariaDescribedByProp, descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const ariaProps: CheckboxAriaProps = {
    role: "checkbox",
    "aria-checked": indeterminate ? "mixed" : isOn,
    "aria-disabled": resolvedDisabled || undefined,
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    "aria-labelledby":
      ariaLabelledBy ?? (ariaLabel == null && label != null ? `${uuid}-label` : undefined),
  };

  const toggle = React.useCallback(() => {
    if (resolvedDisabled || readOnly) {
      return;
    }
    if (inGroup) {
      ctx!.onChange(value!);
    }
    setOn(!isOn);
  }, [resolvedDisabled, readOnly, inGroup, ctx, value, setOn, isOn]);

  const focusProps = useKeyboardActions({ onActivate: toggle }, { disabled: resolvedDisabled });

  // Own slots applied to the visual parts; chrome slots forwarded to InlineControl.
  const s = slotStyles<CheckboxStyles>(styles, CHECKBOX_SLOTS, "Checkbox");

  const control = (
    <CheckboxVisual
      ref={ref}
      checked={isOn}
      indeterminate={indeterminate}
      size={size}
      radius={radius}
      variant={variant}
      icon={icon}
      iconColor={iconColor}
      iconProps={s.get("icon")}
      error={error}
      withErrorStyles={withErrorStyles}
      onPress={toggle}
      {...ariaProps}
      {...focusProps}
      {...FOCUS_RING}
      {...s.get("box")}
      {...rest}
    />
  );

  return (
    <InlineControl
      ref={rootRef}
      id={uuid}
      size={size}
      labelPosition={labelPosition}
      label={label}
      description={description}
      error={error}
      disabled={resolvedDisabled}
      descriptionId={descriptionId}
      errorId={errorId}
      onLabelPress={toggle}
      control={control}
      styles={pick<CheckboxStyles, InlineControlSlots>(styles, INLINE_CONTROL_SLOTS)}
    />
  );
});

/* -------------------------------------------------------------------------- */
/* Checkbox.Group                                                             */
/* -------------------------------------------------------------------------- */

const GroupFrame = styled(Box, {
  displayName: "CheckboxGroup",
  flexDirection: "column",
  gap: "xs",
});

const GroupItems = styled(Box, {
  displayName: "CheckboxGroupItems",
  role: "group",
  flexDirection: "column",
  gap: "sm",
});

const GroupLabel = styled(Text, {
  displayName: "CheckboxGroupLabel",
  fontWeight: "600",
  color: "color",
});
const GroupDescription = styled(Text, {
  displayName: "CheckboxGroupDescription",
  color: "color",
  opacity: 0.65,
});

export interface CheckboxGroupProps extends Omit<GetProps<typeof GroupFrame>, "onChange"> {
  /** `Checkbox` children. */
  children?: React.ReactNode;
  /** Controlled array of selected values. */
  value?: string[];
  /** Initial selected values for the uncontrolled case. */
  defaultValue?: string[];
  /** Called with the next array of selected values. */
  onChange?: (value: string[]) => void;
  /** Size shared with every child checkbox. @default 'md' */
  size?: CheckboxSize;
  /** Group label rendered above the checkboxes. */
  label?: React.ReactNode;
  /** Group description rendered below the label. */
  description?: React.ReactNode;
  /** If set, values cannot be changed. */
  readOnly?: boolean;
  /** Disable the whole group. */
  disabled?: boolean;
  /** Cap on selected values; unselected checkboxes disable once reached. */
  maxSelectedValues?: number;
  /**
   * `name` for the hidden form input. Accepted for Mantine parity; uncontrolled
   * native form submission has no DOM input, so this is web-form metadata only.
   */
  name?: string;
}

const CheckboxGroup = styleable<CheckboxGroupProps>(GroupFrame, function CheckboxGroup(props, ref) {
  const {
    children,
    value,
    defaultValue,
    onChange,
    size = "md",
    label,
    description,
    readOnly,
    disabled,
    maxSelectedValues,
    name: _name,
    ...rest
  } = props;

  const [selected, setSelected] = useUncontrolled<string[]>({
    value,
    defaultValue,
    finalValue: [],
    onChange,
  });

  const handleItemChange = React.useCallback(
    (itemValue: string) => {
      if (readOnly) {
        return;
      }
      const isSelected = selected.includes(itemValue);
      if (!isSelected && maxSelectedValues && selected.length >= maxSelectedValues) {
        return;
      }
      setSelected(isSelected ? selected.filter((v) => v !== itemValue) : [...selected, itemValue]);
    },
    [readOnly, selected, maxSelectedValues, setSelected],
  );

  const isDisabled = React.useCallback(
    (itemValue: string) => {
      if (disabled) {
        return true;
      }
      if (!maxSelectedValues) {
        return false;
      }
      return !selected.includes(itemValue) && selected.length >= maxSelectedValues;
    },
    [disabled, maxSelectedValues, selected],
  );

  const contextValue = React.useMemo<CheckboxGroupContextValue>(
    () => ({ value: selected, onChange: handleItemChange, size, isDisabled }),
    [selected, handleItemChange, size, isDisabled],
  );

  return (
    <CheckboxGroupContext.Provider value={contextValue}>
      <GroupFrame ref={ref} {...rest}>
        {label != null ? <GroupLabel>{label}</GroupLabel> : null}
        {description != null ? <GroupDescription>{description}</GroupDescription> : null}
        <GroupItems>{children}</GroupItems>
      </GroupFrame>
    </CheckboxGroupContext.Provider>
  );
});

/* -------------------------------------------------------------------------- */
/* Checkbox.Indicator — presentational, no input                              */
/* -------------------------------------------------------------------------- */

export interface CheckboxIndicatorProps extends Omit<
  GetProps<typeof CheckboxBox>,
  "size" | "tone" | "disabled"
> {
  /** Determines whether the indicator shows the checked styles. */
  checked?: boolean;
  /** Indeterminate state; when set, `checked` is ignored for display. */
  indeterminate?: boolean;
  /** Controls the size of the component. @default 'md' */
  size?: CheckboxSize;
  /** Visual style of the box. @default 'filled' */
  variant?: CheckboxVariant;
  /** Icon component for the checked / indeterminate state. */
  icon?: CheckboxIconComponent;
  /** Override the icon colour. */
  iconColor?: TextProps["color"];
  /** Renders disabled (dimmed) styles. */
  disabled?: boolean;
}

const CheckboxIndicator = styleable<CheckboxIndicatorProps>(
  CheckboxBox,
  function CheckboxIndicator(props, ref) {
    const {
      checked,
      indeterminate,
      size = "md",
      variant = "filled",
      icon,
      iconColor,
      disabled,
      radius = "sm",
      ...rest
    } = props;
    const ctx = React.useContext(CheckboxCardContext);
    const resolved =
      typeof checked === "boolean" || typeof indeterminate === "boolean"
        ? !!(checked || indeterminate)
        : (ctx?.checked ?? false);

    return (
      <CheckboxVisual
        ref={ref}
        checked={resolved}
        indeterminate={indeterminate}
        size={size}
        radius={radius}
        variant={variant}
        icon={icon}
        iconColor={iconColor}
        disabled={!!disabled}
        {...rest}
      />
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Checkbox.Card — pressable card that acts as a checkbox                      */
/* -------------------------------------------------------------------------- */

const CheckboxCardFrame = styled(Box, {
  displayName: "CheckboxCard",
  padding: "md",
  ...webCursor("pointer"),
  // The card is always keyboard-focusable (`useKeyboardActions`), so the ring
  // lives on its base.
  ...focusRingStyle,

  variants: {
    withBorder: {
      true: { borderWidth: 1, borderColor: "borderColor" },
    },
    checked: {
      true: { borderColor: "color9" },
    },
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
    radius: radiusVariant,
    shadow: shadowVariant,
  } as const,

  defaultVariants: { withBorder: true },
});

export interface CheckboxCardProps extends Omit<
  GetProps<typeof CheckboxCardFrame>,
  "onChange" | "checked" | "withBorder" | "disabled" | "role"
> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state for the uncontrolled case. @default false */
  defaultChecked?: boolean;
  /** Called with the next checked state. */
  onChange?: (checked: boolean) => void;
  /** Adds a border to the card. @default true */
  withBorder?: boolean;
  /** Value reported to a surrounding `Checkbox.Group`. */
  value?: string;
  /** Card content (typically a `Checkbox.Indicator` + text). */
  children?: React.ReactNode;
  /** Disables the card. */
  disabled?: boolean;
}

const CheckboxCard = styleable<CheckboxCardProps>(
  CheckboxCardFrame,
  function CheckboxCard(props, ref) {
    const {
      checked,
      defaultChecked,
      onChange,
      withBorder = true,
      value,
      children,
      disabled,
      "aria-label": ariaLabel,
      ...rest
    } = props;

    const ctx = React.useContext(CheckboxGroupContext);
    const inGroup = ctx != null && value != null;

    const [isOn, setOn] = useUncontrolled<boolean>({
      value: inGroup ? ctx!.value.includes(value!) : checked,
      defaultValue: defaultChecked,
      finalValue: false,
      onChange,
    });

    const resolvedDisabled = !!(disabled || (inGroup && ctx!.isDisabled(value!)));
    const ariaProps: CheckboxAriaProps = {
      role: "checkbox",
      "aria-checked": isOn,
      "aria-disabled": resolvedDisabled || undefined,
      "aria-label": ariaLabel,
    };

    const toggle = React.useCallback(() => {
      if (resolvedDisabled) {
        return;
      }
      if (inGroup) {
        ctx!.onChange(value!);
      }
      setOn(!isOn);
    }, [resolvedDisabled, inGroup, ctx, value, setOn, isOn]);

    const focusProps = useKeyboardActions({ onActivate: toggle }, { disabled: resolvedDisabled });
    const cardContext = React.useMemo(() => ({ checked: isOn }), [isOn]);

    return (
      <CheckboxCardContext.Provider value={cardContext}>
        <CheckboxCardFrame
          ref={ref}
          withBorder={withBorder}
          checked={isOn}
          disabled={resolvedDisabled}
          onPress={toggle}
          {...ariaProps}
          {...focusProps}
          {...rest}
        >
          {children}
        </CheckboxCardFrame>
      </CheckboxCardContext.Provider>
    );
  },
);

export const Checkbox = withStaticProperties(CheckboxComponent, {
  Group: CheckboxGroup,
  Indicator: CheckboxIndicator,
  Card: CheckboxCard,
});

export type { CheckboxIconComponent };
