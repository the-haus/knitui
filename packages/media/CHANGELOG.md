# @knitui/media

## 0.2.0

### Minor Changes

- 89f8c36: chore(deps): move the supported baseline to Expo SDK 57 and Next.js 16.

  Upgrades the kit's external toolchain to the latest majors:
  - **Expo SDK 56 → 57** — `react-native` 0.85.3 → 0.86.0, `react-native-reanimated`
    4.3.1 → 4.5.0, `react-native-worklets` 0.8.3 → 0.10.0,
    `react-native-gesture-handler` ~2.31 → ~2.32, `babel-preset-expo` → ^57, and all
    `expo-*` packages to their SDK 57 versions. React stays 19.2.3.
  - **Next.js 15 → 16** — the web app opts back into the webpack builder (`next build
--webpack`) so the Tamagui compiler plugin keeps running; Turbopack has no Tamagui
    loader yet.

  Consumer-facing dependency changes:
  - `@knitui/components` now depends on `expo-image` `~57.0.0` (was a stale `~2.4.1`),
    which also resolves the Expo SDK 56 Android startup crash consumers hit from the
    old pin.
  - `@knitui/media` now depends on `expo-audio` / `expo-video` `~57.0.0`.

  The two version-pinned pnpm patches (`expo-audio`, `expo-modules-core`) were migrated
  to their SDK 57 releases and still apply. Everything typechecks and builds (28/28 turbo
  tasks, the Expo app `tsc`, and the Next.js 16 production build).

### Patch Changes

- Updated dependencies [89f8c36]
  - @knitui/components@0.3.0
  - @knitui/core@0.3.0
  - @knitui/hooks@0.3.0
  - @knitui/icons@0.3.0

## 0.1.2

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0
  - @knitui/components@0.2.0
  - @knitui/hooks@0.2.0
  - @knitui/icons@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [407bef6]
  - @knitui/components@0.1.1
  - @knitui/core@0.1.1
  - @knitui/hooks@0.1.1
  - @knitui/icons@0.1.1
