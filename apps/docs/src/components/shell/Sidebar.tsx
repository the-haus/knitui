"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import navData from "@/generated/nav.json";

type NavLeaf = { label: string; href: string };
type NavSubsection = { label: string; items: NavLeaf[] };
type NavSection = {
  label: string;
  collapsed: boolean;
  items: NavLeaf[];
  sections: NavSubsection[];
};

const sections = (navData as { sections: NavSection[] }).sections;

/**
 * The docs sidebar.
 *
 * Data comes from `src/generated/nav.json` — the editorial IA in
 * `scripts/docs/nav.config.mjs` resolved against the story registry, so every
 * component with a story is listed without anyone maintaining a list. The JSON is
 * label+href only (~260 links) precisely because this component is interactive
 * and therefore client-side; the full registry stays on the server.
 *
 * A section is open when it is collapsed=false or contains the current route.
 *
 * `className` is how the mobile drawer reuses this tree (`sidebar--drawer`)
 * instead of shipping a second copy of the IA.
 */
export function Sidebar({ className }: { className?: string } = {}) {
  const pathname = usePathname();
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  return (
    <nav className={["sidebar", className].filter(Boolean).join(" ")} aria-label="Documentation">
      {sections.map((section) => {
        const contains = sectionContains(section, pathname);
        const open = overrides[section.label] ?? (!section.collapsed || contains);

        return (
          <div className="sidebar__section" key={section.label}>
            <button
              type="button"
              className="sidebar__title"
              aria-expanded={open}
              onClick={() => setOverrides((current) => ({ ...current, [section.label]: !open }))}
            >
              {section.label}
              <span className="sidebar__chevron" aria-hidden="true">
                ▾
              </span>
            </button>

            {open ? (
              <>
                {section.items.length ? (
                  <ul className="sidebar__list">
                    {section.items.map((item) => (
                      <SidebarLink key={item.href} item={item} pathname={pathname} />
                    ))}
                  </ul>
                ) : null}

                {section.sections.map((sub) => (
                  <div key={sub.label}>
                    <p className="sidebar__group">{sub.label}</p>
                    <ul className="sidebar__list">
                      {sub.items.map((item) => (
                        <SidebarLink key={item.href} item={item} pathname={pathname} />
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarLink({ item, pathname }: { item: NavLeaf; pathname: string }) {
  const active = pathname === item.href;
  return (
    <li>
      <Link
        className="sidebar__link"
        href={item.href}
        data-active={active}
        aria-current={active ? "page" : undefined}
      >
        {item.label}
      </Link>
    </li>
  );
}

function sectionContains(section: NavSection, pathname: string) {
  return (
    section.items.some((i) => i.href === pathname) ||
    section.sections.some((s) => s.items.some((i) => i.href === pathname))
  );
}

/** Flat, ordered list of every documentation link — powers prev/next paging. */
export const flatNav: NavLeaf[] = sections.flatMap((section) => [
  ...section.items,
  ...section.sections.flatMap((sub) => sub.items),
]);
