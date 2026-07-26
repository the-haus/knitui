import { useTheme } from "@knitui/core";

import { resolveThemeColor } from "./resolve-theme-color";

/**
 * Resolve a control's icon colour token — NATIVE implementation (overrides the
 * web `use-icon-color.ts`).
 *
 * `react-native-svg` cannot paint `$colorN`, so the concrete value genuinely has
 * to be read out of the active theme, and the component genuinely has to be a
 * theme subscriber so it repaints on a theme change. On web none of that is
 * needed — see the web twin for why that split exists.
 */
export const useIconColor = (token: string): string => {
  const theme = useTheme();
  return resolveThemeColor(theme, token);
};
