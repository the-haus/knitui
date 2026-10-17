#!/usr/bin/env node
/**
 * Build every package Storybook into its `storybook-static` and merge the
 * resulting `index.json` files into `visual/manifest.json`.
 *
 *   node scripts/visual/collect-stories.mjs                # build all + merge
 *   node scripts/visual/collect-stories.mjs --no-build     # merge existing builds only
 *   node scripts/visual/collect-stories.mjs --only=components,dates   # build only these (merge all built)
 *   node scripts/visual/collect-stories.mjs --with-map     # include @knitui/map
 *   node scripts/visual/collect-stories.mjs --parallel=3   # concurrent builds (default 2)
 *
 * Manifest entries: { pkg, dir, port, id, title, name, importPath, tags, colorScheme }
 * `colorScheme` = whether that Storybook's preview reads the `colorScheme`
 * global (so the harness knows whether a dark pass means anything).
 * Stories only: `type: "docs"` entries are dropped.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PACKAGES } from "../../visual/packages.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const args = process.argv.slice(2);
const noBuild = args.includes("--no-build");
const withMap = args.includes("--with-map");
const onlyArg = args.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.slice(7).split(",") : null;
const parArg = args.find((a) => a.startsWith("--parallel="));
const parallel = parArg ? Number(parArg.slice(11)) : 2;

const included = (p) => (only ? only.includes(p.pkg) : !p.optional || withMap);

function build(pkg) {
  const dir = join(ROOT, "packages", pkg);
  const t0 = Date.now();
  return new Promise((res) => {
    const child = spawn(
      "pnpm",
      ["exec", "storybook", "build", "--quiet", "-o", "storybook-static"],
      {
        cwd: dir,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          STORYBOOK_DISABLE_TELEMETRY: "1",
          NODE_OPTIONS: "--max-old-space-size=8192",
        },
      },
    );
    let err = "";
    child.stdout.on("data", () => {});
    child.stderr.on("data", (d) => {
      err = (err + d).slice(-8000);
    });
    child.on("close", (code) => {
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`[collect] ${pkg}: ${code === 0 ? "ok" : "FAILED"} (${secs}s)`);
      if (code !== 0) console.error(err);
      res({ pkg, ok: code === 0, secs });
    });
  });
}

const results = [];
if (!noBuild) {
  const queue = PACKAGES.filter(included).map((p) => p.pkg);
  const workers = Array.from({ length: Math.max(1, parallel) }, async () => {
    while (queue.length) results.push(await build(queue.shift()));
  });
  await Promise.all(workers);
}

// Merge every built Storybook that is in scope (map only with --with-map / --only=map).
const manifest = [];
const perPkg = {};
for (const { pkg, port, optional } of PACKAGES) {
  if (optional && !withMap && !(only && only.includes(pkg))) continue;
  const dir = join(ROOT, "packages", pkg);
  const indexPath = join(dir, "storybook-static", "index.json");
  if (!existsSync(indexPath)) {
    console.warn(`[collect] no index.json for ${pkg}; skipped`);
    continue;
  }
  const previewPath = join(dir, ".storybook/preview.tsx");
  const colorScheme =
    existsSync(previewPath) && /colorScheme/.test(readFileSync(previewPath, "utf8"));
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  let n = 0;
  for (const e of Object.values(index.entries ?? index.stories ?? {})) {
    if (e.type && e.type !== "story") continue;
    manifest.push({
      pkg,
      dir: `packages/${pkg}/storybook-static`,
      port,
      id: e.id,
      title: e.title,
      name: e.name,
      importPath: e.importPath,
      tags: e.tags ?? [],
      colorScheme,
    });
    n++;
  }
  perPkg[pkg] = n;
}

manifest.sort((a, b) => (a.pkg + "/" + a.id).localeCompare(b.pkg + "/" + b.id));
mkdirSync(join(ROOT, "visual"), { recursive: true });
writeFileSync(join(ROOT, "visual/manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`[collect] manifest: ${manifest.length} stories`, perPkg);
const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error("[collect] builds failed:", failed.map((r) => r.pkg).join(", "));
  process.exitCode = 1;
}
