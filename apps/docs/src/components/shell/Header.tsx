"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "./BrandMark";
import { ColorSchemeToggle } from "./ColorSchemeToggle";
import { SearchTrigger } from "./SearchTrigger";

const TOP_LEVEL = [
  ["Docs", "/docs"],
  ["Components", "/docs/components/inputs/button"],
  ["Foundations", "/docs/foundations/tokens"],
  ["Guides", "/docs/guides/cross-platform-authoring"],
  ["Changelog", "/changelog"],
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="header">
      <Link href="/" className="header__brand">
        <BrandMark className="header__mark" size={24} id="knit-mark-header" />
        Knit UI
      </Link>

      <nav className="header__nav" aria-label="Main">
        {TOP_LEVEL.map(([label, href]) => (
          <Link key={href} href={href} data-active={isSectionActive(pathname, href)}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="header__spacer" />

      <div className="header__actions">
        <SearchTrigger />
        <ColorSchemeToggle />
        <a
          className="button-quiet"
          href="https://github.com/the-haus/knitui"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}

/** A top-level tab is active when the current route sits under its section. */
function isSectionActive(pathname: string, href: string) {
  const section = href.split("/").slice(0, 3).join("/");
  return pathname === href || pathname.startsWith(`${section}/`) || pathname === section;
}
