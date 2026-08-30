import { contentRoutes } from "@/generated/content-map";
import { absoluteUrl, REPO_URL, SITE_NAME, SITE_URL, snippet } from "@/lib/seo";

/**
 * Structured data.
 *
 * Two schemas earn their place on a documentation site:
 *
 *   - `BreadcrumbList` is the one Google renders directly — it replaces the raw
 *     URL under a result with `knitui.dev › Components › Inputs › Button`, which
 *     is both a CTR win and the only way a 4-level-deep component page reads as
 *     part of a structured library rather than a loose page.
 *   - `TechArticle` types the page as documentation rather than marketing, which
 *     is what the developer-intent surfaces key off.
 *
 * Rendered as a plain `<script>` because these are server components and the
 * payload is build-time constant — no client JS is involved. `JSON.stringify`
 * output is escaped for `<` so a description containing markup can never break
 * out of the script element.
 */

/** `</script>` in a JSON string literal would end the element early. */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function Script({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />
  );
}

/** Title-cases a route segment for a breadcrumb label: `data-display` → `Data display`. */
function label(segment: string): string {
  const words = segment.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Breadcrumbs for a docs route, plus the `TechArticle` describing the page.
 *
 * `titles` lets a caller override the label for a segment that has a real page
 * title — the breadcrumb for `/docs/components/inputs/button` should read
 * "Button", not the slug — while intermediate segments with no page of their own
 * fall back to the prettified slug.
 */
export function DocsJsonLd({
  route,
  title,
  description,
}: {
  route: string;
  title?: string;
  description?: string;
}) {
  const segments = route.replace(/^\/+/, "").split("/").filter(Boolean);

  /**
   * Only segments that are real pages become crumbs.
   *
   * Grouping folders like `components/inputs` and `foundations` have no page of
   * their own, so linking them would put a 404 in the trail — which Google flags
   * rather than renders. The last segment is always kept: it is this page.
   */
  const crumbs = segments
    .map((segment, index) => ({ segment, path: segments.slice(0, index + 1).join("/") }))
    .filter(({ path }, index) => index === segments.length - 1 || contentRoutes.includes(path));

  const itemListElement = [
    { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
    ...crumbs.map(({ segment, path }, index) => ({
      "@type": "ListItem",
      position: index + 2,
      // The last crumb gets the page's real title; the rest are section slugs.
      name: index === crumbs.length - 1 && title ? title : label(segment),
      item: absoluteUrl(path),
    })),
  ];

  const url = absoluteUrl(route);

  return (
    <>
      <Script
        data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement }}
      />
      <Script
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: title,
          description: description ? snippet(description) : undefined,
          url,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
          publisher: { "@type": "Organization", name: "the.haus", url: REPO_URL },
          // The audience signal that separates docs from marketing copy.
          proficiencyLevel: "Beginner",
          dependencies: "React, React Native, Tamagui",
        }}
      />
    </>
  );
}

/**
 * Homepage graph: the site itself, the organisation behind it, and the library
 * as a `SoftwareSourceCode` entity — the type that actually fits a component
 * library. `SoftwareApplication` would imply an installable end-user app.
 */
export function SiteJsonLd({
  version,
  componentCount,
}: {
  version?: string;
  componentCount: number;
}) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: SITE_NAME,
            url: SITE_URL,
            description:
              "Cross-platform React Native and web component library sharing one design system.",
            inLanguage: "en",
            publisher: { "@id": `${SITE_URL}/#org` },
          },
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#org`,
            name: "the.haus",
            url: SITE_URL,
            logo: `${SITE_URL}/favicon.svg`,
            sameAs: [REPO_URL, "https://www.npmjs.com/org/knitui"],
          },
          {
            "@type": "SoftwareSourceCode",
            "@id": `${SITE_URL}/#software`,
            name: SITE_NAME,
            description: `An open-source cross-platform component library: ${componentCount} React Native and web components sharing one design system, one import.`,
            url: SITE_URL,
            codeRepository: REPO_URL,
            programmingLanguage: "TypeScript",
            runtimePlatform: ["React Native", "React", "Expo", "Next.js"],
            license: "https://opensource.org/licenses/MIT",
            ...(version ? { version } : {}),
            author: { "@id": `${SITE_URL}/#org` },
          },
        ],
      }}
    />
  );
}
