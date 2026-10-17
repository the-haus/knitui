import * as React from "react";
import { GestureDetector, type PanGesture } from "react-native-gesture-handler";

import { Box } from "@knitui/components";

import type { DragAreaProps } from "./DragArea.types";

export type { DragAreaProps } from "./DragArea.types";

/**
 * The full-cover capture container the sheet is dragged from (NATIVE build): an
 * RNGH `GestureDetector` around a `box-none` layer, so the scrim and the panel
 * take the drag while empty regions fall through.
 */
export function DragArea({ drag, children }: DragAreaProps) {
  return (
    <GestureDetector gesture={drag as PanGesture}>
      <Box
        pointerEvents="box-none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {children}
      </Box>
    </GestureDetector>
  );
}
