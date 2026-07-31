#!/usr/bin/env node
/**
 * postbuild.mjs
 * -------------
 * Everything that has to happen AFTER `next build` has written `out/`:
 *
 *   1. robots.txt          — crawl policy, pointing at the sitemap
 *   2. sitemap.xml         — with per-route priority tiers
 *   3. llms.txt            — a curated index for AI clients (llmstxt.org)
 *   4. llms-full.txt       — the same pages' markdown, concatenated
 *   5. Pagefind index      — built by crawling the emitted HTML
 *
 * The tiering and the llms.txt pair are lifted from the approach used on
 * loradb.com: a sitemap where every URL has the same priority carries no signal,
 * and llms.txt is disproportionately useful for a component library, because the
 * readers most likely to fetch it are agents writing UI code.
 *
 * Usage: node scripts/postbuild.mjs   (runs from apps/docs)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(SCRIPT_DIR, "..");
const OUT_DIR = join(APP_DIR, "out");
const CONTENT_DIR = join(APP_DIR, "content");
const SITE_URL = process.env.DOCS_SITE_URL?.replace(/\/$/, "") ?? "https://knitui.dev";

if (!existsSync(OUT_DIR)) {
  console.error("[postbuild] out/ not found — run `next build` first");
  process.exit(1);
}

/* ------------------------------------------------------------------- routes */

/** Every emitted page, as a site-relative route. */
function routes(dir = OUT_DIR) {
  const found = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === "_next") continue;
      found.push(...routes(full));
      continue;
    }
    if (!item.name.endsWith(".html")) continue;
    const rel = relative(OUT_DIR, full).split(sep).join("/");
    if (rel === "404.html") continue;
    found.push(rel === "index.html" ? "/" : `/${rel.replace(/\.html$/, "")}`);
  }
  return found;
}

const allRoutes = routes().sort();

/* --------------------------------------------------------------- robots.txt */

writeFileSync(
  join(OUT_DIR, "robots.txt"),
  [
    "User-agent: *",
    "Allow: /",
    // Thin, auto-generated or JS-only routes: excluded from the sitemap AND
    // disallowed, because crawlers follow internal links too.
    "Disallow: /search",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n"),
  "utf8",
);

/* --------------------------------------------------------------- sitemap.xml */

/**
 * Priority tiers. Higher priority tells a crawler which URLs sit closer to the
 * canonical surface of this site *relative to each other* — it is not a global
 * rank signal. Landing and getting-started first, then components and
 * foundations, then deep reference.
 */
function tierFor(route) {
  if (route === "/") return { priority: "1.0", changefreq: "weekly" };
  if (route === "/docs") return { priority: "0.9", changefreq: "weekly" };
  if (route.startsWith("/docs/getting-started/")) return { priority: "0.9", changefreq: "monthly" };
  if (route === "/docs/why" || route === "/docs/architecture") {
    return { priority: "0.8", changefreq: "monthly" };
  }
  if (route.startsWith("/docs/foundations/")) return { priority: "0.8", changefreq: "monthly" };
  if (route.startsWith("/docs/components/")) return { priority: "0.7", changefreq: "monthly" };
  if (route.startsWith("/docs/guides/")) return { priority: "0.7", changefreq: "monthly" };
  if (route.startsWith("/docs/hooks/")) return { priority: "0.6", changefreq: "monthly" };
  if (route.startsWith("/docs/api/")) return { priority: "0.6", changefreq: "monthly" };
  if (route === "/changelog") return { priority: "0.5", changefreq: "weekly" };
  return { priority: "0.6", changefreq: "monthly" };
}

const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...allRoutes
    .filter((route) => route !== "/search")
    .map((route) => {
      const { priority, changefreq } = tierFor(route);
      return [
        "  <url>",
        `    <loc>${SITE_URL}${route}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n");
    }),
  "</urlset>",
  "",
].join("\n");

writeFileSync(join(OUT_DIR, "sitemap.xml"), sitemap, "utf8");

/* --------------------------------------------------------------- llms.txt */

/**
 * The curated set. Deliberately NOT the whole sitemap: an agent asking "how do I
 * use this library" needs the systems and the setup, not 180 component pages —
 * it can find those from the component index once it knows the conventions.
 */
const LLMS_SECTIONS = [
  {
    title: "Start here",
    entries: [
      ["docs/index.mdx", "/docs", "What Knit UI is and how the packages fit together"],
      ["docs/why.mdx", "/docs/why", "What it is for, and what it is not for"],
      ["docs/architecture.mdx", "/docs/architecture", "Layers, src-shipping, platform splits"],
    ],
  },
  {
    title: "Setup",
    entries: [
      [
        "docs/getting-started/installation.mdx",
        "/docs/getting-started/installation",
        "Install per platform, with peers",
      ],
      [
        "docs/getting-started/quickstart.mdx",
        "/docs/getting-started/quickstart",
        "Provider, first component, the three repeating props",
      ],
      [
        "docs/getting-started/bundler-setup.mdx",
        "/docs/getting-started/bundler-setup",
        "babel · metro · next · vite · webpack",
      ],
      [
        "docs/getting-started/ssr.mdx",
        "/docs/getting-started/ssr",
        "Server rendering and what must stay client-only",
      ],
      [
        "docs/getting-started/troubleshooting.mdx",
        "/docs/getting-started/troubleshooting",
        "Symptom-indexed fixes",
      ],
    ],
  },
  {
    title: "The systems (read these before writing components)",
    entries: [
      [
        "docs/foundations/principles.mdx",
        "/docs/foundations/principles",
        "The five decisions behind the kit",
      ],
      ["docs/foundations/tokens.mdx", "/docs/foundations/tokens", "Token scales and shorthands"],
      [
        "docs/foundations/sizing.mdx",
        "/docs/foundations/sizing",
        "controlMetrics — the size ladder",
      ],
      [
        "docs/foundations/variants-and-colors.mdx",
        "/docs/foundations/variants-and-colors",
        "How variant applies a theme ramp",
      ],
      [
        "docs/foundations/color-and-themes.mdx",
        "/docs/foundations/color-and-themes",
        "Ramp positions and semantic tokens",
      ],
      [
        "docs/foundations/slots-and-styles.mdx",
        "/docs/foundations/slots-and-styles",
        "Per-slot styling",
      ],
      ["docs/foundations/motion.mdx", "/docs/foundations/motion", "Motion tokens and presets"],
      [
        "docs/foundations/focus-and-a11y.mdx",
        "/docs/foundations/focus-and-a11y",
        "The focus contract and keyboard maps",
      ],
    ],
  },
  {
    title: "Guides",
    entries: [
      [
        "docs/guides/cross-platform-authoring.mdx",
        "/docs/guides/cross-platform-authoring",
        "What differs across platforms",
      ],
      [
        "docs/guides/composing-components.mdx",
        "/docs/guides/composing-components",
        "Props → slots → compound parts → styled()",
      ],
      ["docs/guides/forms.mdx", "/docs/guides/forms", "The field contract and the input family"],
      [
        "docs/guides/performance.mdx",
        "/docs/guides/performance",
        "Bundle size, lists, animation, resource limits",
      ],
      [
        "docs/guides/migrating-from-mantine.mdx",
        "/docs/guides/migrating-from-mantine",
        "API delta",
      ],
    ],
  },
  {
    title: "Reference",
    entries: [
      ["docs/api/packages.mdx", "/docs/api/packages", "Packages, versions, peers"],
      ["docs/api/exports.mdx", "/docs/api/exports", "Every importable name"],
      ["docs/api/compatibility.mdx", "/docs/api/compatibility", "React / RN / Expo matrix"],
      ["docs/contributing.mdx", "/docs/contributing", "Conventions and release process"],
    ],
  },
];

/** Strip the `export const meta = {…}` block and MDX component tags from prose. */
function toMarkdown(source) {
  return source
    .replace(/^export const meta = \{[\s\S]*?\n\};\n/, "")
    .replace(/^<[A-Z][^>]*\/>\s*$/gm, "")
    .replace(/^<\/?[A-Z][A-Za-z]*[^>]*>\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const index = [`# Knit UI`, ""];
index.push(
  "> One cross-platform component kit for iOS, Android and web: 100+ React Native +",
  "> web components sharing one design system, built on Tamagui.",
  "",
);

const full = [...index];

for (const section of LLMS_SECTIONS) {
  index.push(`## ${section.title}`, "");
  full.push(`## ${section.title}`, "");

  for (const [file, route, note] of section.entries) {
    const path = join(CONTENT_DIR, file);
    if (!existsSync(path)) {
      console.warn(`[postbuild] llms.txt: missing ${file}`);
      continue;
    }
    index.push(`- [${note}](${SITE_URL}${route}): ${note}`);
    full.push(
      `### ${note}`,
      `Source: ${SITE_URL}${route}`,
      "",
      toMarkdown(readFileSync(path, "utf8")),
      "",
    );
  }
  index.push("");
}

index.push(
  "## Conventions an agent should know",
  "",
  '- Props take tokens: `p="$md"`, `c="$color11"`, `br="$lg"` — not raw numbers.',
  "- Colour comes from `theme` + `variant`. There is no `color` prop.",
  "- `size` is `xxs`…`xxl` from one table; the default is `md`.",
  "- Restyle internal parts with `styles={{ slot: { … } }}`, never a wrapper.",
  "- Press handlers are `onPress`; text inputs use `onChangeText`.",
  "- Flex defaults are React Native's on every platform: `column`, `flexShrink: 0`.",
  "- Wrap the app in exactly one `<Provider>` from `@knitui/core`.",
  "",
);

writeFileSync(join(OUT_DIR, "llms.txt"), `${index.join("\n")}\n`, "utf8");
writeFileSync(join(OUT_DIR, "llms-full.txt"), `${full.join("\n")}\n`, "utf8");

/* ------------------------------------------------------------------ pagefind */

try {
  execFileSync("npx", ["--yes", "pagefind", "--site", OUT_DIR], { stdio: "inherit" });
} catch (error) {
  console.warn(`[postbuild] pagefind failed (search will be unavailable): ${error.message}`);
}

const bytes = (file) => (existsSync(file) ? statSync(file).size : 0);
console.log(
  `[postbuild] ${allRoutes.length} routes · sitemap ${bytes(join(OUT_DIR, "sitemap.xml"))}B · ` +
    `llms.txt ${bytes(join(OUT_DIR, "llms.txt"))}B · llms-full.txt ${bytes(join(OUT_DIR, "llms-full.txt"))}B`,
);
