# @knitui/storybook

The **aggregate Storybook** for Knit UI — one site that composes every package's
own Storybook into a single sidebar. This is the build that ships to GitHub
Pages.

Private, not published.

## How it works

Each package (`components`, `dates`, `carousel`, `graphics`, `icons`, `map`,
`media`, `sheet`) has its own `.storybook/` config with bespoke Vite plumbing
(Skia load-order, reanimated interop, MapLibre) and providers. Merging those
into one config would be brittle, so this app uses **Storybook
[composition](https://storybook.js.org/docs/sharing/storybook-composition)**
instead:

- `.storybook/main.ts` defines a `refs` entry per package.
- `scripts/build-all.mjs` builds the root manager into `storybook-static/` and
  each package's Storybook into `storybook-static/<pkg>/`.
- The root's **relative** refs (`./components`, `./dates`, …) resolve against the
  deployed base, so one Pages deploy serves every package's stories.

Packages keep full ownership of their own Storybook config; this app only
stitches the outputs together.

## Build

```sh
pnpm --filter @knitui/storybook build-storybook
# → apps/storybook/storybook-static/  (root + one subfolder per package)
```

Serve the result locally to preview the composed site:

```sh
npx http-server apps/storybook/storybook-static -p 6100
```

Override the base if the child Storybooks are hosted elsewhere:

```sh
STORYBOOK_BASE_URL=https://example.com/sb pnpm --filter @knitui/storybook build-storybook
```

## Develop a single package

Composition needs built children, so for iterating on stories run the package's
own Storybook directly:

```sh
pnpm --filter @knitui/components storybook   # etc.
```

## Deploy

`.github/workflows/storybook.yml` builds this app and publishes
`storybook-static/` to GitHub Pages on every push to `main` (enable
**Settings → Pages → Source: GitHub Actions** once).

---

Part of [Knit UI](../../README.md).
