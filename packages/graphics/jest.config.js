/**
 * Jest config for @knitui/graphics. The suite exercises the pure, platform-free
 * pieces of the audio-visualizer engine — the FFT→bands `spectrum` mapper and
 * the `geometry` variant math. These import nothing from Skia / react-native /
 * reanimated, so they run in node with no native-module mocking; the `"worklet"`
 * directives are inert strings outside the reanimated Babel plugin.
 *
 * `src/__tests__/stories.test.tsx` is the exception: it smoke-renders every
 * story under jsdom + the kit Provider with Skia's jest mock over a real
 * CanvasKit (its own environment, `jest.skia-env.js`).
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: "node",
  // Tamagui v3 packages are `type: module`: `browser`/`import` resolve to the
  // ESM `.mjs` build (babel-jest transforms it, see transformIgnorePatterns) and
  // `require` to `.cjs`. Pinning the conditions keeps every @tamagui/* package on
  // the SAME build, so exactly one @tamagui/web (one config registry) loads.
  testEnvironmentOptions: { customExportConditions: ["node", "require", "default"] },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // The story smoke test renders through react-native-web (jsdom env, see
  // jest.skia-env.js); the engine tests import no react-native at all.
  moduleNameMapper: {
    "^react-native$": "react-native-web",
  },
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs|cjs)$": ["babel-jest", { caller: { platform: "web" } }],
  },
  // Workspace/RN packages ship untranspiled ESM/flow — transform them if pulled in.
  transformIgnorePatterns: [
    "node_modules/(?!((?:jest-)?react-native|@react-native|react-native-.*|@tamagui/.*|tamagui|@knitui/.*|expo(?:nent)?|@expo(?:nent)?/.*|@shopify/react-native-skia|react-native-reanimated))",
  ],
  moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "web.js", "js", "mjs", "cjs", "json"],
  clearMocks: true,
};
