#!/usr/bin/env node
/**
 * build-exports.mjs
 * -----------------
 * Indexes the public API surface of every published package: every named export
 * of every barrel, tagged value-vs-type, matched to its docs page where one
 * exists.
 *
 * This powers two things:
 *   - `/docs/api/exports` — an A–Z of everything importable, so a reader who
 *     knows a name can find its page without guessing which package ships it.
 *   - the coverage guardrail — an export with no docs page is a documentation
 *     hole, and CI can say so.
 *
 * Also collects per-package metadata (version, description, peer dependencies)
 * for `/docs/api/packages` and `/docs/api/compatibility`, straight from each
 * `package.json` — so the version table can never be stale.
 *
 * Writes: apps/docs/src/generated/exports.json
 *
 * Usage: node scripts/docs/build-exports.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const OUT_DIR = join(REPO_ROOT, "apps/docs/src/generated");

/** Published packages, in the order the docs present them. */
const PACKAGES = [
  "core",
  "components",
  "hooks",
  "icons",
  "emoji",
  "dates",
  "carousel",
  "map",
  "media",
  "graphics",
  "sheet",
  "mediaquery",
  "plugins",
];

/** Packages whose barrels are thousands of generated glyphs, not an API. */
const GLYPH_PACKAGES = new Set(["icons", "emoji"]);

const registry = JSON.parse(readFileSync(join(OUT_DIR, "registry.json"), "utf8"));

/** route lookup: export name -> docs route, from the story registry. */
const routeByComponent = new Map();
for (const entry of registry.entries) {
  if (entry.internal) continue;
  if (entry.componentName) routeByComponent.set(entry.componentName, entry.route);
  routeByComponent.set(entry.name, entry.route);
}

const hooksFile = join(OUT_DIR, "hooks.json");
const hooks = existsSync(hooksFile) ? JSON.parse(readFileSync(hooksFile, "utf8")).hooks : [];
const routeByHook = new Map(hooks.map((hook) => [hook.name, hook.route]));

/**
 * Named exports of a barrel file.
 *
 * `export { … } from "./x"` is read directly. `export * from "./x"` is followed
 * into the referenced module (depth-limited, cycle-guarded), because some public
 * barrels — `@knitui/core`, `@knitui/dates` — are built entirely from wildcards,
 * and reporting "1 export" for `@knitui/core` would be worse than useless.
 *
 * Declarations exported in place (`export function`, `export const`,
 * `export type`) are collected too, so a leaf module counts even when nothing
 * re-exports it by name.
 */
function namedExports(path, depth = 0, visited = new Set()) {
  if (!existsSync(path) || depth > 3 || visited.has(path)) return [];
  visited.add(path);

  const text = readFileSync(path, "utf8");
  const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const out = [];

  for (const statement of file.statements) {
    const isExported = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          out.push({ name: element.name.text, isType: statement.isTypeOnly || element.isTypeOnly });
        }
        continue;
      }
      // `export * from "./x"` — follow it.
      if (!statement.exportClause && statement.moduleSpecifier) {
        const specifier = statement.moduleSpecifier.text;
        if (specifier.startsWith(".")) {
          out.push(...namedExports(resolveModule(dirname(path), specifier), depth + 1, visited));
        }
      }
      continue;
    }

    if (!isExported) continue;

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      out.push({ name: statement.name.text, isType: false });
    } else if (ts.isClassDeclaration(statement) && statement.name) {
      out.push({ name: statement.name.text, isType: false });
    } else if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
      out.push({ name: statement.name.text, isType: true });
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          out.push({ name: declaration.name.text, isType: false });
        }
      }
    }
  }

  // De-duplicate: a name can be both declared and re-exported.
  const seen = new Map();
  for (const item of out) if (!seen.has(item.name)) seen.set(item.name, item);
  return [...seen.values()];
}

/** `./config` -> `<dir>/config.ts` or `<dir>/config/index.ts`. */
function resolveModule(dir, specifier) {
  const base = join(dir, specifier);
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return base;
}

const packages = [];
const allExports = [];

for (const pkg of PACKAGES) {
  const dir = join(REPO_ROOT, "packages", pkg);
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const exportsList = namedExports(join(dir, "src/index.ts"));

  packages.push({
    name: manifest.name,
    slug: pkg,
    version: manifest.version,
    description: manifest.description,
    private: Boolean(manifest.private),
    dependencies: Object.keys(manifest.dependencies ?? {}),
    peerDependencies: Object.keys(manifest.peerDependencies ?? {}),
    optionalPeers: Object.keys(manifest.peerDependenciesMeta ?? {}).filter(
      (name) => manifest.peerDependenciesMeta[name]?.optional,
    ),
    exportPaths: Object.keys(manifest.exports ?? {}).filter((key) => !key.includes("*")),
    exportCount: exportsList.length,
    hasStories: registry.entries.some((entry) => entry.package === pkg),
  });

  // `@knitui/icons` and `@knitui/emoji` export thousands of generated glyphs.
  // They're counted in the package table but never enumerated in the A–Z index —
  // that's what the searchable icon/emoji browsers are for.
  if (GLYPH_PACKAGES.has(pkg)) continue;

  for (const item of exportsList) {
    allExports.push({
      name: item.name,
      kind: item.isType ? "type" : classify(item.name, pkg),
      package: manifest.name,
      packageSlug: pkg,
      route: item.isType
        ? undefined
        : (routeByComponent.get(item.name) ?? routeByHook.get(item.name)),
    });
  }
}

/** Rough kind for a value export — enough to filter the A–Z table by. */
function classify(name, pkg) {
  if (/^use[A-Z]/.test(name)) return "hook";
  if (/^[A-Z]/.test(name)) return "component";
  if (name === name.toUpperCase()) return "constant";
  return "function";
}

allExports.sort((a, b) => a.name.localeCompare(b.name) || a.package.localeCompare(b.package));

writeFileSync(
  join(OUT_DIR, "exports.json"),
  `${JSON.stringify(
    { generatedBy: "scripts/docs/build-exports.mjs", packages, exports: allExports },
    null,
    2,
  )}\n`,
  "utf8",
);

const documented = allExports.filter((item) => item.route).length;
const values = allExports.filter((item) => item.kind !== "type").length;
console.log(
  `[exports] ${allExports.length} exports across ${packages.length} packages · ${documented}/${values} values linked to a page`,
);
