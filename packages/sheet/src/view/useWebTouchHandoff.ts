import * as React from "react";

import { EXPAND_EPSILON } from "../engine/handoff";
import type { SheetScrollContextValue } from "./scrollContext";

/** px the finger travels before a touch is read as a vertical pull, either way. */
const DIRECTION_SLOP = 2;

/**
 * Touch web: hand a drag in a sheet's scroller to the sheet when the list can't use it.
 *
 * On native the Pan and the list coordinate frame by frame (`ScrollView.native`). On
 * web the browser scrolls the list itself, and once it starts it cancels the Pan's
 * pointer, so a pull down on a list already at its top went nowhere instead of moving
 * the sheet. This listens to the list's touches and, on the first move, claims the
 * touch for the sheet (`preventDefault` on `touchmove`, so the browser never starts
 * its scroll and the Pan keeps the pointer) when:
 *
 *  - the list is at its top and the finger pulls down, or
 *  - the sheet is not at its most-open snap (a drag then moves the panel, as on native).
 *
 * Otherwise the browser scrolls the list as usual. The choice holds for the whole
 * touch: the browser can't hand a scroll it already started back mid-gesture. Mouse
 * and wheel input never reach this (touch events only).
 */
export function useWebTouchHandoff(
  ctx: SheetScrollContextValue | null,
  getNode: () => HTMLElement | null | undefined,
): void {
  const ctxRef = React.useRef(ctx);
  ctxRef.current = ctx;
  const getNodeRef = React.useRef(getNode);
  getNodeRef.current = getNode;
  const inSheet = ctx !== null;

  React.useEffect(() => {
    const node = getNodeRef.current();
    if (!inSheet || !node || typeof node.addEventListener !== "function") return undefined;

    let startX = 0;
    let startY = 0;
    let owner: "sheet" | "list" | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        owner = "list";
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      owner = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (owner === "list") return;
      if (owner === null) {
        const touch = e.touches[0];
        if (!touch) return;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dy) < DIRECTION_SLOP && Math.abs(dx) < DIRECTION_SLOP) return;
        const c = ctxRef.current;
        if (!c || !c.handoffEnabled || Math.abs(dx) > Math.abs(dy)) {
          owner = "list";
          return;
        }
        const expanded = c.sheetOffset.value <= c.expandedOffset + EXPAND_EPSILON;
        const atTop = node.scrollTop <= 0;
        owner = !expanded || (atTop && dy > 0) ? "sheet" : "list";
        if (owner === "list") return;
      }
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = () => {
      owner = null;
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    // Not passive: cancelling the move is the whole point.
    node.addEventListener("touchmove", onTouchMove, { passive: false });
    node.addEventListener("touchend", onTouchEnd);
    node.addEventListener("touchcancel", onTouchEnd);
    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchmove", onTouchMove);
      node.removeEventListener("touchend", onTouchEnd);
      node.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [inSheet]);
}
