#!/usr/bin/env node
/**
 * generate.mjs
 * ------------
 * Runs the docs generators in dependency order. `apps/docs` calls this before
 * `next dev` / `next build`, and CI re-runs it to verify the committed output in
 * `apps/docs/src/generated/` is not stale (see `check-coverage.mjs`).
 *
 *   registry  parse every *.stories.tsx  -> registry.json, story-sources.json,
 *                                           story-modules.ts
 *   props     resolve component prop types -> props.json
 *   nav       registry + nav.config.mjs   -> nav.json, routes.json
 *
 * Usage: node scripts/docs/generate.mjs [--only=registry,nav]
 */
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");

/**
 * Ordered. `props`, `nav` and `exports` all read `registry.json`, and `exports`
 * also reads `hooks.json`, so `content` (which indexes the MDX tree) runs last.
 */
const STEPS = [
  ["registry", "build-registry.mjs"],
  ["props", "build-props.mjs"],
  ["hooks", "build-hooks.mjs"],
  ["tokens", "build-tokens.mjs"],
  ["exports", "build-exports.mjs"],
  ["changelog", "build-changelog.mjs"],
  ["nav", "build-nav.mjs"],
  ["content", "build-content.mjs"],
];

const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",")) : null;

for (const [name, script] of STEPS) {
  if (only && !only.has(name)) continue;
  execFileSync(process.execPath, [join(SCRIPT_DIR, script)], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
}
