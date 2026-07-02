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

    const angleFromEvent = (clientX: number, clientY: number): number => {
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return normalizeAngle(Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI) + 90);
    };

    const onMove = (event: PointerEvent) => {
      if (stateRef.current.options?.disabled) return;
      event.preventDefault();
      stateRef.current.onChange(angleFromEvent(event.clientX, event.clientY));
    };

    const onUp = (event: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      const final = stateRef.current.onChange(angleFromEvent(event.clientX, event.clientY));
      stateRef.current.options?.onScrubEnd?.();
      stateRef.current.options?.onChangeEnd?.(final);
    };

    const onDown = (event: PointerEvent) => {
      if (stateRef.current.options?.disabled) return;
      event.preventDefault();
      stateRef.current.options?.onScrubStart?.();
      stateRef.current.onChange(angleFromEvent(event.clientX, event.clientY));
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
