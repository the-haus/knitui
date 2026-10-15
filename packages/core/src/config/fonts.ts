import { createFont } from "@tamagui/core";

import { toFontUnits } from "./font-units";
import { font as f, lineHeightRatios as lh, monoFontFamily, systemFontFamily } from "./scales";

// Authored in px; `toFontUnits` emits them as `rem` on the web (so browser text
// zoom scales them) and keeps numbers on native — see `font-units.ts`.
const size = toFontUnits({
  xxs: f.xxs,
  xs: f.xs,
  sm: f.sm,
  md: f.md,
  lg: f.lg,
  xl: f.xl,
  xxl: f.xxl,
  true: f.md,
});
const lineHeight = toFontUnits({
  xxs: Math.round(f.xxs * lh.xxs),
  xs: Math.round(f.xs * lh.xs),
  sm: Math.round(f.sm * lh.sm),
  md: Math.round(f.md * lh.md),
  lg: Math.round(f.lg * lh.lg),
  xl: Math.round(f.xl * lh.xl),
  xxl: Math.round(f.xxl * lh.xxl),
  true: Math.round(f.md * lh.md),
});
const weight = { 4: "400", 5: "500", 6: "600", 7: "700", true: "400" };

export const bodyFont = createFont({
  family: systemFontFamily,
  size,
  lineHeight,
  weight,
  letterSpacing: { true: 0 },
});

export const headingFont = createFont({
  family: systemFontFamily,
  size,
  lineHeight,
  weight: { ...weight, true: "700" },
  letterSpacing: { true: 0 },
});

export const monoFont = createFont({
  family: monoFontFamily,
  size,
  lineHeight,
  weight: { ...weight, true: "400" },
});

export const fonts = { body: bodyFont, heading: headingFont, mono: monoFont };
