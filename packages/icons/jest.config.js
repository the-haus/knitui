/**
 * Jest config for @knitui/icons. The smoke suite exercises the WEB icon renderer
 * (`internal/create-icon.tsx`, picked over the `.native` split since jest doesn't
 * apply the `.native` suffix) via `react-dom/server` — pure string rendering, so
 * it runs in a Node environment with no jsdom or native-svg setup required.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs|cjs)$": ["babel-jest", { caller: { platform: "web" } }],
  },
  moduleFileExtensions: ["web.tsx", "web.ts", "tsx", "ts", "web.js", "js", "mjs", "cjs", "json"],
  clearMocks: true,
};
