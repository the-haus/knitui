# @knitui/plugins

Pre-configured Tamagui build-tool integrations for the knitui UI kit. Each entry
point wraps the matching `@tamagui/*` plugin with the kit's design-system config
and component list baked in — so an app installs **zero** `@tamagui/*` packages
and wires up **nothing** by hand. Override options by passing an object to any
of them.

This package is built on [`@knitui/core`](../core) (it resolves the kit's config
from there). The build-tool plugins are `optionalDependencies`, and `next` is an
optional peer — a native app pulls only what its bundler needs.

## Tamagui v3 compiler

Tamagui v3 compiles through the bundler plugins below — there is no babel plugin
any more. `@knitui/plugins/babel-plugin` is kept as a deprecated **no-op** that
warns once; remove it from `babel.config.js` and use the Metro wrapper instead.

Every wrapper points the compiler at `@knitui/core/config` and evaluates the kit's
component packages (`@knitui/core`, `components`, `dates`, `media`, `sheet`,
`carousel`). After changing the Tamagui config, restart Metro with
`npx expo start -c`; Metro does not invalidate its cache on config edits.

## Bundlers (zero config)

```js
// metro.config.js (Expo) — @tamagui/cli/metro
const { getDefaultConfig } = require("expo/metro-config");
const withKnitui = require("@knitui/plugins/metro");
module.exports = withKnitui(getDefaultConfig(__dirname));
```

```js
// next.config.mjs (Next.js App Router) — @tamagui/next-plugin, webpack only:
// build with `next build --webpack`
import { withKnitui } from "@knitui/plugins/next-plugin";
export default withKnitui({ reactStrictMode: true });
```

```js
// webpack.config.js
const TamaguiPlugin = require("@knitui/plugins/webpack");
config.plugins.push(TamaguiPlugin());
```

```ts
// vite.config.ts — @tamagui/cli/vite
import { knitui } from "@knitui/plugins/vite";
export default { plugins: [knitui()] };
```

## Next.js SSR provider

`@knitui/plugins/next-plugin` is the build-time half of the Next integration;
`@knitui/plugins/next` is the runtime half — it flushes the styles
react-native-web and Tamagui generate while rendering into the initial HTML, so
the page server-renders correctly (no FOUC, no hydration mismatch).

```tsx
// app/layout.tsx
import { NextTamaguiProvider } from "@knitui/plugins/next";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NextTamaguiProvider>{children}</NextTamaguiProvider>
      </body>
    </html>
  );
}
```

> All entry points are fully typed: the build plugins ship `.d.ts` declarations
> (typed against the underlying `@tamagui/*` plugin options), and the Next
> provider ships as typed `.tsx` source.

---

Part of [Knit UI](../../README.md).
