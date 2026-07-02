import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook for @knitui/sheet.
 *
 * The sheet is cross-platform: the web build (`*.tsx` / `*.web.tsx`) renders
 * through react-native-web, while native-only animation lives in `*.tsx` files
 * that the web target overrides with `*.web.tsx`. We wire up the same bits the
 * components Storybook does:
 *   1. tell Tamagui it's targeting web (`TAMAGUI_TARGET`),
 *   2. resolve React Native platform extensions, preferring `.web.*`, and
 *   3. alias `react-native` → `react-native-web`.
 */
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
    const { mergeConfig } = await import("vite");

    // NOTE: Reanimated's worklets Babel plugin doesn't run in Storybook's Vite
    // pipeline, so the web build animates via an imperative painter
    // (view/paint.web.ts subscribing to the offset SharedValue) instead of
    // `useAnimatedStyle` — see README "Web rendering".
    return mergeConfig(config, {
      define: {
        "process.env.TAMAGUI_TARGET": JSON.stringify("web"),
        "process.env.EXPO_OS": JSON.stringify("web"),
        __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
      },
      resolve: {
        extensions: RN_WEB_EXTENSIONS,
        alias: {
          "react-native": "react-native-web",
        },
      },
      optimizeDeps: {
        include: ["react-native-web"],
        esbuildOptions: {
          resolveExtensions: RN_WEB_EXTENSIONS,
          loader: { ".js": "jsx" },
        },
      },
    });
  },
};

export default config;
