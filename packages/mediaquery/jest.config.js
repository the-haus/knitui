/**
 * Jest config for unit-testing @knitui/mediaquery. Hooks render on the WEB target
 * via react-native-web in a jsdom environment (so `renderHook` has a DOM and any
 * `react-native` import resolves to its web shim with no native-module mocking).
 * Platform-split hooks (`*.native.ts`) can still be imported by path explicitly.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: "jsdom",
  // Tamagui v3 packages are `type: module`: `browser`/`import` resolve to the
  // ESM `.mjs` build (babel-jest transforms it, see transformIgnorePatterns) and
  // `require` to `.cjs`. Pinning the conditions keeps every @tamagui/* package on
  // the SAME build, so exactly one @tamagui/web (one config registry) loads.
  testEnvironmentOptions: { customExportConditions: ["browser", "require", "default"] },
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  // Resolve react-native to react-native-web so hooks run as web nodes.
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
