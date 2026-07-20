# @knitui/core

The foundation of the knitui UI kit — Tamagui config, theming, primitives, and the
styling/motion engine, all re-exported under one namespace.

## Zero Tamagui packages to install

You never add a `@tamagui/*` package to your own `package.json`. The kit depends
on them internally and re-exports everything you need. Install the kit plus the
two native peers and you're done:

```sh
# Expo
npx expo install @knitui/core @knitui/components \
  react-native-gesture-handler react-native-reanimated

# bare React Native / web
npm install @knitui/core @knitui/components \
  react-native-gesture-handler react-native-reanimated
```

> `react-native-gesture-handler` and `react-native-reanimated` are required on
> every platform. If either is missing you get a clear, actionable error the
> first time a component renders (see `ensure-peer-deps`).

## Usage

Wrap your app once — `<Provider>` sets up theming **and** mounts the
`GestureHandlerRootView` for you:

```tsx
import { Provider } from "@knitui/core"; // or from "@knitui/components"
import { Button, Card } from "@knitui/components";

export default function App() {
  return (
    <Provider defaultColorScheme="system">
      <Card>
        <Button>Hello</Button>
      </Card>
    </Provider>
  );
}
```

Everything imports from the kit — components from `@knitui/components`, and the
styling/motion escape hatch (`styled`, `useMedia`, token helpers, `useSharedValue`,
`withDecay`, `Gesture`, `GestureDetector`, …) from `@knitui/core` (also re-exported
from `@knitui/components`). You should never need to import `@tamagui/*`,
`react-native-reanimated`, or `react-native-gesture-handler` directly.

## Build-tool integrations

The Tamagui compiler and the per-bundler plugins (babel, metro, next, vite,
webpack) plus the Next.js SSR provider live in their own package,
[`@knitui/plugins`](../plugins), so a runtime-only consumer of `@knitui/core`
doesn't pull the build-tool dependency surface. Each entry point comes pre-wired
with this package's config + component list baked in:

```js
// babel.config.js
require("@knitui/plugins/babel-plugin");
```

See the [`@knitui/plugins` README](../plugins/README.md) for the metro, next, vite,
and webpack setups.

## Custom branding — `createTheme`

Spin up a fully-configured Tamagui config from a set of brand inputs. **Every
option is optional** and falls back to the kit's defaults, so override as little
or as much as you need. A single brand hex auto-derives its 12-step light/dark
ramps.

```tsx
import { createTheme, Provider } from "@knitui/core";

export const config = createTheme({
  // brand & accents — a hex, a @tamagui/colors name, {light,dark}, or 12-step ramps
  brand: "violet", // real Radix ramp from @tamagui/colors
  // brand: "#7C3AED",                           // …or a hex (light/dark auto-generated)
  // brand: { light: "violet", dark: "purple" }, // …or mix names/hex per scheme
  brandThemeName: "primary", // theme="primary" (default "brand")
  accents: { teal: "#14b8a6", brandish: "indigo" }, // theme="teal" / theme="brandish"
  includeDefaultAccents: true, // keep built-in blue/red/green/…
  includeTamaguiColors: true, // or register all 28 @tamagui/colors
  // includeTamaguiColors: ["violet", "sand", "slate"], // …or just these

  // neutral chrome
  neutral: "#71717a", // base UI ramp (default gray)
  shadows: { light: { shadowColor: "rgba(124,58,237,.15)" } },

  // tokens
  radius: "rounded", // "default" | "rounded" | "sharp" | { md: 12, … }
  space: "comfortable", // "default" | "compact" | "comfortable" | { … }
  size: { md: 18 }, // sizing scale (defaults to match `space`)
  fontSizes: { xl: 24 }, // font-size scale overrides
  zIndex: { 6: 600 },
  colors: { brandRaw: "#7C3AED" }, // extra raw color tokens

  // fonts — family string or full overrides; add any named fonts (e.g. mono)
  fonts: {
    body: "Inter",
    heading: { family: "Sora", weight: { 7: "800" } },
    mono: "JetBrains Mono",
  },
  defaultFont: "body",

  // responsive
  breakpoints: { md: 900 }, // rebuilds the media queries
  media: { tall: { minHeight: 800 } },

  // motion / styling
  animations: myDriver, // replace the animation driver
  shorthands: { bgc: "backgroundColor" },
  settings: { onlyAllowShorthands: false },
  // (initial color scheme is a runtime concern — set it on
  //  <Provider defaultColorScheme="light" /> rather than here)

  // escape hatches for anything not surfaced above (both deep-merged)
  themeBuilder: {/* templates, masks, … merged into createThemes */},
  themes: undefined, // a fully-built themes object bypasses the builder
  tamagui: {/* deep-merged into createTamagui() — augments, never clobbers */},
});

export const App = ({ children }) => <Provider config={config}>{children}</Provider>;
```

Any palette input accepts a hex seed (dark auto-derived), a `@tamagui/colors`
name, `{ light, dark }` seeds for explicit dark-mode tuning, or explicit 12-step
`{ light: [...], dark: [...] }` ramps. Call `createTheme()` with no arguments to
reproduce the kit's stock look — same tokens, fonts, and base/accent/children
palettes (plus a `brand` theme aliased to the accent).

Feed the result to `<Provider>`:

```tsx
import { Provider, createTheme } from "@knitui/core";

const config = createTheme({ brand: "violet" });

export const App = ({ children }) => <Provider config={config}>{children}</Provider>;
```

> A hex `brand`/`neutral`/accent seed is expanded into a 12-step ramp by a
> built-in approximation (fixed per-step lightness, seed hue + saturation). For a
> pixel-exact scale, pass a `@tamagui/colors` name or explicit 12-step ramps.

### Hard to misconfigure

Every option is optional and layers onto a complete, valid default — so you can
override one slice without breaking the rest. Inputs are **strictly validated**:
unknown options, typo'd scale steps, bad presets, malformed hex, unknown color
names, wrong-length ramps, reserved accent names, and an undefined `defaultFont`
all throw immediately with an actionable, "did you mean …?" message rather than
producing a subtly-wrong theme. Named palettes and preset names autocomplete in
the editor.

### Presets & composition

Start from a curated preset and layer your brand on top with `extendTheme`:

```tsx
import { extendTheme, themePresets } from "@knitui/core";

// themePresets: "minimal" | "vibrant" | "professional"
export const config = extendTheme(themePresets.vibrant, { brand: "#7C3AED" });
```

- `extendTheme(...optionSets)` — deep-merges option sets left-to-right, then builds.
- `mergeThemeOptions(...optionSets)` — same merge, returns the options (no build).
- `defineTheme(options)` — identity helper that preserves literal types for autocomplete.

### Per-component customization — planned

A per-component `components` layer (constrained recolor templates + default props
via `componentDefaults` / `defineComponentDefaults`) is on the roadmap but **not
yet implemented**. Until it lands, recolor a component with the existing theme
system (`<Theme name="teal"><Badge /></Theme>` or `theme="teal"` on the frame)
and set default props by wrapping your own thin component.

---

Part of [Knit UI](../../README.md).
