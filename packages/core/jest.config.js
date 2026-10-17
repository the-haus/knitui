/**
 * Jest config for @knitui/core. The suite exercises the `createTheme` builder and
 * theming helpers — pure config construction, so it runs in node, but the kit's
 * Tamagui dependencies ship untranspiled and must be transformed.
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
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  // Resolve react-native to react-native-web so the web (CSS) drivers load.
  moduleNameMapper: {
    "^react-native$": "react-native-web",
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs|cjs)$": ["babel-jest", { caller: { platform: "web" } }],
  },
  // RN/Tamagui/workspace packages ship untranspiled ESM/flow — transform them.
  transformIgnorePatterns: [
    "node_modules/(?!((?:jest-)?react-native|@react-native|react-native-.*|@tamagui/.*|tamagui|@knitui/.*|expo(?:nent)?|@expo(?:nent)?/.*|react-native-reanimated))",
  ],
  moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "web.js", "js", "mjs", "cjs", "json"],
  clearMocks: true,
};
