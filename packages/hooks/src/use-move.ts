import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import {
  clampMovePosition,
  type MovePosition,
  type UseMoveHandlers,
  type UseMoveReturn,
} from "./use-move.shared";

/**
 * Track pointer dragging over an element and report the normalized `[0, 1]`
 * position. Web implementation — mirrors Mantine's `useMove`.
 *
 * Wires `pointerdown` / `pointermove` / `pointerup` on `window` so the drag
 * keeps following the cursor even when it leaves the element, measuring via
 * `getBoundingClientRect`. The native counterpart lives in `use-move.native.ts`;
 * this file never imports `react-native` at runtime, so the web bundle stays
 * free of it.
 */
export function useMove(
  onChange: (position: MovePosition) => void,
  handlers?: UseMoveHandlers,
): UseMoveReturn {
  const ref = React.useRef<TamaguiElement | null>(null);

  // Mutable mirror so the (stable) listeners never read stale callbacks.
  const stateRef = React.useRef({ onChange, handlers });
  stateRef.current = { onChange, handlers };

  React.useEffect(() => {
    const current = ref.current;
    if (!current || typeof window === "undefined" || !("getBoundingClientRect" in current)) {
      return;
    }
    // The guard above narrows to the web branch; `TamaguiElement` resolves to
    // RN's `View` in the `.d.ts` build, so re-type the node as the DOM element
    // it actually is here to reach `addEventListener`/`getBoundingClientRect`.
    const node = current as unknown as HTMLElement;

    /**
     * The track rect for the ACTIVE drag, measured once and reused.
     *
     * `getBoundingClientRect()` inside `pointermove` is a forced layout flush, and
     * `onChange` synchronously sets React state that writes layout — so measuring
     * per move event is a read → write → read thrash for the whole drag, at pointer
     * rate (120–1000 Hz on modern mice, which is well above frame rate).
     *
     * The cache is INVALIDATED, not refreshed, whenever the rect could have moved:
     * any scroll in the document (capture phase — `scroll` doesn't bubble) or a
     * window resize. The next move then re-measures lazily. So a Slider drag with
     * nothing else moving measures exactly once, while a rail drag that scrolls its
     * own viewport stays correct at no worse than today's cost.
     */
    let rect: DOMRect | null = null;
    const invalidateRect = () => {
      rect = null;
    };

    const positionFromEvent = (clientX: number, clientY: number): MovePosition => {
      rect ??= node.getBoundingClientRect();
      return clampMovePosition({
        x: rect.width ? (clientX - rect.left) / rect.width : 0,
        y: rect.height ? (clientY - rect.top) / rect.height : 0,
      });
    };

    const onMove = (event: PointerEvent) => {
      event.preventDefault();
      stateRef.current.onChange(positionFromEvent(event.clientX, event.clientY));
    };

    const stopTracking = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", invalidateRect, true);
      window.removeEventListener("resize", invalidateRect);
    };

    const onUp = (event: PointerEvent) => {
      stopTracking();
      stateRef.current.onChange(positionFromEvent(event.clientX, event.clientY));
      stateRef.current.handlers?.onScrubEnd?.();
      rect = null;
    };

    const onDown = (event: PointerEvent) => {
      event.preventDefault();
      // Measure fresh for this gesture; the element may have moved since the last one.
      rect = null;
      stateRef.current.handlers?.onScrubStart?.();
      stateRef.current.onChange(positionFromEvent(event.clientX, event.clientY));
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("scroll", invalidateRect, { capture: true, passive: true });
      window.addEventListener("resize", invalidateRect);
    };

    node.addEventListener("pointerdown", onDown);
    return () => {
      node.removeEventListener("pointerdown", onDown);
      stopTracking();
    };
  }, []);

  // Web drives the drag through `ref`; native uses the responder props instead.
  return { ref, rootProps: {} };
}
