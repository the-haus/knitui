import { Platform } from "react-native";

import type { OS } from "./use-os.shared";

/**
 * Detect the operating system on React Native — native counterpart of `use-os`.
 * Reads `Platform.OS` (`ios` / `android` / `windows` / `macos` / `web`), which
 * is known synchronously, so no effect/state is needed.
 */
export function useOs(): OS {
  return Platform.OS as OS;
}
