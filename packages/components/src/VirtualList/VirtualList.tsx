import * as React from "react";

import { type LayoutChangeEvent, styled } from "@knitui/core";
import { useCallbackRef } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { slotStyles } from "../internal/styles";
import { ScrollArea, type ScrollAreaHandle } from "../ScrollArea";
import {
  areRowsMeasured,
  createLayoutState,
  createRetainState,
  DEFAULT_DRAW_DISTANCE,
  DEFAULT_END_REACHED_THRESHOLD,
  DEFAULT_ESTIMATED_ITEM_SIZE,
  DEFAULT_START_REACHED_THRESHOLD,
  findVisibleRange,
  getContentSize,
  getItemOffset,
  isMountAll,
  type LayoutState,
  MEASURE_EPSILON,
  NO_RETAINED,
  remapRetainState,
  resizeLayoutState,
  resolveRetainLimit,
  retainedOutside,
  retainRange,
  type RetainState,
  setMeasured,
  shallowEqualProps,
  syncLayoutKeys,
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
 * ## What a scroll costs
 *
 * Scrolling itself never renders. The live offset, viewport height, window and
 * `onEndReached` latch all live in refs, and the only `setState` on the scroll path
 * fires when the window actually crosses a row boundary — one render per crossing,
 * not per frame. That render re-creates row elements, but two memo boundaries keep
 * the work off the user's code: the outer {@link Row} skips rows that merely stayed
 * mounted, and the inner {@link RowContent} means even a row the wrapper *did*
 * re-render (a shifted `top`, a new separator element, a fresh `styles.item`
 * literal) does not re-run `renderItem`.
 *
 * ## Keep the row props stable
 *
 * The memos only pay off if the props handed to rows keep their identity. Hoist
 * `renderItem` and `getItemType`, or wrap them in `useCallback` — an inline
 * `renderItem={({ item }) => …}` is a new function on every parent render and so
 * re-runs for every mounted row. (`ItemSeparatorComponent` and `styles.item` are
 * stabilised internally, so inline literals there are free.)
 *
 * `renderItem` is deliberately NOT stabilised internally (e.g. via
 * `useCallbackRef`), because one closing over component state must be able to
 * produce new output when that state changes. Pass `extraData` when your rows
 * depend on state a stable `renderItem` cannot see: it is compared by the row memo
 * and re-renders every mounted row.
 *
 * ## Identity, not slots
 *
 * Supply a `keyExtractor` and every cache — measured heights, the per-type size
 * averages, the `keepMounted` pool, React's own reconciliation — is keyed by item,
 * so inserts, removals, sorts and filters move each row's height and state with it.
 * Without one, the index is the identity and only append/pop is correct.
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
 * its new index, and the keyed size model is what carries each row's measurement to
 * its new position instead of leaving it on a stranger.
 *
 * ## Keeping rows mounted
 *
 * Unmounting is what makes windowing cheap, but it also throws away whatever the
 * row held — local state, focus, a playing video, a half-typed input. `keepMounted`
 * is the escalating ladder out of that: a number bounds an LRU warm pool of
 * already-seen rows, `true` keeps every row that has ever mounted, and `"all"` drops
 * windowing altogether and mounts the entire `data` up front (rows that have never
 * been seen included — the only rung that costs O(data) on mount). Kept rows sit at
 * their real offsets and are simply clipped by the scroller, so scrolling back to
 * one shows real content immediately instead of a blank frame.
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
 * case (no `styles.item`) silently defeated the row memo, re-rendering every
 * mounted row on every windowing render and every measurement-driven
 * `bumpLayout`. One module-level constant keeps the reference identical forever.
 */
const EMPTY_ITEM_PROPS: Partial<BoxProps> = {};

/**
 * Give a prop bag a stable identity for as long as its contents are unchanged,
 * so the idiomatic inline `styles={{ item: { … } }}` literal — a fresh object on
 * every parent render — still lets {@link Row}'s memo hold. A render-time ref
 * cache is safe here: it is a pure value-keyed cache, idempotent under the
 * double-invocation of StrictMode and under a render React later throws away.
 */
const useStableProps = (next: Partial<BoxProps>): Partial<BoxProps> => {
  const ref = React.useRef(next);
  if (
    ref.current !== next &&
    !shallowEqualProps(ref.current as Record<string, unknown>, next as Record<string, unknown>)
  ) {
    ref.current = next;
  }
  return ref.current;
};

interface RowContentProps<T> {
  item: T;
  index: number;
  renderItem: VirtualListOwnProps<T>["renderItem"];
  /**
   * Not read — carried purely so `React.memo` compares it. This is what makes the
   * documented `extraData` escape hatch work now that a row's other props can all
   * be referentially stable: change `extraData` and every mounted row re-runs
   * `renderItem`, even though its `item` did not change.
   */
  extraData?: unknown;
}

/**
 * The inner memo boundary: the ONLY thing that re-runs `renderItem`.
 *
 * Deliberately kept to the minimum prop set that can change what a row's content
 * should be — `item`, `index`, `renderItem`, `extraData` — so everything that is
 * merely about *where* or *how* the row sits (its `top`, the separator element,
 * the `styles.item` passthrough) cannot reach it. That split matters because in a
 * variable-height list those positional props change constantly: every measurement
 * anywhere above a row shifts its `top`, and a caller's inline
 * `ItemSeparatorComponent={<Box … />}` or `styles={{ item: … }}` is a fresh
 * identity on every parent render. Before the split, each of those re-ran user
 * `renderItem` for every mounted row; now they re-render only the cheap wrapper.
 */
const RowContentInner = <T,>({ item, index, renderItem }: RowContentProps<T>) => (
  <>{renderItem({ item, index })}</>
);
const RowContent = React.memo(RowContentInner) as typeof RowContentInner;

interface RowProps<T> extends RowContentProps<T> {
  top: number;
  isLast: boolean;
  getItemType?: VirtualListOwnProps<T>["getItemType"];
  separator: React.ReactNode;
  onMeasure: (index: number, height: number, type: string | number) => void;
  itemProps: Partial<BoxProps>;
}

/**
 * One mounted row: the absolutely-positioned, measured wrapper around
 * {@link RowContent}. Memoized as the outer boundary so that pure scrolling —
 * which changes only the *set* of mounted indices, not the props of rows that stay
 * mounted — re-renders nothing at all for a surviving row.
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
  extraData,
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
      <RowContent<T> item={item} index={index} renderItem={renderItem} extraData={extraData} />
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
    keepMounted = false,
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
  // Referentially stable both when the caller passes no `styles.item` (see
  // {@link EMPTY_ITEM_PROPS}) and when they pass an inline literal (see
  // {@link useStableProps}) — a fresh object here breaks every row's memo.
  const itemSlot = useStableProps(slots.get("item") ?? EMPTY_ITEM_PROPS);

  const count = data.length;

  // Row identities, computed once per `data` change (never per render — this walks
  // the WHOLE list, not just the window). With them, measurements and the
  // `keepMounted` pool follow items through prepends, inserts, removals and sorts;
  // without a `keyExtractor` there is no identity to follow and both fall back to
  // index semantics, which is only correct for append/pop.
  const keys = React.useMemo(
    () => (keyExtractor ? data.map((item, i) => keyExtractor(item, i)) : null),
    [data, keyExtractor],
  );

  // ── layout model (mutable, in a ref — never triggers a render by itself) ──
  const layoutRef = React.useRef<LayoutState>(createLayoutState(count, estimatedItemSize));

  // The head row's key as of the last reconcile, and the prepend not yet
  // compensated for. Both are written in the body, alongside the store mutation
  // they describe — the reconcile is already a render-phase side effect, and
  // keeping them in step with it is what makes a double render idempotent (the
  // second pass sees `added === 0` and does nothing).
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

  // A "load older" page grows the data at the HEAD, and the viewport would jump by
  // the inserted height unless the scroll offset absorbs it. Detected in O(1) rather
  // than by diffing — a pure prepend puts the old head row at exactly `added`, so one
  // key comparison confirms it. Needs `keyExtractor`; index keys carry no identity to
  // recognise the row by.
  //
  // Read here, BEFORE the store is re-keyed below, because `added` is the difference
  // between the data and the store as it still stands. Carrying each measurement to
  // its row's new index is not this detection's job: that falls out of the keyed size
  // model (`syncLayoutKeys`), which handles a prepend as one case of any data change.
  // What the detection is still needed for is the scroll anchor — how much height
  // went in at the head.
  const added = count - layoutRef.current.count;
  const firstKey = keys && count > 0 ? keys[0] : null;
  const prepended =
    keys &&
    added > 0 &&
    added < count &&
    firstKeyRef.current != null &&
    keys[added] === firstKeyRef.current
      ? added
      : 0;

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
  // ── `keepMounted` pool: already-seen rows mounted outside the live window ──
  // The pool is a ref — LRU bookkeeping must not render — and the list of rows to
  // mount on top of the window is DERIVED from it during render, not mirrored into
  // state. Mirroring would go stale in exactly the case that matters: a data change
  // remaps the pool while rendering, and a stale copy would mount the wrong rows for
  // a frame, unmounting (and so resetting) the very rows `keepMounted` promised to
  // keep. Every pool mutation already coincides with a render — a window crossing
  // (`setRange`), a data/prop change, or the re-window effect — so no extra trigger
  // is needed; `pool.version` just lets the derivation be cached in between.
  const retainRef = React.useRef<RetainState>(createRetainState());
  const extrasRef = React.useRef<{ sig: string; list: readonly number[] }>({
    sig: "",
    list: NO_RETAINED,
  });
  // What the pool was last folded against, so a scroll frame that does not cross a
  // row boundary skips the (O(pool)) retention pass entirely.
  const retainSigRef = React.useRef<{
    count: number;
    limit: number;
    keys: readonly string[] | null;
  }>({ count: -1, limit: -1, keys: null });

  // ── keep the mutable models in step with the data (render-time, idempotent) ──
  // These are value-keyed caches rather than derived state: re-running this block on
  // a render React later throws away, or twice under StrictMode, produces exactly
  // the same models, and nothing here can schedule a render.
  const syncedKeysRef = React.useRef<readonly string[] | null>(null);
  // A new seed invalidates every estimate, so start the model over — and with it
  // anything the list was holding on to about where the old rows sat.
  if (layoutRef.current.estimate !== estimatedItemSize) {
    layoutRef.current = createLayoutState(count, estimatedItemSize);
    syncedKeysRef.current = null;
    anchorRef.current = null;
    pendingPrependRef.current = 0;
  }
  if (keys) {
    if (syncedKeysRef.current !== keys) {
      const prevKeys = syncedKeysRef.current;
      // One keyed re-sync covers every shape of data change, a prepend included: each
      // row's measurement is restored at the row's NEW index straight from the per-key
      // cache, so nothing has to be shifted by hand.
      syncLayoutKeys(layoutRef.current, keys);
      // Carry the `keepMounted` pool across the data change by identity, so a row
      // the user already opened stays mounted even if it moved.
      if (prevKeys) remapRetainState(retainRef.current, prevKeys, keys);
      syncedKeysRef.current = keys;
    }
  } else if (layoutRef.current.count !== count) {
    resizeLayoutState(layoutRef.current, count);
  }
  // Accumulated, not overwritten: two pages can land before the compensating effect
  // runs, and both inserted at the head.
  if (prepended > 0) pendingPrependRef.current += prepended;
  firstKeyRef.current = firstKey;

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
    // `keepMounted="all"` opts out of windowing: the window IS the list, so scroll
    // position stops mattering and every row is mounted from the first commit.
    const next = isMountAll(keepMounted)
      ? { start: 0, end: count - 1 }
      : findVisibleRange(
          layoutRef.current,
          scrollTopRef.current - headerHRef.current,
          vh,
          drawDistance,
        );
    const prev = rangeRef.current;
    const rangeChanged = next.start !== prev.start || next.end !== prev.end;
    if (rangeChanged) {
      rangeRef.current = next;
      setRange(next);
      onRenderedRangeChange?.(next);
    }

    // Fold the new window into the `keepMounted` pool. Only worth doing when the
    // window moved, the data changed, or the capacity changed — the pool's contents
    // are a pure function of those, so a plain scroll frame is a no-op. A reorder
    // counts as a change even at the same length: the window now holds different
    // items, and those are the ones that must be marked most-recently-visible.
    const limit = resolveRetainLimit(keepMounted);
    const sig = retainSigRef.current;
    if (rangeChanged || sig.count !== count || sig.limit !== limit || sig.keys !== keys) {
      retainSigRef.current = { count, limit, keys };
      retainRange(retainRef.current, next, count, limit);
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
    // Sub-pixel churn (a fractional flex height, a device pixel ratio round-trip)
    // must not re-window the whole list, so tolerate it like the chrome heights do.
    if (Math.abs(h - viewportHRef.current) <= MEASURE_EPSILON) return;
    viewportHRef.current = h;
    setViewportH(h);
  }, []);

  // The chrome measurers, hoisted out of the JSX so they keep one identity for the
  // life of the list instead of re-registering an observer on every render.
  const handleHeaderLayout = React.useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (Math.abs(headerHRef.current - h) <= MEASURE_EPSILON) return;
    headerHRef.current = h;
    setHeaderH(h);
  }, []);

  const handleFooterLayout = React.useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (Math.abs(footerHRef.current - h) <= MEASURE_EPSILON) return;
    footerHRef.current = h;
    setFooterH(h);
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
    // A reorder/filter that keeps the same length still moves every offset, so the
    // window has to be recomputed even though `count` did not change.
    keys,
    headerH,
    footerH,
    extraData,
    drawDistance,
    keepMounted,
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
  if (!isEmpty) {
    // Clamp the window to the data we actually have. `range` is state, so a render
    // triggered by `data` shrinking (a filter, a reset, a page rollback) still
    // carries the window computed against the OLD, longer list — indexing `data`
    // with it would hand `renderItem`/`keyExtractor` an `undefined` item. The
    // re-window effect corrects `range` immediately after this commit; this keeps
    // the one transitional render safe (and pinned to the new tail).
    const winStart = Math.max(0, Math.min(range.start, count - 1));
    const winEnd = Math.min(range.end, count - 1);
    const hasWindow = winEnd >= winStart;
    const renderRow = (i: number) => {
      const item = data[i];
      // `keys` is already computed for the whole list; never re-derive per render.
      const key = keys ? keys[i] : String(i);
      return (
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
        />
      );
    };

    // The `keepMounted` extras, derived from the live pool against the window we
    // are actually about to render (so they can never disagree) and cached on
    // `(pool version, window, count)` — the renders in between, e.g. a measurement
    // bumping `layoutVersion`, reuse the same list and the same array identity.
    const retained = (() => {
      const pool = retainRef.current;
      if (pool.seen.size === 0) return NO_RETAINED;
      const sig = `${pool.version}:${winStart}:${winEnd}:${count}`;
      if (extrasRef.current.sig === sig) return extrasRef.current.list;
      const list = retainedOutside(pool, { start: winStart, end: winEnd }, count);
      const next = list.length === 0 ? NO_RETAINED : list;
      extrasRef.current = { sig, list: next };
      return next;
    })();

    // Window rows plus the extras, merged in ascending index order (both lists are
    // already ascending, and `retainedOutside` guarantees the extras are in range
    // and disjoint from the window). Rows are absolutely positioned, so the order is
    // cosmetic — it keeps child order matching reading order.
    let cursor = 0;
    const emitExtrasBefore = (bound: number) => {
      while (cursor < retained.length && retained[cursor] < bound) {
        rows.push(renderRow(retained[cursor]));
        cursor++;
      }
    };

    if (hasWindow) {
      emitExtrasBefore(winStart);
      for (let i = winStart; i <= winEnd; i++) rows.push(renderRow(i));
    }
    emitExtrasBefore(count);
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
              <Box position="absolute" top={0} left={0} right={0} onLayout={handleHeaderLayout}>
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
                onLayout={handleFooterLayout}
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
