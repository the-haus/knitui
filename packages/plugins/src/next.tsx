"use client";

// @knitui/plugins/next — Next.js (App Router) SSR glue for the kit.
//
// react-native-web and Tamagui generate styles while rendering. On the server
// those styles must be flushed into the initial HTML, or the page ships
// unstyled and React reports a hydration mismatch. This wraps that flush so a
// Next app installs ZERO Tamagui / react-native-web packages itself and never
// imports `next/navigation`, `react-native`, or the kit's Tamagui `config`
// directly — just like `@knitui/plugins/babel-plugin` hides the compiler.
//
//   // app/layout.tsx
//   import { NextTamaguiProvider } from "@knitui/plugins/next";
//
//   export default function RootLayout({ children }) {
//     return (
//       <html lang="en">
//         <body>
//           <NextTamaguiProvider>{children}</NextTamaguiProvider>
//         </body>
//       </html>
//     );
//   }
//
// `next` is an optional peer (only Next apps pull this path); native apps never
// import it. The kit's design-system `config` comes from `@knitui/core`, the
// package this one is built on.

import type { ReactNode } from "react";
import { StyleSheet } from "react-native";

import { useServerInsertedHTML } from "next/navigation";

import { config } from "@knitui/core/config";

/** The slice of a Tamagui config the flush needs — anything `createTamagui` returned. */
interface CSSConfig {
  getCSS: (options?: { exclude?: "design-system" | null }) => string;
}

export interface NextTamaguiProviderProps {
  children: ReactNode;
  /**
   * The config whose theme + token CSS is flushed. Defaults to the kit's stock
   * design-system `config`. Pass your own when the app builds one at runtime
   * (`createTheme` / a reseeded palette) — flushing the stock config would ship
   * the stock theme variables in the server HTML and flash before hydration.
   */
  config?: CSSConfig;
  /**
   * Which CSS to leave out. Defaults to `"design-system"` in production (the
   * compiler already inlined those variables) and nothing in development. Pass
   * `null` to always emit everything — required with a runtime `config` the
   * compiler was never pointed at, since it inlined nothing of it.
   */
  exclude?: "design-system" | null;
}

/**
 * Flushes the styles Tamagui + react-native-web generate into the initial
 * server HTML so the kit's components server-render correctly (no FOUC, no
 * hydration mismatch). `useServerInsertedHTML` runs only during the SSR flush;
 * on the client this component just renders its children.
 *
 *  - `StyleSheet.getSheet()` — the atomic CSS react-native-web collected while
 *    rendering this request.
 *  - `config.getCSS()` — Tamagui's theme + token CSS (see `config` / `exclude`).
 */
export function NextTamaguiProvider({
  children,
  config: cssConfig = config,
  exclude = process.env.NODE_ENV === "production" ? "design-system" : null,
}: NextTamaguiProviderProps) {
  useServerInsertedHTML(() => {
    // @ts-expect-error — RNW's StyleSheet has getSheet() but it isn't typed.
    const rnwSheet = StyleSheet.getSheet();
    return (
      <>
        <style id={rnwSheet.id} dangerouslySetInnerHTML={{ __html: rnwSheet.textContent }} />
        <style dangerouslySetInnerHTML={{ __html: cssConfig.getCSS({ exclude }) }} />
      </>
    );
  });

  return <>{children}</>;
}
