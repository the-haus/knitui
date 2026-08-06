/**
 * The docs site's hand-authored navigation — the one place the IA is declared.
 *
 * This is the equivalent of a Docusaurus `sidebars.js`: ordering is editorial,
 * never filesystem- or alphabet-driven. Component sections are NOT listed here —
 * they're derived from the story registry by `build-nav.mjs`, keyed by the
 * `{ fromRegistry: … }` placeholders below, so a new component with a story
 * appears in the nav automatically.
 *
 * Each leaf is `[label, href]`. A section is `{ label, items, collapsed? }`.
 */

/** Sections generated from the registry, in the order their groups should appear. */
export const COMPONENT_GROUP_ORDER = [
  "Layout",
  "Typography",
  "Inputs",
  "Display",
  "Data Display",
  "Data display",
  "Feedback",
  "Navigation",
  "Overlays",
];

export const nav = [
  {
    label: "Introduction",
    collapsed: false,
    items: [
      ["What is Knit UI", "/docs"],
      ["Why Knit UI", "/docs/why"],
      ["Architecture", "/docs/architecture"],
      ["Packages", "/docs/api/packages"],
    ],
  },
  {
    label: "Getting started",
    collapsed: false,
    items: [
      ["Installation", "/docs/getting-started/installation"],
      ["Quickstart", "/docs/getting-started/quickstart"],
      ["Expo", "/docs/getting-started/expo"],
      ["Next.js", "/docs/getting-started/nextjs"],
      ["Vite", "/docs/getting-started/vite"],
      ["Bundler setup", "/docs/getting-started/bundler-setup"],
      ["Server rendering", "/docs/getting-started/ssr"],
      ["TypeScript", "/docs/getting-started/typescript"],
      ["Troubleshooting", "/docs/getting-started/troubleshooting"],
    ],
  },
  {
    label: "Foundations",
    collapsed: false,
    items: [
      ["Principles", "/docs/foundations/principles"],
      ["Tokens", "/docs/foundations/tokens"],
      ["Color & themes", "/docs/foundations/color-and-themes"],
      ["Theme builder", "/docs/foundations/theme-builder"],
      ["Typography", "/docs/foundations/typography"],
      ["Sizing", "/docs/foundations/sizing"],
      ["Variants & colors", "/docs/foundations/variants-and-colors"],
      ["Elevation", "/docs/foundations/elevation"],
      ["Motion", "/docs/foundations/motion"],
      ["Focus & a11y", "/docs/foundations/focus-and-a11y"],
      ["Layout", "/docs/foundations/layout"],
      ["Slots & styles", "/docs/foundations/slots-and-styles"],
      ["Gradients", "/docs/foundations/gradients"],
      ["Responsive", "/docs/foundations/responsive"],
      ["Dark mode", "/docs/foundations/dark-mode"],
      ["Icons", "/docs/foundations/icons"],
      ["styled()", "/docs/foundations/styled"],
    ],
  },
  {
    fromRegistry: "components",
    label: "Components",
    // The gallery — the landing spot for "show me everything you have".
    overview: ["All components", "/docs/components"],
  },
  { fromRegistry: "dates", label: "Dates", overview: ["Overview", "/docs/dates"] },
  { fromRegistry: "carousel", label: "Carousel" },
  { fromRegistry: "map", label: "Map", overview: ["Overview", "/docs/map"] },
  { fromRegistry: "media", label: "Media", overview: ["Overview", "/docs/media"] },
  { fromRegistry: "graphics", label: "Graphics", overview: ["Overview", "/docs/graphics"] },
  { fromRegistry: "sheet", label: "Sheet" },
  { fromRegistry: "mediaquery", label: "Media Query" },
  {
    label: "Icons & emoji",
    collapsed: true,
    items: [
      ["Icons", "/docs/icons"],
      ["Emoji", "/docs/emoji"],
    ],
  },
  { fromHooks: true, label: "Hooks", collapsed: true },
  {
    label: "Guides",
    collapsed: true,
    items: [
      ["Cross-platform authoring", "/docs/guides/cross-platform-authoring"],
      ["Theming an app", "/docs/guides/theming-an-app"],
      ["Composing components", "/docs/guides/composing-components"],
      ["Forms", "/docs/guides/forms"],
      ["Performance", "/docs/guides/performance"],
      ["Animation", "/docs/guides/animation"],
      ["Testing", "/docs/guides/testing"],
      ["Platform differences", "/docs/guides/platform-differences"],
      ["Migrating from Mantine", "/docs/guides/migrating-from-mantine"],
    ],
  },
  {
    label: "Reference",
    collapsed: true,
    items: [
      ["Packages", "/docs/api/packages"],
      ["Exports A–Z", "/docs/api/exports"],
      ["Compatibility", "/docs/api/compatibility"],
      ["Changelog", "/changelog"],
      ["Contributing", "/docs/contributing"],
    ],
  },
];
