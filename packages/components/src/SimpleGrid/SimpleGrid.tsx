import * as React from "react";

import { type GetProps, getTokenValue, type SpaceTokens, styled } from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { slotStyles, type SlotStyles } from "../internal/styles";

const SPACING_KEYS = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

type SimpleGridSpacingKey = (typeof SPACING_KEYS)[number];

/** Spacing as a space key, `$space` token, or a raw px number. */
export type SimpleGridSpacing = SimpleGridSpacingKey | SpaceTokens | number;

const DEFAULT_SPACING: SimpleGridSpacingKey = "md";

const isSimpleGridSpacingKey = (value: SimpleGridSpacing): value is SimpleGridSpacingKey =>
  typeof value === "string" && (SPACING_KEYS as readonly string[]).includes(value);

const toSpacingToken = (value: SimpleGridSpacingKey): SpaceTokens => `$${value}` as SpaceTokens;

const resolveSpacingToken = (token: SpaceTokens): number => {
  const value = getTokenValue(token as Parameters<typeof getTokenValue>[0], "space");
  return typeof value === "number" ? value : 0;
};

const resolveSpacing = (spacing: SimpleGridSpacing): number => {
  if (typeof spacing === "number") return spacing;
  if (isSimpleGridSpacingKey(spacing)) return resolveSpacingToken(toSpacingToken(spacing));
  return resolveSpacingToken(spacing);
};

/**
 * Equal-width column grid — mirrors Mantine's `SimpleGrid` (every column the same
 * width, unlike `Grid`'s 12-column spans). Cross-platform: there is no CSS grid on
 * native, so each child is wrapped in a cell `Box` and laid out with a flex-wrap
 * row + a negative-margin gap track (the same border-box technique as `Grid`).
 *
 * Two modes:
 *  - default `cols` mode — N equal columns (`width: 100/cols %`).
 *  - `minColWidth` mode — columns auto-fill at ≥ that width (`flexBasis`/`minWidth`),
 *    a cross-platform approximation of CSS `repeat(auto-fill/fit, minmax(min, 1fr))`.
 *
 * Responsive per-breakpoint values are intentionally deferred (single values only),
 * matching `Grid`. Accent/theme is inherited; no Mantine `color` prop.
 */
const SimpleGridFrame = styled(Box, {
  name: "SimpleGrid",
  flexDirection: "row",
  flexWrap: "wrap",
});

type SimpleGridFrameProps = Omit<GetProps<typeof SimpleGridFrame>, "children" | "spacing" | "type">;

export interface SimpleGridProps extends SimpleGridFrameProps {
  /** Number of equal columns. @default 1 */
  cols?: number;
  /** Spacing between columns — space key (`xxs`–`xxl`), `$space` token, or px number. @default "md" */
  spacing?: SimpleGridSpacing;
  /** Spacing between rows; falls back to `spacing` when unset. */
  verticalSpacing?: SimpleGridSpacing;
  /** Minimum column width. When set, `cols` is ignored and columns auto-fill. */
  minColWidth?: number | string;
  /** Fill behaviour for `minColWidth` mode. @default "auto-fill" */
  autoFlow?: "auto-fit" | "auto-fill";
  /**
   * Responsive query type. Accepted for Mantine parity; our layout is
   * single-value, so this is a documented no-op.
   */
  type?: "media" | "container";
  /**
   * Implicit-row sizing — a web CSS-grid concept with no cross-platform flex
   * equivalent. Accepted for Mantine parity; documented no-op.
   */
  autoRows?: string;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<SimpleGridStyles>;
  children?: React.ReactNode;
}

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each child is wrapped in a
 * cell `Box` (the cross-platform grid-track technique); the `cell` slot reaches
 * that wrapper, so `styles={{ cell: { padding: "$xs" } }}` restyles every cell.
 */
export interface SimpleGridStyles {
  /** Props for the per-child cell wrapper `Box`. */
  cell?: BoxProps;
}

const SIMPLE_GRID_SLOT_KEYS = ["cell"] as const satisfies readonly (keyof SimpleGridStyles)[];

/** Cell layout narrowed to the exact Box style props it targets. */
type CellLayout = Pick<
  BoxProps,
  "width" | "flexBasis" | "flexGrow" | "minWidth" | "paddingHorizontal" | "paddingVertical"
>;

export const SimpleGrid = SimpleGridFrame.styleable<SimpleGridProps>(
  function SimpleGrid(props, ref) {
    const {
      cols = 1,
      spacing = DEFAULT_SPACING,
      verticalSpacing,
      minColWidth,
      autoFlow = "auto-fill",
      type: _type,
      autoRows: _autoRows,
      styles,
      children,
      ...rest
    } = props;

    const s = slotStyles<SimpleGridStyles>(styles, SIMPLE_GRID_SLOT_KEYS, "SimpleGrid");

    const sx = resolveSpacing(spacing);
    const sy = resolveSpacing(verticalSpacing ?? spacing);

    const cell: CellLayout = {
      paddingHorizontal: sx / 2,
      paddingVertical: sy / 2,
    };
    if (minColWidth !== undefined) {
      cell.flexBasis = minColWidth as BoxProps["flexBasis"];
      cell.minWidth = minColWidth as BoxProps["minWidth"];
      cell.flexGrow = autoFlow === "auto-fit" ? 1 : 0;
    } else {
      cell.width = `${100 / cols}%` as BoxProps["width"];
    }

    const cells = React.Children.toArray(children)
      .filter(Boolean)
      .map((child, index) => (
        // `styles.cell` is lower-precedence sugar; the computed `cell` layout
        // (width/flexBasis/gap padding) is owned by `SimpleGrid` and wins.
        <Box key={index} {...s.get("cell")} {...cell}>
          {child}
        </Box>
      ));

    return (
      // Negative-margin track cancels the cells' half-gap padding so outer edges align.
      <SimpleGridFrame ref={ref} marginHorizontal={-sx / 2} marginVertical={-sy / 2} {...rest}>
        {cells}
      </SimpleGridFrame>
    );
  },
);
