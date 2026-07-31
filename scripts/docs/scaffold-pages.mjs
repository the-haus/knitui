#!/usr/bin/env node
/**
 * scaffold-pages.mjs
 * ------------------
 * Writes a starting MDX page for every component in the registry that doesn't
 * have one yet.
 *
 * There are ~180 documented components across ten packages; hand-creating a file
 * per component is busywork, and hand-maintaining the boilerplate inside them is
 * drift waiting to happen. So each scaffold is deliberately thin — a `meta`
 * export plus the generated sections:
 *
 *   <ComponentHeader id="…" />   masthead, badges, source links, import snippet
 *   <Playground id="…" />        live story + controls generated from argTypes
 *   <Examples id="…" />          every other story, live, with source
 *   <PropsTable id="…" />        props, slots, inherited-style count
 *
 * Everything on the page therefore comes from the story file and the TypeScript
 * types. Prose (what it's for, when NOT to use it, accessibility, platform notes)
 * is then written BY HAND on top — see `content/docs/components/inputs/button.mdx`
 * for the worked example.
 *
 * Existing files are never overwritten: this is a scaffolder, not a formatter.
 * Pass `--force` to rewrite untouched scaffolds (files still carrying the marker).
 *
 * Usage: node scripts/docs/scaffold-pages.mjs [--force] [--package=components]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const CONTENT_DIR = join(REPO_ROOT, "apps/docs/content");
const REGISTRY = join(REPO_ROOT, "apps/docs/src/generated/registry.json");

/** Marks a page as untouched scaffolding, so `--force` can safely rewrite it. */
const SCAFFOLD_MARKER = "{/* scaffolded: replace this comment with real prose */}";

const args = process.argv.slice(2);
const force = args.includes("--force");
const packageFilter = args.find((a) => a.startsWith("--package="))?.slice("--package=".length);

const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));

const collapse = (text) => text.replace(/\s+/g, " ").trim();

let written = 0;
let skipped = 0;

for (const entry of registry.entries) {
  if (entry.internal) continue;
  if (packageFilter && entry.package !== packageFilter) continue;

  const file = join(CONTENT_DIR, `${entry.id.split("/").join("/")}.mdx`);
  const target = file.replace(`${CONTENT_DIR}/`, `${CONTENT_DIR}/docs/`);

  if (existsSync(target)) {
    const existing = readFileSync(target, "utf8");
    if (!force || !existing.includes(SCAFFOLD_MARKER)) {
      skipped += 1;
      continue;
    }
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, page(entry), "utf8");
  written += 1;
}

console.log(`[scaffold] wrote ${written} pages, left ${skipped} existing pages alone`);

/** The scaffolded page body for one registry entry. */
function page(entry) {
  const description =
    entry.description ??
    `${entry.name} — part of ${entry.packageName}. ${entry.stories.length} live examples.`;

  // Satellite packages carry heavier runtime caveats worth stating up front.
  const platformNote =
    entry.render === "canvas"
      ? '\n<Callout kind="platform">\n  Rendered through Skia. On the web each canvas holds a WebGL context and browsers\n  cap how many can be live at once, so examples on this page mount one at a time.\n</Callout>\n'
      : entry.render === "media"
        ? '\n<Callout kind="platform">\n  `@knitui/media` owns a single shared player element per medium, teleported into\n  whichever surface is active — so examples on this page play one at a time.\n</Callout>\n'
        : entry.render === "fullbleed"
          ? '\n<Callout kind="platform">\n  Map views fill their container rather than sizing to content; every example here\n  is given an explicit height.\n</Callout>\n'
          : "";

  return `export const meta = {
  title: ${JSON.stringify(entry.name)},
  description: ${JSON.stringify(collapse(description))},
};

<ComponentHeader id="${entry.id}" />

${SCAFFOLD_MARKER}
${platformNote}
## Playground

<Playground id="${entry.id}" />

<Examples id="${entry.id}" />

<PropsTable id="${entry.id}" />
`;
}
