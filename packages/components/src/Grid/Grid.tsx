import * as React from "react";

import {
  createStyledContext,
  type GetProps,
  getTokenValue,
  type SpaceTokens,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { alignVariant, justifyVariant, overflowVariant } from "../internal/style-props";

export type GridColSpan = number | "auto" | "content";

const GUTTER_SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

type GridGutterSize = (typeof GUTTER_SIZES)[number];
export type GridGutter = GridGutterSize | number;

const DEFAULT_GUTTER: GridGutterSize = "md";

const isGridGutterSize = (value: string): value is GridGutterSize =>
  (GUTTER_SIZES as readonly string[]).includes(value);

const toGutterToken = (value: GridGutterSize): SpaceTokens => `$${value}` as SpaceTokens;

const resolveGutterToken = (token: SpaceTokens): number => {
  const value = getTokenValue(token as Parameters<typeof getTokenValue>[0], "space");
  return typeof value === "number" ? value : 0;
};

const resolveGutter = (gutter: GridGutter): number => {
  if (typeof gutter === "number") return gutter;
  if (isGridGutterSize(gutter)) return resolveGutterToken(toGutterToken(gutter));
  return resolveGutterToken(gutter);
};

/**
 * Shared from `Grid` to every `Grid.Col` so a column can size itself as a
 * fraction of `columns`, inset by half the `gutter`, and optionally `grow` to
 * fill the last row. Read at runtime via `GridContext.useStyledContext()`.
 */
const GridContext = createStyledContext<{ columns: number; gutter: number; grow: boolean }>({
  columns: 12,
  gutter: resolveGutter(DEFAULT_GUTTER),
  grow: false,
});

/**
 * 12-column flex-wrap grid — mirrors Mantine's `Grid` + `Grid.Col`. Columns size
 * to `span / columns` as a percentage; `gutter` is applied as Mantine's
 * negative-margin track + per-column padding (cross-platform, border-box). Accent
 * is theme-driven as everywhere else.
 *
 * Responsive per-breakpoint `span`/`offset`/`order` OBJECT values are intentionally
 * DEFERRED (see `GridColProps.span` `@remarks`): there is no cross-platform
 * breakpoint primitive in `@knitui/core`. This is a documented limitation, not a TODO.
 */
const GridFrame = styled(Box, {
  name: "Grid",
  context: GridContext,
  flexDirection: "row",
  flexWrap: "wrap",

  variants: {
    align: alignVariant,
    justify: justifyVariant,
    overflow: overflowVariant,
  } as const,
});

const GridColFrame = styled(Box, {
  name: "GridCol",
  context: GridContext,
  // flexBasis carries the width (border-box, so padding sits inside the %).
  flexGrow: 0,
  flexShrink: 0,
});

export interface GridColProps extends GetProps<typeof GridColFrame> {
  /**
   * Columns spanned: a count, `"auto"` (fill remaining), or `"content"` (fit).
   * @default 12
   * @remarks Single values only. Mantine's responsive per-breakpoint OBJECT form
   * (`span={{ base: 12, sm: 6, lg: 3 }}`, and likewise `offset`/`order`) is
   * DEFERRED by design: it requires a cross-platform breakpoint/container-query
   * primitive that `@knitui/core` does not expose (CSS media queries are web-only and
   * Tamagui's media config is not wired into this kit). Use distinct layouts per
   * platform until that primitive lands.
   */
  span?: GridColSpan;
  /** Empty columns before this one. Single value only (see `span` `@remarks`). @default 0 */
  offset?: number;
  /** Flexbox `order`. Single value only (see `span` `@remarks`). */
  order?: number;
  /**
   * Vertical alignment of this column within the row — sets flexbox `align-self`
   * (mirrors Mantine's `Grid.Col` `align`). Single value only (see `span` `@remarks`).
   */
  align?: BoxProps["alignSelf"];
}

/** The width/offset math, narrowed to the exact Box style props it targets. */
type ColLayout = Pick<
  BoxProps,
  "flexBasis" | "maxWidth" | "flexGrow" | "marginLeft" | "padding" | "alignSelf"
>;

const GridCol = GridColFrame.styleable<GridColProps>(function GridCol(props, ref) {
  const { span = 12, offset = 0, order, align, children, ...rest } = props;
  const { columns, gutter, grow } = GridContext.useStyledContext();

  const layout: ColLayout = { padding: gutter / 2 };

  if (align !== undefined) layout.alignSelf = align;

  if (span === "auto") {
    layout.flexGrow = 1;
    layout.flexBasis = 0;
    layout.maxWidth = "100%";
  } else if (span === "content") {
    layout.flexGrow = 0;
    layout.flexBasis = "auto";
  } else {
    const pct = `${(span / columns) * 100}%` as BoxProps["flexBasis"];
    layout.flexBasis = pct;
    layout.flexGrow = grow ? 1 : 0;
    if (!grow) layout.maxWidth = `${(span / columns) * 100}%` as BoxProps["maxWidth"];
  }

  if (offset > 0) layout.marginLeft = `${(offset / columns) * 100}%` as BoxProps["marginLeft"];

  // `order` is a web-only flex prop absent from Box's style-prop types (a no-op on
  // native); spread a precise object so the excess-property check doesn't fire.
  const orderProp: { order?: number } = order !== undefined ? { order } : {};

  return (
    <GridColFrame ref={ref} {...layout} {...orderProp} {...rest}>
      {children}
    </GridColFrame>
  );
});

export interface GridProps extends GetProps<typeof GridFrame> {
  /** Total columns the grid is divided into. @default 12 */
  columns?: number;
  /** Space between columns — a space key (`xxs`–`xxl`), `$space` token, or px number. @default "md" */
  gutter?: GridGutter;
  /** Let columns grow to fill the last row. @default false */
  grow?: boolean;
}

const GridComponent = GridFrame.styleable<GridProps>(function Grid(props, ref) {
  const { columns = 12, gutter = DEFAULT_GUTTER, grow = false, children, ...rest } = props;
  const g = resolveGutter(gutter);

  return (
    <GridContext.Provider columns={columns} gutter={g} grow={grow}>
      {/* Negative-margin track cancels the columns' padding so edges align. */}
      <GridFrame ref={ref} margin={-g / 2} {...rest}>
        {children}
      </GridFrame>
    </GridContext.Provider>
  );
});

export const Grid = withStaticProperties(GridComponent, {
  Col: GridCol,
  Frame: GridFrame,
});
