#!/usr/bin/env node
/**
 * generate-demo-sections.mjs
 * --------------------------
 * Generates `packages/demo/src/sections.generated.tsx` from the Storybook
 * stories that already exist across the workspace, so the shared demo gallery
 * (`@knitui/demo`, rendered by BOTH `apps/web` and the Expo `apps/app`) is a
 * faithful mirror of the web Storybook — giving real iOS/Android parity with no
 * hand-maintained, drifting demo sections.
 *
 * Each `*.stories.tsx` module is a plain CSF module: a default `meta` plus named
 * `StoryObj` exports. We don't transform any code — we just build a registry
 * that lazy-imports each story module and hands it to the generic
 * `StorySection` renderer (see `packages/demo/src/StorySection.tsx`), which
 * applies Storybook's own render/args/decorator semantics at runtime.
 *
 * Scope: every package in {@link PACKAGES}. `graphics` renders through
 * `@shopify/react-native-skia`'s `<Canvas>`, which on web needs the CanvasKit
 * WASM runtime loaded BEFORE the story module's Skia barrel evaluates — so its
 * sections await `loadGraphicsRuntime()` (a platform-split preloader; a no-op on
 * native) before importing the story. apps/web carries the matching Skia bundler
 * config (`@knitui/plugins/next-plugin`). The `icons` and `emoji` packages are
 * EXCLUDED: they ship thousands of generated glyphs, so instead of mirroring
 * their stories we render purpose-built, searchable browsers — see
 * `packages/demo/src/IconsSection.tsx` and `EmojiSection.tsx`.
 *
 * Usage: `node scripts/generate-demo-sections.mjs`
 *        (or `pnpm --filter @knitui/demo generate:sections`)
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");

/** Packages whose stories render in the gallery. `icons` and `emoji` are excluded (see above). */
const PACKAGES = [
  "components",
  "dates",
  "map",
  "carousel",
  "media",
  "sheet",
  "graphics",
  "mediaquery",
];

/**
 * Packages whose stories render through Skia and so must have the CanvasKit web
 * runtime loaded before the story module evaluates. Their sections await
 * `loadGraphicsRuntime()` (no-op on native) before the dynamic `import()`.
 */
const NEEDS_GRAPHICS_RUNTIME = new Set(["graphics"]);

/**
 * Packages whose stories fill their container (`<Map style={{ flex: 1 }}>`)
 * rather than sizing to content. These render through the dedicated, full-bleed
 * `MapSection` (one story at a time, height carried down by flex) instead of the
 * content-sized `StorySection`, and the demo gives their pane the whole canvas.
 */
const FULL_BLEED = new Set(["map"]);

/**
 * Packages whose stories render through Skia `<Canvas>`. Each canvas holds its
 * own WebGL context and browsers cap live contexts (~16), so stacking a whole
 * module's stories (the default `StorySection`) exhausts them — CanvasKit then
 * fails to attach a surface ("failed to attach a stencil buffer"). These render
 * through `CanvasGallerySection`: one (content-sized) story at a time, like
 * `MapSection` but not full-bleed.
 */
const WEBGL_GALLERY = new Set(["graphics"]);

/**
 * Packages backed by a SINGLE shared engine per medium — `@knitui/media` owns one
 * real `<audio>` and one real `<video>` (plus one recorder / one mic capture),
 * teleported into the active player. Stacking a module's stories (the default
 * `StorySection`) mounts several players that all contend for that one element,
 * so only the active one works and the rest render blank. These render through
 * `MediaSection`: one (content-sized) story at a time, like `CanvasGallerySection`.
 */
const MEDIA_GALLERY = new Set(["media"]);

const OUTPUT = join(REPO_ROOT, "packages/demo/src/sections.generated.tsx");

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

/** Pull the meta-level `title:` out of the `const meta = {…}` block. */
function extractTitle(source) {
  const metaStart = source.indexOf("const meta");
  if (metaStart === -1) return undefined;
  // Limit the search to the meta object literal so we never pick up a
  // story-level or `args.title` value further down the file.
  const metaEnd = source.indexOf("satisfies Meta", metaStart);
  const block = source.slice(metaStart, metaEnd === -1 ? undefined : metaEnd);
  const match = block.match(/\btitle:\s*["'`]([^"'`]+)["'`]/);
  return match ? match[1] : undefined;
}

/** `Inputs/Button` -> { group: "Inputs", name: "Button" }. */
function splitTitle(title, fallbackName) {
  if (!title) return { group: "Other", name: fallbackName };
  const parts = title.split("/");
  const name = parts.pop() || fallbackName;
  const group = parts.length ? parts.join(" / ") : "Other";
  return { group, name };
}

const entries = [];
const seenIds = new Set();

for (const pkg of PACKAGES) {
  const srcDir = join(REPO_ROOT, "packages", pkg, "src");
  for (const file of findStories(srcDir).sort()) {
    const source = readFileSync(file, "utf8");
    const relFromSrc = relative(srcDir, file).split(sep).join("/");
    const importPath = `@knitui/${pkg}/src/${relFromSrc.replace(/\.tsx$/, "")}`;
    const fileBase = relFromSrc
      .split("/")
      .pop()
      .replace(/\.stories\.tsx$/, "");
    const { group, name } = splitTitle(extractTitle(source), fileBase);

    let id = fileBase;
    if (seenIds.has(id)) id = `${pkg}-${fileBase}`;
    seenIds.add(id);

    entries.push({
      id,
      title: name,
      group,
      importPath,
      fullBleed: FULL_BLEED.has(pkg),
      webglGallery: WEBGL_GALLERY.has(pkg),
      mediaGallery: MEDIA_GALLERY.has(pkg),
      needsGraphicsRuntime: NEEDS_GRAPHICS_RUNTIME.has(pkg),
    });
  }
}

entries.sort((a, b) => a.group.localeCompare(b.group) || a.title.localeCompare(b.title));

const body = entries
  .map(
    ({
      id,
      title,
      group,
      importPath,
      fullBleed,
      webglGallery,
      mediaGallery,
      needsGraphicsRuntime,
    }) => {
      const Renderer = fullBleed
        ? "MapSection"
        : webglGallery
          ? "CanvasGallerySection"
          : mediaGallery
            ? "MediaSection"
            : "StorySection";
      // Graphics stories render through Skia. On web the CanvasKit runtime must be
      // loaded before the story module's Skia barrel evaluates (it captures
      // `global.CanvasKit` at eval time), so gate the dynamic import behind
      // `loadGraphicsRuntime()` — a no-op on native, so this is harmless there.
      const loadModule = needsGraphicsRuntime
        ? `loadGraphicsRuntime().then(() => import(${JSON.stringify(importPath)}))`
        : `import(${JSON.stringify(importPath)})`;
      return `  {
    id: ${JSON.stringify(id)},
    title: ${JSON.stringify(title)},
    group: ${JSON.stringify(group)},
    fullBleed: ${JSON.stringify(fullBleed)},
    Component: lazy(() =>
      ${loadModule}.then((m) => ({
        default: () => <${Renderer} mod={m as Record<string, unknown>} title=${JSON.stringify(title)} />,
      })),
    ),
  },`;
    },
  )
  .join("\n");

const file = `// AUTO-GENERATED by scripts/generate-demo-sections.mjs — DO NOT EDIT BY HAND.
// Run \`pnpm --filter @knitui/demo generate:sections\` to regenerate after changing
// any \`*.stories.tsx\`. Sourced from the web Storybook so the mobile gallery
// (Expo \`apps/app\`) stays in sync with it.
import { type ComponentType, lazy, type LazyExoticComponent } from "react";

import { loadGraphicsRuntime } from "@knitui/graphics/runtime";

import { CanvasGallerySection } from "./CanvasGallerySection";
import { MapSection } from "./MapSection";
import { MediaSection } from "./MediaSection";
import { StorySection } from "./StorySection";

export type DemoSection = {
  /** Stable, URL-safe identifier (the story file's component name). */
  id: string;
  /** Human-readable label shown in navigation. */
  title: string;
  /** Storybook sidebar group the story belongs to (e.g. "Inputs"). */
  group: string;
  /**
   * Whether the section fills the demo's content pane instead of sizing to
   * content. True for map stories (rendered by \`MapSection\`), so \`DemoScreen\`
   * gives them the whole canvas rather than the padded, scrolling layout.
   */
  fullBleed: boolean;
  Component: LazyExoticComponent<ComponentType>;
};

/**
 * Every demo section, one per Storybook story module, ordered by group then
 * title. Each \`Component\` is \`React.lazy\`'d so a section's module is only
 * evaluated when rendered (the Expo app navigates one at a time). Both apps
 * consume this as the single source of truth.
 */
export const demoSections: DemoSection[] = [
${body}
];
`;

// Format with the repo's Prettier config so the generated file passes lint
// (the output would otherwise be flagged by prettier/prettier on every run).
const prettierConfig = await resolveConfig(OUTPUT);
const formatted = await format(file, { ...prettierConfig, parser: "typescript", filepath: OUTPUT });

writeFileSync(OUTPUT, formatted);
console.log(`Generated ${entries.length} demo sections -> ${relative(REPO_ROOT, OUTPUT)}`);
