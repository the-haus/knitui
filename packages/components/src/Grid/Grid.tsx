import * as React from "react";

import {
  createStyledContext,
  type GetProps,
  resolveToken,
  type SpaceTokens,
  styleable,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { alignVariant, justifyVariant, overflowVariant } from "../internal/style-props";

export type GridColSpan = number | "auto" | "content";

/** A space key (`xxs`–`xxl`, or any other space token) or a raw px number. */
export type GridGutter = SpaceTokens | number;

const DEFAULT_GUTTER: GridGutter = "md";

/**
 * The gutter in px: a number is raw, a string names a space token (`"md"`). The
 * column math needs a real number (half-gutter padding + the negative-margin
 * track), so an unknown name resolves to 0 rather than leaking a string.
 */
const resolveGutter = (gutter: GridGutter): number => {
  if (typeof gutter === "number") return gutter;
  const value = resolveToken(gutter, "space");
  return typeof value === "number" ? value : 0;
};

/**
 * Shared from `Grid` to every `Grid.Col` so a column can size itself as a
 * fraction of `columns`, inset by half the `gutter`, and optionally `grow` to
 * fill the last row. Read at runtime via `GridContext.useStyledContext()`.
 */
// The default gutter is resolved lazily on read (a module-load token read throws
// when this module evaluates before the Tamagui config is registered); `-1` marks
// "no Grid above, use the default".
const GridContext = createStyledContext<{ columns: number; gutter: number; grow: boolean }>({
  columns: 12,
  gutter: -1,
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
  displayName: "Grid",
  flexDirection: "row",
  flexWrap: "wrap",

  variants: {
    align: alignVariant,
    justify: justifyVariant,
    overflow: overflowVariant,
  } as const,
});

const GridColFrame = styled(Box, {
  displayName: "GridCol",
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

const GridCol = styleable<GridColProps>(GridColFrame, function GridCol(props, ref) {
  const { span = 12, offset = 0, order, align, children, ...rest } = props;
  const ctx = GridContext.useStyledContext();
  const { columns, grow } = ctx;
  const gutter = ctx.gutter < 0 ? resolveGutter(DEFAULT_GUTTER) : ctx.gutter;

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
  /** Space between columns — a space token (`"xxs"`–`"xxl"`) or a px number. @default "md" */
  gutter?: GridGutter;
  /** Let columns grow to fill the last row. @default false */
  grow?: boolean;
}

const GridComponent = styleable<GridProps>(GridFrame, function Grid(props, ref) {
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
