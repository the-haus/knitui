"use client";

import { usePathname } from "next/navigation";

import { contentPathForRoute, editUrl } from "@/lib/github";

/**
 * "Edit this page" — the cheapest contribution path there is.
 *
 * Most of these pages are still scaffolds waiting on prose, so the readers who
 * notice a gap are exactly the people best placed to close it. One click into
 * GitHub's editor is the difference between a fix and a shrug.
 */
export function EditPage() {
  const pathname = usePathname();
  const path = contentPathForRoute(pathname);
  if (!path) return null;

  return (
    <p className="edit-page">
      <a href={editUrl(path)} target="_blank" rel="noreferrer">
        Edit this page on GitHub
      </a>
    </p>
  );
}
