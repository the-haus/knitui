import * as React from "react";

import type { AuxInputParams } from "./types";

/**
 * Arrow / Home / End keyboard navigation when the carousel host has focus.
 * `←/→` (or `↑/↓` when vertical) step; `Home`/`End` jump to the ends.
 */
export function useKeyboard({
  hostRef,
  enabled,
  vertical,
  count,
  controller,
}: AuxInputParams): void {
  React.useEffect(() => {
    if (!enabled) return;
    const el = hostRef.current as HTMLElement | null;
    if (!el) return;

    const prevKey = vertical ? "ArrowUp" : "ArrowLeft";
    const nextKey = vertical ? "ArrowDown" : "ArrowRight";

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case nextKey:
          controller.next();
          break;
        case prevKey:
          controller.prev();
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
  }, [hostRef, enabled, vertical, count, controller]);
}
