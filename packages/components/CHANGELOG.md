# @knitui/components

## 0.5.0

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
  - @knitui/hooks@0.5.0
  - @knitui/icons@0.5.0

## 0.4.0

### Minor Changes

- 5b5a3e0: Add `VirtualList` and reanimated-native scroll offsets
  - **`VirtualList`** — a new windowed list for large datasets. Renders only the
    visible slice (plus overscan) over `ScrollArea`, supports variable row heights
    via per-type average sizing, and exposes an imperative handle
    (`scrollToIndex` / `scrollToOffset`). One cross-platform component file over a
    platform-free measurement engine.
  - **`ScrollArea`** — new `scrollValueX` / `scrollValueY` props mirror the live
    scroll offset into caller-owned reanimated shared values on the UI thread, so
    parallax and collapsing-header animations run with no JS-thread round-trip.
    Native only; the web ScrollArea ignores them.
  - **`UnstyledButton`** — now carries the same reduced-motion-aware press-scale
    affordance as `Button` / `ActionIcon` / `Chip`, so custom controls built on it
    no longer read as dead on press. Descendant `pressStyle` merges with it.
  - **`Image`** — fix a crash when passing `transition` on web. expo-image's
    numeric `transition` collided with Tamagui v2's reserved animation prop, which
    marked the image animated and made the web driver call `getComputedStyle` on a
    non-DOM host. The value is now forwarded to the backend under an internal
    alias.

### Patch Changes

- @knitui/core@0.4.0
- @knitui/hooks@0.4.0
- @knitui/icons@0.4.0

## 0.3.0

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

- @knitui/core@0.3.0
- @knitui/hooks@0.3.0
- @knitui/icons@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [c346356]
- Updated dependencies [737463e]
  - @knitui/core@0.2.0
  - @knitui/hooks@0.2.0
  - @knitui/icons@0.2.0

## 0.1.1

### Patch Changes

- 407bef6: UnstyledButton: reset the semantic `<button>`'s user-agent `text-align: center` on web so text content is left-aligned, matching native (React Native starts pressable text at the inline edge). The same tree no longer diverges across platforms. The reset is web-only and applied ahead of the caller's `style`, so anyone who wants centred content still overrides it explicitly. Internally the button-host wiring now reuses the shared `webButton()` helper (correctly a no-op on native) instead of hardcoding `render="button"`.
  - @knitui/core@0.1.1
  - @knitui/hooks@0.1.1
  - @knitui/icons@0.1.1
