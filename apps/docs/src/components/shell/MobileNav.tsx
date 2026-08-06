"use client";

import { useEffect, useId, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isSectionActive, TOP_LEVEL } from "./nav-links";
import { Sidebar } from "./Sidebar";

/**
 * The only navigation on a phone.
 *
 * Below 900px the header's top-level tabs and the docs sidebar are both hidden,
 * so this carries the whole IA: the tabs, then the same generated `Sidebar` tree
 * (one component, one set of section open/closed state — not a second copy that
 * can disagree with the desktop one).
 *
 * Plain HTML and CSS on purpose, like the rest of the chrome: pulling the kit's
 * `Drawer` in here would put react-native-web on the critical path of every
 * prose page, which the docs deliberately avoid (see `globals.css`).
 *
 * Dialog behaviour is hand-rolled because it must be: Escape closes and returns
 * focus to the burger, Tab is trapped inside, the scrim closes on click, the body
 * stops scrolling while open, and a route change closes it — otherwise tapping a
 * link leaves the drawer sitting over the page you just navigated to.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Navigating is the success case for this menu, so it closes itself.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        burgerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      // Focus trap. The drawer is a long list of links; without this, Tab walks
      // straight out into the page behind the scrim.
      const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Move focus into the drawer when it opens, so the next Tab is inside it.
  useEffect(() => {
    if (!open) return;
    drawerRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
  }, [open]);

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        className="header__burger"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="header__burger-bars" aria-hidden="true" />
      </button>

      {open ? (
        <>
          <div
            className="nav-drawer__scrim"
            role="presentation"
            onClick={() => {
              setOpen(false);
              burgerRef.current?.focus();
            }}
          />
          <div
            ref={drawerRef}
            className="nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className="nav-drawer__head">
              <span className="nav-drawer__label" id={titleId}>
                Navigation
              </span>
              <button
                type="button"
                className="button-quiet"
                onClick={() => {
                  setOpen(false);
                  burgerRef.current?.focus();
                }}
              >
                Close
              </button>
            </div>

            <div className="nav-drawer__tabs">
              {TOP_LEVEL.map(([label, href]) => (
                <Link key={href} href={href} data-active={isSectionActive(pathname, href)}>
                  {label}
                </Link>
              ))}
            </div>

            <Sidebar className="sidebar--drawer" />
          </div>
        </>
      ) : null}
    </>
  );
}
