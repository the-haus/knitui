/**
 * SEO helpers shared by every route.
 *
 * Everything here exists because the docs pages get their `title`/`description`
 * from prose sources — MDX `meta` exports and the component registry — which are
 * written for READERS, not for a search result. Three things follow from that:
 *
 *   1. Those strings are markdown. `` `Typography` is a wrapper… `` renders as
 *      literal backticks in a Google snippet, so the markup has to come out.
 *   2. They are long. The registry descriptions run to 800+ characters; Google
 *      renders ~155–160 and truncates mid-word. `snippet()` cuts on a sentence
 *      or word boundary instead.
 *   3. They are page-relative. Next only emits `og:url`/canonical if it is told
 *      the absolute URL per route, so `pageMetadata()` takes the route and
 *      builds both — without it every page claims to be the homepage.
 */

import type { Metadata } from "next";

export const SITE_URL = "https://knitui.dev";
export const SITE_NAME = "Knit UI";
export const REPO_URL = "https://github.com/the-haus/knitui";

/** The social card. Source + regeneration steps: `scripts/og-card.html`. */
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Knit UI — one component kit for iOS, Android and web",
};

/** Google renders ~155–160 chars of a description; leave headroom for the brand. */
const SNIPPET_MAX = 155;

/**
 * Flatten inline markdown to the plain text a SERP snippet should contain.
 *
 * Deliberately narrow: this runs over hand-written prose, not arbitrary
 * markdown, so it handles the constructs the content actually uses (code spans,
 * emphasis, links) and leaves everything else alone rather than risking a
 * mangled sentence from an over-clever regex.
 */
export function plainText(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\s)\*([^*\n]+)\*/g, "$1$2")
    .replace(/(^|\s)_([^_\n]+)_/g, "$1$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A description sized for a search result.
 *
 * Prefers to end on a sentence: a snippet that stops at a full stop reads as
 * deliberate, where one that stops at `…` reads as truncated content. Falls back
 * to the last word boundary before the limit.
 */
export function snippet(input: string, max: number = SNIPPET_MAX): string {
  const text = plainText(input);
  if (text.length <= max) return text;

  // A sentence end that lands in the back half of the budget beats a hard cut.
  const sentence = text.slice(0, max + 1).match(/^[\s\S]*[.!?](?=\s)/);
  if (sentence && sentence[0].length >= max * 0.6) return sentence[0].trim();

  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\-—]$/, "")}…`;
}

/** Absolute URL for a site-relative route. `trailingSlash: false` in next.config. */
export function absoluteUrl(path: string): string {
  if (path === "/" || path === "") return SITE_URL;
  return `${SITE_URL}/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

/**
 * Per-route metadata: title, cleaned description, canonical, and the social
 * tags that have to agree with it.
 *
 * `alternates.canonical` is the load-bearing field. Next derives `og:url` from
 * it, so setting it here fixes both at once — without it the root layout's
 * static `openGraph.url` makes all 265 pages declare themselves the homepage,
 * which is exactly the signal that collapses a site into one indexed URL.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex,
}: {
  title?: string;
  description?: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const desc = description ? snippet(description) : undefined;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      url,
      title: title ? `${title} · ${SITE_NAME}` : SITE_NAME,
      description: desc,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} · ${SITE_NAME}` : SITE_NAME,
      description: desc,
      images: [OG_IMAGE.url],
    },
    // `follow` keeps a noindex page passing link equity to the pages it points
    // at, rather than dead-ending the crawl.
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}
