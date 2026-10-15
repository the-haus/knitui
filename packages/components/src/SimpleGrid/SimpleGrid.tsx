import * as React from "react";

import { type GetProps, getTokenValue, isWeb, type SpaceTokens, styled } from "@knitui/core";

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
 * row. Rows are spaced with `rowGap`. The grid never reaches past its own box (no
 * negative-margin track), so it cannot overflow a fixed-width scrolling parent.
 *
 * Two modes:
 *  - default `cols` mode — N equal columns (`width: 100/cols %`). The column gap
 *    is split across each cell's inline padding by column index (column `c` of
 *    `N` gets `c·g/N` before and `(N-1-c)·g/N` after), so every column's content
 *    is equally wide, adjacent columns sit exactly `g` apart, and the outer
 *    columns are flush with the grid's edges.
 *  - `minColWidth` mode — columns auto-fill at ≥ that width (`flexBasis`/`minWidth`
 *    less one gap, plus `columnGap`), a cross-platform approximation of CSS
 *    `repeat(auto-fill/fit, minmax(min, 1fr))`.
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
  "width" | "flexBasis" | "flexGrow" | "minWidth" | "paddingLeft" | "paddingRight"
>;

/**
 * `minColWidth` less one column gap, so a cell plus its trailing gap packs like
 * the old half-gap-padded cell did (same column count and content width).
 */
const minLessGap = (min: number | string, gap: number): BoxProps["flexBasis"] => {
  if (typeof min === "number") return Math.max(0, min - gap);
  if (!gap) return min as BoxProps["flexBasis"];
  // Web resolves the subtraction in CSS; native takes the string as given.
  return (isWeb ? `calc(${min} - ${gap}px)` : min) as BoxProps["flexBasis"];
};

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

    const minMode = minColWidth !== undefined;
    const cellLayout = (index: number): CellLayout => {
      if (minMode) {
        const basis = minLessGap(minColWidth, sx);
        return {
          flexBasis: basis,
          minWidth: basis as BoxProps["minWidth"],
          flexGrow: autoFlow === "auto-fit" ? 1 : 0,
        };
      }
      const column = index % cols;
      return {
        width: `${100 / cols}%` as BoxProps["width"],
        paddingLeft: (column * sx) / cols,
        paddingRight: ((cols - 1 - column) * sx) / cols,
      };
    };

    const cells = React.Children.toArray(children)
      .filter(Boolean)
      .map((child, index) => (
        // `styles.cell` is lower-precedence sugar; the computed cell layout
        // (width/flexBasis/gap padding) is owned by `SimpleGrid` and wins.
        <Box key={index} {...s.get("cell")} {...cellLayout(index)}>
          {child}
        </Box>
      ));

    return (
      <SimpleGridFrame ref={ref} rowGap={sy} {...(minMode && { columnGap: sx })} {...rest}>
        {cells}
      </SimpleGridFrame>
    );
  },
);
