#!/usr/bin/env node
/**
 * build-tokens.mjs
 * ----------------
 * Extracts the design system's numbers — token scales, the control sizing table,
 * motion tokens, breakpoints — so the Foundations pages render the REAL values.
 *
 * These tables are the kit's contract, and a docs page that restates them by hand
 * is a page that is wrong after the next tune. Everything here is read out of the
 * source with the same static evaluator the story registry uses: `scales.ts` and
 * friends are plain literal objects, and evaluating them statically means the docs
 * never have to import (and therefore never have to boot) the Tamagui config on
 * the server, which is a known module-eval hazard.
 *
 * Sources:
 *   packages/core/src/config/scales.ts        space · radius · size · font · line heights · breakpoints
 *   packages/core/src/config/tokens.ts        zIndex
 *   packages/core/src/config/motion.ts        durations · easings
 *   packages/components/src/internal/control-metrics.ts   the size ladder
 *
 * Writes: apps/docs/src/generated/tokens.json
 *
 * Usage: node scripts/docs/build-tokens.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { collectTopLevelConsts, evalNode, leadingDoc, ts } from "./lib/ts-eval.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const OUT = join(REPO_ROOT, "apps/docs/src/generated/tokens.json");

/** Parse a file and statically evaluate the named top-level consts in it. */
function readConsts(relativePath, names) {
  const path = join(REPO_ROOT, relativePath);
  const text = readFileSync(path, "utf8");
  const sourceFile = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const scope = collectTopLevelConsts(sourceFile);

  const out = {};
  for (const name of names) {
    const node = scope.get(name);
    out[name] = node ? evalNode(node, sourceFile, scope) : undefined;
  }
  return out;
}

/** The prose above a declaration — the design rationale, already written. */
function readDoc(relativePath, name) {
  const path = join(REPO_ROOT, relativePath);
  const text = readFileSync(path, "utf8");
  const sourceFile = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations[0];
    if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
      return leadingDoc(statement, sourceFile);
    }
  }
  return undefined;
}

const SCALES = "packages/core/src/config/scales.ts";
const scales = readConsts(SCALES, [
  "spacing",
  "radius",
  "size",
  "font",
  "lineHeightRatios",
  "breakpoints",
]);

const { tokens } = readConsts("packages/core/src/config/tokens.ts", ["tokens"]);
const motion = readConsts("packages/core/src/config/motion.ts", ["DURATIONS", "EASINGS"]);
const { controlMetrics } = readConsts("packages/components/src/internal/control-metrics.ts", [
  "controlMetrics",
]);

// `tokens` is a `createTokens({…})` call, so the literal we want is its argument.
const zIndex = tokens?.$expr ? undefined : tokens?.zIndex;

const data = {
  generatedBy: "scripts/docs/build-tokens.mjs",
  scales: {
    space: scales.spacing,
    radius: scales.radius,
    size: scales.size,
    fontSize: scales.font,
    lineHeight: scales.lineHeightRatios,
  },
  breakpoints: scales.breakpoints,
  zIndex: zIndex ?? { 0: 0, 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
  motion: {
    durations: motion.DURATIONS,
    easings: motion.EASINGS,
  },
  controlMetrics,
  notes: {
    lineHeight: readDoc(SCALES, "lineHeightRatios"),
    controlMetrics: readDoc(
      "packages/components/src/internal/control-metrics.ts",
      "controlMetrics",
    ),
    durations: readDoc("packages/core/src/config/motion.ts", "DURATIONS"),
  },
};

writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`, "utf8");

const scaleKeys = Object.keys(data.scales).length;
const sizes = Object.keys(controlMetrics ?? {}).length;
console.log(
  `[tokens] ${scaleKeys} scales · ${sizes} control sizes · ${Object.keys(data.motion.durations ?? {}).length} durations`,
);
