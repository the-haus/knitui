/**
 * Jest config for unit-testing @knitui/media/audio with React Testing Library.
 *
 * Strategy (identical to @knitui/components / @knitui/media/video): render the
 * cross-platform Tamagui components on the WEB target via react-native-web in a
 * jsdom environment, so the engine + web controller get real coverage with no
 * native-module mocking. The pure engine (src/engine) is plain TS and is
 * exercised directly. See src/test-utils.tsx for the `render` helper that wraps
 * trees in <Provider>.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  // Resolve react-native to react-native-web so components render as web nodes.
  moduleNameMapper: {
    "^react-native$": "react-native-web",
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs|cjs)$": ["babel-jest", { caller: { platform: "web" } }],
  },
  // RN/Tamagui/Expo/workspace packages ship untranspiled ESM/flow — transform them.
  transformIgnorePatterns: [
    "node_modules/(?!((?:jest-)?react-native|@react-native|react-native-.*|@tamagui/.*|tamagui|@knitui/.*|expo(?:nent)?|@expo(?:nent)?/.*|react-native-reanimated))",
  ],
  moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "web.js", "js", "mjs", "cjs", "json"],
  clearMocks: true,
};
