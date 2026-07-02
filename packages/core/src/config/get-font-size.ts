import { font, lineHeightRatios } from "./scales";

type FontSizeKey = keyof typeof font;

const FONT_SIZE_KEYS = new Set<string>(Object.keys(font));

/**
 * Resolve a font-size TOKEN to its raw px value against the body font scale.
 *
 * Tamagui's own `getFontSize` is NOT exported by the pinned `@tamagui/core`, and
 * the generic `getTokenValue(…, "size")` reads the control-size ladder (24→64),
 * NOT the font ladder (12→28) — so this reads the static `font` scale directly.
 * Like `resolveSizePx` (see `components/internal/control-metrics.ts`) it is
 * config-free and safe to call at MODULE-LOAD time and during SSR, before the
 * Tamagui config exists. The number it returns is exactly what a `$`-token
 * resolves to on `fontSize` (e.g. `$xxl` → `bodyFont.size.xxl` → `font.xxl` 28).
 *
 * Accepts a `$`-token (`"$xxl"`), a bare key (`"xxl"`), the `"$true"`/`"true"`
 * alias (→ the `md` step, matching the font config), or a number (passed
 * through). An unrecognized string falls back to the `md` step.
 */
export const getFontSize = (size: string | number): number => {
  if (typeof size === "number") return size;
  const key = size.startsWith("$") ? size.slice(1) : size;
  if (key === "true") return font.md;
  return FONT_SIZE_KEYS.has(key) ? font[key as FontSizeKey] : font.md;
};

/**
 * Resolve a font-size TOKEN to its LINE HEIGHT in px — exactly the value the
 * Tamagui font config derives (`config/fonts.ts`: `round(fontSize * ratio)`),
 * making this the single source of truth for "how tall is one line at size X".
 * Retuning `font` or `lineHeightRatios` in `scales.ts` moves it automatically, so
 * row-count → pixel-height math (e.g. the native textarea's `minRows`/`maxRows`)
 * never drifts from the rendered line height. Config-free and SSR-safe, same as
 * `getFontSize`.
 *
 * Accepts the same inputs as `getFontSize`. A bare number is treated as a raw font
 * size and scaled by the `md` ratio (a numeric size carries no token ratio of its
 * own); `"true"` and unrecognized strings fall back to the `md` step.
 */
export const getLineHeight = (size: string | number): number => {
  if (typeof size === "number") return Math.round(size * lineHeightRatios.md);
  const raw = size.startsWith("$") ? size.slice(1) : size;
  const key = (raw === "true" || !FONT_SIZE_KEYS.has(raw) ? "md" : raw) as FontSizeKey;
  return Math.round(font[key] * lineHeightRatios[key]);
};
