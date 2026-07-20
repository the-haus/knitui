import type { GradientStops, Point, Size, TileMode } from "../../types";

export type GradientType = "linear" | "radial" | "sweep" | "conical";

/**
 * The color ramp shared by every gradient kind, plus how it tiles. The per-type
 * fills below add only their own geometry knobs on top of this.
 */
export type GradientFillBase = {
  stops?: GradientStops;
  colors?: readonly string[];
  positions?: readonly number[];
  mode?: TileMode;
  opacity?: number;
};

/**
 * A linear gradient: a straight color ramp across the bounds. The direction is
 * taken from explicit `start`/`end` points, else an `angle`, else a
 * corner-to-corner diagonal. This is the default kind, so `type` may be omitted.
 */
export type LinearGradientFill = GradientFillBase & {
  type?: "linear";
  /** Direction in degrees (0 = →, 90 = ↓). Ignored when start/end are given. */
  angle?: number;
  /** Start point (canvas coords). Defaults derive from the bounds. */
  start?: Point;
  /** End point (canvas coords). */
  end?: Point;
};

/** A radial gradient: a color ramp from a center point outward to a radius. */
export type RadialGradientFill = GradientFillBase & {
  type: "radial";
  /** Center. Defaults to the bounds' center. */
  center?: Point;
  /** Radius. Defaults to half the bounds' larger side. */
  radius?: number;
};

/** A sweep gradient: a color ramp swept around a center over an angle range. */
export type SweepGradientFill = GradientFillBase & {
  type: "sweep";
  /** Center. Defaults to the bounds' center. */
  center?: Point;
  /** Start angle in degrees. */
  startAngle?: number;
  /** End angle in degrees. */
  endAngle?: number;
};

/** A two-point conical gradient: a color ramp between two circles. */
export type ConicalGradientFill = GradientFillBase & {
  type: "conical";
  /** First-circle center (canvas coords). Defaults to the bounds' center. */
  start?: Point;
  /** Second-circle center (canvas coords). */
  end?: Point;
  /** First-circle radius. Defaults to half the bounds' larger side. */
  startRadius?: number;
  /** Second-circle radius. */
  endRadius?: number;
};

/**
 * A geometry-free description of a gradient paint, resolved against an arbitrary
 * bounding rect by `GradientShader`. A discriminated union keyed on `type`
 * (defaulting to `linear`): each kind carries only the geometry knobs that apply
 * to it, on top of the shared color ramp. Any field left undefined falls back to
 * a sensible default derived from the bounds.
 */
export type GradientFill =
  LinearGradientFill | RadialGradientFill | SweepGradientFill | ConicalGradientFill;

export type GradientBaseProps = Partial<Size> & {
  x?: number;
  y?: number;
} & GradientFillBase;
