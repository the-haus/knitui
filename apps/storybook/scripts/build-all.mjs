#!/usr/bin/env node
/**
 * Build the aggregate Storybook for GitHub Pages.
 *
 * Storybook "composition" can't bundle multiple projects into one output, so we
 * assemble it ourselves:
 *   1. Build THIS root manager (the Welcome page + the `refs` sidebar) into
 *      `storybook-static/`.
 *   2. Build each package's own Storybook into `storybook-static/<pkg>/`, using
 *      that package's bespoke `.storybook/` config (Skia, reanimated, providers).
 *
 * The root's relative `refs` (`./components`, `./dates`, …) then resolve against
 * the deployed base, so one Pages deploy serves every package's stories.
 *
 * Order matters: the root build cleans `storybook-static/`, so it must run
 * BEFORE the children are written into its subfolders.
 */
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, "..");
const repoRoot = path.resolve(appDir, "..", "..");
const OUT = path.join(appDir, "storybook-static");

/** Packages that ship a `.storybook/` config. core/hooks/plugins have no stories. */
const PACKAGES = ["components", "dates", "carousel", "graphics", "icons", "map", "media", "sheet"];

const run = (cmd, cwd) => {
  console.log(`\n› ${cmd}\n  (cwd: ${path.relative(repoRoot, cwd) || "."})`);
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
};

console.log(`Cleaning ${OUT}`);
rmSync(OUT, { recursive: true, force: true });

// 0. Build lib-shipping workspace deps. Most @knitui packages src-ship (their
// `main` resolves to `./src/*.ts`), but @knitui/hooks lib-ships — its `main`
// points at `lib/`, which does NOT exist in a fresh checkout/CI. Story source
// imports it (e.g. components/src/internal/motion.ts), so without this the
// Storybook bundler fails with "Rolldown failed to resolve import @knitui/hooks".
// turbo builds it (and its dep chain) and caches the result.
run("pnpm exec turbo run build --filter=@knitui/hooks", repoRoot);

// 1. Root composition manager → storybook-static/
run(`pnpm exec storybook build --output-dir ${JSON.stringify(OUT)}`, appDir);

// 2. Each package's Storybook → storybook-static/<pkg>/
const failed = [];
for (const pkg of PACKAGES) {
  const pkgDir = path.join(repoRoot, "packages", pkg);
  const dest = path.join(OUT, pkg);
  try {
    run(`pnpm exec storybook build --output-dir ${JSON.stringify(dest)}`, pkgDir);
  } catch (err) {
    console.error(`✗ @knitui/${pkg} storybook build failed: ${err.message}`);
    failed.push(pkg);
  }
}

if (failed.length) {
  console.error(`\n✗ Aggregate build finished with failures: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(`\n✅ Aggregate Storybook built at ${OUT}`);
