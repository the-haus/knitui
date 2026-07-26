# @knitui/emoji

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
