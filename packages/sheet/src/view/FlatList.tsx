import * as React from "react";
import { FlatList, type FlatListProps, ScrollView, type ScrollViewProps } from "react-native";

import { useSheetScrollContext } from "./scrollContext";

const HUG = { flexGrow: 0, flexShrink: 1, minHeight: 0 } as const;

/** Web lets the browser handle nested scrolling, so this is the stock scroller. */
export function renderSheetScrollComponent(props: ScrollViewProps) {
  return <ScrollView {...props} />;
}

function SheetFlatListInner<T>(props: FlatListProps<T>, ref: React.ForwardedRef<FlatList<T>>) {
  const ctx = useSheetScrollContext();
  return <FlatList ref={ref} {...props} style={[ctx?.fit ? HUG : undefined, props.style]} />;
}

/** A `FlatList` that hugs its content in a fit sheet. */
export const SheetFlatList = React.forwardRef(SheetFlatListInner) as <T>(
  props: FlatListProps<T> & { ref?: React.Ref<FlatList<T>> },
) => React.ReactElement;
