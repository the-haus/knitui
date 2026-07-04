import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Aggregate Storybook for Knit UI.
 *
 * Rather than merge every package's bespoke Vite config (Skia load-order,
 * reanimated CJS interop, maplibre, and per-package providers) into one brittle
 * setup, this root **composes** each package's own Storybook via `refs`
 * (Storybook "composition"). Each package keeps its working `.storybook/`
 * config; here we only stitch the built outputs into a single site.
 *
 * `scripts/build-all.mjs` builds this manager into `storybook-static/` and each
 * package's Storybook into `storybook-static/<pkg>/`, so the relative refs below
 * resolve on the deployed site (GitHub Pages). If the child Storybooks are
 * hosted elsewhere, set `STORYBOOK_BASE_URL` at build time.
 */
const PACKAGES: Array<[id: string, title: string]> = [
  ["components", "Components"],
  ["dates", "Dates"],
  ["carousel", "Carousel"],
  ["graphics", "Graphics"],
  ["icons", "Icons"],
  ["emoji", "Emoji"],
  ["map", "Map"],
  ["media", "Media"],
  ["mediaquery", "Media Query"],
  ["sheet", "Sheet"],
];

const base = process.env.STORYBOOK_BASE_URL?.replace(/\/$/, "") ?? ".";

const config: StorybookConfig = {
  stories: ["./welcome/**/*.mdx"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  refs: Object.fromEntries(PACKAGES.map(([id, title]) => [id, { title, url: `${base}/${id}` }])),
};

export default config;
