import "./globals.css";

import type { ReactNode } from "react";

import type { Metadata } from "next";

import { NextTamaguiProvider } from "@knitui/plugins/next";

export const metadata: Metadata = {
  title: "Knit UI — Next.js",
  description: "The @knitui cross-platform component library.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NextTamaguiProvider>{children}</NextTamaguiProvider>
      </body>
    </html>
  );
}
