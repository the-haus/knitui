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

    const positionFromEvent = (clientX: number, clientY: number): MovePosition => {
      const rect = node.getBoundingClientRect();
      return clampMovePosition({
        x: rect.width ? (clientX - rect.left) / rect.width : 0,
        y: rect.height ? (clientY - rect.top) / rect.height : 0,
      });
    };

    const onMove = (event: PointerEvent) => {
      event.preventDefault();
      stateRef.current.onChange(positionFromEvent(event.clientX, event.clientY));
    };

    const onUp = (event: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      stateRef.current.onChange(positionFromEvent(event.clientX, event.clientY));
      stateRef.current.handlers?.onScrubEnd?.();
    };

    const onDown = (event: PointerEvent) => {
      event.preventDefault();
      stateRef.current.handlers?.onScrubStart?.();
      stateRef.current.onChange(positionFromEvent(event.clientX, event.clientY));
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    node.addEventListener("pointerdown", onDown);
    return () => {
      node.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // Web drives the drag through `ref`; native uses the responder props instead.
  return { ref, rootProps: {} };
}
