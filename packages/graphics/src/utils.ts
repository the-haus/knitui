import type { CanvasLength, GradientStop, GradientStops, Point, Radius } from "./types";

export const DEFAULT_SIZE = 160;

export function isGradientStop(value: string | GradientStop): value is GradientStop {
  return typeof value !== "string";
}

export function normalizeStops(stops: GradientStops): {
  colors: string[];
  positions?: number[];
} {
  const colors = stops.map((stop) => (isGradientStop(stop) ? stop.color : stop));
  const positions = stops.map((stop) => (isGradientStop(stop) ? stop.position : undefined));

  return {
    colors,
    positions: positions.some((position) => position != null)
      ? positions.map((p) => p ?? 0)
      : undefined,
  };
}

export function resolveRadius(radius: Radius): { rx: number; ry: number } {
  if (typeof radius === "number") {
    return { rx: radius, ry: radius };
  }

  return { rx: radius.x, ry: radius.y };
}

export function point(x: number, y: number): Point {
  return { x, y };
}
