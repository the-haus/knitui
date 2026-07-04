import { createRequire } from "node:module";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";
import { parseSync } from "svgson";

/**
 * Generates the cross-platform emoji surface from the raw `@iconify-json/noto`
 * data only (Google Noto Emoji, color). The Iconify set is a single JSON of
 * `{ prefix, icons: { name: { body, width?, height?, left?, top? } }, width,
 * height }`; each `body` is the inner SVG markup (paths + `<defs>` gradients).
 * Noto is authored on a 128px grid and uses gradients but no `<filter>` stacks,
 * so it renders identically on web and `react-native-svg`.
 *
 * Every emoji's SVG is parsed ONCE here (`svgson`) into a render-ready node tree
 * — attributes camelCased to the form React DOM and `react-native-svg` both
 * accept, inline `style` strings converted to objects, and all ids namespaced —
 * and inlined into one component module per emoji. So on the device there is NO
 * XML parsing (unlike `SvgXml`) and no runtime dependency on the iconify data.
 *
 * Regenerate after bumping `@iconify-json/noto`:
 *   pnpm --filter @knitui/emoji generate
 */

const require = createRequire(import.meta.url);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(root, "src", "emojis");

/** `1st-place-medal` -> `1stPlaceMedal`, `grinning-face` -> `GrinningFace`. */
function pascalCase(slug) {
  return slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

/** `stroke-width` -> `strokeWidth`, `color-interpolation-filters` -> `colorInterpolationFilters`. */
function camelCase(attr) {
  return attr.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
}

/**
 * Namespace every id declared in an emoji body so that dropping many emoji on
 * one web page can't cross-wire their `url(#…)` gradient/clip references — the
 * Noto set reuses short ids (`a`, `b`, …) across thousands of icons, and
 * on the web all inlined `<svg>` share one document id space. Native
 * (`react-native-svg`) parses each emoji into an isolated tree, but prefixing is
 * harmless there too. Intra-emoji ids stay unique, so a single per-emoji prefix
 * preserves every internal reference. Done on the raw string before parsing so
 * `id="x"`, `url(#x)` and `href="#x"` are all covered uniformly.
 */
function namespaceIds(body, prefix) {
  const ids = new Set();
  for (const match of body.matchAll(/\bid="([^"]+)"/g)) ids.add(match[1]);
  if (ids.size === 0) return body;

  let out = body;
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`\\bid="${esc}"`, "g"), `id="${prefix}${id}"`)
      .replace(new RegExp(`url\\(#${esc}\\)`, "g"), `url(#${prefix}${id})`)
      .replace(new RegExp(`(\\bxlink:href|\\bhref)="#${esc}"`, "g"), `$1="#${prefix}${id}"`);
  }
  return out;
}

/** `"a:b;c-d:e"` -> `{ a: "b", cD: "e" }`. Rare (a handful of emoji use inline style). */
function parseStyle(value) {
  const out = {};
  for (const decl of value.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const key = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (key) out[camelCase(key)] = val;
  }
  return out;
}

/** Normalize a parsed attribute map to props React DOM and react-native-svg both accept. */
function normalizeAttrs(attributes) {
  const props = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "class") continue; // dropped — Noto bodies carry none anyway
    if (key === "style") {
      props.style = parseStyle(value);
    } else if (key === "xlink:href") {
      // `<use>` references. Both React DOM and react-native-svg take the modern
      // `href`; the deprecated `xlink:href` warns/no-ops. Don't clobber a real
      // `href` if the element carries both (they point at the same symbol).
      if (props.href === undefined) props.href = value;
    } else {
      props[camelCase(key)] = value;
    }
  }
  return props;
}

/** Compile an `svgson` element into a compact `[tag, props, children?]` tuple. */
function compileNode(node) {
  const props = normalizeAttrs(node.attributes ?? {});
  const children = (node.children ?? [])
    .filter((child) => child.type === "element")
    .map(compileNode);
  return children.length ? [node.name, props, children] : [node.name, props];
}

function buildEmoji(iconset, name, index) {
  const icon = iconset.icons[name];
  const width = icon.width ?? iconset.width ?? 32;
  const height = icon.height ?? iconset.height ?? 32;
  const left = icon.left ?? 0;
  const top = icon.top ?? 0;
  const viewBox = `${left} ${top} ${width} ${height}`;
  // Compact, collision-free per-emoji id prefix, e.g. `e1f-` (index in base36).
  const body = namespaceIds(icon.body, `e${index.toString(36)}-`);
  const svg = parseSync(`<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`);
  const nodes = svg.children.filter((child) => child.type === "element").map(compileNode);
  const component = `Emoji${pascalCase(name)}`;
  return { name, component, viewBox, nodes };
}

/**
 * The compiled artwork is emitted as plain `.js` (not `.ts`) with a tiny sibling
 * `.d.ts`. This is the crux of the package's performance: each module inlines a
 * large geometry literal (Noto Emoji is detailed, gradient-rich art), and
 * feeding ~3k of those through `tsc` as `.ts` OOMs the type checker and would tax
 * every consumer's build. As `.js`, `tsc` never parses the geometry — it reads
 * only the ~120-byte declaration — while bundlers still tree-shake per import
 * (`/*#__PURE__*\/` + `sideEffects:false`). The registry/barrel stay `.ts` and
 * resolve these modules through their cheap `.d.ts`.
 */
function emojiSourceJs({ name, component, viewBox, nodes }) {
  return `import { createEmoji } from "../internal/create-emoji";

export const ${component} = /*#__PURE__*/ createEmoji(
  "${name}",
  "${component}",
  ${JSON.stringify({ viewBox, nodes })},
);

export default ${component};
`;
}

function emojiSourceDts({ component }) {
  return `import type { EmojiComponent } from "../types";

export declare const ${component}: EmojiComponent;
export default ${component};
`;
}

function indexSource(emojis) {
  const exports = emojis.map(
    ({ component }) => `export { ${component} } from "./emojis/${component}";`,
  );

  return `export type { EmojiComponent, EmojiGeometry, EmojiNode, EmojiProps } from "./types";
export { Emoji } from "./Emoji";
export { EmojiProvider, useEmojiContext } from "./internal/emoji-context";
export type { EmojiContextValue, EmojiProviderProps } from "./internal/emoji-context";
export type { EmojiName } from "./registry";
export { emojiRegistry } from "./registry";

${exports.join("\n")}
`;
}

function registrySource(emojis) {
  const entries = emojis.map(
    ({ name, component }) => `  "${name}": () => import("./emojis/${component}"),`,
  );

  return `import type { EmojiComponent } from "./types";

type EmojiLoader = () => Promise<{ default: EmojiComponent }>;

/**
 * Maps a kebab-case emoji name to a lazy loader. Used by the dynamic \`Emoji\`
 * component so a runtime name resolves to a code-split emoji module.
 */
export const emojiRegistry = {
${entries.join("\n")}
} satisfies Record<string, EmojiLoader>;

export type EmojiName = keyof typeof emojiRegistry;
`;
}

function registryNativeSource(emojis) {
  const entries = emojis.map(
    ({ name, component }) => `  "${name}": () => require("./emojis/${component}").default,`,
  );

  return `import type { EmojiComponent } from "./types";

type EmojiLoader = () => EmojiComponent;

/**
 * Native registry. Mirrors \`registry.ts\` but resolves each emoji with a
 * synchronous \`require\` instead of \`import()\`. On React Native every emoji is
 * already in the Metro bundle, so the dynamic \`Emoji\` component can render
 * without a Suspense boundary. The \`require\` sits inside the thunk, so each
 * module is still only evaluated the first time its emoji is used.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
export const emojiRegistry = {
${entries.join("\n")}
} satisfies Record<string, EmojiLoader>;

export type EmojiName = keyof typeof emojiRegistry;
`;
}

const iconset = require("@iconify-json/noto/icons.json");

const names = Object.keys(iconset.icons).sort();
const emojis = names.map((name, index) => buildEmoji(iconset, name, index));

const seen = new Set();
for (const emoji of emojis) {
  if (seen.has(emoji.component)) {
    throw new Error(`Duplicate emoji component name: ${emoji.component} (from "${emoji.name}")`);
  }
  seen.add(emoji.component);
}

await rm(outputDir, { force: true, recursive: true });
await mkdir(outputDir, { recursive: true });

await Promise.all(
  emojis.flatMap((emoji) => [
    writeFile(join(outputDir, `${emoji.component}.js`), emojiSourceJs(emoji)),
    writeFile(join(outputDir, `${emoji.component}.d.ts`), emojiSourceDts(emoji)),
  ]),
);

// The barrel + registries are real `.ts` source (imported and typechecked), so
// format them with the repo's Prettier config — otherwise their generated shape
// (e.g. fully-quoted object keys) trips `prettier/prettier` on lint. The `.js`
// emoji data modules are eslint-ignored, so they're written raw above.
const writeTs = async (path, source) => {
  const cfg = await resolveConfig(path);
  return writeFile(path, await format(source, { ...cfg, parser: "typescript", filepath: path }));
};

await Promise.all([
  writeTs(join(root, "src", "index.ts"), indexSource(emojis)),
  writeTs(join(root, "src", "registry.ts"), registrySource(emojis)),
  writeTs(join(root, "src", "registry.native.ts"), registryNativeSource(emojis)),
]);

console.log(
  `Generated ${emojis.length} cross-platform Noto emoji ` +
    `(source: @iconify-json/noto@${require("@iconify-json/noto/package.json").version}).`,
);
