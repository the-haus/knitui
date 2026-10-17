/**
 * Smoke-renders EVERY story of the package (meta args + story args, the story's
 * own `render` or `<meta.component {...args} />`) under the package test
 * wrapper, and fails on any `console.error` / `console.warn` a story logs,
 * including the v3 guard's leaked-`xxxStyle` / "removed in v3" / `$`-token
 * messages. The jsdom twin of opening each story: it catches v2 leftovers in
 * story sources, which the component tests never import.
 */
import * as fs from "fs";
import * as path from "path";

import * as React from "react";

import { cleanup, render } from "../video/test-utils";

type StoryFn = (args: Record<string, unknown>, context: Record<string, unknown>) => React.ReactNode;

interface StoryModule {
  default: {
    component?: React.ComponentType<Record<string, unknown>>;
    args?: Record<string, unknown>;
    render?: StoryFn;
  };
  [name: string]: unknown;
}

interface StoryObject {
  args?: Record<string, unknown>;
  render?: StoryFn;
}

function findStories(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findStories(full));
    else if (entry.name.endsWith(".stories.tsx")) out.push(full);
  }
  return out.sort();
}

const SRC = path.resolve(__dirname, "..");
const files = findStories(SRC);

it("finds the package's story files", () => {
  expect(files.length).toBeGreaterThanOrEqual(6);
});

describe.each(files.map((f) => [path.relative(SRC, f), f]))("%s", (_rel, file) => {
  const mod = require(file) as StoryModule;
  const meta = mod.default;
  const stories = Object.entries(mod).filter(
    ([name, value]) =>
      name !== "default" && typeof value === "object" && value !== null && /^[A-Z]/.test(name),
  ) as [string, StoryObject][];

  it.each(stories)("%s renders without console errors", (_name, story) => {
    const logged: string[] = [];
    const record = (...args: unknown[]) => {
      const text = args.map((a) => (a instanceof Error ? a.message : String(a))).join(" ");
      if (text.includes("Could not parse CSS stylesheet")) return;
      logged.push(text);
    };
    const errorSpy = jest.spyOn(console, "error").mockImplementation(record);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(record);

    const args = { ...meta.args, ...story.args };
    const renderStory = story.render ?? meta.render;
    const Component = meta.component;

    function StoryHost() {
      if (renderStory) return <>{renderStory(args, { args })}</>;
      if (!Component) return null;
      return <Component {...args} />;
    }

    try {
      render(<StoryHost />);
    } finally {
      cleanup();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
    expect(logged).toEqual([]);
  });
});
