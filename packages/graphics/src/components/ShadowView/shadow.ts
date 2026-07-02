import type { FrameShadowSpec } from "../EffectView/types";
import type { ShadowProps } from "./types";

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const round = (n: number): number => Math.round(n * 1000) / 1000;

/**
 * Scale a color's alpha by `opacity` (0–1), the way RN's `shadowOpacity` does.
 * Recognizes `#rgb[a]` / `#rrggbb[aa]` and `rgb()/rgba()`; any other format
 * (named colors, theme tokens) is returned unchanged.
 */
export function applyShadowOpacity(color: string, opacity: number): string {
  const o = clamp01(opacity);
  const c = color.trim();

  const hex = /^#([0-9a-f]+)$/i.exec(c);
  if (hex) {
    const h = hex[1];
    let r: number;
    let g: number;
    let b: number;
    let a = 1;
    if (h.length === 3 || h.length === 4) {
      r = Number.parseInt(h[0] + h[0], 16);
      g = Number.parseInt(h[1] + h[1], 16);
      b = Number.parseInt(h[2] + h[2], 16);
      if (h.length === 4) a = Number.parseInt(h[3] + h[3], 16) / 255;
    } else if (h.length === 6 || h.length === 8) {
      r = Number.parseInt(h.slice(0, 2), 16);
      g = Number.parseInt(h.slice(2, 4), 16);
      b = Number.parseInt(h.slice(4, 6), 16);
      if (h.length === 8) a = Number.parseInt(h.slice(6, 8), 16) / 255;
    } else {
      return color; // odd hex length — leave it alone
    }
    return `rgba(${r}, ${g}, ${b}, ${round(a * o)})`;
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(c);
  if (rgb) {
    const parts = rgb[1].split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      const raw = parts.length >= 4 ? Number.parseFloat(parts[3]) : 1;
      const a = Number.isFinite(raw) ? raw : 1;
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${round(a * o)})`;
    }
  }

  return color;
}

/**
 * Normalize RN shadow inputs into a {@link FrameShadowSpec}, or `null` when there
 * is nothing to paint (no color, or `shadowOpacity` of 0).
 */
export function resolveShadow(props: ShadowProps): FrameShadowSpec | null {
  const { shadowColor, shadowOffset, shadowRadius, shadowOpacity, inner } = props;

  if (typeof shadowColor !== "string" || shadowColor.length === 0 || shadowOpacity === 0) {
    return null;
  }

  return {
    dx: shadowOffset?.width ?? 0,
    dy: shadowOffset?.height ?? 0,
    blur: Math.max(0, shadowRadius ?? 0),
    color: shadowOpacity == null ? shadowColor : applyShadowOpacity(shadowColor, shadowOpacity),
    inner: Boolean(inner),
  };
}

/** Build a CSS `box-shadow` string from RN shadow inputs, or `undefined` for none. */
export function buildBoxShadow(props: ShadowProps): string | undefined {
  const s = resolveShadow(props);
  if (!s) {
    return undefined;
  }

  return `${s.inner ? "inset " : ""}${s.dx ?? 0}px ${s.dy ?? 0}px ${s.blur}px ${s.color}`;
}
