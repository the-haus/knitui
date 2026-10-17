import { type useTheme, variableToString } from "@knitui/core";

/**
 * Resolve a theme colour NAME (`color9`, `blue9`, `borderColor`; or an
 * already-concrete colour) to a value that `react-native-svg` can paint — it
 * can't resolve theme keys or `currentColor` itself. Cross-platform via Tamagui's
 * `variableToString`: web → `var(--color9)` (tracks the theme via CSS), native →
 * the raw colour (`variable.val`); both are valid SVG `fill`/`stroke` values.
 *
 * THE single place icon colour resolution lives, shared by `ControlIconProvider`
 * and the in-component glyph icons (Checkbox/Chip/Combobox chevron), so the
 * (name → concrete) rule can't drift between them. v3 has no `$` sigil: the
 * active theme IS the oracle — a key it defines resolves, anything else (`#fff`,
 * `rgb(…)`, an unknown name) passes through unchanged.
 */
export const resolveThemeColor = (theme: ReturnType<typeof useTheme>, color: string): string => {
  const value = color ? theme[color as keyof typeof theme] : undefined;
  return value ? variableToString(value) : color;
};
