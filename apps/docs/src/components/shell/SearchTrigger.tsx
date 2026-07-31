"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PagefindResult = {
  id: string;
  data: () => Promise<{
    url: string;
    meta?: { title?: string };
    excerpt: string;
  }>;
};

type Pagefind = {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
  init?: () => Promise<void>;
};

type Hit = { url: string; title: string; excerpt: string };

/**
 * Site search — Pagefind, loaded on demand.
 *
 * Pagefind indexes the EXPORTED HTML after `next build` (see
 * `scripts/postbuild.mjs`), so the index is a static asset served next to the
 * pages, with no search service and no index shipped in the app bundle. It only
 * exists in a production build; in `next dev` the dialog says so instead of
 * failing.
 *
 * The bundler must not try to resolve `/pagefind/pagefind.js` — it doesn't exist
 * at compile time — hence the `webpackIgnore` comment on the dynamic import.
 */
export function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "unavailable">("idle");
  const pagefindRef = useRef<Pagefind | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const load = useCallback(async () => {
    if (pagefindRef.current) return pagefindRef.current;
    setStatus("loading");
    try {
      // The path is resolved by the BROWSER at runtime, not by the bundler or
      // TypeScript — `/pagefind/pagefind.js` only exists after `next build`
      // (see scripts/postbuild.mjs), so the specifier is hidden behind a
      // variable and `webpackIgnore` keeps webpack from trying to resolve it.
      const specifier = "/pagefind/pagefind.js";
      const pagefind = (await import(/* webpackIgnore: true */ specifier)) as Pagefind;
      await pagefind.init?.();
      pagefindRef.current = pagefind;
      setStatus("idle");
      return pagefind;
    } catch {
      setStatus("unavailable");
      return null;
    }
  }, []);

  useEffect(() => {
    if (!open || !query.trim()) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const pagefind = await load();
      if (!pagefind || cancelled) return;
      const search = await pagefind.search(query);
      const top = await Promise.all(search.results.slice(0, 8).map((result) => result.data()));
      if (cancelled) return;
      setHits(
        top.map((item) => ({
          url: item.url.replace(/\.html$/, ""),
          title: item.meta?.title ?? item.url,
          excerpt: item.excerpt,
        })),
      );
    }, 140);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, load]);

  return (
    <>
      <button type="button" className="button-quiet" onClick={() => setOpen(true)}>
        Search <kbd>⌘K</kbd>
      </button>

      {open ? (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "grid",
            placeItems: "start center",
            padding: "10vh 1rem",
            background: "rgba(0,0,0,0.4)",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search documentation"
            style={{
              width: "min(36rem, 100%)",
              border: "1px solid var(--docs-border)",
              borderRadius: "var(--docs-radius)",
              background: "var(--docs-bg)",
              overflow: "hidden",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Search components, props, guides…"
              onChange={(event) => setQuery(event.target.value)}
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                border: 0,
                borderBottom: "1px solid var(--docs-border)",
                background: "transparent",
                color: "var(--docs-fg)",
                font: "inherit",
                fontSize: "1rem",
                outline: "none",
              }}
            />
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {status === "unavailable" ? (
                <p style={{ padding: "1rem", color: "var(--docs-muted)", fontSize: "0.875rem" }}>
                  Search runs on the production build — the index is generated after
                  <code> next build</code>.
                </p>
              ) : null}
              {hits.map((hit) => (
                <a
                  key={hit.url}
                  href={hit.url}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--docs-border)",
                  }}
                >
                  <span style={{ color: "var(--docs-fg)", fontWeight: 600 }}>{hit.title}</span>
                  <span
                    style={{
                      display: "block",
                      color: "var(--docs-muted)",
                      fontSize: "0.8125rem",
                    }}
                    // Pagefind marks the matched terms with <mark> in its excerpt.
                    dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
