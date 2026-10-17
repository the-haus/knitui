#!/usr/bin/env node
/**
 * Summarise one harness artifact dir: capture status per package, story errors,
 * console errors/warnings and axe violations (top items).
 *
 *   node visual/summarize.mjs <artifactDir>      → <artifactDir>/SUMMARY.md + summary.json
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DIR = resolve(process.argv[2] ?? "visual/out/local");
const rows = readFileSync(join(DIR, "results.jsonl"), "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));
const latest = new Map();
for (const r of rows) latest.set(`${r.pkg}/${r.id}/${r.scheme}`, r);
const R = [...latest.values()];

const perPkg = {};
for (const r of R) {
  const p = (perPkg[r.pkg] ??= {
    tests: 0,
    stories: new Set(),
    ok: 0,
    "story-error": 0,
    failed: 0,
    skipped: 0,
    open: 0,
    openError: 0,
    states: 0,
    statesError: 0,
    msTotal: 0,
  });
  p.tests++;
  p.stories.add(r.id);
  p[r.status] = (p[r.status] ?? 0) + 1;
  if (r.captures?.includes("open")) p.open++;
  if (r.openError) p.openError++;
  if (r.captures?.includes("hover")) p.states++;
  if (r.statesError) p.statesError++;
  p.msTotal += r.ms ?? 0;
}

const norm = (t) =>
  t
    .replace(/https?:\/\/127\.0\.0\.1:\d+/g, "")
    .replace(/[-.][A-Za-z0-9_]{8}\.js/g, ".js")
    .replace(/:\d+:\d+/g, "")
    .replace(/0x[0-9a-f]+/gi, "0x")
    .split("\n")[0]
    .slice(0, 220);
const consoleCounts = new Map();
const axeCounts = new Map();
const storyErrors = [];
const failed = [];
for (const r of R) {
  const d = join(DIR, r.pkg, r.id, r.scheme);
  const c = existsSync(join(d, "console.json"))
    ? JSON.parse(readFileSync(join(d, "console.json"), "utf8"))
    : [];
  for (const m of c) {
    if (/GL Driver Message|GPU stall/.test(m.text)) continue;
    const k = `${m.type}: ${norm(m.text)}`;
    const e = consoleCounts.get(k) ?? { n: 0, stories: new Set() };
    e.n++;
    e.stories.add(`${r.pkg}/${r.id}`);
    consoleCounts.set(k, e);
  }
  for (const f of ["axe.json", "open.axe.json"]) {
    if (!existsSync(join(d, f))) continue;
    const v = JSON.parse(readFileSync(join(d, f), "utf8"));
    if (!Array.isArray(v)) continue;
    for (const x of v) {
      const e = axeCounts.get(x.id) ?? {
        impact: x.impact,
        help: x.help,
        stories: new Set(),
        nodes: 0,
        titles: new Set(),
      };
      e.stories.add(`${r.pkg}/${r.id}`);
      e.titles.add(r.title);
      e.nodes += x.nodes;
      axeCounts.set(x.id, e);
    }
  }
  if (r.status === "story-error") {
    const meta = JSON.parse(readFileSync(join(d, "meta.json"), "utf8"));
    storyErrors.push({
      key: `${r.pkg}/${r.id} [${r.scheme}]`,
      err: (meta.storyError ?? "").split("\n")[0].slice(0, 160),
    });
  }
  if (r.status === "failed")
    failed.push({
      key: `${r.pkg}/${r.id} [${r.scheme}]`,
      err: (r.error ?? "").split("\n")[0].slice(0, 200),
    });
}

const L = [`# Harness summary`, ``, `- dir: \`${DIR}\``, `- tests: ${R.length}`, ``];
L.push(
  `| pkg | stories | tests | ok | story-error | failed | skipped | open captured | open errors | state captures | avg s/test |`,
  `|---|---|---|---|---|---|---|---|---|---|---|`,
);
for (const [k, p] of Object.entries(perPkg))
  L.push(
    `| ${k} | ${p.stories.size} | ${p.tests} | ${p.ok ?? 0} | ${p["story-error"]} | ${p.failed} | ${p.skipped} | ${p.open} | ${p.openError} | ${p.states} | ${(p.msTotal / p.tests / 1000).toFixed(1)} |`,
  );
L.push(``, `## Failed captures (${failed.length})`, ``);
for (const f of failed) L.push(`- ${f.key}: ${f.err}`);
L.push(``, `## Story render errors (${storyErrors.length})`, ``);
for (const f of storyErrors) L.push(`- ${f.key}: ${f.err}`);
L.push(``, `## Console messages (top 40 by stories affected)`, ``);
for (const [k, e] of [...consoleCounts]
  .sort((a, b) => b[1].stories.size - a[1].stories.size)
  .slice(0, 40))
  L.push(
    `- **${e.stories.size} stories** (${e.n}×) \`${k}\` — e.g. ${[...e.stories].slice(0, 3).join(", ")}`,
  );
L.push(``, `## axe violations (by rule)`, ``);
for (const [k, e] of [...axeCounts].sort((a, b) => b[1].stories.size - a[1].stories.size))
  L.push(
    `- **${k}** (${e.impact}) — ${e.stories.size} stories, ${e.nodes} nodes; ${e.help}. Titles: ${[...e.titles].slice(0, 8).join(", ")}${e.titles.size > 8 ? ", …" : ""}`,
  );
writeFileSync(join(DIR, "SUMMARY.md"), L.join("\n") + "\n");
writeFileSync(
  join(DIR, "summary.json"),
  JSON.stringify(
    {
      perPkg: Object.fromEntries(
        Object.entries(perPkg).map(([k, p]) => [k, { ...p, stories: p.stories.size }]),
      ),
      failed,
      storyErrors,
      console: [...consoleCounts].map(([k, e]) => ({
        msg: k,
        count: e.n,
        stories: e.stories.size,
      })),
      axe: [...axeCounts].map(([k, e]) => ({
        id: k,
        impact: e.impact,
        stories: e.stories.size,
        nodes: e.nodes,
      })),
    },
    null,
    2,
  ),
);
console.log(L.slice(0, 20).join("\n"));
