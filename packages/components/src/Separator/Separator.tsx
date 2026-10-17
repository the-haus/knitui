import * as React from "react";

import { type GetProps, styleable, styled, withStaticProperties } from "@knitui/core";

import { Box } from "../Box";
import { renderTextChild } from "../internal/render-text-child";
import { fontSizeVariant, type SizeKey, tableVariant } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

type SeparatorSize = SizeKey | number;
type SeparatorVariant = "solid" | "dashed" | "dotted";
type SeparatorOrientation = "horizontal" | "vertical";
type SeparatorLabelPosition = "left" | "center" | "right";

/** Line thickness per size key (px); a number is a raw px thickness. */
const THICKNESS = { xxs: 1, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 } as const;

const horizontalSizeVariant = tableVariant(
  {
    xxs: { borderBottomWidth: THICKNESS.xxs },
    xs: { borderBottomWidth: THICKNESS.xs },
    sm: { borderBottomWidth: THICKNESS.sm },
    md: { borderBottomWidth: THICKNESS.md },
    lg: { borderBottomWidth: THICKNESS.lg },
    xl: { borderBottomWidth: THICKNESS.xl },
    xxl: { borderBottomWidth: THICKNESS.xxl },
  },
  (px: number) => ({ borderBottomWidth: px }),
);

const verticalSizeVariant = tableVariant(
  {
    xxs: { borderLeftWidth: THICKNESS.xxs },
    xs: { borderLeftWidth: THICKNESS.xs },
    sm: { borderLeftWidth: THICKNESS.sm },
    md: { borderLeftWidth: THICKNESS.md },
    lg: { borderLeftWidth: THICKNESS.lg },
    xl: { borderLeftWidth: THICKNESS.xl },
    xxl: { borderLeftWidth: THICKNESS.xxl },
  },
  (px: number) => ({ borderLeftWidth: px }),
);

const variantStyles = {
  solid: { borderStyle: "solid" },
  dashed: { borderStyle: "dashed" },
  dotted: { borderStyle: "dotted" },
} as const;

const SeparatorRoot = styled(Box, {
  displayName: "Separator",
  role: "separator",
  borderColor: "borderColor",
  // Pin all sides to 0 so only the side a size variant sets gets a width.
  // Without this, the three sides we never set fall back to the CSS default
  // border width (`medium` = 3px) once `borderStyle` is applied, drawing a box.
  borderWidth: 0,

  variants: {
    variant: variantStyles,
    orientation: {
      horizontal: { alignSelf: "stretch", height: 0 },
      vertical: { alignSelf: "stretch", width: 0 },
    },
    horizontalSize: horizontalSizeVariant,
    verticalSize: verticalSizeVariant,
    labeled: {
      true: {
        alignItems: "center",
        alignSelf: "stretch",
        flexDirection: "row",
        gap: "sm",
      },
    },
  } as const,

  defaultVariants: { variant: "solid" },
});

const SeparatorLine = styled(Box, {
  displayName: "SeparatorLine",
  borderColor: "borderColor",
  // See SeparatorRoot: pin to 0 so only the bottom border (set by `size`) shows.
  borderWidth: 0,
  flexGrow: 1,
  height: 0,

  variants: {
    variant: variantStyles,
    size: horizontalSizeVariant,
  } as const,

  defaultVariants: { variant: "solid", size: "md" },
});

const SeparatorLabel = styled(Text, {
  displayName: "SeparatorLabel",
  color: "color11",
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
 * of the styled part it targets, so `styles={{ label: { color: "red9" } }}` is
 * sugar for `<Separator.Label color="red9" />`. The root is reached via top-level
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
const SeparatorBase = styleable<SeparatorProps>(SeparatorRoot, function Separator(props, ref) {
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
