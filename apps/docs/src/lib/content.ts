import "server-only";

import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { type ContentModule, contentModules, contentRoutes } from "@/generated/content-map";
import { pageMetadata } from "@/lib/seo";

/**
 * Shared resolution for the two content routes (`/docs` and `/docs/[...slug]`).
 *
 * Next needs a REQUIRED catch-all plus an explicit index page here: with
 * `output: "export"`, an optional catch-all (`[[...slug]]`) is rejected as
 * "missing generateStaticParams()" even when the export is present, so the index
 * route gets its own `page.tsx` and shares this module with the catch-all.
 */

/** Every documentation route as path segments, for `generateStaticParams`. */
export function docsRouteSegments(): { slug: string[] }[] {
  return contentRoutes
    .filter((route) => route.startsWith("docs/"))
    .map((route) => ({ slug: route.split("/").slice(1) }));
}

export async function loadContent(route: string): Promise<ContentModule> {
  const loader = contentModules[route];
  if (!loader) notFound();
  return loader();
}

/**
 * `<title>` / description / canonical / robots for a content route.
 *
 * The description is passed through `snippet()` rather than used verbatim: MDX
 * `meta` and the component registry are prose sources, so their descriptions
 * carry markdown and run past what a search result renders. See `lib/seo.ts`.
 */
export async function contentMetadata(route: string): Promise<Metadata> {
  const { meta } = await loadContent(route);
  return pageMetadata({
    title: meta?.title,
    description: meta?.description,
    path: `/${route}`,
    noindex: meta?.noindex,
  });
}
