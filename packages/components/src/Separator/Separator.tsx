import * as React from "react";

import { type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Box } from "../Box";
import { renderTextChild } from "../internal/render-text-child";
import { fontSizeVariant, type SizeKey } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

type SeparatorSize = SizeKey | number;
type SeparatorVariant = "solid" | "dashed" | "dotted";
type SeparatorOrientation = "horizontal" | "vertical";
type SeparatorLabelPosition = "left" | "center" | "right";

const horizontalSizeVariant = {
  xxs: { borderBottomWidth: 1 },
  xs: { borderBottomWidth: 1 },
  sm: { borderBottomWidth: 2 },
  md: { borderBottomWidth: 3 },
  lg: { borderBottomWidth: 4 },
  xl: { borderBottomWidth: 5 },
  xxl: { borderBottomWidth: 6 },
  ":number": (value: number) => ({ borderBottomWidth: value }),
} as const;

const verticalSizeVariant = {
  xxs: { borderLeftWidth: 1 },
  xs: { borderLeftWidth: 1 },
  sm: { borderLeftWidth: 2 },
  md: { borderLeftWidth: 3 },
  lg: { borderLeftWidth: 4 },
  xl: { borderLeftWidth: 5 },
  xxl: { borderLeftWidth: 6 },
  ":number": (value: number) => ({ borderLeftWidth: value }),
} as const;

const variantStyles = {
  solid: { borderStyle: "solid" },
  dashed: { borderStyle: "dashed" },
  dotted: { borderStyle: "dotted" },
} as const;

const SeparatorRoot = styled(Box, {
  name: "Separator",
  role: "separator",
  borderColor: "$borderColor",
  // Pin all sides to 0 so only the side a size variant sets gets a width.
  // Without this, the three sides we never set fall back to the CSS default
  // border width (`medium` = 3px) once `borderStyle` is applied, drawing a box.
  borderWidth: 0,

  variants: {
    variant: variantStyles,
    orientation: {
      horizontal: { alignSelf: "stretch", height: "$0" },
      vertical: { alignSelf: "stretch", width: "$0" },
    },
    horizontalSize: horizontalSizeVariant,
    verticalSize: verticalSizeVariant,
    labeled: {
      true: {
        alignItems: "center",
        alignSelf: "stretch",
        flexDirection: "row",
        gap: "$sm",
      },
    },
  } as const,

  defaultVariants: { variant: "solid" },
});

const SeparatorLine = styled(Box, {
  name: "SeparatorLine",
  borderColor: "$borderColor",
  // See SeparatorRoot: pin to 0 so only the bottom border (set by `size`) shows.
  borderWidth: 0,
  flexGrow: 1,
  height: "$0",

  variants: {
    variant: variantStyles,
    size: horizontalSizeVariant,
  } as const,

  defaultVariants: { variant: "solid", size: "md" },
});

const SeparatorLabel = styled(Text, {
  name: "SeparatorLabel",
  color: "$color11",
  flexShrink: 0,

  variants: {
    size: fontSizeVariant,
  } as const,

  defaultVariants: { size: "sm" },
});

type SeparatorRootProps = Omit<
  GetProps<typeof SeparatorRoot>,
  "children" | "horizontalSize" | "labeled" | "orientation" | "size" | "variant" | "verticalSize"
>;

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ label: { color: "$red9" } }}` is
 * sugar for `<Separator.Label color="$red9" />`. The root is reached via top-level
 * props, so it has no slot.
 */
export interface SeparatorStyles {
  /** Props for the divider line(s) (`.Line`) — applied to both lines in labeled mode. */
  line?: GetProps<typeof SeparatorLine>;
  /** Props for the label text (`.Label`). */
  label?: GetProps<typeof SeparatorLabel>;
}

const SEPARATOR_SLOT_KEYS = ["line", "label"] as const satisfies readonly (keyof SeparatorStyles)[];

export interface SeparatorProps extends SeparatorRootProps {
  /** Line orientation. */
  orientation?: SeparatorOrientation;
  /** Line style. */
  variant?: SeparatorVariant;
  /** Thickness — a size key (xxs→xxl) or a px number. Default `md`. */
  size?: SeparatorSize;
  /** Optional label rendered over the line (horizontal only). */
  label?: React.ReactNode;
  /** Where the label sits along the line. */
  labelPosition?: SeparatorLabelPosition;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<SeparatorStyles>;
}

/**
 * Divider line — mirrors Mantine's `Divider`. Supports `variant`
 * (solid/dashed/dotted), `size`, `orientation`, and a centered/left/right
 * `label`. Carries `role="separator"`.
 */
const SeparatorBase = SeparatorRoot.styleable<SeparatorProps>(function Separator(props, ref) {
  const {
    orientation = "horizontal",
    variant = "solid",
    size = "md",
    label,
    labelPosition = "center",
    styles,
    ...rest
  } = props;

  // Per-slot style sugar, distributed onto the parts below.
  const s = slotStyles<SeparatorStyles>(styles, SEPARATOR_SLOT_KEYS, "Separator");

  if (label != null && orientation === "horizontal") {
    // `renderTextChild` only forwards `children`, so pre-bind the `label` slot
    // props onto `SeparatorLabel` via a closure wrapper before handing it off.
    const labelProps = s.get("label");
    const LabelText = ({ children: labelChildren }: { children: React.ReactNode }) => (
      <SeparatorLabel {...labelProps}>{labelChildren}</SeparatorLabel>
    );

    return (
      <SeparatorRoot
        ref={ref}
        {...rest}
        role="separator"
        aria-orientation="horizontal"
        labeled
        variant={variant}
      >
        {labelPosition !== "left" ? (
          // Slot sugar spread FIRST; controlled `size`/`variant` win.
          <SeparatorLine {...s.get("line")} size={size} variant={variant} />
        ) : null}
        {renderTextChild(label, LabelText)}
        {labelPosition !== "right" ? (
          <SeparatorLine {...s.get("line")} size={size} variant={variant} />
        ) : null}
      </SeparatorRoot>
    );
  }

  if (orientation === "horizontal") {
    return (
      <SeparatorRoot
        ref={ref}
        {...rest}
        role="separator"
        aria-orientation="horizontal"
        horizontalSize={size}
        orientation="horizontal"
        variant={variant}
      />
    );
  }

  return (
    <SeparatorRoot
      ref={ref}
      {...rest}
      role="separator"
      aria-orientation="vertical"
      orientation="vertical"
      variant={variant}
      verticalSize={size}
    />
  );
});

export const Separator = withStaticProperties(SeparatorBase, {
  Label: SeparatorLabel,
  Line: SeparatorLine,
  Root: SeparatorRoot,
});

export type { SeparatorLabelPosition, SeparatorOrientation, SeparatorSize, SeparatorVariant };
