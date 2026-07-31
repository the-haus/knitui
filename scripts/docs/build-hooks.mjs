#!/usr/bin/env node
/**
 * build-hooks.mjs
 * ---------------
 * Extracts the public surface of `@knitui/hooks` — one entry per hook, with its
 * signature, JSDoc, platform split and source path.
 *
 * The kit's hooks are usable on their own (`useUncontrolled`, `useMove`,
 * `useElementSize`, `useDisclosure`, …) and several encode hard-won
 * cross-platform behaviour, so they deserve real pages rather than a barrel dump.
 *
 * The platform split is read off the filesystem, not a list: a hook with a
 * `.native.ts` sibling has genuinely different implementations per platform,
 * which is the single most useful thing to know about it.
 *
 * Writes: apps/docs/src/generated/hooks.json
 *
 * Usage: node scripts/docs/build-hooks.mjs
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { leadingDoc } from "./lib/ts-eval.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const HOOKS_SRC = join(REPO_ROOT, "packages/hooks/src");
const OUT = join(REPO_ROOT, "apps/docs/src/generated/hooks.json");
const GITHUB_BLOB = "https://github.com/the-haus/knitui/blob/main";

/** `use-element-size` -> `useElementSize` */
const camel = (slug) =>
  slug
    .split("-")
    .map((part, i) => (i === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join("");

/** The barrel's export list, so we only document what's actually public. */
function publicNames() {
  const source = readFileSync(join(HOOKS_SRC, "index.ts"), "utf8");
  const file = ts.createSourceFile("index.ts", source, ts.ScriptTarget.Latest, true);
  const names = new Set();

  for (const statement of file.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.exportClause) continue;
    if (!ts.isNamedExports(statement.exportClause)) continue;
    for (const element of statement.exportClause.elements) names.add(element.name.text);
  }
  return names;
}

const exported = publicNames();
const hooks = [];

for (const file of readdirSync(HOOKS_SRC).sort()) {
  const match = /^(use-[a-z0-9-]+)\.tsx?$/.exec(file);
  if (!match) continue;

  const slug = match[1];
  const name = camel(slug);
  if (!exported.has(name)) continue;

  const path = join(HOOKS_SRC, file);
  const text = readFileSync(path, "utf8");
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

  let signature;
  let description;
  let typeAliases = [];

  for (const statement of sourceFile.statements) {
    const isExported = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) continue;

    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) {
      // The signature line only: everything up to the body.
      const full = statement.getText(sourceFile);
      const bodyStart = statement.body
        ? statement.body.getStart(sourceFile) - statement.getStart(sourceFile)
        : full.length;
      signature = full
        .slice(0, bodyStart)
        .replace(/\s+/g, " ")
        .replace(/\s*\{$/, "")
        .trim();
      description = leadingDoc(statement, sourceFile);
    }

    if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
      typeAliases.push(statement.name.text);
    }
  }

  // A `.native` sibling means real per-platform implementations; `.shared` means
  // the platform files split but delegate their logic to one common module.
  const nativePath = existsSync(join(HOOKS_SRC, `${slug}.native.ts`))
    ? `packages/hooks/src/${slug}.native.ts`
    : undefined;
  const sharedPath = existsSync(join(HOOKS_SRC, `${slug}.shared.ts`))
    ? `packages/hooks/src/${slug}.shared.ts`
    : undefined;
  const testPath = existsSync(join(HOOKS_SRC, `${slug}.test.ts`))
    ? `packages/hooks/src/${slug}.test.ts`
    : undefined;

  hooks.push({
    slug,
    name,
    route: `/docs/hooks/${slug}`,
    signature,
    description,
    types: typeAliases,
    sourcePath: `packages/hooks/src/${file}`,
    githubUrl: `${GITHUB_BLOB}/packages/hooks/src/${file}`,
    nativePath,
    sharedPath,
    testPath,
  });
}

writeFileSync(
  OUT,
  `${JSON.stringify({ generatedBy: "scripts/docs/build-hooks.mjs", hooks }, null, 2)}\n`,
  "utf8",
);

const split = hooks.filter((h) => h.nativePath).length;
console.log(`[hooks] ${hooks.length} hooks · ${split} with a native implementation`);
