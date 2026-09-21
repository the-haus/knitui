/**
 * Next.js config for the Knit UI docs site.
 *
 * Three things are stacked here, in this order:
 *
 *   1. `nextConfig`      — static export, MDX page extensions, transpiled workspace packages.
 *   2. `withMDX`         — the MDX loader (content pages are `page.mdx` files).
 *   3. `withKnitui`      — the kit's own Next integration: the Tamagui compiler,
 *                          `react-native` -> `react-native-web`, `.web.*` resolution,
 *                          the Skia/reanimated web shims, and `optimizePackageImports`
 *                          for the barrel-shaped packages.
 *
 * `withKnitui` must be OUTERMOST so its webpack layer wraps the MDX loader's.
 *
 * The build must run on webpack (`next build --webpack`): the Tamagui compiler
 * plugin is a webpack plugin, and Next 16 defaults to Turbopack.
 *
 * `output: "export"` keeps the whole site a static artifact — no server, no
 * runtime image optimizer — so it deploys as a CDN drop and the search index can
 * be built by crawling the emitted HTML.
 */
import createMDX from "@next/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { withKnitui } from "@knitui/plugins/next-plugin";

import maplibreWorker from "../../scripts/maplibre-worker.cjs";

// maplibre-gl v6 needs its worker served as a static file; `providers.tsx` points
// the map at it. Copied here rather than in a script because CI runs `next build`
// directly (see scripts/maplibre-worker.cjs).
maplibreWorker.copyMaplibreWorker(import.meta.dirname, `${import.meta.dirname}/public/maplibre`);

/**
 * Carry a fence's meta string onto the `<code>` element as `data-meta`.
 *
 * ```js title="metro.config.js"
 *
 * …parses to a code node whose meta sits in `data.meta`, which nothing downstream
 * of MDX can see — so the filename a reader needs ("put this in which file?") was
 * silently dropped. `Pre` reads `data-meta` back off the props and renders it as
 * the code block's header. Hand-rolled walk rather than `unist-util-visit`: that's
 * a transitive dependency of MDX, not one this app declares.
 */
function rehypeCodeMeta() {
  const walk = (node) => {
    if (node.tagName === "code" && typeof node.data?.meta === "string" && node.data.meta) {
      node.properties = { ...node.properties, "data-meta": node.data.meta };
    }
    for (const child of node.children ?? []) walk(child);
  };
  return walk;
}

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    // `rehypeSlug` gives every heading a stable id; the autolink plugin turns the
    // heading itself into an anchor so the table of contents and deep links work.
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: "heading-anchor" } }],
      rehypeCodeMeta,
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: false,
  // MDX files are CONTENT, not pages — `src/app/docs/[[...slug]]/page.tsx`
  // renders them through the generated content map. See build-content.mjs for why.
  pageExtensions: ["ts", "tsx"],
  images: { unoptimized: true },
  // The kit src-ships (`main` -> `./src/index.ts`), so Next has to compile the
  // workspace packages itself — plus the RN-flavoured deps they reach for.
  transpilePackages: [
    "react-native-web",
    "react-native-reanimated",
    "react-native-gesture-handler",
    "react-native-teleport",
    "expo",
    "expo-image",
    "expo-modules-core",
    "expo-av",
    "expo-audio",
    "expo-video",
    "maplibre-gl",
    "@knitui/core",
    "@knitui/plugins",
    "@knitui/components",
    "@knitui/dates",
    "@knitui/carousel",
    "@knitui/icons",
    "@knitui/emoji",
    "@knitui/hooks",
    "@knitui/map",
    "@knitui/media",
    "@knitui/mediaquery",
    "@knitui/graphics",
    "@knitui/sheet",
    "@knitui/story-runtime",
  ],
};

export default withKnitui(withMDX(nextConfig));
