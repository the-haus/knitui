import type { Metadata } from "next";

import { contentMetadata, docsRouteSegments, loadContent } from "@/lib/content";

type Params = { slug: string[] };

/**
 * Every documentation page below `/docs`.
 *
 * Prose lives in `apps/docs/content/**.mdx`, indexed into `content-map.ts` by
 * `scripts/docs/build-content.mjs`. Routing through one real `page.tsx` keeps
 * every MDX file a SERVER module — which is what lets generated sections
 * (`<Examples>`, `<PropsTable>`) read the registry off disk — and lets page titles
 * come from a plain `meta` export instead of the `metadata` export that Next
 * rejects in MDX.
 */
export async function generateStaticParams(): Promise<Params[]> {
  return docsRouteSegments();
}

const routeOf = async (params: Promise<Params>) => `docs/${(await params).slug.join("/")}`;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return contentMetadata(await routeOf(params));
}

export default async function DocsPage({ params }: { params: Promise<Params> }) {
  const { default: Content } = await loadContent(await routeOf(params));
  return <Content />;
}
