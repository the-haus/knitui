import type { ReactNode } from "react";

import { Header } from "@/components/shell/Header";
import { Pager } from "@/components/shell/Pager";
import { Sidebar } from "@/components/shell/Sidebar";
import { TableOfContents } from "@/components/shell/TableOfContents";

/**
 * The documentation shell: sticky header, generated sidebar, prose column,
 * contents rail, prev/next pager.
 *
 * `data-pagefind-body` on the prose column scopes the search index to real
 * content — chrome (nav, TOC, pager) is repeated on all ~250 pages and would
 * otherwise dominate every result.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <Header />
      <div className="layout">
        <Sidebar />
        <main className="content">
          <article className="prose" data-pagefind-body>
            {children}
          </article>
          <Pager />
        </main>
        <TableOfContents />
      </div>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span>MIT licensed · © The Haus</span>
        <span>
          <a href="https://github.com/the-haus/knitui">GitHub</a>
          {" · "}
          <a href="https://www.npmjs.com/org/knitui">npm</a>
          {" · "}
          <a href="https://the-haus.github.io/knitui">Storybook</a>
        </span>
      </div>
    </footer>
  );
}
