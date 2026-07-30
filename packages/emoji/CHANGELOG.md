# @knitui/emoji

## 0.7.0

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

## 0.6.1

## 0.6.0

### Patch Changes

- 5f44d20: Stop publishing the `lib/` build output that nothing can resolve

  Both packages listed `"lib"` in `files` and ran `bob build`, but **every**
  resolver key — `main`, `module`, `types`, `react-native`, `source` and every
  `exports` condition — points at `./src/...`. Nothing in either package, the
  workspace, or a consumer's resolution can reach `lib/`: these two src-ship, like
  the rest of the kit. The build output was shipped to npm as dead weight.

  Measured with `npm pack --dry-run`:

  | package         | before                 | after                 |
  | --------------- | ---------------------- | --------------------- |
  | `@knitui/icons` | 23.6 MB / 43,096 files | 3.6 MB / 6,159 files  |
  | `@knitui/emoji` | —                      | 26.9 MB / 7,614 files |

  `lib/` was 36,937 of the 43,096 icon entries — 85% of that tarball — and 180 MB
  on disk for `emoji`. Install size only; no bundle, API or resolution change,
  which is exactly why it was invisible.

  `bob build` still runs, so the artefact is still produced locally and in CI. If
  that turns out to have no consumer either, the build target itself can go — but
  that is a separate call from what gets published.

## 0.5.0

## 0.4.0

## 0.3.0

## 0.2.0

### Minor Changes

- d46fbad: Add `@knitui/emoji`: a cross-platform (React + React Native) emoji kit generated
  from Google Noto Emoji SVG data. Each emoji is parsed once at generate time into
  a render-ready node tree (no runtime XML parsing on native, DOM `<svg>` on web),
  with per-emoji id namespacing and `.js`+`.d.ts` output so the ~3.8k modules stay
  tree-shakeable and cheap to typecheck. Exposes named `Emoji*` components, per-emoji
  subpath imports, a dynamic name-based `Emoji`, and an `EmojiProvider` for ambient
  size.
