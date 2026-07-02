/**
 * Cross-platform plumbing for the `variant="gradient"` background — the
 * platform-agnostic half of the gradient primitive. The two `useGradient`
 * implementations (`gradient.tsx` for web, `gradient.native.tsx` for native)
 * both import these helpers so the gradient MATH (stop normalization, angle →
 * coordinates) and the token-resolution contract can't drift between platforms.
 *
 * The gradient is intentionally NOT expressible as a static variant-color token
 * (a linear-gradient has no cross-platform Tamagui style value), so it lives here
 * as a per-instance `gradient` prop painted at render: web sets a CSS
 * `backgroundImage`, native paints a `react-native-svg` layer. See
 * `variant-colors.ts` for the matching transparent fill + `$white` foreground.
 */
import type * as React from "react";

import type { useTheme } from "@knitui/core";

import { resolveThemeColor } from "./resolve-theme-color";

/** A single gradient color stop. `offset` is a 0–100 percentage along the line. */
export interface GradientStop {
  /** Stop color — a `$colorN` token (theme-aware) or any concrete CSS color. */
  color: string;
  /** Position along the gradient line, 0–100 (%). Defaults to even spacing. */
  offset?: number;
}

/**
 * Value for a component's `gradient` prop (active when `variant="gradient"`).
 *
 * Two forms — use whichever reads cleaner:
 *  - the Mantine-style two-color shorthand `{ from, to, deg }`, or
 *  - the multi-`stops` form `{ stops: [{ color, offset }], deg }` for three or
 *    more color steps.
 *
 * When `stops` is present it wins over `from`/`to`. Colors accept `$colorN`
 * ramp tokens (so `theme="red"` recolors the gradient) or any concrete CSS color.
 */
export interface GradientValue {
  /** Start color (two-color shorthand). @default "$color5" */
  from?: string;
  /** End color (two-color shorthand). @default "$color9" */
  to?: string;
  /** Three-or-more color steps. Takes precedence over `from`/`to` when set. */
  stops?: GradientStop[];
  /** Gradient angle in degrees (CSS convention: 0 = up, 90 = right). @default 45 */
  deg?: number;
}

/**
 * What `useGradient` returns on every platform. `frameProps` is spread onto the
 * component's styled frame; `layer` is rendered as the frame's first child. The
 * two platforms populate different fields (web → `backgroundImage`; native →
 * `overflow` + the SVG `layer`), but both are valid `Box` props so the shape is
 * uniform and components wire identically.
 */
export interface GradientResult {
  frameProps: { backgroundImage?: string; overflow?: "hidden" };
  layer: React.ReactNode;
}

/** Default gradient when `variant="gradient"` is set without a `gradient` prop. */
const DEFAULT_FROM = "$color5";
const DEFAULT_TO = "$color9";
const DEFAULT_DEG = 45;

/** The resolved angle, defaulting to Mantine's 45°. */
export const gradientDeg = (gradient: GradientValue): number => gradient.deg ?? DEFAULT_DEG;

/**
 * Flatten either gradient form to an ordered list of `{ color, offset }` stops
 * with explicit 0–100 offsets. `stops` (if present) wins over `from`/`to`;
 * stops without an explicit `offset` are spaced evenly across the line.
 */
export const normalizeStops = (gradient: GradientValue): Required<GradientStop>[] => {
  const { stops, from = DEFAULT_FROM, to = DEFAULT_TO } = gradient;
  if (stops && stops.length > 0) {
    const last = stops.length - 1;
    return stops.map((stop, i) => ({
      color: stop.color,
      offset: stop.offset ?? (last === 0 ? 0 : (i / last) * 100),
    }));
  }
  return [
    { color: from, offset: 0 },
    { color: to, offset: 100 },
  ];
};

type Theme = ReturnType<typeof useTheme>;

/**
 * Build the web `linear-gradient(...)` string. Each stop color is resolved
 * through {@link resolveThemeColor}, so a `$colorN` token becomes `var(--colorN)`
 * and the gradient still tracks the active theme via CSS variables.
 */
export const gradientToCss = (theme: Theme, gradient: GradientValue): string => {
  const stops = normalizeStops(gradient)
    .map((stop) => `${resolveThemeColor(theme, stop.color)} ${stop.offset}%`)
    .join(", ");
  return `linear-gradient(${gradientDeg(gradient)}deg, ${stops})`;
};

/**
 * Convert a CSS gradient angle to SVG `objectBoundingBox` line endpoints
 * (0–1). CSS 0° points up and increases clockwise, so the direction vector is
 * `(sin θ, −cos θ)`; the line is centered on the box and spans ±½ that vector.
 * Good enough for the solid-fill gradients these controls use (it doesn't
 * extend-to-corners like a true CSS gradient, but the visual difference on a
 * small control is imperceptible).
 */
export const degToSvgCoords = (deg: number): { x1: number; y1: number; x2: number; y2: number } => {
  const rad = (deg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return {
    x1: 0.5 - dx / 2,
    y1: 0.5 - dy / 2,
    x2: 0.5 + dx / 2,
    y2: 0.5 + dy / 2,
  };
};

/**
 * Resolve a `gradient` value's stops to concrete colors for `react-native-svg`
 * (which can't paint `$colorN` tokens). Shared by the native `useGradient`.
 */
export const resolveStops = (theme: Theme, gradient: GradientValue): Required<GradientStop>[] =>
  normalizeStops(gradient).map((stop) => ({
    color: resolveThemeColor(theme, stop.color),
    offset: stop.offset,
  }));
