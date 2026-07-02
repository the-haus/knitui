import type { TamaguiProviderProps } from "@tamagui/core";

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
}
