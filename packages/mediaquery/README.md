# @knitui/mediaquery

Cross-platform media queries and responsive breakpoints for Knit UI — one API
that runs on **web (Next.js)** and **React Native (Expo)**, SSR-safe.

- **`useMediaQuery`** — a `matchMedia`-compatible hook. Pass a CSS media query
  string _or_ a structured descriptor.
- **`useBreakpoint` / `useBreakpointValue`** — imperative access to the breakpoint
  scale defined in `@knitui/core` (the same scale that powers Tamagui's
  `$gtSm`-style media props).
- **SSR seeding** — a `MediaQueryProvider` + `User-Agent` device detection so the
  server and first client render agree (no hydration flash).

Pure query parsing/evaluation is exported too (`parseMediaQuery`, `matchesQuery`,
`queryToString`) for use outside React.

## How it works across platforms

|                                           | Web (Next.js)                           | Native (Expo)                                                                     |
| ----------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------- |
| Engine                                    | `window.matchMedia` (full CSS fidelity) | `Dimensions` + `Appearance` + `AccessibilityInfo`, evaluated by a built-in parser |
| Supported                                 | any CSS media feature                   | width/height, `orientation`, `prefers-color-scheme`, `prefers-reduced-motion`     |
| Web-only features (`hover`, `pointer`, …) | work natively                           | fail safe → the OR group evaluates to `false` (dev warning)                       |

Because native has no `matchMedia`, prefer the **structured descriptor** form for
anything you need to behave identically on both platforms.

## Usage

```tsx
import { useMediaQuery, useBreakpoint, useBreakpointValue } from "@knitui/mediaquery";

function Example() {
  const isWide = useMediaQuery("(min-width: 768px)"); // string (matchMedia)
  const isPortrait = useMediaQuery({ orientation: "portrait" }); // structured
  const breakpoint = useBreakpoint(); // "base" | "xs" | … | "xxl"
  const columns = useBreakpointValue({ base: 1, sm: 2, lg: 4 });
  // …
}
```

## SSR — is "mobile vs desktop" known on the server?

A media query is viewport-based, and **a server has no viewport**, so a width
query can't be _measured_ during SSR — the hook returns its fallback and then
corrects after mount. To avoid a first-paint flash you can _guess_ the device on
the server from the request `User-Agent` (or a `Sec-CH-UA-Mobile` client hint)
and seed the provider. The server render and first client render then agree.

```tsx
// app/layout.tsx (Next.js App Router)
import { headers } from "next/headers";
import { MediaQueryProvider, deviceSeedFromUserAgent } from "@knitui/mediaquery";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ua = (await headers()).get("user-agent");
  return (
    <html>
      <body>
        <MediaQueryProvider seed={deviceSeedFromUserAgent(ua)}>{children}</MediaQueryProvider>
      </body>
    </html>
  );
}
```

Without a provider, hooks are still SSR-safe: they render the fallback
(`initialValue`, default `false` / `"base"`) on the server and the first client
render, then read the real value in an effect. Pass a per-call `initialValue`, or
set `getInitialValueInEffect: false` in a **pure client-side** app to read the
real value immediately (skips SSR-safety).

On **native** there is no SSR and `Dimensions` is available synchronously, so the
seed is a no-op there.

## Packaging

Unlike most kit packages (which source-ship), `@knitui/mediaquery` builds a real
distributable — `main`/`module`/`types` resolve to `./lib/**` (compiled by
`react-native-builder-bob`), while `source`/`react-native` point Metro straight at
`./src`. This means **Next.js consumers get prebuilt JS + working types without
adding the package to `transpilePackages`**, and Expo/Metro still gets raw source.

## API

| Export                                                       | Description                                               |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| `useMediaQuery(query, initialValue?, options?)`              | Boolean for a matchMedia string or `MediaQueryObject`.    |
| `useBreakpoint()`                                            | Active breakpoint band (min-width based, mobile-first).   |
| `useBreakpointValue(map)`                                    | Value for the active band, falling back to smaller bands. |
| `MediaQueryProvider`                                         | Supplies an SSR seed / config to all hooks.               |
| `deviceSeedFromUserAgent(ua)` / `detectDeviceClass(ua)`      | Server-side device detection.                             |
| `parseMediaQuery` / `matchesQuery` / `queryToString`         | Pure query engine.                                        |
| `breakpoints`, `resolveBreakpoint`, `resolveResponsiveValue` | Breakpoint scale + resolvers.                             |
