import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import {
  normalizeAngle,
  type UseRadialMoveOptions,
  type UseRadialMoveReturn,
} from "./use-radial-move.shared";

/**
 * Track pointer dragging over a circular control and report the angle (0–359)
 * under the pointer. Web implementation — mirrors Mantine's `useRadialMove`.
 *
 * Wires `pointerdown` / `pointermove` / `pointerup` on `window` so the drag
 * keeps following the cursor even when it leaves the ring, measuring the centre
 * via `getBoundingClientRect`. The native counterpart lives in
 * `use-radial-move.native.ts`; this file never imports `react-native` at
 * runtime, so the web bundle stays free of it.
 *
 * `onChange` returns the value actually applied (after the consumer snaps /
 * restricts it), which is forwarded to `onChangeEnd` when the gesture ends.
 */
export function useRadialMove(
  onChange: (angle: number) => number,
  options?: UseRadialMoveOptions,
): UseRadialMoveReturn {
  const ref = React.useRef<TamaguiElement | null>(null);

  // Mutable mirror so the (stable) listeners never read stale props.
  const stateRef = React.useRef({ onChange, options });
  stateRef.current = { onChange, options };

  React.useEffect(() => {
    const current = ref.current;
    // `"getBoundingClientRect" in current` narrows to the web branch; it is also
    // a no-op if rendered under react-native-web.
    if (!current || typeof window === "undefined" || !("getBoundingClientRect" in current)) {
      return;
    }
    // `TamaguiElement` resolves to RN's `View` in the `.d.ts` build, so re-type
    // the node as the DOM element it actually is here to reach
    // `addEventListener`/`getBoundingClientRect`.
    const node = current as unknown as HTMLElement;

    /**
     * The ring rect for the ACTIVE drag, measured once and reused.
     *
     * `getBoundingClientRect()` inside `pointermove` is a forced layout flush, and
     * `onChange` synchronously sets React state that writes layout — so measuring
     * per move event is a read → write → read thrash for the whole drag, at pointer
     * rate (120–1000 Hz on modern mice, well above frame rate).
     *
     * The cache is INVALIDATED, not refreshed, whenever the ring could have moved:
     * any scroll in the document (capture phase — `scroll` doesn't bubble) or a
     * window resize. The next move then re-measures lazily, so a drag with nothing
     * else moving measures exactly once and a drag over a scrolling page stays
     * correct.
     */
    let rect: DOMRect | null = null;
    const invalidateRect = () => {
      rect = null;
    };

    const angleFromEvent = (clientX: number, clientY: number): number => {
      rect ??= node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return normalizeAngle(Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90);
    };

    const onMove = (event: PointerEvent) => {
      if (stateRef.current.options?.disabled) return;
      event.preventDefault();
      stateRef.current.onChange(angleFromEvent(event.clientX, event.clientY));
    };

    const stopTracking = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", invalidateRect, true);
      window.removeEventListener("resize", invalidateRect);
    };

    const onUp = (event: PointerEvent) => {
      stopTracking();
      const final = stateRef.current.onChange(angleFromEvent(event.clientX, event.clientY));
      stateRef.current.options?.onScrubEnd?.();
      stateRef.current.options?.onChangeEnd?.(final);
      rect = null;
    };

    const onDown = (event: PointerEvent) => {
      if (stateRef.current.options?.disabled) return;
      event.preventDefault();
      // Measure fresh for this gesture; the ring may have moved since the last one.
      rect = null;
      stateRef.current.options?.onScrubStart?.();
      stateRef.current.onChange(angleFromEvent(event.clientX, event.clientY));
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
