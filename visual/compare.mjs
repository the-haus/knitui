#!/usr/bin/env node
/**
 * Compare two visual-harness artifact dirs (baseline vs candidate).
 *
 *   node visual/compare.mjs <baselineDir> <candidateDir> [reportDir] [--all-diffs] [--quiet]
 *
 * Writes <reportDir>/REPORT.md, <reportDir>/report.json and diff PNGs under
 * <reportDir>/diffs/. reportDir defaults to <candidateDir>/compare.
 *
 * Per story × scheme it checks:
 *   - capture status (ok / story-error / failed / missing)
 *   - every PNG (root, open, hover, press, focus): pixelmatch diff ratio
 *   - styles.json / open.styles.json / <state>.styles.json: property-level diffs
 *     (nodes aligned by tag/role/label/text LCS, so inserted wrappers show up as
 *     structure changes rather than shifting every path)
 *   - aria.yml / open.aria.yml: line diff
 *   - axe.json / open.axe.json: new / resolved violation ids
 *   - console.json: new console errors / warnings / page errors (normalised)
 * Exit code: 0 always (the report is the product); use report.json to gate.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
if (args.length < 2) {
  console.error("usage: node visual/compare.mjs <baselineDir> <candidateDir> [reportDir]");
  process.exit(2);
}
const BASE = resolve(args[0]);
const CAND = resolve(args[1]);
const OUT = resolve(args[2] ?? join(CAND, "compare"));
mkdirSync(OUT, { recursive: true });

// ---- rules (thresholds) from overrides.ts; Node >= 22.18 strips TS types natively ----
process.removeAllListeners("warning"); // silence the typeless-package reparse notice
let resolveRule = () => ({ threshold: 0.1, maxDiffRatio: 0.001 });
let manifest = [];
try {
  const mod = await import(join(HERE, "overrides.ts"));
  resolveRule = mod.resolveRule;
  const mpath = existsSync(join(CAND, "manifest.json"))
    ? join(CAND, "manifest.json")
    : join(HERE, "manifest.json");
  manifest = JSON.parse(readFileSync(mpath, "utf8"));
} catch (err) {
  console.warn(
    `[compare] overrides.ts not loadable (${String(err).slice(0, 120)}); using default thresholds`,
  );
}
const byKey = new Map(manifest.map((e) => [`${e.pkg}/${e.id}`, e]));
const ruleFor = (pkg, id) => {
  const e = byKey.get(`${pkg}/${id}`);
  if (!e) return { threshold: 0.1, maxDiffRatio: 0.001 };
  try {
    return resolveRule(e, manifest);
  } catch {
    return { threshold: 0.1, maxDiffRatio: 0.001 };
  }
};

// ---------------------------------------------------------------------------
const readJson = (f) => {
  try {
    return JSON.parse(readFileSync(f, "utf8"));
  } catch {
    return null;
  }
};
const readText = (f) => (existsSync(f) ? readFileSync(f, "utf8") : null);

function results(dir) {
  const map = new Map();
  const f = join(dir, "results.jsonl");
  if (!existsSync(f)) return map;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      map.set(`${r.pkg}/${r.id}/${r.scheme}`, r); // last write wins (re-runs)
    } catch {
      /* partial line */
    }
  }
  return map;
}

function listCaptureDirs(dir) {
  const out = new Set();
  if (!existsSync(dir)) return out;
  for (const pkg of readdirSync(dir)) {
    const p = join(dir, pkg);
    if (!statSync(p).isDirectory() || pkg === "compare" || pkg.startsWith(".")) continue;
    for (const id of readdirSync(p)) {
      const q = join(p, id);
      if (!statSync(q).isDirectory()) continue;
      for (const scheme of readdirSync(q))
        if (statSync(join(q, scheme)).isDirectory()) out.add(`${pkg}/${id}/${scheme}`);
    }
  }
  return out;
}

function comparePng(a, b, threshold, diffPath) {
  const A = PNG.sync.read(readFileSync(a));
  const B = PNG.sync.read(readFileSync(b));
  const w = Math.max(A.width, B.width);
  const h = Math.max(A.height, B.height);
  const pad = (img) => {
    if (img.width === w && img.height === h) return img.data;
    const out = Buffer.alloc(w * h * 4, 0);
    for (let y = 0; y < img.height; y++)
      img.data.copy(out, y * w * 4, y * img.width * 4, (y + 1) * img.width * 4);
    return out;
  };
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(pad(A), pad(B), diff.data, w, h, { threshold, includeAA: false });
  const ratio = n / (w * h);
  if (n > 0 && diffPath) {
    mkdirSync(dirname(diffPath), { recursive: true });
    writeFileSync(diffPath, PNG.sync.write(diff));
  }
  return {
    pixels: n,
    ratio,
    sizeA: [A.width, A.height],
    sizeB: [B.width, B.height],
    sizeChanged: A.width !== B.width || A.height !== B.height,
  };
}

// ---- styles ----
const sig = (n) => `${n.t}|${n.a?.role ?? ""}|${n.a?.["aria-label"] ?? ""}|${n.x ?? ""}`;

function align(A, B) {
  // Fast path: identical structure.
  if (A.length === B.length && A.every((n, i) => n.p === B[i].p && n.t === B[i].t)) {
    return { pairs: A.map((n, i) => [n, B[i]]), removed: [], added: [] };
  }
  const n = A.length;
  const m = B.length;
  if (n * m > 9_000_000) {
    // Too big for LCS: path match.
    const bp = new Map(B.map((x) => [x.p, x]));
    const ap = new Set(A.map((x) => x.p));
    return {
      pairs: A.filter((x) => bp.has(x.p)).map((x) => [x, bp.get(x.p)]),
      removed: A.filter((x) => !bp.has(x.p)),
      added: B.filter((x) => !ap.has(x.p)),
    };
  }
  const sa = A.map(sig);
  const sb = B.map(sig);
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = sa[i] === sb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs = [];
  const removed = [];
  const added = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (sa[i] === sb[j]) pairs.push([A[i++], B[j++]]);
    else if (dp[i + 1][j] >= dp[i][j + 1]) removed.push(A[i++]);
    else added.push(B[j++]);
  }
  while (i < n) removed.push(A[i++]);
  while (j < m) added.push(B[j++]);
  return { pairs, removed, added };
}

/**
 * Value normalisation so equivalent computed values from the two majors compare
 * equal: an identity transform matrix is "none" (v2 emitted identity transforms
 * where v3 emits nothing), and `flex-basis: 0%` equals `0px` (v2 `flex: 1` vs v3).
 */
const IDENTITY = /^matrix\(1, 0, 0, 1, 0, 0\)$/;
function normValue(k, v) {
  if (v === undefined) return "(default)";
  if (k === "transform" && (IDENTITY.test(v) || v === "none")) return "(default)";
  if (k === "flex-basis" && (v === "0%" || v === "0px")) return "0px";
  return v;
}

function compareStyles(a, b, ignore = []) {
  const ign = new Set(ignore);
  const A = readJson(a) ?? [];
  const B = readJson(b) ?? [];
  if (!Array.isArray(A) || !Array.isArray(B)) return null;
  const { pairs, removed, added } = align(A, B);
  const changes = [];
  const propCounts = {};
  let changedNodes = 0;
  for (const [x, y] of pairs) {
    let changed = false;
    const keys = new Set([...Object.keys(x.s), ...Object.keys(y.s)]);
    for (const k of keys) {
      if (ign.has(k)) continue;
      const va = normValue(k, x.s[k]);
      const vb = normValue(k, y.s[k]);
      if (va === vb) continue;
      changed = true;
      propCounts[k] = (propCounts[k] ?? 0) + 1;
      if (changes.length < 40)
        changes.push({
          node: `${y.t}${y.a?.role ? `[${y.a.role}]` : ""}${y.x ? ` "${y.x}"` : ""} @${y.p}`,
          prop: k,
          a: va,
          b: vb,
        });
    }
    const [ax, ay, aw, ah] = x.r;
    const [bx, by, bw, bh] = y.r;
    if (
      !ign.has("(rect)") &&
      (Math.abs(ax - bx) > 1 ||
        Math.abs(ay - by) > 1 ||
        Math.abs(aw - bw) > 1 ||
        Math.abs(ah - bh) > 1)
    ) {
      changed = true;
      propCounts["(rect)"] = (propCounts["(rect)"] ?? 0) + 1;
      if (changes.length < 40)
        changes.push({
          node: `${y.t}${y.a?.role ? `[${y.a.role}]` : ""}${y.x ? ` "${y.x}"` : ""} @${y.p}`,
          prop: "(rect)",
          a: x.r.join(","),
          b: y.r.join(","),
        });
    }
    const aa = JSON.stringify(x.a ?? {});
    const ba = JSON.stringify(y.a ?? {});
    if (aa !== ba) {
      changed = true;
      propCounts["(attrs)"] = (propCounts["(attrs)"] ?? 0) + 1;
      if (changes.length < 40)
        changes.push({ node: `${y.t} @${y.p}`, prop: "(attrs)", a: aa, b: ba });
    }
    if (changed) changedNodes++;
  }
  if (!changedNodes && !removed.length && !added.length) return null;
  return {
    nodesA: A.length,
    nodesB: B.length,
    changedNodes,
    removed: removed.length,
    added: added.length,
    removedSample: removed
      .slice(0, 5)
      .map((n) => `${n.t}${n.a?.role ? `[${n.a.role}]` : ""}${n.x ? ` "${n.x}"` : ""}`),
    addedSample: added
      .slice(0, 5)
      .map((n) => `${n.t}${n.a?.role ? `[${n.a.role}]` : ""}${n.x ? ` "${n.x}"` : ""}`),
    propCounts,
    changes,
  };
}

function lineDiff(a, b) {
  if (a === b) return null;
  const A = (a ?? "").split("\n");
  const B = (b ?? "").split("\n");
  const setA = new Map();
  for (const l of A) setA.set(l, (setA.get(l) ?? 0) + 1);
  const added = [];
  for (const l of B) {
    const c = setA.get(l) ?? 0;
    if (c > 0) setA.set(l, c - 1);
    else added.push(l);
  }
  const removed = [];
  for (const [l, c] of setA) for (let i = 0; i < c; i++) removed.push(l);
  if (!added.length && !removed.length) return { reordered: true, added: [], removed: [] };
  return {
    added: added.slice(0, 20),
    removed: removed.slice(0, 20),
    addedCount: added.length,
    removedCount: removed.length,
  };
}

function axeIds(f) {
  const j = readJson(f);
  if (!Array.isArray(j)) return null;
  return new Map(j.map((v) => [v.id, v]));
}

const normalizeMsg = (t) =>
  t
    .replace(/https?:\/\/127\.0\.0\.1:\d+/g, "")
    .replace(/[-.][A-Za-z0-9_]{8}\.js/g, ".js")
    .replace(/:\d+:\d+/g, "")
    .replace(/0x[0-9a-f]+/gi, "0x")
    .replace(/\d+(\.\d+)?/g, "N")
    .split("\n")[0]
    .slice(0, 300);

/** Tamagui v3 leak signatures (mirrors harness.spec.ts isV3Leak). Gated absolutely, not vs baseline. */
const isV3Leak = (t) =>
  /removed in v3|no "\$" prefix/.test(t) ||
  (/does not recognize the/.test(t) && /[a-z]Style\b|animateOnly/.test(t));

function consoleSet(f) {
  const j = readJson(f);
  if (!Array.isArray(j)) return new Map();
  const m = new Map();
  for (const c of j) {
    // Driver/GPU chatter is not a component signal.
    if (/GL Driver Message|GPU stall|WebGL-0x/.test(c.text)) continue;
    const k = `${c.type}: ${normalizeMsg(c.text)}`;
    m.set(k, c);
  }
  return m;
}

// ---------------------------------------------------------------------------
const baseRes = results(BASE);
const candRes = results(CAND);
const keys = new Set([
  ...listCaptureDirs(BASE),
  ...listCaptureDirs(CAND),
  ...baseRes.keys(),
  ...candRes.keys(),
]);

const stories = [];
const totals = {
  compared: 0,
  pixelFlagged: 0,
  styleChanged: 0,
  ariaChanged: 0,
  newAxe: 0,
  newConsoleErrors: 0,
  v3Leaks: 0,
  statusRegressed: 0,
  missing: 0,
  baseOnlySkipped: 0,
};

for (const key of [...keys].sort()) {
  const [pkg, id, scheme] = key.split("/");
  const rb = baseRes.get(key);
  const rc = candRes.get(key);
  if (rb?.status === "skipped" || rc?.status === "skipped") continue;
  const db = join(BASE, pkg, id, scheme);
  const dc = join(CAND, pkg, id, scheme);
  const rule = ruleFor(pkg, id);
  const entry = byKey.get(`${pkg}/${id}`);
  const issues = [];
  let severity = 0;
  const bump = (s) => (severity = Math.max(severity, s));

  if (!existsSync(dc) && !rc) {
    // Not in the candidate run at all (e.g. a sample pass): ignore.
    totals.baseOnlySkipped++;
    continue;
  }
  totals.compared++;

  const sb = rb?.status ?? (existsSync(db) ? "unknown" : "missing");
  const sc = rc?.status ?? (existsSync(dc) ? "unknown" : "missing");
  if (sb !== sc) {
    const worse = sc !== "ok" && (sb === "ok" || sb === "unknown");
    issues.push({ kind: "status", a: sb, b: sc, detail: rc?.error });
    bump(worse ? 100 : 20);
    if (worse) totals.statusRegressed++;
  }

  // PNGs
  const pngs = new Set([
    ...(existsSync(db) ? readdirSync(db) : []),
    ...(existsSync(dc) ? readdirSync(dc) : []),
  ]);
  for (const f of [...pngs].filter((x) => x.endsWith(".png")).sort()) {
    const a = join(db, f);
    const b = join(dc, f);
    if (!existsSync(a) || !existsSync(b)) {
      issues.push({ kind: "capture", file: f, a: existsSync(a), b: existsSync(b) });
      bump(existsSync(a) ? 80 : 15);
      if (existsSync(a)) totals.missing++;
      continue;
    }
    try {
      const diffPath = join(OUT, "diffs", pkg, id, `${scheme}-${f}`);
      const r = comparePng(a, b, rule.threshold ?? 0.1, diffPath);
      const limit = rule.maxDiffRatio ?? 0.001;
      if (r.ratio > limit || r.sizeChanged) {
        issues.push({ kind: "pixels", file: f, ...r, limit, diff: diffPath });
        bump(40 + Math.min(40, Math.round(r.ratio * 400)) + (r.sizeChanged ? 5 : 0));
        totals.pixelFlagged++;
      } else if (r.pixels > 0 && flags.has("--all-diffs")) {
        issues.push({ kind: "pixels-below-limit", file: f, ...r, limit });
      }
    } catch (err) {
      issues.push({ kind: "png-error", file: f, error: String(err) });
      bump(50);
    }
  }

  // styles
  for (const f of [...pngs].filter((x) => x.endsWith("styles.json")).sort()) {
    const a = join(db, f);
    const b = join(dc, f);
    if (!existsSync(a) || !existsSync(b)) continue;
    const d = compareStyles(a, b, rule.styleIgnore ?? []);
    if (d) {
      issues.push({ kind: "styles", file: f, ...d });
      bump(10 + Math.min(25, d.changedNodes + d.added + d.removed));
      totals.styleChanged++;
    }
  }

  // aria
  for (const f of ["aria.yml", "open.aria.yml"]) {
    const a = readText(join(db, f));
    const b = readText(join(dc, f));
    if (a === null && b === null) continue;
    const d = lineDiff(a, b);
    if (d) {
      issues.push({ kind: "aria", file: f, ...d });
      bump(d.reordered ? 12 : 30);
      totals.ariaChanged++;
    }
  }

  // axe
  for (const f of ["axe.json", "open.axe.json"]) {
    const a = axeIds(join(db, f));
    const b = axeIds(join(dc, f));
    if (!a || !b) continue;
    const added = [...b.keys()].filter((k) => !a.has(k));
    const resolved = [...a.keys()].filter((k) => !b.has(k));
    const grown = [...b.keys()].filter((k) => a.has(k) && b.get(k).nodes > a.get(k).nodes);
    if (added.length || resolved.length || grown.length) {
      issues.push({
        kind: "axe",
        file: f,
        added: added.map((k) => ({
          id: k,
          impact: b.get(k).impact,
          nodes: b.get(k).nodes,
          help: b.get(k).help,
        })),
        resolved,
        grown,
      });
      if (added.length || grown.length) {
        bump(25);
        totals.newAxe++;
      }
    }
  }

  // console
  {
    const a = consoleSet(join(db, "console.json"));
    const b = consoleSet(join(dc, "console.json"));
    const added = [...b.keys()].filter((k) => !a.has(k));
    const gone = [...a.keys()].filter((k) => !b.has(k));
    if (added.length || gone.length) {
      const errs = added.filter((k) => /^(error|pageerror)/.test(k));
      issues.push({ kind: "console", added, gone });
      if (errs.length) {
        bump(60);
        totals.newConsoleErrors++;
      } else if (added.length) bump(5);
    }
    const leaks = [...b.entries()].filter(([, c]) => c.leak || isV3Leak(c.text)).map(([k]) => k);
    if (leaks.length) {
      issues.push({ kind: "v3-leak", leaks });
      bump(70);
      totals.v3Leaks++;
    }
  }

  if (issues.length)
    stories.push({
      pkg,
      id,
      scheme,
      title: entry?.title ?? id,
      name: entry?.name ?? id,
      severity,
      issues,
    });
}

// ---------------------------------------------------------------------------
stories.sort((a, b) => b.severity - a.severity || a.id.localeCompare(b.id));
writeFileSync(
  join(OUT, "report.json"),
  JSON.stringify({ base: BASE, cand: CAND, totals, stories }, null, 2),
);

const byTitle = new Map();
for (const s of stories) {
  const k = `${s.pkg} · ${s.title}`;
  if (!byTitle.has(k)) byTitle.set(k, []);
  byTitle.get(k).push(s);
}
const titles = [...byTitle.entries()].sort(
  (a, b) => Math.max(...b[1].map((s) => s.severity)) - Math.max(...a[1].map((s) => s.severity)),
);

const fmtPct = (r) => `${(r * 100).toFixed(3)}%`;
const lines = [];
lines.push(
  `# Visual harness comparison`,
  ``,
  `- baseline: \`${BASE}\``,
  `- candidate: \`${CAND}\``,
  ``,
);
lines.push(`| metric | count |`, `|---|---|`);
for (const [k, v] of Object.entries(totals)) lines.push(`| ${k} | ${v} |`);
lines.push(
  ``,
  `Stories with any difference: **${stories.length}** in **${titles.length}** titles.`,
  ``,
);
lines.push(`## By component (highest severity first)`, ``);
lines.push(`| component | max sev | stories | kinds |`, `|---|---|---|---|`);
for (const [t, ss] of titles) {
  const kinds = new Set(ss.flatMap((s) => s.issues.map((i) => i.kind)));
  lines.push(
    `| ${t} | ${Math.max(...ss.map((s) => s.severity))} | ${ss.length} | ${[...kinds].join(", ")} |`,
  );
}
lines.push(``, `## Details`, ``);
for (const [t, ss] of titles) {
  lines.push(`### ${t}`, ``);
  for (const s of ss) {
    lines.push(`- **${s.name}** \`${s.id}\` [${s.scheme}] (sev ${s.severity})`);
    for (const i of s.issues) {
      if (i.kind === "status")
        lines.push(
          `  - status: ${i.a} → **${i.b}** ${i.detail ? `— ${String(i.detail).slice(0, 160)}` : ""}`,
        );
      else if (i.kind === "capture")
        lines.push(`  - capture \`${i.file}\`: baseline=${i.a} candidate=${i.b}`);
      else if (i.kind === "pixels")
        lines.push(
          `  - pixels \`${i.file}\`: ${fmtPct(i.ratio)} (${i.pixels}px, limit ${fmtPct(i.limit)})${i.sizeChanged ? ` size ${i.sizeA.join("x")}→${i.sizeB.join("x")}` : ""} — diff: \`${i.diff}\``,
        );
      else if (i.kind === "styles") {
        const top = Object.entries(i.propCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([k, v]) => `${k}×${v}`)
          .join(", ");
        lines.push(
          `  - styles \`${i.file}\`: ${i.changedNodes} nodes changed, +${i.added}/-${i.removed} nodes (${i.nodesA}→${i.nodesB}); ${top}`,
        );
        for (const c of i.changes.slice(0, 6))
          lines.push(`    - \`${c.node}\` ${c.prop}: \`${c.a}\` → \`${c.b}\``);
        if (i.addedSample.length) lines.push(`    - added: ${i.addedSample.join("; ")}`);
        if (i.removedSample.length) lines.push(`    - removed: ${i.removedSample.join("; ")}`);
      } else if (i.kind === "aria") {
        if (i.reordered) lines.push(`  - aria \`${i.file}\`: reordered only`);
        else {
          lines.push(`  - aria \`${i.file}\`: +${i.addedCount} / -${i.removedCount} lines`);
          for (const l of i.removed.slice(0, 4)) lines.push(`    - \`- ${l.trim()}\``);
          for (const l of i.added.slice(0, 4)) lines.push(`    - \`+ ${l.trim()}\``);
        }
      } else if (i.kind === "axe")
        lines.push(
          `  - axe \`${i.file}\`: new [${i.added.map((a) => `${a.id}(${a.impact},${a.nodes})`).join(", ")}] grown [${i.grown.join(", ")}] resolved [${i.resolved.join(", ")}]`,
        );
      else if (i.kind === "console") {
        for (const a of i.added.slice(0, 5)) lines.push(`  - console new: \`${a.slice(0, 200)}\``);
        if (i.gone.length) lines.push(`  - console gone: ${i.gone.length}`);
      } else if (i.kind === "v3-leak") {
        for (const a of i.leaks.slice(0, 5)) lines.push(`  - **v3 leak**: \`${a.slice(0, 200)}\``);
      } else if (i.kind === "png-error") lines.push(`  - png error ${i.file}: ${i.error}`);
    }
  }
  lines.push("");
}
writeFileSync(join(OUT, "REPORT.md"), lines.join("\n"));
if (!flags.has("--quiet")) {
  console.log(`[compare] ${totals.compared} compared; ${stories.length} stories differ`);
  console.log(totals);
  console.log(`[compare] report: ${join(OUT, "REPORT.md")}`);
}
