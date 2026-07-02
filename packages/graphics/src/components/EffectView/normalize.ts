import type { Point, Radius } from "../../types";
import type { GradientFill, GradientFillBase } from "../gradients/types";
import type { EffectLayer, EffectPlacement } from "./types";

// Hard ceilings that keep a hostile/typo'd prop from producing a giant canvas or
// a runaway loop. They're far larger than any real layout, so they never bite
// legitimate use.
export const MAX_OUTSET = 2000;
export const MAX_CELLS = 20_000;
export const MAX_AXIS_STEPS = 2000;

const EFFECT_KINDS: ReadonlySet<string> = new Set([
  "fill",
  "border",
  "glow",
  "shadow",
  "dottedGrid",
  "checkerboard",
  "noise",
  "image",
  "blurredImage",
]);

const TILE_MODES: ReadonlySet<string> = new Set(["clamp", "repeat", "mirror", "decal"]);
const FIT_VALUES: ReadonlySet<string> = new Set([
  "contain",
  "cover",
  "fill",
  "fitHeight",
  "fitWidth",
  "scaleDown",
  "none",
]);

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** A finite number, or `fallback`. */
export function num(value: unknown, fallback: number): number {
  return isFiniteNumber(value) ? value : fallback;
}

/** A finite number clamped to `>= 0`, or `fallback` (also floored at 0). */
export function nonNeg(value: unknown, fallback: number): number {
  return Math.max(0, num(value, Math.max(0, fallback)));
}

/** A finite number that is `> 0`, else `fallback`. Use for loop steps / sizes that must be positive. */
export function positive(value: unknown, fallback: number): number {
  const n = num(value, fallback);
  return n > 0 ? n : fallback;
}

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** A non-empty string, or `fallback`. */
export function colorOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

/** The non-empty strings from an array, or `[]` for anything else. */
export function colorList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

export function enumValue<T extends string>(
  value: unknown,
  allowed: ReadonlySet<string>,
  fallback: T,
): T {
  return typeof value === "string" && allowed.has(value) ? (value as T) : fallback;
}

/** Validate that an unknown value is a real, known effect descriptor (drops null / junk / unknown kinds). */
export function isEffectLayer(value: unknown): value is EffectLayer {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { effect?: unknown }).effect === "string" &&
    EFFECT_KINDS.has((value as { effect: string }).effect)
  );
}

/** A valid placement, or `undefined` so the per-kind default applies. */
export function safePlacement(value: unknown): EffectPlacement | undefined {
  return value === "behind" || value === "front" ? value : undefined;
}

/** Sizes must be finite and positive before we hand them to a Skia canvas. */
export function isRenderableSize(width: number, height: number): boolean {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}

/** A non-negative {@link Radius} (number or `{x,y}`), defaulting to `0`. */
export function safeRadius(radius: Radius | undefined): Radius {
  if (isFiniteNumber(radius)) {
    return Math.max(0, radius);
  }

  if (radius && typeof radius === "object") {
    return { x: nonNeg(radius.x, 0), y: nonNeg(radius.y, 0) };
  }

  return 0;
}

function safePoint(value: unknown): Point | undefined {
  if (
    value &&
    typeof value === "object" &&
    isFiniteNumber((value as Point).x) &&
    isFiniteNumber((value as Point).y)
  ) {
    return { x: (value as Point).x, y: (value as Point).y };
  }

  return undefined;
}

/**
 * Coerce a {@link GradientFill} into one safe to hand to Skia: only non-empty
 * string colors, finite numeric knobs, length-matched positions, valid enums and
 * point objects. Anything malformed is dropped so a stray `NaN` / bad value can't
 * reach `vec()` or a shader and crash.
 */
export function sanitizeFill(fill: GradientFill): GradientFill {
  const colors = colorList(fill.colors);
  const positions =
    Array.isArray(fill.positions) &&
    fill.positions.length === colors.length &&
    fill.positions.every(isFiniteNumber)
      ? [...fill.positions]
      : undefined;

  let stops: GradientFillBase["stops"];
  if (Array.isArray(fill.stops) && fill.stops.length > 0) {
    if (fill.stops.every((stop) => typeof stop === "string" && stop.trim().length > 0)) {
      stops = [...(fill.stops as readonly string[])];
    } else if (
      fill.stops.every(
        (stop) =>
          stop != null &&
          typeof stop === "object" &&
          typeof (stop as { color?: unknown }).color === "string",
      )
    ) {
      stops = (fill.stops as ReadonlyArray<{ color: string; position?: unknown }>).map((stop) => ({
        color: stop.color,
        position: isFiniteNumber(stop.position) ? stop.position : undefined,
      }));
    }
  }

  // The color ramp + tiling is shared; each kind then keeps only its own knobs.
  const base: GradientFillBase = {
    colors: colors.length > 0 ? colors : undefined,
    stops,
    positions,
    mode: TILE_MODES.has(fill.mode as string) ? fill.mode : undefined,
    opacity: isFiniteNumber(fill.opacity) ? clamp(fill.opacity, 0, 1) : undefined,
  };

  // Switching on `fill.type` narrows the union, so only the knobs that apply to
  // that kind are read and carried through.
  switch (fill.type) {
    case "radial":
      return {
        ...base,
        type: "radial",
        center: safePoint(fill.center),
        radius: isFiniteNumber(fill.radius) ? Math.max(0, fill.radius) : undefined,
      };
    case "sweep":
      return {
        ...base,
        type: "sweep",
        center: safePoint(fill.center),
        startAngle: isFiniteNumber(fill.startAngle) ? fill.startAngle : undefined,
        endAngle: isFiniteNumber(fill.endAngle) ? fill.endAngle : undefined,
      };
    case "conical":
      return {
        ...base,
        type: "conical",
        start: safePoint(fill.start),
        end: safePoint(fill.end),
        startRadius: isFiniteNumber(fill.startRadius) ? Math.max(0, fill.startRadius) : undefined,
        endRadius: isFiniteNumber(fill.endRadius) ? Math.max(0, fill.endRadius) : undefined,
      };
    default:
      return {
        ...base,
        type: fill.type,
        angle: isFiniteNumber(fill.angle) ? fill.angle : undefined,
        start: safePoint(fill.start),
        end: safePoint(fill.end),
      };
  }
}

export { FIT_VALUES, TILE_MODES };
