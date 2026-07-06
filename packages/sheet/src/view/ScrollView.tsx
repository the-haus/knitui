import * as React from "react";

import { ScrollArea, type ScrollAreaHandle } from "@knitui/components";

import type { SheetScrollViewProps } from "./ScrollView.shared";

export type { SheetScrollViewProps } from "./ScrollView.shared";

/**
 * Scrollable content region for use inside a `Sheet.Frame` (web / default build).
 * A thin wrapper over the kit's `ScrollArea`, defaulted to `flex: 1` so it fills
 * the panel.
 *
 * The scroll↔drag handoff (drag the sheet when the list is at the top, scroll the
 * list otherwise) is implemented on native in `ScrollView.native.tsx`; on web the
 * browser handles nested scrolling natively, so this stays a plain wrapper.
 */
export const SheetScrollView = React.forwardRef<ScrollAreaHandle, SheetScrollViewProps>(
  function SheetScrollView(props, ref) {
    return <ScrollArea ref={ref} style={{ flex: 1 }} {...props} />;
  },
);
