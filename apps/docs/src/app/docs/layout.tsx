import type { ReactNode } from "react";

import Link from "next/link";

import { EditPage } from "@/components/shell/EditPage";
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
      {/*
       * First focusable element on the page. Every docs page puts a ~260-link
       * sidebar between the header and the prose, so skipping it is the
       * difference between one Tab and dozens.
       */}
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <Header />
      <div className="layout">
        <Sidebar />
        <main className="content" id="content" tabIndex={-1}>
          <article className="prose" data-pagefind-body>
            {children}
          </article>
          <EditPage />
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
          {/*
           * The sidebar only renders the section you are in, so most pages are
           * unreachable from any single page's HTML. This puts the full index one
           * click from everywhere.
           */}
          <Link href="/docs/all">All pages</Link>
          {" · "}
          <a href="https://github.com/the-haus/knitui">GitHub</a>
          {" · "}
          {/* Where to ask — the footer listed three places to READ and none to ask. */}
          <a href="https://github.com/the-haus/knitui/discussions">Discussions</a>
          {" · "}
          <a href="https://www.npmjs.com/org/knitui">npm</a>
          {" · "}
          <a href="https://the-haus.github.io/knitui">Storybook</a>
        </span>
      </div>
    </footer>
  );
}
