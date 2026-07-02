import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright visual-regression config for @knitui/components.
 *
 * Screenshots are taken against the *built* static Storybook (`storybook-static`)
 * rather than the live `storybook dev` server, so CI runs are deterministic —
 * the static build is a stable, pre-bundled artifact with no HMR/dev jitter.
 *
 * Flow:
 *   1. `pnpm --filter @knitui/components build-storybook` -> ./storybook-static
 *   2. `webServer` below serves that folder on a fixed port with http-server.
 *   3. Specs in ./visual visit `/iframe.html?id=<story-id>&viewMode=story` and
 *      assert `toHaveScreenshot()`.
 *
 * Baselines are generated + committed with:
 *   pnpm --filter @knitui/components test:visual -- --update-snapshots
 */

const PORT = 6007;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./visual",
  // Fail the build if a `test.only` is committed.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    // Deterministic viewport for stable snapshots across machines.
    viewport: { width: 1280, height: 720 },
  },
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // `-s` = silent, single-page-app style static serve of the built Storybook.
    command: `npx http-server storybook-static -p ${PORT} -s`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
