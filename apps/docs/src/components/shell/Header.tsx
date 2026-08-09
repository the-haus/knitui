"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "./BrandMark";
import { ColorSchemeToggle } from "./ColorSchemeToggle";
import { MobileNav } from "./MobileNav";
import { isSectionActive, TOP_LEVEL } from "./nav-links";
import { SearchTrigger } from "./SearchTrigger";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="header">
      {/* Before the brand, so the first Tab on a phone reaches navigation. */}
      <MobileNav />

      {/*
       * The wordmark is hidden on a phone — see `.header__wordmark`. The mark
       * alone carries the brand in the cramped state, and the header stops
       * competing for room with the burger and the actions. The drawer covers the
       * header outright when it opens, and names the brand itself while it is up.
       */}
      <Link href="/" className="header__brand">
        <BrandMark className="header__mark" size={24} id="knit-mark-header" />
        <span className="header__wordmark">Knit UI</span>
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
          className="button-quiet header__github"
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
