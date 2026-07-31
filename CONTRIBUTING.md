# Contributing to Knit UI

Thanks for helping build Knit UI! This guide covers the local workflow, the
conventions the repo enforces, and how releases are cut.

## Prerequisites

- **Node** ≥ 20
- **pnpm** 10 (the repo pins `packageManager: pnpm@10.30.0` — run
  `corepack enable` to get the right version automatically)

```sh
pnpm install
```

Installing also wires the git hooks via `core.hooksPath = .husky` (the root
`prepare` script) — no `husky` dependency required.

## Monorepo layout

- `packages/*` — the published `@knitui/*` libraries + the internal `@knitui/demo` showcase.
- `apps/app` — the Expo example (`@knitui/example`).
- `apps/web` — the Next.js showcase (`@knitui/web`).
- `apps/docs` — the documentation site, [knitui.dev](https://knitui.dev) (`@knitui/docs`).
- `apps/storybook` — the aggregate Storybook composing every package's stories.
- `docs/*` — architecture notes and plans.

Tasks are orchestrated with Turborepo; run everything from the repo root.

## Everyday commands

```sh
pnpm build            # build all packages (excludes the heavy docs app)
pnpm typecheck        # tsc --noEmit per package
pnpm lint             # ESLint across all packages
pnpm lint:fix         # …with --fix
pnpm test             # Jest per package
pnpm format           # Prettier --write
pnpm check:naming     # brand guardrail (see below)

pnpm start            # Expo example (ios / android / web variants available)
pnpm next             # Next.js showcase
pnpm docs             # documentation site on :3001
pnpm docs:build       # …and its full static export + search index
```

Per-package Storybooks: `pnpm --filter @knitui/<pkg> storybook`.

## Conventions the repo enforces

### Conventional Commits

Commit messages are validated in the `commit-msg` hook. Use the
[Conventional Commits](https://www.conventionalcommits.org) format:

```
feat(components): add Stepper
fix(dates): clamp time entry on group blur
docs(readme): document theming
chore(deps): bump reanimated
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`.

### Naming guardrail

`scripts/check-naming.mjs` (run via `pnpm check:naming`) fails if the retired
pre-`knitui` brand reappears anywhere in the tree. It runs in the `pre-commit`
hook and in CI. Everything public is scoped `@knitui/*`.

### Formatting & lint

The `pre-commit` hook runs `check-naming` + Prettier `--check` on staged files.
Keep new code lint-clean; each package lints with `eslint .`.

### Src-ship model

Packages ship their TypeScript **source** — `exports`/`main`/`types` resolve to
`./src/*.ts`, not a compiled `lib/`. This is deliberate (Tamagui's generic
component types don't round-trip through generated `.d.ts`; see
[Architecture › src-shipping](https://knitui.dev/docs/architecture#src-shipping)). When adding a package, follow the
same `source`/`react-native` → `src` convention and add the scope to any Next.js
`transpilePackages` list (the `@knitui/plugins/next-plugin` wrapper handles this
for consumers).

## Making a change

1. Branch off `main`.
2. Make your change; add/update tests and stories.
3. Run `pnpm lint && pnpm typecheck && pnpm test` locally.
4. **Add a changeset** describing the change and picking the bump:

   ```sh
   pnpm changeset
   ```

   `core`, `hooks`, `components`, `icons`, `graphics`, and `dates` are a **fixed
   version group** — they always release together at the same version, so a
   changeset touching any of them bumps them all.

   Apps (`@knitui/example`, `@knitui/web`) and `@knitui/demo` are private and are
   in the changesets `ignore` list — they don't need changesets.

5. Commit (Conventional Commits) and open a PR. CI must pass (`verify` job: naming
   → lint → typecheck → test → build).

## Releasing (maintainers)

Releases are automated with [Changesets](https://github.com/changesets/changesets)
via `.github/workflows/release.yml`:

- Merged changesets open/update a **"Version Packages"** PR that bumps versions,
  writes changelogs, and refreshes `apps/docs/src/generated/**` (the docs site
  reads the changelogs, so the version PR has to carry the regenerated data or
  the docs guardrail fails on the merge commit).
- Merging that PR runs `pnpm release` (`pnpm build && changeset publish`) and
  publishes the changed packages to npm with provenance.
- A successful publish then deploys the docs site to
  [knitui.dev](https://knitui.dev) — see
  [`apps/docs/README.md`](apps/docs/README.md#deploy). Pushes to `main` that do
  not publish only build and verify the site.

Full details — required secrets, branch protection, and the roadmap — live in
[`.github/workflows/`](.github/workflows).
</content>
