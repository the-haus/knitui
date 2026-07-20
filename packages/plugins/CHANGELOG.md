# @knitui/plugins

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
