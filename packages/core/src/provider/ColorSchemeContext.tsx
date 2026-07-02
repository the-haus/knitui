import { createContext, useContext } from "react";

import type { ColorSchemeContextValue } from "./Provider.types";

export const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

/** Read + control the active light/dark color scheme. */
export function useColorScheme(): ColorSchemeContextValue {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) {
    throw new Error("useColorScheme must be used within <Provider>");
  }
  return ctx;
}
