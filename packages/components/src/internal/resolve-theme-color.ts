import { type useTheme, variableToString } from "@knitui/core";

/**
 * Resolve a `$colorN` token (or an already-concrete color) to a value that
 * `react-native-svg` can paint with — it can't resolve theme tokens or
 * `currentColor` itself. Cross-platform via Tamagui's `variableToString`:
 * web → `var(--colorN)` (tracks the theme via CSS), native → the raw color
 * (`variable.val`); both are valid SVG `fill`/`stroke` values.
 *
 * THE single place icon color resolution lives, shared by `ControlIconProvider`
 * and the in-component glyph icons (Checkbox/Chip/Combobox chevron), so the
 * (token → concrete) rule can't drift between them. A non-token / unknown value
 * passes through unchanged.
 */
export const resolveThemeColor = (theme: ReturnType<typeof useTheme>, color: string): string => {
  const key = color.startsWith("$") ? color.slice(1) : color;
  const value = key ? theme[key as keyof typeof theme] : undefined;
  return value ? variableToString(value) : color;
};
