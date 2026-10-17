import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook for @knitui/sheet.
 *
 * The sheet is cross-platform: the web build (`*.tsx` / `*.web.tsx`) renders
 * through react-native-web, while the native-only drag and animation
 * (gesture-handler, reanimated) live in `*.native.tsx` twins the web never
 * resolves. We wire up the same bits the components Storybook does:
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

    // The web build has no reanimated: a pointer-events drag and a
    // requestAnimationFrame spring drive an imperative painter (view/animated.tsx)
    // — see README "Web rendering".
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
