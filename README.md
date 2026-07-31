<div align="center">

# Knit UI

**One component kit for iOS, Android and web.**

Write your interface once against a single richly-themed API and ship it to all
three platforms — real native views on mobile, accessible DOM on the web.

[**Documentation**](https://knitui.dev) · [Components](https://knitui.dev/docs/components) · [Quickstart](https://knitui.dev/docs/getting-started/quickstart) · [Changelog](https://knitui.dev/changelog)

[![CI](https://github.com/the-haus/knitui/actions/workflows/ci.yml/badge.svg)](https://github.com/the-haus/knitui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@knitui/core.svg?label=%40knitui%2Fcore)](https://www.npmjs.com/package/@knitui/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)

Built on [Tamagui](https://tamagui.dev), [React Native](https://reactnative.dev)
and [React Native Web](https://necolas.github.io/react-native-web/).

</div>

---

```tsx
import { Provider } from "@knitui/core";
import { Button, Card } from "@knitui/components";

export default function App() {
  return (
    <Provider defaultColorScheme="system">
      <Card>
        <Button variant="filled">Hello, Knit UI</Button>
      </Card>
    </Provider>
  );
}
```

That file runs unchanged on iOS, Android and the web.

## Why Knit UI

- **One API, every platform.** Components render to real native views on
  iOS/Android and to accessible DOM on the web — no per-platform forks in your
  app code.
- **Batteries included.** 105 components in the core kit and **178 documented
  components** across the scope: date/time pickers, carousels, maps, audio and
  video players, a bottom sheet, Skia graphics, and 34 hooks — all driven by the
  same tokens.
- **Themeable to the core.** One `createTheme({ brand: "#7C3AED" })` call
  re-skins everything. Every option is optional and strictly validated.
- **No Tamagui packages to install.** The kit depends on `@tamagui/*` internally
  and re-exports what you need, including the styling and motion escape hatches.
- **Zero-runtime styling on the web.** The optional Tamagui compiler extracts
  styles at build time through the `@knitui/plugins` bundler integrations.
- **One consistent system.** Sizes come from a single ladder, colour from a
  variant ramp, and every component takes per-slot `styles` — so restyling an
  internal part never means wrapping it.

## Install

Install the kit plus the two native peers every platform needs.

```sh
# Expo
npx expo install @knitui/core @knitui/components \
  react-native-gesture-handler react-native-reanimated

# bare React Native / web
npm install @knitui/core @knitui/components \
  react-native-gesture-handler react-native-reanimated
```

Add feature packages (`@knitui/dates`, `@knitui/carousel`, …) the same way. You
never install a `@tamagui/*` package yourself.

Then wrap your app **once** with `<Provider>` — it sets up theming and mounts the
`GestureHandlerRootView`. Full walkthrough:
[Installation](https://knitui.dev/docs/getting-started/installation) ·
[Quickstart](https://knitui.dev/docs/getting-started/quickstart).

### Theming

Re-skin the whole kit from a handful of brand inputs. Every field is optional and
layers onto a complete default:

```tsx
import { createTheme, Provider } from "@knitui/core";

export const config = createTheme({
  brand: "#7C3AED", // a hex (light/dark auto-derived), a Radix name, or full ramps
  radius: "rounded",
  fonts: { body: "Inter", heading: "Sora" },
});

export const App = ({ children }) => <Provider config={config}>{children}</Provider>;
```

See [Color and themes](https://knitui.dev/docs/foundations/color-and-themes) for
the full API (`createTheme`, `extendTheme`, presets, per-component defaults).

## Packages

One pnpm + Turborepo monorepo; the published scope is `@knitui/*`.

| Package                                     | What it is                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`@knitui/core`](packages/core)             | Tokens, theming (`createTheme`), the `<Provider>`, and the styling/motion engine. Everything builds on this. |
| [`@knitui/components`](packages/components) | The main kit — 105 cross-platform components (Button, Card, Combobox, Modal, Drawer, …).                     |
| [`@knitui/hooks`](packages/hooks)           | 34 cross-platform React hooks (state, layout, timing, platform), usable standalone.                          |
| [`@knitui/icons`](packages/icons)           | Hybrid React + React Native icon kit generated from [Tabler](https://tabler.io/icons).                       |
| [`@knitui/emoji`](packages/emoji)           | The Noto emoji set as cross-platform components.                                                             |
| [`@knitui/dates`](packages/dates)           | Calendars, date/time pickers and inputs, on [dayjs](https://day.js.org).                                     |
| [`@knitui/carousel`](packages/carousel)     | Carousel with an Embla-style engine (web rAF / native Reanimated) and 10 layout modes.                       |
| [`@knitui/map`](packages/map)               | [MapLibre](https://maplibre.org) map surface with GPU-clustered symbol layers.                               |
| [`@knitui/media`](packages/media)           | Audio and video players, playlists and visualizers behind one controller contract.                           |
| [`@knitui/graphics`](packages/graphics)     | Skia-powered primitives, effects, and an audio-visualizer engine.                                            |
| [`@knitui/sheet`](packages/sheet)           | Bottom sheet with a pure-TypeScript snap engine.                                                             |
| [`@knitui/mediaquery`](packages/mediaquery) | SSR-safe media queries and responsive hooks.                                                                 |
| [`@knitui/plugins`](packages/plugins)       | Pre-configured build-tool plugins (babel, metro, next, vite, webpack) + the Next.js SSR provider.            |

Workspace-internal, not published: `@knitui/demo` (the showcase feeding the
example apps), `@knitui/story-runtime` (the shared CSF resolver),
`@knitui/example`, `@knitui/web`, `@knitui/storybook` and `@knitui/docs`.

## Platform support

| Target        | Renderer                        | Notes                                                                                    |
| ------------- | ------------------------------- | ---------------------------------------------------------------------------------------- |
| iOS / Android | React Native 0.86 (Expo SDK 57) | Metro consumes the packages' TypeScript source directly.                                 |
| Web           | React Native Web                | Use the Next.js / Vite / webpack integration from [`@knitui/plugins`](packages/plugins). |

React 19.2 · Node ≥ 20. See the full
[compatibility matrix](https://knitui.dev/docs/api/compatibility).

> **Packages src-ship.** Their `main`/`types` resolve to `./src/*.ts`, so
> Expo/Metro works with no configuration, but **Next.js and other web bundlers
> must transpile the `@knitui/*` scope** — the `withKnitui` wrapper from
> `@knitui/plugins/next-plugin` does it for you. Details:
> [Architecture › src-shipping](https://knitui.dev/docs/architecture#src-shipping).

## Documentation

[**knitui.dev**](https://knitui.dev) is generated from this repository's own
sources — the prop tables come from the TypeScript declarations and every live
example is a real Storybook story, so the docs cannot drift from the code.

| Read this                                                                  | For                                                       |
| -------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Quickstart](https://knitui.dev/docs/getting-started/quickstart)           | Provider, first component, the three repeating props      |
| [Bundler setup](https://knitui.dev/docs/getting-started/bundler-setup)     | babel · metro · next · vite · webpack                     |
| [Foundations](https://knitui.dev/docs/foundations/principles)              | Tokens, sizing, variants, slots, motion, focus and a11y   |
| [Components](https://knitui.dev/docs/components)                           | Every component, with live examples and prop tables       |
| [Guides](https://knitui.dev/docs/guides/cross-platform-authoring)          | Cross-platform authoring, forms, performance, composition |
| [Troubleshooting](https://knitui.dev/docs/getting-started/troubleshooting) | Symptom-indexed fixes                                     |

Working with an AI assistant? [`llms.txt`](https://knitui.dev/llms.txt) is a
curated index of the conventions, and
[`llms-full.txt`](https://knitui.dev/llms-full.txt) is the same pages inlined.

Every package also has its own Storybook —
`pnpm --filter @knitui/components storybook`.

## Repository layout

```
packages/   the published @knitui/* libraries, plus the internal demo showcase
apps/       app        → Expo example      (@knitui/example)
            web        → Next.js showcase  (@knitui/web)
            docs       → knitui.dev        (@knitui/docs)
            storybook  → aggregate Storybook of every package
scripts/    repo tooling — codegen, the naming guardrail, docs generators
docs/       design notes and plans
```

## Development

```sh
pnpm install          # install the workspace (git hooks activate automatically)

pnpm build            # build every package (the docs app is excluded — see below)
pnpm typecheck        # tsc --noEmit per package
pnpm lint             # ESLint across the workspace
pnpm test             # Jest per package
pnpm check:naming     # brand guardrail

pnpm start            # Expo example app (pnpm ios / pnpm android / pnpm web)
pnpm next             # Next.js showcase
pnpm docs             # the documentation site, on :3001
```

Turborepo caches by content hash, so unchanged packages are skipped on repeat
runs. `pnpm build` deliberately skips `@knitui/docs` — it is by far the heaviest
build here and its own workflow already verifies it; use `pnpm docs:build`.

## Contributing

Contributions are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) covers the
workflow: Conventional Commits, Changesets, the naming guardrail, the component
conventions, and how releases are cut.

- **Bugs and features** → [open an issue](https://github.com/the-haus/knitui/issues)
- **Conduct** → [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Vulnerabilities** → [SECURITY.md](SECURITY.md) — please do not file a public issue

Releases are automated: a merged changeset opens a **Version Packages** PR, and
merging that publishes to npm with provenance and redeploys
[knitui.dev](https://knitui.dev).

## License

[MIT](LICENSE) © The Haus
