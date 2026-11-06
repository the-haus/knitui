import * as React from "react";
import { FlatList, type FlatListProps, type ScrollViewProps } from "react-native";

import { useSheetScrollContext } from "./scrollContext";
import { SheetScrollable } from "./ScrollView.native";

const HUG = { flexGrow: 0, flexShrink: 1 } as const;

/**
 * Pass as `renderScrollComponent` to give any virtualized list the sheet's scroll↔drag
 * handoff: `FlatList`, `SectionList`, `FlashList`.
 */
export function renderSheetScrollComponent(props: ScrollViewProps) {
  return <SheetScrollable {...(props as object)} />;
}

function SheetFlatListInner<T>(props: FlatListProps<T>, ref: React.ForwardedRef<FlatList<T>>) {
  const ctx = useSheetScrollContext();
  return (
    <FlatList
      ref={ref}
      renderScrollComponent={renderSheetScrollComponent}
      {...props}
      style={[ctx?.fit ? HUG : undefined, props.style]}
    />
  );
}

/** A `FlatList` with the sheet's scroll↔drag handoff. */
export const SheetFlatList = React.forwardRef(SheetFlatListInner) as <T>(
  props: FlatListProps<T> & { ref?: React.Ref<FlatList<T>> },
) => React.ReactElement;
