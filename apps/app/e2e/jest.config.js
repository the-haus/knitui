/**
 * Jest config used by Detox to run the E2E suite (driven via `detox test`).
 * This is separate from any unit-test config — it only runs `e2e/**.test.ts`
 * against a real app on a simulator/emulator.
 *
 * @type {import('@jest/types').Config.InitialOptions}
 */
module.exports = {
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.test.ts"],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  reporters: ["detox/runners/jest/reporter"],
  testEnvironment: "detox/runners/jest/testEnvironment",
  verbose: true,
  transform: {
    "\\.[jt]sx?$": "babel-jest",
  },
};
