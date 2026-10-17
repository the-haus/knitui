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

/**
 * The round box. Colours are a STATIC `tone` variant (resolved per render from
 * variant + checked + error), so fill and border are compiler-known bodies:
 *
 *  tone      fill          border        dot
 *  off       background    borderColor   —
 *  filled    color9        color9        color1
 *  outline   transparent   color9        color9
 *  error     background    red8          —      (unchecked + `error`; base-theme red key)
 *
 * The focus ring is NOT in this base: `Radio.Indicator` reuses the circle and is
 * not focusable, so the ring is spread only where it is (two-layer contract).
 */
const RadioCircle = styled(Box, {
  displayName: "Radio",
  borderWidth: 2,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  ...webCursor("pointer"),

  variants: {
    size: {
      ...squareSizeVariant,
    },
    tone: {
      off: { backgroundColor: "background", borderColor: "borderColor" },
      filled: { backgroundColor: "color9", borderColor: "color9" },
      outline: { backgroundColor: "transparent", borderColor: "color9" },
      error: { backgroundColor: "background", borderColor: "red8" },
    },
    radius: radiusVariant,
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { size: "md", tone: "off" },
});

type RadioTone = "off" | "filled" | "outline" | "error";

type RadioAriaProps = {
  role: "radio";
  "aria-checked": boolean;
  "aria-disabled"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

/** The circle tone for variant + checked + error. */
const radioTone = (variant: RadioVariant, on: boolean, error: boolean): RadioTone =>
  on ? variant : error ? "error" : "off";

/** Dot colour per checked variant. */
const DOT_COLOR = { filled: "color1", outline: "color9" } as const;

/** Only the circle colours ease between checked states. */
const CIRCLE_TRANSITION_PROPERTIES = ["backgroundColor", "borderColor"] as const;

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
  /** Props for the round `RadioCircle` box (size / tone stay owned by the Radio). */
  circle: Partial<Omit<GetProps<typeof RadioCircle>, "size" | "tone">>;
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
    Omit<GetProps<typeof RadioCircle>, "size" | "tone" | "onChange" | "role">,
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

const RadioComponent = styleable<RadioProps>(RadioCircle, function Radio(props, ref) {
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
  const fade = useReducedTransition("fast");

  // Own slots applied to the visual parts; chrome slots forwarded to InlineControl.
  const s = slotStyles<RadioStyles>(styles, RADIO_SLOTS, "Radio");
  const dotSlot = s.get("dot");
  const iconSlot = s.get("icon");

  // No `<Theme name="red">` wrapper for the error state: switching the tree shape
  // would remount the (focused) circle. The `error` tone reads base-theme red.
  const visual = (
    <RadioCircle
      ref={ref}
      size={size}
      tone={radioTone(variant, isChecked, !!error)}
      disabled={resolvedDisabled}
      onPress={toggle}
      {...scopeTransition(fade, CIRCLE_TRANSITION_PROPERTIES)}
      {...ariaProps}
      {...focusProps}
      {...FOCUS_RING}
      {...s.get("circle")}
      {...rest}
    >
      {isChecked ? (
        <Icon size={size} color={iconColor ?? DOT_COLOR[variant]} {...dotSlot} {...iconSlot} />
      ) : null}
    </RadioCircle>
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
      control={visual}
      styles={pick<RadioStyles, InlineControlSlots>(styles, INLINE_CONTROL_SLOTS)}
    />
  );
});

/* -------------------------------------------------------------------------- */
/* Radio.Group                                                                */
/* -------------------------------------------------------------------------- */

const GroupFrame = styled(Box, { displayName: "RadioGroup", flexDirection: "column", gap: "xs" });
const GroupItems = styled(Box, {
  displayName: "RadioGroupItems",
  role: "radiogroup",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "md",
});
const GroupLabel = styled(Text, {
  displayName: "RadioGroupLabel",
  fontWeight: "600",
  color: "color",
});
const GroupDescription = styled(Text, {
  displayName: "RadioGroupDescription",
  color: "color",
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

const RadioGroup = styleable<RadioGroupProps>(GroupFrame, function RadioGroup(props, ref) {
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
  "size" | "tone" | "disabled"
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

const RadioIndicator = styleable<RadioIndicatorProps>(
  RadioCircle,
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

    return (
      <RadioCircle
        ref={ref}
        size={size}
        tone={radioTone(variant, isChecked, false)}
        disabled={!!disabled}
        {...rest}
      >
        {isChecked ? <Icon size={size} color={iconColor ?? DOT_COLOR[variant]} /> : null}
      </RadioCircle>
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Radio.Card                                                                 */
/* -------------------------------------------------------------------------- */

const RadioCardFrame = styled(Box, {
  displayName: "RadioCard",
  backgroundColor: "background hover:color2 press:color3",
  ...webCursor("pointer"),
  borderRadius: "sm",
  borderWidth: 1,
  borderColor: "borderColor",

  variants: {
    checked: {
      true: { borderColor: "color9", borderWidth: 2 },
    },
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
    shadow: shadowVariant,
  } as const,

  ...focusRingStyle,
});

export interface RadioCardProps extends Omit<
  GetProps<typeof RadioCardFrame>,
  "checked" | "disabled" | "onChange" | "role"
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

const RadioCardComponent = styleable<RadioCardProps>(
  RadioCardFrame,
  function RadioCard(props, ref) {
    const {
      checked,
      defaultChecked,
      onChange,
      value,
      disabled,
      children,
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
    const cardContext = React.useMemo(() => ({ checked: isChecked }), [isChecked]);

    return (
      <RadioCardContext.Provider value={cardContext}>
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
  },
);

/* -------------------------------------------------------------------------- */
/* Exports                                                                    */
/* -------------------------------------------------------------------------- */

export const Radio = withStaticProperties(RadioComponent, {
  Group: RadioGroup,
  Indicator: RadioIndicator,
  Card: RadioCardComponent,
});

export type { RadioIconComponent };
