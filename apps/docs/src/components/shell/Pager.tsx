"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { flatNav } from "./Sidebar";

/**
 * Previous / next links, ordered by the sidebar's own traversal order — so
 * "read the docs front to back" follows the editorial IA rather than the
 * filesystem.
 */
export function Pager() {
  const pathname = usePathname();
  const index = flatNav.findIndex((item) => item.href === pathname);
  if (index === -1) return null;

  const previous = flatNav[index - 1];
  const next = flatNav[index + 1];
  if (!previous && !next) return null;

  return (
    <nav className="pager" aria-label="Page navigation">
      {previous ? (
        <Link className="pager__link" href={previous.href}>
          <span className="pager__kind">Previous</span>
          <span className="pager__label">{previous.label}</span>
        </Link>
      ) : (
        <span className="pager__link" style={{ visibility: "hidden" }} />
      )}
      {next ? (
        <Link className="pager__link pager__link--next" href={next.href}>
          <span className="pager__kind">Next</span>
          <span className="pager__label">{next.label}</span>
        </Link>
      ) : null}
    </nav>
  );
}
