import * as React from "react";

import { Box } from "@knitui/components";

import type { WebSheetDrag } from "../input/useSheetDrag";
import type { DragAreaProps } from "./DragArea.types";

export type { DragAreaProps } from "./DragArea.types";

/**
 * The full-cover capture container the sheet is dragged from (WEB build): a
 * `box-none` layer the pointer binding from `input/useSheetDrag.ts` attaches to.
 * Pointer events on the scrim and the panel bubble up to it; empty regions (no
 * scrim) fall through to the page.
 */
export function DragArea({ drag, children }: DragAreaProps) {
  const ref = React.useRef<unknown>(null);
  React.useEffect(() => {
    const element = ref.current as HTMLElement | null;
    if (!element) return undefined;
    return (drag as WebSheetDrag).attach(element);
  }, [drag]);

  return (
    <Box
      ref={ref as never}
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {children}
    </Box>
  );
}
