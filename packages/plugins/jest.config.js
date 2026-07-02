/**
 * Jest config for @knitui/plugins. These are plain build-tool factories (babel,
 * metro, next, vite, webpack wrappers) — no React rendering — so the smoke suite
 * runs in a Node environment. Tests only assert shape/importability of the CJS
 * entries and the documented `exports` map; they never invoke a real bundler.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.{js,mjs,cjs}"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx|mjs|cjs)$": ["babel-jest"],
  },
  moduleFileExtensions: ["js", "mjs", "cjs", "json", "ts", "tsx"],
  clearMocks: true,
};
