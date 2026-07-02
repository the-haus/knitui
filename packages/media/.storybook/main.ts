import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook for @knitui/media/audio.
 *
 * The player/recorder chrome is cross-platform Tamagui rendered on the web
 * target via react-native-web. The `viteFinal` below:
 *   1. aliases bare `react-native` → `react-native-web`,
 *   2. stubs `react-native/Libraries/Image/AssetRegistry` (it doesn't exist in
 *      react-native-web); this alias MUST precede the broad `react-native` alias.
 *   3. prefers `.web.*` extensions so platform-split modules resolve to their
 *      web variants,
 *   4. excludes reanimated from dep pre-bundling (the optimizer ignores
 *      `resolve.extensions`) but force-includes its CJS deps for interop,
 *   5. transpiles reanimated's JSX-in-.js for the production (rolldown) build,
 *   6. defines `__DEV__` + the Tamagui/Expo web flags.
 *
 * The native `expo-audio` backend lives in `*.native.tsx` files this web target
 * never resolves.
 *
 * The audio-visualizer stories (src/audio/visualizer) additionally render through
 * `@shopify/react-native-skia` (CanvasKit on web) via `@knitui/graphics` — a
 * DEV-ONLY dependency (the shipped @knitui/media is Skia-free). So `viteFinal` also
 * mirrors the @knitui/graphics Storybook's Skia plumbing: exclude Skia from
 * pre-bundling so its `.web.js` platform variants resolve, force-include the
 * canvaskit UMD glue, and bridge Skia↔reanimated so Canvas repaints on web. Those
 * stories lazy-load the Skia barrel only after CanvasKit is ready, so no other
 * story pays for it.
 */
const stub = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url));
const assetRegistryStub = stub("./stubs/asset-registry.js");

const RN_WEB_EXTENSIONS = [
  ".web.tsx",
  ".web.ts",
  ".web.jsx",
  ".web.js",
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
];

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)", "../src/**/*.mdx"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  async viteFinal(config) {
    const { mergeConfig, transformWithEsbuild } = await import("vite");

    // react-native-reanimated ships JSX inside .js files; the prod build bundles
    // deps through rolldown (no dep optimizer), so transpile them here too.
    const reanimatedJsx = {
      name: "knitui-audio:reanimated-jsx",
      enforce: "pre" as const,
      async transform(code: string, id: string) {
        if (!id.endsWith(".js") || !id.includes("react-native-reanimated")) {
          return null;
        }
        return transformWithEsbuild(code, id, { loader: "jsx" });
      },
    };

    // Skia detects reanimated with a synchronous `require("react-native-reanimated")`
    // (renderHelpers.js + ReanimatedProxy.js). `require` doesn't exist in the
    // browser ESM build and Skia is excluded from the optimizer (below), so those
    // calls throw and Skia decides reanimated is ABSENT (`HAS_REANIMATED_3 = false`),
    // rendering every Canvas once and never repainting — i.e. a blank/frozen
    // visualizer. Rewrite the two require sites so Skia sees reanimated. Scoped to
    // those two files. (Mirrors the @knitui/graphics Storybook bridge.)
    const skiaReanimatedBridge = {
      name: "knitui-media:skia-reanimated-bridge",
      enforce: "pre" as const,
      transform(code: string, id: string) {
        if (!id.includes("@shopify/react-native-skia")) {
          return null;
        }
        if (id.includes("renderHelpers")) {
          return code.replace(
            "export let HAS_REANIMATED_3 = false;",
            "export let HAS_REANIMATED_3 = true;",
          );
        }
        if (id.includes("ReanimatedProxy")) {
          return `import * as __SkiaRea__ from "react-native-reanimated";\n${code.replace(
            'return require("react-native-reanimated");',
            "return __SkiaRea__;",
          )}`;
        }
        return null;
      },
    };

    return mergeConfig(config, {
      plugins: [reanimatedJsx, skiaReanimatedBridge],
      define: {
        "process.env.TAMAGUI_TARGET": JSON.stringify("web"),
        "process.env.EXPO_OS": JSON.stringify("web"),
        __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
        // reanimated v4 + react-native-worklets read this at web-init
        // (platformChecker); excluded from pre-bundling so esbuild never shims
        // `process` — without it the browser throws "process is not defined" once
        // Skia pulls reanimated in through the bridge above.
        "process.env.JEST_WORKER_ID": "undefined",
      },
      resolve: {
        // Key order matters: the specific AssetRegistry stub must precede the
        // broad `react-native` → `react-native-web` prefix alias.
        alias: {
          "react-native/Libraries/Image/AssetRegistry": assetRegistryStub,
          "react-native": "react-native-web",
        },
        extensions: RN_WEB_EXTENSIONS,
      },
      optimizeDeps: {
        include: [
          "react-native-web",
          "react-reconciler",
          "react-reconciler/constants",
          // `LoadSkiaWeb` default-imports this CanvasKit UMD glue ("does not
          // provide an export named 'default'" without interop). Its emscripten
          // code has a dead Node branch, so the optimizer treats fs/path as
          // external. Force-included for the visualizer stories.
          "canvaskit-wasm/bin/full/canvaskit",
          // reanimated v4 default-imports this CommonJS script during web init
          // (JSReanimated → assertWorkletsVersion). The parent reanimated is
          // excluded below, so serving it raw gives no CJS→ESM interop and the
          // ESM importer fails with "does not provide an export named 'default'".
          // Force-include just this subpath so esbuild synthesizes the default
          // export.
          "react-native-reanimated/scripts/validate-worklets-version",
          // reanimated v4 also imports this CommonJS package (named exports like
          // `controlEdgeToEdgeValues`); same excluded-parent → no-interop trap.
          "react-native-is-edge-to-edge",
        ],
        // Skia excluded so the resolver serves its `.web.js` platform variants
        // (the optimizer ignores `resolve.extensions`); reanimated excluded so the
        // `reanimatedJsx` plugin can transpile its JSX-in-.js.
        exclude: ["@shopify/react-native-skia", "react-native-reanimated"],
        esbuildOptions: {
          resolveExtensions: RN_WEB_EXTENSIONS,
          loader: { ".js": "jsx" },
        },
      },
    });
  },
};

export default config;
