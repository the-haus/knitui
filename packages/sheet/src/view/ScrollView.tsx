import * as React from "react";

import { ScrollArea, type ScrollAreaHandle } from "@knitui/components";
import type { TamaguiElement } from "@knitui/core";
import { useMergedRef } from "@knitui/hooks";

import { useSheetScrollContext } from "./scrollContext";
import type { SheetScrollViewProps } from "./ScrollView.shared";
import { useWebTouchHandoff } from "./useWebTouchHandoff";

export type { SheetScrollViewProps } from "./ScrollView.shared";

/** Fills the space between the fixed header / footer (hoisted style objects). */
const FILL = { flex: 1 } as const;
/** In a fit panel: hug short content, and shrink to scroll long content. */
const HUG = { flexGrow: 0, flexShrink: 1, minHeight: 0 } as const;

/**
 * Scrollable content region of a `Sheet` (web / default build). A thin wrapper over
 * the kit's `ScrollArea`. The frame-by-frame scroll↔drag handoff lives in
 * `ScrollView.native.tsx`; on web the browser scrolls the list, and
 * `useWebTouchHandoff` gives a touch the list can't use to the sheet's drag.
 */
export const SheetScrollView = React.forwardRef<ScrollAreaHandle, SheetScrollViewProps>(
  function SheetScrollView(props, ref) {
    const ctx = useSheetScrollContext();
    const viewportNodeRef = React.useRef<TamaguiElement | null>(null);
    const viewportRef = useMergedRef(viewportNodeRef, props.viewportRef);
    useWebTouchHandoff(ctx, () => viewportNodeRef.current as HTMLElement | null);
    return (
      <ScrollArea
        ref={ref}
        style={ctx?.fit ? HUG : FILL}
        {...(props as object)}
        viewportRef={viewportRef}
      />
    );
  },
);
