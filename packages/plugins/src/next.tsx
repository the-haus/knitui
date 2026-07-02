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

/**
 * Flushes the styles Tamagui + react-native-web generate into the initial
 * server HTML so the kit's components server-render correctly (no FOUC, no
 * hydration mismatch). `useServerInsertedHTML` runs only during the SSR flush;
 * on the client this component just renders its children.
 *
 *  - `StyleSheet.getSheet()` — the atomic CSS react-native-web collected while
 *    rendering this request.
 *  - `config.getCSS()` — Tamagui's theme + token CSS. In production we exclude
 *    the design-system variables the compiler already inlines.
 */
export function NextTamaguiProvider({ children }: { children: ReactNode }) {
  useServerInsertedHTML(() => {
    // @ts-expect-error — RNW's StyleSheet has getSheet() but it isn't typed.
    const rnwSheet = StyleSheet.getSheet();
    return (
      <>
        <style id={rnwSheet.id} dangerouslySetInnerHTML={{ __html: rnwSheet.textContent }} />
        <style
          dangerouslySetInnerHTML={{
            __html: config.getCSS({
              exclude: process.env.NODE_ENV === "production" ? "design-system" : null,
            }),
          }}
        />
      </>
    );
  });

  return <>{children}</>;
}
