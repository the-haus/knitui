import * as React from "react";

import {
  createStyledContext,
  type GetProps,
  getTokenValue,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box } from "../Box";
import { renderTextChild } from "../internal/render-text-child";
import { endRadiusVariant, fontSizeVariant, type SizeKey } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { useSlotTextWrapper } from "../internal/use-slot-text-wrapper";
import { Text } from "../Text";

type BlockquoteSize = SizeKey;
type BlockquoteIconSize = BlockquoteSize | number;
type TokenValueInput = Parameters<typeof getTokenValue>[0];

const DEFAULT_SIZE: BlockquoteSize = "md";
const DEFAULT_ICON_SIZE: BlockquoteIconSize = "xl";

const BlockquoteContext = createStyledContext<{ size: BlockquoteSize }>({
  size: DEFAULT_SIZE,
});

/**
 * Quotation block — mirrors Mantine's `Blockquote`. A solid accent border on the
 * inline-start edge, a subtle tinted surface, an optional `icon` badge floated
 * over the top-left corner, and an optional `cite`. Accent comes from the theme
 * ramp (`$color9` border, `$color2` surface, `$color11` icon); recolor via the
 * `theme` prop. `radius` rounds the inline-end corners (the bordered edge stays
 * square). Renders a `<blockquote>` element.
 */
const BlockquoteFrame = styled(Box, {
  name: "Blockquote",
  context: BlockquoteContext,
  position: "relative",
  backgroundColor: "$color2",
  borderLeftWidth: 3,
  borderLeftColor: "$color9",

  variants: {
    radius: endRadiusVariant,
    // Vertical padding stays a step below horizontal so a quote reads as a wide,
    // balanced block (not an over-tall box) — and the progression is smooth.
    size: {
      xxs: { paddingVertical: "$xs", paddingHorizontal: "$sm" },
      xs: { paddingVertical: "$sm", paddingHorizontal: "$md" },
      sm: { paddingVertical: "$md", paddingHorizontal: "$lg" },
      md: { paddingVertical: "$lg", paddingHorizontal: "$xl" },
      lg: { paddingVertical: "$xl", paddingHorizontal: "$xl" },
      xl: { paddingVertical: "$xl", paddingHorizontal: "$xxl" },
      xxl: { paddingVertical: "$xxl", paddingHorizontal: "$xxl" },
    },
  } as const,

  defaultVariants: { radius: "md", size: DEFAULT_SIZE },
});

/** Circular accent badge floated over the top-left corner. */
const BlockquoteIcon = styled(Box, {
  name: "BlockquoteIcon",
  position: "absolute",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "$background",
  borderRadius: 9999,

  variants: {
    iconSize: {
      xxs: { width: "$xxs", height: "$xxs" },
      xs: { width: "$xs", height: "$xs" },
      sm: { width: "$sm", height: "$sm" },
      md: { width: "$md", height: "$md" },
      lg: { width: "$lg", height: "$lg" },
      xl: { width: "$xl", height: "$xl" },
      xxl: { width: "$xxl", height: "$xxl" },
      ":number": (val: number) => ({ width: val, height: val }),
    },
  } as const,

  defaultVariants: { iconSize: DEFAULT_ICON_SIZE },
});

const BlockquoteText = styled(Text, {
  name: "BlockquoteText",
  context: BlockquoteContext,
  variants: {
    size: {
      ...fontSizeVariant,
    },
  } as const,
});

/** Attribution line beneath the quote — dimmed and slightly smaller. */
const BlockquoteCite = styled(Text, {
  name: "BlockquoteCite",
  context: BlockquoteContext,
  display: "flex",
  opacity: 0.6,

  variants: {
    size: {
      xxs: { marginTop: "$xxs", fontSize: "$xxs" },
      xs: { marginTop: "$xs", fontSize: "$xs" },
      sm: { marginTop: "$sm", fontSize: "$xs" },
      md: { marginTop: "$md", fontSize: "$sm" },
      lg: { marginTop: "$lg", fontSize: "$sm" },
      xl: { marginTop: "$xl", fontSize: "$md" },
      xxl: { marginTop: "$xxl", fontSize: "$lg" },
    },
  } as const,

  defaultVariants: { size: DEFAULT_SIZE },
});

type BlockquoteFrameProps = Omit<GetProps<typeof BlockquoteFrame>, "size">;

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ cite: { color: "$red9" } }}` is
 * sugar for `<Blockquote.Cite color="$red9" />`. Mirrors the gold-standard `Alert`
 * shape. The root frame is reached via top-level props, so it has no slot.
 */
export interface BlockquoteStyles {
  /** Props for the icon badge (`.Icon`). */
  icon?: GetProps<typeof BlockquoteIcon>;
  /** Props for the body text wrapper (`.Text`). */
  text?: GetProps<typeof BlockquoteText>;
  /** Props for the attribution line (`.Cite`). */
  cite?: GetProps<typeof BlockquoteCite>;
}

const BLOCKQUOTE_SLOT_KEYS = [
  "icon",
  "text",
  "cite",
] as const satisfies readonly (keyof BlockquoteStyles)[];

export interface BlockquoteProps extends BlockquoteFrameProps {
  /** Icon displayed in a badge at the top-left of the quote. */
  icon?: React.ReactNode;
  /** Width/height of the icon badge. Token sizes use the `$size` scale; numbers are px. @default "xl" */
  iconSize?: BlockquoteIconSize;
  /** Attribution for the quote, rendered beneath it. */
  cite?: React.ReactNode;
  /** Controls padding, body text, and cite spacing/type. @default "md" */
  size?: BlockquoteSize;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<BlockquoteStyles>;
}

function resolveIconOffset(iconSize: BlockquoteIconSize): number {
  if (typeof iconSize === "number") return -iconSize / 2;
  const value = getTokenValue(`$${iconSize}` as TokenValueInput, "size");
  return typeof value === "number" ? -value / 2 : -24;
}

const BlockquoteComponent = BlockquoteFrame.styleable<BlockquoteProps>(
  function Blockquote(props, ref) {
    const {
      children,
      icon,
      iconSize = DEFAULT_ICON_SIZE,
      cite,
      size = DEFAULT_SIZE,
      styles,
      ...rest
    } = props;
    const offset = resolveIconOffset(iconSize);

    // Per-slot style sugar, distributed onto the parts below.
    const s = slotStyles<BlockquoteStyles>(styles, BLOCKQUOTE_SLOT_KEYS, "Blockquote");

    // `renderTextChild` only forwards `children`, so pre-bind the `text` slot
    // props onto `BlockquoteText` via a closure wrapper before handing it off.
    const BodyText = useSlotTextWrapper(BlockquoteText, s.get("text"));

    return (
      <BlockquoteFrame ref={ref} size={size} {...rest} render="blockquote">
        {icon != null ? (
          <BlockquoteIcon
            // Slot sugar spread FIRST; the component's controlled geometry
            // (`iconSize` + corner offset) wins so the badge stays positioned.
            {...s.get("icon")}
            iconSize={iconSize}
            top="$0"
            left="$0"
            x={offset}
            y={offset}
          >
            {icon}
          </BlockquoteIcon>
        ) : null}
        {renderTextChild(children, BodyText)}
        {cite != null ? (
          typeof cite === "string" ? (
            <BlockquoteCite {...s.get("cite")} render="cite">
              {cite}
            </BlockquoteCite>
          ) : (
            cite
          )
        ) : null}
      </BlockquoteFrame>
    );
  },
);

export const Blockquote = withStaticProperties(BlockquoteComponent, {
  Frame: BlockquoteFrame,
  Icon: BlockquoteIcon,
  Text: BlockquoteText,
  Cite: BlockquoteCite,
});

export type { BlockquoteIconSize, BlockquoteSize };
