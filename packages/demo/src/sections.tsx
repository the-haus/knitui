import { lazy } from "react";

import { type DemoSection, demoSections as generatedSections } from "./sections.generated";

export type { DemoSection };

/**
 * Hand-written sections that aren't mirrored from a Storybook story. The icons
 * browser lives here (not in `sections.generated.tsx`) because the icons package
 * is excluded from the generator — see `IconsSection` and
 * `scripts/generate-demo-sections.mjs`.
 */
const manualSections: DemoSection[] = [
  {
    id: "icons",
    title: "Icon",
    group: "Icons",
    fullBleed: false,
    Component: lazy(() => import("./IconsSection").then((m) => ({ default: m.IconsSection }))),
  },
];

/**
 * Every demo section consumed by both apps — the generated story mirror plus the
 * hand-written sections — ordered by group then title to match the generator's
 * ordering so navigation stays stable.
 */
export const demoSections: DemoSection[] = [...generatedSections, ...manualSections].sort(
  (a, b) => a.group.localeCompare(b.group) || a.title.localeCompare(b.title),
);
