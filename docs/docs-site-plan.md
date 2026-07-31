# Knit UI documentation website — build plan

Status: **implemented** — see [§17 Build log](#17-build-log) for what shipped and
the three places reality differed from this plan.
Author: drafted 2026-07-30, implemented 2026-07-30
Scope: a new `apps/docs` app that documents every `@knitui/*` package and all
~103 components, generated from the sources that already exist (stories, types,
tokens, READMEs, changelogs).

---

## 1. What we're copying from `Dream/lora`

`Dream/lora/apps/loradb.com` is a **Docusaurus v3** site (`yarn workspace loradb-docs start`),
deployed as a static build to **Cloudflare Pages** via `wrangler-action` in
`.github/workflows/loradb-docs.yml`. It's worth studying because the _feature
set_ is exactly what "a complete docs website" means in practice — but the
_framework choice_ does not transfer (see §2).

What it does, and what we should take:

| lora mechanism                                                                                                                | File                                                               | Take it?                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content = MDX tree under `docs/`, nav declared in one file                                                                    | `sidebars.js`                                                      | **Yes** — one declarative nav module, hand-ordered, not filesystem-ordered.                                                                                                                                          |
| Live, interactive code surfaces in prose (CodeMirror editor + WASM engine) via swizzled MDX scope                             | `src/theme/MDXComponents.jsx`, `src/components/LoraQueryCodeBlock` | **Yes, and further** — our equivalent is real live components, and the MDX global scope trick (`<Example>`, `<Props>`, `<Tokens>` available in every page with no import) is the single most useful pattern to copy. |
| `BrowserOnly` + static fallback for anything that needs the DOM                                                               | same                                                               | **Yes** — our kit has many components that touch `document` on mount.                                                                                                                                                |
| Per-route sitemap **priority/changefreq tiering**                                                                             | `docusaurus.config.js` `tierForUrl()`                              | **Yes** — port the function nearly verbatim.                                                                                                                                                                         |
| `llms.txt` + `llms-full.txt` emitted at build from a **curated manifest**                                                     | `plugins/llms-txt/{index,manifest}.js`                             | **Yes** — port to a standalone post-build script. High value for a component kit: agents writing UI code are a primary audience.                                                                                     |
| `noindex` plugin for thin/auto routes; sitemap `ignorePatterns`                                                               | `plugins/noindex`                                                  | **Yes.**                                                                                                                                                                                                             |
| Local, offline search with heading-weighted index and aggressive `ignoreCssSelectors`                                         | `@easyops-cn/docusaurus-search-local` theme config                 | **Concept yes, tool no** (§9).                                                                                                                                                                                       |
| GitHub stars fetch, Twitter/OG meta, CWV beacon → analytics, IndexNow submission, OpenSearch descriptor, full favicon/PWA set | `plugins/*`, `scripts/indexnow.mjs`, `headTags`                    | **Yes** — cheap, and it's the difference between "a docs site" and "a shipped docs site".                                                                                                                            |
| Content validation in CI (`validate-docs-cypher.mjs` executes every snippet in the docs)                                      | `scripts/`                                                         | **Yes, adapted** — our analogue is "every documented example is a real story that actually renders" (§12).                                                                                                           |
| `onBrokenLinks: "throw"`, `onBrokenAnchors: "throw"`, `trailingSlash: false`                                                  | config                                                             | **Yes** — hard-fail on broken links from day one.                                                                                                                                                                    |
| Blog with RSS/Atom, release-note posts, generated banner images                                                               | `blog/`, `scripts/build-blog-banner-v0-*.mjs`                      | **Yes, phase 5** — our release notes already exist as Changesets `CHANGELOG.md`.                                                                                                                                     |
| Comparison/benchmark landing pages as first-class React pages                                                                 | `src/pages/benchmarks/*`                                           | **Adapt** — our equivalent is "vs Mantine / vs Tamagui / vs Gluestack" and a platform-parity matrix.                                                                                                                 |

**Verdict:** copy lora's _checklist and rigour_ (SEO, llms.txt, link integrity,
snippet validation, curated nav, static deploy to Cloudflare Pages). Do **not**
copy Docusaurus.

---

## 2. Framework decision

### Recommendation: **Next.js 16 App Router + MDX**, in `apps/docs`, static-exported.

This is not a preference call, it's a constraint call:

1. **React version.** The monorepo pins `react: 19.2.3` in `pnpm.overrides`, with
   `react-native 0.86.2` and `reanimated 4.5.1`. Docusaurus v3 is React 18.
   Running the kit inside Docusaurus means either two React copies (which in this
   repo is the known Hermes/`"Cannot read property 'default'"` failure class, and
   on web is the classic invalid-hook-call) or unpinning the whole workspace.
2. **The toolchain already exists and works.** `apps/web` is Next 16 rendering
   _the entire_ demo gallery — every story of every package — through
   `withKnitui` (`@knitui/plugins/next-plugin`), which handles the Tamagui
   compiler, `react-native` → `react-native-web`, `.web.*` resolution order and
   `__DEV__`. `@knitui/plugins/next` provides the SSR provider. A docs app is
   `apps/web` plus MDX and a shell. Building the same wiring inside Docusaurus'
   webpack means re-deriving `packages/plugins/src/webpack.js` against a config
   we don't control, then fighting Skia's CanvasKit load order, maplibre,
   `expo-image`'s platform split, and the teleport portal host.
3. **We need components, not code samples.** lora documents a _query language_ —
   static text plus one embedded editor. We document _rendered UI_. Every page
   needs a live React tree with providers, theme switching, gestures and
   animation. That's an app, and it should be built as one.

Notes on the Next specifics (all already established in this repo):

- Dev/build must use `--webpack` (Next 16 defaults to Turbopack; the Tamagui
  plugin needs webpack — see `apps/web/package.json` and the SDK 57/Next 16
  upgrade notes).
- `transpilePackages` must list every workspace package used, because the kit
  **src-ships** (`main` → `./src/index.ts`).
- `@knitui/hooks` **lib-ships** — the docs build must `turbo run build --filter=@knitui/hooks`
  first, exactly as `apps/storybook/scripts/build-all.mjs` already does.
- Target `output: "export"` (fully static) so hosting is a CDN drop and search
  can be a post-build index over the emitted HTML. Anything that wants a server
  (OG image generation) moves to a build-time script instead.

### Rejected alternatives

| Option                                           | Why not                                                                                                                                                                                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Docusaurus 3** (lora parity)                   | React 18 vs the workspace's React 19; no path to the Tamagui/RNW toolchain without re-implementing `@knitui/plugins` inside a config we don't own.                                                                                                                     |
| **Ship Storybook as the docs site** (status quo) | Already exists and should stay — but it's a _contributor_ surface. No prose, no IA, no SEO, no install guide, no token reference, no hooks docs, weak deep-link/search story, and the aggregate build is ~60 min of CI across 10 child builds.                         |
| **Nextra / Fumadocs**                            | Both are good Next-based docs frameworks and would save shell work. Rejected because both own the Next config and the MDX pipeline, which is precisely where our non-negotiable Tamagui/RNW/Skia wiring lives. Revisit only if the hand-rolled shell becomes a burden. |
| **Vite + React Router SPA**                      | Loses SSR/SSG prose → loses the SEO and llms.txt value that is half the point.                                                                                                                                                                                         |
| **Astro + React islands**                        | Best-in-class for content sites, and islands map nicely onto "examples". Rejected because the kit's build integration (`@knitui/plugins`) targets metro/next/vite/webpack, not Astro, and Tamagui extraction would be unproven here.                                   |

### Relationship to the existing Storybook

Keep both. They read the **same story files** and must never diverge:

- **Storybook** (`apps/storybook`, GitHub Pages) — contributor/QA surface: all
  ~1,100 stories, controls, a11y and interaction addons, visual regression.
- **Docs** (`apps/docs`, new) — user surface: curated IA, prose, install and
  theming guides, generated prop tables, token reference, search, SEO.
- **Demo** (`packages/demo` → `apps/web` + `apps/app`) — device parity surface.

All three consume `*.stories.tsx`. That's the invariant that keeps three
surfaces honest with one authoring effort.

---

## 3. Goals / non-goals

**Goals**

1. Every public export of every published package is documented and reachable in
   ≤ 2 clicks from a search box or nav.
2. Every component page shows **live, interactive** examples that are literally
   the stories — no second copy of example code to rot.
3. Props, slots, sizes, variants and tokens are **generated from source**, not
   typed by hand.
4. Cross-platform truth is first-class: every page states web/iOS/Android
   support and native-specific caveats.
5. Copy-pasteable: install, provider setup, and bundler setup per tool (Expo,
   bare RN, Next, Vite) that actually work.
6. Machine-readable: `llms.txt`, `llms-full.txt`, per-page raw markdown, and a
   JSON component registry — so an agent can build with the kit correctly.
7. Static output, CDN-hosted, ~zero runtime infra.

**Non-goals (v1)**

- Multi-version docs (see §11 — explicit compat table instead).
- i18n.
- In-browser code _editing_ (phase 5 stretch; viewing + copying ships in v1).
- Replacing Storybook.
- A design-token Figma sync surface.

---

## 4. Information architecture

Groups mirror the existing story `title:` taxonomy (already consistent across
the workspace: `Inputs/`, `Display/`, `Data Display/`, `Layout/`, `Typography/`,
`Navigation/`, `Overlays/`, `Feedback/`, `Dates/`, map's `Sources/` `Layers/`
`Markers & Annotations/` `User Location/`, `Media/`, `Graphics/`). That's the
"use the storybook structure" instruction, made canonical: **the story title is
the docs route**.

```
/                                     Landing: hero w/ live kit, install, stats, feature grid
/docs                                 What is Knit UI · why · architecture map · package matrix

/docs/getting-started
  installation                        Expo · bare RN · Next.js · Vite (peer-dep matrix)
  quickstart                          Provider + first component, per platform
  bundler-setup                       @knitui/plugins for metro/next/vite/webpack/babel
  ssr                                 NextTamaguiProvider, generated CSS, hydration rules
  typescript                          Token unions, shorthand augmentation, AppConfig
  troubleshooting                     Duplicate react-native, reanimated singleton, Tamagui warning-001…

/docs/foundations
  principles                          Composable-first, one source → 3 platforms
  tokens                              space · size · radius · fontSize · zIndex (live tables)
  color-and-themes                    Palette ramps, 12-step scales, semantic tokens
  theme-builder                       createTheme / extendTheme / themePresets
  typography                          Font stacks, fontSize scale, Text/Title ladders
  sizing                              controlMetrics — the size SoT (live table)
  variants-and-colors                 controlColorVariant / surfaceColorVariant ladders
  elevation                           shadowVariant, cross-platform boxShadow polyfill
  motion                              Motion tokens, motionPresets, usePressScale, Transition
  focus-and-a11y                      Two-layer focus contract, roles, keyboard maps
  layout                              Box/Flex/Stack/Grid decision tree
  slots-and-styles                    Per-slot `styles`, createSlot/defineSlots
  gradients                           variant="gradient" + useGradient
  responsive                          useMedia, breakpoints, @knitui/mediaquery
  dark-mode                           Provider color scheme, forceColorScheme, system
  rtl                                 Logical props, what flips and what doesn't
  icons                               IconProvider, ControlIconProvider, CONTROL_ICON_SIZE
  styled-escape-hatch                 @knitui/core styled(), .styleable() caveats

/docs/components/<group>/<Name>       ~103 pages (see §6 for page anatomy)
/docs/dates/<Name>                    34 pages + kit overview
/docs/carousel                        overview · api · 10 layout modes · transitions · native scroll · pagination · perf
/docs/map                             overview · MapView · Sources/* · Layers/* · Markers/* · UserLocation/* · SvgImage & clustering · styles · interactivity
/docs/media                           MediaProvider · audio · video · playlist · recorder · streams · dsp · visualizers · lock screen
/docs/graphics                        GraphicsProvider · GraphicCanvas · EffectView · ShadowView · AudioVisualizer · Skia notes
/docs/sheet · /docs/emoji · /docs/mediaquery
/docs/icons                           Searchable icon browser (reuse IconsSection pattern)
/docs/hooks/<use-*>                   ~45 pages, generated from JSDoc + signature

/docs/guides
  cross-platform-authoring            .native splits, isWeb branches, what breaks where
  expo-setup · nextjs-setup · vite-setup
  theming-an-app                      End-to-end brand theme
  composing-components                Slots, styled(), extending kit frames
  forms                               Field composition, validation, keyboard handling
  performance                         VirtualList, carousel windows, list virtualisation, bundle size
  animation                           Reanimated 4 rules, worklets, platform listener split
  testing                             jest + jsdom conventions, playwright visual
  migrating-from-mantine              API delta table (the kit's lineage)
  platform-differences                Matrix: component × web/iOS/Android × caveat

/docs/api
  packages                            Matrix: package · version · peers · platforms · size
  exports                             A–Z of every export → its page (generated)
  compatibility                       Expo SDK / RN / React / reanimated support table

/docs/contributing                    Repo layout · conventions · add-a-component · stories · tests · release (changesets)

/changelog                            Unified timeline + per-package (from CHANGELOG.md)
/blog                                 Release notes + engineering essays (phase 5)
/playground                           Full-page multi-component sandbox
/search                               Search results page (noindex)

llms.txt · llms-full.txt · sitemap.xml · robots.txt · opensearch.xml
```

Route count estimate: ~103 components + 34 dates + ~45 hooks + ~60 satellite/
foundations/guides ≈ **250 pages**. That is the scale the generators must serve;
it is not hand-authorable page-by-page, which drives §5.

---

## 5. Content model and generation pipeline

The rule: **prose is hand-written, everything else is generated.** Each page is
an MDX file whose body is mostly generator-driven components, with hand-written
paragraphs where judgement is needed.

Generators live in `scripts/docs/` and write into `apps/docs/src/generated/`
(git-committed, with a `// GENERATED — do not edit` header, so the site builds
without running generators and diffs are reviewable).

### 5.1 `build-registry.mjs` → `generated/registry.json`

The spine. For every `*.stories.tsx` in every package:

- package, story `title` → `{ group, name }`, slug/route
- each named export: story name, humanized label, its **JSDoc comment** (already
  written on most stories — free prose), `args`, whether it has a custom `render`
- meta-level `args`, `argTypes` (with the `description` fields already authored),
  `parameters.docs.description.component` (free intro paragraph)
- source file path, GitHub permalink, test file presence, `.native.tsx` presence
- the component's `index.ts` exports and static sub-components

Upgrade path from `scripts/generate-demo-sections.mjs`: that script regex-scrapes
`title:` out of the meta block, which is fine for its job. The docs registry
needs `argTypes`, per-export JSDoc and source ranges, so parse properly with
**oxc-parser** or `ts-morph` (both already viable; `ts-morph` is the safer pick
since we need the type layer anyway for §5.3).

### 5.2 `build-story-sources.mjs` → `generated/sources/**`

For each story export, emit the exact source of that export (the `render`
function body, or the args object), prettier-formatted, plus the import block it
needs, as a self-contained runnable snippet. Highlight at build time with
**Shiki** (dual light/dark themes as CSS variables → zero runtime highlighter).

This is what makes "no duplicated examples" real: the code shown is sliced out of
the file that is actually executing.

### 5.3 `build-props.mjs` → `generated/props/**` — _the hard one_

Target: a props table per component and per sub-component, with type, default,
required flag and JSDoc description.

Approach: `ts-morph` over each package's **built declarations**
(`lib/typescript/**/*.d.ts` — `bob` already emits these) rather than source,
because the built `.d.ts` has Tamagui's `styled()` generics already resolved.

The filtering rule matters more than the extraction:

- **Own props** — declared in the component's own type literal → main table.
- **Inherited style props** — anything reaching in from `@tamagui/*` /
  `react-native` (`Box` frame props, the hundreds of style shorthands) → collapse
  into one "Style props (inherited from `Box`)" disclosure linking to
  `/docs/foundations/tokens`, never enumerated inline.
- **Kit system props** (`size`, `variant`, `theme`, `radius`, `shadow`,
  `styles`) → a shared "System props" table rendered from one definition, since
  they mean the same thing on every component.
- **Augment layer**: story `argTypes[prop].description` overrides/fills the
  JSDoc, and a hand-editable `apps/docs/content/overrides/<Component>.props.json`
  wins over both — an escape hatch for the cases generation gets wrong.

⚠️ **Spike this before committing to the plan** (§13, Phase 0). Prop extraction
from Tamagui `styled()` + `withStaticProperties` + generic components (e.g.
`Accordion`'s `multiple`-conditional value types) is the single highest-risk item
in this document. Validate against five representatives: `Button` (systems),
`Combobox` (compound + generics), `Input` (platform split + RN base),
`ScrollArea` (own props colliding with RN style names — the known `shadowColor`
class of bug), `Modal` (slots + portal).

### 5.4 `build-metadata.mjs` → `generated/components.json`

Seed from `.claude/skills/knitui-component-builder/references/catalog/*.md`.
That catalog already carries, for all 103 components, exactly the fields a docs
page header wants: purpose, source path, public API + sub-components, key props,
size/variant/color support, `styles` slot keys, platform split, what it composes,
and gotchas. Convert once into structured JSON + prose seeds, then hand-edit the
prose. **This is the biggest content accelerator available and should be
exploited in Phase 3.**

### 5.5 `build-tokens.mjs` → `generated/tokens.json`

Read `packages/core/src/config/{tokens,scales,themes,fonts,motion,easing}.ts`,
`packages/components/src/internal/control-metrics.ts` and `variant-colors.ts`.
Powers the live token tables, swatch grids, the sizing ladder and the variant
matrix — so foundations docs can never drift from the config.

### 5.6 `build-hooks.mjs` → `generated/hooks.json`

`@knitui/hooks` (`use-*.ts`, with `.native`/`.shared` splits) + documented hooks
exported from `components`/`core`. Signature + JSDoc + platform split + a live
example where a story exists.

### 5.7 `build-changelog.mjs` → `generated/changelog.json`

Parse each package's Changesets `CHANGELOG.md` into `{ version, date, package,
entries[] }`. Renders `/changelog`, per-package changelogs, and a "Changed in"
strip on component pages (match entries by component name mention).

### 5.8 Post-build emitters (mirroring lora)

- `build-search-index.mjs` — Pagefind over the exported HTML (§9).
- `build-llms.mjs` — `llms.txt` (curated manifest, hand-ordered) +
  `llms-full.txt` (concatenated markdown of those pages). Port
  `lora/apps/loradb.com/plugins/llms-txt/`.
- `build-sitemap.mjs` — port lora's `tierForUrl()`: `/` 1.0 daily; getting-started
  0.8; components 0.7; deep API/reference 0.6; changelog entries 0.4.
- `build-og-images.mjs` — satori + sharp per route (title + package + platform
  badges), like lora's `build-blog-banner-*.mjs`. Build-time, not runtime, so
  `output: "export"` holds.
- `build-raw-markdown.mjs` — emit `<route>.md` next to every HTML page so agents
  and `?raw` links get clean source.

### 5.9 Turbo wiring

```jsonc
// turbo.json
"docs:generate": { "inputs": ["packages/*/src/**", "packages/*/CHANGELOG.md", "scripts/docs/**"],
                   "outputs": ["apps/docs/src/generated/**"] },
"build":         { "dependsOn": ["^build", "docs:generate"] }  // for @knitui/docs only
```

Root scripts: `pnpm docs` (dev, port **3001**), `pnpm docs:build`,
`pnpm docs:generate`, `pnpm docs:check`.

---

## 6. Component page anatomy

Every `/docs/components/**` page renders this skeleton (MDX, ~30 lines of
hand-written prose + generator components):

1. **Header** — name, one-line purpose, package badge, version-added,
   **platform badges** (web/iOS/Android), links: source · stories · tests ·
   Storybook · Figma (if mapped).
2. **Import** — copy-button snippet, showing the barrel and the sub-components.
3. **Playground** — the `Playground` story with a **generated controls panel**
   from `argTypes`, built out of the kit's own inputs (dogfooding). Live code
   updates as controls change.
4. **Anatomy** — for compound components, the part tree (`Card.Section`,
   `Menu.Item`, …) with a diagram or annotated snippet.
5. **Examples** — _every remaining story_, each with canvas + collapsible source
   - copy + "open in Storybook". JSDoc above the story becomes its caption.
6. **Props** — own props table, then System props, then collapsed inherited style
   props; repeated per sub-component.
7. **Slots & `styles`** — slot key table (what each key targets), plus the
   `Styles` story (every component has one — see the composability rollout).
8. **Sizes** — the `controlMetrics` row for this component, rendered live.
9. **Variants & colors** — the variant × theme matrix, rendered live.
10. **Accessibility** — role, keyboard map, focus behavior, labelling
    requirements. Hand-written; seeded from the catalog + test names.
11. **Platform notes** — native split, `isWeb` branches, gotchas (catalog's
    "Gotchas" field is a direct feed here).
12. **Related** — composed-of / used-by graph (derivable from imports).
13. **Changed in** — changelog entries mentioning the component.
14. **Edit this page** + "was this helpful".

MDX for a typical component is therefore short:

```mdx
---
title: Button
group: Inputs
package: "@knitui/components"
---

<ComponentHeader id="components/Inputs/Button" />

Button is the kit's canonical control: `Box` + `Text`, colored through the
theme's palette ramp, sized from `controlMetrics`.

<Playground id="components/Inputs/Button" />
<Examples id="components/Inputs/Button" />
<Props id="components/Inputs/Button" />
<SlotStyles id="components/Inputs/Button" />
<SizeLadder id="components/Inputs/Button" />
<VariantMatrix id="components/Inputs/Button" />

## Accessibility

Renders a real `<button>` on web via `webButton()` … (hand-written)

<PlatformNotes id="components/Inputs/Button" />
<RelatedComponents id="components/Inputs/Button" />
<ChangedIn id="components/Inputs/Button" />
```

Those components are registered in the MDX global scope — lora's
`MDXComponents.jsx` swizzle, done via `mdx-components.tsx` in Next — so pages
never import them.

---

## 7. The live-example runtime

### 7.1 Reuse the CSF resolver we already have

`packages/demo/src/StorySection.tsx` already implements CSF-module resolution at
runtime (meta/story arg merging, decorator application, `render` semantics,
per-story error boundary, `humanize`). Do **not** write a third copy.

**Task:** extract that resolver into a small private package
`packages/story-runtime` (`resolveStory`, `StoryErrorBoundary`, `humanize`,
types), and make `packages/demo` and `apps/docs` both consume it. One
implementation, three surfaces (docs, web demo, native demo).

### 7.2 `<Example>` / `<Playground>` internals

- Client component; `next/dynamic` with `ssr: false` per story module (many
  components reach for `document` on mount — the same reason `apps/web` renders
  the whole gallery client-only).
- Story modules are imported through a generated lazy map (`generated/story-modules.ts`)
  so each component route only pulls the story chunks it needs.
- **Mount-on-visible**: `IntersectionObserver` gates mounting; below-the-fold
  canvases don't run.
- Chrome per example: color-scheme toggle, accent-theme picker, size toggle, RTL
  toggle, reset, fullscreen, copy code, view source, open-in-Storybook,
  open-on-device (QR → Expo demo).
- Error isolation via the shared `StoryErrorBoundary`.

### 7.3 Known constraints the runtime must respect

These are all documented failure modes in this repo, and the docs app hits every
one of them:

| Constraint                                                          | Consequence for docs                                                                                                                           |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Browsers cap live WebGL contexts (~16); Skia canvases each hold one | `/docs/graphics/**` renders **one canvas at a time** (`CanvasGallerySection` pattern), key-remounted on switch.                                |
| `@knitui/media` owns **one** real `<audio>`/`<video>`, teleported   | `/docs/media/**` renders **one player at a time** (`MediaSection` pattern).                                                                    |
| Skia web captures `global.CanvasKit` at module eval                 | CanvasKit must be preloaded (`loadGraphicsRuntime()`) _before_ the story barrel imports — same ordering `generate-demo-sections.mjs` enforces. |
| Map stories are full-bleed (`flex: 1`)                              | Map examples get an explicit-height, full-width canvas (`FULL_BLEED` pattern); maplibre loaded lazily per route.                               |
| Portal/teleport root host lives in the core `Provider`              | The docs root layout mounts `NextTamaguiProvider` once; overlay examples must not nest a second Provider.                                      |
| React StrictMode disposes shared media engines                      | Either drop StrictMode on media routes or rely on the deferred-dispose fix; verify explicitly.                                                 |
| `.styleable()` ⇒ `neverFlatten` for 81/84 components                | The Tamagui compiler can't flatten most of the kit → expect RNW-ish DOM and set the perf budget accordingly (§10).                             |

### 7.4 Editable examples (phase 5 stretch)

`react-runner` (or Sandpack) with a scope pre-populated from the kit barrels,
loaded only when the user clicks **Edit**. Big payoff for a component library;
strictly additive; keep off the critical path.

---

## 8. Docs shell — dogfood the kit

Build the site chrome **out of `@knitui/components`**. It's the most persuasive
possible showcase, and it's a forcing function that surfaces SSR and a11y bugs
before users do:

| Shell part                | Kit component                                                |
| ------------------------- | ------------------------------------------------------------ |
| Sidebar nav               | `NavLink` (+ `Accordion` for groups)                         |
| Right-rail contents       | `TableOfContents`                                            |
| Search modal              | `Modal` + `TextInput` + `Combobox`                           |
| Prose callouts            | `Alert`                                                      |
| Code blocks / inline code | `Code`, `Kbd`                                                |
| Tabs (Expo/RN/Next/Vite)  | `Tabs`                                                       |
| Props tables              | `Table`                                                      |
| Theme/scheme switchers    | `SegmentedControl`, `Switch`, `ColorSwatch`                  |
| Mobile drawer             | `Drawer`                                                     |
| Version/package chips     | `Badge`, `Pill`                                              |
| Scroll container          | `ScrollArea` (`scrollbars="y"` — the xy width-collapse trap) |

**Guardrail:** if LCP/INP on a prose page misses the budget in §10, demote _prose
and chrome_ to plain HTML/CSS and keep the kit for examples only. Decide with a
measurement, not a preference — but start with dogfooding.

---

## 9. Search

**Pagefind**, run post-export over the emitted HTML.

- Zero infra, works with `output: "export"` on a CDN, chunked index (scales to
  ~250 pages far better than shipping one lunr blob).
- Supports **filters** — critical here: filter by package, by group, by platform.
- Custom UI in kit components, `⌘K`/`Ctrl-K`, arrow-key nav, recent searches.
- Weight headings over body, and exclude chrome from the index — lora's
  `ignoreCssSelectors` list is the reference for what to strip (nav, footer,
  sidebar, TOC, breadcrumbs, pagination, hash links).
- Index the **component registry** as synthetic entries too, so searching
  `"leftSection"` or `"controlMetrics"` finds the prop/token, not just prose.

Alternative considered: Orama (better typo tolerance, JSON index) — revisit if
Pagefind's ranking disappoints. Algolia DocSearch is a fine fallback but adds an
external dependency and application/approval overhead.

---

## 10. Performance budget

The docs app bundles a 103-component kit plus Skia, maplibre and expo-image.
Without discipline it will be a 5 MB page.

Budget (enforced in CI, per route, gzipped):

| Route class                | JS budget                                 | LCP (mobile, throttled) |
| -------------------------- | ----------------------------------------- | ----------------------- |
| Landing                    | 250 kB                                    | < 2.0 s                 |
| Prose (guides/foundations) | 180 kB                                    | < 1.8 s                 |
| Component page             | 400 kB                                    | < 2.5 s                 |
| Graphics / map / media     | 900 kB (lazy chunks excluded from budget) | < 3.5 s                 |

Tactics:

1. Route-level code splitting; **never** import a package barrel from shell code.
2. Story modules loaded per-route via the generated lazy map; mount-on-visible.
3. Shiki at build time — no runtime highlighter.
4. maplibre, CanvasKit, `react-runner` all dynamically imported behind
   interaction or visibility.
5. Tamagui compiler on (`withKnitui`) with `TAMAGUI_IGNORE_BUNDLE_ERRORS` where
   the static loader can't `require()` src-shipped packages (warning-001).
6. Self-hosted fonts, `next/font`, no external CSS.
7. Ship lora's CWV beacon so regressions surface per route in analytics.

---

## 11. Versioning

Do **not** adopt Docusaurus-style versioned docs in v1 — for a 0.x kit shipping
weekly via Changesets it's pure overhead and instant rot.

Instead:

1. Docs always describe **latest published** (`@knitui/components` is 0.7.0 today).
2. Every page shows "version added" per component/prop, from the changelog data.
3. `/docs/api/compatibility` carries the real matrix consumers need: kit version
   × React × RN × Expo SDK × reanimated × Tamagui.
4. When 1.0 lands: snapshot the **exported static output** per minor to
   `/v1.0/**` on the CDN and add a version switcher. Static snapshots, no
   framework machinery.

---

## 12. Quality gates (CI)

Ported from lora's philosophy — the docs build should fail, not warn.

1. **Broken links/anchors → error.** Internal link check over the export
   (lora: `onBrokenLinks: "throw"`).
2. **Coverage guardrail** (`scripts/docs/check-coverage.mjs`, wired next to the
   existing `pnpm check:naming`):
   - every export in every package's `index.ts` has a docs page or an explicit
     waiver entry;
   - every component page has ≥ 1 live example;
   - every component page has a non-empty props table;
   - every story in every package is reachable from some docs page (so new
     stories can't be silently undocumented).
3. **Example integrity** — a headless pass mounts every `<Example>` and fails on
   a thrown error or an empty render (our analogue of lora's
   `validate-docs-cypher.mjs`). Reuse the existing Playwright setup in
   `packages/components/visual/`.
4. **A11y** — axe over every page + every mounted example.
5. **Type/lint** — the docs app joins `pnpm typecheck` / `pnpm lint`
   (`eslint .`, per the repo's per-package convention).
6. **Bundle budget** — fail the build on regressions past §10.
7. **Generated-file drift** — re-run generators in CI and fail if the committed
   `generated/**` differs.
8. **Prop-override staleness** — warn when an override file references a prop
   that no longer exists.

Workflow `.github/workflows/docs.yml`: build + all gates on PR (with a preview
deploy), deploy on `main`. Node needs headroom (`--max-old-space-size=4096`) —
the same reason the Storybook workflow sets it.

Hosting: **Cloudflare Pages** via `wrangler-action` (mirrors lora exactly,
including a committed `wrangler.toml` with `pages_build_output_dir`). GitHub
Pages stays with Storybook. Cross-link the two; domain TBD (§15).

---

## 13. Phased delivery

Sizes are relative effort, not calendar promises.

### Phase 0 — Spikes (small, do first, in a scratch branch)

Nothing else is safe to commit to until these three answers exist:

1. **Props extraction spike** — `ts-morph` over `lib/typescript` for `Button`,
   `Combobox`, `Input`, `ScrollArea`, `Modal`. Output: sample tables + a written
   verdict on the own/inherited filtering rule. _If this fails, the fallback is
   `argTypes`-driven tables (stories already carry descriptions for the props
   that matter) plus per-component override files — worse, but viable. Decide
   here, not later._
2. **Render spike** — minimal Next 16 App Router app (`--webpack`, `withKnitui`,
   `NextTamaguiProvider`, `@next/mdx`) rendering one story from
   `@knitui/components/src/Button/Button.stories` inside MDX prose, static-exported.
3. **Source-slice spike** — extract one story export's source, prettier it,
   Shiki it, prove the snippet is genuinely copy-pasteable.

**Exit criteria:** three working spikes + a decision note appended to this file.

### Phase 1 — Skeleton (medium)

- `apps/docs` scaffolded: Next 16, `--webpack`, `withKnitui`, `transpilePackages`,
  `output: "export"`, `@next/mdx` + `mdx-components.tsx` global scope.
- Turbo + root scripts (`pnpm docs` on **3001**), eslint/tsconfig per repo convention.
- Shell in kit components: sidebar (`NavLink`), TOC (`TableOfContents`), header,
  mobile `Drawer`, scheme toggle, footer.
- Declarative nav module (lora's `sidebars.js` equivalent) with the full §4 tree
  as stubs.
- Three hand-written component pages (`Button`, `Card`, `TextInput`) proving the
  §6 anatomy end-to-end.
- CI builds it; broken-link check on.

**Exit:** `pnpm docs:build` produces a static site; three real pages; nav renders.

### Phase 2 — Generators + runtime (large)

- `packages/story-runtime` extracted; `packages/demo` refactored onto it.
- `build-registry`, `build-story-sources`, `build-props`, `build-tokens`,
  `build-metadata` shipping into `generated/`.
- MDX components: `ComponentHeader`, `Playground` (+ generated controls panel),
  `Examples`, `Props`, `SlotStyles`, `SizeLadder`, `VariantMatrix`,
  `PlatformNotes`, `RelatedComponents`, `ChangedIn`, `Tokens`, `Swatches`.
- Shiki pipeline, copy buttons, per-example chrome, mount-on-visible.
- `check-coverage.mjs` in CI (initially warn-only, flipped to error at Phase 3 end).

**Exit:** the three Phase-1 pages are now ~30 lines of MDX each and richer than
the hand-written versions.

### Phase 3 — The components sweep (large, parallelisable)

- Generate MDX scaffolds for all 103 components + 34 dates components.
- Seed prose from the skill catalog (§5.4): purpose, gotchas, platform notes,
  slot keys.
- Hand-write, per component: intro paragraph, accessibility section, "when to use
  / when not to".
- All foundations pages (token/sizing/variant tables come free from
  `build-tokens`).
- Getting-started: installation × 4 toolchains, quickstart, bundler setup, SSR,
  troubleshooting (the repo's accumulated failure modes are gold here).
- Flip coverage guardrail to **error**.

**Exit:** every component and every foundation has a real page; guardrail green.

### Phase 4 — Satellites + hooks + guides (medium)

- `dates`, `carousel`, `map`, `media`, `graphics`, `sheet`, `emoji`, `icons`,
  `mediaquery` overviews and per-surface pages, each honouring its §7.3 constraint.
- Icon and emoji browsers (searchable, virtualised — reuse `IconsSection` /
  `EmojiSection` patterns rather than one page per glyph).
- ~45 hook pages from `build-hooks`.
- All `/docs/guides/**`, including the platform-difference matrix and the
  Mantine migration delta.
- `/docs/api/exports` A–Z, `/docs/api/compatibility`, `/changelog`.

**Exit:** every published export is reachable; nav has no stubs.

### Phase 5 — Ship polish (medium)

- Pagefind search + `⌘K` UI with package/platform filters.
- `llms.txt`, `llms-full.txt`, per-page raw markdown.
- Tiered sitemap, robots, OpenSearch, favicon/PWA set, JSON-LD
  (`SoftwareSourceCode` / `TechArticle` / `BreadcrumbList`).
- Build-time OG images (satori).
- Landing page + `/playground`.
- Analytics + CWV beacon; IndexNow submission script.
- A11y sweep, perf budget enforcement, visual regression on docs pages.
- Cloudflare Pages production deploy + custom domain; cross-links to Storybook.
- **Stretch:** editable examples; Expo QR "open on device"; blog with release
  notes generated from Changesets.

---

## 14. Proposed file layout

```
apps/docs/
  package.json                # @knitui/docs, private, dev:3001, build → out/
  next.config.mjs             # withKnitui(...), transpilePackages, output:"export"
  mdx-components.tsx          # global MDX scope (lora's MDXComponents swizzle)
  wrangler.toml               # Cloudflare Pages: pages_build_output_dir = "out"
  content/
    index.mdx
    getting-started/*.mdx
    foundations/*.mdx
    components/<group>/<Name>.mdx
    dates/*.mdx  carousel/*.mdx  map/*.mdx  media/*.mdx  graphics/*.mdx  …
    hooks/*.mdx
    guides/*.mdx
    api/*.mdx
    contributing/*.mdx
    overrides/<Component>.props.json     # hand-authored prop-table fixes
  src/
    app/
      layout.tsx              # NextTamaguiProvider (once), shell
      (docs)/[...slug]/page.tsx
      search/page.tsx
      playground/page.tsx
      changelog/page.tsx
    nav/
      sidebar.ts              # the single declarative nav tree
    components/               # docs-only chrome + MDX components
      shell/  example/  props/  tokens/  search/  code/
    generated/                # GENERATED — do not edit
      registry.json  components.json  tokens.json  hooks.json  changelog.json
      story-modules.ts  sources/**  props/**
  public/                     # favicons, og/, opensearch.xml, js/cwv-beacon.js
  scripts/                    # post-export: pagefind, llms, sitemap, og, raw-md

packages/story-runtime/       # NEW — CSF resolver shared by docs + demo
scripts/docs/                 # generators (registry, sources, props, tokens, …)
.github/workflows/docs.yml    # build + gates on PR, deploy on main
```

---

## 15. Risks, and open questions for you

**Top risks**

| Risk                                                                  | Mitigation                                                                                                        |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Prop-table generation on Tamagui `styled()` components under-delivers | Phase 0 spike gates the whole design; `argTypes` + override files as documented fallback.                         |
| Bundle weight / poor LCP because 81/84 components `neverFlatten`      | §10 budget in CI from Phase 1; documented escape hatch of plain-HTML prose (§8).                                  |
| WebGL / single-media-engine constraints break multi-example pages     | One-at-a-time renderers, already proven in `packages/demo`.                                                       |
| 250 pages of prose is a lot of writing                                | Catalog seeding (§5.4) + story JSDoc + `argTypes` descriptions already cover most of it; generators own the rest. |
| Docs drift as the kit moves weekly                                    | Coverage guardrail + generated-drift check as hard CI errors.                                                     |
| Three surfaces (docs/Storybook/demo) diverge                          | One shared `story-runtime`, one story-file source of truth.                                                       |
| Scope creep into a marketing site                                     | Landing page is Phase 5 and deliberately thin.                                                                    |

**Open questions I need answers to before Phase 1**

1. **Domain / hosting.** `knitui.dev`? `docs.knitui.dev` with Storybook at
   `storybook.knitui.dev`? Cloudflare Pages (lora parity) vs Vercel? Do you own a
   domain already?
2. **Dogfood the shell, or keep prose in plain HTML/CSS?** My recommendation is
   dogfood first and measure; say the word if you'd rather not put RNW on the
   critical path of every prose page.
3. **Landing page scope** — thin "install + live showcase", or a real marketing
   page (lora has a full `features` page and six benchmark pages)?
4. **Blog** — do you want one (release notes + engineering essays), or is
   `/changelog` enough?
5. **Editable examples** — is in-browser editing a v1 must-have, or a phase-5
   stretch as planned?
6. **Native parity surface** — is "open on device via Expo QR" worth wiring, or
   do platform badges + notes suffice?

---

## 16. Summary of the decision

Build `apps/docs` as a **Next.js 16 App Router + MDX** app, static-exported to
Cloudflare Pages, because the kit's own toolchain (`@knitui/plugins`, React 19,
Tamagui compiler, RNW aliasing) already runs there and cannot reasonably be made
to run inside Docusaurus. Borrow lora's _rigour_ wholesale: curated nav module,
live MDX components in global scope, tiered sitemap, `llms.txt`/`llms-full.txt`,
hard-failing link checks, build-time snippet validation, static CDN deploy.

Make the **story files the single source of truth** — routes come from story
titles, examples come from story exports, captions come from story JSDoc,
controls come from `argTypes` — and generate props, slots, sizes, variants,
tokens, hooks and changelogs from source. Prose is the only thing written by
hand, and the component catalog already seeds most of it.

Keep Storybook. It's the contributor surface; the docs site is the user surface;
both read the same files.

---

## 17. Build log

The site is built and passes its own guardrails. `pnpm docs` runs it on port 3001;
`pnpm docs:build` produces **264 static pages** in `apps/docs/out`.

### What shipped

| Piece                                      | Where                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Shared CSF resolver                        | `packages/story-runtime` (`@knitui/demo` refactored onto it)                                      |
| Story registry · sources · lazy import map | `scripts/docs/build-registry.mjs` → 179 modules, 1,580 stories                                    |
| Props extraction                           | `scripts/docs/build-props.mjs` → 171 components, own/system/style/react buckets + slot keys       |
| Hooks reference                            | `scripts/docs/build-hooks.mjs` → 34 hooks, 11 with native splits                                  |
| Token / sizing / motion data               | `scripts/docs/build-tokens.mjs`                                                                   |
| Exports A–Z + package metadata             | `scripts/docs/build-exports.mjs` → 1,257 exports                                                  |
| Changelog                                  | `scripts/docs/build-changelog.mjs` → 95 releases, 25 versions                                     |
| Nav                                        | `scripts/docs/nav.config.mjs` + `build-nav.mjs` → 15 sections, 260 links                          |
| Content index                              | `scripts/docs/build-content.mjs` → 260 MDX pages                                                  |
| Page scaffolder                            | `scripts/docs/scaffold-pages.mjs` → 177 component pages                                           |
| Coverage guardrail                         | `scripts/docs/check-coverage.mjs` (`pnpm docs:check`)                                             |
| The app                                    | `apps/docs` — Next 16, `output: "export"`, MDX content tree                                       |
| Post-build                                 | `apps/docs/scripts/postbuild.mjs` — robots · tiered sitemap · llms.txt · llms-full.txt · Pagefind |
| CI + deploy                                | `.github/workflows/docs.yml`, `apps/docs/wrangler.toml`                                           |

Verified: 18/18 examples mount on the Button page with zero console errors;
Pagefind returns `/docs/foundations/sizing` first for "controlMetrics"; dark mode,
the generated controls panel, and the live token tables all work.

### Three deviations from the plan

**1. MDX files are content, not pages.** `page.mdx` files were the plan's
assumption. Next's RSC pass treats a compiled `.mdx` module as a _client_ module,
so `export const metadata` — the documented way to title an MDX page — fails with
"you are attempting to export metadata from a component marked with use client".
Content therefore lives in `apps/docs/content/**` and is served by one real
`page.tsx` per route family, with titles from a plain `meta` export. A required
catch-all (`[...slug]`) plus an explicit `/docs` index was needed too: with
`output: "export"`, an _optional_ catch-all is rejected as "missing
generateStaticParams()" even when the export is present.

**2. Chrome and prose are plain CSS, not kit components.** §8 planned to dogfood
the kit for the shell and measure. Implemented the documented fallback instead,
up front: the shell and prose read the kit's own CSS custom properties
(`--color11`, `--t-space-md`, …) so they stay theme-aware and token-driven with
zero JS, while **every example is the real kit**. This keeps prose pages small and
avoids react-native-web's inline-layout behaviour in body text. The dogfood pass
remains available as a follow-up.

**3. Inherited style props are deduplicated globally.** Emitting all ~500 per
component produced a 23 MB `props.json`. They are identical everywhere (one `Box`
frame), so one shared table plus a per-component count carries the same
information at 2.3 MB.

### Prop extraction verdict (the Phase 0 risk)

It works. `getTypeOfSymbol` resolves through Tamagui's variant machinery where a
declaration-scoped lookup reduces to `unknown`; barrel-alias fallback resolves the
five map components whose story `component:` names an alias; slot keys come free
off the `SlotStyles<…>` type; and React 19's expanded `ReactNode` union is folded
back to the word `ReactNode`. Seven story modules do not resolve to a single
component (`Motion`, `Portal`, map `Styles`, …) and are reported as notes, not
failures.

### Known follow-ups

- 177 component pages are scaffolds: generated header, playground, examples and
  props tables, but the hand-written prose (when to use, accessibility, platform
  notes) exists only for `Button`. `Examples`/`PropsTable` mean they are useful
  now; the prose is the remaining work, and `check-coverage.mjs` will not flag it.
- No OG images yet (`build-og-images.mjs` is specified, not written).
- No per-route JS budget check in CI yet.
- Editable examples, blog, and the Expo QR remain phase-5 stretch items.
- Domain still undecided — `postbuild.mjs` and `layout.tsx` assume
  `https://knitui.dev`; override with `DOCS_SITE_URL`.
