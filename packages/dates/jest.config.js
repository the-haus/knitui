/**
 * Jest config for unit-testing @knitui/dates.
 *
 * Strategy mirrors packages/components/jest.config.js: render any (cross-platform
 * Tamagui) components on the WEB target via react-native-web in a jsdom
 * environment so the CSS animation driver resolves instead of the reanimated one
 * (no native-module mocking). The current suite is pure dayjs utilities (no
 * render), but keeping the config identical to the sibling packages makes the
 * later hook/component-interaction tests turnkey.
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
