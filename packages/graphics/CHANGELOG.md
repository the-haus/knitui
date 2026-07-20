# @knitui/graphics

## 0.5.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [4f7830c]
  - @knitui/components@0.5.0
  - @knitui/core@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [5b5a3e0]
  - @knitui/components@0.4.0
  - @knitui/core@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies [89f8c36]
  - @knitui/components@0.3.0
  - @knitui/core@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0
  - @knitui/components@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [407bef6]
  - @knitui/components@0.1.1
  - @knitui/core@0.1.1
