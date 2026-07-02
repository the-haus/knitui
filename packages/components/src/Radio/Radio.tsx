import * as React from "react";

import {
  type GetProps,
  styled,
  type TamaguiElement,
  Theme,
  withStaticProperties,
} from "@knitui/core";
import { useId, useKeyboardActions, useUncontrolled } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import {
  INLINE_CONTROL_SLOTS,
  InlineControl,
  type InlineControlProps,
  type InlineControlSlots,
} from "../internal/InlineControl";
import {
  focusRingStyle,
  radiusVariant,
  shadowVariant,
  type SizeKey,
  squareSizeVariant,
  webCursor,
} from "../internal/style-props";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";
import { Text, type TextProps } from "../Text";
import { RadioIcon, type RadioIconComponent, type RadioIconProps } from "./RadioIcon";

export type RadioVariant = "filled" | "outline";
export type RadioSize = SizeKey;

/* -------------------------------------------------------------------------- */
/* Group context                                                              */
/* -------------------------------------------------------------------------- */

interface RadioGroupContextValue {
  value: string | null;
  onChange: (val: string) => void;
  name: string;
  size?: RadioSize;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* RadioCard context                                                          */
/* -------------------------------------------------------------------------- */

interface RadioCardContextValue {
  checked: boolean;
}

const RadioCardContext = React.createContext<RadioCardContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* Shared visual: circle box                                                  */
/* -------------------------------------------------------------------------- */

const RadioCircle = styled(Box, {
  name: "Radio",
  borderWidth: 2,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  ...webCursor("pointer"),
  ...focusRingStyle,

  variants: {
    size: {
      ...squareSizeVariant,
    },
    on: {
      true: {},
      false: {},
    },
    variant: {
      filled: {},
      outline: {},
    },
    radius: radiusVariant,
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { size: "md", on: false, variant: "filled" },
});

type RadioAriaProps = {
  role: "radio";
  "aria-checked": boolean;
  "aria-disabled"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

/** Derive the radio circle and dot colors from variant + checked state. */
function radioCircleStyle(
  variant: RadioVariant,
  on: boolean,
): { background: BoxProps["backgroundColor"]; border: BoxProps["borderColor"] } {
  if (!on) {
    return { background: "$background", border: "$borderColor" };
  }
  if (variant === "outline") {
    return { background: "transparent", border: "$color9" };
  }
  return { background: "$color9", border: "$color9" };
}

function radioDotColor(variant: RadioVariant, on: boolean): BoxProps["backgroundColor"] {
  if (!on) return "transparent";
  return variant === "outline" ? "$color9" : "$color1";
}

/* -------------------------------------------------------------------------- */
/* Slot map                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Slot → part-props map for Radio's own visual parts (Pillar B /
 * `internal/styles.ts`). Layered ON TOP of the inherited chrome slots
 * (`label` / `description` / `error` / `root`, see {@link InlineControlSlots}).
 * `circle` is the round `RadioCircle` box; `dot` reaches the inner glyph
 * (`Radio.icon`, the filled dot). `icon` is an alias of `dot` for vocabulary
 * parity with the other toggles — both spread onto the same glyph.
 */
export interface RadioStyles extends InlineControlSlots {
  /** Props for the round `RadioCircle` box. */
  circle: Partial<GetProps<typeof RadioCircle>>;
  /** Props for the inner glyph / dot (`Radio.icon`). */
  dot: Partial<RadioIconProps>;
  /** Alias of `dot` — props for the inner glyph (`Radio.icon`). */
  icon: Partial<RadioIconProps>;
}

const RADIO_SLOTS = [
  ...INLINE_CONTROL_SLOTS,
  "circle",
  "dot",
  "icon",
] as const satisfies readonly (keyof RadioStyles)[];

/* -------------------------------------------------------------------------- */
/* Radio                                                                      */
/* -------------------------------------------------------------------------- */

export interface RadioProps
  extends
    Omit<GetProps<typeof RadioCircle>, "size" | "on" | "variant" | "onChange">,
    Pick<InlineControlProps, "label" | "description" | "error" | "labelPosition"> {
  /** Visual style. @default 'filled' */
  variant?: RadioVariant;
  /** Size of the control. @default 'md' */
  size?: RadioSize;
  /** Controlled checked state. */
  checked?: boolean;
  /** Uncontrolled initial checked state. @default false */
  defaultChecked?: boolean;
  /** Called when the radio becomes checked. */
  onChange?: (checked: boolean) => void;
  /** Value used to match against a surrounding `Radio.Group`. */
  value?: string;
  /** Disables the radio. */
  disabled?: boolean;
  /** Id for a11y bindings; auto-generated when omitted. */
  id?: string;
  /** Ref of the root wrapper element. */
  rootRef?: React.Ref<TamaguiElement>;
  /** Accessible label when no visible label is provided. */
  "aria-label"?: React.AriaAttributes["aria-label"];
  /** Id of an external label element. Defaults to the visible label id. */
  "aria-labelledby"?: React.AriaAttributes["aria-labelledby"];
  /** Ids of external description elements; merged with description/error ids. */
  "aria-describedby"?: React.AriaAttributes["aria-describedby"];
  /** Inner glyph component for the checked state. @default RadioIcon */
  icon?: RadioIconComponent;
  /** Override the glyph colour (defaults to the variant-derived dot colour). */
  iconColor?: TextProps["color"];
  /**
   * Uniform per-slot style passthrough — sugar over the composable parts. Own
   * slots: `circle` (the round box) / `dot` / `icon` (the inner glyph); plus the
   * inherited chrome slots `label` / `description` / `error` / `root` forwarded
   * to the `InlineControl`.
   */
  styles?: SlotStyles<RadioStyles>;
}

const RadioComponent = RadioCircle.styleable<RadioProps>(function Radio(props, ref) {
  const {
    variant = "filled",
    size: sizeProp,
    checked,
    defaultChecked,
    onChange,
    value,
    disabled,
    id,
    label,
    description,
    error,
    labelPosition = "right",
    styles,
    rootRef,
    icon: Icon = RadioIcon,
    iconColor,
    role: _role,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedByProp,
    ...rest
  } = props;

  const group = React.useContext(RadioGroupContext);
  const inGroup = group !== null && value !== undefined;
  const size = sizeProp ?? group?.size ?? "md";

  const uuid = useId(id);
  const descriptionId = description != null ? `${uuid}-description` : undefined;
  const errorId = error != null && error !== true ? `${uuid}-error` : undefined;

  const [selfChecked, setSelfChecked] = useUncontrolled<boolean>({
    value: inGroup ? group!.value === value : checked,
    defaultValue: defaultChecked,
    finalValue: false,
    onChange,
  });

  const isChecked = inGroup ? group!.value === value : selfChecked;
  const resolvedDisabled = !!(disabled || (inGroup && group!.disabled));
  const ariaDescribedBy =
    [ariaDescribedByProp, descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const ariaProps: RadioAriaProps = {
    role: "radio",
    "aria-checked": isChecked,
    "aria-disabled": resolvedDisabled || undefined,
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    "aria-labelledby":
      ariaLabelledBy ?? (ariaLabel == null && label != null ? `${uuid}-label` : undefined),
  };

  const toggle = React.useCallback(() => {
    if (resolvedDisabled || isChecked) return;
    if (inGroup) {
      group!.onChange(value!);
    } else {
      setSelfChecked(true);
    }
  }, [resolvedDisabled, isChecked, inGroup, group, value, setSelfChecked]);

  const focusProps = useKeyboardActions({ onActivate: toggle }, { disabled: resolvedDisabled });

  // Own slots applied to the visual parts; chrome slots forwarded to InlineControl.
  const s = slotStyles<RadioStyles>(styles, RADIO_SLOTS, "Radio");
  const dotProps: Partial<RadioIconProps> = { ...s.get("dot"), ...s.get("icon") };

  const { background, border } = radioCircleStyle(variant, isChecked);
  const dotColor = radioDotColor(variant, isChecked);

  const circle = (
    <RadioCircle
      ref={ref}
      size={size}
      on={isChecked}
      variant={variant}
      disabled={resolvedDisabled}
      backgroundColor={background}
      borderColor={!isChecked && error ? "$color8" : border}
      onPress={toggle}
      {...ariaProps}
      {...focusProps}
      {...s.get("circle")}
      {...rest}
    >
      {isChecked ? <Icon size={size} color={iconColor ?? dotColor} {...dotProps} /> : null}
    </RadioCircle>
  );

  const visual = !isChecked && error ? <Theme name="red">{circle}</Theme> : circle;

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
      control={visual}
      styles={pick<RadioStyles, InlineControlSlots>(styles, INLINE_CONTROL_SLOTS)}
    />
  );
});

/* -------------------------------------------------------------------------- */
/* Radio.Group                                                                */
/* -------------------------------------------------------------------------- */

const GroupFrame = styled(Box, { name: "RadioGroup", flexDirection: "column", gap: "$xs" });
const GroupItems = styled(Box, {
  name: "RadioGroupItems",
  role: "radiogroup",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "$md",
});
const GroupLabel = styled(Text, { name: "RadioGroupLabel", fontWeight: "600", color: "$color" });
const GroupDescription = styled(Text, {
  name: "RadioGroupDescription",
  color: "$color",
  opacity: 0.65,
});

export interface RadioGroupProps extends Omit<GetProps<typeof GroupFrame>, "onChange"> {
  /** `Radio` children. */
  children?: React.ReactNode;
  /** Controlled selected value. */
  value?: string | null;
  /** Uncontrolled initial value. */
  defaultValue?: string | null;
  /** Called when selection changes. */
  onChange?: (value: string) => void;
  /** Size shared with every child radio. @default 'md' */
  size?: RadioSize;
  /** Group label rendered above the radios. */
  label?: React.ReactNode;
  /** Description rendered below the label. */
  description?: React.ReactNode;
  /** Disables the whole group. */
  disabled?: boolean;
  /** If set, values cannot be changed. */
  readOnly?: boolean;
  /** `name` attribute shared by all radios (a11y). Auto-generated if omitted. */
  name?: string;
}

const RadioGroup = GroupFrame.styleable<RadioGroupProps>(function RadioGroup(props, ref) {
  const {
    children,
    value,
    defaultValue,
    onChange,
    size = "md",
    label,
    description,
    disabled,
    readOnly,
    name,
    ...rest
  } = props;

  const autoName = useId(name);

  const [selected, setSelected] = useUncontrolled<string | null>({
    value: value === undefined ? undefined : value,
    defaultValue: defaultValue === undefined ? undefined : defaultValue,
    finalValue: null,
    onChange: (next) => {
      if (next !== null) {
        onChange?.(next);
      }
    },
  });

  const handleChange = React.useCallback(
    (val: string) => {
      if (readOnly) return;
      setSelected(val);
    },
    [readOnly, setSelected],
  );

  const ctx = React.useMemo<RadioGroupContextValue>(
    () => ({
      value: selected,
      onChange: handleChange,
      name: autoName,
      size,
      disabled,
    }),
    [selected, handleChange, autoName, size, disabled],
  );

  return (
    <RadioGroupContext.Provider value={ctx}>
      <GroupFrame ref={ref} {...rest}>
        {label != null ? <GroupLabel>{label}</GroupLabel> : null}
        {description != null ? <GroupDescription>{description}</GroupDescription> : null}
        <GroupItems>{children}</GroupItems>
      </GroupFrame>
    </RadioGroupContext.Provider>
  );
});

/* -------------------------------------------------------------------------- */
/* Radio.Indicator                                                            */
/* -------------------------------------------------------------------------- */

export interface RadioIndicatorProps extends Omit<
  GetProps<typeof RadioCircle>,
  "size" | "on" | "variant"
> {
  /** Checked state. */
  checked?: boolean;
  /** Visual style. @default 'filled' */
  variant?: RadioVariant;
  /** Size. @default 'md' */
  size?: RadioSize;
  /** Disables the indicator. */
  disabled?: boolean;
  /** Inner glyph component for the checked state. @default RadioIcon */
  icon?: RadioIconComponent;
  /** Override the glyph colour (defaults to the variant-derived dot colour). */
  iconColor?: TextProps["color"];
}

const RadioIndicator = RadioCircle.styleable<RadioIndicatorProps>(
  function RadioIndicator(props, ref) {
    const {
      checked,
      variant = "filled",
      size = "md",
      disabled,
      icon: Icon = RadioIcon,
      iconColor,
      ...rest
    } = props;
    const cardCtx = React.useContext(RadioCardContext);
    const isChecked = typeof checked === "boolean" ? checked : (cardCtx?.checked ?? false);
    const { background, border } = radioCircleStyle(variant, isChecked);
    const dotColor = radioDotColor(variant, isChecked);

    return (
      <RadioCircle
        ref={ref}
        size={size}
        on={isChecked}
        variant={variant}
        disabled={disabled}
        backgroundColor={background}
        borderColor={border}
        {...rest}
      >
        {isChecked ? <Icon size={size} color={iconColor ?? dotColor} /> : null}
      </RadioCircle>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Radio.Card                                                                 */
/* -------------------------------------------------------------------------- */

const RadioCardFrame = styled(Box, {
  name: "RadioCard",
  backgroundColor: "$background",
  ...webCursor("pointer"),
  borderRadius: "$sm",
  borderWidth: 1,
  borderColor: "$borderColor",

  variants: {
    checked: {
      true: { borderColor: "$color9", borderWidth: 2 },
    },
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
    shadow: shadowVariant,
  } as const,

  hoverStyle: { backgroundColor: "$color2" },
  pressStyle: { backgroundColor: "$color3" },
  ...focusRingStyle,
});

export interface RadioCardProps extends Omit<
  GetProps<typeof RadioCardFrame>,
  "checked" | "onChange"
> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state for the uncontrolled case. @default false */
  defaultChecked?: boolean;
  /** Called when the card is pressed. */
  onChange?: (checked: boolean) => void;
  /** Value used to match against a surrounding `Radio.Group`. */
  value?: string;
  /** Disables the card. */
  disabled?: boolean;
  /** Content inside the card. */
  children?: React.ReactNode;
}

const RadioCardComponent = RadioCardFrame.styleable<RadioCardProps>(function RadioCard(props, ref) {
  const {
    checked,
    defaultChecked,
    onChange,
    value,
    disabled,
    children,
    role: _role,
    "aria-label": ariaLabel,
    ...rest
  } = props;

  const group = React.useContext(RadioGroupContext);
  const inGroup = group !== null && value !== undefined;
  const [selfChecked, setSelfChecked] = useUncontrolled<boolean>({
    value: inGroup ? group!.value === value : checked,
    defaultValue: defaultChecked,
    finalValue: false,
    onChange,
  });
  const isChecked = inGroup ? group!.value === value : selfChecked;
  const isDisabled = !!(disabled || (inGroup && group!.disabled));

  const handlePress = React.useCallback(() => {
    if (isDisabled || isChecked) return;
    if (inGroup) {
      group!.onChange(value!);
    } else {
      setSelfChecked(true);
    }
  }, [isDisabled, isChecked, inGroup, group, value, setSelfChecked]);

  const focusProps = useKeyboardActions({ onActivate: handlePress }, { disabled: isDisabled });

  return (
    <RadioCardContext.Provider value={{ checked: isChecked }}>
      <RadioCardFrame
        ref={ref}
        checked={isChecked}
        disabled={isDisabled}
        onPress={handlePress}
        role="radio"
        aria-checked={isChecked}
        aria-disabled={isDisabled || undefined}
        aria-label={ariaLabel}
        {...focusProps}
        {...rest}
      >
        {children}
      </RadioCardFrame>
    </RadioCardContext.Provider>
  );
});

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export const Radio = withStaticProperties(RadioComponent, {
  Group: RadioGroup,
  Indicator: RadioIndicator,
  Card: RadioCardComponent,
});

export type { RadioIconComponent };
