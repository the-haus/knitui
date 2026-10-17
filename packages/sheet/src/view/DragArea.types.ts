import type * as React from "react";

import type { SheetDrag } from "../input/drag.types";

export interface DragAreaProps {
  /** The drag from `useSheetDrag` (an RNGH Pan on native, a pointer binding on web). */
  drag: SheetDrag;
  children: React.ReactNode;
}
