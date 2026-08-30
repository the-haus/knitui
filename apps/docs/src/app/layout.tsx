import "./globals.css";

import type { ReactNode } from "react";

import type { Metadata, Viewport } from "next";

import { NextTamaguiProvider } from "@knitui/plugins/next";

import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";

import { DocsProviders } from "./providers";

/**
 * Site-wide defaults. Per-route `title`/`description`/`canonical` come from
 * `lib/seo.ts` — note there is deliberately NO `openGraph.url` here: a static
 * value at the root propagates to every page that does not override it, which is
 * how all 265 pages came to advertise themselves as the homepage.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // Leads with the terms the audience actually searches — "React Native
    // component library" — rather than the brand slogan the hero uses.
    default: "Knit UI — React Native + web component library for iOS, Android and web",
    template: "%s · Knit UI",
  },
  // Kept under ~155 chars: past that Google truncates mid-word. Every other page
  // gets this budget enforced by `snippet()`; this one is hand-held.
  description:
    "A cross-platform component library: 100+ React Native and web components sharing one design system and one import. Built on Tamagui.",
  alternates: { canonical: SITE_URL },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  icons: { icon: "/favicon.svg" },
  applicationName: SITE_NAME,
  authors: [{ name: "the.haus", url: "https://github.com/the-haus" }],
  creator: "the.haus",
  keywords: [
    "React Native component library",
    "cross-platform UI kit",
    "Tamagui components",
    "Expo UI library",
    "React Native web components",
    "design system",
  ],
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
