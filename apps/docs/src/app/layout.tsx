import "./globals.css";

import type { ReactNode } from "react";

import type { Metadata, Viewport } from "next";

import { NextTamaguiProvider } from "@knitui/plugins/next";

import { DocsProviders } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://knitui.dev"),
  title: {
    default: "Knit UI — one component kit for iOS, Android and web",
    template: "%s · Knit UI",
  },
  description:
    "Knit UI is a cross-platform component kit: 100+ React Native + web components, one design system, one import. Built on Tamagui.",
  openGraph: {
    type: "website",
    siteName: "Knit UI",
    url: "https://knitui.dev",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0a16" },
  ],
};

/**
 * `NextTamaguiProvider` flushes the CSS that react-native-web and Tamagui
 * generate during render into the initial HTML — without it every page ships
 * unstyled and React reports a hydration mismatch. `DocsProviders` is the kit's
 * runtime `Provider` (theming, gestures, portal host).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextTamaguiProvider>
          <DocsProviders>{children}</DocsProviders>
        </NextTamaguiProvider>
      </body>
    </html>
  );
}
