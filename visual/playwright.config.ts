import { defineConfig, devices } from "@playwright/test";

import { loadManifest, ROOT } from "./select";

/**
 * Manifest-driven visual / DOM / a11y harness over every package Storybook.
 *
 *   node scripts/visual/collect-stories.mjs            # build storybooks + visual/manifest.json
 *   VISUAL_OUT=/abs/out pnpm exec playwright test -c visual/playwright.config.ts
 *   node visual/compare.mjs <baselineDir> <candidateDir> [reportDir]
 *
 * One `node visual/serve.mjs` webServer per package in the selection.
 * See visual/select.ts for the filter env vars; VISUAL_WORKERS sets workers.
 */
const { selected } = loadManifest();
const pkgs = new Map<string, { dir: string; port: number }>();
for (const e of selected) pkgs.set(e.pkg, { dir: e.dir, port: e.port });

export default defineConfig({
  testDir: ".",
  testMatch: /harness\.spec\.ts$/,
  fullyParallel: true,
  workers: process.env.VISUAL_WORKERS ? Number(process.env.VISUAL_WORKERS) : "60%",
  retries: 0,
  timeout: 90_000,
  reporter: [
    ["dot"],
    [
      "json",
      {
        outputFile: `${process.env.VISUAL_OUT ?? `${ROOT}/visual/out/local`}/playwright-report.json`,
      },
    ],
  ],
  outputDir: `${ROOT}/visual/out/.test-results`,
  use: {
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        permissions: ["microphone", "camera"],
        launchOptions: {
          args: [
            "--use-fake-ui-for-media-stream",
            "--use-fake-device-for-media-stream",
            "--autoplay-policy=no-user-gesture-required",
            "--font-render-hinting=none",
            "--disable-lcd-text",
            "--force-color-profile=srgb",
            "--hide-scrollbars",
            "--enable-unsafe-swiftshader",
            "--use-angle=swiftshader",
          ],
        },
      },
    },
  ],
  webServer: [...pkgs.entries()].map(([pkg, { dir, port }]) => ({
    name: pkg,
    command: `node visual/serve.mjs ${dir} ${port}`,
    cwd: ROOT,
    url: `http://127.0.0.1:${port}/iframe.html`,
    // A stale server from an earlier run would silently serve an OLD build: opt in only.
    reuseExistingServer: process.env.VISUAL_REUSE_SERVERS === "1",
    timeout: 30_000,
    stdout: "ignore",
    stderr: "pipe",
  })),
});
