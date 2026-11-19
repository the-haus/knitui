import * as React from "react";
import { FlatList, type FlatListProps, ScrollView, type ScrollViewProps } from "react-native";

import { useMergedRef } from "@knitui/hooks";

import { useSheetScrollContext } from "./scrollContext";
import { useWebTouchHandoff } from "./useWebTouchHandoff";

const HUG = { flexGrow: 0, flexShrink: 1, minHeight: 0 } as const;

/** Web lets the browser scroll the list, so this is the stock scroller. */
export function renderSheetScrollComponent(props: ScrollViewProps) {
  return <ScrollView {...props} />;
}

function SheetFlatListInner<T>(props: FlatListProps<T>, ref: React.ForwardedRef<FlatList<T>>) {
  const ctx = useSheetScrollContext();
  const listRef = React.useRef<FlatList<T> | null>(null);
  const mergedRef = useMergedRef(listRef, ref);
  // A pull the list can't use moves the sheet on touch web (see useWebTouchHandoff).
  useWebTouchHandoff(
    ctx,
    () => listRef.current?.getScrollableNode?.() as unknown as HTMLElement | null,
  );
  return <FlatList ref={mergedRef} {...props} style={[ctx?.fit ? HUG : undefined, props.style]} />;
}

/** A `FlatList` that hugs its content in a fit sheet. */
export const SheetFlatList = React.forwardRef(SheetFlatListInner) as <T>(
  props: FlatListProps<T> & { ref?: React.Ref<FlatList<T>> },
) => React.ReactElement;
