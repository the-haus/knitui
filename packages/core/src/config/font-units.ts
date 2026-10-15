import { isWeb } from "@tamagui/core";

/**
 * The px a `1rem` resolves to under the browser's DEFAULT font-size setting. The
 * kit's font ladder is authored in px against this, so at default settings a
 * converted value renders exactly the px it was written as.
 */
export const ROOT_FONT_SIZE_PX = 16;

/** `18` → `"1.125rem"`. Rounded to 5 decimals so float noise never reaches the CSS. */
export const pxToRem = (px: number): string => `${Number((px / ROOT_FONT_SIZE_PX).toFixed(5))}rem`;

/**
 * Whether font tokens are emitted in `rem`: on the web only. Native keeps numbers
 * (React Native has no rem, and its own Dynamic Type / font scale already scales
 * text). `isWeb` alone is not enough: the Tamagui compiler bundles the config for a
 * NATIVE build in node, where `@tamagui/constants` resolves its web entry — but it
 * defines `TAMAGUI_TARGET` as `"native"` there, so that pass still gets numbers.
 */
export const FONT_UNITS_REM: boolean = isWeb && process.env.TAMAGUI_TARGET !== "native";

/**
 * Convert one font section (`size` / `lineHeight`) of px numbers to the units
 * the platform scales with. On the web every number becomes a `rem` string, so
 * browser text-only zoom and a raised default font size scale the kit's text
 * (WCAG 1.4.4); with the default 16px root it renders the same px as before.
 * Anything else (a caller's own CSS length, a `$theme` reference, a Tamagui
 * Variable) passes through.
 *
 * The result is typed as the px record it came from because Tamagui's
 * `GenericFont` types sections as `number | Variable`, while at runtime it emits
 * any CSS length as-is (only a NUMBER gets `px` appended). Nothing in the kit
 * reads these values back as numbers: px math goes through the config-free
 * `getFontSize` / `getLineHeight`, which stay numeric on every platform.
 */
export const toFontUnits = <S extends Record<string, unknown>>(
  section: S,
  rem: boolean = FONT_UNITS_REM,
): S => {
  if (!rem) return section;
  const out: Record<string, unknown> = {};
  for (const key in section) {
    const value = section[key];
    out[key] = typeof value === "number" ? pxToRem(value) : value;
  }
  return out as S;
};
