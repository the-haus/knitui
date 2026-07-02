import { expect, test } from "@playwright/test";

/**
 * Visual-regression smoke tests for @knitui/components.
 *
 * Each case visits a representative Storybook story via its iframe URL and
 * asserts the rendered pixels match a committed baseline. Story IDs are derived
 * from the story's Meta `title` (kebab-cased) + the exported story name, e.g.
 * `title: "Inputs/Button"` + `export const Playground` -> `inputs-button--playground`.
 *
 * Baselines do not exist until a maintainer generates + commits them. Run:
 *
 *   pnpm --filter @knitui/components test:visual -- --update-snapshots
 *
 * then commit the resulting `visual/smoke.spec.ts-snapshots/` folder.
 */

const STORIES: { name: string; id: string }[] = [
  { name: "Button — Playground", id: "inputs-button--playground" },
  { name: "Button — Variants", id: "inputs-button--variants" },
  { name: "Badge — Playground", id: "display-badge--playground" },
  { name: "Card — Playground", id: "display-card--playground" },
  { name: "Alert — Playground", id: "feedback-alert--playground" },
];

for (const story of STORIES) {
  test(`visual: ${story.name}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    // Storybook signals a mounted story via #storybook-root; wait for it so the
    // screenshot isn't captured mid-hydration.
    await page.locator("#storybook-root").waitFor({ state: "visible" });
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot(`${story.id}.png`);
  });
}
