# CI/CD & Publishing Plan

This document describes how Knit UI is validated, versioned, and published.

## Overview

| Concern            | Tool                                   | Where                          |
| ------------------ | -------------------------------------- | ------------------------------ |
| Task orchestration | Turborepo                              | `turbo.json`                   |
| Package manager    | pnpm workspaces                        | `pnpm-workspace.yaml`          |
| Versioning/publish | Changesets                             | `.changeset/`                  |
| Local git checks   | Git hooks (`core.hooksPath = .husky`)  | `.husky/`                      |
| CI                 | GitHub Actions                         | `.github/workflows/ci.yml`     |
| Release            | GitHub Actions + Changesets            | `.github/workflows/release.yml`|
| Storybook deploy   | GitHub Actions → Pages                 | `.github/workflows/storybook.yml` |
| Visual regression  | GitHub Actions + Playwright            | `.github/workflows/visual-regression.yml` |
| Native builds      | GitHub Actions + EAS Build             | `.github/workflows/eas-build.yml` |
| E2E (native)       | GitHub Actions + Detox                 | `.github/workflows/e2e.yml`    |
| Dependency updates | Dependabot                             | `.github/dependabot.yml`       |
| Node version       | `.nvmrc` / `.node-version` (Node 20)   | repo root                      |

## 1. Continuous Integration (`ci.yml`)

Runs on every push to `main` and every PR. One `verify` job:

1. `pnpm install --frozen-lockfile`
2. `pnpm check:naming` — brand guardrail (fails if the retired pre-`knitui` brand reappears)
3. `pnpm lint` — ESLint across all packages (`turbo run lint`)
4. `pnpm typecheck` — `tsc --noEmit` per package (`turbo run typecheck`)
5. `pnpm test` — Jest per package (`turbo run test`)
6. `pnpm build` — `bob build` per package (`turbo run build`)

Turbo caches by content hash, so unchanged packages are skipped. To speed CI
further, enable **Remote Caching** (Vercel Remote Cache or self-hosted) by
adding `TURBO_TOKEN` / `TURBO_TEAM` secrets.

## 2. Release (`release.yml`) — Changesets flow

Triggered on push to `main`. Uses [`changesets/action`](https://github.com/changesets/action):

- **When unreleased changesets exist** → opens/updates a **"Version Packages"** PR
  that bumps versions and writes changelogs (`pnpm version-packages`).
- **When that PR is merged** → runs `pnpm release` (`turbo run build && changeset publish`)
  and publishes the changed packages to npm.

### Contributor workflow

```bash
# after making a change
pnpm changeset          # pick packages + bump type, write a summary
git add . && git commit # message must be Conventional Commits (enforced)
```

### Fixed version group

`core`, `hooks`, `components`, `icons`, `graphics`, `dates` are a **fixed group**
(`.changeset/config.json`) — they always release together at the same version.

### Not published

`@knitui/example`, `@knitui/web` (apps, `private: true`) and `@knitui/demo`
(showcase, `private: true`) are in the changesets `ignore` list.

## 3. Publishing model (important)

Packages **src-ship**: their `exports`/`main`/`types` resolve to `./src/*.ts`
(TypeScript source), not a compiled `lib/`. This is deliberate — Tamagui's
generic component types do not round-trip through `react-native-builder-bob`
`.d.ts` output (see `docs` / memory `lib-ship-not-viable`).

Consequences for consumers of `@knitui/*`:

- **Expo / Metro** — works out of the box (Metro honors the `source` field).
- **Next.js** — add the scope to `transpilePackages` (the `@knitui/plugins/next`
  plugin does this).
- **Plain Node / webpack without a TS loader** — must transpile `@knitui/*`.

`bob build` still emits `lib/` and `files` includes both `src` and `lib`, so the
model can be flipped to lib-first later without republishing plumbing.

> Decision point before first public release: keep src-ship (document the
> transpile requirement prominently in each README) **or** invest in a
> lib-first build for the packages whose types _do_ round-trip.

## 4. Required repository secrets

| Secret                     | Used by       | Purpose                          |
| -------------------------- | ------------- | -------------------------------- |
| `NPM_TOKEN`                | `release.yml` | `changeset publish` auth to npm  |
| `TURBO_TOKEN` / `TURBO_TEAM`| both (opt.)  | Turbo remote cache               |

npm provenance is enabled (`id-token: write` + `NPM_CONFIG_PROVENANCE`), which
requires a **granular npm automation token** on the `@knitui` org.

## 5. Branch protection (configure in GitHub settings)

- Require the `verify` check to pass before merge to `main`.
- Require the branch to be up to date.
- Require PRs (no direct pushes to `main`).

## 6. Local guardrails (`.husky/`)

- **pre-commit** → `check-naming` + Prettier `--check` on staged files.
- **commit-msg** → Conventional Commits validation.

Hooks are wired via `core.hooksPath` (set by the `prepare` script), so they
activate automatically after `pnpm install`. No `husky` dependency required.

## 7. Roadmap

### Wired

- **Storybook deploy** (`storybook.yml`) — on push to `main` (paths `packages/**`)
  and `workflow_dispatch`, builds the `@knitui/components` Storybook
  (`pnpm --filter @knitui/components build-storybook` → `packages/components/storybook-static`),
  uploads it as a Pages artifact, and a guarded `deploy` job publishes it to
  GitHub Pages. **To fully activate:** enable Pages in **Settings → Pages →
  Source: "GitHub Actions"** (one-time). The other packages with a
  `build-storybook` script (carousel, dates, icons, map, sheet, graphics, media)
  can be added as subdirectories of `storybook-static/` later.
- **Visual regression** (`visual-regression.yml`) — runs on PRs: installs deps,
  provisions Playwright Chromium, builds the component Storybook, and runs
  `pnpm --filter @knitui/components test:visual` against it. The lane is live —
  `packages/components/playwright.config.ts` serves the static Storybook and
  `packages/components/visual/smoke.spec.ts` screenshots representative stories.
  The comparison step is `continue-on-error` and always uploads the Playwright
  report/diffs as an artifact. **To make it enforcing:** generate and commit
  baselines once —
  `pnpm --filter @knitui/components test:visual -- --update-snapshots` — then
  drop `continue-on-error` from the workflow. (Chromatic remains an alternative
  via a `CHROMATIC_PROJECT_TOKEN` secret.)
- **Native app builds** (`eas-build.yml`) — builds `@knitui/example` via EAS on
  `v*` tags and `workflow_dispatch` (platform/profile inputs). Profiles live in
  `apps/app/eas.json` (`development` / `preview` / `production`). A `guard` job
  gates the build on the `EXPO_TOKEN` secret, so unconfigured repos/forks stay
  green. **To activate:** run `eas init` in `apps/app` (writes
  `extra.eas.projectId`) and add the `EXPO_TOKEN` repo secret.
- **E2E** (`e2e.yml`) — Detox iOS lane on `macos-14` (`workflow_dispatch` +
  `pull_request`). Installs `applesimutils` and calls the existing
  `e2e:build:ios` / `e2e:test:ios` scripts (`ios.sim.debug` per `.detoxrc.js`).
  The native steps are gated on the `ENABLE_E2E` repo variable so the lane is
  fast + green until wired. **To activate:** add `apps/app/e2e/*.test.js` specs,
  ensure `expo prebuild` output matches the Detox scheme, and set
  `ENABLE_E2E=true`. Android E2E can follow on an `ubuntu` runner + emulator.
- **Dependency updates** — Dependabot is configured in `.github/dependabot.yml`
  (grouped npm + `github-actions` updates), superseding the earlier Renovate idea.

### Not yet wired

- **Multi-package Storybook site** — publish the remaining packages' Storybooks
  as subdirectories of the Pages site.
- **Android E2E** — a Detox Android lane on an `ubuntu` runner + emulator action.
- **Chromatic** — optional hosted visual review as an alternative to the
  self-hosted Playwright baselines.
