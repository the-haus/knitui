"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

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

type Hit = { url: string; title: string; excerpt: string; section: string };

const MAX_HITS = 8;

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
 *
 * Keyboard model is the one ⌘K users already have: type, ↑/↓ to move, Enter to
 * open, Escape to dismiss. The input keeps focus the whole time and the active
 * result is pointed at with `aria-activedescendant`, which is what lets a screen
 * reader announce the highlighted row without moving the caret out of the field.
 */
export function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "searching" | "unavailable">("idle");
  const pagefindRef = useRef<Pagefind | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Nothing behind the dialog should scroll while it is up.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
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
      setActive(0);
      return undefined;
    }
    let cancelled = false;
    setStatus((current) => (current === "unavailable" ? current : "searching"));

    const timer = setTimeout(async () => {
      const pagefind = await load();
      if (!pagefind || cancelled) return;
      const search = await pagefind.search(query);
      const top = await Promise.all(search.results.slice(0, MAX_HITS).map((r) => r.data()));
      if (cancelled) return;
      setHits(
        top.map((item) => {
          const url = item.url.replace(/\.html$/, "");
          return {
            url,
            title: item.meta?.title ?? url,
            excerpt: item.excerpt,
            section: sectionOf(url),
          };
        }),
      );
      // A fresh result set always starts at the top, so Enter is predictable.
      setActive(0);
      setStatus("idle");
    }, 140);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, load]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Tab") {
      // The dialog holds one input and a list of links; keep Tab inside it.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled]), input",
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (!hits.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + hits.length) % hits.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(hits.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = hits[active];
      if (hit) {
        setOpen(false);
        router.push(hit.url);
      }
    }
  };

  const message = useMemo(() => {
    if (status === "unavailable") return null;
    if (!query.trim()) return "Type to search the documentation.";
    if (status === "searching" || status === "loading") return "Searching…";
    if (!hits.length) return `No results for “${query.trim()}”.`;
    return null;
  }, [status, query, hits.length]);

  return (
    <>
      <button ref={triggerRef} type="button" className="button-quiet" onClick={() => setOpen(true)}>
        Search <kbd>⌘K</kbd>
      </button>

      {open ? (
        <div
          className="search__scrim"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            ref={dialogRef}
            className="search__dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search documentation"
            onKeyDown={onKeyDown}
          >
            <input
              ref={inputRef}
              className="search__input"
              type="text"
              value={query}
              placeholder="Search components, props, guides…"
              onChange={(event) => setQuery(event.target.value)}
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={hits.length ? `${listId}-${active}` : undefined}
              autoComplete="off"
              spellCheck={false}
            />

            <div className="search__results">
              {status === "unavailable" ? (
                <p className="search__message">
                  Search runs on the production build — the index is generated after
                  <code> next build</code>.
                </p>
              ) : null}

              {message ? <p className="search__message">{message}</p> : null}

              <ul className="search__list" id={listId} role="listbox" aria-label="Search results">
                {hits.map((hit, index) => (
                  <li key={hit.url} role="presentation">
                    <a
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={index === active}
                      data-active={index === active}
                      className="search__hit"
                      href={hit.url}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setActive(index)}
                    >
                      <span className="search__hit-head">
                        <span className="search__hit-title">{hit.title}</span>
                        <span className="search__hit-section">{hit.section}</span>
                      </span>
                      <span
                        className="search__hit-excerpt"
                        // Pagefind marks the matched terms with <mark> in its excerpt.
                        dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="search__footer">
              <span>
                <kbd>↑</kbd> <kbd>↓</kbd> to navigate
              </span>
              <span>
                <kbd>↵</kbd> to open
              </span>
              <span>
                <kbd>esc</kbd> to close
              </span>
            </div>

            {/* Announced to screen readers; the visible count is the list itself. */}
            <p aria-live="polite" className="visually-hidden">
              {hits.length ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : ""}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * The breadcrumb chip on a result row.
 *
 * Pagefind returns a URL and a title; the section is what tells a reader whether
 * "Motion" is the Foundations page or the overlays component, which is exactly
 * the ambiguity that makes an un-grouped result list feel unreliable.
 */
function sectionOf(url: string): string {
  const parts = url.split("/").filter(Boolean);
  if (parts[0] === "changelog") return "Changelog";
  // /docs/<group>/<subgroup>/<page>
  const group = parts[1];
  const subgroup = parts.length > 3 ? parts[2] : undefined;
  const label = (value?: string) =>
    value
      ? value
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : undefined;

  return [label(group), label(subgroup)].filter(Boolean).join(" · ") || "Docs";
}
