#!/usr/bin/env node
/**
 * Golden-fixture runner for the v3 codemod.
 *
 *   node scripts/codemods/tamagui-v3/test.mjs [--update] [name-filter]
 *
 * For every `__fixtures__/in/<name>.tsx`:
 *   1. the transformed + prettier-formatted output must equal `out/<name>.tsx`
 *   2. the report (category · line · message) must equal `out/<name>.report.txt`
 *   3. running the codemod again over the output must change nothing (idempotence)
 * A fixture named `consumer-*` runs in `--mode consumer`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformText } from "./engine.mjs";
import { Report } from "./lib/report.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, "__fixtures__");
const update = process.argv.includes("--update");
const filter = process.argv.slice(2).find((a) => !a.startsWith("--"));
const prettier = (await import("prettier")).default;
const config = (await prettier.resolveConfig(path.join(here, "x.tsx"))) ?? {};

async function run(file, text, mode) {
  const report = new Report(fixtures);
  const res = transformText(file, text, {
    report,
    mode,
    styleableModule: (f) => (f.includes("/core-") ? "./styleable" : "@knitui/core"),
  });
  if (res.errors.length) throw new Error(res.errors.join("\n"));
  const out = res.changed ? await prettier.format(res.text, { ...config, filepath: file }) : text;
  return { out, report };
}

let failed = 0;
let passed = 0;
for (const name of fs.readdirSync(path.join(fixtures, "in")).sort()) {
  if (filter && !name.includes(filter)) continue;
  const inFile = path.join(fixtures, "in", name);
  const outFile = path.join(fixtures, "out", name);
  const reportFile = path.join(fixtures, "out", name.replace(/\.\w+$/, ".report.txt"));
  const mode = name.startsWith("consumer-") ? "consumer" : "kit";
  const input = fs.readFileSync(inFile, "utf8");
  const problems = [];
  try {
    const { out, report } = await run(inFile, input, mode);
    const reportText =
      report.entries.map((e) => `${e.category} · ${e.line} · ${e.message ?? ""}`).join("\n") + "\n";
    if (update) {
      fs.writeFileSync(outFile, out);
      fs.writeFileSync(reportFile, reportText);
    } else {
      if (!fs.existsSync(outFile) || fs.readFileSync(outFile, "utf8") !== out)
        problems.push("output differs from golden");
      if (!fs.existsSync(reportFile) || fs.readFileSync(reportFile, "utf8") !== reportText)
        problems.push("report differs from golden");
    }
    const again = await run(outFile.replace(/\.tsx$/, ".tsx"), out, mode);
    if (again.out !== out) problems.push("not idempotent: second run changed the output");
  } catch (err) {
    problems.push(String(err.stack ?? err));
  }
  if (problems.length) {
    failed++;
    console.log(`✗ ${name}\n    ${problems.join("\n    ")}`);
  } else {
    passed++;
    console.log(`✓ ${name}`);
  }
}
console.log(`\n${passed} passed, ${failed} failed${update ? " (goldens updated)" : ""}`);
process.exit(failed ? 1 : 0);
