/**
 * The top-level tabs, shared by the header and the mobile drawer.
 *
 * One list, two renderers: below 900px the header hides its tabs and the drawer
 * shows them instead, so a link added here appears in both without anyone
 * remembering the second place.
 *
 * `Components` points at the gallery index rather than a specific component —
 * "show me everything" is the common first action.
 */
export const TOP_LEVEL: ReadonlyArray<readonly [label: string, href: string]> = [
  ["Docs", "/docs"],
  ["Components", "/docs/components"],
  ["Foundations", "/docs/foundations/tokens"],
  ["Guides", "/docs/guides/cross-platform-authoring"],
  ["Changelog", "/changelog"],
];

/** A top-level tab is active when the current route sits under its section. */
export function isSectionActive(pathname: string, href: string) {
  const section = href.split("/").slice(0, 3).join("/");
  return pathname === href || pathname.startsWith(`${section}/`) || pathname === section;
}
