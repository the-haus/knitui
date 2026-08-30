import type { Metadata } from "next";

import { DocsJsonLd } from "@/components/seo/JsonLd";
import { contentMetadata, loadContent } from "@/lib/content";

/** The `/docs` index — `content/docs/index.mdx`. See `[...slug]/page.tsx`. */
export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata("docs");
}

export default async function DocsIndexPage() {
  const { default: Content, meta } = await loadContent("docs");
  return (
    <>
      <DocsJsonLd route="docs" title={meta?.title} description={meta?.description} />
      <Content />
    </>
  );
}
