/**
 * The repository, in one place.
 *
 * Four different files were spelling out `github.com/the-haus/knitui` — the
 * header, the footer, the component masthead and now the edit link. A rename or a
 * default-branch change should be one edit, not a grep.
 */
export const REPO_URL = "https://github.com/the-haus/knitui";
export const DEFAULT_BRANCH = "main";

/** Read-only view of a repo-relative path. */
export const blobUrl = (path: string) => `${REPO_URL}/blob/${DEFAULT_BRANCH}/${path}`;

/** GitHub's web editor for a repo-relative path. */
export const editUrl = (path: string) => `${REPO_URL}/edit/${DEFAULT_BRANCH}/${path}`;

/**
 * The MDX file behind a docs route.
 *
 * Every content route is `/docs/<slug>` and every page is
 * `apps/docs/content/docs/<slug>.mdx` — verified against the generated route map,
 * where all 179 routes derive without exception. Returns null off the docs tree
 * (the landing page and /changelog are TSX, not content).
 */
export function contentPathForRoute(pathname: string): string | null {
  if (!pathname.startsWith("/docs")) return null;
  const slug = pathname.replace(/^\/docs\/?/, "").replace(/\/$/, "");
  if (!slug) return "apps/docs/content/docs/index.mdx";
  return `apps/docs/content/docs/${slug}.mdx`;
}
