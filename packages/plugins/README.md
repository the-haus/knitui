# @knitui/plugins

Pre-configured Tamagui build-tool integrations for the knitui UI kit. Each entry
point wraps the matching `@tamagui/*` plugin with the kit's design-system config
and component list baked in — so an app installs **zero** `@tamagui/*` packages
and wires up **nothing** by hand. Override options by passing an object to any
of them.

This package is built on [`@knitui/core`](../core) (it resolves the kit's config
from there). The build-tool plugins are `optionalDependencies`, and `next` is an
optional peer — a native app pulls only what its bundler needs.

## Babel (optional compiler)

The Tamagui compiler is an optional build-time optimizer — it flattens the kit's
`styled()` components into static styles for faster runtime.

```js
// babel.config.js
module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    require("@knitui/plugins/babel-plugin"),
    "react-native-reanimated/plugin", // must stay LAST
  ],
};
```

Override options with `require("@knitui/plugins/babel-plugin").withOptions({ logTimings: false })`.

## Bundlers (zero config)

```js
// metro.config.js (Expo)
const { getDefaultConfig } = require("expo/metro-config");
const withTamagui = require("@knitui/plugins/metro");
module.exports = withTamagui(getDefaultConfig(__dirname));
```

```js
// next.config.mjs (Next.js App Router)
import { withKnitui } from "@knitui/plugins/next-plugin";
export default withKnitui({ reactStrictMode: true });
```

```js
// webpack.config.js
const TamaguiPlugin = require("@knitui/plugins/webpack");
config.plugins.push(TamaguiPlugin());
```

```ts
// vite.config.ts
import { tamagui } from "@knitui/plugins/vite";
export default { plugins: [tamagui()] };
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
