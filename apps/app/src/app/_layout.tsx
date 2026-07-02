import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Provider, useTheme } from "@knitui/core";
import { MediaProvider } from "@knitui/demo";

/** Renders the router's stack with header colors bound to the active theme. */
function ThemedStack() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background?.val },
        headerTintColor: theme.color?.val,
        contentStyle: { backgroundColor: theme.background?.val },
      }}
    />
  );
}

/**
 * Root layout for the Expo Router app. Wraps every route in `<Provider>` (theme)
 * and `<SafeAreaProvider>`. Routes live in this `app/` directory and are
 * lazy-loaded by the router — only the route you navigate to is mounted.
 *
 * `<Provider>` (from `@knitui/core`) mounts `react-native-teleport`'s
 * `PortalProvider` and its full-screen root `PortalHost`, so overlays
 * (`Popover`/`Menu`/`Select`/`Combobox`/`Drawer`/`Dialog`) teleport out of their
 * route's `ScrollView` — escaping scroll/overflow clipping and stacking — instead
 * of rendering inline. With teleport the move happens at the native view level,
 * so the overlay and its outside-press scrim cover the whole screen rather than
 * just their inline parent.
 *
 * `<MediaProvider>` (from `@knitui/media`, re-exported by `@knitui/demo`) sits at the
 * SAME root level so it is one instance spanning every route: it owns the single
 * shared `<audio>`/`expo-video` element and teleports it into whichever `<Audio>`/
 * `<Video>` is active in the lazily-mounted `/section/[id]` route. Mounting it per
 * route would dispose the engine on every navigation.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider defaultColorScheme="light">
        <MediaProvider>
          <StatusBar style="auto" />
          <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
            <ThemedStack />
          </KeyboardAvoidingView>
        </MediaProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
