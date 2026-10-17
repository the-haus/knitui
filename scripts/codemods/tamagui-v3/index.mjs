#!/usr/bin/env node
/**
 * Knit UI Tamagui v2 → v3 codemod.
 *
 *   node scripts/codemods/tamagui-v3/index.mjs [--write] [--report r.md] [--json r.json]
 *        [--only T0,T1,T2,T3,T4,T7] [--mode kit|consumer] [--out-dir dir] [--no-format] [--quiet] <paths...>
 *
 * Dry run by default: nothing is written, the report says what would change.
 * `--write` applies every change, but only when no file failed to parse (the
 * run is transactional). Touched files are formatted with the repo's prettier.
 *
 *   T0  Frame.styleable<P>(fn, opts?)  → styleable<P>(Frame, fn, opts?)  (import from @knitui/core)
 *   T1  "$md" → "md" token literals; `$${x}` → `${x}`
 *   T2  variant keys `$md:` → `md:`
 *   T3  hoverStyle/pressStyle/focus*Style/disabledStyle/enterStyle/exitStyle → flat values
 *   T4  transition tuples → objects; animateOnly → transition.properties / "none"
 *   T7  report only: everything that needs a hand edit
 *
 * `--out-dir dir` (dry run) mirrors every would-be-changed file under `dir` for diffing.
 *
 * `--mode kit` (default) treats every `$token`-shaped literal in the scanned
 * files as a token. `--mode consumer` only rewrites literals in style positions
 * (style-prop JSX attributes, styled() configs, styles/slotStyles, style()).
 *
 * Exit codes: 0 ok · 1 parse/format errors (nothing written) · 2 bad usage / path matches nothing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discover, runCodemod, TRANSFORM_IDS } from "./engine.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");

function usage(msg) {
  if (msg) console.error(`error: ${msg}\n`);
  console.error(
    fs
      .readFileSync(fileURLToPath(import.meta.url), "utf8")
      .split("*/")[0]
      .replace(/^#!.*\n\/\*\*?/, "")
      .replace(/^ \* ?/gm, ""),
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const opts = {
  outDir: null,
  write: false,
  report: null,
  json: null,
  only: null,
  mode: "kit",
  format: true,
  quiet: false,
  paths: [],
};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--write") opts.write = true;
  else if (a === "--report") opts.report = args[++i];
  else if (a === "--json") opts.json = args[++i];
  else if (a === "--only")
    opts.only = new Set(args[++i].split(",").map((s) => s.trim().toUpperCase()));
  else if (a === "--mode") opts.mode = args[++i];
  else if (a === "--no-format") opts.format = false;
  else if (a === "--out-dir") opts.outDir = args[++i];
  else if (a === "--quiet") opts.quiet = true;
  else if (a === "-h" || a === "--help") usage();
  else if (a.startsWith("--")) usage(`unknown flag ${a}`);
  else opts.paths.push(a);
}
if (!opts.paths.length) usage("no paths given");
if (!["kit", "consumer"].includes(opts.mode)) usage(`--mode must be kit or consumer`);
if (opts.only)
  for (const t of opts.only) if (!TRANSFORM_IDS.includes(t)) usage(`unknown transform ${t}`);

const { files, missing } = discover(opts.paths);
if (missing.length) usage(`path(s) not found: ${missing.join(", ")}`);
if (!files.length) usage("the given paths match no source file");

const root = fs.existsSync(path.join(repoRoot, "packages", "core")) ? repoRoot : process.cwd();
const result = await runCodemod({
  files,
  root,
  mode: opts.mode,
  only: opts.only,
  write: opts.write,
  format: opts.format,
});

const md = result.report.toMarkdown({
  mode: opts.mode,
  write: result.written,
  files: files.length,
  changedFiles: result.changed.length,
});
if (opts.report) fs.writeFileSync(opts.report, md);
if (opts.json)
  fs.writeFileSync(
    opts.json,
    JSON.stringify(
      {
        changed: result.changed.map((c) => path.relative(root, c.file)),
        entries: result.report.toJSON(),
      },
      null,
      2,
    ),
  );

if (opts.outDir) {
  for (const c of result.changed) {
    const dest = path.join(opts.outDir, path.relative(root, c.file));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, c.after);
  }
}
if (!opts.quiet) {
  const counts = result.report.counts();
  console.log(
    `${files.length} files scanned, ${result.changed.length} would change${result.written ? " (written)" : ""}`,
  );
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1]))
    console.log(`  ${k.padEnd(28)} ${v}`);
  if (opts.report) console.log(`report: ${opts.report}`);
}
if (result.errors.length) {
  console.error(`\n${result.errors.length} error(s)${opts.write ? "; nothing was written" : ""}:`);
  for (const e of result.errors.slice(0, 50)) console.error(`  ${e}`);
  process.exit(1);
}
