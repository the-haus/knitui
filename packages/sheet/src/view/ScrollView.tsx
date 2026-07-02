import * as React from "react";

import { ScrollArea, type ScrollAreaHandle, type ScrollAreaProps } from "@knitui/components";

export type SheetScrollViewProps = ScrollAreaProps;

/**
 * Scrollable content region for use inside a `Sheet.Frame`. A thin wrapper over
 * the kit's `ScrollArea`, defaulted to `flex: 1` so it fills the panel.
 *
 * NOTE: the deep scroll↔drag handoff (drag the sheet when scrolled to the top,
 * scroll the content otherwise) is the subject of a follow-up — see
 * `docs/sheet-package-plan.md` milestone 7. This baseline gives a working,
 * independently-scrolling content area; the sheet drag is driven from the handle
 * and the panel chrome around it.
 */
export const SheetScrollView = React.forwardRef<ScrollAreaHandle, SheetScrollViewProps>(
  function SheetScrollView(props, ref) {
    return <ScrollArea ref={ref} style={{ flex: 1 }} {...props} />;
  },
);
