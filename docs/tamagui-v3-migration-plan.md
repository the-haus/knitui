# Tamagui v3 migration plan

> Status: **plan**, not started. Written 2026-10-17 against Tamagui **3.0.18** (released 2026-10-16) and the kit on **2.7.7**.
> Goal: a _v3-native_ Knit UI, not a port that merely compiles. That means idiomatic v3 authoring, best-practice config and **measurably faster** on web and native, with every component verified on web (light and dark), iOS and Android before the release.
> Explicitly **out of scope: Tailwind / `@tamagui/tailwind` / `html.*` + `className` authoring.** v3 makes it opt-in by import, and we stay on the regular prop frontend.

Sources: [v3 blog post](https://tamagui.dev/blog/version-three), the v3 docs MDX (`guides/how-to-upgrade`, `guides/flat-values`, `core/compiler-tiers`, `core/settings`, …), the 3.0.0–3.0.18 release notes and the 3.0.18 package sources. A throwaway spike also bumped this repo to 3.0.18 and measured the breakage; its numbers appear below as _spike_.

---

## 0. TL;DR

- **The move is a full migration.** Bumping to 3.0.18 yields **~4,100 type errors**: components 3,442 (2,141 of them in stories), dates 521, media 93, sheet 25, carousel 24, core 9–12. The core config doesn't even load: `createThemes` crashes, and the `true` and `transparent` token keys are rejected.
- **There is no compatibility mode.** v3 has no runtime path for `$token` values or v2 condition objects (`hoverStyle`, `pressStyle`, `enterStyle`, …). Pseudo objects are _forwarded to the DOM_ instead of applied, so interactions silently stop working.
- **The official codemod converts ~0% of our code.** It only rewrites hosts it can trace to `tamagui`/`@tamagui/*`; everything here goes through `@knitui/core`'s `styled`/`Box`. Spike: 0 of 3,948 `$` literals changed. **We write our own codemod**, and it doubles as the consumer codemod we ship.
- **The biggest structural job is `.styleable()`.** It's gone: 162 sites in 104 files, several chained (`Input → InputBase → TextInput…`). We can do this **on v2 first**, behind a core helper, with green tests.
- **This is a breaking release for consumers.** `$token` props, `hoverStyle` & co. are part of our public prop surface, so every `@knitui/*` package that re-exports Tamagui props takes the breaking bump (see §13 for the version decision).
- **Speed is designed in rather than hoped for.** We establish a v2 perf baseline, convert prop-mapping HOCs into flattenable `styled` + variants / `styled.dynamic` / `.resolve`, turn on the real (now non-no-op) native compiler via `@tamagui/cli/metro`, precompute themes, use CSS-variable theme updates on web, and gate every phase on compiler counters (`TAMAGUI_COMPILER_STATS`) and benchmarks.
- **Order of work:**
  - **Phase 0:** baseline harness on v2.
  - **Phase 1:** v2-compatible prep.
  - **Phase 2:** our codemod.
  - **Phase 3:** core cutover.
  - **Phase 4:** internal style systems.
  - **Phase 5:** components in dependency waves.
  - **Phase 6:** other packages, apps and toolchain.
  - **Phase 7:** speed pass.
  - **Phase 8:** full verification.
  - **Phase 9:** docs, consumer codemod and prerelease.
  - **Phase 10:** stable release.

---

## 1. What v3 changes, and what it means for us

The table below covers only what touches this kit. The `$…` and `…Style` names in the "Our exposure" column are v2 code we must migrate. Values written without `$` are the new v3 form.

| v3 change                                                                                                                       | Our exposure (measured)                                                                                                                                                                                                                                       | Consequence                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$` sigil removed: `p="md"`, `bg="color3"`                                                                                      | ~4,260 double-quoted `"$token"` literals in 290 files (`$md` 743, `$sm` 697, `$xs` 609, `$lg` 296, `$color11` 241, …). Plus 88 in docs MDX                                                                                                                    | Codemod. With `allowedStyleValues: "somewhat-strict-web"`, tsc flags every leftover (spike: _"Type '"$md"' is not assignable to FlatStyleValue…"_), so **tsc is our oracle** |
| Runtime-built token names                                                                                                       | `` `$${x}` `` in Grid, SimpleGrid, RadioIcon, ColorPicker, RollingNumber, Indicator, AngleSlider, Blockquote, Table, floating-arrow, createImage, `style-props.ts:42` (`toRadius`), `control-metrics.ts:113`                                                  | Hand edits. Most helpers become identity functions                                                                                                                           |
| **Sigil _detection_** (`v[0]==='$'`)                                                                                            | `theme-color-web.ts:34` (web gradients and icon colours), `createImage.tsx:198,287` (image sizes), `Indicator.tsx:185`, `control-icon-size.ts:49`, `floating-arrow.tsx:18`, `get-font-size.ts:24,65`, `resolve-theme-color.ts:16`, docs `TokenTables.tsx:132` | **Silent breakage: typecheck stays green.** Replace with one core `resolveToken()` that asks the config/theme whether it knows the name                                      |
| Tokens embedded in compound strings                                                                                             | `shadowVariant` → `"0px 5px 12px 0px $dropShadowColor"` (22 files, 51 hits)                                                                                                                                                                                   | v3 grammar has `embeddedTokens`, which needs verifying. Otherwise move to a theme-resolved `boxShadow` built in `.resolve` / `styled.dynamic`                                |
| Condition objects → flat clauses (`bg="color2 hover:color3"` or `{default, hover}`)                                             | `hoverStyle` 98, `pressStyle` 96, `enterStyle` 53, `exitStyle` 39, `focusVisibleStyle` 13, `focusStyle` 5, plus tables in `variant-colors.ts`, `style-props.ts`, `motion.ts`                                                                                  | Codemod for literals. **Hand rewrite for the tables** (focus ring, variant interaction, press scale, motion recipes)                                                         |
| `.styleable()` removed → `createStyledHOC(Frame, render, opts)`                                                                 | **162 sites / 104 files** (components 139, dates 16) and chained HOCs                                                                                                                                                                                         | Phase 1 helper `styleable()`, migrated on v2                                                                                                                                 |
| Function / spread variants (`":string"`, `":number"`, `"...size"`) no longer match; only `styled.dynamic`-branded functions run | 55 spread-variant functions in 11 files (`radiusVariant`, `squareSizeVariantFallthrough`, `Text.lineClamp`, `control*Variant`)                                                                                                                                | Rewrite as `styled.dynamic<T>(fn)` / named variants. **This is also a speed win**, because the compiler evaluates `styled.dynamic` when props are static                     |
| `usePropsAndStyle` / `useProps` / `useStyle`-as-props removed → `splitStyleProps`                                               | 0 consumers (re-exported only, `essentials.ts:52-57`)                                                                                                                                                                                                         | Drop from `essentials`; export `splitStyleProps` / `getExpandedShorthand`                                                                                                    |
| `staticConfig.accept`, `isInput` and `validStyles` changes                                                                      | `Input/shared.tsx:990,997,1059,1067` (vendored Input `styledBody`), `Group.tsx:59` (`isTamaguiComponent`)                                                                                                                                                     | Re-derive Input on v3 primitives                                                                                                                                             |
| `animateOnly` / transition arrays → `transition={{ preset, properties, enter, exit }}`, `onTransition`                          | `animateOnly` 78–86, `transition=` 97, `TransitionValue` type errors in media                                                                                                                                                                                 | Codemod plus motion-system rework (§6.5)                                                                                                                                     |
| Unified animation presets (same name means same spring on every driver); reanimated `easing` must be a string                   | `animations.native.ts` uses `Easing.bezier(...)` (5 errors)                                                                                                                                                                                                   | Re-tune `motion.ts` (the motion source of truth); timings shift on purpose                                                                                                   |
| `createTamagui` throws on CSS-keyword token names                                                                               | `tokens.color.transparent`                                                                                                                                                                                                                                    | Rename (`clear`) or delete; `transparent` is valid CSS anyway                                                                                                                |
| `$true` removed                                                                                                                 | `true:` keys in space/size/radius/font tokens; `Input/shared.tsx:24`                                                                                                                                                                                          | Delete the keys. Defaults come from `controlMetrics` (already `md`)                                                                                                          |
| `@tamagui/theme-builder` has no 3.x                                                                                             | `themes.ts`, `theme/create-theme.ts`                                                                                                                                                                                                                          | `@tamagui/config-v5/builder` (spike-verified working), plus precomputed static themes (§5.3)                                                                                 |
| `@tamagui/babel-plugin` has no 3.x                                                                                              | `@knitui/plugins/babel-plugin`, `apps/app`                                                                                                                                                                                                                    | Native compilation moves to `@tamagui/cli/metro`                                                                                                                             |
| `@tamagui/native/setup-expo-linear-gradient` removed                                                                            | `Provider.native.tsx`                                                                                                                                                                                                                                         | Our gradient is already ours (`gradient.native.tsx` on react-native-svg); delete the import                                                                                  |
| `defaultFont` only read from `settings`; `autocompleteSpecificTokens` gone                                                      | `config.ts`                                                                                                                                                                                                                                                   | Move or remove                                                                                                                                                               |
| Explicit `undefined` prop = absent (variants and context)                                                                       | Unknown                                                                                                                                                                                                                                                       | Audit places that pass `undefined` to _reset_ a default; v3 needs `null`                                                                                                     |
| `@tamagui/scroll-view` on web no longer via RNW                                                                                 | ScrollArea uses RN `ScrollView` via RNW, not `@tamagui/scroll-view`                                                                                                                                                                                           | No change, but don't adopt it blindly (no momentum events, `snapTo*`)                                                                                                        |
| SafeAreaProvider must wrap TamaguiProvider (for `@tamagui/native/setup-safe-area`)                                              | `apps/app` layout                                                                                                                                                                                                                                             | Verify order                                                                                                                                                                 |

**Not affecting us** (verified, so we don't waste time):

- `focusable` / `fullscreen` / `defaultProps` / `$sm={{}}` media props / `$platform-*` / `$group-*` / `<Theme inverse>` / `onDidAnimate` / Tamagui `Sheet.Frame`. All hits are our own props, media state, test fixtures or `@knitui/sheet`'s own slot.
- Do **not** let any codemod "fix" `Sheet.Frame` (the official one has 7 false positives there).
- `packages/map`, `icons`, `emoji`, `graphics`, `hooks`, `story-runtime` and `apps/web` have no Tamagui style code: dependency bumps only.
- **Codemod hazard:** map's MapLibre `"$type"` expressions (112) and `prefix="$"` in the NumberFormatter and RollingNumber stories must be excluded.

---

## 2. Principles

1. **One chokepoint stays one chokepoint.** Only `@knitui/core` imports `@tamagui/*` (skill rule 1). Phase 1 turns it into a lint rule.
2. **Do the move in two halves.** Everything that can land on v2 lands on v2 first, with green tests and no visual diff. That covers the `styleable()` helper, `resolveToken()`, token-helper centralisation, deleting `$true`, the theme freeze and the harness. The v3 PR is then mostly the codemod plus core.
3. **Typecheck is the inventory.** Strict `allowedStyleValues` makes every missed `$` a TS error. The runtime-only traps (sigil detection, spreads, compound strings, variants keyed by `$`) get explicit grep gates in CI.
4. **The compiler decides speed, so author for it.**
   - Literal component targets, statically analysable values and flat conditions.
   - No dynamic style spreads in leaf components.
   - `styled.dynamic` / `.resolve` / variants instead of HOCs that only map props to styles.
   - `createStyledHOC` only where real behaviour exists, and then always memoized.
5. **No "Tamagui v6 defaults" config swap.** Upstream's own advice is to keep custom design values for the first checkpoint. Our tokens and themes stay ours (`controlMetrics` / variant-colors stay the source of truth).
6. **Measure before and after everything.** No phase merges without the Phase 0 harness green against its v2 baseline (or with diffs triaged and accepted).
7. **Never commit automatically.** Every phase is reviewed and committed by a human. Subagents never run git writes.

---

## 3. Phase 0: v2 baseline harness (build before touching Tamagui)

This is the "test all components" foundation. It must exist and have captured a **v2 baseline** before Phase 3 starts.

### 3.1 Story manifest

- `scripts/visual/collect-stories.mjs`:
  - Rebuilds each package's Storybook. The current `storybook-static` dirs are stale: 992 indexed vs 1,108 in source.
  - Merges every `index.json` into `visual/manifest.json`: about **1,580 stories** `{pkg, id, title, name, tags, file}`.
- `visual/overrides.ts` holds per-story behaviour:
  - `open` steps for overlays
  - `wait` for map idle, fonts and media metadata
  - `mask` for time displays and video frames
  - `serial` for Skia (the ~16 WebGL context cap)
  - `skip` (plus a reason)

### 3.2 Web visual + DOM + a11y spec (Playwright 1.63, already installed)

Extend `packages/components/playwright.config.ts` and `visual/smoke.spec.ts` (5 hard-coded stories today) into a manifest-driven project.

For each story × `{light, dark}` (`&globals=colorScheme:dark`):

1. **PNG** element screenshot of `#storybook-root`:
   - `page.clock` frozen (Marquee, Loader, Skeleton, RollingNumber, carousel autoplay)
   - `animations: "disabled"`
   - tolerance per override
2. **Computed-style snapshot.** Serialise `getComputedStyle` for the root subtree (a whitelist of ~40 properties) to JSON. Diffs in this are far easier to triage than pixels when Tamagui changes CSS extraction.
3. **Accessibility tree snapshot** (`page.accessibility` / aria snapshot) for role, name and state parity.
4. **axe** (`@axe-core/playwright`, new devDep): store violations; _fail only on new ones_.
5. **Console gate.** Fail on `console.error`, on React "does not recognize the `xxxStyle` prop on a DOM element" (the v3 leak signature), on Tamagui `v3 tokens have no "$" prefix` / `was removed in v3` warnings, and on any `StoryErrorBoundary` fallback.
6. **Interaction states** for about 60 stateful stories: hover, press-hold (`mouse.down`), keyboard focus-visible (Tab), disabled. Overlays opened: Popover, Menu, HoverCard, Tooltip, ColorInput, the Combobox family (Select, MultiSelect, Autocomplete, TagsInput, TreeSelect), Modal, Drawer, Dialog, every dates `*PickerInput`, TimePicker, Sheet and the Carousel mid-swipe.

Other harness details:

- Shard across workers.
- Replace the missing `http-server` with Playwright `webServer` + `node:http`.
- Archive baseline artifacts outside git (`visual/baseline-v2/`, git-ignored, tarballed). Commit only the manifest, the specs and the diff tooling.
- Add `pnpm test:visual` (turbo task, not on every PR at first; on the migration branch, every push).

### 3.3 Native screenshots (iOS simulator + Android emulator)

- Add a single-story route: `apps/app/src/app/section/[id].tsx?story=<Name>` renders exactly one story from `getStories()` with `testID="Story.<id>.<name>"`. Deep link: `knitui://section/Button?story=Sizes`.
- Driver: **Maestro** (`openLink`, `waitForAnimationToEnd`, `takeScreenshot`), generated from the same manifest minus web-only stories. Fallback: `xcrun simctl openurl` + `simctl io screenshot`, and `adb shell am start -d` + `adb exec-out screencap -p`.
- Use release builds, a fixed device (iPhone 16 / iOS 26.5, Pixel 8 API 36), font scale 1 and dark plus light.
- Diff with pixelmatch at a looser threshold.
- **Priority set**:
  - the `.native` components and their consumers: Input family, Popover / Combobox family, Modal / Drawer, ScrollArea, Image, Collapse consumers (Accordion, Tree, Spoiler), Transition, Sheet, Carousel, dates pickers
  - everything with press motion (Button, ActionIcon, Chip, …)

### 3.4 Behaviour baseline

- `pnpm test` per package with `--json --coverage`, archived. Today: 123 component suites with 1,517 tests; core has 67 tests.
- Add a jest setup guard that **fails on `console.error`** about unknown DOM props and on Tamagui v3 removal warnings. It does nothing on v2 and catches leaks on v3.

### 3.5 Performance baseline (the "optimized for speed" contract)

Record each of these on v2 and keep the scripts in the repo (`scripts/perf/*`):

| Metric                      | How                                                                                                                                                                                                                    | Why                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Web render / re-render cost | Jest + `@testing-library` + `performance.now` bench. Mount and re-render 300 × Button, 300 × TextInput, 100 × Select (closed), 1 × Table 50 × 10, and the DatePicker month grid. Run 20 iterations and take the median | Covers the hot primitives. The `styled.ts` memo trick measured ~30× on 300-node re-renders, and we must not lose it |
| Web story mount             | Playwright `performance.mark` around story render for the manifest                                                                                                                                                     | Regression net across all components                                                                                |
| Web bundle                  | `apps/web` and `apps/docs` `next build` First Load JS per route; esbuild metafile of the `@knitui/components` barrel (min + gzip)                                                                                      | v3 runtime size and extraction                                                                                      |
| Compiler effectiveness      | `TAMAGUI_COMPILER_STATS_FILE=.tamagui/compiler-stats.json`: found / lowered / flattened / bailed per module (v3 only, so its baseline is the first v3 build)                                                           | Our flattening KPI                                                                                                  |
| Theme switch                | Web: time from colour-scheme toggle to paint (Storybook + Playwright trace). Native: JS-thread time of light→dark on the Demo screen                                                                                   | v3 CSS-var / `optimizeFor` gains                                                                                    |
| Native startup              | Android `adb shell am start -W` TotalTime (cold, ×10); iOS `simctl launch` + first-frame log                                                                                                                           | Config parse + theme build cost                                                                                     |
| Native scroll / interaction | Android `dumpsys gfxinfo` jank % for a scripted fling on the Button, Select and VirtualList sections; Hermes sampling profile of a theme toggle                                                                        | Real-device smoothness                                                                                              |

**Budget:** v3 must be **≤ v2 on every metric**. The targets are −20% on web re-render, a measurable startup win from precomputed themes, and a flattened ratio ≥ 60% of `found` in `@knitui/components` leaves.

**Deliverable:** baseline report `visual/baseline-v2/REPORT.md` with numbers. **Exit criterion:** the harness runs green twice in a row on v2 (no flakes).

---

## 4. Phase 1: v2-compatible preparation (lands on `main`, zero behaviour change)

Each item is a separate PR with the harness diff at zero.

1. **Lint guardrails** (`eslint.config.base.mjs`):
   - `no-restricted-imports` for `tamagui` / `@tamagui/*` outside `packages/core/src`.
   - A custom rule (or `no-restricted-syntax`) banning _new_ `.styleable(`, sigil checks (`[0] === "$"`, `charCodeAt(0) === 36`, `startsWith("$")`) and `` `$${` `` outside core helpers.
2. **`styleable()` helper in core** (`packages/core/src/styled.ts`):
   ```ts
   // v2 body: Frame.styleable(render) + memo flag (today's behaviour)
   // v3 body: React.memo(createStyledHOC(Frame, render, { staticConfig: { memo: true }, displayName }))
   export function styleable<P>(Frame, render: (props: P, ref) => ReactNode, opts?) { … }
   ```
   - Mechanically rewrite all 162 `X.styleable<P>(fn)` call sites to `styleable<P>(X, fn)` with a small ts-morph script.
   - Handle the chained ones (`Input` → `InputBase` → TextInput / Textarea / PasswordInput / NumberInput / MaskInput / TreeSelect; `Overlay` → LoadingOverlay; `Text` → Highlight) first. They must keep working when the _receiver_ is itself a styleable result. On v3 `createStyledHOC` accepts any `{ __tama, staticConfig }`; verify chained typing in the spike before committing to the signature.
   - Keep `withStaticProperties` applied _after_ memo.
   - **Speed audit while touching each site.** Tag every site as **(A) prop→style mapping only** or **(B) real behaviour** (state, refs, context, handlers, children cloning). Record the tag in `docs/v3/styleable-audit.md`. (A) sites become flattenable `styled` + variants / `.resolve` in Phase 5. See §7.
3. **`resolveToken()` / `isToken()` / `tokenName()` in core.** One place that answers "is this a token, and what's its value?" by asking the config (`getConfig().tokensParsed` / theme), with a v2 body that also strips `$`. Replace all eight sigil-detection sites, and route `toRadius`, `resolveSizePx`, `theme-color-web`, `resolve-theme-color` and the createImage size and radius through it. On v3 only the body changes.
4. **Token-string builders** (`` `$${x}` ``): route them through `token(x)` (v2 returns `"$x"`, v3 returns `"x"`). That's 15 sites.
5. **Delete `$true`.** Remove `true:` from space, size, radius and font tokens, `scaleToTokens` and `fonts.ts`. Replace `size: "$true"` (`Input/shared.tsx:24`) with `"$md"`. Remove the `"true"` branch from `get-font-size.ts`.
6. **Rename the `transparent` colour token** → delete it (CSS `transparent` works as a literal) and migrate its uses.
7. **Precompute themes** (also a v2 startup win):
   - `scripts/generate-themes.mjs` runs `createThemes` at build time and writes `packages/core/src/config/themes.generated.ts` (a plain object literal).
   - `themes.ts` imports the literal, so the runtime no longer imports theme-builder for the default theme.
   - `createTheme()` (the public API for custom themes) still builds at runtime, lazily.
8. **Fix pre-existing bugs found in the audit:** the `$colorSubtitle` non-existent key in the Group and Paper stories.
9. **Remove dead `essentials` exports** that v3 drops (`useProps`, `usePropsAndStyle`, `useStyle`, `SizeVariantSpreadFunction`, `VariantSpreadFunction`), after checking consumers (festimap) don't use them.
10. **Remove `fullscreen` / `focusable` confusion.** The kit's own `focusable` props on dates and ColorPicker map to `tabIndex`; keep them as kit API, but rename the internal variable for grep clarity. Optional.
11. **Explicit-`undefined` audit.** Grep for props passed as `undefined` to override a `styled` default or context value, and switch those to `null`-tolerant patterns.
12. **Jest console guard** (§3.4) and **perf scripts** (§3.5) merged.

**Exit criterion:** `main` is still on 2.7.7, all suites are green, the visual diff is 0 and perf is ≥ baseline (the precomputed themes should already show a startup gain).

---

## 5. Phase 2: the kit codemod (`scripts/codemods/tamagui-v3`, later published as `@knitui/codemod`)

ts-morph based, with **report mode first** and transactional writes. It targets JSX and `styled()` / variant literals whose host resolves to **any `@knitui/*` or local `styled(...)` component**. That's exactly where the official codemod gives up.

### 5.1 Transforms

| #   | Transform                                                                                                                                                                                | Notes                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | `"$name"` → `"name"` in style-prop positions (attributes, `styled()` base, variant branches, `slotStyles`/`styles` objects, `style()` pieces)                                            | Only for keys that are Tamagui style props or shorthands. Use a generated list from `@tamagui/web` `validStyles` + our `shorthands.ts`                                                                                    |
| T2  | Variant _keys_ `$md: {}` → `md: {}`, and the matching call-site values                                                                                                                   | Upstream warns that `$`-keyed custom variants typecheck while resolving to nothing                                                                                                                                        |
| T3  | Condition objects → flat clauses: `bg="color2" hoverStyle={{ bg: "color3" }}` → `bg="color2 hover:color3"`                                                                               | Literal base → **string form**. Expression base → **object form** `{ default: expr, hover: "color3" }`. Map `focusVisibleStyle`→`focus-visible:`, `disabledStyle`→`disabled:`, `enterStyle`→`enter:`, `exitStyle`→`exit:` |
| T4  | `transition={["quick", { opacity: "lazy" }]}` → `transition={{ preset: "quick", opacity: "lazy" }}`; `animateOnly={[...]}` → `transition.properties`                                     |                                                                                                                                                                                                                           |
| T5  | Theme keys renamed by v6 that we _also_ use as generated keys (`backgroundHover`, `borderColorFocus`, `placeholderColor`, …)                                                             | **Only if** decision D3 = adopt kebab-case. Default: no-op                                                                                                                                                                |
| T6  | Numeric `lineHeight` semantics                                                                                                                                                           | First verify what our v2 `styleCompat: "web"` meant (unitless ratio vs px). Then choose `--source-semantics`. Our fonts already use px-ish numbers                                                                        |
| T7  | Report (no auto-write): spreads, helper-returned condition objects, module constants holding tokens (`const R = "$6"`), template strings with tokens, `"$…"` inside compound CSS strings | These are the §6 hand rewrites. The report lists them with file:line                                                                                                                                                      |

### 5.2 Exclusions

- `packages/map/**`.
- Any `"$type"` / `"$id"` / `"$…"` key that isn't a known token name.
- `prefix="$"` / `suffix="$"`.
- MDX code fences go through a separate pass (Phase 9).

### 5.3 Validation of the codemod itself

- Golden fixtures (`__fixtures__/in/*.tsx` → `out/*.tsx`) covering every transform and exclusion.
- Run it on all packages in report mode and check that the count of unconverted sites per category matches the audit numbers (±5%).
- Idempotent: a second run produces no diff.

---

## 6. Phase 3: core cutover (branch `tamagui-v3`)

### 6.1 Dependencies

- Bump every `@tamagui/*` to the **same exact 3.0.x**: core, animate-presence, animations-css, animations-reanimated, colors, element, focusable, native, react-native-media-driver, build, metro-plugin, next-plugin, vite-plugin, static, and tamagui-loader (if still needed).
- Add `@tamagui/config-v5` (builder only) and `@tamagui/cli`.
- Remove `@tamagui/theme-builder` and `@tamagui/babel-plugin`.
- **Add `@tamagui/*` to root `pnpm.overrides`.** One copy only (the same lesson as reanimated / react-native duplicates).
- **Use a clean clone outside the repo for measurement.** The spike worktree resolved missing modules to the parent checkout's v2 copies.
- Drop both pnpm patches:
  - `animations-css`: the `host.nodeType` guard. v3 rewrote the site, so add a regression test for the text-node `getComputedStyle` crash instead.
  - `static`: the RNGH proxy. Re-evaluate in Phase 6 with the v3 extractor.

### 6.2 `config/config.ts`, best-practice v3 settings

```ts
createTamagui({
  animations,
  fonts,
  tokens,
  themes,
  shorthands,
  media,
  variables: { focusRingColor: "blue8", focusRingWidth: 2, focusRingOffset: 2 }, // §6.4
  settings: {
    defaultFont: "body", // moved from top level (ignored there in v3)
    allowedStyleValues: "somewhat-strict-web", // keeps tsc as the $-leftover oracle
    styleCompat: "web", // same as 2.7.7 default; explicit
    onlyAllowShorthands: false, // decide later; true would be a 2nd breaking change
    // optimizeFor: leave defaults ('updates' web / 'first-render' native), measure in Phase 7
    // styleValueSyntax: both (default) — string for literals, object for computed (see D2)
  },
});
```

- Remove `autocompleteSpecificTokens`.
- Confirm that the `declare module "@tamagui/core" { interface TamaguiCustomConfig … }` augmentation target is still correct in v3. The `AppConfig` type export in `index.ts` is load-bearing.

### 6.3 Tokens, themes, fonts

- **Tokens.** Keys stay `xxs…xxl` and `0`.
  - Review bare-key ambiguity: `"0"` vs `0`, and `zIndex` `"1"…"5"` vs numbers. A string means a token, a number means a raw value; document this.
  - Qualified lookups (`size.md`) are available for collisions.
- **Themes.**
  - The generator script switches to `@tamagui/config-v5/builder`'s `createThemes` (spike: the same API, loads fine).
  - The runtime imports `themes.generated.ts`.
  - Keep camelCase kit theme keys (D3).
  - The public `createTheme` / `extendTheme` options (`themeBuilder`, `tamagui`, `settings` pass-throughs) must have their types re-pointed. These are **breaking for consumers** and get documented.
  - Fix TS2883: export the named types so `createTheme`'s inferred type is nameable.
- **Fonts.**
  - Remove `true`.
  - Font sizes: v3 treats a raw number as platform-default line height and `"17px"` as exact. Decide on our scale's spelling (T6) and verify against Typography / Text snapshots.
- **`font-units.ts`.** Confirm that the v3 compiler still defines `process.env.TAMAGUI_TARGET`.

### 6.4 Provider and essentials

- **`Provider.shared.tsx`:**
  - Re-validate `activateConfig` (single global config, last writer wins) against v3's `TamaguiProvider`.
  - The default `backgroundColor="background"`.
- **`Provider.native.tsx`:**
  - Remove `setup-expo-linear-gradient`.
  - Keep `setup-gesture-handler` and `setup-teleport` if they still exist at 3.x; check `@tamagui/native` exports.
  - Document the SafeAreaProvider order.
- **`essentials.ts`:**
  - Export `splitStyleProps`, `getExpandedShorthand` and `createStyledHOC` (internal use via `styleable`).
  - Export `ThemeUpdate` (a speed tool, §7) and the `useAnimatedNumber*` hooks if the motion system wants them.
  - Keep `createStyledContext`, `withStaticProperties`, `GetProps`, `TamaguiElement`, `useTheme`, `useThemeName`, `useMedia`, `getTokenValue`, `variableToString` (verify), `createCSSVariable` (verify; used by `theme-color-web`) and `registerFocusable` (verify `@tamagui/focusable` 3.x).
- **`styled.ts`:**
  - The v3 body of `styleable()`.
  - Drop the `staticConfig.memo` mutation on raw frames if v3 handles memo through `createStyledHOC` options (`extendedConfig.memo || TAMAGUI_MEMOIZE_STYLED_HOC`, confirmed in source).

### 6.5 Animations

- `animations.native.ts`: change `Easing.bezier(...)` to string easings (`"cubic-bezier(…)"` / named) and re-express presets as `{ duration, bounce }` springs or CSS strings.
- **Re-derive every motion token in `motion.ts`.** Presets now mean the same spring on every driver, so web and native finally match. That is a design upgrade, but timings shift; snapshot-diff the motion stories.
- `@tamagui/animations-css/extras` is needed only if we use animated numbers (RollingNumber and the Sheet position could adopt `useAnimatedNumber`; optional).

**Exit criterion:** `@knitui/core` typecheck, build and jest are green on v3. `Provider.config.test` is updated for bare token keys.

---

## 7. Speed architecture (applies through Phases 4–7)

What "optimized for speed" means concretely, in priority order:

1. **Flatten the leaves.** Per upstream, a component flattens to one host element only if it is not a `neverFlatten` HOC and doesn't provide a styled context. `createStyledHOC` is _always_ `neverFlatten` (`createStyledHOC.tsx`: `neverFlatten: true`).
   - Therefore every (A)-tagged styleable (pure prop→style mapping: Center, Container, Paper, Kbd, Mark, Code, Separator, Title, Badge, Spacer, AspectRatio, ThemeIcon, Overlay, VisuallyHidden, Skeleton, …) becomes a **plain `styled()` with variants, `styled.dynamic` or `.resolve`**, which the compiler can extract and flatten.
   - Expect most layout and typography primitives to move to the flattenable column.
2. **Compiler-evaluable variants.** Replace the 55 function-spread variants with `styled.dynamic<T>(fn)`. The v3 compiler evaluates these and `.resolve` chains on native **and** web when props are static. It runs per clause, so `size="sm md:lg"` works without runtime cost.
3. **No dynamic style spreads in hot paths.** The variant-colors / focus-ring / press-scale tables today are spread objects, which the compiler bails on. Express them as:
   - **variants with static bodies** (`variant: { filled: { bg: "blue9 hover:blue10 press:blue11" } }`), and
   - **config `variables`** for the focus ring (`focusRingColor`, `focusRingWidth`), so a consumer re-themes the ring with `<ThemeUpdate>` / `createTamagui({ variables })` instead of prop drilling.
4. **Theme changes without re-render on web.** `ThemeUpdate` restyles via CSS custom properties. Use it for local overrides that today mount `<Theme name="red">` (the error states in Radio, Checkbox, Input, InlineControl), where semantics allow. Keep `<Theme name>` where whole sub-themes are needed (Tooltip, Modal, Popover, Sheet, Avatar, Menu).
5. **The native compiler, for real.** v2's native compiler was effectively a no-op for us. v3's native compiler hoists static layout and colours, and a dynamic value no longer drags the whole component to runtime.
   - Wire `@tamagui/cli/metro` `withTamagui` into `@knitui/plugins/metro`.
   - Measure startup and render with the compiler on and off.
6. **Precomputed themes** (Phase 1) remove theme-builder work from startup on every platform.
7. **`optimizeFor`.** Keep the defaults (`updates` on web, `first-render` on native). Benchmark `first-render` on web for SSR'd docs pages and `updates` on native for theme-toggle-heavy screens; switch only if the numbers say so.
8. **Compiled global CSS tier** for `apps/docs` / `apps/web`: `outputCSS` artifact loaded once, which removes runtime CSS generation for config-static styles.
9. **Memo where HOCs remain.** Every `createStyledHOC` goes through `styleable()`, which memoizes (this keeps the ~30× re-render win).
10. **Avoid compiler deopts.**
    - The JSX / function `render` prop deopts; string `render="button"` doesn't. Keep `render` strings in leaves (we have 56 `render=` uses; audit them).
    - Keep values free of `${cond ? undefined : "1"}` templates, which produce the string `"undefined"`.
11. **Later, behind flags (Phase 7 evaluation only):**
    - `experimental.nativeFastPath` + `@tamagui/native-registry` (Nitro C++, theme updates via Fabric without React re-render; RN ≥ 0.82 New Arch, we're 0.86 New Arch).
    - Web `experimental.zeroRuntime: "report"`, as an _audit_ of what still needs the runtime. Not enforcing it.

**KPIs per package** (CI after Phase 7):

- compiler `flattened / found` ratio
- `bailed` codes histogram trending down
- the §3.5 benchmarks ≤ budget

---

## 8. Phase 4: internal style systems (hand rewrites, before components)

These are the shared engines that ~every component spreads. Each gets dedicated tests, and the harness diff is reviewed for the Styles stories.

| System                    | File(s)                                                                                                                                                                            | v3 rewrite                                                                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sizing                    | `internal/control-metrics.ts` (+ `controlVariant`, `controlFontVariant`, `controlGapVariant`)                                                                                      | Bare keys. Variants become static `size: { xs: {...}, …, xl: {...} }` bodies generated from the table (static, so they extract), or `styled.dynamic`. `resolveSizePx` → `resolveToken`                     |
| Colour variants           | `internal/variant-colors.ts` (`VARIANT_FILL`, `VARIANT_FOREGROUND_*`, `VARIANT_INTERACTION`), `style-props.ts:319-332` `controlColorVariant`                                       | Flat clauses inside variant bodies: `bg: "color9 hover:color10 press:color11"`. Keep the colour twin of `controlMetrics` as the single source of truth and generate the variant bodies                     |
| Focus ring                | `FOCUS_RING`, `focusRingStyle` (22 files / 54 spreads; Switch, Checkbox direct)                                                                                                    | `outlineColor: "focus-visible:$focusRingColor"`-style clauses driven by config **variables**. Keep the two-layer focus contract and the guardrail test (`focus-ring.test.tsx`) that the frame is focusable |
| Press motion              | `pressScaleStyle` (8 files / 17), `usePressScale`                                                                                                                                  | `scale: "press:0.97"`. Verify the precedence-tier change: v2 deep-merged base `pressStyle` with variant `pressStyle`, while v3 is clause-ranked (state > media; tier 1 variants < tier 3 call site)        |
| Shadows                   | `shadowVariant` (22 files / 51) compound strings with `$dropShadowColor`                                                                                                           | Verify v3 `embeddedTokens` resolves `dropShadowColor` inside `boxShadow` strings on web **and** native. If not, use `styled.dynamic` with `env.theme` to build the string                                  |
| Radius / gutters          | `toRadius`, `toGutterToken`, `toSpacingToken`, `squareToken`, `radiusVariant`, `squareSizeVariantFallthrough`                                                                      | These collapse to identity / `styled.dynamic`. Delete the dead helpers                                                                                                                                     |
| Gradient                  | `gradient-shared.ts` (`DEFAULT_FROM="$color5"`), `gradient.native.tsx`, `theme-color-web.ts`                                                                                       | Bare defaults. `theme-color-web` uses `resolveToken` + `createCSSVariable` (verify the hashing is unchanged)                                                                                               |
| Motion recipes            | `internal/motion.ts` (128–255, 410, 449), `useMotionPreset` (10 files / 29), the media overlays' `enterStyle={motion.enterStyle}`                                                  | Recipes return v3 `transition` objects plus `enter:` / `exit:` clause props. `onTransition` replaces any completion hacks                                                                                  |
| Overlay transition engine | Popover / Tooltip / HoverCard `useOverlayTransition`, `Transition/*` (.native ×3)                                                                                                  | Re-verify "animate OUT first", AnimatePresence `custom` (enterVariant / exitVariant gone) and the exit-completion bugs fixed in 3.0.x (#4239, #4233)                                                       |
| Height transition engine  | `CollapseBox` (+ native hand-rolled reanimated clip)                                                                                                                               | Mostly reanimated; check the Tamagui transition shape                                                                                                                                                      |
| Looping / reveal          | `use-looping-animation(.native)`, `use-reveal-pulse`                                                                                                                               | The `asLoopHost` Animated host stays; only the style props change                                                                                                                                          |
| Vendored Input            | `Input/shared.tsx` `styledBody` (`isInput`, `accept`, `validStyles: Text.staticConfig.validStyles`, `TAMAGUI_HEADLESS`), `Input.native.tsx` (`InputHostStyle = styled(TextInput)`) | Re-derive from the v3 `@tamagui/web` input pattern (study `tamagui/src/components/Input.tsx` 3.0.18). `accept` is removed, so placeholder / selection colours go through clauses or `.resolve`             |
| Group detection           | `Group.tsx:59` (`"staticConfig" in type`)                                                                                                                                          | Still present in v3 (`out.staticConfig = …`); verify                                                                                                                                                       |

---

## 9. Phase 5: components, in dependency waves

Run the codemod (T1–T4) per wave, then hand-fix the T7 report items. Per wave: typecheck, jest, visual + DOM + a11y diff, native screenshots for the priority set, perf bench.

For each, the work is: styleable conversion type (A = flatten to `styled`, B = keep HOC), token and pseudo rewrite, tests.
`s` = styleable sites, `t` = `$` literals (src + stories), `p` = pseudo-style hits, **N** = has a `.native` split.

**Wave 1: primitives (everything else spreads these).**

- Box (t72), Stack (t112), Flex (s1 t87), Group (s1 t35), Center, Container, Spacer (t94), Grid (s2), SimpleGrid, AspectRatio, Paper.
- Text (t15), Paragraph, Title, Typography, Code, Kbd, Mark, Highlight (chained on Text), Anchor, Blockquote.
- Separator, VisuallyHidden, Portal (react-native-teleport), Overlay (chained base), UnstyledButton (p7).

**Wave 2: controls.**

- Button (s2 p3), ActionIcon, CloseButton, CopyButton, FileButton **N**, Burger, Chip (p13).
- Badge, Pill, ThemeIcon, Avatar (s2), Indicator (sigil!), ColorSwatch.
- Loader, Skeleton, Progress (s3), RollingNumber, Rating, Switch, Checkbox (s5), Radio (s4), SegmentedControl, Slider (s2), AngleSlider.

**Wave 3: inputs (the chained-HOC tree).**

- Input **N** (s8), InputBase, TextInput, Textarea, PasswordInput, NumberInput, MaskInput, PinInput.
- Fieldset, FileInput, PillsInput, NativeSelect **N**, ColorPicker, ColorInput.

**Wave 4: floating and overlays (the highest-risk chain).**

- floating engine (`floating/*`, **N**), Transition **N**, Collapse, Popover **N**, Tooltip, HoverCard, Menu (s4).
- Combobox (s6, t178) → Select, MultiSelect, Autocomplete, TagsInput, TreeSelect.
- Modal **N** (+ drag-dismiss primitive), Drawer, Dialog, FocusTrap, Affix, LoadingOverlay (chained on Overlay).

**Wave 5: data display and navigation.**

- Image **N** (createImage factory, s5, sigil), BackgroundImage, Card, List, Table (s7, factory), Tree, VirtualList, Marquee, NumberFormatter.
- Accordion (s3 p8), Tabs (s4 p6), NavLink (p6), Breadcrumbs, Pagination (s4 t102), Stepper, TableOfContents, ScrollArea **N** (reanimated thumbs).
- Alert, Notification, Spoiler, KeyboardAvoidingView **N**, KeyboardAwareScrollView **N**.

**Wave 6: other packages.**

- **dates** (521 errors; 16 styleables): Calendar, CalendarHeader, Day, Month, MonthsList, YearsList, the levels and level groups, WeekdaysRow, PickerControl, MiniCalendar, the TimeGrid family, TimePresetGroup, SpinInput, AmPmInput, TimeInput / TimePicker / TimeValue, DatesProvider, HiddenDatesInput, the DatePicker / DateInput / DatePickerInput / Month / Year pickers and inputs, DateTimePicker, InlineDateTimePicker (add a test and a story; it has neither).
- **media** (93): Video chrome / overlays (`TransitionValue` → `TransitionProp`), Audio, AudioPlaylist, AudioRecorder, LiveAudioMeter, AudioSpectrum. Note: needs `<MediaProvider>`.
- **sheet** (25): Sheet + chrome slots, the RNGH Pan.
- **carousel** (24): Carousel + SwipeDeck, the `StyleProps` vs `StyleProp` web typing.
- **graphics, icons, emoji, mediaquery, hooks, map, story-runtime:** dependency bump + typecheck + harness only.

**Per-component definition of done** (in the tracker, `docs/v3/tracker.md`):

- [ ] typecheck 0 errors, no `as any` added
- [ ] no `$` / `xxxStyle` / `animateOnly` left (CI grep)
- [ ] styleable classified (A or B); (A) flattens per compiler stats
- [ ] jest green; tests assert the _v3_ CSS classes / host elements; ≥ 80% statements (the existing loop target)
- [ ] web visual diff light and dark: zero, or each diff triaged as an "intended v3 change" with a note
- [ ] computed-style diff reviewed; aria snapshot identical; no new axe violations
- [ ] interaction states (hover / press / focus-visible / disabled / open) verified
- [ ] all sizes xs…xl and all variants (`filled` / `light` / `outline` / `subtle` / `transparent` / `white` / `default` / `gradient`) covered by the Styles story
- [ ] native iOS and Android screenshot parity (priority set) and manual smoke of gestures and keyboard
- [ ] perf bench ≤ v2
- [ ] docs page and examples updated

**Parallelism.** Once Phases 3 and 4 land, waves 1–2 are serial (shared base), and within waves 3–6 components are independent and can be fanned out to agents per component group (no git writes; the human reviews per wave).

---

## 10. Phase 6: toolchain, apps, docs pipeline

- **`@knitui/plugins`:**
  - **metro**: `@tamagui/cli/metro` `withTamagui` (peer metro ≥ 0.84.4 < 0.88). Add a cache-bust note: config edits need `expo start -c` / `rm -rf node_modules/.cache/tamagui`.
  - **babel-plugin entry**: deprecate it. It becomes a no-op that warns and points to metro. Remove it from `apps/app/babel.config.js` and the direct `@tamagui/babel-plugin` pin.
  - **vite**: `@tamagui/cli/vite` `tamaguiPlugin` (ESM-only, peer vite ^8). **Add it to the package Storybooks**, which don't use the compiler today. We want Storybook to exercise extraction, and `TAMAGUI_COMPILER_STATS` comes from the vite build.
  - **next**: `@tamagui/next-plugin` 3.x is the webpack adapter. Keep `--webpack` (upstream tests Next 16.2 with it). Evaluate `tamagui build --target web` + `outputCSS` for the Turbopack route later.
  - **webpack**: drop `tamagui-loader` if unused after the next-plugin move.
  - **`next.tsx`**: verify that `config.getCSS({ exclude: "design-system" })` exists in v3.
- **`tamagui.build.ts`** at each app / Storybook: `config: "@knitui/core/config"`, `components: ["@knitui/components", "@knitui/core", "@knitui/dates", …]`. The v3 loader defaults to `tamagui`, so this must be explicit.
- **`tamagui check --strict` in CI.** It needs the `.tamagui/tamagui.config.json` artifact, generated in CI.
- **Jest:**
  - `@tamagui/core` 3 is `type: module` with `browser` / `import` → `.mjs`.
  - Set `testEnvironmentOptions.customExportConditions` (or `moduleNameMapper` to the cjs entry) and keep `transformIgnorePatterns` allowing `@tamagui`.
  - Evaluate `@tamagui/core/native-test` for a _native-path_ jest project. Today no test exercises a `.native` file, and v3 is the moment to fix that.
- **Docs pipeline:**
  - `scripts/docs/build-props.mjs:134` classifies style props by `/@tamagui/` in the declaration path, so re-point it to v3 type locations (`@tamagui/web`).
  - Lines 102 and 358 hold the `withStaticProperties` / variant-type shape assumptions.
  - Rebuild `lib` first (per the docs-props memory).
  - `build-tokens.mjs` must keep reading `scales.ts`, `tokens.ts`, `motion.ts` and `control-metrics.ts`.
- **Apps:**
  - `apps/app/_layout.tsx` and `index.tsx`, `demo/DemoScreen.tsx` and `IconsSection.tsx` read `theme.X?.val` (still valid). Prefer `.get()` on web where a CSS var is fine.
  - Regenerate `sections.generated.tsx`.
- **festimap** (first external consumer): a dry run of `@knitui/codemod` against it before the prerelease (see `docs/FESTIMAP_REQUESTS.md`).
- **LSP (optional, DX):** `@tamagui/lsp` binary, with token hover and clause completion. Its npm version still looked like 2.7.7 at research time; check before recommending it.

---

## 11. Phase 7: speed pass

With everything compiling on v3:

1. Collect `TAMAGUI_COMPILER_STATS=verbose` for every Storybook build and `apps/web`. Rank modules by `bailed`, fix the top bailout codes (dynamic spreads, unresolved targets, function `render`) and re-convert any (A) styleables that are still HOCs.
2. Rerun all §3.5 benchmarks against the v2 baseline and publish `docs/v3/perf-report.md`.
3. Experiments, each behind a flag with go/no-go on numbers:
   - **E1** `optimizeFor: "first-render"` on web (docs SSR) and `"updates"` on native.
   - **E2** `outputCSS` compiled-global-CSS tier in `apps/docs`.
   - **E3** `experimental.nativeFastPath` + `@tamagui/native-registry` (Nitro) in `apps/app`. Measure theme toggle and startup. Beta, so ship it only as an opt-in documented for consumers.
   - **E4** `ThemeUpdate` in place of `<Theme name="red">` for error states (re-render counts via React Profiler).
   - **E5** `zeroRuntime: "report"` on the docs entry: an audit list only.
4. Lock in the CI perf budget: a bench job on the migration branch, then on `main`, that fails on > 5% regression.

---

## 12. Phase 8: full verification ("test all components")

Run the complete harness on the finished branch:

- **Web:** ~1,580 stories × 2 schemes: pixel + computed-style + aria + axe + console gate, plus ~60 interaction / open-state flows. Every diff is triaged into _bug_ (fix) or _intended v3 change_ (accept with a note in `docs/v3/visual-changes.md`). Expect intended changes from the unified motion presets and v3 clause precedence (state > media).
- **Native:** the priority set on iOS and Android (release builds), plus full-section screenshots of all 175 demo sections. A manual pass of gestures (Sheet, Carousel, Modal drag-dismiss, ScrollArea thumbs, Slider), keyboard (Input family, Combobox `keyboardShouldPersistTaps`, readOnly press trigger, dates time entry) and the media lock screen.
- **Jest:** all packages green, plus the new native-path project. Coverage ≥ v2 per component.
- **Docs:** `next build` static export passes all CI checks (coverage, live-highlight, produced pages, CF budget), plus a Playwright crawl of `out/` failing on console errors or error boundaries.
- **SSR:** `apps/web` and `apps/docs` hydrate without mismatch warnings (the theme CSS vars and the `inverse`-style sub-themes).
- **Consumers:** festimap builds and runs on the prerelease after `@knitui/codemod --write`.
- **Perf:** every §3.5 budget is met.
- **Regression guards that stay in CI permanently:**
  - grep / lint: no `"$token"`, no `xxxStyle` props, no sigil checks, no `animateOnly`
  - jest console guard
  - the compiler-stats ratio floor

---

## 13. Phase 9: docs, consumer migration and prerelease

- **Docs** (30 MDX files, 88 `$` hits, plus all live examples via stories):
  - Rewrite `getting-started/typescript.mdx` (token unions), `quickstart.mdx`, `foundations/tokens.mdx`, `api/style-props.mdx` (flat clauses replace `hoverStyle` and the responsive object), `foundations/styled.mdx` (`styled.dynamic`, `.resolve`, `styleable()`), `color-and-themes.mdx`, `guides/theming-an-app.mdx` (`variables`, `ThemeUpdate`), `variants-and-colors.mdx`, `elevation.mdx`, `migrating-from-mantine.mdx`, `troubleshooting.mdx`, `vite.mdx` (`TAMAGUI_IGNORE_BUNDLE_ERRORS`, the new plugins).
  - Fix `TokenTables.tsx` (the sigil check).
- **New page:** `guides/upgrading-to-tamagui-v3.mdx`. Before / after table, codemod usage, removed APIs, behaviour changes (motion timings, precedence, explicit `undefined`), toolchain changes (babel → metro plugin) and SafeAreaProvider order.
- **`@knitui/codemod`:** publish the Phase 2 codemod (`npx @knitui/codemod v3 --report r.md ./src`, then `--write`).
- **Changesets:** major changesets for core, components, dates, media, carousel, sheet and plugins; patch / minor for packages that only bump deps. Use **pre mode** (`changeset pre enter next`) → `x.y.0-next.N` on the `next` dist-tag.
- **Pilot:** festimap on `next`, fix feedback, then repeat.

## 14. Phase 10: stable release

- Exit pre mode, run the version PR (version-packages builds before docs:generate, per the release memory), publish, and deploy docs.
- Watch the Tamagui 3.0.x patch stream. Pin an exact version and bump deliberately: 18 patches landed in the first week.

---

## 15. Decisions to make (recommendation first)

| #   | Decision                           | Recommendation                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Release version                    | Ship as **`1.0.0`** for all Tamagui-facing packages. A full public-prop-syntax break plus a "mature v3 kit" milestone justifies leaving 0.x. Alternative: next 0.x minor (semver-legal, but undersells the break)                                                                             |
| D2  | Flat-value syntax                  | **Both forms enabled.** String form in literals, JSX and variant bodies (canonical, compiler-friendly, matches upstream docs); object form only for computed values. Lint rule to enforce this. Don't restrict `styleValueSyntax` (restricting to one form would be a second breaking change) |
| D3  | Theme key casing                   | **Keep our camelCase / numbered keys** (`color11`, `blue9`, `dropShadowColor`, `mediaScrim`). Adopting v6 kebab-case doubles consumer churn for no runtime gain. Revisit in a later major if we adopt `@tamagui/config` v6 tooling                                                            |
| D4  | Consumer transition shim           | **No runtime shim** for `$` or `hoverStyle`. Upstream refuses one deliberately, it would block flattening, and the codemod covers consumers. Ship strong dev warnings instead (v3 already warns)                                                                                              |
| D5  | `onlyAllowShorthands`              | Leave `false`; revisit after 1.0                                                                                                                                                                                                                                                              |
| D6  | Native fast path / native-registry | Evaluate in Phase 7 only; document as an opt-in. Not on by default while upstream calls it beta                                                                                                                                                                                               |
| D7  | Branching                          | Phase 0–1 on `main` (small PRs). Phase 3+ on a long-lived `tamagui-v3` branch, merged per wave into it, rebased on `main` weekly. `main` keeps shipping v2 patches                                                                                                                            |

---

## 16. Risks and mitigations

| Risk                                                                                                                                                   | Mitigation                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Silent runtime breakage that typechecks (sigil checks, spreads, `$`-keyed variants, compound strings, `"undefined"` templates, forwarded pseudo props) | Phase 1 `resolveToken`; CI greps; jest console guard; computed-style diffs; axe + aria snapshots                    |
| Chained `createStyledHOC` typing explodes (the spike saw ~900 implicit-any as a cascade)                                                               | Prove the `styleable()` signature on the Input→InputBase→TextInput chain in the spike _before_ the 162-site rewrite |
| Overlay / Adapt-style exit lifecycles regress (Popover, Combobox, Modal)                                                                               | Open-state visual flows; `onTransition` tests; 3.0.x has exit fixes, so pin ≥ 3.0.18                                |
| Native-only regressions invisible to jsdom                                                                                                             | Native screenshot harness + the new native-path jest project + manual gesture / keyboard checklist                  |
| Upstream churn (3.0.x weekly patches)                                                                                                                  | Pin exactly; single override; re-run the harness on each bump                                                       |
| Perf regressions from v3 runtime changes                                                                                                               | §3.5 baseline + budgets in CI; Phase 7 dedicated pass                                                               |
| Metro stale cache confusion                                                                                                                            | Documented `-c` + cache dir wipe in the plugins README and troubleshooting docs                                     |
| Docs props tables bloat from moved type paths                                                                                                          | Re-point the build-props classifier; compare props counts against v2 (the 3147-vs-8477 lesson)                      |
| Consumer breakage (festimap and others)                                                                                                                | `@knitui/codemod`, migration guide, `next` prerelease pilot                                                         |

---

## 17. Effort estimate (one engineer, with agent help on the mechanical parts)

| Phase                                                                                 | Estimate        |
| ------------------------------------------------------------------------------------- | --------------- |
| 0: harness + baselines (web, native, perf)                                            | 5–7 days        |
| 1: v2 prep (styleable helper + 162 sites, resolveToken, `$true`, themes freeze, lint) | 4–5 days        |
| 2: codemod + fixtures                                                                 | 3–4 days        |
| 3: core cutover                                                                       | 2–3 days        |
| 4: internal style systems                                                             | 4–6 days        |
| 5: components waves 1–5                                                               | 8–12 days       |
| 6: dates / media / sheet / carousel + toolchain + docs pipeline                       | 4–6 days        |
| 7: speed pass                                                                         | 3–5 days        |
| 8: full verification + triage                                                         | 3–5 days        |
| 9–10: docs, codemod publish, prerelease pilot, release                                | 3–4 days        |
| **Total**                                                                             | **~7–10 weeks** |

---

## Appendix A: spike facts (3.0.18 bump, uncommitted throwaway worktree)

- Install works once both tamagui pnpm patches are dropped.
- Missing at 3.x: `@tamagui/theme-builder` (use `@tamagui/config-v5/builder`) and `@tamagui/babel-plugin`.
- Removed subpath: `@tamagui/native/setup-expo-linear-gradient`.
- Core: missing `useProps`, `usePropsAndStyle`, `SizeVariantSpreadFunction`, `VariantSpreadFunction`; the reanimated `easing` must be a string; `createThemes` crashes until moved to config-v5; `true` and `transparent` token keys are rejected.
- **Core jest after 3 fixes:** 66 of 67 pass. The one failure is token keys now `probe` instead of `$probe`.
- **Components jest with a `.styleable` → `createStyledHOC` shim:** 1,479 of 1,517 pass.
  - 26 suites fail to load on chained styleables.
  - The rest are style-class assertions: `$md` doesn't resolve, and v3 leaks `focusStyle` / `pressStyle` to the DOM.
- **Error buckets in components (3,442):**
  - 2,058 `$`-token vs `FlatStyleValue`
  - 886 implicit-any (cascade from `.styleable`)
  - 135 TS2339 (`styleable` ×126)
  - 77 `'string'` → `'undefined'`
  - 59 IntrinsicAttributes
  - 31 `hoverStyle` not in variant type
- `tamagui check` needs a `tamagui.config` plus `components` set explicitly (the loader defaults to the `tamagui` package).
- `tamagui migrate --from v2` writes nothing; it prints an agent checklist.

## Appendix B: v3 API cheat-sheet for kit authors

```tsx
// tokens: bare. string = token, number = raw px
<Box p="md" bg="color2" borderRadius="sm" w={120} />

// conditions: one value per property
<Box bg="color2 hover:color3 press:color4 dark:color1" p="sm md:lg" opacity="enter:0 exit:0" />
<Box bg={{ default: dynamicColor, hover: "color3" }} />

// transitions
<Box transition={{ preset: "fast", properties: "transform, opacity" }} onTransition={(e) => {}} />

// variants → static bodies or styled.dynamic
const Frame = styled(Box, {
  variants: {
    size: styled.dynamic<ControlSize>((size, env) => ({ height: CONTROL[size].height, px: CONTROL[size].px })),
    variant: { filled: { bg: "blue9 hover:blue10 press:blue11", c: "white" } },
  } as const,
})

// prop-derived styles without a HOC (stays flattenable)
const Square = Frame.resolve((p) => ({ width: p.size, height: p.size }))

// behaviour HOC (neverFlatten) — always via the kit helper
export const Button = styleable<ButtonProps>(ButtonFrame, (props, ref) => { … })

// split style props in behaviour components
const [styleProps, rest] = splitStyleProps(props, { expandShorthands: true })

// local theme override without re-render on web
<ThemeUpdate focusRingColor="red8">…</ThemeUpdate>
```
