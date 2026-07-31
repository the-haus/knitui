#!/usr/bin/env node
/**
 * build-nav.mjs
 * -------------
 * Resolves `nav.config.mjs` (the editorial IA) against `registry.json` (the
 * story-derived component list) into one slim tree the sidebar can ship to the
 * client.
 *
 * Slim matters: `registry.json` is ~900 kB and `story-sources.json` ~1.2 MB —
 * both are server-only. The sidebar is interactive (active route, collapse
 * state), so it must be a client component, so its data has to be small. This
 * emits label + href only.
 *
 * Writes: apps/docs/src/generated/nav.json
 *         apps/docs/src/generated/routes.json   (flat route -> entry id, for lookups)
 *
 * Usage: node scripts/docs/build-nav.mjs   (after build-registry.mjs)
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { COMPONENT_GROUP_ORDER, nav } from "./nav.config.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const OUT_DIR = join(REPO_ROOT, "apps/docs/src/generated");

const registry = JSON.parse(readFileSync(join(OUT_DIR, "registry.json"), "utf8"));

/** Public hooks, from `@knitui/hooks`' source files (one page per hook). */
function collectHooks() {
  const dir = join(REPO_ROOT, "packages/hooks/src");
  const seen = new Map();
  for (const file of readdirSync(dir)) {
    const match = /^(use-[a-z0-9-]+)(\.native|\.shared)?\.tsx?$/.exec(file);
    if (!match || file.includes(".test.") || file.includes(".types.")) continue;
    const slug = match[1];
    // `use-element-size.ts` + `use-element-size.native.ts` are one hook.
    if (!seen.has(slug)) {
      // `use-element-size` -> `useElementSize`
      const label = slug
        .split("-")
        .map((part, i) => (i === 0 ? part : part[0].toUpperCase() + part.slice(1)))
        .join("");
      seen.set(slug, { label, href: `/docs/hooks/${slug}` });
    }
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** The registry entries of one package, grouped and ordered for the sidebar. */
function packageSections(pkg) {
  const entries = registry.entries.filter((e) => e.package === pkg && !e.internal);
  const groups = new Map();
  for (const entry of entries) {
    const list = groups.get(entry.group) ?? [];
    list.push({ label: entry.name, href: entry.route });
    groups.set(entry.group, list);
  }

  const ordered = [...groups.entries()].sort(([a], [b]) => {
    const ia = COMPONENT_GROUP_ORDER.indexOf(a);
    const ib = COMPONENT_GROUP_ORDER.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b);
  });

  return ordered.map(([label, items]) => ({
    label,
    items: items.sort((a, b) => a.label.localeCompare(b.label)),
  }));
}

const sections = [];
for (const section of nav) {
  if (section.fromRegistry) {
    const subsections = packageSections(section.fromRegistry);
    // A single-group package (carousel, sheet) doesn't need a nested level.
    const flat = subsections.length === 1;
    sections.push({
      label: section.label,
      collapsed: true,
      items: [
        ...(section.overview ? [{ label: section.overview[0], href: section.overview[1] }] : []),
        ...(flat ? subsections[0].items : []),
      ],
      sections: flat ? [] : subsections,
    });
    continue;
  }
  if (section.fromHooks) {
    sections.push({ label: section.label, collapsed: true, items: collectHooks(), sections: [] });
    continue;
  }
  sections.push({
    label: section.label,
    collapsed: section.collapsed ?? true,
    items: section.items.map(([label, href]) => ({ label, href })),
    sections: [],
  });
}

/** Flat route -> registry id, so a page can find its own entry by pathname. */
const routes = {};
for (const entry of registry.entries) routes[entry.route] = entry.id;

writeFileSync(join(OUT_DIR, "nav.json"), `${JSON.stringify({ sections }, null, 2)}\n`, "utf8");
writeFileSync(join(OUT_DIR, "routes.json"), `${JSON.stringify(routes, null, 2)}\n`, "utf8");

const leafCount = sections.reduce(
  (n, s) => n + s.items.length + s.sections.reduce((m, sub) => m + sub.items.length, 0),
  0,
);
console.log(`[nav] ${sections.length} sections · ${leafCount} links`);
