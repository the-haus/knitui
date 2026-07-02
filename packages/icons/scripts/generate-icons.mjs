import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Generates the cross-platform icon surface from the raw `@tabler/icons`
 * package only. The node data is read from Tabler's `tabler-nodes-*.json`
 * files and inlined into one component module per icon, so the published kit
 * carries no runtime dependency on `@tabler/icons-react(-native)`.
 *
 * Regenerate after bumping `@tabler/icons`:
 *   pnpm --filter @knitui/icons generate
 */

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const workspace = dirname(dirname(root));
const tablerDir = join(workspace, "node_modules", "@tabler", "icons");
const outputDir = join(root, "src", "icons");

/** `a-b-2` -> `AB2`, `rectangle-vertical` -> `RectangleVertical`, `jpg` -> `Jpg`. */
function pascalCase(slug) {
  return slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

/** Mirror of the original kebab key used by the icon registry (e.g. `IconAB2` -> `ab-2`). */
function toKebabCase(componentName) {
  return componentName
    .replace(/^Icon/, "")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    .replace(/(\d)([a-zA-Z])/g, "$1-$2")
    .toLowerCase();
}

async function loadNodes(file) {
  return JSON.parse(await readFile(join(tablerDir, file), "utf8"));
}

/** Paint = every attribute except the `d` geometry, normalized to a stable key. */
function paintEntries(attrs) {
  return Object.entries(attrs)
    .filter(([key]) => key !== "d")
    .sort(([a], [b]) => a.localeCompare(b));
}

function paintKey(attrs) {
  return JSON.stringify(paintEntries(attrs));
}

/**
 * Compiles Tabler's `[tag, attrs]` node list into render-ready geometry.
 *
 * Consecutive `<path>` nodes that share the same paint are merged into a single
 * path by concatenating their `d` data. This is lossless: every subpath begins
 * with a moveto, so stroking each subpath is identical whether they live in one
 * `<path>` or many, and Tabler uses nonzero winding throughout (no `evenodd`),
 * so non-overlapping filled subpaths union cleanly. Grouping is *consecutive*
 * only, so paint order (z-order) is preserved exactly.
 *
 * Returns a bare merged string for the common single-paint icon, or a short
 * ordered `PathSpec[]` for the ~96 icons that mix paints (dice dots,
 * `percentage-*`, `square-rounded-*`, …).
 */
function compile(component, nodes) {
  const groups = [];
  for (const [tag, attrs] of nodes) {
    if (tag !== "path") {
      // Every Tabler node is a <path> today. If that ever changes, fail loudly
      // here rather than silently dropping geometry — add a tag→`d` converter.
      throw new Error(`${component}: unsupported node <${tag}> — generator only handles <path>`);
    }
    const key = paintKey(attrs);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.d += ` ${attrs.d}`;
    } else {
      groups.push({ key, d: attrs.d, paint: Object.fromEntries(paintEntries(attrs)) });
    }
  }

  if (groups.length === 1 && groups[0].key === "[]") {
    return groups[0].d;
  }
  return groups.map((group) => ({ d: group.d, ...group.paint }));
}

/**
 * Independent property check that `compile` neither lost, added, reordered, nor
 * re-painted any geometry. Implemented separately from `compile` (run-length
 * encoding vs. consecutive grouping) so a bug in one is caught by the other.
 */
function verify(component, nodes, geometry) {
  const specs = typeof geometry === "string" ? [{ d: geometry }] : geometry;

  // 1. Concatenating all `d` data must be byte-identical → nothing lost/added/reordered.
  const expectedD = nodes.map(([, attrs]) => attrs.d).join(" ");
  const actualD = specs.map((spec) => spec.d).join(" ");
  if (expectedD !== actualD) {
    throw new Error(`${component}: merged path data diverged from source`);
  }

  // 2. The run-length-encoded paint sequence must match the emitted groups → paint preserved.
  const expectedRuns = [];
  for (const [, attrs] of nodes) {
    const key = paintKey(attrs);
    if (expectedRuns[expectedRuns.length - 1] !== key) expectedRuns.push(key);
  }
  const actualRuns = specs.map((spec) => paintKey(spec));
  if (JSON.stringify(expectedRuns) !== JSON.stringify(actualRuns)) {
    throw new Error(`${component}: paint grouping diverged from source`);
  }
}

function buildIcons(nodesBySlug, type) {
  return Object.entries(nodesBySlug).map(([slug, nodes]) => {
    const pascal = type === "filled" ? `${pascalCase(slug)}Filled` : pascalCase(slug);
    const component = `Icon${pascal}`;
    const geometry = compile(component, nodes);
    verify(component, nodes, geometry);
    return {
      type,
      // Tabler's class slug, e.g. `a-b-2` (outline) or `ad-filled` (filled).
      iconName: type === "filled" ? `${slug}-filled` : slug,
      component,
      registryKey: toKebabCase(component),
      geometry,
    };
  });
}

function iconSource({ type, iconName, component, geometry }) {
  return `import { createIcon } from "../internal/create-icon";

export const ${component} = /*#__PURE__*/ createIcon(
  "${type}",
  "${iconName}",
  "${component}",
  ${JSON.stringify(geometry)},
);

export default ${component};
`;
}

function indexSource(icons) {
  const exports = icons.map(
    ({ component }) => `export { ${component} } from "./icons/${component}";`,
  );

  // Note: \`IconGeometry\`/\`PathSpec\` are intentionally not re-exported here —
  // they are internal compile types, and \`IconGeometry\` would collide with the
  // \`IconGeometry\` icon component (Tabler ships a "geometry" glyph).
  return `export type { IconComponent, IconNode, IconProps, IconType } from "./types";
export { Icon } from "./Icon";
export { IconProvider, useIconContext } from "./internal/icon-context";
export type { IconContextValue, IconProviderProps } from "./internal/icon-context";
export type { IconName } from "./registry";
export { iconRegistry } from "./registry";

${exports.join("\n")}
`;
}

function registrySource(icons) {
  const entries = icons.map(
    ({ registryKey, component }) => `  "${registryKey}": () => import("./icons/${component}"),`,
  );

  return `import type { IconComponent } from "./types";

type IconLoader = () => Promise<{ default: IconComponent }>;

/**
 * Maps a kebab-case icon name to a lazy loader. Used by the dynamic \`Icon\`
 * component so a runtime name resolves to a code-split icon module.
 */
export const iconRegistry = {
${entries.join("\n")}
} satisfies Record<string, IconLoader>;

export type IconName = keyof typeof iconRegistry;
`;
}

function registryNativeSource(icons) {
  const entries = icons.map(
    ({ registryKey, component }) =>
      `  "${registryKey}": () => require("./icons/${component}").default,`,
  );

  return `import type { IconComponent } from "./types";

type IconLoader = () => IconComponent;

/**
 * Native registry. Mirrors \`registry.ts\` but resolves each icon with a
 * synchronous \`require\` instead of \`import()\`. On React Native every icon is
 * already in the Metro bundle, so the dynamic \`Icon\` component can render
 * without a Suspense boundary. The \`require\` sits inside the thunk, so each
 * module is still only evaluated the first time its icon is used.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
export const iconRegistry = {
${entries.join("\n")}
} satisfies Record<string, IconLoader>;

export type IconName = keyof typeof iconRegistry;
`;
}

const [outline, filled] = await Promise.all([
  loadNodes("tabler-nodes-outline.json"),
  loadNodes("tabler-nodes-filled.json"),
]);

const icons = [...buildIcons(outline, "outline"), ...buildIcons(filled, "filled")].sort((a, b) =>
  a.component.localeCompare(b.component),
);

const seen = new Set();
for (const icon of icons) {
  if (seen.has(icon.registryKey)) {
    throw new Error(`Duplicate registry key: ${icon.registryKey}`);
  }
  seen.add(icon.registryKey);
}

await rm(outputDir, { force: true, recursive: true });
await mkdir(outputDir, { recursive: true });

await Promise.all(
  icons.map((icon) => writeFile(join(outputDir, `${icon.component}.ts`), iconSource(icon))),
);

await Promise.all([
  writeFile(join(root, "src", "index.ts"), indexSource(icons)),
  writeFile(join(root, "src", "registry.ts"), registrySource(icons)),
  writeFile(join(root, "src", "registry.native.ts"), registryNativeSource(icons)),
]);

console.log(
  `Generated ${icons.length} cross-platform Tabler icons ` +
    `(${Object.keys(outline).length} outline, ${Object.keys(filled).length} filled).`,
);
