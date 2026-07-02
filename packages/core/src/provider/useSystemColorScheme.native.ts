import { useColorScheme } from "react-native";

import type { ColorScheme } from "./Provider.types";

export function useSystemColorScheme(): ColorScheme {
  return useColorScheme() === "dark" ? "dark" : "light";
}
