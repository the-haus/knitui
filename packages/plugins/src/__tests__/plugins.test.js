/**
 * Smoke tests for @knitui/plugins. The point is a fast, reliable green check in
 * CI — NOT to run a real bundler. We assert that:
 *   - the documented subpath `exports` are present and point at files on disk,
 *   - the CJS entries import without throwing and expose the expected factory,
 *   - the babel entry has the `[plugin, options]` shape (+ `.withOptions`).
 *
 * The bundler wrappers (metro/next/webpack) all lazy-`require()` their optional
 * Tamagui plugin only when *called*, so simply importing them is side-effect
 * free — we never call the factories, which would need a real bundler config.
 */
const fs = require("fs");
const path = require("path");

const pkg = require("../../package.json");

const DOCUMENTED_SUBPATHS = [
  "./babel-plugin",
  "./next",
  "./next-plugin",
  "./metro",
  "./vite",
  "./webpack",
];

describe("package.json exports map", () => {
  it("lists every documented subpath with a `source` entry", () => {
    for (const subpath of DOCUMENTED_SUBPATHS) {
      expect(pkg.exports).toHaveProperty([subpath]);
      expect(pkg.exports[subpath]).toHaveProperty("source");
    }
  });

  it("resolves each exported `source` to a file that exists on disk", () => {
    for (const subpath of DOCUMENTED_SUBPATHS) {
      const source = pkg.exports[subpath].source;
      const abs = path.join(__dirname, "..", "..", source);
      expect(fs.existsSync(abs)).toBe(true);
    }
  });
});

describe("babel-plugin", () => {
  const babelPlugin = require("../babel-plugin");

  it("is a ready-to-use `[plugin, options]` babel entry", () => {
    expect(Array.isArray(babelPlugin)).toBe(true);
    expect(babelPlugin).toHaveLength(2);

    const [plugin, options] = babelPlugin;
    expect(typeof plugin).toBe("string"); // resolved path to @tamagui/babel-plugin
    expect(options).toMatchObject({
      components: expect.arrayContaining(["@knitui/core"]),
    });
    expect(typeof options.config).toBe("string"); // resolved @knitui/core/config path
  });

  it("exposes `.withOptions` that merges caller overrides", () => {
    expect(typeof babelPlugin.withOptions).toBe("function");
    const [, options] = babelPlugin.withOptions({ logTimings: false });
    expect(options.logTimings).toBe(false);
    expect(options.components).toEqual(expect.arrayContaining(["@knitui/core"]));
  });
});

describe("bundler wrappers export a factory (without invoking a bundler)", () => {
  it("metro exports the `withKnitui` factory", () => {
    const metro = require("../metro");
    expect(typeof metro).toBe("function");
    expect(typeof metro.withKnitui).toBe("function");
  });

  it("next-plugin exports the `withKnitui` factory", () => {
    const nextPlugin = require("../next-plugin");
    expect(typeof nextPlugin).toBe("function");
    expect(typeof nextPlugin.withKnitui).toBe("function");
  });

  it("webpack exports the `TamaguiPlugin` factory", () => {
    const webpack = require("../webpack");
    expect(typeof webpack).toBe("function");
    expect(typeof webpack.TamaguiPlugin).toBe("function");
  });
});
