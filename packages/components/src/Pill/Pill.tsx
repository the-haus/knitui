import * as React from "react";

import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Box } from "../Box";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
import { type GradientValue, useGradient } from "../internal/gradient";
import { renderTextChild } from "../internal/render-text-child";
import {
  controlFontVariant,
  controlGapVariant,
  radiusVariant,
  type SizeKey,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

type PillSize = SizeKey;
type PillVariant = "default" | "contrast" | "gradient";

const PillContext = createStyledContext<{ size: PillSize; variant: PillVariant }>({
  size: "sm",
  variant: "default",
});

type CloseButtonSize = NonNullable<CloseButtonProps["size"]>;
type CloseButtonIconSize = NonNullable<CloseButtonProps["iconSize"]>;
type CloseButtonPressHandler = NonNullable<CloseButtonProps["onPress"]>;

const REMOVE_BUTTON_SIZE: Record<PillSize, CloseButtonSize> = {
  xxs: "xxs",
  xs: "xxs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
  xxl: "xl",
};

const REMOVE_ICON_SIZE: Record<PillSize, CloseButtonIconSize> = {
  xxs: "$xxs",
  xs: "$xs",
  sm: "$sm",
  md: "$md",
  lg: "$lg",
  xl: "$xl",
  xxl: "$xxl",
};

/**
 * Mirrors Mantine's `Pill` — a small rounded label, optionally with a remove
 * button. Inside a `Pill.Group` it inherits `size`/`disabled`. The `contrast`
 * variant uses the active theme's solid accent (`$color9`); colour comes from the
 * `theme` prop + palette ramp, never a Mantine `color` prop.
 */
const PillFrame = styled(Box, {
  name: "Pill",
  context: PillContext,
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "flex-start",
  gap: "$xs",
  borderRadius: 9999,
  overflow: "hidden",

  variants: {
    variant: {
      default: { backgroundColor: "$color4" },
      contrast: { backgroundColor: "$color9" },
      // Base stays transparent; the gradient is painted at render by `useGradient`.
      gradient: { backgroundColor: "transparent" },
    },
    size: controlGapVariant,
    radius: radiusVariant,
    disabled: {
      true: { opacity: 0.5, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { variant: "default", size: "sm" },
});

const PillLabel = styled(Text, {
  name: "PillLabel",
  context: PillContext,
  numberOfLines: 1,
  userSelect: "none",

  variants: {
    variant: {
      default: { color: "$color12" },
      contrast: { color: "$color1" },
      gradient: { color: "$white" },
    },
    size: {
      ...controlFontVariant,
    },
  } as const,
});

// --- Pill.Group ------------------------------------------------------------

interface PillGroupContextValue {
  size?: PillSize;
  disabled?: boolean;
}

const PillGroupContext = React.createContext<PillGroupContextValue | null>(null);

export interface PillGroupProps extends Omit<GetProps<typeof Box>, "gap"> {
  /**
   * Size of child `Pill`s. Inherits from an enclosing provider (e.g. a
   * `PillsInput`, which sizes its pills relative to the field) when left unset.
   * @default "sm"
   */
  size?: PillSize;
  /** Gap between pills — token string or px number. @default "$xs" */
  gap?: GetProps<typeof Box>["gap"];
  /** Disable all child pills. */
  disabled?: boolean;
  /** `Pill` children. */
  children?: React.ReactNode;
}

const PillGroupFrame = styled(Box, {
  name: "PillGroup",
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "$xs",
});

const PillGroup = PillGroupFrame.styleable<PillGroupProps>(function PillGroup(props, ref) {
  const { size, gap = "$xs", disabled, children, ...rest } = props;
  // Inherit size/disabled from an enclosing provider (e.g. a `PillsInput`, which
  // provides a field-relative pill size) when this group doesn't set its own.
  const parentGroup = React.useContext(PillGroupContext);
  const resolvedSize: PillSize = size ?? parentGroup?.size ?? "sm";
  const resolvedDisabled = disabled ?? parentGroup?.disabled;
  const ctx = React.useMemo<PillGroupContextValue>(
    () => ({ size: resolvedSize, disabled: resolvedDisabled }),
    [resolvedSize, resolvedDisabled],
  );
  return (
    <PillGroupContext.Provider value={ctx}>
      <PillGroupFrame ref={ref} gap={gap} {...rest}>
        {children}
      </PillGroupFrame>
    </PillGroupContext.Provider>
  );
});

// --- Pill ------------------------------------------------------------------

/**
 * Named style slots (Pillar B / `internal/styles.ts`) for `Pill`. Each key maps
 * to the props of the styled part it targets, so
 * `styles={{ removeButton: { backgroundColor: "$color5" } }}` is sugar for
 * `<Pill.RemoveButton backgroundColor="$color5" />`.
 */
export interface PillStyles {
  /** Props for the label text (`Pill.Label`). */
  label?: GetProps<typeof PillLabel>;
  /** Props for the trailing remove button (`Pill.RemoveButton`). */
  removeButton?: Partial<CloseButtonProps>;
}

const PILL_SLOT_KEYS = ["label", "removeButton"] as const satisfies readonly (keyof PillStyles)[];

export interface PillProps extends Omit<
  GetProps<typeof PillFrame>,
  "variant" | "size" | "disabled" | "children"
> {
  /** Visual style. @default "default" */
  variant?: PillVariant;
  /** Pill size. @default "sm" (or the enclosing `Pill.Group`'s size) */
  size?: PillSize;
  /** Show a trailing remove button. @default false */
  withRemoveButton?: boolean;
  /** Called when the remove button is pressed. */
  onRemove?: () => void;
  /**
   * Props for the remove button. Spread OVER the `removeButton` style slot, so
   * an explicit `removeButtonProps` wins over `styles={{ removeButton }}`.
   */
  removeButtonProps?: Partial<CloseButtonProps>;
  /** Disabled state (also inherited from `Pill.Group`). */
  disabled?: boolean;
  /** Pill label. */
  children?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<PillStyles>;
  /**
   * Gradient fill for `variant="gradient"` (ignored otherwise). Two-color
   * shorthand `{ from, to, deg }` or multi-step `{ stops, deg }`; colors accept
   * `$colorN` ramp tokens or any CSS color. Defaults to the active theme ramp.
   */
  gradient?: GradientValue;
}

const PillComponent = PillFrame.styleable<PillProps>(function Pill(props, ref) {
  const {
    variant = "default",
    size,
    withRemoveButton = false,
    onRemove,
    removeButtonProps,
    disabled,
    children,
    styles,
    gradient,
    ...rest
  } = props;

  const s = slotStyles<PillStyles>(styles, PILL_SLOT_KEYS, "Pill");

  // Gradient fill (only when `variant="gradient"`): web paints a CSS
  // `backgroundImage`; native renders the `layer` (an SVG fill) behind the label.
  const grad = useGradient(variant === "gradient" ? gradient : undefined);
  const group = React.useContext(PillGroupContext);
  const resolvedSize: PillSize = size ?? group?.size ?? "sm";
  const isDisabled = disabled ?? group?.disabled ?? false;
  const removeButtonOnPress = removeButtonProps?.onPress;
  const removeButtonLabel =
    removeButtonProps?.["aria-label"] ?? s.get("removeButton")?.["aria-label"] ?? "Remove";
  const handleRemovePress = React.useCallback<CloseButtonPressHandler>(
    (event) => {
      if (isDisabled) return;
      onRemove?.();
      removeButtonOnPress?.(event);
    },
    [isDisabled, onRemove, removeButtonOnPress],
  );

  // Bind the `label` slot props onto the label wrapper that `renderTextChild`
  // emits for text children (`styles={{ label }}` → `<Pill.Label … />`).
  const labelSlot = s.get("label");
  const LabelWrapper = React.useMemo<React.FC<{ children: React.ReactNode }>>(
    () =>
      function PillLabelWrapper(wrapperProps) {
        return <PillLabel {...labelSlot} {...wrapperProps} />;
      },
    [labelSlot],
  );

  return (
    <PillFrame
      ref={ref}
      variant={variant}
      size={resolvedSize}
      disabled={isDisabled}
      {...grad.frameProps}
      {...rest}
    >
      {grad.layer}
      {renderTextChild(children, LabelWrapper)}
      {withRemoveButton ? (
        <CloseButton
          variant="transparent"
          size={REMOVE_BUTTON_SIZE[resolvedSize]}
          iconSize={REMOVE_ICON_SIZE[resolvedSize]}
          // On a gradient pill the label is white, so default the remove glyph to
          // white too (a transparent CloseButton would otherwise show a dark `✕`).
          // Spread first so an explicit `removeButton` slot / props still win.
          {...(variant === "gradient" ? { styles: { icon: { color: "$white" } } } : null)}
          // Precedence (low → high): the `removeButton` slot sugar, then the
          // deprecated `removeButtonProps` alias, then the forced per-part props
          // (resolved aria-label / press handler that fold in the alias).
          {...s.get("removeButton")}
          {...removeButtonProps}
          aria-label={removeButtonLabel}
          aria-disabled={isDisabled || undefined}
          disabled={isDisabled}
          onPress={handleRemovePress}
        />
      ) : null}
    </PillFrame>
  );
});

export const Pill = withStaticProperties(PillComponent, {
  Group: PillGroup,
  Label: PillLabel,
  Frame: PillFrame,
  RemoveButton: CloseButton,
});

export { PillGroupContext };
export type { PillGroupContextValue, PillSize, PillVariant };
