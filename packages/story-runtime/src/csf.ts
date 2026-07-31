import { type ComponentType, createElement, Fragment, isValidElement, type ReactNode } from "react";

/**
 * Minimal structural shapes of a Storybook CSF module.
 *
 * We deliberately avoid importing `@storybook/*` here — story files only
 * `import type` from it (those imports are erased at compile time), so the
 * runtime module is just a default `meta` plus named `StoryObj` exports. This
 * module mirrors how Storybook resolves a story, so every non-Storybook surface
 * (the native/web demo gallery, the docs site) shows exactly what the web
 * Storybook shows — from the same file, with no second copy of the example.
 *
 * Consumers: `@knitui/demo` (device gallery) and `@knitui/docs` (docs site).
 */

export type StoryContext = {
  args: Record<string, unknown>;
  argTypes: unknown;
  component: ComponentType<unknown> | undefined;
};

export type Decorator = (Story: ComponentType, context: StoryContext) => ReactNode;

export type StoryObj = {
  render?: (args: Record<string, unknown>, context: StoryContext) => ReactNode;
  args?: Record<string, unknown>;
  argTypes?: unknown;
  decorators?: Decorator[];
  parameters?: Record<string, unknown>;
};

export type Meta = {
  title?: string;
  component?: ComponentType<unknown>;
  args?: Record<string, unknown>;
  argTypes?: unknown;
  decorators?: Decorator[];
  parameters?: Record<string, unknown>;
  render?: (args: Record<string, unknown>, context: StoryContext) => ReactNode;
};

/** An imported CSF module: `default` meta plus named story exports. */
export type StoryModule = Record<string, unknown>;

/** Reserved exports that are never stories. */
const RESERVED = new Set(["default", "__namedExportsOrder"]);

function isStory(value: unknown): value is StoryObj {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !isValidElement(value as object)
  );
}

/** `WithSections` -> `With Sections`, `Variants` -> `Variants`. */
export function humanize(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
}

/** The `meta` (default export) of a story module, or an empty meta. */
export function getMeta(mod: StoryModule): Meta {
  return (mod.default ?? {}) as Meta;
}

/**
 * The named story exports of a CSF module, in declaration order, as
 * `[exportName, story]` pairs — shared by every renderer so they pick up the
 * same stories the web Storybook shows.
 */
export function getStories(mod: StoryModule): (readonly [string, StoryObj])[] {
  const order = (mod.__namedExportsOrder as string[] | undefined) ?? Object.keys(mod);
  return order
    .filter((name) => !RESERVED.has(name) && isStory(mod[name]))
    .map((name) => [name, mod[name] as StoryObj] as const);
}

/**
 * Resolve one story to a React node the way Storybook does: merge meta args
 * under story args, pick the most specific `render` (story → meta → bare
 * component), then wrap in decorators.
 *
 * `argOverrides` is the docs-site playground hook — a live controls panel merges
 * its current values in on top of the story's own args.
 */
export function renderStory(
  meta: Meta,
  story: StoryObj,
  argOverrides?: Record<string, unknown>,
): ReactNode {
  const args = { ...meta.args, ...story.args, ...argOverrides };
  const context: StoryContext = {
    args,
    argTypes: story.argTypes ?? meta.argTypes,
    component: meta.component,
  };

  const Component = meta.component;
  const baseRender =
    story.render ??
    meta.render ??
    ((a: Record<string, unknown>) => (Component ? createElement(Component, a) : null));

  let node: ReactNode = baseRender(args, context);

  // Decorators wrap from innermost (story) to outermost (meta); within a level
  // the first-defined decorator is the outermost, so apply each level in
  // reverse. Matches Storybook's decorator precedence.
  for (const level of [story.decorators, meta.decorators]) {
    if (!level) continue;
    for (let i = level.length - 1; i >= 0; i--) {
      const inner = node;
      const Wrapped: ComponentType = () => createElement(Fragment, null, inner);
      node = level[i](Wrapped, context);
    }
  }

  return node;
}
