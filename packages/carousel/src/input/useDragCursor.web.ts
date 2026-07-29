import * as React from "react";

import type { DragCursorParams } from "./useDragCursor";

/** Pixels of pointer travel before a press counts as a drag — below it the
 * press is still a click on a slide, and the cursor must not flinch. */
const DRAG_THRESHOLD = 5;

/**
 * The `grabbing` cursor for the transform-mode track on web.
 *
 * The drag itself is RNGH's `Gesture.Pan()` (`useDragGesture`, shared with
 * native), which knows nothing about cursors — so a mouse user got no feedback
 * that the rail was moving with the pointer. Deliberately NO idle `grab`: the
 * cursor is untouched until travel passes `DRAG_THRESHOLD`, so hovering the
 * carousel (and plain clicks on a slide) look exactly as they did before.
 *
 * Scoped to `pointerType === "mouse"`: touch and pen have no cursor to change.
 * The move / release listeners sit on the DOCUMENT, not the host — a drag
 * routinely travels and ends outside the carousel, and a `pointerup` we never
 * heard would leave the cursor stuck on `grabbing`.
 */
export function useDragCursor({ hostRef, enabled }: DragCursorParams): void {
  React.useEffect(() => {
    if (!enabled) return;
    const el = hostRef.current as HTMLElement | null;
    if (!el || typeof el.addEventListener !== "function") return;

    // Whatever the carousel's own styling asked for — restored on release.
    let restoreCursor = "";
    let pointerId = -1;
    let dragging = false;
    let startX = 0;
    let startY = 0;

    const onPointerMove = (e: PointerEvent) => {
      if (dragging || e.pointerId !== pointerId) return;
      if (Math.hypot(e.clientX - startX, e.clientY - startY) < DRAG_THRESHOLD) return;
      dragging = true;
      restoreCursor = el.style.cursor;
      el.style.cursor = "grabbing";
    };

    const endDrag = (e: PointerEvent) => {
      if (pointerId === -1 || e.pointerId !== pointerId) return;
      pointerId = -1;
      document.removeEventListener("pointermove", onPointerMove);
      if (!dragging) return;
      dragging = false;
      el.style.cursor = restoreCursor;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      document.addEventListener("pointermove", onPointerMove);
    };

    el.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);
      // Unmounted mid-drag: don't leave `grabbing` behind on a reused node.
      if (dragging) el.style.cursor = restoreCursor;
    };
  }, [hostRef, enabled]);
}
