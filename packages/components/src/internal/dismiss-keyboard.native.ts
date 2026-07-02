import { Keyboard } from "react-native";

/**
 * Native variant of {@link file://./dismiss-keyboard.ts}: blur the currently
 * focused input (and hide the soft keyboard). A no-op when nothing is focused.
 * Isolating the `react-native` import here keeps the cross-platform components
 * (e.g. `Popover`) free of direct `react-native` imports.
 */
export function dismissKeyboard(): void {
  Keyboard.dismiss();
}
