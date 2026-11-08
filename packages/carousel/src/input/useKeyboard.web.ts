import * as React from "react";

import type { AuxInputParams } from "./types";

/**
 * Arrow / Home / End keyboard navigation when the carousel host has focus.
 * `←/→` (or `↑/↓` when vertical) step; `Home`/`End` jump to the ends. A
 * two-axis deck also steps its cross axis with the other pair of arrows.
 */
export function useKeyboard({
  hostRef,
  enabled,
  vertical,
  count,
  controller,
  crossController,
}: AuxInputParams): void {
  React.useEffect(() => {
    if (!enabled) return;
    const el = hostRef.current as HTMLElement | null;
    if (!el) return;

    const prevKey = vertical ? "ArrowUp" : "ArrowLeft";
    const nextKey = vertical ? "ArrowDown" : "ArrowRight";
    // Two-axis deck: the other pair of arrows steps the cross axis.
    const crossPrevKey = vertical ? "ArrowLeft" : "ArrowUp";
    const crossNextKey = vertical ? "ArrowRight" : "ArrowDown";

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case nextKey:
          controller.next();
          break;
        case prevKey:
          controller.prev();
          break;
        case crossNextKey:
          if (!crossController) return;
          crossController.next();
          break;
        case crossPrevKey:
          if (!crossController) return;
          crossController.prev();
          break;
        case "Home":
          controller.scrollTo({ index: 0 });
          break;
        case "End":
          controller.scrollTo({ index: Math.max(0, count - 1) });
          break;
        default:
          return;
      }
      e.preventDefault();
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [hostRef, enabled, vertical, count, controller, crossController]);
}
