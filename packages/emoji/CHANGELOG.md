# @knitui/emoji

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
