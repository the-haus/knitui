import { useSyncExternalStore } from "react";

import type { ColorScheme } from "./Provider.types";

const darkSchemeQuery = "(prefers-color-scheme: dark)";

function getSnapshot(): ColorScheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia(darkSchemeQuery).matches ? "dark" : "light";
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(darkSchemeQuery);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

export function useSystemColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, getSnapshot, () => "light");
}
