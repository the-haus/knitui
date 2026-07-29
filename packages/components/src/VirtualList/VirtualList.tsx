import * as React from "react";

import { type LayoutChangeEvent, styled } from "@knitui/core";
import { useCallbackRef } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { slotStyles } from "../internal/styles";
import { ScrollArea, type ScrollAreaHandle } from "../ScrollArea";
import {
  areRowsMeasured,
  createLayoutState,
  DEFAULT_DRAW_DISTANCE,
  DEFAULT_END_REACHED_THRESHOLD,
  DEFAULT_ESTIMATED_ITEM_SIZE,
  DEFAULT_START_REACHED_THRESHOLD,
  findVisibleRange,
  getContentSize,
  getItemOffset,
  type LayoutState,
  prependLayoutState,
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
 *
 * ## Keep the row props stable
 *
 * Each mounted row is a memoized cell, so scrolling only re-renders the rows that
 * actually enter or leave the window — but ONLY if the props handed to those rows
 * keep their identity. For the memo to pay off, `renderItem` (and, when supplied,
 * `getItemType`, `ItemSeparatorComponent` and `styles.item`) must be referentially
 * stable: hoist them, or wrap them in `useCallback` / `useMemo`. An inline
 * `renderItem={({ item }) => …}` is a new function on every parent render and
 * therefore re-runs for every mounted row — cheap for a handful of rows, the
 * dominant scroll cost for a large window.
 *
 * They are deliberately NOT stabilised internally (e.g. via `useCallbackRef`),
 * because a `renderItem` closing over component state must be able to produce new
 * output when that state changes. Pass `extraData` when your rows depend on state
 * a stable `renderItem` cannot see: it is compared by the row memo and re-renders
 * every mounted row.
 *
 * ## Lazy loading, in both directions
 *
 * `onEndReached` pages forward, the ordinary infinite feed. `onStartReached` pages
 * BACKWARDS, for a list whose history grows at the head — a chat thread loading
 * older messages is the case it exists for.
 *
 * Backwards pagination needs one thing forward pagination does not: an insert at
 * the head moves every row already on screen. Pass `maintainVisibleContentPosition`
 * and the list absorbs the inserted height into its own scroll offset, so the
 * message the user was reading does not slide out from under them. Both need
 * `keyExtractor` to be set — a prepend is recognised by finding the old head row at
 * its new index, and it is also what lets the size model carry each row's
 * measurement to the row's new position instead of leaving it on a stranger.
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

/**
 * Stable fallback for the optional `item` slot.
 *
 * `slots.get("item") ?? {}` allocated a FRESH object on every render, and that
 * object is handed to the memoized {@link Row} as `itemProps` — so the common
 * case (no `styles.item`) silently defeated the row memo and re-ran `renderItem`
 * for every mounted row on every windowing render and every measurement-driven
 * `bumpLayout`. One module-level constant keeps the reference identical forever.
 */
const EMPTY_ITEM_PROPS: Partial<BoxProps> = {};

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
  /**
   * Not read by the row — carried purely so `React.memo` compares it. This is
   * what makes the documented `extraData` escape hatch work now that the row's
   * other props can all be referentially stable: change `extraData` and every
   * mounted row re-runs `renderItem`, even though its `item` did not change.
   */
  extraData?: unknown;
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
    onStartReached,
    onStartReachedThreshold = DEFAULT_START_REACHED_THRESHOLD,
    maintainVisibleContentPosition = false,
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
  // Referentially stable when the caller passes no `styles.item` — see
  // {@link EMPTY_ITEM_PROPS}; a fresh `{}` here would break every row's memo.
  const itemSlot = slots.get("item") ?? EMPTY_ITEM_PROPS;

  const count = data.length;

  // ── layout model (mutable, in a ref — never triggers a render by itself) ──
  const layoutRef = React.useRef<LayoutState>(createLayoutState(count, estimatedItemSize));

  // The head row's key as of the last reconcile, and the prepend not yet
  // compensated for. Both are written HERE, in the body, alongside the store
  // mutation they describe — the reconcile is already a render-phase side effect,
  // and keeping them in step with it is what makes a double render idempotent
  // (the second pass sees `added === 0` and does nothing).
  const firstKeyRef = React.useRef<string | null>(null);
  const pendingPrependRef = React.useRef(0);
  // What the list is holding on to across a layout change, live only until the
  // rows involved have settled (or the user scrolls). Either a specific ROW and
  // where it sat relative to the viewport top — how a prepend is absorbed — or the
  // END, which is a destination rather than a row and has to be recomputed as the
  // total height changes underneath it.
  const anchorRef = React.useRef<
    { kind: "row"; index: number; gap: number } | { kind: "end" } | null
  >(null);

  // A "load older" page grows the data at the HEAD, which by index is
  // indistinguishable from an append: the store would keep row 0's height on a row
  // that is now `added` places down, and the viewport would jump by the inserted
  // height. Detected in O(1) rather than by diffing — a pure prepend puts the old
  // head row at exactly `added`, so one key comparison confirms it. Needs
  // `keyExtractor`; index keys have no identity to recognise the row by.
  const added = count - layoutRef.current.count;
  const firstKey = keyExtractor && count > 0 ? keyExtractor(data[0], 0) : null;
  const prepended =
    keyExtractor &&
    added > 0 &&
    added < count &&
    firstKeyRef.current != null &&
    keyExtractor(data[added], added) === firstKeyRef.current
      ? added
      : 0;

  // Keep the store sized to the data. Reset entirely if the seed changed.
  if (layoutRef.current.estimate !== estimatedItemSize) {
    layoutRef.current = createLayoutState(count, estimatedItemSize);
    anchorRef.current = null;
    pendingPrependRef.current = 0;
  } else if (prepended > 0) {
    prependLayoutState(layoutRef.current, prepended);
    // Accumulated, not overwritten: two pages can land before the compensating
    // effect runs, and both inserted at the head.
    pendingPrependRef.current += prepended;
  } else if (layoutRef.current.count !== count) {
    resizeLayoutState(layoutRef.current, count);
  }
  firstKeyRef.current = firstKey;

  // Live scroll offset lives in a ref so scrolling never re-renders on its own.
  const scrollTopRef = React.useRef(0);
  const viewportHRef = React.useRef(0);
  const rangeRef = React.useRef<{ start: number; end: number }>({ start: 0, end: -1 });
  const endReachedFiredRef = React.useRef(false);
  const startReachedFiredRef = React.useRef(false);
  const scrollAreaRef = React.useRef<ScrollAreaHandle | null>(null);
  // The offset the anchor correction last asked for, so the scroll event it
  // causes can be told apart from the user moving the list.
  const compensatedTopRef = React.useRef<number | null>(null);

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
  // The chrome heights are ALSO mirrored into refs, written by the same layout
  // handlers that set the state. The scroll path below reads the refs, never the
  // state: `useCallbackRef` refreshes its closure in a passive effect, so a scroll
  // sample landing between a chrome commit and that flush would otherwise window
  // against the previous header height. Refs close that gap; the state copies exist
  // only because rendering (row tops, spacer height) needs them.
  const headerHRef = React.useRef(0);
  const footerHRef = React.useRef(0);

  // ── the scroll path: every callback below has a STABLE identity ──
  // These land (via `handleScroll`) on `ScrollArea`'s `onScrollPositionChange`,
  // which is a dependency of its `reportScroll`, which is a dependency of its
  // `useAnimatedScrollHandler`. A new identity per render therefore rebuilt the
  // Reanimated worklet scroll handler on every windowing render — i.e. repeatedly
  // WHILE the user is flinging. `useCallbackRef` keeps one identity forever and
  // still invokes the latest closure, so the freshest props/state are always read.
  // All live values they touch are refs (`layoutRef`, `scrollTopRef`,
  // `viewportHRef`, `rangeRef`, `endReachedFiredRef`, `headerHRef`, `footerHRef`);
  // the rest are props, which the latest closure supplies.
  const maybeEndReached = useCallbackRef(() => {
    if (!onEndReached) return;
    const vh = viewportHRef.current;
    if (vh <= 0) return;
    const total = getContentSize(layoutRef.current) + headerHRef.current + footerHRef.current;
    const distanceFromEnd = total - (scrollTopRef.current + vh);
    if (distanceFromEnd <= onEndReachedThreshold * vh) {
      if (!endReachedFiredRef.current) {
        endReachedFiredRef.current = true;
        onEndReached();
      }
    } else {
      endReachedFiredRef.current = false;
    }
  });

  // The mirror of `maybeEndReached`, measured from offset 0. Same one-shot latch:
  // it re-arms only once the list has scrolled back out of the threshold band, so
  // a caller whose page lands while still near the top is asked once, not per frame.
  const maybeStartReached = useCallbackRef(() => {
    if (!onStartReached) return;
    const vh = viewportHRef.current;
    if (vh <= 0) return;
    if (scrollTopRef.current <= onStartReachedThreshold * vh) {
      if (!startReachedFiredRef.current) {
        startReachedFiredRef.current = true;
        onStartReached();
      }
    } else {
      startReachedFiredRef.current = false;
    }
  });

  // Recompute the mounted range from the live scroll + viewport, and only commit
  // to React state when the range actually changes (one render per row-crossing,
  // not per scroll frame).
  const recomputeRange = useCallbackRef(() => {
    const vh = viewportHRef.current;
    const next = findVisibleRange(
      layoutRef.current,
      scrollTopRef.current - headerHRef.current,
      vh,
      drawDistance,
    );
    const prev = rangeRef.current;
    if (next.start !== prev.start || next.end !== prev.end) {
      rangeRef.current = next;
      setRange(next);
      onRenderedRangeChange?.(next);
    }
  });

  const handleScroll = useCallbackRef((pos: { x: number; y: number }) => {
    // Our own compensation scroll landing, or the user taking over? Anything that
    // is not the offset we last asked for means the gesture is theirs, and
    // correcting a live gesture would fight it — so the anchor is dropped.
    //
    // The target is NOT consumed on a match: one programmatic scroll can report
    // its position more than once (the set itself, then again after the layout
    // change it causes), and treating the second report as the user is what made
    // the anchor die on the frame it was created — a list opening at the end came
    // to rest on its pre-measurement estimate, half a screen short of the bottom.
    // The target instead stays as "where we last put it" until superseded.
    const target = compensatedTopRef.current;
    if (anchorRef.current && (target == null || Math.abs(pos.y - target) > 1)) {
      anchorRef.current = null;
      compensatedTopRef.current = null;
    }
    scrollTopRef.current = pos.y;
    recomputeRange();
    maybeStartReached();
    maybeEndReached();
  });

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
  // `recomputeRange` / `maybeEndReached` are stable, so this now fires only when one
  // of the listed values actually changed instead of on every single render.
  // `drawDistance` / `onEndReachedThreshold` are listed explicitly because they used
  // to reach this list through those callbacks' identities.
  React.useEffect(() => {
    recomputeRange();
    maybeStartReached();
    maybeEndReached();
  }, [
    layoutVersion,
    viewportH,
    count,
    headerH,
    footerH,
    extraData,
    drawDistance,
    onEndReachedThreshold,
    onStartReachedThreshold,
    recomputeRange,
    maybeStartReached,
    maybeEndReached,
  ]);

  /* ---------------- imperative handle ---------------- */

  const scrollToOffset = React.useCallback((offset: number, animated?: boolean) => {
    scrollAreaRef.current?.scrollTo({ y: offset, animated });
  }, []);

  /* ---------------- prepend compensation ---------------- */

  // Hold the anchor row still across a prepend. Pre-paint (a passive effect would
  // show one frame of the content having slid down by the inserted height), and
  // re-run on every layout bump because the inserted rows start on the ESTIMATE:
  // each real measurement above the anchor moves it again, and against a 25-row
  // page a few px of per-row error is a visible drift.
  //
  // The anchor is released once nothing above it can still move — or by
  // `handleScroll`, as soon as the user's own gesture arrives.
  React.useLayoutEffect(() => {
    if (!maintainVisibleContentPosition) {
      pendingPrependRef.current = 0;
      return;
    }
    const inserted = pendingPrependRef.current;
    if (inserted > 0) {
      pendingPrependRef.current = 0;
      const prev = anchorRef.current;
      anchorRef.current =
        prev?.kind === "row"
          ? // A second page landed before the first had settled: the same anchor row
            // moved further down, but its resting place in the viewport is unchanged.
            { kind: "row", index: prev.index + inserted, gap: prev.gap }
          : {
              kind: "row",
              index: inserted,
              gap: scrollTopRef.current - headerHRef.current,
            };
    }

    const anchor = anchorRef.current;
    if (!anchor) return;

    const total = getContentSize(layoutRef.current) + headerHRef.current + footerHRef.current;
    const desired =
      anchor.kind === "end"
        ? Math.max(0, total - viewportHRef.current)
        : headerHRef.current + getItemOffset(layoutRef.current, anchor.index) + anchor.gap;

    // Recorded even when no scroll is needed, so the scroll reports this position
    // still generates are recognised as ours rather than read as the user moving.
    compensatedTopRef.current = desired;
    if (Math.abs(desired - scrollTopRef.current) > 0.5) {
      // Written through so the very next windowing pass reads the corrected
      // position instead of the pre-insert one it would otherwise window against.
      scrollTopRef.current = desired;
      scrollToOffset(desired, false);
    }

    // Release once nothing that can still move is left. For a row anchor that is
    // the band above it; for the end it is everything currently mounted, since any
    // of those measuring changes the total the destination is derived from.
    const settled =
      anchor.kind === "end"
        ? areRowsMeasured(layoutRef.current, rangeRef.current.start, count)
        : areRowsMeasured(layoutRef.current, 0, anchor.index);
    if (settled) anchorRef.current = null;
  }, [count, layoutVersion, headerH, footerH, maintainVisibleContentPosition, scrollToOffset]);

  const buildHandle = React.useCallback(
    (): VirtualListHandle => ({
      scrollToIndex: ({ index, animated, viewPosition = 0, viewOffset = 0 }) => {
        // An explicit destination overrides whatever the list was holding on to.
        anchorRef.current = null;
        const clamped = Math.max(0, Math.min(index, count - 1));
        const top = headerH + getItemOffset(layoutRef.current, clamped);
        const slack = viewPosition * viewportHRef.current;
        scrollToOffset(top - slack - viewOffset, animated);
      },
      scrollToOffset: ({ offset, animated }) => {
        anchorRef.current = null;
        scrollToOffset(offset, animated);
      },
      scrollToTop: (animated) => {
        anchorRef.current = null;
        scrollToOffset(0, animated);
      },
      scrollToEnd: (animated) => {
        const total = getContentSize(layoutRef.current) + headerH + footerH;
        const desired = Math.max(0, total - viewportHRef.current);
        // The end is computed from the TOTAL height, and on a list opening deep
        // into unmeasured content that total is mostly estimate — so landing there
        // once leaves the last rows short of the bottom by the accumulated error
        // (25 chat bubbles a dozen px under their estimate is a third of a screen).
        // With `maintainVisibleContentPosition` the destination is held instead of
        // hit once, and re-derived as the rows measure.
        //
        // Only for a NON-animated call. An animated scroll reports a stream of
        // intermediate positions, and telling those apart from the user grabbing
        // the list mid-flight is not something this can do — so an animated
        // `scrollToEnd` stays a one-shot. That is the append case (a sent message,
        // one row of error), where it does not matter.
        if (maintainVisibleContentPosition && !animated) {
          anchorRef.current = { kind: "end" };
          compensatedTopRef.current = desired;
        } else {
          anchorRef.current = null;
        }
        scrollToOffset(desired, animated);
      },
      getScrollOffset: () => scrollTopRef.current,
    }),
    [count, headerH, footerH, maintainVisibleContentPosition, scrollToOffset],
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
          extraData={extraData}
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
                  if (Math.abs(headerHRef.current - h) <= 0.5) return;
                  headerHRef.current = h;
                  setHeaderH(h);
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
                  if (Math.abs(footerHRef.current - h) <= 0.5) return;
                  footerHRef.current = h;
                  setFooterH(h);
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
