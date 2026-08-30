import type { Metadata } from "next";
import Link from "next/link";

import { contentRoutes } from "@/generated/content-map";
import nav from "@/generated/nav.json";
import { pageMetadata } from "@/lib/seo";

/**
 * The full documentation index — every page on one URL.
 *
 * The sidebar renders only the section a reader is currently inside (its other
 * sections are collapsed and never reach the HTML), so `/docs` exposes 39 of the
 * 261 pages and the rest sit three or more clicks from the entry point. A
 * crawler resolves that from `sitemap.xml`, but a sitemap carries no context:
 * it says these URLs exist, not how they relate or which are siblings.
 *
 * This page is the HTML counterpart — one hub whose internal links put every
 * page a single click from `/docs`, grouped under the same headings the sidebar
 * uses. It is generated from the same `nav.json` the sidebar reads, so it cannot
 * drift out of sync with the real IA.
 */
export const metadata: Metadata = pageMetadata({
  title: "All pages",
  description:
    "The complete Knit UI documentation index — every component, hook, guide and reference page, grouped by section.",
  path: "/docs/all",
});

type NavItem = { label: string; href: string };
/** Nested sections in `nav.json` carry only what they need — both arrays are optional. */
type NavSection = { label: string; items?: NavItem[]; sections?: NavSection[] };

/** Section, its pages, then its subsections — flattened to one heading level down. */
function Section({ section, depth = 0 }: { section: NavSection; depth?: number }) {
  const Heading = depth === 0 ? "h2" : "h3";
  return (
    <>
      <Heading id={section.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
        {section.label}
      </Heading>
      {section.items?.length ? (
        <ul>
          {section.items.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      ) : null}
      {section.sections?.map((child) => (
        <Section key={child.label} section={child} depth={depth + 1} />
      ))}
    </>
  );
}

/** Every `href` anywhere in the nav tree. */
function navHrefs(sections: NavSection[]): Set<string> {
  const found = new Set<string>();
  const walk = (list: NavSection[]) => {
    for (const section of list) {
      for (const item of section.items ?? []) found.add(item.href);
      walk(section.sections ?? []);
    }
  };
  walk(sections);
  return found;
}

/** `docs/api/style-props` -> `Style props`. */
function labelFor(route: string): string {
  const slug = route.split("/").pop() ?? route;
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function AllPagesIndex() {
  const sections = (nav as { sections: NavSection[] }).sections;

  /**
   * Pages that exist but no nav section claims — today `/docs/api/style-props`
   * and `/docs/icons/icon`, reachable only from prose. Deriving them rather than
   * listing them means this index stays complete when the next one appears.
   */
  const linked = navHrefs(sections);
  const orphans = contentRoutes
    .filter((route) => route.startsWith("docs/") && !linked.has(`/${route}`))
    .map((route) => ({ label: labelFor(route), href: `/${route}` }));

  return (
    <>
      <h1>All pages</h1>
      <p>
        Every page in the Knit UI documentation, grouped the way the sidebar groups them. Looking
        for something specific? Press <kbd>/</kbd> to search.
      </p>
      {sections.map((section) => (
        <Section key={section.label} section={section} />
      ))}
      {orphans.length > 0 ? (
        <Section section={{ label: "Also in the docs", items: orphans }} />
      ) : null}
    </>
  );
}
