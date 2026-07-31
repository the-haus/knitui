import type { Metadata } from "next";

import { contentMetadata, loadContent } from "@/lib/content";

/** The `/docs` index — `content/docs/index.mdx`. See `[...slug]/page.tsx`. */
export async function generateMetadata(): Promise<Metadata> {
  return contentMetadata("docs");
}

export default async function DocsIndexPage() {
  const { default: Content } = await loadContent("docs");
  return <Content />;
}
