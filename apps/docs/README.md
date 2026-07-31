# @knitui/docs

The Knit UI documentation website — [knitui.dev](https://knitui.dev).

Next.js 16 (App Router), statically exported, with the kit rendering its own
examples live.

## Develop

```bash
pnpm docs            # generate data + next dev --webpack on port 3001
pnpm docs:build      # generate + build + postbuild -> apps/docs/out
pnpm docs:generate   # just refresh src/generated/**
pnpm docs:check      # the coverage guardrails CI runs
```

`--webpack` is not optional: the Tamagui compiler is a webpack plugin and Next 16
defaults to Turbopack.

## How it works

**Nothing about a component is written twice.** The story files are the source of
truth, and the generators in [`scripts/docs/`](../../scripts/docs) turn them into
the site's data:

| Generator         | Reads                                     | Writes                                                     |
| ----------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `build-registry`  | every `*.stories.tsx`                     | `registry.json`, `story-sources.json`, `story-modules.ts`  |
| `build-props`     | TypeScript declarations                   | `props.json` (own / system / inherited buckets, slot keys) |
| `build-hooks`     | `@knitui/hooks` source                    | `hooks.json`                                               |
| `build-tokens`    | `core/src/config/*`, `control-metrics.ts` | `tokens.json`                                              |
| `build-exports`   | package barrels + `package.json`s         | `exports.json`                                             |
| `build-changelog` | each `CHANGELOG.md`                       | `changelog.json`                                           |
| `build-nav`       | `nav.config.mjs` + registry               | `nav.json` (slim — the sidebar is client-side)             |
| `build-content`   | `content/**/*.mdx`                        | `content-map.ts`                                           |

`src/generated/**` is committed so the site builds without running the generators;
CI re-runs them and fails if the output differs.

## Content

Prose lives in [`content/`](./content) as MDX and is served by
`src/app/docs/[...slug]/page.tsx`. A route is its path:
`content/docs/components/inputs/button.mdx` → `/docs/components/inputs/button`.

Component pages are scaffolded from the registry
(`pnpm docs:scaffold`) and then given prose by hand:

```mdx
export const meta = { title: "Button", description: "…" };

<ComponentHeader id="components/inputs/button" />

Prose you write.

<Playground id="components/inputs/button" />
<Examples id="components/inputs/button" />
<PropsTable id="components/inputs/button" />
```

Those components are in the MDX global scope (see
[`mdx-components.tsx`](./mdx-components.tsx)) — no imports in content files.

Each MDX file exports `meta`, **not** `metadata`: Next's RSC pass treats a compiled
`.mdx` module as a client module and rejects a `metadata` export, so titles are
produced by the route from `meta`.

## Live examples

`<Example>` and `<Playground>` mount real stories through
[`@knitui/story-runtime`](../../packages/story-runtime) — the same CSF resolver the
device gallery uses, so the docs, Storybook and the Expo/Next demo can't disagree.

Three constraints are enforced in the runtime because they are real limits, not
preferences:

- story modules load lazily per route, and mount only when scrolled near;
- Skia canvases, media players and maps **unmount** when they leave the viewport
  (WebGL context cap; one shared `<audio>`/`<video>` per medium);
- CanvasKit is preloaded before any graphics story module evaluates.

## Chrome vs content

The shell and prose are plain HTML + CSS that consume the kit's own CSS variables
(`--color11`, `--t-space-md`, …), so they are theme-aware with no JS. Only the
examples are react-native-web. That keeps prose pages small and avoids RNW's
inline-layout quirks in body text — the components on the page are the genuine
article either way.

## Post-build

[`scripts/postbuild.mjs`](./scripts/postbuild.mjs) writes `robots.txt`, a tiered
`sitemap.xml`, `llms.txt` + `llms-full.txt` (a curated index for AI clients), and
builds the Pagefind search index by crawling the emitted HTML. Search therefore
only works in a production build.

## Deploy

Static export → Cloudflare Pages (`knitui-docs`), via
[`.github/workflows/docs.yml`](../../.github/workflows/docs.yml). Storybook stays
on GitHub Pages; the two cross-link.
