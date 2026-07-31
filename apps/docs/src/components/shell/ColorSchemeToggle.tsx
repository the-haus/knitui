"use client";

import { useColorScheme } from "@knitui/core";

import { COLOR_SCHEME_STORAGE_KEY } from "@/app/providers";

/**
 * Light/dark switch. Drives the kit's own `useColorScheme` (so every component on
 * the page re-themes) and persists the choice; `ColorSchemeSync` mirrors the
 * result onto `<html data-theme>` for the docs' plain-CSS chrome.
 */
export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const next = colorScheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="button-quiet"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => {
        window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next);
        toggleColorScheme();
      }}
    >
      <span aria-hidden="true">{colorScheme === "dark" ? "☾" : "☀"}</span>
    </button>
  );
}
