import * as React from "react";

import {
  LinearGradient as SkiaLinearGradient,
  RadialGradient as SkiaRadialGradient,
  SweepGradient as SkiaSweepGradient,
  TwoPointConicalGradient as SkiaTwoPointConicalGradient,
  vec,
} from "@shopify/react-native-skia";

import type { Point, RectLike } from "../../types";
import { resolveGradient } from "./resolveGradient";
import type { GradientFill } from "./types";

/**
 * Maps an angle (degrees, 0 = →, 90 = ↓) onto start/end points that span the
 * full rect along that direction, so a linear gradient always reaches edge to
 * edge regardless of the rect's aspect ratio.
 */
function angleToVectors(angleDegrees: number, bounds: RectLike): { start: Point; end: Point } {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const radians = (angleDegrees * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  // Project the rect half-extents onto the direction so the span covers the
  // whole rect (the bounding box of the rotated gradient line).
  const half = Math.abs(dx) * (bounds.width / 2) + Math.abs(dy) * (bounds.height / 2);

  return {
    start: { x: cx - dx * half, y: cy - dy * half },
    end: { x: cx + dx * half, y: cy + dy * half },
  };
}

export type GradientShaderProps = {
  fill: GradientFill;
  /** Region the gradient is mapped across, in canvas coordinates. */
  bounds: RectLike;
};

/**
 * Emits the appropriate Skia gradient shader element for a {@link GradientFill}
 * resolved against `bounds`. Render it as a child of any Skia drawing node
 * (Rect, RoundedRect, Path…) to paint that node with the gradient.
 */
export function GradientShader({ fill, bounds }: GradientShaderProps) {
  const { colors, positions } = resolveGradient(fill);
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;

  // Props shared by every gradient kind.
  const shared = { colors, positions, mode: fill.mode };

  // Switching on `fill.type` narrows the union to each per-type fill, so only
  // that kind's geometry knobs are in scope in its branch.
  if (fill.type === "radial") {
    const center = fill.center ?? { x: cx, y: cy };
    const radius = fill.radius ?? Math.max(bounds.width, bounds.height) / 2;

    return <SkiaRadialGradient c={vec(center.x, center.y)} r={radius} {...shared} />;
  }

  if (fill.type === "sweep") {
    const center = fill.center ?? { x: cx, y: cy };

    return (
      <SkiaSweepGradient
        c={vec(center.x, center.y)}
        start={fill.startAngle}
        end={fill.endAngle}
        {...shared}
      />
    );
  }

  if (fill.type === "conical") {
    const start = fill.start ?? { x: cx, y: cy };
    const end = fill.end ?? { x: cx, y: bounds.y };
    const startRadius = fill.startRadius ?? Math.max(bounds.width, bounds.height) / 2;
    const endRadius = fill.endRadius ?? 8;

    return (
      <SkiaTwoPointConicalGradient
        start={vec(start.x, start.y)}
        startR={startRadius}
        end={vec(end.x, end.y)}
        endR={endRadius}
        {...shared}
      />
    );
  }

  // Linear (type omitted or "linear"): explicit start/end win, then an angle,
  // then a corner-to-corner diagonal.
  let { start, end } = fill;

  if (!start || !end) {
    if (fill.angle != null) {
      const vectors = angleToVectors(fill.angle, bounds);
      start = start ?? vectors.start;
      end = end ?? vectors.end;
    } else {
      start = start ?? { x: bounds.x, y: bounds.y };
      end = end ?? { x: bounds.x + bounds.width, y: bounds.y + bounds.height };
    }
  }

  return <SkiaLinearGradient start={vec(start.x, start.y)} end={vec(end.x, end.y)} {...shared} />;
}

/** True when a fill carries explicit gradient colors (vs. wanting a solid paint). */
export function hasGradientColors(fill: GradientFill): boolean {
  return Boolean((fill.colors && fill.colors.length > 0) || (fill.stops && fill.stops.length > 0));
}

/** The first concrete color of a fill (from `colors` or `stops`), if any. */
export function firstGradientColor(fill: GradientFill): string | undefined {
  if (fill.colors && fill.colors.length > 0) {
    return fill.colors[0];
  }

  const stop = fill.stops?.[0];
  if (stop == null) {
    return undefined;
  }

  return typeof stop === "string" ? stop : stop.color;
}
