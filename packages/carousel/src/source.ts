import * as React from "react";

/**
 * A lazily-loaded slide source. The carousel only ever asks for the indices in
 * its virtualization window, so a source fetches just those (plus whatever the
 * window's prefetch lead covers) and notifies when data arrives.
 */
export interface SlideSource<T> {
  /** Total number of slides (drives loop math, snapping, pagination). */
  readonly length: number;
  /** Synchronous cache read; `undefined` means "not loaded yet". */
  getItem(index: number): T | undefined;
  /** Ask the source to load these indices (no-op if cached or in flight). */
  ensure(indices: number[]): void;
  /** Subscribe to data-availability changes. Returns an unsubscribe fn. */
  subscribe(listener: () => void): () => void;
  /** Monotonic version, for `useSyncExternalStore` snapshots. */
  getVersion(): number;
}

export interface AsyncSlideSourceOptions<T> {
  /** Total item count. */
  length: number;
  /** Fetch a contiguous range — returns the items for `[start, start + count)`. */
  fetchRange: (start: number, count: number) => Promise<T[]>;
  /** Fetch batch size; indices are grouped into aligned pages of this size. */
  pageSize?: number;
}

/**
 * Build a {@link SlideSource} backed by an async pager. Items are fetched in
 * aligned batches of `pageSize`, cached, and de-duplicated (a page already
 * loaded or in flight is never re-requested). A failed page is dropped from the
 * in-flight set so it can be retried when its window is revisited.
 */
export function createAsyncSlideSource<T>(opts: AsyncSlideSourceOptions<T>): SlideSource<T> {
  const { length, fetchRange, pageSize = 10 } = opts;
  const cache = new Map<number, T>();
  const pendingPages = new Set<number>();
  const listeners = new Set<() => void>();
  let version = 0;

  const emit = () => {
    version += 1;
    listeners.forEach((l) => l());
  };

  const fetchPage = (page: number) => {
    if (pendingPages.has(page)) return;
    const start = page * pageSize;
    if (start >= length) return;
    const count = Math.min(pageSize, length - start);
    pendingPages.add(page);
    Promise.resolve(fetchRange(start, count)).then(
      (items) => {
        pendingPages.delete(page);
        let changed = false;
        items.forEach((item, i) => {
          const idx = start + i;
          if (idx < length && !cache.has(idx)) {
            cache.set(idx, item);
            changed = true;
          }
        });
        if (changed) emit();
      },
      () => {
        // Drop from in-flight so the page can be retried later.
        pendingPages.delete(page);
      },
    );
  };

  return {
    get length() {
      return length;
    },
    getItem: (index) => cache.get(index),
    ensure: (indices) => {
      const pages = new Set<number>();
      for (const i of indices) {
        if (i < 0 || i >= length || cache.has(i)) continue;
        pages.add(Math.floor(i / pageSize));
      }
      pages.forEach(fetchPage);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getVersion: () => version,
  };
}

/** Uniform accessor the view layer uses for both array data and async sources. */
export interface ResolvedSource<T> {
  count: number;
  getItem: (index: number) => T | undefined;
  ensure: (indices: number[]) => void;
}

const noopEnsure = () => {};

/**
 * Normalize `data` (eager array) or `source` (lazy async) into one accessor, and
 * subscribe to an async source so the carousel re-renders as pages arrive.
 */
export function useResolvedSource<T>(
  data: T[] | undefined,
  source: SlideSource<T> | undefined,
): ResolvedSource<T> {
  const subscribe = React.useCallback(
    (cb: () => void) => (source ? source.subscribe(cb) : noopEnsure),
    [source],
  );
  const getVersion = React.useCallback(() => (source ? source.getVersion() : 0), [source]);
  // Re-render when the async source gains data.
  React.useSyncExternalStore(subscribe, getVersion, getVersion);

  return React.useMemo<ResolvedSource<T>>(() => {
    if (source) {
      return {
        count: source.length,
        getItem: (i) => source.getItem(i),
        ensure: (indices) => source.ensure(indices),
      };
    }
    const arr = data ?? [];
    return { count: arr.length, getItem: (i) => arr[i], ensure: noopEnsure };
  }, [source, data]);
}
