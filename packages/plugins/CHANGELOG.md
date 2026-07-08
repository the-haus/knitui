# @knitui/plugins

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
