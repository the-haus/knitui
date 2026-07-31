# @knitui/plugins

## 0.1.11

### Patch Changes

- Updated dependencies [8de27f7]
- Updated dependencies [85594a1]
  - @knitui/core@0.8.0

## 0.1.10

### Patch Changes

- 59d065b: Dependency refresh, all within the current majors and validated against Expo SDK 57
  (`expo install --check` reports the workspace aligned):

  - `react-native` 0.86.0 → 0.86.2 (and `@react-native/metro-config` to match; both stay
    pinned as singletons in the root `pnpm.overrides`)
  - `react-native-reanimated` 4.5.0 → 4.5.1 and `react-native-worklets` 0.10.0 → 0.10.1 —
    the versions Expo SDK 57 expects
  - `expo` 57.0.7 → 57.0.9 and the SDK-managed modules along with it (`expo-router`,
    `expo-constants`, `expo-linking`, `expo-system-ui`, `expo-video`,
    `@expo/metro-runtime`, `expo-build-properties`)
  - `babel-preset-expo` 57.0.3 → 57.0.5, Storybook 10.5.3 → 10.5.5,
    `@vitejs/plugin-react` 6.0.3 → 6.0.4, `next` 16.2.10 → 16.2.12,
    `@react-navigation/*` patch bumps

  The vendored `expo-modules-core` patch was re-pointed from 57.0.6 to 57.0.8 and still
  applies cleanly. `expo-audio` deliberately stays on 57.0.2, where our native sampling
  patch is pinned. Peer requirements for consumers are unchanged.

- Updated dependencies [59d065b]
  - @knitui/core@0.7.0

## 0.1.9

### Patch Changes

- Updated dependencies [ffc254e]
- Updated dependencies [caa2d7e]
  - @knitui/core@0.6.1

## 0.1.8

### Patch Changes

- 5f44d20: Stop the icon barrel from being pulled into every component

  `@knitui/components` dragged all ~6.1k icon modules into any app that imported a
  single component. The kit SRC-SHIPS, so Metro compiles what it resolves and does
  NOT tree-shake: one line in `internal/ControlIconProvider.tsx` —
  `import { IconProvider } from "@knitui/icons"` — resolved the root barrel
  (`packages/icons/src/index.ts`, 378 KB / 6,153 export lines), and because that
  module is reachable from `Button`, `Chip`, `Accordion` and friends, every glyph
  became part of the graph. Walking the import graph from each package entry,
  honouring `exports` conditions and `.web`/`.native` order:

  | entry                | before                   | after                  |
  | -------------------- | ------------------------ | ---------------------- |
  | `@knitui/components` | 6,490 modules / 4,896 KB | 344 modules / 1,635 KB |
  | `@knitui/sheet`      | 6,506 modules / 4,960 KB | 360 modules / 1,700 KB |
  | `@knitui/carousel`   | 6,541 modules / 5,068 KB | 398 modules / 1,808 KB |
  | `@knitui/media`      | 6,530 modules / 5,056 KB | 384 modules / 1,796 KB |

  That is −94.7% modules and −3,261 KB of source off the components graph, and it
  lands on Metro cold start, on every clear-cache rebuild, and on the JS bundle
  itself for consumers whose bundler cannot shake a src-shipped barrel.

  **`@knitui/icons` gains two subpath exports** (the minor):

  - `@knitui/icons/context` — `IconProvider`, `useIconContext` and their types
  - `@knitui/icons/types` — `IconProps`, `IconNode`, `IconComponent`, `IconType`

  Per-glyph deep imports (`@knitui/icons/IconCheck`) already resolved through the
  existing `./Icon*` wildcard; the provider was the one thing that had no subpath
  and therefore forced the barrel. Nothing was removed — the root barrel still
  exports everything it did.

  **Internal import rewrites** (patch, no API change) across the shipped source of
  `@knitui/components` (`ControlIconProvider`, `Accordion`, `Checkbox/CheckIcon`,
  `Chip`, `CloseButton`, `Combobox`, `Stepper`), `@knitui/carousel` (`Carousel`)
  and `@knitui/media` (the audio/video chrome + `LiveAudioMeter`), each now naming
  the glyph module it actually uses. An ESLint `no-restricted-imports` guardrail in
  `eslint.config.base.mjs` blocks the bare `@knitui/icons` / `@knitui/emoji`
  specifier in shipped `src/**` so this cannot regress; stories, tests and the
  private `@knitui/demo` galleries (which render the whole registry on purpose) are
  exempt.

  **Bundler hygiene, same theme:**

  - `sideEffects` was missing from `@knitui/media`, `@knitui/sheet` and
    `@knitui/plugins`, so webpack/Next had to keep every module of those packages
    even when nothing referenced it. `media` and `sheet` are declared
    `sideEffects: false` (audited: their only module-scope statements are pure
    const initialisers and a `displayName` assignment — the one
    `registerProcessor()` call in `media` lives inside an AudioWorklet source
    string, not in the module). `plugins` lists just its `babel-plugin` entry,
    which really does mutate `process.env.TAMAGUI_IGNORE_BUNDLE_ERRORS` on load.
  - `@knitui/plugins/next-plugin` now sets
    `experimental.optimizePackageImports` for `@knitui/icons`, `@knitui/emoji`,
    `@knitui/components`, `@knitui/dates` and `@knitui/map`, so every Next
    consumer inherits it instead of having to know. Next has to build a barrel's
    full module graph before it can shake it, and `transpilePackages` means it
    compiles the kit's source to do so — with this, a bare-barrel glyph import in
    app code is rewritten to that glyph's own module and the other 6,145 files are
    never compiled. Any `experimental` the app already set is
    merged, not replaced, and its own `optimizePackageImports` entries are kept.

- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5f44d20]
- Updated dependencies [5c6d758]
  - @knitui/core@0.6.0

## 0.1.7

### Patch Changes

- 4f7830c: Align published dependency ranges with Expo SDK 57

  The SDK pins exact versions for its native modules, and several of our
  published ranges had drifted from that set. Consumers on SDK 57 were
  resolving versions the SDK's prebuilt binaries don't expect, which fails at
  runtime rather than at build time.

  - `@knitui/components`: `expo-image` `~57.0.0` → `~57.0.1`
  - `@knitui/core`: `@tamagui/*` `^2.3.0` → `^2.4.6`
  - `@knitui/media`: `expo-audio` `~57.0.0` → `~57.0.2`, `expo-video` `~57.0.0` → `~57.0.1`
  - `@knitui/plugins`: `@tamagui/babel-plugin` `^2.3.0` → `^2.4.6`

  `@knitui/graphics` is a minor rather than a patch because its
  `@shopify/react-native-skia` peer is an exact pin and moves `2.6.6` → `2.6.2`,
  which is the version Expo SDK 57 expects. Consumers currently pinned to
  `2.6.6` will need to move to `2.6.2` to satisfy the peer.

- Updated dependencies [4f7830c]
  - @knitui/core@0.5.0

## 0.1.6

### Patch Changes

- @knitui/core@0.4.0

## 0.1.5

### Patch Changes

- 2a64873: fix(next): alias bare `global` to `globalThis` in the client bundle

  `react-native-reanimated`'s web build touches the Node-ism `global` at
  module-eval time, so importing it in the browser threw `ReferenceError:
global is not defined`. The Next webpack plugin now registers a
  `DefinePlugin({ global: "globalThis" })` for the client bundle only
  (`!isServer`), leaving the real Node global untouched on the server.

## 0.1.4

### Patch Changes

- @knitui/core@0.3.0

## 0.1.3

### Patch Changes

- 2c585f1: Fix `@knitui/plugins/next` (and every other subpath) reporting "Could not find
  a declaration file for module" in consumers' `tsc`. The `typescript` bob target
  built with `project: tsconfig.build.json`, whose `tsconfig.build.json` set no
  `rootDir`. tsc therefore inferred the package root as the root and emitted the
  `.d.ts` files one level too deep — at `lib/typescript/module/src/next.d.ts` —
  while the `exports[...].types` paths (correctly) pointed at
  `lib/typescript/module/next.d.ts`. Runtime JS resolved fine, but a consumer's
  type checker (bundler resolution) couldn't find the declarations. Setting
  `rootDir: "src"` in `tsconfig.build.json` flattens the output to exactly where
  `exports` already points. No API or runtime change.

## 0.1.2

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0

## 0.1.1

### Patch Changes

- @knitui/core@0.1.1
