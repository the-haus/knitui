import * as React from "react";

import {
  type GetProps,
  getTokenValue,
  type SpaceTokens,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { radiusVariant, shadowVariant } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";

const DEFAULT_PADDING: SpaceTokens = "$lg";

/** Resolve a padding prop (token or number) to a px number for the bleed math. */
const resolvePadding = (p: SpaceTokens | number): number => {
  if (typeof p === "number") return p;
  const value = getTokenValue(p as Parameters<typeof getTokenValue>[0], "space");
  return typeof value === "number" ? value : 0;
};

interface CardContextValue {
  /** Resolved card padding in px — used by `Card.Section` for its full-bleed margins. */
  padding: number;
  orientation: "horizontal" | "vertical";
}

const CardContext = React.createContext<CardContextValue>({
  padding: resolvePadding(DEFAULT_PADDING),
  orientation: "vertical",
});

const CardFrame = styled(Box, {
  name: "Card",
  flexDirection: "column",
  backgroundColor: "$background",
  borderColor: "$borderColor",
  borderRadius: "$md",
  padding: DEFAULT_PADDING,
  gap: "$sm",
  variants: {
    shadow: shadowVariant,
    radius: radiusVariant,
    withBorder: {
      true: { borderWidth: 1 },
    },
    orientation: {
      horizontal: { flexDirection: "row" },
      vertical: { flexDirection: "column" },
    },
  } as const,
  defaultVariants: {
    orientation: "vertical",
  },
});

const CardSectionFrame = styled(Box, {
  name: "CardSection",
});

export interface CardSectionProps extends GetProps<typeof CardSectionFrame> {
  /** Draw a border on the edges adjacent to sibling sections. */
  withBorder?: boolean;
  /**
   * Restore the parent `Card`'s padding on the bleed axis, so the section's
   * content lines up with the card body while the section itself still spans
   * edge-to-edge (e.g. a header strip).
   */
  inheritPadding?: boolean;
  /** @internal First card child — injected by `Card` to negate the leading edge. */
  __first?: boolean;
  /** @internal Last card child — injected by `Card` to negate the trailing edge. */
  __last?: boolean;
}

/** Style keys the bleed math targets, narrowed off `BoxProps`. */
type SectionBleed = Pick<
  BoxProps,
  | "marginLeft"
  | "marginRight"
  | "marginTop"
  | "marginBottom"
  | "paddingHorizontal"
  | "paddingVertical"
>;

/**
 * Full-bleed card region — mirrors Mantine's `Card.Section`. It negates the
 * card's padding so it spans edge-to-edge; the first/last sections also cancel
 * the card's leading/trailing padding (flagged by `Card` via `__first`/`__last`).
 * `inheritPadding` re-insets the content; `withBorder` adds dividers.
 */
const CardSection = CardSectionFrame.styleable<CardSectionProps>(function CardSection(props, ref) {
  const { withBorder, inheritPadding, __first, __last, ...rest } = props;
  const { padding, orientation } = React.useContext(CardContext);
  const isHorizontal = orientation === "horizontal";
  const neg = -padding;

  const bleed: SectionBleed = isHorizontal
    ? {
        marginTop: neg,
        marginBottom: neg,
        marginLeft: __first ? neg : 0,
        marginRight: __last ? neg : 0,
        ...(inheritPadding ? { paddingVertical: padding } : null),
      }
    : {
        marginLeft: neg,
        marginRight: neg,
        marginTop: __first ? neg : 0,
        marginBottom: __last ? neg : 0,
        ...(inheritPadding ? { paddingHorizontal: padding } : null),
      };

  return (
    <CardSectionFrame
      ref={ref}
      borderTopWidth={withBorder && !isHorizontal ? 1 : undefined}
      borderBottomWidth={withBorder && !isHorizontal ? 1 : undefined}
      borderLeftWidth={withBorder && isHorizontal ? 1 : undefined}
      borderRightWidth={withBorder && isHorizontal ? 1 : undefined}
      borderColor={withBorder ? "$borderColor" : undefined}
      {...bleed}
      {...rest}
    />
  );
});

const CardHeader = styled(Box, { name: "CardHeader", flexDirection: "column", gap: "$xs" });
const CardFooter = styled(Box, {
  name: "CardFooter",
  flexDirection: "row",
  alignItems: "center",
  gap: "$sm",
  marginTop: "$sm",
});

/**
 * Named style slots (Pillar B / `styles.ts`). Each key maps to the props of the
 * styled part it targets, so `styles={{ header: { gap: "$md" } }}` is sugar for
 * `<Card.Header gap="$md" />`. Distributed onto the matching child parts; a
 * part's own props win over the `styles` map.
 */
export interface CardStyles {
  /** Props for `Card.Header` children. */
  header?: GetProps<typeof CardHeader>;
  /** Props for `Card.Footer` children. */
  footer?: GetProps<typeof CardFooter>;
  /** Props for `Card.Section` children. */
  section?: CardSectionProps;
}

const CARD_SLOT_KEYS = [
  "header",
  "footer",
  "section",
] as const satisfies readonly (keyof CardStyles)[];

export interface CardProps extends GetProps<typeof CardFrame> {
  /** Per-slot style sugar — props spread onto the matching child parts. */
  styles?: SlotStyles<CardStyles>;
}

const CardComponent = CardFrame.styleable<CardProps>(function Card(props, ref) {
  const { padding = DEFAULT_PADDING, orientation = "vertical", styles, children, ...rest } = props;
  const paddingValue = resolvePadding(padding as SpaceTokens | number);
  const s = slotStyles<CardStyles>(styles, CARD_SLOT_KEYS, "Card");

  // Flag the first/last card children that are Sections so they can negate the
  // card's leading/trailing padding (Mantine's data-first/last-section), and
  // distribute the matching `styles` slot onto each known part. `styles` is
  // lower-precedence sugar, so it spreads UNDER the child's own props; the
  // `__first`/`__last` flags are owned by `Card` and always applied last.
  const childArray = React.Children.toArray(children);
  const content = childArray.map((child, index) => {
    if (!React.isValidElement(child)) return child;
    // `child.props` is React-typed as `unknown`; the `child.type === Card.*`
    // identity check above pins the props shape — the one narrow bridge cast.
    const ownProps = child.props as Record<string, unknown>;
    if (child.type === CardSection) {
      const merged: CardSectionProps = {
        // `styles.section` spreads UNDER the child's own props (explicit wins);
        // the `__first`/`__last` flags are owned by `Card` and applied last.
        ...s.merge("section", ownProps),
        __first: index === 0,
        __last: index === childArray.length - 1,
      };
      return React.cloneElement(child, merged);
    }
    if (child.type === CardHeader) {
      return s.get("header") ? React.cloneElement(child, s.merge("header", ownProps)) : child;
    }
    if (child.type === CardFooter) {
      return s.get("footer") ? React.cloneElement(child, s.merge("footer", ownProps)) : child;
    }
    return child;
  });

  return (
    <CardContext.Provider value={{ padding: paddingValue, orientation }}>
      <CardFrame ref={ref} padding={padding} orientation={orientation} {...rest}>
        {content}
      </CardFrame>
    </CardContext.Provider>
  );
});

/** Card surface with `Card.Header` / `Card.Footer` / full-bleed `Card.Section`. */
export const Card = withStaticProperties(CardComponent, {
  Header: CardHeader,
  Footer: CardFooter,
  Section: CardSection,
});
