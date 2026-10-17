// The codemod engine: file discovery, the per-file transform pipeline, position
// mapping for the report, transactional writes and prettier formatting.

import fs from "node:fs";
import path from "node:path";
import { parse, syntaxErrors, applyEdits } from "./lib/ast.mjs";
import { Report } from "./lib/report.mjs";
import * as t0 from "./transforms/t0-styleable.mjs";
import * as t1 from "./transforms/t1-tokens.mjs";
import * as t3 from "./transforms/t3-conditions.mjs";
import * as t4 from "./transforms/t4-transitions.mjs";
import * as t7 from "./transforms/t7-report.mjs";

/** Pipeline order: structure first (T0, T4, T3), sigil stripping last (T1 covers T3's object-form output). */
export const TRANSFORMS = [t7, t0, t4, t3, t1];
export const TRANSFORM_IDS = ["T0", "T1", "T2", "T3", "T4", "T7"];

const SOURCE_EXT = /\.(tsx?|jsx?|mts|cts)$/;
const EXCLUDED_DIRS = new Set([
  "node_modules",
  "lib",
  "out",
  ".next",
  "dist",
  "build",
  ".expo",
  ".turbo",
  ".tamagui",
  "coverage",
  "storybook-static",
  "generated",
  "__fixtures__",
  "ios",
  "android",
  "Pods",
  "public",
]);
const EXCLUDED_PATHS = [
  /(^|\/)packages\/map\//,
  /(^|\/)packages\/icons\/src\/icons\//,
  /(^|\/)packages\/emoji\/src\/data\//,
  /\.generated\./,
  /\.config\.(c|m)?[jt]s$/,
  // v3-native core helpers that accept the legacy `$` spelling on purpose
  /(^|\/)packages\/core\/src\/resolve-token(\.test)?\.tsx?$/,
];

/** Opt-outs: a file containing IGNORE_FILE is skipped; IGNORE_NEXT_LINE protects the following line. */
export const IGNORE_FILE = "tamagui-v3-codemod: ignore-file";
export const IGNORE_NEXT_LINE = "tamagui-v3-codemod-ignore-next-line";

function protectedRanges(text) {
  const out = [];
  if (!text.includes(IGNORE_NEXT_LINE)) return out;
  const lines = text.split("\n");
  let pos = 0;
  for (let i = 0; i < lines.length; i++) {
    const next = pos + lines[i].length + 1;
    if (lines[i].includes(IGNORE_NEXT_LINE) && i + 1 < lines.length)
      out.push([next, next + lines[i + 1].length]);
    pos = next;
  }
  return out;
}

export function isExcluded(file) {
  const norm = file.split(path.sep).join("/");
  return EXCLUDED_PATHS.some((re) => re.test(norm));
}

export function discover(paths, { cwd = process.cwd(), ignoreExclusions = false } = {}) {
  const out = [];
  const missing = [];
  const visit = (p) => {
    let st;
    try {
      st = fs.statSync(p);
    } catch {
      missing.push(p);
      return;
    }
    if (st.isDirectory()) {
      if (EXCLUDED_DIRS.has(path.basename(p))) return;
      for (const e of fs.readdirSync(p).sort()) {
        if (EXCLUDED_DIRS.has(e) || e.startsWith(".")) continue;
        const child = path.join(p, e);
        const cst = fs.lstatSync(child);
        if (cst.isSymbolicLink()) continue;
        if (cst.isDirectory()) visit(child);
        else if (SOURCE_EXT.test(e) && (ignoreExclusions || !isExcluded(child))) out.push(child);
      }
    } else if (SOURCE_EXT.test(p) && (ignoreExclusions || !isExcluded(p))) {
      out.push(p);
    }
  };
  for (const p of paths) visit(path.resolve(cwd, p));
  return { files: [...new Set(out)], missing };
}

/** Where `styleable` is imported from, for a given file. */
export function makeStyleableModule(repoRoot) {
  const coreSrc = repoRoot ? path.join(repoRoot, "packages", "core", "src") : null;
  let coreExport = null;
  return (file) => {
    if (!coreSrc || !path.resolve(file).startsWith(coreSrc + path.sep)) return "@knitui/core";
    if (coreExport === null) {
      coreExport = path.join(coreSrc, "styleable"); // default guess
      const stack = [coreSrc];
      outer: while (stack.length) {
        const dir = stack.pop();
        for (const e of fs.readdirSync(dir)) {
          const f = path.join(dir, e);
          if (fs.statSync(f).isDirectory()) {
            if (!EXCLUDED_DIRS.has(e)) stack.push(f);
          } else if (/\.tsx?$/.test(e) && !/\.test\./.test(e)) {
            if (/export\s+(function|const)\s+styleable\b/.test(fs.readFileSync(f, "utf8"))) {
              coreExport = f.replace(/\.tsx?$/, "");
              break outer;
            }
          }
        }
      }
    }
    let rel = path.relative(path.dirname(file), coreExport).split(path.sep).join("/");
    if (!rel.startsWith(".")) rel = `./${rel}`;
    return rel;
  };
}

/** Map a position in the current text back to the original through edit batches. */
function mapBack(pos, batches) {
  for (let b = batches.length - 1; b >= 0; b--) {
    const batch = batches[b];
    let delta = 0;
    let mapped = null;
    for (const e of batch) {
      const newStart = e.start + delta;
      const newEnd = newStart + e.text.length;
      if (pos < newStart) break;
      if (pos < newEnd || (pos === newStart && e.text.length === 0)) {
        mapped = e.start;
        break;
      }
      delta += e.text.length - (e.end - e.start);
    }
    pos = mapped ?? pos - delta;
  }
  return pos;
}

/**
 * Run the pipeline over one file's text. Returns `{ text, changed, errors }`.
 * Report entries are appended to `report` with original line numbers.
 */
export function transformText(
  file,
  original,
  { report, mode = "kit", only = null, styleableModule = () => "@knitui/core" },
) {
  if (original.includes(IGNORE_FILE)) return { text: original, changed: false, errors: [] };
  const first = parse(file, original);
  const errs = syntaxErrors(first);
  if (errs.length) return { text: original, changed: false, errors: errs };

  const lineStarts = first.getLineStarts();
  const lineOfOriginal = (pos) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  const enabled = (id) => !only || only.has(id) || (id === "T1" && only.has("T2"));
  let text = original;
  const batches = [];
  const seenReports = new Set();
  for (const t of TRANSFORMS) {
    const reportsOn =
      !only || only.has(t.id) || only.has("T7") || (t.id === "T1" && only.has("T2"));
    const doEdits = enabled(t.id);
    if (!doEdits && !reportsOn) continue;
    for (let iter = 0; iter < 4; iter++) {
      const sf = parse(file, text);
      const guarded = protectedRanges(text);
      const ctx = {
        mode,
        styleableModule,
        report: (category, nodeOrPos, message, suggestion, extra) => {
          const pos = typeof nodeOrPos === "number" ? nodeOrPos : nodeOrPos.getStart(sf);
          if (guarded.some(([a, b]) => pos >= a && pos < b)) return;
          const origPos = mapBack(pos, batches);
          const line = lineOfOriginal(origPos);
          const key = `${category}|${origPos}|${message}`;
          if (seenReports.has(key)) return;
          seenReports.add(key);
          report.add({ t: t.id, category, file, line, message, suggestion, ...(extra ?? {}) });
        },
      };
      const edits = (t.run({ sf, file, text, ctx }) ?? []).filter(
        (e) => !guarded.some(([a, b]) => e.start < b && e.end > a),
      );
      if (!doEdits || !edits.length) break;
      const clean = edits.map(({ start, end, text: tx }) => ({ start, end, text: tx }));
      text = applyEdits(text, clean);
      batches.push([...clean].sort((a, b) => a.start - b.start));
      if (t.id !== "T0") break; // only T0 can need a second pass (nested receivers)
    }
  }
  const after = parse(file, text);
  const outErrs = syntaxErrors(after);
  if (outErrs.length)
    return { text: original, changed: false, errors: outErrs.map((e) => `after transform: ${e}`) };
  return { text, changed: text !== original, errors: [] };
}

let prettierMod = null;
async function formatWithPrettier(file, text) {
  prettierMod ??= (await import("prettier")).default;
  const config = (await prettierMod.resolveConfig(file)) ?? {};
  return prettierMod.format(text, { ...config, filepath: file });
}

/**
 * Run over files. Transactional: any parse error (input or output) → nothing
 * is written. Returns `{ report, changed: [{file, before, after}], errors }`.
 */
export async function runCodemod({
  files,
  root,
  mode = "kit",
  only = null,
  write = false,
  format = true,
}) {
  const report = new Report(root);
  const styleableModule = makeStyleableModule(root);
  const changed = [];
  const errors = [];
  for (const file of files) {
    const before = fs.readFileSync(file, "utf8");
    let res;
    try {
      res = transformText(file, before, { report, mode, only, styleableModule });
    } catch (err) {
      errors.push(`${file}: ${err.stack ?? err}`);
      continue;
    }
    if (res.errors.length) {
      errors.push(...res.errors);
      for (const e of res.errors)
        report.add({ t: "-", category: "parse-error", file, line: 0, message: e });
      continue;
    }
    if (!res.changed) continue;
    let after = res.text;
    if (format) {
      try {
        after = await formatWithPrettier(file, after);
      } catch (err) {
        errors.push(`${file}: prettier: ${String(err.message ?? err).split("\n")[0]}`);
        continue;
      }
    }
    if (after !== before) changed.push({ file, before, after });
  }
  if (write && !errors.length) {
    for (const c of changed) fs.writeFileSync(c.file, c.after);
  }
  return { report, changed, errors, written: write && !errors.length };
}
