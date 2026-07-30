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

/**
 * How much of the list stays mounted beyond the live window — see
 * {@link VirtualListOwnProps.keepMounted} for the ladder.
 */
export type KeepMounted = boolean | number | "all";

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
   * Stable identity per row. Supply this whenever rows can be inserted, removed,
   * reordered or filtered: it is what makes the list's caches follow *items*
   * instead of slots, so a measured height, a retained (`keepMounted`) row and its
   * React state all move with their item. Without it the index is the identity,
   * which is only correct for append/pop — a prepend shifts every measurement onto
   * the wrong row and the list jumps while it re-measures.
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

  /**
   * How much stays mounted beyond the live window. Rows kept this way sit in the
   * tree at their real offsets (clipped by the scroller), so their React state,
   * DOM/native state and any in-flight work survive scrolling away and back — no
   * re-fetch, no reset inputs, no video restarting.
   *
   * An escalating ladder, cheapest first:
   *
   * - `false` (default) — pure virtualization: leaving the window unmounts.
   * - a number — keep at most that many already-seen rows outside the current
   *   window, evicting the least-recently-visible first (an LRU warm pool).
   *   The safe choice for long lists: bounded memory, and the rows the user is
   *   likely to come back to are exactly the ones kept.
   * - `true` — keep every row that has ever been mounted, for as long as it is in
   *   `data`. Unbounded, but still LAZY: a row the user has never scrolled to has
   *   never mounted, so a 10k-row list costs nothing until it is scrolled.
   * - `"all"` — no windowing at all. Every row in `data` is mounted immediately,
   *   whether or not it has ever been on screen, and `drawDistance` is moot. This
   *   is the escape hatch for when rows must exist before they are seen — measuring
   *   them all up front, letting `Ctrl-F`/find-in-page reach every row, printing,
   *   or driving something that needs the whole tree. It gives up the entire point
   *   of virtualization: mount cost is O(data), so keep it to lists of a size you
   *   would have rendered with `.map()` anyway.
   *
   * Kept rows are still measured and still re-render on `extraData`. Under a number
   * or `true` they do NOT widen {@link VirtualListOwnProps.onRenderedRangeChange},
   * which keeps reporting the live window; under `"all"` the window IS the whole
   * list, so it reports `{ start: 0, end: data.length - 1 }`.
   *
   * @default false
   */
  keepMounted?: KeepMounted;

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
/** Height change (px) at or below which a measurement is treated as unchanged. */
export const MEASURE_EPSILON = 0.5;

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

/** One row's measurement, cached against its stable key. */
interface CachedMeasurement {
  height: number;
  type: string | number;
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
  /**
   * The key of each row, when the caller supplied a `keyExtractor`; `null` in
   * index mode. Present keys make measurements follow *items* rather than slots —
   * see {@link syncLayoutKeys}.
   */
  keys: readonly string[] | null;
  /** Measurement per key, so a row keeps its height across data changes. */
  cache: Map<string, CachedMeasurement>;
}

const DEFAULT_TYPE = 0;

/**
 * Retained multiple of `count` for the per-key measurement cache. Entries for
 * rows no longer in `data` are kept until the cache outgrows this, so the common
 * filter-then-restore (a search box) still finds its heights, while a long churn
 * cannot grow the cache without bound.
 */
const CACHE_SLACK = 2;

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
  keys: null,
  cache: new Map(),
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
 * Re-key the store to `keys` (one per row, in data order) and restore each row's
 * measurement from the per-key cache.
 *
 * This is what makes a data change *identity-correct* rather than slot-correct, and
 * it is the store half of backwards pagination. Index-keyed measurement is only
 * right for append/pop: prepend one row and every height shifts to the wrong item,
 * so the list reflows for the whole first scroll back up, re-learning heights in
 * slots that already claimed to know them. Keyed by the caller's `keyExtractor`, a
 * prepend, insert, removal, sort or filter moves each height with its item, and rows
 * already measured never flash.
 *
 * Rebuilds the per-index arrays from the cache (O(n) — run only when the key list
 * actually changes, not per render) and marks offsets stale from the first row that
 * moved. Restored measurements deliberately do NOT re-feed the per-type running
 * averages: they were counted when first measured.
 */
export const syncLayoutKeys = (state: LayoutState, keys: readonly string[]): void => {
  const count = keys.length;
  const prevCount = state.count;
  let firstChanged = count;

  const note = (i: number) => {
    if (i < firstChanged) firstChanged = i;
  };

  for (let i = 0; i < count; i++) {
    const hit = state.cache.get(keys[i]);
    const height = hit ? hit.height : state.estimate;
    const measured = hit !== undefined;
    const type = hit ? hit.type : DEFAULT_TYPE;
    if (
      i >= prevCount ||
      state.measured[i] !== measured ||
      state.types[i] !== type ||
      state.heights[i] !== height
    ) {
      note(i);
    }
    state.heights[i] = height;
    state.measured[i] = measured;
    state.types[i] = type;
  }

  if (count < prevCount) {
    state.heights.length = count;
    state.measured.length = count;
    state.types.length = count;
    note(count);
  }
  state.offsets.length = count + 1;
  state.count = count;
  state.keys = keys;
  state.dirtyFrom = Math.min(state.dirtyFrom, firstChanged);

  // Bound the cache: drop measurements for keys the data no longer holds, but only
  // once it has grown past the slack, so short-lived removals keep their heights.
  if (state.cache.size > count * CACHE_SLACK + 1) {
    const live = new Set(keys);
    for (const key of state.cache.keys()) {
      if (!live.has(key)) state.cache.delete(key);
    }
  }
};

/**
 * Grow/shrink the store to `count` rows, preserving existing measurements by
 * index — correct for an append or a pop, which is what row `i` keeping its height
 * means, and the only option in index mode (no `keyExtractor`). A PREPEND is not
 * that shape, and neither is a reorder or a filter: supply a `keyExtractor` and
 * {@link syncLayoutKeys} keeps every measurement attached to its item across any
 * data change instead. Returns the new state (same instance, mutated) so callers
 * can keep their ref.
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
  // Mirror into the per-key cache so the measurement survives a data change.
  const key = state.keys?.[i];
  if (key !== undefined) state.cache.set(key, { height, type });
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

/* -------------------------------------------------------------------------- */
/* Retention pool (pure, unit-tested)                                         */
/* -------------------------------------------------------------------------- */

/**
 * The `keepMounted` warm pool: which already-seen rows stay mounted after they
 * leave the window. A `Set` doubles as the LRU order — JS iterates insertion
 * order, and re-visiting a row is `delete` + `add`, which moves it to the back —
 * so the front of the set is always the least-recently-visible row and eviction
 * is a forward walk.
 */
export interface RetainState {
  /** Every retained index, oldest-visible first. */
  seen: Set<number>;
  /**
   * Bumped on every content change. The component derives its mounted extras from
   * the pool during render rather than mirroring them into state (state would go
   * stale the moment a data change remapped the pool mid-render); this counter is
   * what lets that derivation be cached across the renders in between.
   */
  version: number;
}

/** Create an empty retention pool. */
export const createRetainState = (): RetainState => ({ seen: new Set(), version: 0 });

/** Empty extras list — a shared constant so "nothing retained" is one identity. */
export const NO_RETAINED: readonly number[] = [];

/** The `keepMounted` value that turns windowing off entirely. */
export const MOUNT_ALL = "all";

/** Whether `keepMounted` asks for the whole list to be mounted up front. */
export const isMountAll = (keepMounted: KeepMounted | undefined): boolean =>
  keepMounted === MOUNT_ALL;

/**
 * Resolve the `keepMounted` prop to a pool capacity: `0` (off), a positive integer,
 * or `Infinity` (unbounded). `"all"` resolves to `0` — with every row inside the
 * window there is nothing left for a pool to hold.
 */
export const resolveRetainLimit = (keepMounted: KeepMounted | undefined): number => {
  if (keepMounted === true) return Infinity;
  if (typeof keepMounted === "number") return keepMounted > 0 ? Math.floor(keepMounted) : 0;
  return 0;
};

/**
 * Fold the live window `range` into the pool: rows in the window are (re)marked
 * most-recently-visible (which is also how a row first enters the pool), rows the
 * data no longer has are dropped, and once the rows outside the window exceed
 * `limit` the least-recently-visible ones are evicted until they fit. A `limit` of
 * `0` empties the pool, so turning `keepMounted` off releases everything.
 *
 * Mutates `state`, bumping `state.version` only when something actually changed,
 * and is idempotent for an unchanged `(range, count, limit)`. Read the result with
 * {@link retainedOutside}.
 */
export const retainRange = (
  state: RetainState,
  range: { start: number; end: number },
  count: number,
  limit: number,
): void => {
  const { seen } = state;
  let changed = false;

  if (limit <= 0) {
    if (seen.size > 0) {
      seen.clear();
      state.version++;
    }
    return;
  }

  // Rows the data no longer has can never be rendered again.
  for (const i of seen) {
    if (i >= count) {
      seen.delete(i);
      changed = true;
    }
  }

  // Re-insert the live rows so the window is always the most-recently-visible end
  // of the LRU order. Re-inserting an already-present row reorders the pool without
  // changing which rows it holds — that is a change the render does not care about
  // (the window is mounted regardless), so it does not bump the version.
  const first = Math.max(0, range.start);
  const last = Math.min(range.end, count - 1);
  for (let i = first; i <= last; i++) {
    if (!seen.delete(i)) changed = true;
    seen.add(i);
  }

  const inWindow = (i: number): boolean => i >= first && i <= last;

  let extras = 0;
  for (const i of seen) {
    if (!inWindow(i)) extras++;
  }
  // Evict oldest-first; the live window is never evictable (it is mounted anyway).
  if (extras > limit) {
    for (const i of seen) {
      if (extras <= limit) break;
      if (inWindow(i)) continue;
      seen.delete(i);
      extras--;
      changed = true;
    }
  }

  if (changed) state.version++;
};

/**
 * The retained rows that fall OUTSIDE `range`, ascending — exactly the extra rows
 * to mount on top of the window. Pure: safe to call during render.
 */
export const retainedOutside = (
  state: RetainState,
  range: { start: number; end: number },
  count: number,
): number[] => {
  const out: number[] = [];
  for (const i of state.seen) {
    if (i < 0 || i >= count) continue;
    if (i >= range.start && i <= range.end) continue;
    out.push(i);
  }
  // Ascending, so mounted children stay in reading order (they are absolutely
  // positioned, so this is about tab/screen-reader order, not layout).
  out.sort((a, b) => a - b);
  return out;
};

/**
 * Move the pool's indices onto a new key list, so "already mounted" tracks the
 * *item* across a data change instead of the slot it happened to occupy. Rows that
 * left the data drop out; the LRU order is preserved (a `Set` rebuilt in iteration
 * order keeps oldest-visible first). A no-op when nothing is retained.
 */
export const remapRetainState = (
  state: RetainState,
  oldKeys: readonly string[],
  newKeys: readonly string[],
): void => {
  if (state.seen.size === 0) return;
  const indexByKey = new Map<string, number>();
  for (let i = 0; i < newKeys.length; i++) indexByKey.set(newKeys[i], i);
  const next = new Set<number>();
  for (const i of state.seen) {
    const key = oldKeys[i];
    if (key === undefined) continue;
    const at = indexByKey.get(key);
    if (at !== undefined) next.add(at);
  }
  state.seen = next;
  state.version++;
};

/**
 * One-level equality for two prop bags. Used to give an inline `styles.item`
 * object a stable identity across renders, so a caller writing the idiomatic
 * `styles={{ item: { … } }}` literal does not defeat every row's memo.
 */
export const shallowEqualProps = (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean => {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  for (const key of aKeys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
};
