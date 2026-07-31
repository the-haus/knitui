import type { TamaguiProviderProps, ViewProps } from "@tamagui/core";

export type ColorScheme = "light" | "dark";
export type ColorSchemePreference = ColorScheme | "system";

export interface ColorSchemeContextValue {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorSchemePreference) => void;
  toggleColorScheme: () => void;
}

export interface ProviderProps extends Omit<TamaguiProviderProps, "config" | "defaultTheme"> {
  /** Initial color scheme. "system" follows the OS appearance. */
  defaultColorScheme?: ColorSchemePreference;
  /** Force a color scheme regardless of OS / user preference. */
  forceColorScheme?: ColorScheme;
  /**
   * A custom Tamagui config (e.g. from `createTheme` / `extendTheme`). Falls
   * back to the kit's built-in config when omitted.
   */
  config?: TamaguiProviderProps["config"];
  /**
   * Fill for the full-screen background the provider paints behind every route.
   * Defaults to the theme's `$background`.
   *
   * Pass `"transparent"` when the host already paints the page background
   * itself — a web page with its own CSS background (gradients, washes, a
   * `--custom-property` scheme) would otherwise be covered by this layer, since
   * it sits above the document and spans the whole window.
   */
  backgroundColor?: ViewProps["backgroundColor"];
}
