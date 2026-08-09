"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "./BrandMark";
import { ChromePortal } from "./ChromePortal";
import { isSectionActive, TOP_LEVEL } from "./nav-links";
import { Sidebar } from "./Sidebar";

/**
 * Must match the breakpoint that shows `.header__burger` in `globals.css`. Above
 * it there is no burger, so an open drawer would have no visible way out.
 */
const PHONE_QUERY = "(max-width: 900px)";

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
 * The overlay goes through `ChromePortal` — the header's `backdrop-filter` is a
 * containing block for fixed positioning, which flattens the drawer to nothing if
 * it renders in place. See that file.
 *
 * Dialog behaviour is hand-rolled because it must be: Escape closes and returns
 * focus to the burger, Tab is trapped inside, the scrim closes on click, the body
 * stops scrolling while open, and following any link closes it — otherwise
 * tapping a link leaves the drawer sitting over the page you just navigated to.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const burgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    // `preventScroll` matters: the page underneath is scroll-locked but still
    // programmatically scrollable, and a plain focus() scrolls the burger into
    // view — which threw the page back to the top every time the menu closed.
    burgerRef.current?.focus({ preventScroll: true });
  }, []);

  // Navigating is the success case for this menu, so it closes itself.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /*
   * Growing past the breakpoint closes the drawer. Rotating a tablet from portrait
   * to landscape crosses it, and the CSS hides the burger on the way — which would
   * leave a phone drawer over the desktop layout, body scroll still locked, and no
   * control on screen to dismiss it.
   */
  useEffect(() => {
    if (!open) return undefined;
    const query = window.matchMedia(PHONE_QUERY);
    const sync = () => {
      if (!query.matches) setOpen(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
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
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  /*
   * Scroll lock.
   *
   * `overflow: hidden` on `body` is not enough. It stops wheel and touch, but it
   * leaves the document programmatically scrollable, so anything that scrolls an
   * element into view — focus(), an anchor, a nested scroller reaching its end —
   * still moves the page behind the scrim. Pinning `body` at `-scrollY` freezes
   * the position outright, which is also the only lock iOS Safari honours.
   *
   * The offset is restored on close; `instant` because `html` sets
   * `scroll-behavior: smooth`, which would otherwise animate the restore and let
   * the page visibly fly back into place.
   */
  useEffect(() => {
    if (!open) return undefined;
    const { body } = document;
    const scrollY = window.scrollY;
    const previousStyle = body.getAttribute("style");

    body.style.position = "fixed";
    body.style.top = `${-scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      if (previousStyle === null) body.removeAttribute("style");
      else body.setAttribute("style", previousStyle);
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, [open]);

  // Move focus into the drawer when it opens, so the next Tab is inside it.
  useEffect(() => {
    if (!open) return;
    drawerRef.current
      ?.querySelector<HTMLElement>("a[href], button")
      ?.focus({ preventScroll: true });
  }, [open]);

  return (
    <>
      <button
        ref={burgerRef}
        type="button"
        className="header__burger"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="header__burger-bars" aria-hidden="true" />
      </button>

      {open ? (
        <ChromePortal>
          <div className="nav-drawer__scrim" role="presentation" onClick={close} />
          <div
            ref={drawerRef}
            className="nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            /*
             * Closing on `pathname` alone misses the case where the link points at
             * the page you are already on: the route never changes, so the drawer
             * would sit there looking stuck. Any link activation closes it.
             */
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a[href]")) setOpen(false);
            }}
          >
            {/*
             * The drawer covers the header, so it has to carry the header's job
             * for as long as it is up: the brand stays on screen and the close
             * control sits exactly where the burger was, at the same size, so the
             * open/close tap target does not move under your thumb.
             */}
            <div className="nav-drawer__head">
              <button
                type="button"
                className="nav-drawer__close"
                aria-label="Close navigation"
                onClick={close}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <span className="nav-drawer__brand">
                <BrandMark className="header__mark" size={24} id="knit-mark-drawer" />
                Knit UI
              </span>
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
        </ChromePortal>
      ) : null}
    </>
  );
}
