/**
 * Jest config for @knitui/graphics. The suite exercises the pure, platform-free
 * pieces of the audio-visualizer engine — the FFT→bands `spectrum` mapper and
 * the `geometry` variant math. These import nothing from Skia / react-native /
 * reanimated, so they run in node with no native-module mocking; the `"worklet"`
 * directives are inert strings outside the reanimated Babel plugin.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs|cjs)$": ["babel-jest", { caller: { platform: "web" } }],
  },
  // Workspace/RN packages ship untranspiled ESM/flow — transform them if pulled in.
  transformIgnorePatterns: [
    "node_modules/(?!((?:jest-)?react-native|@react-native|react-native-.*|@tamagui/.*|tamagui|@knitui/.*|expo(?:nent)?|@expo(?:nent)?/.*|react-native-reanimated))",
  ],
  moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "web.js", "js", "mjs", "cjs", "json"],
  clearMocks: true,
};
