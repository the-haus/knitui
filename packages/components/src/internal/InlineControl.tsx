import * as React from "react";

import { type GetProps, styleable, styled } from "@knitui/core";

import { Box } from "../Box";
import { Text } from "../Text";
import { fontSizeVariant, type SizeKey, webCursor } from "./style-props";
import { slotStyles, type SlotStyles } from "./styles";

/**
 * Shared size scale for the inline form controls (Switch, Checkbox, Radio).
 * Spans the full canonical `xxs → xxl` scale (`SizeKey`) — the same scale every
 * other control uses — so the inline family no longer diverges from the table.
 */
export type ControlSize = SizeKey;
type InlineControlSize = SizeKey;

/**
 * Root row holding the control next to its label stack. `alignSelf: flex-start`
 * keeps it shrunk to content (Mantine's `inline-flex` root) so the surrounding
 * layout isn't stretched.
 */
const InlineControlRoot = styled(Box, {
  displayName: "InlineControl",
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "flex-start",
  gap: "sm",

  variants: {
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,
});

/** Vertical stack: label + description + error. */
const LabelWrapper = styled(Box, {
  displayName: "InlineControlLabelWrapper",
  flexDirection: "column",
  gap: "xxs",
  flexShrink: 1,
});

const ControlLabel = styled(Text, {
  displayName: "InlineControlLabel",
  color: "color",
  ...webCursor("pointer"),
  userSelect: "none",
  variants: {
    size: fontSizeVariant,
  } as const,
  defaultVariants: { size: "sm" },
});

const ControlDescription = styled(Text, {
  displayName: "InlineControlDescription",
  color: "color",
  opacity: 0.65,
  userSelect: "none",
  variants: {
    size: fontSizeVariant,
  } as const,
  defaultVariants: { size: "sm" },
});

// The error ramp is read straight off the base theme's `red11` key rather than
// mounting a `<Theme name="red">` sub-theme per error (same colour, no theme
// provider / re-render; conventions §6).
const ControlError = styled(Text, {
  displayName: "InlineControlError",
  color: "red11",
  userSelect: "none",
  variants: {
    size: fontSizeVariant,
  } as const,
  defaultVariants: { size: "sm" },
});

/**
 * Slot → part-props map for the inline-control chrome's uniform `styles` prop
 * (Pillar B / `internal/styles.ts`). Mirrors `InputWrapperSlots`' vocabulary so a
 * consumer's `styles={{ label, description, error }}` means the SAME thing on a
 * Checkbox / Radio / Switch as it does on a TextInput. `root` here is the
 * `InlineControlRoot` row (analogous to `Input.Wrapper`'s `wrapper` slot).
 */
export interface InlineControlSlots {
  /** The outer `InlineControlRoot` row. */
  root: Partial<GetProps<typeof InlineControlRoot>>;
  /** The label `Text`. */
  label: Partial<GetProps<typeof ControlLabel>>;
  /** The description `Text` rendered below the label. */
  description: Partial<GetProps<typeof ControlDescription>>;
  /** The error `Text` rendered below the description. */
  error: Partial<GetProps<typeof ControlError>>;
}

export const INLINE_CONTROL_SLOTS = [
  "root",
  "label",
  "description",
  "error",
] as const satisfies readonly (keyof InlineControlSlots)[];

export interface InlineControlProps extends GetProps<typeof InlineControlRoot> {
  /** Shared id used to bind the control to its label/description/error. */
  id: string;
  /** Controls font-size of the label stack. @default 'md' */
  size?: InlineControlSize;
  /** Position of the label relative to the control. @default 'right' */
  labelPosition?: "left" | "right";
  /** Label content rendered next to the control. */
  label?: React.ReactNode;
  /** Description rendered below the label. */
  description?: React.ReactNode;
  /** Error rendered below the description (string nodes get the error theme). */
  error?: React.ReactNode;
  /** Dim + disable interactions for the whole row. */
  disabled?: boolean;
  /** `id` applied to the description node for `aria-describedby` wiring. */
  descriptionId?: string;
  /** `id` applied to the error node for `aria-describedby` wiring. */
  errorId?: string;
  /** The interactive control element (track / checkbox box). */
  control: React.ReactNode;
  /** Fired when the label stack is pressed — mirrors clicking a `<label>`. */
  onLabelPress?: () => void;
  /**
   * Uniform per-slot style passthrough — sugar over the chrome parts. Slots:
   * `root` / `label` / `description` / `error`. Shares the vocabulary of
   * `Input.Wrapper`'s `styles` so the label/description/error of any control are
   * uniformly stylable.
   */
  styles?: SlotStyles<InlineControlSlots>;
}

/**
 * Inline label layout shared by `Switch` and `Checkbox` — a port of Mantine's
 * `InlineInput`. Lays the control beside a label/description/error stack,
 * honouring `labelPosition`, scaling the label font with `size`, and forwarding
 * the description/error `id`s so the caller can wire `aria-describedby` onto the
 * control. Pressing the label toggles the control (like a native `<label>`),
 * and a non-boolean `error` renders in the red error colour (`red11`).
 */
export const InlineControl = styleable<InlineControlProps>(
  InlineControlRoot,
  function InlineControl(props, ref) {
    const {
      id,
      size = "md",
      labelPosition = "right",
      label,
      description,
      error,
      disabled,
      descriptionId,
      errorId,
      control,
      onLabelPress,
      styles,
      ...rest
    } = props;

    // Uniform `styles` slots, distributed onto the chrome parts below. `rest`
    // (explicit props spread on the root) is applied AFTER the `root` slot so an
    // explicit prop always wins over the sugar.
    const s = slotStyles<InlineControlSlots>(styles, INLINE_CONTROL_SLOTS, "InlineControl");

    const hasSupportingContent = description != null || (error != null && error !== true);
    const hasLabelContent = label != null || hasSupportingContent;

    const labelStack = hasLabelContent ? (
      <LabelWrapper onPress={onLabelPress}>
        {label != null ? (
          <ControlLabel id={id ? `${id}-label` : undefined} size={size} {...s.get("label")}>
            {label}
          </ControlLabel>
        ) : null}
        {description != null ? (
          <ControlDescription id={descriptionId} size={size} {...s.get("description")}>
            {description}
          </ControlDescription>
        ) : null}
        {error != null && error !== true ? (
          <ControlError id={errorId} size={size} {...s.get("error")}>
            {error}
          </ControlError>
        ) : null}
      </LabelWrapper>
    ) : null;

    return (
      <InlineControlRoot
        ref={ref}
        disabled={disabled}
        alignItems={hasSupportingContent ? "flex-start" : "center"}
        {...s.get("root")}
        {...rest}
      >
        {labelPosition === "left" ? labelStack : null}
        {control}
        {labelPosition === "right" ? labelStack : null}
      </InlineControlRoot>
    );
  },
);
