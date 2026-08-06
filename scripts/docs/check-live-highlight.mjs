#!/usr/bin/env node
/**
 * check-live-highlight.mjs
 * ------------------------
 * Keeps the two highlighters honest with each other.
 *
 * Prose fences and story sources are highlighted by Shiki at build time
 * (`apps/docs/src/lib/highlight.ts`). The playground's snippet cannot be: it is
 * regenerated in the browser from the live args, so it goes through the hand-
 * rolled scanner in `apps/docs/src/lib/live-highlight.ts` instead. Two
 * highlighters on one page only works while they agree.
 *
 * So this prints the real playground snippet for every component in the registry
 * — the same `toJsx` the page calls, over the same args — highlights each one
 * both ways, and compares colour per character. Anything the scanner gets wrong
 * is reported with the offending text.
 *
 * A snippet may legitimately fall back to plain (the scanner is deliberately
 * conservative), so uncoloured-where-Shiki-colours is reported as a note; a
 * WRONG colour is a failure.
 *
 * Exit code 1 on any failure. `--warn` reports without failing.
 *
 * Usage: node scripts/docs/check-live-highlight.mjs [--warn] [--verbose]
 */
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createHighlighter } from "shiki";

// The site's modules are written for a bundler (`import "./markers"`), so give
// Node an extension hook before importing them.
register("./lib/ts-resolve.mjs", import.meta.url);

const { toJsx } = await import("../../apps/docs/src/lib/jsx-print.ts");
const { TOKEN_COLORS, tokenize } = await import("../../apps/docs/src/lib/live-highlight.ts");

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const GENERATED = join(REPO_ROOT, "apps/docs/src/generated");

const warnOnly = process.argv.includes("--warn");
const verbose = process.argv.includes("--verbose");

/**
 * Snippets that aren't produced from the registry: the theme builder's config
 * output, and a handful of shapes the playground can print but no story happens
 * to use today.
 */
const EXTRA_SAMPLES = [
  [
    "theme-builder",
    "code",
    [
      `import { createTheme } from "@knitui/core";`,
      ``,
      `export const config = createTheme({`,
      `  brand: "#5b8def",`,
      `  radius: "rounded",`,
      `  space: "cozy",`,
      `});`,
    ].join("\n"),
  ],
  ["template-literal", "jsx", "<Slider label={(value) => `${value}%`} step={0.5} />"],
  ["comment", "jsx", "<Box\n  // the default\n  padding={4}\n/>"],
  ["fragment", "jsx", "<Group>\n  <>\n    <Text>a</Text>\n  </>\n</Group>"],
];

/* ------------------------------------------------------------------ corpus */

const registry = JSON.parse(readFileSync(join(GENERATED, "registry.json"), "utf8"));

/** Every component's playground snippet, exactly as the page prints it. */
function playgroundSnippets() {
  const samples = [];
  for (const entry of registry.entries) {
    const story =
      entry.stories.find((s) => s.name === "Playground") ??
      entry.stories.find((s) => s.args) ??
      entry.stories[0];
    if (!story) continue;
    const args = { ...entry.args, ...story.args };
    samples.push([
      `${entry.id}:${story.name}`,
      "jsx",
      toJsx(entry.componentName ?? "Component", args),
    ]);
  }
  return samples;
}

/* ------------------------------------------------------------- comparison */

const unescapeHtml = (text) =>
  text
    .replace(/&#x3C;/g, "<")
    .replace(/&#x26;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

/** Shiki's HTML back into one light colour per character. */
function shikiColors(html) {
  const body = html.slice(html.indexOf("<code>") + "<code>".length, html.lastIndexOf("</code>"));
  const colors = [];
  body
    .split('<span class="line">')
    .slice(1)
    .forEach((line, index) => {
      if (index) colors.push({ char: "\n", color: null });
      const tokens = line.slice(0, line.lastIndexOf("</span>"));
      const pattern = /<span style="--shiki-light:(#[0-9A-Fa-f]+);[^"]*">([^<]*)<\/span>/g;
      let match;
      while ((match = pattern.exec(tokens))) {
        for (const char of unescapeHtml(match[2])) {
          colors.push({ char, color: match[1].toLowerCase() });
        }
      }
    });
  return colors;
}

/** Our scanner's tokens, likewise one light colour per character. */
function liveColors(code, lang) {
  const colors = [];
  for (const token of tokenize(code, lang)) {
    for (const char of token.text) colors.push({ char, color: TOKEN_COLORS[token.kind][0] });
  }
  return colors;
}

const PLAIN = TOKEN_COLORS.plain[0];

const highlighter = await createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["tsx"],
});

const failures = [];
const notes = [];
let checked = 0;

for (const [label, lang, code] of [...playgroundSnippets(), ...EXTRA_SAMPLES]) {
  if (!code.trim()) continue;
  checked += 1;

  const expected = shikiColors(
    highlighter.codeToHtml(code, {
      lang: "tsx",
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    }),
  );
  const actual = liveColors(code.trim(), lang);

  const wrong = [];
  let fellBack = 0;
  for (let index = 0; index < Math.max(expected.length, actual.length); index += 1) {
    const shiki = expected[index];
    const live = actual[index];
    if (!shiki || !live || shiki.char !== live.char) {
      wrong.push(
        `text drift at ${index}: shiki=${JSON.stringify(shiki?.char)} live=${JSON.stringify(live?.char)}`,
      );
      break;
    }
    if (!shiki.color || !shiki.char.trim() || shiki.color === live.color) continue;
    if (live.color === PLAIN) fellBack += 1;
    else
      wrong.push(
        `${JSON.stringify(shiki.char)} at ${index}: shiki=${shiki.color} live=${live.color}`,
      );
  }

  if (wrong.length) failures.push(`${label}\n    ${wrong.slice(0, 6).join("\n    ")}`);
  else if (fellBack) notes.push(`${label}: ${fellBack} char(s) left uncoloured`);
  else if (verbose) console.log(`ok  ${label}`);
}

console.log(`\nchecked ${checked} snippet(s) against Shiki`);
for (const note of notes) console.log(`  note  ${note}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);

if (failures.length && !warnOnly) {
  console.error(`\n${failures.length} snippet(s) highlighted differently from Shiki.`);
  process.exit(1);
}
console.log(failures.length ? "\n(warn only)" : "\nlive highlighter agrees with Shiki.");
