import "@tamagui/native/setup-gesture-handler";
import "@tamagui/native/setup-expo-linear-gradient";
import "@tamagui/native/setup-teleport";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SharedProvider } from "./Provider.shared";
import type { ProviderProps } from "./Provider.types";

export function Provider(props: ProviderProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SharedProvider {...props} />
    </GestureHandlerRootView>
  );
}
