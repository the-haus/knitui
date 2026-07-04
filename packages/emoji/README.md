# @knitui/emoji

A hybrid **React + React Native** emoji kit, generated from the raw
[Google Noto Emoji](https://github.com/googlefonts/noto-emoji) SVG data (via
[`@iconify-json/noto`](https://icon-sets.iconify.design/noto/)). Every emoji
ships its artwork inline and renders itself, so the package carries **no runtime
dependency** on the iconify data.

```tsx
import { EmojiRocket } from "@knitui/emoji";

<EmojiRocket size={32} />;
```

For the leanest import path, import one emoji subpath directly:

```tsx
import { EmojiRocket } from "@knitui/emoji/EmojiRocket";
```

Or render by name with the dynamic, code-split `Emoji` component:

```tsx
import { Emoji } from "@knitui/emoji";

<Emoji name="rocket" size={32} fallback={<Spinner />} />;
```

## Install

```sh
# Expo
npx expo install @knitui/emoji react-native-svg

# bare React Native / web
npm install @knitui/emoji react-native-svg
```

`react-native-svg` is only needed on native targets — web renders to a DOM
`<svg>`. Like the rest of the kit, `@knitui/emoji` ships its source; Expo/Metro
consume it out of the box, and Next.js picks it up via the `withKnitui` wrapper
from `@knitui/plugins/next-plugin`.

## How it works

Emoji are full-color artwork (many paths + gradients), not monochrome glyphs, so
this kit works differently from [`@knitui/icons`](../icons):

- **No runtime SVG parsing.** Each emoji's SVG is parsed **once at generate
  time** (`svgson`) into a render-ready node tree — attributes camelCased to the
  form React DOM and `react-native-svg` both accept, and every gradient/clip
  `id` namespaced to the emoji so many emoji on one page can't cross-wire. The
  tree is turned into elements once per module at eval, not per render. This
  avoids the runtime XML parse that `react-native-svg`'s `SvgXml` would pay on
  every emoji's first render.
- **One module, two renderers.** `createEmoji` resolves to a DOM `<svg>` renderer
  (`create-emoji.tsx`) on web and a `react-native-svg` renderer
  (`create-emoji.native.tsx`) on native — bundlers and Metro pick the right one.
- **Full color, so no recoloring.** There is no `color`/`stroke` prop — only
  `size` (explicit prop → ambient `EmojiProvider` → default of 24). `title`
  becomes an accessible label on both platforms.
- **Light types, tree-shaken data.** The ~3.8k generated modules are emitted as
  `.js` + a tiny `.d.ts`, so `tsc` never parses the geometry (it would OOM) while
  bundlers still drop every emoji you don't import.
- Named exports (`EmojiRocket`, …) render synchronously. The `Emoji` name-based
  component lazy-loads each emoji via `React.lazy` (code-split on web), honoring
  the `fallback` prop.

## Peer dependencies

| Package            | When required       |
| ------------------ | ------------------- |
| `react`            | always (`>=18`)     |
| `react-native`     | native targets only |
| `react-native-svg` | native targets only |

`@iconify-json/noto` is a **dev**-only dependency — it is read at generate time
and never bundled into the published output.

## Regenerating

Regenerate the full emoji surface after bumping `@iconify-json/noto`:

```sh
pnpm --filter @knitui/emoji generate
```

This reads `@iconify-json/noto/icons.json` and rewrites `src/emojis/*`,
`src/index.ts`, `src/registry.ts`, and `src/registry.native.ts`.

---

Part of [Knit UI](../../README.md).
