import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook for @knitui/carousel.
 *
 * The carousel is cross-platform: the web build (`*.tsx` / `*.web.tsx`) renders
 * through react-native-web, while native input lives in `*.native.tsx` files
 * that this web target never resolves. We wire up the same bits the components
 * Storybook does:
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
    // pipeline, so the web build animates via an imperative rAF painter
    // (view/painter.web.ts) instead of `useAnimatedStyle` — see README
    // "Web rendering". No special Vite config is needed for that to work.
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
