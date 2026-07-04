<div align="center">

# Knit UI

**A cross-platform (React Native + Web) component kit and design system.**

[![CI](https://github.com/the-haus/knitui/actions/workflows/ci.yml/badge.svg)](https://github.com/the-haus/knitui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)

Write your UI once with a single, richly-themed component API and ship it to
iOS, Android, and the web — powered by [Tamagui](https://tamagui.dev),
[React Native](https://reactnative.dev), and
[React Native Web](https://necolas.github.io/react-native-web/).

</div>

---

## Why Knit UI

- **One API, every platform.** Components render to real native views on
  iOS/Android and to accessible DOM on the web — no per-platform forks in your
  app code.
- **Batteries included.** ~100 components, date/time pickers, a carousel, maps,
  media players, a bottom sheet, Skia graphics, and a large hooks library — all
  themed by the same tokens.
- **Themeable to the core.** A single `createTheme({ brand: "#7C3AED" })` call
  re-skins the entire kit; every option is optional and strictly validated.
- **No Tamagui packages to install.** The kit depends on `@tamagui/*`
  internally and re-exports everything you need, including the styling/motion
  escape hatch.
- **Zero-runtime styling on the web.** The optional Tamagui compiler extracts
  styles at build time via the `@knitui/plugins` bundler integrations.

## Packages

Everything lives in one pnpm + Turborepo monorepo. The published scope is
`@knitui/*`.

| Package                                     | What it is                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [`@knitui/core`](packages/core)             | Design tokens, theme (`createTheme`), the `<Provider>`, and the styling/motion engine. The foundation every other package builds on. |
| [`@knitui/components`](packages/components) | The main component kit — ~100 cross-platform components (Button, Card, Combobox, Modal, Drawer, …).                                  |
| [`@knitui/hooks`](packages/hooks)           | Shared cross-platform React hooks (state, layout, timing, platform) usable standalone.                                               |
| [`@knitui/icons`](packages/icons)           | Hybrid React + React Native icon kit generated from [`@tabler/icons`](https://tabler.io/icons).                                      |
| [`@knitui/graphics`](packages/graphics)     | Skia-powered graphics primitives, effects, and an audio-visualizer engine.                                                           |
| [`@knitui/dates`](packages/dates)           | Calendars, date/time pickers, and inputs, built on `@knitui/components` + [dayjs](https://day.js.org).                               |
| [`@knitui/carousel`](packages/carousel)     | Cross-platform carousel with an Embla-style engine (web rAF / native Reanimated).                                                    |
| [`@knitui/map`](packages/map)               | Cross-platform [MapLibre](https://maplibre.org) map surface.                                                                         |
| [`@knitui/media`](packages/media)           | Audio & video players, playlists, and visualizers behind one controller contract.                                                    |
| [`@knitui/sheet`](packages/sheet)           | Cross-platform bottom sheet with a pure-TS snap engine.                                                                              |
| [`@knitui/plugins`](packages/plugins)       | Pre-configured Tamagui build-tool plugins (babel, metro, next, vite, webpack) + the Next.js SSR provider.                            |

Not published (workspace-internal): **`@knitui/demo`** (the showcase whose
sections feed the example apps), **`@knitui/example`** (`apps/app`, Expo), and
**`@knitui/web`** (`apps/web`, Next.js).

## Install

Install the kit plus the two required native peers. On every platform you need
`react-native-gesture-handler` and `react-native-reanimated`.

```sh
# Expo
npx expo install @knitui/core @knitui/components \
  react-native-gesture-handler react-native-reanimated

# bare React Native / web
npm install @knitui/core @knitui/components \
  react-native-gesture-handler react-native-reanimated
```

You never add a `@tamagui/*` package yourself — the kit re-exports everything.
Add the feature packages you want (`@knitui/dates`, `@knitui/carousel`, …) the
same way.

## Quickstart

Wrap your app once with `<Provider>` (it sets up theming **and** mounts the
`GestureHandlerRootView`), then use components anywhere:

```tsx
import { Provider } from "@knitui/core";
import { Button, Card } from "@knitui/components";

export default function App() {
  return (
    <Provider defaultColorScheme="system">
      <Card>
        <Button>Hello, Knit UI</Button>
      </Card>
    </Provider>
  );
}
```

### Theming

Re-skin the whole kit from a handful of brand inputs — every option is optional
and layers onto a complete default:

```tsx
import { createTheme, Provider } from "@knitui/core";

export const config = createTheme({
  brand: "#7C3AED", // a hex (light/dark auto-derived), a Radix name, or full ramps
  radius: "rounded",
  fonts: { body: "Inter", heading: "Sora" },
});

export const App = ({ children }) => <Provider config={config}>{children}</Provider>;
```

See [`@knitui/core`](packages/core/README.md) for the full theming API
(`createTheme`, `extendTheme`, presets, per-component defaults).

## Platform support

| Target        | Renderer                            | Notes                                                                                    |
| ------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| iOS / Android | React Native (Expo SDK 56, RN 0.85) | Metro consumes the packages' TypeScript source directly.                                 |
| Web           | React Native Web                    | Use the Next.js / Vite / webpack integration from [`@knitui/plugins`](packages/plugins). |

> **Packages src-ship.** Their `main`/`types` resolve to `./src/*.ts` (see
> [`docs/ci-cd-plan.md` §3](docs/ci-cd-plan.md)). Expo/Metro works out of the
> box; **Next.js** and other bundlers must transpile the `@knitui/*` scope — the
> `withKnitui` wrapper from `@knitui/plugins/next-plugin` does this for you.

## Repository layout

```
packages/   the published @knitui/* libraries + the internal demo showcase
apps/       app  → Expo example (@knitui/example)
            web  → Next.js showcase (@knitui/web)
docs/       architecture notes, package plans, and the CI/CD plan
scripts/    repo tooling (naming guardrail, codegen, build loops)
```

## Development

```sh
pnpm install          # install the workspace (git hooks activate automatically)

pnpm build            # turbo run build across all packages
pnpm typecheck        # tsc --noEmit per package
pnpm lint             # ESLint across all packages
pnpm test             # Jest per package
pnpm check:naming     # brand guardrail

pnpm start            # run the Expo example app  (apps/app)
pnpm web              # ios/android also available
pnpm next             # run the Next.js showcase   (apps/web)
```

Most packages ship a Storybook — run it with, e.g.,
`pnpm --filter @knitui/components storybook`.

Turborepo caches by content hash, so unchanged packages are skipped on repeat
runs.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow (Conventional Commits,
Changesets, the naming guardrail, and how releases are cut). The publishing and
CI/CD model is documented in [`docs/ci-cd-plan.md`](docs/ci-cd-plan.md).

## License

[MIT](LICENSE) © The Haus
</content>
</invoke>
