import { useCallback, useMemo, useState } from "react";
import { PortalProvider } from "react-native-teleport";

import { TamaguiProvider, View } from "@tamagui/core";

import defaultConfig from "../config/config";
import { ColorSchemeContext } from "./ColorSchemeContext";
import type {
  ColorScheme,
  ColorSchemeContextValue,
  ColorSchemePreference,
  ProviderProps,
} from "./Provider.types";
import { useSystemColorScheme } from "./useSystemColorScheme";

/**
 * Shared provider implementation for web and native. Platform entrypoints add
 * only the setup/wrappers they need around this component.
 */
export function SharedProvider({
  defaultColorScheme = "system",
  forceColorScheme,
  config = defaultConfig,
  children,
  ...rest
}: ProviderProps) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreference] = useState<ColorSchemePreference>(defaultColorScheme);

  const colorScheme: ColorScheme =
    forceColorScheme ?? (preference === "system" ? systemScheme : preference);

  const setColorScheme = useCallback((scheme: ColorSchemePreference) => {
    setPreference(scheme);
  }, []);

  const toggleColorScheme = useCallback(() => {
    setPreference(colorScheme === "dark" ? "light" : "dark");
  }, [colorScheme]);

  const value = useMemo<ColorSchemeContextValue>(
    () => ({ colorScheme, setColorScheme, toggleColorScheme }),
    [colorScheme, setColorScheme, toggleColorScheme],
  );

  return (
    <ColorSchemeContext.Provider value={value}>
      <TamaguiProvider config={config} defaultTheme={colorScheme} {...rest}>
        {/*
         * Full-screen themed background. Sitting just inside `TamaguiProvider`,
         * it paints `$background` across the entire window — behind every route,
         * the navigator header, and the OS safe areas — so the theme color is
         * never clipped to route content and switching color scheme repaints the
         * whole screen (including the status-bar/home-indicator regions).
         */}
        <View flex={1} backgroundColor="$background">
          {/*
           * `PortalProvider` (react-native-teleport) enables native view
           * re-parenting and mounts a full-screen host named "root". Overlays
           * (`Popover`/`Menu`/`Tooltip`/`Modal`/`Drawer`/…) teleport into it via
           * `<Portal hostName="root">`, so they escape clipping/stacking ancestors
           * on every platform. It sits inside `TamaguiProvider` so the host — and
           * any content teleported into it on web — stays within theme scope.
           */}
          <PortalProvider>{children}</PortalProvider>
        </View>
      </TamaguiProvider>
    </ColorSchemeContext.Provider>
  );
}
