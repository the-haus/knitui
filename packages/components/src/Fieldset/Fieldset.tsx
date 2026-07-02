import * as React from "react";

import { type GetProps, isWeb, styled, withStaticProperties } from "@knitui/core";
import { useId } from "@knitui/hooks";

import { Box } from "../Box";
import { radiusVariant, shadowVariant } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export type FieldsetVariant = "default" | "filled" | "unstyled";

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Fieldset frame — mirrors Mantine's `.root`. `default` draws a border on the
 * page background, `filled` swaps in a subtle fill, `unstyled` strips chrome.
 * Padding is symmetric `lg` on all sides: unlike Mantine we render the legend as
 * a normal in-flow block (not a native `<legend>` overlapping the top border), so
 * the Mantine "snug `xs` top" trick would just leave the legend cramped.
 * `margin: 0` clears the browser's UA `margin-inline: 2px` on `<fieldset>`.
 */
const FieldsetFrame = styled(Box, {
  name: "Fieldset",
  flexDirection: "column",
  padding: "$lg",
  borderRadius: "$md",

  margin: 0,
  minWidth: 0,

  variants: {
    variant: {
      default: {
        borderWidth: 1,
        borderColor: "$borderColor",
        backgroundColor: "$background",
      },
      filled: {
        borderWidth: 1,
        borderColor: "$borderColor",
        backgroundColor: "$color2",
      },
      unstyled: {
        padding: 0,
        borderWidth: 0,
        borderRadius: 0,
      },
    },
    radius: radiusVariant,
    shadow: shadowVariant,
    // Mantine's `<fieldset disabled>` cascade: dim the group and block
    // interaction with every control inside it. `pointerEvents: "none"` disables
    // pointer interaction cross-platform (web + native); the opacity matches
    // Mantine's disabled affordance.
    disabledState: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { variant: "default" },
});

// NB: rendered as a normal block element, NOT a native <legend>. A native
// <legend> inside Tamagui's flex <fieldset> hits the browser's special
// "rendered legend" path and collapses to a ~1px box (clipping the text); width/
// float/display tweaks don't restore its height. We keep the semantic <fieldset>
// (so its native `disabled` cascade still works) and name it via `aria-labelledby`.
const FieldsetLegend = styled(Text, {
  name: "FieldsetLegend",
  fontSize: "$sm",
  fontWeight: "600",
  color: "$color",
  marginBottom: "$xs",

  variants: {
    unstyled: {
      true: { marginBottom: "$sm" },
    },
  } as const,
});

/* -------------------------------------------------------------------------- */
/* Fieldset                                                                   */
/* -------------------------------------------------------------------------- */

type FieldsetFrameProps = Omit<GetProps<typeof FieldsetFrame>, "disabled" | "disabledState">;

/**
 * Named style slots (Pillar B / `internal/styles.ts`) for `Fieldset`. Each key
 * maps to the props of the styled part it targets, so
 * `styles={{ legend: { color: "$red9" } }}` is sugar for
 * `<Fieldset.Legend color="$red9" />`.
 */
export interface FieldsetStyles {
  /** Props for the fieldset frame (`Fieldset.Frame`). */
  root?: FieldsetFrameProps;
  /** Props for the legend text (`Fieldset.Legend`). */
  legend?: GetProps<typeof FieldsetLegend>;
}

const FIELDSET_SLOT_KEYS = ["root", "legend"] as const satisfies readonly (keyof FieldsetStyles)[];

export interface FieldsetProps extends FieldsetFrameProps {
  /** Legend rendered at the top of the fieldset. */
  legend?: React.ReactNode;

  /** Dims the fieldset and blocks interaction with the controls inside it. */
  disabled?: boolean;

  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<FieldsetStyles>;
}

/**
 * Fieldset — groups related form controls under an optional `legend`. Mirrors
 * Mantine's `Fieldset`: `variant` (`default` / `filled` / `unstyled`), `radius`,
 * and `legend`. Renders a semantic `<fieldset>`/`<legend>` on web (no-op tag on
 * native).
 */
const FieldsetComponent = FieldsetFrame.styleable<FieldsetProps>(function Fieldset(props, ref) {
  const { legend, variant = "default", disabled, children, styles, ...rest } = props;
  const s = slotStyles<FieldsetStyles>(styles, FIELDSET_SLOT_KEYS, "Fieldset");
  const uid = useId();
  const legendId = legend != null ? `${uid}-legend` : undefined;
  const fieldsetRender = isWeb ? <fieldset disabled={disabled ? true : undefined} /> : "fieldset";

  return (
    <FieldsetFrame
      ref={ref}
      variant={variant}
      disabledState={disabled}
      {...s.get("root")}
      {...rest}
      aria-disabled={disabled || undefined}
      aria-labelledby={legendId}
      render={fieldsetRender}
    >
      {legend != null ? (
        <FieldsetLegend id={legendId} unstyled={variant === "unstyled"} {...s.get("legend")}>
          {legend}
        </FieldsetLegend>
      ) : null}
      {children}
    </FieldsetFrame>
  );
});

export const Fieldset = withStaticProperties(FieldsetComponent, {
  Frame: FieldsetFrame,
  Legend: FieldsetLegend,
});
