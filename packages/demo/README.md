# @knitui/demo

The cross-platform showcase gallery for the Knit UI kit — a single `DemoScreen`
that renders every package's Storybook stories on iOS, Android, and web.

> **Private — not published.** `@knitui/demo` is a `workspace:*`-only package
> (`"private": true`, `version: 0.0.0`). It's an internal app surface, not part
> of the public API. You consume the kit through
> [`@knitui/components`](../components) and [`@knitui/core`](../core); this
> package just proves it all works, everywhere.

## What it is

One gallery, both apps. `@knitui/demo` exports a `DemoScreen` (plus the
`demoSections` registry and a re-exported `MediaProvider`) that is mounted by
**both** runner apps:

- **`apps/app`** — the Expo example (`@knitui/example`). Its `expo-router` entry
  imports `demoSections` from `@knitui/demo` and navigates one section at a time.
- **`apps/web`** — the Next.js site (`@knitui/web`). Its `app/page.tsx`
  dynamically imports `DemoScreen`. `next.config.mjs` lists `@knitui/demo` in
  `transpilePackages` so Next compiles its untranspiled source.

Because both apps render the same registry, the mobile gallery is a faithful
mirror of the web Storybook — real iOS/Android parity with no hand-maintained,
drifting demo screens.

Section renderers import UI primitives **only** from `@knitui/components` (e.g.
`Box`, `Stack`, `Title`, `UnstyledButton`), so the demo dogfoods the public kit
rather than reaching into internals.

## How sections are generated

Sections are **not** written by hand. They're generated from the
`*.stories.tsx` files that already live across the workspace by
[`scripts/generate-demo-sections.mjs`](../../scripts/generate-demo-sections.mjs),
which writes `src/sections.generated.tsx` (marked `DO NOT EDIT BY HAND`).

The generator walks each package in its `PACKAGES` list —
`components`, `dates`, `map`, `carousel`, `media`, `sheet`, `graphics` — finds
every `*.stories.tsx`, reads the `title:` out of each `meta` block to derive a
group + name, and emits one lazily-imported `DemoSection` per story module. The
`icons` package is deliberately **excluded**: it ships ~6k generated icons, so it
gets a purpose-built, searchable browser (`src/IconsSection.tsx`) instead of a
mirrored story.

Each section is wired to one of four renderers based on the package:

- **`StorySection`** (default) — renders every named story in the module,
  stacked, each under its own label. Stories mount progressively (a couple
  immediately, then one per animation frame) so a heavy module doesn't freeze the
  screen on open, and each story is wrapped in a `StoryErrorBoundary` so one bad
  story can't blank the pane. No `@storybook/*` runtime is imported — a CSF
  module is just a default `meta` plus named `StoryObj` exports, and
  `StorySection` re-implements Storybook's own render/args/decorator resolution
  so the output matches the web Storybook.
- **`CanvasGallerySection`** (`graphics`) — renders **one story at a time**
  behind a chip selector. Every Skia `<Canvas>` holds its own WebGL context and
  browsers cap live contexts (~16 in Chrome), so stacking a whole module (e.g.
  `AudioVisualizer`, ~19 stories) exhausts them and CanvasKit fails to attach a
  surface. Switching stories remounts via `key` so the previous context is torn
  down. Graphics sections also await `loadGraphicsRuntime()` (a no-op on native)
  before the dynamic import, so CanvasKit is loaded before the Skia barrel
  evaluates on web.
- **`MapSection`** (`map`) — full-bleed, one story at a time; map stories fill
  their container rather than sizing to content, so `DemoScreen` hands them the
  whole canvas.
- **`MediaSection`** (`media`) — one story at a time, because `@knitui/media`
  owns a single shared `<audio>`/`<video>` engine that only one player can drive
  at once.

## Running the showcase

You never run `@knitui/demo` directly — you run one of the apps that mounts it,
from the **repo root**:

```sh
# Native (Expo dev server — @knitui/example)
pnpm start          # then press i / a, or scan the QR
pnpm ios
pnpm android

# Expo on web
pnpm web

# Next.js site (@knitui/web)
pnpm next
```

## Adding a section

There's usually nothing demo-specific to do — the gallery follows the stories:

1. **Add or edit a `*.stories.tsx`** in one of the generated packages
   (`components`, `dates`, `map`, `carousel`, `media`, `sheet`, `graphics`). Use
   a `title:` on `meta` (e.g. `"Inputs/Button"`) to control its group and name.
2. **Regenerate the registry:**

   ```sh
   pnpm --filter @knitui/demo generate:sections
   ```

   This rewrites `src/sections.generated.tsx`. Both apps pick it up on their next
   bundle.

Notes:

- To add a **whole new package** to the gallery, add its name to `PACKAGES` in
  [`scripts/generate-demo-sections.mjs`](../../scripts/generate-demo-sections.mjs)
  (and to the relevant `FULL_BLEED` / `WEBGL_GALLERY` / `MEDIA_GALLERY` set if it
  needs one-at-a-time rendering), then add it as a dependency in this package's
  `package.json`.
- Don't hand-edit `src/sections.generated.tsx` — it's overwritten on every run.

---

Part of the [Knit UI monorepo](../../README.md).
