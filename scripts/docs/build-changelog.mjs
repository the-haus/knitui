#!/usr/bin/env node
/**
 * build-changelog.mjs
 * -------------------
 * Parses each package's Changesets-generated `CHANGELOG.md` into structured
 * releases, so the docs can show a unified timeline instead of asking readers to
 * open thirteen markdown files on GitHub.
 *
 * Changesets writes a stable shape — `## <version>` headings, then
 * `### Major|Minor|Patch Changes`, then bullet lists — which is what makes this
 * parseable without a markdown AST.
 *
 * Writes: apps/docs/src/generated/changelog.json
 *
 * Usage: node scripts/docs/build-changelog.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const OUT = join(REPO_ROOT, "apps/docs/src/generated/changelog.json");

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

/** Split a Changesets changelog into `{ version, kinds: { minor: [...] } }`. */
function parse(markdown) {
  const releases = [];
  let release;
  let kind = "patch";

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trimEnd();

    const version = /^##\s+(\d+\.\d+\.\d+.*)$/.exec(line);
    if (version) {
      release = { version: version[1].trim(), changes: [] };
      releases.push(release);
      kind = "patch";
      continue;
    }

    const heading = /^###\s+(Major|Minor|Patch)\s+Changes/i.exec(line);
    if (heading) {
      kind = heading[1].toLowerCase();
      continue;
    }

    // Bullets can wrap across lines; a continuation is indented.
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet && release) {
      release.changes.push({ kind, text: clean(bullet[1]) });
      continue;
    }
    if (/^\s{2,}\S/.test(line) && release?.changes.length) {
      const last = release.changes[release.changes.length - 1];
      last.text = clean(`${last.text} ${line.trim()}`);
    }
  }

  return releases.filter((item) => item.changes.length);
}

/**
 * Strip the commit-hash prefix Changesets prepends to each entry
 * (`ab12cd3: feat: …`) — it is noise in a changelog people read.
 */
function clean(text) {
  return text
    .replace(/^[0-9a-f]{7,40}:\s*/i, "")
    .replace(/^Updated dependencies\s*/i, "Updated dependencies")
    .replace(/\s+/g, " ")
    .trim();
}

const packages = [];

for (const pkg of PACKAGES) {
  const path = join(REPO_ROOT, "packages", pkg, "CHANGELOG.md");
  if (!existsSync(path)) continue;
  const releases = parse(readFileSync(path, "utf8"));
  packages.push({ name: `@knitui/${pkg}`, slug: pkg, releases });
}

/**
 * One flat timeline, newest version first per package.
 *
 * There are no dates in a Changesets changelog, so releases cannot be globally
 * ordered by time — the timeline groups by version string instead, which is how
 * the repo actually releases (a version PR bumps several packages at once).
 */
const byVersion = new Map();
for (const pkg of packages) {
  for (const release of pkg.releases) {
    const bucket = byVersion.get(release.version) ?? [];
    bucket.push({ package: pkg.name, changes: release.changes });
    byVersion.set(release.version, bucket);
  }
}

const compare = (a, b) => {
  const parse = (v) => v.split(/[.-]/).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
  const [aa, bb] = [parse(a), parse(b)];
  for (let i = 0; i < Math.max(aa.length, bb.length); i += 1) {
    if (aa[i] === bb[i]) continue;
    if (typeof aa[i] === "number" && typeof bb[i] === "number") return bb[i] - aa[i];
    return String(bb[i] ?? "").localeCompare(String(aa[i] ?? ""));
  }
  return 0;
};

const timeline = [...byVersion.entries()]
  .sort(([a], [b]) => compare(a, b))
  .map(([version, entries]) => ({ version, entries }));

writeFileSync(
  OUT,
  `${JSON.stringify({ generatedBy: "scripts/docs/build-changelog.mjs", packages, timeline }, null, 2)}\n`,
  "utf8",
);

const releaseCount = packages.reduce((n, pkg) => n + pkg.releases.length, 0);
console.log(
  `[changelog] ${releaseCount} releases across ${packages.length} packages · ${timeline.length} versions`,
);
