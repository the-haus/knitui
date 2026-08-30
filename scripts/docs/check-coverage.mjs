#!/usr/bin/env node
/**
 * check-coverage.mjs
 * ------------------
 * The documentation guardrail. Run in CI next to `pnpm check:naming`.
 *
 * Docs generated from source can still rot in three ways, and this catches all
 * three:
 *
 *   1. **A new component has no page.** Someone adds `Thing.stories.tsx`; the
 *      registry picks it up, the sidebar links it, and the link 404s.
 *   2. **A page documents nothing.** An MDX file exists but has no live example or
 *      no props table, so it reads like documentation without being any.
 *   3. **The committed generated output is stale.** `src/generated/**` is
 *      committed so the site builds without running the generators — which means a
 *      change to a story that nobody regenerated ships a wrong page.
 *
 * Exit code 1 on any failure. `--warn` reports without failing, for a first pass.
 *
 * Usage: node scripts/docs/check-coverage.mjs [--warn]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const APP_DIR = join(REPO_ROOT, "apps/docs");
const GENERATED = join(APP_DIR, "src/generated");
const CONTENT = join(APP_DIR, "content");

const warnOnly = process.argv.includes("--warn");
const failures = [];
const notes = [];

const registry = JSON.parse(readFileSync(join(GENERATED, "registry.json"), "utf8"));
const props = JSON.parse(readFileSync(join(GENERATED, "props.json"), "utf8"));
const nav = JSON.parse(readFileSync(join(GENERATED, "nav.json"), "utf8"));

/* --------------------------------------------- 1. every component has a page */

for (const entry of registry.entries) {
  if (entry.internal) continue;
  const page = join(CONTENT, "docs", `${entry.id.split("/").join(sep)}.mdx`);
  const indexPage = join(CONTENT, "docs", entry.id.split("/").join(sep), "index.mdx");
  if (!existsSync(page) && !existsSync(indexPage)) {
    failures.push(
      `no docs page for ${entry.id} (${entry.sourcePath}) — run \`node scripts/docs/scaffold-pages.mjs\``,
    );
  }
}

/* ------------------------------------------- 2. every page documents something */

/** Every `.mdx` under content/, as repo-relative paths. */
function walk(dir) {
  const out = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, item.name);
    if (item.isDirectory()) out.push(...walk(full));
    else if (item.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

const componentIds = new Set(registry.entries.filter((e) => !e.internal).map((e) => e.id));

/** `meta.title` -> the file that claimed it, for the duplicate-title check. */
const titles = new Map();

/** Read a single-line string field out of an `export const meta` block. */
function matchString(source, key) {
  const pattern = new RegExp(
    `${key}:\\s*\\n?\\s*(?:"((?:[^"\\\\]|\\\\.)*)"|'((?:[^'\\\\]|\\\\.)*)')`,
  );
  const match = pattern.exec(source);
  return match ? (match[1] ?? match[2]) : undefined;
}

for (const file of walk(CONTENT)) {
  const source = readFileSync(file, "utf8");
  const rel = relative(REPO_ROOT, file).split(sep).join("/");

  if (!/export const meta = \{/.test(source)) {
    failures.push(`${rel} has no \`export const meta\` — the page will have no <title>`);
  }

  // The description IS the search result. Asserting only that `meta` exists let
  // 20 pages ship the scaffold's placeholder ("X — part of @knitui/y. N live
  // examples.") as their Google snippet, and every duplicate <title> below went
  // unnoticed. Both are checked here so they cannot silently come back.
  // Both quote styles: a description containing `variant="gradient"` is written
  // with single quotes, and matching only `"` would report it as missing.
  const description = matchString(source, "description");
  if (!description) {
    failures.push(`${rel} has no \`description\` in meta — its search snippet is Google's guess`);
  } else if (/part of @knitui\/|— a hook from @knitui\//.test(description)) {
    failures.push(`${rel} still has the scaffolded placeholder description — write real copy`);
  } else if (description.length < 50) {
    notes.push(`${rel}: description is only ${description.length} chars — thin for a snippet`);
  }

  const title = matchString(source, "title");
  if (title) {
    const clash = titles.get(title);
    if (clash)
      failures.push(`${rel} duplicates the <title> of ${clash} — they compete for one query`);
    else titles.set(title, rel);
  }

  // A component page (one that renders <ComponentHeader />) must also carry a
  // live example and a props table; otherwise it is a stub pretending to be docs.
  if (/<ComponentHeader\s/.test(source)) {
    const id = /<ComponentHeader\s+id="([^"]+)"/.exec(source)?.[1];
    if (!id || !componentIds.has(id)) {
      failures.push(`${rel} references unknown component id "${id ?? "?"}"`);
    }
    if (!/<(Examples|Example|Playground)\s/.test(source)) {
      failures.push(`${rel} has no live example`);
    }
    if (!/<PropsTable\s/.test(source)) {
      failures.push(`${rel} has no props table`);
    }
    if (id && !props.components[id]) {
      notes.push(`${rel}: prop extraction did not resolve ${id} — consider an override file`);
    }
  }
}

/* ----------------------------------------------- 3. every nav link resolves */

const contentRoutes = new Set(
  walk(CONTENT).map((file) => {
    const rel = relative(CONTENT, file).split(sep).join("/");
    return `/${rel.replace(/\.mdx$/, "").replace(/\/index$/, "")}`;
  }),
);
// Routes served by real page components rather than MDX.
const appRoutes = new Set(["/changelog", "/"]);

for (const section of nav.sections) {
  const links = [...section.items, ...section.sections.flatMap((sub) => sub.items)];
  for (const link of links) {
    if (!contentRoutes.has(link.href) && !appRoutes.has(link.href)) {
      failures.push(`nav links to ${link.href} ("${link.label}") but no page exists`);
    }
  }
}

/* ------------------------------------- 4. no evaluator markers reach a snippet */

// `$expr`/`$fn`/`$ref` are the static evaluator's stand-ins for source it could
// not reduce to data (see scripts/docs/lib/ts-eval.mjs). They belong in `args`,
// where the site knows to substitute the source text or drop the value — a
// snippet that prints one is showing a reader the generator's internals.
const sources = JSON.parse(readFileSync(join(GENERATED, "story-sources.json"), "utf8"));

for (const [id, stories] of Object.entries(sources)) {
  for (const [story, { snippet }] of Object.entries(stories)) {
    if (snippet && /\$(expr|fn|ref)\b/.test(snippet)) {
      failures.push(`${id} · ${story}: snippet prints an evaluator marker instead of source text`);
    }
  }
}

/* ------------------------------------- 5. the debt ratchet: prose and prop docs */

/*
 * Two kinds of documentation debt are real but too large to gate outright: 177 of
 * 178 component pages are still scaffolds waiting on prose, and ~24% of own props
 * carry no TSDoc. A hard threshold would fail the build today and get switched
 * off; a ratchet fails only when a number gets WORSE, which is what actually
 * stops backsliding while the debt is paid down.
 *
 * `--update-baseline` rewrites the file after an improvement. Both numbers are
 * printed on every run, so the debt is a visible, shrinking figure rather than a
 * thing nobody measures.
 */
const BASELINE_FILE = join(SCRIPT_DIR, "docs-debt.json");
const SCAFFOLD_MARKER = "{/* scaffolded: replace this comment with real prose */}";

const scaffolded = walk(CONTENT).filter((file) =>
  readFileSync(file, "utf8").includes(SCAFFOLD_MARKER),
).length;

let ownProps = 0;
let undocumentedOwnProps = 0;
const undocumentedByComponent = {};
for (const [id, data] of Object.entries(props.components)) {
  const own = data.props.filter((prop) => prop.bucket === "own");
  const undocumented = own.filter((prop) => !prop.description?.trim()).length;
  ownProps += own.length;
  undocumentedOwnProps += undocumented;
  if (undocumented) undocumentedByComponent[id] = undocumented;
}

const current = { scaffolded, undocumentedOwnProps };

if (process.argv.includes("--update-baseline")) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    BASELINE_FILE,
    `${JSON.stringify({ ...current, undocumentedByComponent }, null, 2)}\n`,
    "utf8",
  );
  console.log(`[docs-coverage] baseline updated: ${JSON.stringify(current)}`);
} else if (existsSync(BASELINE_FILE)) {
  const baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8"));
  for (const [key, label] of [
    ["scaffolded", "component pages still carrying the scaffold marker"],
    ["undocumentedOwnProps", "own props with no description"],
  ]) {
    const was = baseline[key];
    const now = current[key];
    if (typeof was !== "number") continue;
    if (now > was) {
      failures.push(
        `${label} rose from ${was} to ${now} — document the new ones, or run ` +
          `\`node scripts/docs/check-coverage.mjs --update-baseline\` if this is intentional`,
      );
    } else if (now < was) {
      notes.push(
        `${label}: ${was} → ${now}. Run with --update-baseline to lock in the improvement.`,
      );
    }
  }
}

const documentedPct = ownProps
  ? Math.round((100 * (ownProps - undocumentedOwnProps)) / ownProps)
  : 0;
console.log(
  `[docs-coverage] prose debt: ${scaffolded} scaffolded pages · ` +
    `prop docs: ${documentedPct}% of ${ownProps} own props described`,
);

/* ------------------------------------------------ 6. generated output is fresh */

if (process.argv.includes("--check-generated")) {
  execFileSync(process.execPath, [join(SCRIPT_DIR, "generate.mjs")], {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });
  const diff = execFileSync("git", ["status", "--porcelain", "--", "apps/docs/src/generated"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
  if (diff) {
    failures.push(
      `apps/docs/src/generated is stale — run \`pnpm docs:generate\` and commit:\n${diff}`,
    );
  }
}

/* ------------------------------------------------------------------- report */

const componentPages = registry.entries.filter((e) => !e.internal).length;
const documented = Object.keys(props.components).length;

console.log(
  `[docs-coverage] ${componentPages} components · ${documented} with generated props · ` +
    `${contentRoutes.size} content pages`,
);

for (const note of notes) console.log(`  note: ${note}`);

if (failures.length) {
  console.error(`\n[docs-coverage] ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  if (!warnOnly) process.exit(1);
} else {
  console.log("[docs-coverage] ✓ no problems");
}
