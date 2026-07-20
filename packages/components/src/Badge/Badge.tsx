import * as React from "react";

import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Box } from "../Box";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { type GradientValue, useGradient } from "../internal/gradient";
import { renderTextChild } from "../internal/render-text-child";
import {
  controlFontVariant,
  controlGapVariant,
  controlTextColorVariant,
  pickVariants,
  radiusVariant,
  type SizeKey,
  surfaceColorVariant,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

type BadgeSize = SizeKey;
type BadgeVariant =
  "filled" | "light" | "outline" | "dot" | "transparent" | "white" | "default" | "gradient";

const BadgeContext = createStyledContext<{ size: BadgeSize | number; variant: BadgeVariant }>({
  size: "md",
  variant: "light",
});

/**
 * Compact status label — mirrors Mantine's `Badge`. Accent comes from the
 * `theme` prop (palette ramp), not a `color` prop. `variant` picks the fill,
 * `size` the metrics, `radius` the rounding (pill by default), `circle` makes a
 * square-aspect badge for a single glyph, plus `leftSection`/`rightSection`.
 */
const BadgeFrame = styled(Box, {
  name: "Badge",
  context: BadgeContext,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "flex-start",
  borderRadius: 999,
  borderWidth: 1,
  borderColor: "transparent",
  overflow: "hidden",

  variants: {
    // Static fill from the shared `variant-colors` ladder (no hover/press — a
    // badge isn't interactive). `dot` replaces `subtle` for the pill family.
    variant: {
      ...pickVariants(surfaceColorVariant, [
        "filled",
        "light",
        "outline",
        "dot",
        "transparent",
        "white",
        "default",
        "gradient",
      ]),
    },
    size: controlGapVariant,
    radius: radiusVariant,
    circle: {
      true: { paddingHorizontal: 0, aspectRatio: 1 },
    },
    fullWidth: {
      true: { alignSelf: "stretch", width: "100%" },
    },
  } as const,

  defaultVariants: { variant: "light", size: "md" },
});

const BadgeText = styled(Text, {
  name: "BadgeText",
  context: BadgeContext,
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: 0,
  numberOfLines: 1,
  variants: {
    // Label color per variant — shared emphasis ladder, restricted to Badge's set.
    variant: {
      ...pickVariants(controlTextColorVariant, [
        "filled",
        "light",
        "outline",
        "dot",
        "transparent",
        "white",
        "default",
        "gradient",
      ]),
    },
    size: {
      ...controlFontVariant,
      ":number": (val: number) => ({ fontSize: Math.max(10, Math.round(val * 0.5)) }),
    },
  } as const,
});

const BadgeDot = styled(Box, {
  name: "BadgeDot",
  context: BadgeContext,
  borderRadius: 999,
  backgroundColor: "$color9",
  variants: {
    // Intentional non-1:1 mapping — the dot is deliberately smaller than the
    // badge size key so it reads as an accent, not a full-height glyph.
    size: {
      xxs: { width: "$xxs", height: "$xxs" },
      xs: { width: "$xxs", height: "$xxs" },
      sm: { width: "$xxs", height: "$xxs" },
      md: { width: "$xs", height: "$xs" },
      lg: { width: "$xs", height: "$xs" },
      xl: { width: "$sm", height: "$sm" },
      xxl: { width: "$md", height: "$md" },
      ":number": (val: number) => ({
        width: Math.max(16, Math.round(val * 0.5)),
        height: Math.max(16, Math.round(val * 0.5)),
      }),
    },
  } as const,
});

/**
 * Named slots for {@link BadgeStyles} (Pillar B / `internal/styles.ts`). Each key
 * maps to the props of the styled part it targets, so
 * `styles={{ text: { color: "$red9" } }}` is sugar for `<Badge.Text color="$red9" />`.
 * Note: `leftSection`/`rightSection` are CONTENT slots (ReactNode), not style
 * slots — they stay on the props API (same family as Button's sections).
 */
export interface BadgeStyles {
  /** Props spread onto the badge frame (`.Frame`). */
  root?: GetProps<typeof BadgeFrame>;
  /** Props spread onto the badge label text (`.Text`). */
  text?: GetProps<typeof BadgeText>;
  /** Props spread onto the accent dot shown in the `dot` variant (`.Dot`). */
  dot?: GetProps<typeof BadgeDot>;
}

const BADGE_SLOT_KEYS = ["root", "text", "dot"] as const satisfies readonly (keyof BadgeStyles)[];

export interface BadgeProps extends GetProps<typeof BadgeFrame> {
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<BadgeStyles>;
  /**
   * Gradient fill for `variant="gradient"` (ignored otherwise). Two-color
   * shorthand `{ from, to, deg }` or multi-step `{ stops, deg }`; colors accept
   * `$colorN` ramp tokens or any CSS color. Defaults to the active theme ramp.
   */
  gradient?: GradientValue;
}

const BadgeComponent = BadgeFrame.styleable<BadgeProps>(function Badge(props, ref) {
  const {
    children,
    variant = "light",
    size = "md",
    leftSection,
    rightSection,
    styles,
    gradient,
    ...rest
  } = props;

  // Per-slot style sugar, distributed onto the parts below.
  const s = slotStyles<BadgeStyles>(styles, BADGE_SLOT_KEYS, "Badge");

  // Gradient fill (only when `variant="gradient"`): web paints a CSS
  // `backgroundImage`; native renders the `layer` behind the content.
  const grad = useGradient(variant === "gradient" ? gradient : undefined);

  // Inject the `text` slot props into the wrapper `renderTextChild` auto-applies
  // around string/number children, so the label slot reaches the auto-wrapped text.
  const textSlot = s.get("text");
  const BadgeLabel = React.useMemo(
    () =>
      function BadgeLabel({ children: labelChildren }: { children: React.ReactNode }) {
        return <BadgeText {...textSlot}>{labelChildren}</BadgeText>;
      },
    [textSlot],
  );

  return (
    <BadgeFrame
      ref={ref}
      variant={variant}
      size={size}
      {...grad.frameProps}
      {...s.get("root")}
      {...rest}
    >
      {grad.layer}
      {variant === "dot" ? (
        <BadgeDot size={size} {...s.get("dot")} />
      ) : leftSection != null ? (
        // Section icons auto-match the badge label color (shared emphasis ladder)
        // and `size`, so `<Badge leftSection={<IconStar/>} />` needs no sizing.
        <ControlIconProvider size={size} variant={variant}>
          {leftSection}
        </ControlIconProvider>
      ) : null}
      {renderTextChild(children, BadgeLabel)}
      {rightSection != null ? (
        <ControlIconProvider size={size} variant={variant}>
          {rightSection}
        </ControlIconProvider>
      ) : null}
    </BadgeFrame>
  );
});

export const Badge = withStaticProperties(BadgeComponent, {
  Text: BadgeText,
  Dot: BadgeDot,
  Frame: BadgeFrame,
});

export type { BadgeSize, BadgeVariant };
