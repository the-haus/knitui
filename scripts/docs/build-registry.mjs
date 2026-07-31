#!/usr/bin/env node
/**
 * build-registry.mjs
 * ------------------
 * Builds the docs site's spine: one entry per Storybook story module in the
 * workspace, describing the component it documents, its route, its stories, its
 * controls, and how it must be rendered.
 *
 * Everything the docs site knows about a component starts here. Nothing in
 * `apps/docs` hardcodes a component list — the story files ARE the source of
 * truth, so a new component with a story shows up in the docs automatically (and
 * `check-coverage.mjs` fails the build if it has no page).
 *
 * Reads:  packages/&#42;/src/&#42;&#42;/&#42;.stories.tsx  (parsed, never executed — see lib/ts-eval.mjs)
 * Writes: apps/docs/src/generated/registry.json
 *         apps/docs/src/generated/story-modules.ts   (client-side lazy import map)
 *
 * The story `title:` is the route. `Inputs/Button` in @knitui/components becomes
 * `/docs/components/inputs/button`, which is what makes the docs IA and the
 * Storybook sidebar the same taxonomy by construction.
 *
 * Usage: node scripts/docs/build-registry.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";

import {
  collectTopLevelConsts,
  evalNode,
  findMetaNode,
  findStoryExports,
  getProperty,
  isFn,
  isMarker,
  isRef,
  leadingDoc,
  markerSource,
  ts,
} from "./lib/ts-eval.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const OUT_DIR = join(REPO_ROOT, "apps/docs/src/generated");
const GITHUB_BLOB = "https://github.com/the-haus/knitui/blob/main";
const STORYBOOK_BASE = "https://the-haus.github.io/knitui";

/**
 * Packages that ship stories, with the docs-site metadata for each.
 *
 * `render` is how the docs page must mount a story, and it encodes hard runtime
 * constraints rather than taste (the same ones `generate-demo-sections.mjs`
 * encodes for the device gallery):
 *
 *   stack      — all stories stacked on one page (the default)
 *   canvas     — ONE Skia canvas at a time; browsers cap live WebGL contexts (~16)
 *   media      — ONE player at a time; @knitui/media owns a single <audio>/<video>
 *   fullbleed  — story fills its container (maps render `<Map style={{flex:1}}>`)
 *   browser    — thousands of generated glyphs; docs renders a searchable browser
 */
const PACKAGES = {
  components: { title: "Components", render: "stack" },
  dates: { title: "Dates", render: "stack" },
  carousel: { title: "Carousel", render: "stack" },
  sheet: { title: "Sheet", render: "stack" },
  mediaquery: { title: "Media Query", render: "stack" },
  media: { title: "Media", render: "media" },
  graphics: { title: "Graphics", render: "canvas", graphicsRuntime: true },
  map: { title: "Map", render: "fullbleed" },
  icons: { title: "Icons", render: "browser" },
  emoji: { title: "Emoji", render: "browser" },
};

/** Title segments that just repeat the package name and shouldn't nest a route. */
const REDUNDANT_TITLE_ROOTS = new Set([
  "dates",
  "carousel",
  "sheet",
  "mediaquery",
  "media query",
  "media",
  "graphics",
  "icons",
  "emoji",
  "map",
]);

function kebab(input) {
  return input
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/** Recursively collect every `*.stories.tsx` under a directory. */
function findStories(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "lib") continue;
      out.push(...findStories(full));
    } else if (entry.name.endsWith(".stories.tsx")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * `Inputs/Button` in `components` -> route + slug + group + name.
 *
 * The package name always prefixes the route (so `/docs/components/...` vs
 * `/docs/dates/...`). Three de-duplication rules keep the paths readable:
 *   1. a leading title segment that just repeats the package is dropped
 *      (`Dates/Calendar` -> `/docs/dates/calendar`, not `dates/dates/calendar`);
 *   2. consecutive identical segments collapse (`Camera/Camera` -> `camera`);
 *   3. a lone segment equal to the package becomes the package root
 *      (`Carousel` -> `/docs/carousel`).
 */
function resolveRoute(pkg, title, fallbackName) {
  const rawParts = (title ?? "")
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);
  let parts = rawParts.length ? rawParts : [fallbackName];
  if (parts.length > 1 && REDUNDANT_TITLE_ROOTS.has(parts[0].toLowerCase())) parts = parts.slice(1);

  const name = parts[parts.length - 1];
  const group = parts.length > 1 ? parts.slice(0, -1).join(" / ") : PACKAGES[pkg].title;
  // A leading `_` marks a story module that exists to support other stories
  // (e.g. dates' `_Reference/ExampleControl`) — kept in the registry, hidden from nav.
  const internal = parts.some((p) => p.startsWith("_"));
  // The ROUTE collapses a repeated segment (`Camera/Camera` -> `camera`,
  // `Typography/Typography` -> `typography`) while the GROUP above keeps it, so
  // sidebar grouping survives a component whose group matches its own name.
  const segments = parts
    .filter((part, i) => i === 0 || part.toLowerCase() !== parts[i - 1].toLowerCase())
    .map((p) => kebab(p.replace(/^_/, "")));
  const isPackageRoot = segments.length === 1 && segments[0] === pkg;
  const slug = isPackageRoot ? pkg : [pkg, ...segments].join("/");

  return { name, group, internal, slug, route: `/docs/${slug}` };
}

/** Storybook's own story id: `inputs-button--variants`. */
function storybookId(title, storyName) {
  return `${kebab(title ?? "")}--${kebab(storyName)}`;
}

/**
 * The docs snippet for one story: the JSX a reader should copy.
 *
 * A story with a `render` is shown as its render body (the JSX itself, dedented
 * and prettier-formatted). A story without one is a bare component render, so we
 * synthesise `<Component prop={…} />` from the merged args — which is exactly
 * what Storybook would mount.
 */
function buildSnippet({ storyObject, sourceFile, componentName, args }) {
  const renderProp = getProperty(storyObject, "render");
  if (renderProp && ts.isPropertyAssignment(renderProp)) {
    const fn = renderProp.initializer;
    if (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) {
      const body = fn.body;
      let text;
      if (ts.isParenthesizedExpression(body)) text = body.expression.getText(sourceFile);
      else if (ts.isBlock(body)) text = body.getText(sourceFile);
      else text = body.getText(sourceFile);
      return dedent(text);
    }
  }
  if (!componentName) return undefined;
  return renderJsx(componentName, args);
}

/**
 * `<Button variant="filled" size="md">Button</Button>` from a merged args object.
 *
 * An arg the evaluator could only reduce to a marker is printed as its original
 * source text (`icon={<Text>ⓘ</Text>}`, `ratio={16 / 9}`) — never as the marker
 * object itself, which is an implementation detail of the generator.
 */
function renderJsx(componentName, args) {
  const entries = Object.entries(args ?? {}).filter(([, v]) => v !== undefined);
  const children = entries.find(([k]) => k === "children")?.[1];
  const attrs = entries
    .filter(([k]) => k !== "children")
    .map(([key, value]) => {
      if (value === true) return key;
      if (typeof value === "string") return `${key}=${JSON.stringify(value)}`;
      const printed = printValue(value);
      return printed === undefined ? null : `${key}={${printed}}`;
    })
    .filter(Boolean);

  const open = [componentName, ...attrs].join(" ");
  if (typeof children === "string") return `<${open}>${children}</${componentName}>`;
  if (children === undefined) return `<${open} />`;
  if (isMarker(children)) return `<${open}>${asChildren(children)}</${componentName}>`;
  return `<${open}>{/* children */}</${componentName}>`;
}

/** Marker children as JSX: element source verbatim, anything else in braces. */
function asChildren(marker) {
  const source = markerSource(marker);
  return source.startsWith("<") ? source : `{${source}}`;
}

/**
 * One arg value as the JS expression a reader would write.
 *
 * Like `JSON.stringify`, except markers anywhere in the tree — including inside
 * an object or array prop (`data: [{ value, label: <Text>…</Text> }]`) — print as
 * their source text, and object keys stay unquoted where they can. Returns
 * `undefined` for a value with nothing printable (an empty hole in an array).
 * Prettier reformats the result afterwards.
 */
function printValue(value) {
  if (isMarker(value)) return markerSource(value);
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => printValue(item) ?? "undefined").join(", ")}]`;
  }
  if (value && typeof value === "object") {
    const fields = Object.entries(value)
      .map(([key, item]) => {
        const printed = printValue(item);
        return printed === undefined ? null : `${propertyKey(key)}: ${printed}`;
      })
      .filter(Boolean);
    return `{ ${fields.join(", ")} }`;
  }
  return undefined;
}

/** An object key, quoted only when it isn't a bare identifier. */
function propertyKey(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

/** Strip the common leading indentation of a multi-line snippet. */
function dedent(text) {
  const lines = text.replace(/\t/g, "  ").split("\n");
  const indents = lines
    .slice(1)
    .filter((l) => l.trim())
    .map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return [lines[0], ...lines.slice(1).map((l) => l.slice(min))].join("\n").trim();
}

/**
 * Prettier-format a JSX snippet. We wrap it in an assignment so Prettier will
 * accept a bare expression, then unwrap. Formatting failures are never fatal —
 * an unformatted snippet is still a correct snippet.
 */
async function formatSnippet(snippet, prettierConfig) {
  if (!snippet) return snippet;
  if (snippet.startsWith("{")) return snippet; // a `render` block body — already statements
  try {
    const wrapped = await format(`const __snippet = (\n${snippet}\n);\n`, {
      ...prettierConfig,
      parser: "typescript",
    });
    const inner = wrapped.replace(/^const __snippet = \(?\n?/, "").replace(/\)?;\n?$/, "");
    return dedent(inner);
  } catch {
    return snippet;
  }
}

/** Sibling files that make a component page richer when they exist. */
function siblingPaths(storyPath) {
  const base = storyPath.replace(/\.stories\.tsx$/, "");
  const rel = (p) => (existsSync(p) ? relative(REPO_ROOT, p).split(sep).join("/") : undefined);
  return {
    componentPath: rel(`${base}.tsx`),
    testPath: rel(`${base}.test.tsx`),
    nativePath: rel(`${base}.native.tsx`),
  };
}

async function main() {
  const prettierConfig = (await resolveConfig(join(REPO_ROOT, "package.json"))) ?? {};
  const entries = [];
  const seenSlugs = new Map();
  const sources = {};

  for (const [pkg, pkgMeta] of Object.entries(PACKAGES)) {
    const srcDir = join(REPO_ROOT, "packages", pkg, "src");
    for (const file of findStories(srcDir).sort()) {
      const text = readFileSync(file, "utf8");
      const sourceFile = ts.createSourceFile(
        file,
        text,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const scope = collectTopLevelConsts(sourceFile);

      const metaNode = findMetaNode(sourceFile);
      const meta = metaNode ? evalNode(metaNode, sourceFile, scope) : {};

      const relFromSrc = relative(srcDir, file).split(sep).join("/");
      const fallbackName = relFromSrc
        .split("/")
        .pop()
        .replace(/\.stories\.tsx$/, "");
      const { name, group, internal, slug, route } = resolveRoute(pkg, meta.title, fallbackName);

      if (seenSlugs.has(slug)) {
        console.warn(
          `[registry] duplicate route ${route}\n  ${seenSlugs.get(slug)}\n  ${relFromSrc}`,
        );
      }
      seenSlugs.set(slug, relFromSrc);

      const componentName = isRef(meta.component) ? meta.component.$ref : undefined;
      const sourcePath = relative(REPO_ROOT, file).split(sep).join("/");

      const storyExports = findStoryExports(sourceFile);
      const stories = [];
      const storySources = {};

      for (const story of storyExports) {
        const value = evalNode(story.objectLiteral, sourceFile, scope);
        const args = { ...meta.args, ...value.args };
        const snippet = await formatSnippet(
          buildSnippet({ storyObject: story.objectLiteral, sourceFile, componentName, args }),
          prettierConfig,
        );

        stories.push({
          name: story.name,
          description: story.doc ?? storyParamDescription(value),
          hasRender: isFn(value.render),
          args: serialisable(value.args),
          storybookId: storybookId(meta.title, story.name),
        });
        storySources[story.name] = {
          snippet,
          full: dedent(story.node.getText(sourceFile)),
        };
      }

      entries.push({
        id: slug,
        package: pkg,
        packageName: `@knitui/${pkg}`,
        title: meta.title ?? fallbackName,
        group,
        name,
        componentName,
        route,
        internal,
        render: pkgMeta.render,
        graphicsRuntime: pkgMeta.graphicsRuntime ?? false,
        description: metaDescription(meta),
        importPath: `@knitui/${pkg}/src/${relFromSrc.replace(/\.tsx$/, "")}`,
        sourcePath,
        githubUrl: `${GITHUB_BLOB}/${sourcePath}`,
        storybookUrl: `${STORYBOOK_BASE}/${pkg}/?path=/docs/${kebab(meta.title ?? fallbackName)}`,
        ...siblingPaths(file),
        args: serialisable(meta.args),
        argTypes: serialisable(meta.argTypes),
        stories,
      });
      sources[slug] = storySources;
    }
  }

  entries.sort((a, b) => a.id.localeCompare(b.id));

  mkdirSync(OUT_DIR, { recursive: true });
  writeJson(join(OUT_DIR, "registry.json"), {
    generatedBy: "scripts/docs/build-registry.mjs",
    packages: PACKAGES,
    entries,
  });
  writeJson(join(OUT_DIR, "story-sources.json"), sources);
  writeFileSync(join(OUT_DIR, "story-modules.ts"), storyModulesModule(entries), "utf8");

  const storyCount = entries.reduce((n, e) => n + e.stories.length, 0);
  console.log(
    `[registry] ${entries.length} story modules · ${storyCount} stories · ${Object.keys(PACKAGES).length} packages`,
  );
}

/** `parameters.docs.description.component` — the meta-level intro paragraph. */
function metaDescription(meta) {
  const value = meta?.parameters?.docs?.description?.component;
  return typeof value === "string" ? collapse(value) : undefined;
}

/** `parameters.docs.description.story` — the story-level caption. */
function storyParamDescription(story) {
  const value = story?.parameters?.docs?.description?.story;
  return typeof value === "string" ? collapse(value) : undefined;
}

const collapse = (s) => s.replace(/\s+/g, " ").trim();

/** Drop `undefined` and unserialisable cycles; keep markers ($ref/$fn/$expr). */
function serialisable(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return undefined;
  }
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

/**
 * The client-side lazy import map. The docs site never statically imports a
 * story module (that would pull the whole kit into every page) — it looks the id
 * up here and `import()`s on demand, so each component route loads only its own
 * stories as a separate chunk.
 */
function storyModulesModule(entries) {
  const lines = entries
    .map((e) => `  ${JSON.stringify(e.id)}: () => import(${JSON.stringify(e.importPath)}),`)
    .join("\n");

  return `/* eslint-disable */
// GENERATED by scripts/docs/build-registry.mjs — do not edit.
//
// id -> lazy import of that component's Storybook module. Kept as a map of
// thunks so bundlers split every story module into its own chunk and a docs
// route only downloads the stories it actually renders.
import type { StoryModule } from "@knitui/story-runtime";

export const storyModules: Record<string, () => Promise<StoryModule>> = {
${lines}
};

export type StoryModuleId = keyof typeof storyModules;
`;
}

await main();
