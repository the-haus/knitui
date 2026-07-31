import { useCallback, useMemo, useState } from "react";
import { PortalProvider } from "react-native-teleport";

import { getConfig, setConfig, TamaguiProvider, View } from "@tamagui/core";

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
 * Register `config` as the one Tamagui resolves tokens against, if it isn't
 * already. Idempotent, one identity compare when there is nothing to do.
 *
 * ## Why the provider has to do this
 *
 * Tamagui keeps ONE config per process (a module-level `conf`, plus
 * `globalThis.__tamaguiConfig`). `createTamagui` registers its result as a side
 * effect of being called and `setConfig` is last-write-wins — but
 * `<TamaguiProvider config={…}>` does **not** register what it is handed; it only
 * reads `config.getCSS()` and `config.animations`. So passing a config to a
 * provider does not make it active: the config that actually resolves every
 * `$token` is whichever module called `createTamagui` LAST.
 *
 * That is a module-evaluation race, and it is one a consumer cannot reliably win.
 * The kit ships its own `createTamagui` call (`../config/config`, named below as
 * this prop's default), so an app with a `createTheme` config of its own is always
 * in a two-writer situation, and which one lands last is decided by the bundler:
 *
 * - webpack evaluates this module's `defaultConfig` import eagerly, and whether
 *   that lands before or after the app's `createTheme()` depends on graph order.
 *   Measured in a Next app: the app's config won during SSR and LOST on the
 *   client, so raw colour tokens resolved in the server HTML and silently stopped
 *   resolving after hydration.
 * - Metro's `inlineRequires` defers an import to its first USE — for a parameter
 *   default, to the first render that omits `config`. So the same app could go the
 *   other way, and worse: any code that touched the stock config in passing (a
 *   diagnostic comparing `getConfig()` against it, say) evaluated it right there
 *   and clobbered the app's config mid-render.
 *
 * Only RAW tokens break, which is what makes it so slow to notice: theme values
 * (`$background`, `$color10`, `$borderColor`) resolve through the theme and both
 * configs carry the same theme names, so the app looks fine while every
 * `$myBrandColor` quietly resolves to nothing.
 *
 * Registering here removes the question — the provider is the point where the
 * consumer states which config is theirs, so it is the point where that should
 * become true. It also self-heals: a stray late `createTamagui` is corrected on
 * the next render of this component rather than poisoning the session.
 *
 * `configureMedia` is deliberately NOT re-run alongside `setConfig` (the pair
 * `createTamagui` calls internally). It resets the media caches and re-subscribes
 * `matchMedia` listeners, which is not something to do from a render pass, and the
 * media map is one of the few parts of a config that a `createTheme` result and
 * the stock config always agree on.
 */
function activateConfig(config: NonNullable<ProviderProps["config"]>): void {
  // `getConfig()` cannot throw its "haven't called createTamagui yet" here: we
  // are holding a config, so the call that produced it has already registered
  // one.
  if (getConfig() !== config) {
    setConfig(config as Parameters<typeof setConfig>[0]);
  }
}

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
  // Make the config we were handed THE active one — see `activateConfig`. Called
  // in render, not an effect, because descendants resolve tokens as they render
  // and an effect runs after them.
  activateConfig(config);

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
