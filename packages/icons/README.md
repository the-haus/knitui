# @knitui/icons

A hybrid **React + React Native** icon kit, generated from the raw
[`@tabler/icons`](https://tabler.io/icons) SVG data. Every icon ships its path
data inline and renders itself, so the package carries **no runtime dependency**
on `@tabler/icons-react` or `@tabler/icons-react-native`.

```tsx
import { IconSearch } from "@knitui/icons";

<IconSearch size={18} color="currentColor" stroke={1.8} />;
```

For the leanest import path, import one icon subpath directly:

```tsx
import { IconSearch } from "@knitui/icons/IconSearch";
```

Or render by name with the dynamic, code-split `Icon` component:

```tsx
import { Icon } from "@knitui/icons";

<Icon name="search" size={18} fallback={<Spinner />} />;
```

## Install

```sh
# Expo
npx expo install @knitui/icons react-native-svg

# bare React Native / web
npm install @knitui/icons react-native-svg
```

`react-native-svg` is only needed on native targets — web renders to a DOM
`<svg>`. Like the rest of the kit, `@knitui/icons` ships its TypeScript source;
Expo/Metro consume it out of the box, and Next.js picks it up via the
`withKnitui` wrapper from `@knitui/plugins/next-plugin`.

## How it works

- The same icon module works on web and native. `createIcon` resolves to a DOM
  `<svg>` renderer (`create-icon.tsx`) on web and a `react-native-svg` renderer
  (`create-icon.native.tsx`) on native — bundlers and Metro pick the right one
  automatically.
- The shared `stroke` prop sets the outline stroke width on both platforms
  (`strokeWidth` takes precedence if both are passed). Filled icons ignore it
  and use `color` as their fill.
- `title` becomes an SVG `<title>` on web and `accessibilityLabel` on native;
  web-only (`className`, `aria-*`) and native-only (`testID`,
  `accessibilityLabel`) props are routed to the platform that understands them.
- Named exports (`IconSearch`, …) render synchronously. The `Icon` name-based
  component lazy-loads each icon via `React.lazy`, so it code-splits and honors
  the `fallback` prop.

## Peer dependencies

| Package            | When required       |
| ------------------ | ------------------- |
| `react`            | always (`>=18`)     |
| `react-native`     | native targets only |
| `react-native-svg` | native targets only |

`@tabler/icons` is a **dev**-only dependency — it is read at generate time and
never bundled into the published output.

## Regenerating

Regenerate the full icon surface after bumping `@tabler/icons`:

```sh
pnpm --filter @knitui/icons generate
```

This reads `@tabler/icons/tabler-nodes-{outline,filled}.json` and rewrites
`src/icons/*`, `src/index.ts`, and `src/registry.ts`.

---

Part of [Knit UI](../../README.md).
