#!/usr/bin/env node
// Naming guardrail: fails if the old "acme" brand (any case) reappears, or if a
// package is added under a scope other than @knitui. Runs over staged files by
// default (pre-commit); pass --all to scan the whole tree (CI).
import { execSync } from "node:child_process";
import fs from "node:fs";

const ALL = process.argv.includes("--all");

// Binary / vendored paths we never scan.
const IGNORE = [
  /(^|\/)node_modules\//,
  /(^|\/)\.git\//,
  /(^|\/)lib\//,
  /(^|\/)dist\//,
  /(^|\/)\.turbo\//,
  /(^|\/)\.expo\//,
  /(^|\/)\.next\//,
  /(^|\/)patches\//, // upstream package patches keep their own names
  /pnpm-lock\.yaml$/,
  /\.(png|jpg|jpeg|gif|webp|ico|svg|ttf|otf|woff2?|mp3|mp4|wav|pdf|lock)$/i,
];

// This guardrail file legitimately contains the word for the regex below.
const SELF = "scripts/check-naming.mjs";

const FORBIDDEN = /acme/i;

function listFiles() {
  const cmd = ALL ? "git ls-files" : "git diff --cached --name-only --diff-filter=ACMR";
  return execSync(cmd, { encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((f) => f !== SELF)
    .filter((f) => !IGNORE.some((re) => re.test(f)));
}

const offenders = [];
for (const file of listFiles()) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue; // deleted / unreadable
  }
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (FORBIDDEN.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
  });
}

if (offenders.length) {
  console.error('\n✖ Naming guardrail failed — the retired "acme" brand is not allowed.');
  console.error('  Use the "knitui" / "Knit UI" brand and the @knitui/* scope instead.\n');
  console.error(offenders.slice(0, 40).join("\n"));
  if (offenders.length > 40) console.error(`  … and ${offenders.length - 40} more`);
  console.error("");
  process.exit(1);
}

console.log(`✔ Naming guardrail passed (${ALL ? "full tree" : "staged files"}).`);
