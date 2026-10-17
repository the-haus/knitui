import "@tamagui/native/setup-gesture-handler";
import "@tamagui/native/setup-teleport";

import { GestureHandlerRootView } from "react-native-gesture-handler";

// v3 note: `@tamagui/native/setup-expo-linear-gradient` is gone (v3 draws
// gradients itself; the kit's gradient is its own `gradient.native.tsx` anyway).
// The provider does NOT import `@tamagui/native/setup-safe-area`, so it has no
// SafeAreaProvider ordering requirement. An app that adds that setup must put
// `<SafeAreaProvider>` OUTSIDE `<Provider>` (v3's provider reads safe-area context
// to publish inset tokens and throws NO_INSETS_ERROR otherwise).
import { SharedProvider } from "./Provider.shared";
import type { ProviderProps } from "./Provider.types";

export function Provider(props: ProviderProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SharedProvider {...props} />
    </GestureHandlerRootView>
  );
}
