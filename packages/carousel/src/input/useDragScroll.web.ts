import * as React from "react";

import type { DragScrollParams } from "./useDragScroll";

/** Pixels of pointer travel before a press becomes a drag — below it the press
 * stays a click so tapping a card still activates it. */
const DRAG_THRESHOLD = 5;

/**
 * Click-and-drag-to-scroll for the native-scroll track on web.
 *
 * Native scroll mode renders a real overflow-scroll surface, which the platform
 * scrolls itself from the wheel/trackpad, the scrollbar and touch — but a
 * desktop MOUSE cannot drag an overflow container, so a mouse user could only
 * reach the off-screen tiles via the wheel or the (hidden) scrollbar. This
 * grabs the scroll surface and pans `scrollLeft`/`scrollTop` with the pointer,
 * the "grab and drag" affordance a media rail is expected to have.
 *
 * Scoped to `pointerType === "mouse"`: touch and pen keep the container's own
 * native scrolling (with its momentum), which already works. Once travel passes
 * `DRAG_THRESHOLD` the drag captures the pointer, paints `grabbing` and swallows
 * the trailing `click`, so releasing on a card scrolls the rail instead of
 * opening the card. Idle hover is left alone (matching `useDragCursor`).
 */
export function useDragScroll({ scrollRef, enabled, vertical }: DragScrollParams): void {
  React.useEffect(() => {
    if (!enabled) return;
    // RN-web's ScrollView exposes its DOM node via `getScrollableNode()`.
    const node = scrollRef.current as { getScrollableNode?: () => unknown } | null;
    const el = (node?.getScrollableNode?.() ?? node) as HTMLElement | null;
    if (!el || typeof el.addEventListener !== "function") return;

    let active = false;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let pointerId = -1;

    // Whatever the track's own styling asked for — restored on release. No idle
    // `grab` hint: the cursor only changes once a drag is actually under way.
    const restoreCursor = el.style.cursor;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      active = true;
      dragging = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = el.scrollLeft;
      startTop = el.scrollTop;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragging) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        dragging = true;
        el.setPointerCapture?.(pointerId);
        el.style.cursor = "grabbing";
        el.style.userSelect = "none";
      }
      if (vertical) el.scrollTop = startTop - dy;
      else el.scrollLeft = startLeft - dx;
      e.preventDefault();
    };

    const endDrag = () => {
      if (!active) return;
      active = false;
      el.releasePointerCapture?.(pointerId);
      el.style.cursor = restoreCursor;
      el.style.userSelect = "";
      if (dragging) {
        // Swallow the click the browser fires after a drag-release (capture
        // phase, before it reaches a card), so letting go on a tile scrolls
        // rather than opening it. Drop the one-shot if no click follows.
        const swallow = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        el.addEventListener("click", swallow, { capture: true, once: true });
        setTimeout(() => el.removeEventListener("click", swallow, true), 0);
      }
      dragging = false;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.style.cursor = restoreCursor;
      el.style.userSelect = "";
    };
  }, [scrollRef, enabled, vertical]);
}
