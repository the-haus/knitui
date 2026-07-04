import { createTheme } from "./create-theme";
import { deepMerge } from "./merge";
import type { ThemeOptions } from "./options";

/**
 * Identity helper that preserves literal types for editor autocomplete. Use it
 * to author a reusable option set (e.g. a preset) without widening its types.
 */
export const defineTheme = <const T extends ThemeOptions>(options: T): T => options;

/**
 * Deep-merge option sets left-to-right and return the combined options WITHOUT
 * building. Later sets win; arrays and explicit ramps replace rather than merge.
 */
export const mergeThemeOptions = (...optionSets: ThemeOptions[]): ThemeOptions =>
  optionSets.reduce<ThemeOptions>(
    (acc, next) =>
      deepMerge(acc as Record<string, unknown>, next as Record<string, unknown>) as ThemeOptions,
    {},
  );

/**
 * Deep-merge option sets left-to-right (see {@link mergeThemeOptions}) and build
 * the resulting config. Handy for layering a brand onto a preset:
 *
 * ```ts
 * extendTheme(themePresets.vibrant, { brand: "#7C3AED" })
 * ```
 */
export const extendTheme = (...optionSets: ThemeOptions[]) =>
  createTheme(mergeThemeOptions(...optionSets));
