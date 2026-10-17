#!/usr/bin/env node
/**
 * Run scripts/perf/render-bench.test.tsx under the @knitui/components jest
 * config and write the JSON result.
 *
 *   node scripts/perf/run-render-bench.mjs [out.json]      (default: scripts/perf/out/render-bench.json)
 *   PERF_ITER=20 node scripts/perf/run-render-bench.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const out = resolve(process.argv[2] ?? join(ROOT, "scripts/perf/out/render-bench.json"));
mkdirSync(dirname(out), { recursive: true });

const comp = join(ROOT, "packages/components");
const r = spawnSync(
  "pnpm",
  [
    "exec",
    "jest",
    "-c",
    join(comp, "jest.config.js"),
    "--rootDir",
    comp,
    "--roots",
    join(ROOT, "scripts/perf"),
    "--testMatch",
    "**/render-bench.test.tsx",
    "--runInBand",
    "--coverage=false",
    "--setupFilesAfterEnv",
    join(comp, "jest.setup.ts"),
  ],
  { cwd: comp, stdio: "inherit", env: { ...process.env, PERF_OUT: out } },
);
if (r.status === 0) console.log(`[perf] wrote ${out}`);
process.exit(r.status ?? 1);
