import * as React from "react";

import { type LayoutChangeEvent, styled } from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { slotStyles } from "../internal/styles";
import { ScrollArea, type ScrollAreaHandle } from "../ScrollArea";
import {
  createLayoutState,
  DEFAULT_DRAW_DISTANCE,
  DEFAULT_END_REACHED_THRESHOLD,
  DEFAULT_ESTIMATED_ITEM_SIZE,
  findVisibleRange,
  getContentSize,
  getItemOffset,
  type LayoutState,
  resizeLayoutState,
  setMeasured,
  VIRTUAL_LIST_SLOTS,
  type VirtualListHandle,
  type VirtualListOwnProps,
  type VirtualListStyles,
} from "./VirtualList.shared";

export type {
  VirtualListHandle,
  VirtualListRenderItemInfo,
  VirtualListStyles,
} from "./VirtualList.shared";

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

/**
 * `VirtualList` — a fast, windowed, variable-height list that renders only the
 * rows near the viewport (plus a render-ahead buffer) and recycles the rest by
 * mounting/unmounting at the window edges. One source runs on web and native by
 * riding {@link ScrollArea} (its scroll engine, custom scrollbars, and edge
 * fades come for free) and driving windowing off `onScrollPositionChange`.
 *
 * Rows are absolutely positioned inside a total-height spacer; each row's real
 * height is read back via `onLayout` and fed to a per-type running-average size
 * model, so no exact `estimatedItemSize` is required (a closer seed just means
 * less first-scroll correction). Mirrors the familiar `FlatList` / `FlashList`
 * surface for the v1 subset: vertical, single-column lists.
 */
const VirtualListFrame = styled(Box, {
  name: "VirtualList",
  position: "relative",
  overflow: "hidden",
});

/** The total-size spacer that holds the absolutely-positioned rows. */
const VirtualListContent = styled(Box, {
  name: "VirtualListContent",
  position: "relative",
  width: "100%",
});

/** One absolutely-positioned row wrapper (measured via `onLayout`). */
const VirtualListItem = styled(Box, {
  name: "VirtualListItem",
  position: "absolute",
  left: 0,
  right: 0,
});

/* -------------------------------------------------------------------------- */
/* Memoized row cell                                                          */
/* -------------------------------------------------------------------------- */

interface RowProps<T> {
  item: T;
  index: number;
  top: number;
  isLast: boolean;
  renderItem: VirtualListOwnProps<T>["renderItem"];
  getItemType?: VirtualListOwnProps<T>["getItemType"];
  separator: React.ReactNode;
  onMeasure: (index: number, height: number, type: string | number) => void;
  itemProps: Partial<BoxProps>;
}

/**
 * A single mounted row. Memoized so that pure scrolling — which only changes the
 * *set* of mounted indices, not the props of rows that stay mounted — never
 * re-runs `renderItem` for a surviving row. `top` only changes on relayout, so
 * scroll alone is free.
 */
const RowInner = <T,>({
  item,
  index,
  top,
  isLast,
  renderItem,
  getItemType,
  separator,
  onMeasure,
  itemProps,
}: RowProps<T>) => {
  const handleLayout = React.useCallback(
    (e: LayoutChangeEvent) => {
      const type = getItemType ? getItemType(item, index) : 0;
      onMeasure(index, e.nativeEvent.layout.height, type);
    },
    [item, index, getItemType, onMeasure],
  );
  return (
    <VirtualListItem top={top} onLayout={handleLayout} {...itemProps}>
      {renderItem({ item, index })}
      {isLast ? null : separator}
    </VirtualListItem>
  );
};
const Row = React.memo(RowInner) as typeof RowInner;

/* -------------------------------------------------------------------------- */
/* Public props                                                               */
/* -------------------------------------------------------------------------- */

type VirtualListFrameProps = Omit<BoxProps, "children">;

export interface VirtualListProps<T> extends VirtualListFrameProps, VirtualListOwnProps<T> {}

/* -------------------------------------------------------------------------- */
/* Implementation                                                             */
/* -------------------------------------------------------------------------- */

function VirtualListInner<T>(
  props: VirtualListProps<T>,
  ref: React.Ref<VirtualListHandle>,
): React.ReactElement {
  const {
    data,
    renderItem,
    keyExtractor,
    getItemType,
    estimatedItemSize = DEFAULT_ESTIMATED_ITEM_SIZE,
    drawDistance = DEFAULT_DRAW_DISTANCE,
    extraData,
    onEndReached,
    onEndReachedThreshold = DEFAULT_END_REACHED_THRESHOLD,
    onRenderedRangeChange,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    ItemSeparatorComponent,
    handleRef,
    styles,
    ...rest
  } = props;

  const slots = slotStyles<VirtualListStyles>(styles, VIRTUAL_LIST_SLOTS, "VirtualList");
  const scrollAreaSlot = slots.get("scrollArea");
  const contentSlot = slots.get("content");
  const itemSlot = slots.get("item") ?? {};

  const count = data.length;

  // ── layout model (mutable, in a ref — never triggers a render by itself) ──
  const layoutRef = React.useRef<LayoutState>(createLayoutState(count, estimatedItemSize));
  // Keep the store sized to the data. Reset entirely if the seed changed.
  if (layoutRef.current.estimate !== estimatedItemSize) {
    layoutRef.current = createLayoutState(count, estimatedItemSize);
  } else if (layoutRef.current.count !== count) {
    resizeLayoutState(layoutRef.current, count);
  }

  // Live scroll offset lives in a ref so scrolling never re-renders on its own.
  const scrollTopRef = React.useRef(0);
  const viewportHRef = React.useRef(0);
  const rangeRef = React.useRef<{ start: number; end: number }>({ start: 0, end: -1 });
  const endReachedFiredRef = React.useRef(false);
  const scrollAreaRef = React.useRef<ScrollAreaHandle | null>(null);

  // The three pieces of state that DO drive re-renders: the mounted index range,
  // the viewport height (needed for the first window), and a layout version bumped
  // whenever a measurement shifts offsets (so rows re-position and the spacer resizes).
  const [range, setRange] = React.useState<{ start: number; end: number }>({
    start: 0,
    end: -1,
  });
  const [viewportH, setViewportH] = React.useState(0);
  const [layoutVersion, bumpLayout] = React.useReducer((v: number) => v + 1, 0);
  const [headerH, setHeaderH] = React.useState(0);
  const [footerH, setFooterH] = React.useState(0);

  const maybeEndReached = React.useCallback(() => {
    if (!onEndReached) return;
    const vh = viewportHRef.current;
    if (vh <= 0) return;
    const total = getContentSize(layoutRef.current) + headerH + footerH;
    const distanceFromEnd = total - (scrollTopRef.current + vh);
    if (distanceFromEnd <= onEndReachedThreshold * vh) {
      if (!endReachedFiredRef.current) {
        endReachedFiredRef.current = true;
        onEndReached();
      }
    } else {
      endReachedFiredRef.current = false;
    }
  }, [onEndReached, onEndReachedThreshold, headerH, footerH]);

  // Recompute the mounted range from the live scroll + viewport, and only commit
  // to React state when the range actually changes (one render per row-crossing,
  // not per scroll frame).
  const recomputeRange = React.useCallback(() => {
    const vh = viewportHRef.current;
    const next = findVisibleRange(
      layoutRef.current,
      scrollTopRef.current - headerH,
      vh,
      drawDistance,
    );
    const prev = rangeRef.current;
    if (next.start !== prev.start || next.end !== prev.end) {
      rangeRef.current = next;
      setRange(next);
      onRenderedRangeChange?.(next);
    }
  }, [drawDistance, headerH, onRenderedRangeChange]);

  const handleScroll = React.useCallback(
    (pos: { x: number; y: number }) => {
      scrollTopRef.current = pos.y;
      recomputeRange();
      maybeEndReached();
    },
    [recomputeRange, maybeEndReached],
  );

  const handleFrameLayout = React.useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h === viewportHRef.current) return;
    viewportHRef.current = h;
    setViewportH(h);
  }, []);

  const handleMeasure = React.useCallback(
    (index: number, height: number, type: string | number) => {
      if (setMeasured(layoutRef.current, index, type, height)) {
        bumpLayout();
      }
    },
    [],
  );

  // After any commit that could move offsets (measurement, viewport, data, chrome),
  // re-window and re-check the end. Runs post-layout so measurements are settled.
  React.useEffect(() => {
    recomputeRange();
    maybeEndReached();
  }, [
    layoutVersion,
    viewportH,
    count,
    headerH,
    footerH,
    extraData,
    recomputeRange,
    maybeEndReached,
  ]);

  /* ---------------- imperative handle ---------------- */

  const scrollToOffset = React.useCallback((offset: number, animated?: boolean) => {
    scrollAreaRef.current?.scrollTo({ y: offset, animated });
  }, []);

  const buildHandle = React.useCallback(
    (): VirtualListHandle => ({
      scrollToIndex: ({ index, animated, viewPosition = 0, viewOffset = 0 }) => {
        const clamped = Math.max(0, Math.min(index, count - 1));
        const top = headerH + getItemOffset(layoutRef.current, clamped);
        const slack = viewPosition * viewportHRef.current;
        scrollToOffset(top - slack - viewOffset, animated);
      },
      scrollToOffset: ({ offset, animated }) => scrollToOffset(offset, animated),
      scrollToTop: (animated) => scrollToOffset(0, animated),
      scrollToEnd: (animated) => {
        const total = getContentSize(layoutRef.current) + headerH + footerH;
        scrollToOffset(Math.max(0, total - viewportHRef.current), animated);
      },
      getScrollOffset: () => scrollTopRef.current,
    }),
    [count, headerH, footerH, scrollToOffset],
  );

  React.useImperativeHandle(ref, buildHandle, [buildHandle]);
  React.useImperativeHandle(handleRef, buildHandle, [buildHandle]);

  /* ---------------- render ---------------- */

  const contentTotal = getContentSize(layoutRef.current);
  const spacerHeight = headerH + contentTotal + footerH;
  const isEmpty = count === 0;

  const rows: React.ReactNode[] = [];
  if (!isEmpty && range.end >= range.start) {
    for (let i = range.start; i <= range.end; i++) {
      const item = data[i];
      const key = keyExtractor ? keyExtractor(item, i) : String(i);
      rows.push(
        <Row<T>
          key={key}
          item={item}
          index={i}
          top={headerH + getItemOffset(layoutRef.current, i)}
          isLast={i === count - 1}
          renderItem={renderItem}
          getItemType={getItemType}
          separator={ItemSeparatorComponent}
          onMeasure={handleMeasure}
          itemProps={itemSlot}
        />,
      );
    }
  }

  return (
    <VirtualListFrame onLayout={handleFrameLayout} {...(rest as BoxProps)}>
      <ScrollArea
        ref={scrollAreaRef}
        scrollbars="y"
        height="100%"
        width="100%"
        onScrollPositionChange={handleScroll}
        // `scrollArea` slot is a `Partial<BoxProps>`; spread through an index
        // signature so it doesn't collide with ScrollArea's narrowed `shadowColor`.
        {...(scrollAreaSlot as Record<string, unknown>)}
      >
        {isEmpty ? (
          ListEmptyComponent
        ) : (
          <VirtualListContent height={spacerHeight} {...contentSlot}>
            {ListHeaderComponent != null && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                onLayout={(e: LayoutChangeEvent) => {
                  const h = e.nativeEvent.layout.height;
                  setHeaderH((prev) => (Math.abs(prev - h) > 0.5 ? h : prev));
                }}
              >
                {ListHeaderComponent}
              </Box>
            )}
            {rows}
            {ListFooterComponent != null && (
              <Box
                position="absolute"
                top={headerH + contentTotal}
                left={0}
                right={0}
                onLayout={(e: LayoutChangeEvent) => {
                  const h = e.nativeEvent.layout.height;
                  setFooterH((prev) => (Math.abs(prev - h) > 0.5 ? h : prev));
                }}
              >
                {ListFooterComponent}
              </Box>
            )}
          </VirtualListContent>
        )}
      </ScrollArea>
    </VirtualListFrame>
  );
}

/**
 * `VirtualList<T>` — see {@link VirtualListFrame} for the behaviour overview.
 * Generic in the row data type; forwards a {@link VirtualListHandle} ref.
 */
export const VirtualList = React.forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListHandle> },
) => React.ReactElement;
