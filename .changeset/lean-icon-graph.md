---
"@knitui/icons": minor
"@knitui/components": patch
"@knitui/carousel": patch
"@knitui/media": patch
"@knitui/sheet": patch
"@knitui/plugins": patch
---

Stop the icon barrel from being pulled into every component

`@knitui/components` dragged all ~6.1k icon modules into any app that imported a
single component. The kit SRC-SHIPS, so Metro compiles what it resolves and does
NOT tree-shake: one line in `internal/ControlIconProvider.tsx` —
`import { IconProvider } from "@knitui/icons"` — resolved the root barrel
(`packages/icons/src/index.ts`, 378 KB / 6,153 export lines), and because that
module is reachable from `Button`, `Chip`, `Accordion` and friends, every glyph
became part of the graph. Walking the import graph from each package entry,
honouring `exports` conditions and `.web`/`.native` order:

| entry                | before                   | after                  |
| -------------------- | ------------------------ | ---------------------- |
| `@knitui/components` | 6,490 modules / 4,896 KB | 344 modules / 1,635 KB |
| `@knitui/sheet`      | 6,506 modules / 4,960 KB | 360 modules / 1,700 KB |
| `@knitui/carousel`   | 6,541 modules / 5,068 KB | 398 modules / 1,808 KB |
| `@knitui/media`      | 6,530 modules / 5,056 KB | 384 modules / 1,796 KB |

That is −94.7% modules and −3,261 KB of source off the components graph, and it
lands on Metro cold start, on every clear-cache rebuild, and on the JS bundle
itself for consumers whose bundler cannot shake a src-shipped barrel.

**`@knitui/icons` gains two subpath exports** (the minor):

- `@knitui/icons/context` — `IconProvider`, `useIconContext` and their types
- `@knitui/icons/types` — `IconProps`, `IconNode`, `IconComponent`, `IconType`

Per-glyph deep imports (`@knitui/icons/IconCheck`) already resolved through the
existing `./Icon*` wildcard; the provider was the one thing that had no subpath
and therefore forced the barrel. Nothing was removed — the root barrel still
exports everything it did.

**Internal import rewrites** (patch, no API change) across the shipped source of
`@knitui/components` (`ControlIconProvider`, `Accordion`, `Checkbox/CheckIcon`,
`Chip`, `CloseButton`, `Combobox`, `Stepper`), `@knitui/carousel` (`Carousel`)
and `@knitui/media` (the audio/video chrome + `LiveAudioMeter`), each now naming
the glyph module it actually uses. An ESLint `no-restricted-imports` guardrail in
`eslint.config.base.mjs` blocks the bare `@knitui/icons` / `@knitui/emoji`
specifier in shipped `src/**` so this cannot regress; stories, tests and the
private `@knitui/demo` galleries (which render the whole registry on purpose) are
exempt.

**Bundler hygiene, same theme:**

- `sideEffects` was missing from `@knitui/media`, `@knitui/sheet` and
  `@knitui/plugins`, so webpack/Next had to keep every module of those packages
  even when nothing referenced it. `media` and `sheet` are declared
  `sideEffects: false` (audited: their only module-scope statements are pure
  const initialisers and a `displayName` assignment — the one
  `registerProcessor()` call in `media` lives inside an AudioWorklet source
  string, not in the module). `plugins` lists just its `babel-plugin` entry,
  which really does mutate `process.env.TAMAGUI_IGNORE_BUNDLE_ERRORS` on load.
- `@knitui/plugins/next-plugin` now sets
  `experimental.optimizePackageImports` for `@knitui/icons`, `@knitui/emoji`,
  `@knitui/components`, `@knitui/dates` and `@knitui/map`, so every Next
  consumer inherits it instead of having to know. Next has to build a barrel's
  full module graph before it can shake it, and `transpilePackages` means it
  compiles the kit's source to do so — with this, a bare-barrel glyph import in
  app code is rewritten to that glyph's own module and the other 6,145 files are
  never compiled. Any `experimental` the app already set is
  merged, not replaced, and its own `optimizePackageImports` entries are kept.
