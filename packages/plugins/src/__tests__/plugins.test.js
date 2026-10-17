/**
 * Smoke tests for @knitui/plugins. The point is a fast, reliable green check in
 * CI — NOT to run a real bundler. We assert that:
 *   - the documented subpath `exports` are present and point at files on disk,
 *   - the CJS entries import without throwing and expose the expected factory,
 *   - the deprecated babel entry is a harmless no-op `[plugin, options]` entry.
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

describe("babel-plugin (deprecated no-op on Tamagui v3)", () => {
  const babelPlugin = require("../babel-plugin");

  it("is still a valid `[plugin, options]` babel entry", () => {
    expect(Array.isArray(babelPlugin)).toBe(true);
    expect(babelPlugin).toHaveLength(2);
    const [plugin, options] = babelPlugin;
    expect(typeof plugin).toBe("function");
    expect(options).toEqual({});
  });

  it("does nothing but warn once", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const [plugin] = babelPlugin;
    expect(plugin()).toEqual({ name: "knitui-deprecated-noop" });
    plugin();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/deprecated/);
    warn.mockRestore();
  });

  it("keeps `.withOptions` for source compatibility", () => {
    expect(typeof babelPlugin.withOptions).toBe("function");
    const [, options] = babelPlugin.withOptions({ logTimings: false });
    expect(options).toEqual({ logTimings: false });
  });
});

describe("component list", () => {
  it("names every kit package that ships Tamagui components, plus the config", () => {
    const { DEFAULT_COMPONENTS, KNIT_CONFIG } = require("../components");
    expect(DEFAULT_COMPONENTS).toEqual([
      "@knitui/core",
      "@knitui/components",
      "@knitui/dates",
      "@knitui/media",
      "@knitui/sheet",
      "@knitui/carousel",
    ]);
    expect(KNIT_CONFIG).toBe("@knitui/core/config");
  });

  it("the ESM vite entry carries the same list", () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "vite.mjs"), "utf8");
    const { DEFAULT_COMPONENTS } = require("../components");
    const inline = source.match(/DEFAULT_COMPONENTS = (\[[^\]]*\])/);
    expect(inline).not.toBeNull();
    expect(JSON.parse(inline[1].replace(/,\s*\]/, "]"))).toEqual(DEFAULT_COMPONENTS);
  });
});

it("the ESM vite entry carries the same static-evaluation ignore list", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "vite.mjs"), "utf8");
  const { STATIC_EVALUATION_IGNORED_MODULES } = require("../components");
  const inline = source.match(/STATIC_EVALUATION_IGNORED_MODULES = (\[[^\]]*\])/);
  expect(inline).not.toBeNull();
  expect(JSON.parse(inline[1].replace(/,\s*\]/, "]"))).toEqual(STATIC_EVALUATION_IGNORED_MODULES);
});

describe("bundler wrappers export a factory (without invoking a bundler)", () => {
  it("metro exports the `withKnitui` factory", () => {
    const metro = require("../metro");
    expect(typeof metro).toBe("function");
    expect(typeof metro.withKnitui).toBe("function");
  });

  it("metro stubs the kit's runtime-only modules during static evaluation (merged with overrides)", () => {
    jest.isolateModules(() => {
      const withTamagui = jest.fn((config, options) => ({ ...config, options }));
      jest.doMock("@tamagui/cli/metro", () => ({ withTamagui }));
      const { STATIC_EVALUATION_IGNORED_MODULES } = require("../components");
      const metro = require("../metro");
      const out = metro({}, { dangerouslyIgnoreStaticEvaluationModules: ["my-native-mod"] });
      expect(out.options.dangerouslyIgnoreStaticEvaluationModules).toEqual([
        ...STATIC_EVALUATION_IGNORED_MODULES,
        "my-native-mod",
      ]);
      expect(out.options.dangerouslyIgnoreStaticEvaluationModules).toContain(
        "react-native-gesture-handler",
      );
      jest.dontMock("@tamagui/cli/metro");
    });
  });

  it("next-plugin exports the `withKnitui` factory", () => {
    const nextPlugin = require("../next-plugin");
    expect(typeof nextPlugin).toBe("function");
    expect(typeof nextPlugin.withKnitui).toBe("function");
  });

  it("the v3 compiler entry points the wrappers load are installed", () => {
    // resolve only: loading the compilers pulls esbuild/ts-morph into jest
    for (const id of [
      "@tamagui/cli/metro",
      "@tamagui/cli/vite",
      "@tamagui/next-plugin",
      "tamagui-loader",
    ]) {
      expect(() => require.resolve(id)).not.toThrow();
    }
  });

  it("webpack exports the `TamaguiPlugin` factory", () => {
    const webpack = require("../webpack");
    expect(typeof webpack).toBe("function");
    expect(typeof webpack.TamaguiPlugin).toBe("function");
  });
});
