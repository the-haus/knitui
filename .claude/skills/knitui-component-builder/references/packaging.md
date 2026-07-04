# Packaging, tooling & tokens

## Package shape — src-ship

The kit (`@knitui/components`, `@knitui/core`) is **src-ship**: every export condition resolves to `./src/*.ts` — including `default` and `types` (no `lib/`). `package.json`:

```jsonc
"name": "@knitui/components",
"source": "./src/index.ts",
"main": "./src/index.ts",
"module": "./src/index.ts",
"types": "./src/index.ts",
"react-native": "./src/index.ts",
"exports": {
  ".": { "source": "./src/index.ts", "react-native": "./src/index.ts",
         "types": "./src/index.ts", "default": "./src/index.ts" },
  "./control-system": { "source": "./src/control-system.ts", ... },
  "./package.json": "./package.json"
},
"sideEffects": false,
"publishConfig": { "access": "public" }
```

Scripts: `build: bob build`, `typecheck: tsc --noEmit -p tsconfig.json`, `lint: eslint .`, `test: jest`, `test:visual: playwright test`, `storybook: storybook dev -p 6006`.

Sibling deps use `workspace:*` (`@knitui/core`, `@knitui/hooks`, `@knitui/icons`). Native runtimes are `peerDependencies` (`react`, `react-native`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-svg`, `react-native-teleport`, `react-native-worklets`).

### Why src-ship (don't try to lib-ship the kit)

Tamagui's generic component types **do not round-trip through bob-generated `.d.ts`** (memory `lib-ship-not-viable`), so the component kit ships source. Metro honors `source`; Next.js needs the scope in `transpilePackages` (handled by `@knitui/plugins/next`); plain Node/webpack must transpile `@knitui/*`. The `bob` config + `files: ["lib", ...]` still exist as intentional dead-weight (flip-to-lib-later escape hatch), but consumers resolve `src` today.

**Contrast — `@knitui/hooks` and `@knitui/plugins` DO lib-ship**: `main`/`module`/`types` → `./lib/…`, keeping only `source`/`react-native` on `src`. These have no Tamagui generics to round-trip.

## tsconfig

- Root `tsconfig.json` is a thin Expo shim: `{ "compilerOptions": {}, "extends": "expo/tsconfig.base" }`.
- Real base is `tsconfig.base.json` (what packages extend): `target/module ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, `strict: true`, `isolatedModules`, `skipLibCheck`, `verbatimModuleSyntax: false`.
- Per-package `tsconfig.json`: `extends ../../tsconfig.base.json`, `include: ["src/**/*", ".storybook/**/*"]`, `types: ["jest", "@testing-library/jest-dom", "node"]`.

## Tokens

Live in `@knitui/core` under `packages/core/src/config/`.

Raw scales — `config/scales.ts` (semantic `xxs..xxl`):

```ts
export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { xxs: 1, xs: 2, sm: 4, md: 8, lg: 16, xl: 32, xxl: 64 } as const; // powers of 2
export const size = { xxs: 18, xs: 24, sm: 32, md: 40, lg: 48, xl: 64, xxl: 96 } as const; // icon + button heights
export const font = { xxs: 12, xs: 14, sm: 16, md: 18, lg: 20, xl: 24, xxl: 28 } as const;
```

Registered as Tamagui tokens — `config/tokens.ts` (`createTokens({ color, space, size, radius, zIndex })`, each with a `true` alias → `sm`). Assembled in `config/config.ts` via `createTamagui({ animations, fonts, tokens, themes, shorthands, media, ... })`; `declare module "@tamagui/core"` augments the config type. Subpath `@knitui/core/config`.

### Two token surfaces

- **Bare key** — the `size` **prop** on controls takes a bare `SizeKey` (no `$`): `size="md"`. From `internal/control-metrics.ts` (`SIZE_KEYS`, `SizeKey`, `DEFAULT_SIZE = "md"`).
- **`$`-token** — raw style props take `$`-prefixed tokens: `gap="$md"`, `fontSize="$sm"`, `p="$lg"`.

`controlMetrics` is the canonical table mapping each bare size key → `$`-tokens **per property** (see control-systems.md).

### "Spread variants rejected" (perf contract)

Color ladders are **read-only tables spread onto a styled base**, not per-render dynamic style spreads. Static `variants` (booleans/enums on the frame) exist for Tamagui's optimizer; do NOT compute style objects per render and spread them. Also: never share a node between a Tamagui animation driver and Reanimated (memory `reanimated-singleton-override`).

## Monorepo

- `pnpm-workspace.yaml`: `packages/*`, `apps/*`. Root `package.json` is `knitui-monorepo`, `private`, pnpm@10.x, node ≥20.
- **Turborepo** (`turbo.json`): `build`/`typecheck`/`test` all `dependsOn: ["^build"]`; `test` outputs `coverage/**`. Root `test` = `turbo run test --concurrency=1`.
- Releases via **changesets** (`.changeset/config.json`); `release: turbo run build && changeset publish`.
- Git hooks in `.husky/` (wired via root `prepare: git config core.hooksPath .husky`): `pre-commit` runs `scripts/check-naming.mjs` (brand guardrail) + Prettier `--check`; `commit-msg` runs `scripts/check-commit-msg.mjs`.
- **Conventional Commits** enforced by a hand-rolled script (no commitlint dep): types `feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert`; header ≤100 chars. Example: `feat(components): add Stepper`.

## Native version pinning — root `pnpm.overrides`

Forces a single copy of every animation-critical package workspace-wide (prevents duplicate-copy Hermes crashes; package peers are `"*"` and get pinned here):

```jsonc
"pnpm": {
  "overrides": {
    "react": "19.2.3", "react-native": "0.85.3",
    "react-native-reanimated": "4.3.1",   // must match worklets build
    "react-native-worklets": "0.8.3",
    "@shopify/react-native-skia": "2.6.6",
    ...
  },
  "patchedDependencies": { "react-native-teleport@1.1.7": "...", "expo-audio@56.0.12": "...", ... }
}
```

Reanimated + `react-native-worklets` are pinned **together**. If you add a native dep with its own reanimated/RN/skia peer, pin it here too or you risk the duplicate-copy crash (memories `duplicate-react-native-crash`, `reanimated-singleton-override`).
