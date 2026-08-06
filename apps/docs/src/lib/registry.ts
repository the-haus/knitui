import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Server-only access to the generated data (see `scripts/docs/`).
 *
 * These files are big — `registry.json` ~900 kB, `story-sources.json` ~1.2 MB,
 * `props.json` ~2.3 MB — so they are read with `fs` at build time rather than
 * `import`ed. An import would make them part of the module graph and risk them
 * being bundled into a client chunk; `server-only` makes that a build error
 * instead of a 4 MB page.
 *
 * Everything a browser needs (the nav tree, the lazy story-module map) lives in
 * separate slim modules.
 */

const GENERATED = join(process.cwd(), "src/generated");

function read<T>(file: string): T {
  return JSON.parse(readFileSync(join(GENERATED, file), "utf8")) as T;
}

export type ArgType = {
  control?: string | false | { type?: string };
  options?: (string | number | boolean | null)[];
  description?: string;
};

export type StoryMeta = {
  name: string;
  description?: string;
  hasRender: boolean;
  args?: Record<string, unknown>;
  storybookId: string;
};

/** How a story must be mounted — see `scripts/docs/build-registry.mjs`. */
export type RenderMode = "stack" | "canvas" | "media" | "fullbleed" | "browser";

export type RegistryEntry = {
  id: string;
  package: string;
  packageName: string;
  title: string;
  group: string;
  name: string;
  componentName?: string;
  route: string;
  internal: boolean;
  render: RenderMode;
  graphicsRuntime: boolean;
  description?: string;
  importPath: string;
  sourcePath: string;
  githubUrl: string;
  storybookUrl: string;
  componentPath?: string;
  testPath?: string;
  nativePath?: string;
  args?: Record<string, unknown>;
  argTypes?: Record<string, ArgType>;
  stories: StoryMeta[];
};

export type PropBucket = "own" | "system" | "style" | "react";

export type PropRecord = {
  name: string;
  bucket: PropBucket;
  type: string;
  options?: (string | number | boolean | null)[];
  required: boolean;
  description?: string;
  default?: string;
  declaredIn?: string;
};

/** One `styles` key, with the TSDoc from the component's slot interface. */
export type SlotRecord = { name: string; description?: string };

export type ComponentProps = {
  component: string;
  sourcePath: string;
  slots?: SlotRecord[];
  props: PropRecord[];
  counts: Partial<Record<PropBucket, number>>;
};

type Registry = { packages: Record<string, { title: string }>; entries: RegistryEntry[] };
type StorySources = Record<string, Record<string, { snippet?: string; full: string }>>;
type Props = {
  systemProps: string[];
  styleProps: { name: string; type: string }[];
  components: Record<string, ComponentProps>;
};

let registryCache: Registry | undefined;
let sourcesCache: StorySources | undefined;
let propsCache: Props | undefined;

export function registry(): Registry {
  registryCache ??= read<Registry>("registry.json");
  return registryCache;
}

export function entries(): RegistryEntry[] {
  return registry().entries;
}

/** The registry entry for a docs id (`components/inputs/button`). */
export function entry(id: string): RegistryEntry | undefined {
  return entries().find((e) => e.id === id);
}

/** Throwing lookup — a docs page naming a nonexistent id should fail the build. */
export function requireEntry(id: string): RegistryEntry {
  const found = entry(id);
  if (!found) {
    throw new Error(
      `[docs] unknown registry id "${id}". Run \`pnpm docs:generate\` or check the id against src/generated/registry.json.`,
    );
  }
  return found;
}

/** The extracted source snippets for one component's stories. */
export function storySources(id: string): Record<string, { snippet?: string; full: string }> {
  sourcesCache ??= read<StorySources>("story-sources.json");
  return sourcesCache[id] ?? {};
}

export function propsData(): Props {
  propsCache ??= read<Props>("props.json");
  return propsCache;
}

/** Generated props for a component id, if extraction resolved it. */
export function componentProps(id: string): ComponentProps | undefined {
  return propsData().components[id];
}
