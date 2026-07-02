import * as React from "react";

import { type GetProps, getTokenValue, styled, withStaticProperties } from "@knitui/core";

import { Box } from "../Box";
import { controlMetrics } from "../internal/control-metrics";
import { useReducedTransition } from "../internal/motion";
import { renderTextChild } from "../internal/render-text-child";
import {
  type SizeKey,
  squareSizeVariantFallthrough,
  timedTransition,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { useSlotTextWrapper } from "../internal/use-slot-text-wrapper";
import { Text } from "../Text";
import { UnstyledButtonFrame } from "../UnstyledButton";

/* -------------------------------------------------------------------------- */
/* Size scale                                                                 */
/* -------------------------------------------------------------------------- */

type BurgerSize = SizeKey;
type TokenValueInput = Parameters<typeof getTokenValue>[0];

const DEFAULT_SIZE: BurgerSize = "md";

/**
 * Resolve the square side to pixels for the burger line animation geometry. The
 * `BurgerIcon` frame sizes itself off `squareSizeVariantFallthrough` (the
 * shared `$size`-token square); this resolves the SAME canonical
 * `controlMetrics[key].height` token so the animated bars line up with the
 * rendered square instead of a parallel px table. A `number` is raw pixels.
 */
const resolveSquareSide = (size: BurgerSize | number | undefined): number => {
  if (typeof size === "number") return size;
  const heightToken = controlMetrics[size ?? DEFAULT_SIZE].height;
  const value = getTokenValue(heightToken as TokenValueInput, "size");
  return typeof value === "number" ? value : 0;
};

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The focusable button wrapper. Padding uses the smallest space token around the icon.
 * Builds on `UnstyledButton` (as Mantine's `Burger` does) — `role="button"`,
 * pointer cursor, transparent reset, `focusVisible` outline and the `disabled`
 * variant are all inherited from `UnstyledButtonFrame`.
 */
const BurgerRoot = styled(UnstyledButtonFrame, {
  name: "Burger",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "$xs",
  padding: "$xxs",
});

const BurgerIcon = styled(Box, {
  name: "BurgerIcon",
  position: "relative",
  justifyContent: "center",

  variants: {
    size: {
      ...squareSizeVariantFallthrough,
    },
  } as const,

  defaultVariants: { size: DEFAULT_SIZE },
});

/** A single bar of the burger. Three of these stack to form the icon. */
const BurgerLine = styled(Box, {
  name: "BurgerLine",
  position: "absolute",
  left: 0,
  borderRadius: "$xxs",
  backgroundColor: "$color12",
});

const BurgerText = styled(Text, {
  name: "BurgerText",
  color: "$color12",
  userSelect: "none",
});

/* -------------------------------------------------------------------------- */
/* Burger                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the props
 * of the styled part it targets, so `styles={{ line: { backgroundColor: "$red9" } }}`
 * is sugar for `<Burger.Line backgroundColor="$red9" />`. The `line` slot applies
 * to all three bars; `text` applies to text children rendered via `Burger.Text`.
 */
export interface BurgerStyles {
  /** Props for the focusable button wrapper (`Burger.Root`). */
  root?: GetProps<typeof BurgerRoot>;
  /** Props for the icon square (`Burger.Icon`). */
  icon?: GetProps<typeof BurgerIcon>;
  /** Props for each of the three bars (`Burger.Line`). */
  line?: GetProps<typeof BurgerLine>;
  /** Props for text children (`Burger.Text`). */
  text?: GetProps<typeof BurgerText>;
}

const BURGER_SLOT_KEYS = [
  "root",
  "icon",
  "line",
  "text",
] as const satisfies readonly (keyof BurgerStyles)[];

export interface BurgerProps extends Omit<GetProps<typeof BurgerRoot>, "size" | "color"> {
  /** Controls burger width/height. Token size key or number (px). @default 'md' */
  size?: BurgerSize | number;
  /** Color of the burger lines. Theme color token or any CSS color. @default '$color12' */
  color?: GetProps<typeof BurgerLine>["backgroundColor"];
  /** Height of the lines; derived from `size` by default. */
  lineSize?: string | number;
  /** When `true`, the burger morphs into an X. @default false */
  opened?: boolean;
  /** Transition duration in ms. @default 300 */
  transitionDuration?: number;
  /** Transition timing function. @default 'ease' */
  transitionTimingFunction?: string;
  /** Accessible label for the button. */
  "aria-label"?: string;
  /** Content rendered after the burger icon. */
  children?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<BurgerStyles>;
}

const BurgerComponent = BurgerRoot.styleable<BurgerProps>(function Burger(props, ref) {
  const {
    size = DEFAULT_SIZE,
    color,
    lineSize,
    opened = false,
    transitionDuration = 300,
    transitionTimingFunction = "ease",
    disabled,
    children,
    "aria-label": ariaLabel,
    styles,
    ...rest
  } = props;

  const s = slotStyles<BurgerStyles>(styles, BURGER_SLOT_KEYS, "Burger");

  const diameter = resolveSquareSide(size);
  const thickness =
    lineSize == null
      ? diameter / 12
      : typeof lineSize === "number"
        ? lineSize
        : parseFloat(lineSize) || diameter / 12;

  // Center the middle line; the outer two sit a third of the diameter away.
  const center = (diameter - thickness) / 2;
  const offset = diameter / 3;

  const lineTransition = useReducedTransition(
    timedTransition(transitionDuration, transitionTimingFunction),
  );
  const rootTransition = useReducedTransition("fast");

  const buttonProps: {
    type: "button";
    "aria-pressed": boolean;
    "aria-disabled"?: boolean;
  } = {
    type: "button",
    "aria-pressed": opened,
    "aria-disabled": disabled ? true : undefined,
  };

  // `renderTextChild` only forwards `children`, so pre-bind the `text` slot props
  // onto `BurgerText` via a closure wrapper before handing it off.
  const BurgerTextSlot = useSlotTextWrapper(BurgerText, s.get("text"));

  return (
    <BurgerRoot
      ref={ref}
      disabled={disabled}
      {...rootTransition}
      {...s.get("root")}
      {...rest}
      aria-label={ariaLabel}
      render="button"
      {...buttonProps}
    >
      <BurgerIcon size={size} {...s.get("icon")}>
        {/* Top line */}
        <BurgerLine
          {...s.get("line")}
          width="100%"
          height={thickness}
          top={center - offset}
          y={opened ? offset : 0}
          rotate={opened ? "45deg" : "0deg"}
          backgroundColor={color}
          {...lineTransition}
        />
        {/* Middle line — fades out when opened */}
        <BurgerLine
          {...s.get("line")}
          width="100%"
          height={thickness}
          top={center}
          opacity={opened ? 0 : 1}
          backgroundColor={color}
          {...lineTransition}
        />
        {/* Bottom line */}
        <BurgerLine
          {...s.get("line")}
          width="100%"
          height={thickness}
          top={center + offset}
          y={opened ? -offset : 0}
          rotate={opened ? "-45deg" : "0deg"}
          backgroundColor={color}
          {...lineTransition}
        />
      </BurgerIcon>
      {renderTextChild(children, BurgerTextSlot)}
    </BurgerRoot>
  );
});

export const Burger = withStaticProperties(BurgerComponent, {
  Root: BurgerRoot,
  Icon: BurgerIcon,
  Line: BurgerLine,
  Text: BurgerText,
});

export type { BurgerSize };
