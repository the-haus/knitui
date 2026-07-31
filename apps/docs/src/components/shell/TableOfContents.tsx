"use client";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

type Heading = { id: string; text: string; depth: number };

/**
 * The right-hand contents rail.
 *
 * Headings are read from the rendered DOM rather than threaded through from a
 * remark plugin: MDX pages compose generated sections (`<Examples>`, `<Props>`)
 * that emit their own headings, so the DOM is the only place the real, final
 * outline exists.
 */
export function TableOfContents() {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>();

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLHeadingElement>(".prose h2[id], .prose h3[id]"),
    );
    setHeadings(
      nodes.map((node) => ({
        id: node.id,
        text: node.textContent?.replace(/#$/, "").trim() ?? node.id,
        depth: node.tagName === "H2" ? 2 : 3,
      })),
    );

    if (!nodes.length) return undefined;

    // Highlight the heading nearest the top of the viewport. `rootMargin` biases
    // the intersection band to the upper third so the active item changes as a
    // section's heading reaches reading position, not when it leaves the screen.
    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -66% 0px", threshold: [0, 1] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [pathname]);

  if (headings.length < 2) return <aside className="toc" />;

  return (
    <aside className="toc">
      <p className="toc__title">On this page</p>
      <ul className="toc__list">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              className="toc__link"
              href={`#${heading.id}`}
              data-depth={heading.depth}
              data-active={activeId === heading.id}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
