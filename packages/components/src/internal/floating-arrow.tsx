import * as React from "react";

import { getTokenValue, type RadiusTokens } from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { type Placement } from "../floating";

/** Where the arrow sits along the dropdown edge. */
export type ArrowPosition = "center" | "side";

/** Resolve a radius token (`"$md"` or bare `"md"`) to its px value via the token system. */
function radiusTokenToPx(value: RadiusTokens | string): number | undefined {
  // `RadiusTokens` widens to `string | number | Variable | UnionableNumber`, so
  // narrow to a real string before token lookup; a bare number is already px.
  if (typeof value !== "string") {
    return typeof value === "number" ? value : undefined;
  }
  const token = (value.startsWith("$") ? value : `$${value}`) as Parameters<
    typeof getTokenValue
  >[0];
  const resolved = getTokenValue(token, "radius");
  return typeof resolved === "number" ? resolved : undefined;
}

/**
 * Resolve a dropdown `radius` prop to pixels, for the arrow's corner keepout.
 * Mirrors `radiusVariant`/`toRadius`: a size key (`"md"`) or `$`-token (`"$md"`)
 * resolves through Tamagui's token system, a number passes through, and anything
 * unrecognized (`undefined`, or an arbitrary CSS value like `"10px"` the arrow math
 * can't use) falls back to `fallback` (itself a token, defaulting to the dropdown
 * frame's `$sm` radius). Only ever called at render, so the config is always present.
 */
export function resolveRadiusPx(
  radius: RadiusTokens | string | number | undefined,
  fallback: RadiusTokens | number = "$sm",
): number {
  if (typeof radius === "number") return radius;
  const resolved = radius != null ? radiusTokenToPx(radius) : undefined;
  if (resolved != null) return resolved;
  if (typeof fallback === "number") return fallback;
  return radiusTokenToPx(fallback) ?? 0;
}

/**
 * The subset of Box style props the placement math drives. Narrowed (not widened)
 * so the computed object stays cast-free under Tamagui's strict style typing.
 */
type ArrowStyle = Pick<
  BoxProps,
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "marginLeft"
  | "marginTop"
  | "borderTopColor"
  | "borderBottomColor"
  | "borderLeftColor"
  | "borderRightColor"
  | "borderTopLeftRadius"
  | "borderTopRightRadius"
  | "borderBottomLeftRadius"
  | "borderBottomRightRadius"
>;

const TRANSPARENT = "transparent";

/**
 * Resolve the absolute-position + per-edge-border styles for a rotated-square arrow,
 * mirroring Mantine's `getArrowPositionStyles` but cross-platform (no `clip-path`):
 * the square is pulled half-out on its placement side, the OUTWARD-facing pair of
 * edges keep their border (the inward pair go transparent), and the outward corner
 * is rounded. On the cross axis the measured `arrowX`/`arrowY` from the `arrow`
 * middleware wins (it tracks the target even after `shift`/`flip`); the static
 * placement-derived math is the fallback while unmeasured.
 */
function getArrowStyle(
  placement: Placement,
  size: number,
  offset: number,
  position: ArrowPosition,
  radius: number,
  borderColor: BoxProps["borderColor"],
  arrowX?: number,
  arrowY?: number,
): ArrowStyle {
  const [side, align] = placement.split("-") as [string, string | undefined];
  const half = size / 2;
  const centered = position === "center" || !align;
  const style: ArrowStyle = {};

  // Main axis: half-out pull, outward corner radius, outward border pair.
  if (side === "top") {
    style.bottom = -half;
    style.borderBottomRightRadius = radius;
    style.borderTopColor = TRANSPARENT;
    style.borderLeftColor = TRANSPARENT;
    style.borderBottomColor = borderColor;
    style.borderRightColor = borderColor;
  } else if (side === "bottom") {
    style.top = -half;
    style.borderTopLeftRadius = radius;
    style.borderBottomColor = TRANSPARENT;
    style.borderRightColor = TRANSPARENT;
    style.borderTopColor = borderColor;
    style.borderLeftColor = borderColor;
  } else if (side === "left") {
    style.right = -half;
    style.borderTopRightRadius = radius;
    style.borderLeftColor = TRANSPARENT;
    style.borderBottomColor = TRANSPARENT;
    style.borderTopColor = borderColor;
    style.borderRightColor = borderColor;
  } else {
    // right
    style.left = -half;
    style.borderBottomLeftRadius = radius;
    style.borderRightColor = TRANSPARENT;
    style.borderTopColor = TRANSPARENT;
    style.borderBottomColor = borderColor;
    style.borderLeftColor = borderColor;
  }

  // Cross axis: the measured middleware coordinate (points at the target), or the
  // static fallback — center, or pin `offset` from the start/end edge.
  if (side === "top" || side === "bottom") {
    if (typeof arrowX === "number") {
      style.left = arrowX;
    } else if (centered) {
      style.left = "50%";
      style.marginLeft = -half;
    } else if (align === "start") {
      style.left = offset;
    } else {
      style.right = offset;
    }
  } else if (typeof arrowY === "number") {
    style.top = arrowY;
  } else if (centered) {
    style.top = "50%";
    style.marginTop = -half;
  } else if (align === "start") {
    style.top = offset;
  } else {
    style.bottom = offset;
  }

  return style;
}

export interface FloatingArrowProps {
  /** The resolved floating placement (e.g. `"bottom-start"`). */
  placement: Placement;
  /** Rendered square edge length in px. */
  size: number;
  /** Distance from the start/end edge when `position="side"` on an aligned placement. */
  offset: number;
  /** `center` keeps the arrow centered; `side` pins it toward the aligned edge. */
  position: ArrowPosition;
  /** Corner radius applied to the arrow's outward corner. */
  radius: number;
  /** Arrow fill — match the dropdown surface (e.g. `"$background"`). */
  background: BoxProps["backgroundColor"];
  /** Outward-edge border color — match the dropdown border. @default "$borderColor" */
  borderColor?: BoxProps["borderColor"];
  /** Border width; pass `0` for a borderless (solid) arrow. @default 1 */
  borderWidth?: number;
  /**
   * Measured cross-axis coordinate from the `arrow` middleware
   * (`middlewareData.arrow.x`), px relative to the dropdown — used on top/bottom
   * placements so the arrow keeps pointing at the target after `shift`/`flip`.
   */
  arrowX?: number;
  /** Same for left/right placements (`middlewareData.arrow.y`). */
  arrowY?: number;
}

/**
 * A theme-driven, cross-platform floating arrow (a 45°-rotated `Box` square) for
 * the `Popover`/`HoverCard` dropdown families. Renders absolutely positioned inside
 * a relatively/absolutely-positioned dropdown frame; the dropdown must not clip
 * overflow.
 */
export function FloatingArrow({
  placement,
  size,
  offset,
  position,
  radius,
  background,
  borderColor = "$borderColor",
  borderWidth = 1,
  arrowX,
  arrowY,
}: FloatingArrowProps) {
  const style = getArrowStyle(
    placement,
    size,
    offset,
    position,
    radius,
    borderColor,
    arrowX,
    arrowY,
  );
  return (
    <Box
      position="absolute"
      width={size}
      height={size}
      backgroundColor={background}
      borderWidth={borderWidth}
      rotate="45deg"
      pointerEvents="none"
      {...style}
    />
  );
}
