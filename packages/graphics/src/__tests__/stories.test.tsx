/**
 * @jest-environment ./jest.skia-env.js
 * @jest-environment-options {"customExportConditions": ["browser", "require", "default"]}
 */
/**
 * Smoke-renders EVERY graphics story (meta args + story args, the story's own
 * `render` or `<meta.component {...args} />`) inside the same wrapper as the
 * Storybook preview (kit `Provider` outside `GraphicsProvider`), and fails on
 * any `console.error` / `console.warn`, including the v3 guard's messages.
 *
 * Skia is replaced by its official jest mock over a real CanvasKit (see
 * jest.skia-env.js): the `Skia` API (paths, shaders, colours) is real, but
 * `<Canvas>` is a plain react-native `View` that does NOT render its drawing
 * tree (`<Rect>`, `<Path>`, … are Skia-reconciler host elements with no DOM
 * meaning), so nothing is rasterised and the drawing components' own bodies
 * are not exercised. Everything the kit renders around the canvas (Tamagui
 * frames, story chrome, the visualizer hooks, reanimated, effect layout) runs
 * for real. A story that throws (e.g. a missing Tamagui config, Tamagui Err0)
 * or logs fails here.
 */
import * as fs from "fs";
import * as path from "path";

import * as React from "react";

import { cleanup, render } from "@testing-library/react";

import { Provider } from "@knitui/core";

import { GraphicsProvider } from "../provider";

jest.mock("@shopify/react-native-skia", () => {
  jest.mock("@shopify/react-native-skia/lib/module/Platform", () => {
    const Noop = () => undefined;
    return {
      Platform: {
        OS: "web",
        PixelRatio: 1,
        requireNativeComponent: Noop,
        resolveAsset: Noop,
        findNodeHandle: Noop,
        NativeModules: Noop,
        View: require("react-native").View,
      },
    };
  });
  const { View } = require("react-native");
  const skia = require("@shopify/react-native-skia/lib/module/mock").Mock(
    (globalThis as { CanvasKit?: unknown }).CanvasKit,
  );
  // Skia's mock maps `<Canvas>` to a View that also renders the drawing nodes
  // (`<skRect>` …) into the DOM. Keep the canvas box (style, layout) but drop
  // the drawing tree: it is Skia-reconciler data, not markup.
  function Canvas({ style, onLayout, testID }: Record<string, unknown>) {
    return <View style={style} onLayout={onLayout} testID={testID ?? "skia-canvas"} />;
  }
  return { ...skia, Canvas };
});

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

/** Benign jsdom noise, not a story problem. */
const IGNORED = ["Could not parse CSS stylesheet"];

const SRC = path.resolve(__dirname, "..");
const files = findStories(SRC);

it("finds the package's story files", () => {
  expect(files.length).toBeGreaterThanOrEqual(5);
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
      if (IGNORED.some((p) => text.includes(p))) return;
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
      const { container } = render(
        <Provider forceColorScheme="light">
          <GraphicsProvider>
            <StoryHost />
          </GraphicsProvider>
        </Provider>,
      );
      expect(container.childElementCount).toBeGreaterThan(0);
    } finally {
      cleanup();
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
    expect(logged).toEqual([]);
  });
});
