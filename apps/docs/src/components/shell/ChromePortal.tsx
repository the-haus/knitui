"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders header overlays into `document.body`.
 *
 * Non-trivial, and load-bearing: `.header` carries `backdrop-filter`, and a
 * backdrop-filter other than `none` makes the element a CONTAINING BLOCK for its
 * `position: fixed` descendants — exactly like `transform` or `filter` do. So a
 * `position: fixed; inset: 0` scrim rendered inside the header does not cover the
 * viewport at all; it covers the 3.5rem header box. The nav drawer collapsed to
 * zero height and the search dialog landed on top of the header because of this.
 *
 * The trigger buttons have to live in the header, so the overlays are the part
 * that moves: portalled to `document.body`, out of the header's containing block
 * and out of its `z-index: 50` stacking context.
 *
 * Anything the header renders as `position: fixed` belongs in here.
 */
export function ChromePortal({ children }: { children: ReactNode }) {
  // Overlays only ever open in response to a user gesture, so this never runs
  // during the static export's prerender — but the guard keeps that a fact about
  // the callers rather than an assumption baked into the portal.
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
