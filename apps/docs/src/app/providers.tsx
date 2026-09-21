"use client";

import { type ReactNode, useEffect } from "react";

import { Provider, useColorScheme } from "@knitui/core";
import { setWorkerUrl } from "@knitui/map/worker";

// Map demos load maplibre's worker from /public (copied in by next.config.mjs).
// `@knitui/map/worker` only stores the URL, so this doesn't pull maplibre into
// every page.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

/**
 * The client boundary for the whole site.
 *
 * `@knitui/*` components are not React Server Components (they use context and
 * hooks), so everything that renders the kit has to sit below a `"use client"`
 * file. This is that file — one boundary for the app rather than one per
 * component. Client components still server-render to HTML, so prose and chrome
 * stay in the initial payload; they just hydrate afterwards.
 *
 * `Provider` (from `@knitui/core`) supplies the Tamagui config, the light/dark
 * controller, the `GestureHandlerRootView`, and the teleport host that `Portal`,
 * `Modal`, `Tooltip` and friends render into — so it must wrap the site exactly
 * once. The SSR style flush is `NextTamaguiProvider`, applied in `layout.tsx`.
 *
 * `backgroundColor="transparent"` opts out of the provider's full-screen
 * `$background` layer. That layer is right for an app, where the theme owns the
 * whole window, but this site paints its own page background in `globals.css`
 * (`--docs-bg` plus the brand `--docs-body-wash` radials) — and the provider's
 * layer spans the document, so it would cover both.
 */

export const COLOR_SCHEME_STORAGE_KEY = "knitui-docs-color-scheme";

export function DocsProviders({ children }: { children: ReactNode }) {
  return (
    <Provider defaultColorScheme="system" backgroundColor="transparent">
      <ColorSchemeSync />
      {children}
    </Provider>
  );
}

/**
 * Bridges the kit's color scheme to the parts of the page that can't read React
 * context: the docs' own CSS (prose, chrome, code blocks) keys off
 * `<html data-theme>`, because Tamagui's theme class sits on an inner wrapper.
 *
 * Also restores the visitor's stored preference. A static export ships one HTML
 * file for everyone, so the first paint is always the `system` default and this
 * corrects it on mount.
 */
function ColorSchemeSync() {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    const stored = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") setColorScheme(stored);
  }, [setColorScheme]);

  useEffect(() => {
    document.documentElement.dataset.theme = colorScheme;
  }, [colorScheme]);

  return null;
}
