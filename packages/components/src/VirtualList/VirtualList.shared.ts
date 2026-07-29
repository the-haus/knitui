import type * as React from "react";

import type { BoxProps } from "../Box";
import type { SlotStyles } from "../internal/styles";

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

/** Argument passed to {@link VirtualListProps.renderItem} for one row. */
export interface VirtualListRenderItemInfo<T> {
  /** The data item for this row. */
  item: T;
  /** Its index into `data`. */
  index: number;
}

/**
 * Uniform per-slot style passthrough for `VirtualList` (Pillar B). Each key
 * spreads onto the matching part, layered after the discrete props.
 * Slots: `scrollArea` (the underlying scroller frame) / `content` (the sized
 * spacer that holds the absolutely-positioned rows) / `item` (each row wrapper).
 */
export interface VirtualListStyles {
  /** Props spread onto the underlying `ScrollArea` frame. */
  scrollArea?: Partial<BoxProps>;
  /** Props spread onto the total-size content spacer. */
  content?: Partial<BoxProps>;
  /** Props spread onto each absolutely-positioned row wrapper. */
  item?: Partial<BoxProps>;
}

/** Slot names of {@link VirtualListStyles}, for `slotStyles`. */
export const VIRTUAL_LIST_SLOTS = [
  "scrollArea",
  "content",
  "item",
] as const satisfies readonly (keyof VirtualListStyles)[];

/**
 * Imperative handle exposed on the `VirtualList` ref (and the optional
 * `handleRef`). Drives the list programmatically — scroll to an index, an
 * absolute offset, or an end — on both web and native.
 */
export interface VirtualListHandle {
  /**
   * Reveal a row by index. `viewPosition` aligns it within the viewport
   * (`0` top / `0.5` centre / `1` bottom; default `0`); `viewOffset` nudges the
   * resting position by px.
   */
  scrollToIndex(options: {
    index: number;
    animated?: boolean;
    viewPosition?: number;
    viewOffset?: number;
  }): void;
  /** Scroll to an absolute vertical offset (px). */
  scrollToOffset(options: { offset: number; animated?: boolean }): void;
  /** Scroll to the very top. */
  scrollToTop(animated?: boolean): void;
  /**
   * Scroll to the very end (bottom).
   *
   * Under `maintainVisibleContentPosition` a non-animated call HOLDS the end
   * rather than hitting it once, re-deriving it as the rows there measure — which
   * is what a list opening at the bottom of unmeasured content needs, since the
   * total it aims at starts out mostly estimate.
   */
  scrollToEnd(animated?: boolean): void;
  /** The current vertical scroll offset (px). */
  getScrollOffset(): number;
}

/**
 * Props shared across the (single, cross-platform) `VirtualList`
 * implementation. Mirrors the familiar `FlatList` / `FlashList` surface for the
 * subset v1 covers: a vertical, single-column, variable-height, windowed list.
 */
export interface VirtualListOwnProps<T> {
  /** The data to render, one row per element. */
  data: ReadonlyArray<T>;

  /** Render one row. Kept referentially stable (or memoize your rows). */
  renderItem: (info: VirtualListRenderItemInfo<T>) => React.ReactNode;

  /**
   * Stable identity per row. Defaults to the index, which is only safe for
   * append-only data — supply this whenever rows can be inserted/removed/reordered
   * so measurements and React state track the right item.
   */
  keyExtractor?: (item: T, index: number) => string;

  /**
   * Group rows into recycle/estimation buckets. Rows of the same type share a
   * running average size, so heterogeneous lists estimate each kind separately.
   * @default a single bucket
   */
  getItemType?: (item: T, index: number) => string | number;

  /**
   * Seed size (px) for a not-yet-measured row, per axis (here: height). Only an
   * initial guess — measured rows immediately override it and feed the per-type
   * running average. A closer value means less first-scroll correction.
   * @default 200
   */
  estimatedItemSize?: number;

  /**
   * Extra distance (px) rendered beyond each edge of the viewport, so rows exist
   * slightly before they scroll in. @default 250
   */
  drawDistance?: number;

  /** Re-render trigger for `renderItem` when external state changes (PureComponent-style). */
  extraData?: unknown;

  /* ---- edge callbacks ---------------------------------------------------- */

  /** Fired once as the end (bottom) comes within `onEndReachedThreshold` viewports. */
  onEndReached?: () => void;
  /**
   * Distance from the end at which `onEndReached` fires, in units of visible
   * length (a viewport). @default 0.5
   */
  onEndReachedThreshold?: number;

  /**
   * Fired once as the start (top) comes within `onStartReachedThreshold`
   * viewports — the mirror of {@link onEndReached}, for a list paginated
   * BACKWARDS (a chat thread loading older messages, a log tailing history).
   *
   * Like `onEndReached` on a list shorter than its viewport, this fires on mount
   * when the list rests at offset 0, because it genuinely IS at the start. A
   * caller that opens the list scrolled elsewhere (`scrollToEnd` on a chat
   * thread) should gate its loader until that initial scroll has been applied,
   * or the first frame spends a page request on nothing.
   *
   * Pair it with `maintainVisibleContentPosition` — without it, the rows the
   * user is reading slide down by the height of whatever gets prepended.
   */
  onStartReached?: () => void;
  /**
   * Distance from the start at which `onStartReached` fires, in units of visible
   * length (a viewport). @default 0.5
   */
  onStartReachedThreshold?: number;

  /**
   * Hold the reading position across a layout change instead of letting the rows
   * slide. Two things stop being jumpy:
   *
   * - A **prepend** (a `onStartReached` page of history) has its inserted height
   *   added to the scroll offset in the same frame, so the row the user was
   *   looking at does not move. Requires `keyExtractor` — a prepend is detected by
   *   finding the previous first row's key at its new index, and index keys carry
   *   no identity to find it by.
   * - A non-animated **`scrollToEnd`** holds the bottom while the rows there
   *   measure, rather than aiming once at a total that is still mostly estimate.
   *
   * Off by default: it takes over the scroll position, which a list that only
   * grows at the tail has no reason to hand over. Either correction is abandoned
   * the moment the user scrolls — continuing to correct through a live gesture
   * would fight it — and as soon as the rows in question have all been measured,
   * since nothing can move after that.
   */
  maintainVisibleContentPosition?: boolean;

  /**
   * The set of currently-rendered row indices whenever it changes. Useful for
   * prefetch/telemetry; not a viewability report (that is phase 2).
   */
  onRenderedRangeChange?: (range: { start: number; end: number }) => void;

  /* ---- chrome slots ------------------------------------------------------ */

  /** Rendered once above the first row (scrolls with content). */
  ListHeaderComponent?: React.ReactNode;
  /** Rendered once below the last row (scrolls with content). */
  ListFooterComponent?: React.ReactNode;
  /** Rendered instead of rows when `data` is empty. */
  ListEmptyComponent?: React.ReactNode;
  /** Rendered between rows (not after the last). Its height is folded into each row. */
  ItemSeparatorComponent?: React.ReactNode;

  /* ---- imperative + style ------------------------------------------------ */

  /** Imperative handle; an alternative to the forwarded `ref`. */
  handleRef?: React.Ref<VirtualListHandle>;

  /** Uniform per-slot style passthrough. See {@link VirtualListStyles}. */
  styles?: SlotStyles<VirtualListStyles>;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** Default seed size for an unmeasured row (px). */
export const DEFAULT_ESTIMATED_ITEM_SIZE = 200;
/** Default render-ahead buffer beyond each viewport edge (px). */
export const DEFAULT_DRAW_DISTANCE = 250;
/** Default `onEndReached` threshold, in viewports. */
export const DEFAULT_END_REACHED_THRESHOLD = 0.5;
/** Default `onStartReached` threshold, in viewports. */
export const DEFAULT_START_REACHED_THRESHOLD = 0.5;
/** Height change (px) below which a measurement is treated as unchanged. */
const MEASURE_EPSILON = 0.5;

/* -------------------------------------------------------------------------- */
/* Layout store (pure, unit-tested)                                           */
/* -------------------------------------------------------------------------- */

/**
 * Cumulative running mean of every measured size for a type. Kept as a
 * converging mean (running sum + count) rather than a short rolling window so
 * the estimate *stabilises* as more rows are measured: each new sample moves it
 * by only `1 / count`, so its ripple into the not-yet-measured rows' total
 * height (and therefore the scrollbar thumb) decays toward zero instead of
 * oscillating up and down on every measurement.
 */
interface AverageBucket {
  sum: number;
  count: number;
}

/**
 * Mutable layout model for a variable-height, single-axis list. Holds each row
 * wrapper's measured height (or a per-type estimate until measured) and lazily
 * maintains the cumulative offset array used for windowing. Kept framework-free
 * so it is fully unit-testable; the component owns one instance in a ref.
 */
export interface LayoutState {
  count: number;
  estimate: number;
  /** Measured wrapper height per index (includes a folded separator). */
  heights: number[];
  measured: boolean[];
  types: Array<string | number>;
  /** `offsets[i]` = top of row `i` within the content; `offsets[count]` = total. */
  offsets: number[];
  averages: Map<string | number, AverageBucket>;
  /** Lowest index whose offset may be stale; `count + 1` means clean. */
  dirtyFrom: number;
}

const DEFAULT_TYPE = 0;

/** Create a layout store for `count` rows, seeding every row with `estimate`. */
export const createLayoutState = (count: number, estimate: number): LayoutState => ({
  count,
  estimate,
  heights: new Array(count).fill(estimate),
  measured: new Array(count).fill(false),
  types: new Array(count).fill(DEFAULT_TYPE),
  offsets: new Array(count + 1).fill(0),
  averages: new Map(),
  dirtyFrom: 0,
});

const bucketAverage = (bucket: AverageBucket | undefined, fallback: number): number => {
  if (!bucket || bucket.count === 0) return fallback;
  return bucket.sum / bucket.count;
};

/** Estimated height for an unmeasured row of `type`, off its running average. */
const estimateFor = (state: LayoutState, type: string | number): number =>
  bucketAverage(state.averages.get(type), state.estimate);

/** Height of row `i` — its measurement if present, else the per-type estimate. */
export const heightAt = (state: LayoutState, i: number): number =>
  state.measured[i] ? state.heights[i] : estimateFor(state, state.types[i]);

/**
 * Grow/shrink the store to `count` rows, preserving existing measurements by
 * index — correct for an append or a pop, which is what row `i` keeping its
 * height means. A PREPEND is not that shape: use {@link prependLayoutState},
 * which shifts the measurements along with the rows they belong to. (A reorder
 * still misattributes; the store is indexed, not keyed.) Returns the new state
 * (same instance, mutated) so callers can keep their ref.
 */
export const resizeLayoutState = (state: LayoutState, count: number): LayoutState => {
  if (count === state.count) return state;
  const keep = Math.min(count, state.count);
  if (count > state.count) {
    for (let i = state.count; i < count; i++) {
      state.heights.push(state.estimate);
      state.measured.push(false);
      state.types.push(DEFAULT_TYPE);
    }
  } else {
    state.heights.length = count;
    state.measured.length = count;
    state.types.length = count;
  }
  state.offsets.length = count + 1;
  state.count = count;
  state.dirtyFrom = Math.min(state.dirtyFrom, keep);
  return state;
};

/**
 * Insert `added` unmeasured rows at the HEAD, carrying every existing row's
 * measurement to its new index.
 *
 * This is the store half of backwards pagination. {@link resizeLayoutState} grows
 * the tail, so a prepend routed through it left row 0's height on row 0 — which is
 * now a different row — and every measurement in the list read off by `added`
 * places. The visible symptom is a list that reflows for the whole first scroll
 * back up, since each row's real height has to be re-learned in a slot that
 * already claimed to know it.
 *
 * Marks all offsets stale (`dirtyFrom = 0`): the head moved, so nothing downstream
 * of it is still valid. Returns the same instance, mutated.
 */
export const prependLayoutState = (state: LayoutState, added: number): LayoutState => {
  if (added <= 0) return state;
  state.heights = new Array<number>(added).fill(state.estimate).concat(state.heights);
  state.measured = new Array<boolean>(added).fill(false).concat(state.measured);
  state.types = new Array<string | number>(added).fill(DEFAULT_TYPE).concat(state.types);
  state.count += added;
  state.offsets.length = state.count + 1;
  state.dirtyFrom = 0;
  return state;
};

/**
 * Whether every row in `[from, to)` carries a real measurement — i.e. whether
 * anything in that band can still move. Used to release the prepend anchor once
 * the inserted rows have settled.
 */
export const areRowsMeasured = (state: LayoutState, from: number, to: number): boolean => {
  const hi = Math.min(to, state.count);
  for (let i = Math.max(0, from); i < hi; i++) {
    if (!state.measured[i]) return false;
  }
  return true;
};

/**
 * Record a measured wrapper height for row `i` of `type`. Updates the per-type
 * running average and marks offsets stale from `i`. Returns `true` when the
 * height changed beyond {@link MEASURE_EPSILON} (i.e. a relayout is warranted).
 */
export const setMeasured = (
  state: LayoutState,
  i: number,
  type: string | number,
  height: number,
): boolean => {
  if (i < 0 || i >= state.count) return false;
  // A non-positive height is not a usable measurement (hidden/teardown layouts,
  // and jsdom, report 0) — keep the estimate until a real height arrives.
  if (!(height > 0)) return false;
  const typeChanged = state.types[i] !== type;
  const changed = !state.measured[i] || Math.abs(state.heights[i] - height) > MEASURE_EPSILON;
  state.types[i] = type;

  if (!changed && !typeChanged) return false;

  // Feed the type's cumulative running mean (only real measurements contribute).
  let bucket = state.averages.get(type);
  if (!bucket) {
    bucket = { sum: 0, count: 0 };
    state.averages.set(type, bucket);
  }
  bucket.sum += height;
  bucket.count += 1;

  state.heights[i] = height;
  state.measured[i] = true;
  state.dirtyFrom = Math.min(state.dirtyFrom, i);
  return true;
};

/** Recompute cumulative offsets forward from `dirtyFrom` (lazy; idempotent). */
const ensureOffsets = (state: LayoutState): void => {
  if (state.dirtyFrom > state.count) return;
  const from = Math.max(0, state.dirtyFrom);
  for (let i = from; i < state.count; i++) {
    state.offsets[i + 1] = state.offsets[i] + heightAt(state, i);
  }
  state.dirtyFrom = state.count + 1;
};

/** Total content height (px) across all rows. */
export const getContentSize = (state: LayoutState): number => {
  ensureOffsets(state);
  return state.count === 0 ? 0 : state.offsets[state.count];
};

/** Top offset (px) of row `i` within the content. */
export const getItemOffset = (state: LayoutState, i: number): number => {
  ensureOffsets(state);
  return state.offsets[Math.max(0, Math.min(i, state.count))];
};

/**
 * Smallest row index whose bottom edge (`offsets[i + 1]`) is past `target`, i.e.
 * the first row at least partially below `target`. Returns the last index if
 * every row ends at/before `target` (scrolled past all content).
 */
const firstRowEndingAfter = (state: LayoutState, target: number): number => {
  let lo = 0;
  let hi = state.count - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (state.offsets[mid + 1] > target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
};

/**
 * Largest row index whose top edge (`offsets[i]`) is before `target`, i.e. the
 * last row at least partially above `target`. Returns `0` if no row starts before.
 */
const lastRowStartingBefore = (state: LayoutState, target: number): number => {
  let lo = 0;
  let hi = state.count - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (state.offsets[mid] < target) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};

/**
 * Index range `[start, end]` to mount for a scroll position, padded by
 * `overscan` px on each side. `end` is `-1` (empty range) when there are no rows;
 * when all content fits within the viewport every row is mounted.
 */
export const findVisibleRange = (
  state: LayoutState,
  scrollStart: number,
  viewportSize: number,
  overscan: number,
): { start: number; end: number } => {
  if (state.count === 0) return { start: 0, end: -1 };
  ensureOffsets(state);
  const total = state.offsets[state.count];
  if (total <= viewportSize) return { start: 0, end: state.count - 1 };

  const top = Math.max(0, scrollStart - overscan);
  const bottom = scrollStart + viewportSize + overscan;
  const start = firstRowEndingAfter(state, top);
  const end = Math.max(start, lastRowStartingBefore(state, bottom));
  return { start, end };
};
