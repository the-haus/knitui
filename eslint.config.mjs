/**
 * Root ESLint config — applies the shared base to any files at the repo root
 * (scripts, configs, etc.) that aren't inside a workspace.
 *
 * Each workspace under `packages/*` and `apps/*` has its own `eslint.config.mjs`
 * that extends the same base via `defineConfig()`. To change rules for everyone,
 * edit `eslint.config.base.mjs`; to change one package, edit that package's config.
 */
export { default } from "./eslint.config.base.mjs";
