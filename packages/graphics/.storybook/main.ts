import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";

// Absolute paths to local stubs (see the aliases below). Resolved relative to
// this config file so they work regardless of the cwd Storybook runs from.
const stub = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));
const assetRegistryStub = stub("./stubs/asset-registry.js");

/**
 * Storybook for @knitui/graphics.
 *
 * Every component renders through `@shopify/react-native-skia`'s <Canvas>, which
 * on web is backed by the CanvasKit WASM runtime. `viteFinal` needs to:
 *   1. alias bare `react-native` imports (Skia + the Shadows view wrapper) to
 *      `react-native-web` so they resolve in a browser bundle,
 *   2. prefer `.web.*` file extensions so Skia's platform-split modules resolve
 *      to their web variants. Skia's package.json has no `browser`/`exports`
 *      map, so `module`/`main` point at the *native* build — without this, Vite
 *      bundles `NativeSkiaModule.js`, which does
 *      `import { TurboModuleRegistry } from "react-native"` and blows up against
 *      react-native-web. Metro gets this for free via platform extensions; Vite
 *      needs it spelled out. The `.web.js` variants don't touch TurboModule.
 *   3. define the `__DEV__` flag Skia/React Native expect, and
 *   4. leave `@shopify/react-native-skia` out of Vite's dep pre-bundling so the
 *      esbuild optimizer (which ignores `resolve.extensions`) can't re-pin it to
 *      the native `.js` files; Vite then serves it through the resolver above,
 *   5. but still force-`include` Skia's CommonJS deps so they get CJS→ESM
 *      interop the excluded parent would otherwise deny them:
 *        - `react-reconciler` — Skia's web renderer imports named exports from
 *          it ("does not provide an export named 'DefaultEventPriority'"),
 *        - `canvaskit-wasm/bin/full/canvaskit` — `LoadSkiaWeb` default-imports
 *          this UMD glue ("does not provide an export named 'default'"). Its
 *          emscripten code has a dead Node branch that `require("fs"/"path")`,
 *          so those are marked external for the optimizer's esbuild pass.
 *   6. transpile `react-native-reanimated`: Skia's Reanimated integration pulls
 *      it in, but reanimated ships JSX inside `.js` files that a web bundler
 *      can't parse out of the box. We pre-bundle it with esbuild's `jsx` loader
 *      for dev, and run the same transform via a `pre` plugin for the build
 *      (which doesn't use the dep optimizer).
 *   7. stub `react-native/Libraries/Image/AssetRegistry`: Skia's web
 *      `resolveAsset` requires it for numeric (require()'d) image sources, but
 *      it doesn't exist in react-native-web. Stories use URL sources, so it's a
 *      dead branch that just has to resolve. See ./stubs/asset-registry.js.
 *
 * The CanvasKit wasm itself is loaded at runtime from the CDN by
 * `GraphicsProvider` (the preview wraps every story in it), so there's nothing
 * to bundle for that here.
 */
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

    // react-native-reanimated ships JSX inside .js files. The dev dep optimizer
    // handles them via `esbuildOptions.loader` below, but the production build
    // bundles deps through rolldown (no optimizer), so transpile them here too.
    const reanimatedJsx = {
      name: "knitui-graphics:reanimated-jsx",
      enforce: "pre" as const,
      async transform(code: string, id: string) {
        if (!id.endsWith(".js") || !id.includes("react-native-reanimated")) {
          return null;
        }
        return transformWithEsbuild(code, id, { loader: "jsx" });
      },
    };

    // Skia detects reanimated with a synchronous `require("react-native-reanimated")`
    // (external/reanimated/renderHelpers.js + ReanimatedProxy.js). `require` doesn't
    // exist in the browser ESM build — and because Skia is excluded from the dep
    // optimizer (above), those calls are served raw and throw, so Skia decides
    // reanimated is ABSENT (`HAS_REANIMATED_3 = false`). It then renders every
    // Canvas with a `StaticContainer` that reads animated props ONCE and never
    // repaints — i.e. reanimated-driven Skia (`<Path path={derivedValue} />`) shows
    // a blank/frozen frame on web. Rewrite the two require sites so Skia sees
    // reanimated: force the detection flag true, and resolve the proxy via a real
    // ESM import. Scoped to those two files so no other `require()` is touched.
    const skiaReanimatedBridge = {
      name: "knitui-graphics:skia-reanimated-bridge",
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
        __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
        // Stories use `@knitui/components` (Box/Text) for cross-platform layout, so
        // Tamagui needs to know it's targeting web — same defines the components
        // and carousel Storybooks set. Without these Tamagui mis-detects the
        // platform and the kit components don't render in the browser.
        "process.env.TAMAGUI_TARGET": JSON.stringify("web"),
        "process.env.EXPO_OS": JSON.stringify("web"),
        // reanimated v4 and its `react-native-worklets` dep read
        // `process.env.JEST_WORKER_ID` at web-init (platformChecker). They're
        // excluded from pre-bundling (above) and served raw, so esbuild never
        // shims `process` — without this define the browser throws
        // "ReferenceError: process is not defined" and no story renders. Vite
        // auto-defines `process.env.NODE_ENV`; this is the only other key on the
        // web-init path.
        "process.env.JEST_WORKER_ID": "undefined",
      },
      resolve: {
        // Key order matters: the specific AssetRegistry path must precede the
        // broad `react-native` → `react-native-web` prefix alias, otherwise it'd
        // be rewritten to a react-native-web path that doesn't exist. (Vite
        // preserves object key order and matches the first hit.)
        alias: {
          "react-native/Libraries/Image/AssetRegistry": assetRegistryStub,
          "react-native": "react-native-web",
        },
        // `.web.*` must come first so Skia's platform-split files (e.g.
        // NativeSkiaModule.web.js, Skia.web.js, Platform.web.js) win over their
        // native siblings.
        extensions: [
          ".web.tsx",
          ".web.ts",
          ".web.jsx",
          ".web.js",
          ".tsx",
          ".ts",
          ".jsx",
          ".js",
          ".mjs",
          ".json",
        ],
      },
      optimizeDeps: {
        // Skia is excluded so Vite's resolver (with `resolve.extensions` above)
        // serves its `.web.js` platform variants. reanimated is excluded too so
        // it flows through the dev pipeline where the `reanimatedJsx` plugin
        // transpiles its JSX-in-.js and `.web.js` variants resolve — the
        // Rolldown dep optimizer runs neither.
        exclude: ["@shopify/react-native-skia", "react-native-reanimated"],
        // Skia's web renderer imports from these CommonJS deps. The parent is
        // excluded, so pre-bundle them explicitly to get the CJS→ESM interop
        // (named exports for react-reconciler, default export for the canvaskit
        // UMD glue) that serving them raw wouldn't provide.
        include: [
          "react-reconciler",
          "react-reconciler/constants",
          "canvaskit-wasm/bin/full/canvaskit",
          // reanimated v4 default-imports this CommonJS script during web init
          // (JSReanimated → assertWorkletsVersion). reanimated is excluded above,
          // so serving it raw gives no CJS→ESM interop and the ESM importer fails
          // with "does not provide an export named 'default'". Force-include just
          // this subpath so esbuild synthesizes the default export — same trick
          // as the canvaskit UMD glue above.
          "react-native-reanimated/scripts/validate-worklets-version",
          // reanimated v4 also imports this CommonJS package (named exports like
          // `controlEdgeToEdgeValues`); same excluded-parent → no-interop trap.
          "react-native-is-edge-to-edge",
        ],
      },
    });
  },
};

export default config;
