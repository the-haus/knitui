import * as React from "react";
import { type SharedValue, useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { isWeb } from "@knitui/core";

import { activeIndex, clamp, mod, offsetFor, progressFor, rawIndex } from "../engine";
import { useSharedValueListener } from "../hooks/useSharedValueListener";
import type { CarouselProps, CarouselRef, ScrollToOptions, StepOptions } from "../types";
import { animateOffset } from "./animations";

/** Defaults resolved once from the public props. */
export interface ResolvedConfig {
  /** Effective slide count used by the motion engine (may exceed `rawCount`
   * when a tiny looped list is auto-filled so the ring stays seamless). */
  count: number;
  /** Real number of data items (what `getItem` / index callbacks speak in). */
  rawCount: number;
  loop: boolean;
  vertical: boolean;
  defaultIndex: number;
  pagingEnabled: boolean;
  snapEnabled: boolean;
  overscrollEnabled: boolean;
  enabled: boolean;
  windowSize: number;
  /** Extra items to pre-load ahead of the window in the travel direction. */
  prefetchCount: number;
  scrollAnimationDuration: number;
  /** Resolved explicit page size (px) from `itemSize`/`itemWidth`/`itemHeight`; 0 = measure. */
  itemSize: number;
  /** Forced programmatic travel direction in loop mode (experimental). */
  fixedDirection?: "positive" | "negative";
  /** Scroll implementation: the transform engine, or a native scroll container. */
  scrollMode: "transform" | "native";
}

/** Default mounted window for a lazy source (so it doesn't fetch everything). */
const ASYNC_DEFAULT_WINDOW = 5;
/** Above this item count, eager data auto-virtualizes to stay performant. */
const LARGE_DATA_THRESHOLD = 11;
const LARGE_DATA_WINDOW = 11;

export function resolveConfig<T>(props: CarouselProps<T>): ResolvedConfig {
  const rawCount = props.source ? props.source.length : (props.data?.length ?? 0);
  const scrollMode = props.scrollMode ?? "transform";
  const native = scrollMode === "native";
  const loop = props.loop ?? true;
  // Auto-fill duplicates a tiny list (1→3, 2→4) so the TRANSFORM engine's ring
  // fills on both sides. Native scroll loops by physically cloning the ring in
  // the track (see NativeTrack), so it needs neither auto-fill nor the effective
  // count bump — it works off `rawCount` directly.
  const autoFill =
    (props.autoFillData ?? true) &&
    loop &&
    !native &&
    !props.source &&
    rawCount > 0 &&
    rawCount < 3;
  const count = autoFill ? (rawCount === 1 ? 3 : 4) : rawCount;
  // windowSize=0 means "mount all". That's fine for small carousels (no
  // mount/unmount churn) but a perf trap for large sets, so:
  //  - async source  → bounded window (also bounds fetching),
  //  - large eager data → bounded window (virtualize),
  //  - small eager data → mount all.
  let windowSize = props.windowSize;
  if (windowSize === undefined) {
    if (props.source) windowSize = ASYNC_DEFAULT_WINDOW;
    else if (count > LARGE_DATA_THRESHOLD) windowSize = LARGE_DATA_WINDOW;
    else windowSize = 0;
  }
  // Pre-load ahead of the window so an async source's pages are cached before
  // their slides scroll in. Meaningful only for a lazy `source` (eager data is
  // already resident); default to one extra window's worth in the travel
  // direction. Capped at `count` (can't prefetch more items than exist).
  const prefetchCount = Math.min(
    props.prefetchCount ?? (props.source ? Math.max(windowSize, 1) : 0),
    count,
  );
  const vertical = props.vertical ?? false;
  // Page size: `itemSize` wins; else the axis-specific alias (`itemWidth` /
  // `itemHeight`); else 0 → measure the container.
  const itemSize = props.itemSize ?? (vertical ? props.itemHeight : props.itemWidth) ?? 0;
  return {
    count,
    rawCount,
    loop,
    vertical,
    defaultIndex: clamp(props.defaultIndex ?? 0, 0, Math.max(0, count - 1)),
    pagingEnabled: props.pagingEnabled ?? true,
    snapEnabled: props.snapEnabled ?? true,
    overscrollEnabled: props.overscrollEnabled ?? true,
    enabled: props.enabled ?? true,
    windowSize,
    prefetchCount,
    scrollAnimationDuration: props.scrollAnimationDuration ?? 500,
    itemSize,
    fixedDirection: props.fixedDirection,
    scrollMode,
  };
}

export interface CarouselCore {
  /** The one source of truth: scroll offset px, forward = negative. */
  offset: SharedValue<number>;
  /** Resolved page size px (item extent along the axis). */
  size: SharedValue<number>;
  /** Resolved page size px as React state (for layout/dimensions). */
  pageSize: number;
  /** Fractional absolute progress in [0, count). Drives pagination. */
  progress: SharedValue<number>;
  config: ResolvedConfig;
  /** The current settled active index (React state, for rendering/a11y). */
  activeIndex: number;
  /** Apply a measured/explicit page size (reconciles the offset). */
  setSize: (next: number) => void;
  controller: CarouselRef;
  /** Begin a scroll (fires onScrollStart, pauses autoplay). */
  onInteractionStart: () => void;
  /** Settle handler (fires onScrollEnd, resumes autoplay). */
  onInteractionEnd: () => void;
}

/**
 * The heart of the carousel: owns the offset shared value and everything derived
 * from it. Platform-agnostic — input layers (gesture / wheel / keyboard) drive
 * `offset`; this hook publishes progress, reports the active index, reconciles
 * size/count changes, and exposes the imperative controller.
 */
/**
 * Imperatively scroll a native scroll container to an engine offset (px).
 * `from` is the engine offset the move STARTS from (captured before the core
 * seeds the target); a looping track uses it to travel to the nearest ring copy
 * of the destination (shortest visual path). Omitted for non-navigational
 * reconciles (controlled `index`, data-length change), where the track picks a
 * safe in-band copy itself.
 */
export type SeekFn = (offset: number, animated: boolean, from?: number) => void;

export function useCarouselCore<T>(
  props: CarouselProps<T>,
  config: ResolvedConfig,
  autoplayRef: React.MutableRefObject<{ pause: () => void; resume: () => void } | null>,
  /**
   * In `scrollMode="native"` the track registers an imperative seek here so the
   * controller / controlled `index` drive the real scroll container instead of
   * the (unused) transform animation. `null` in transform mode.
   */
  seekRef?: React.MutableRefObject<SeekFn | null>,
): CarouselCore {
  const { count, rawCount, loop, scrollAnimationDuration, defaultIndex } = config;
  // Map an effective (engine-space) index to the real data index it displays.
  const toReal = React.useCallback(
    (effective: number) => (rawCount > 0 ? mod(effective, rawCount) : 0),
    [rawCount],
  );

  // Start size at 0 even when `itemSize` is known, so the first `setSize` call
  // runs the seeding path (offset ← defaultIndex) instead of early-returning.
  //
  // The offset is the carousel's one source of truth. A consumer may hand us a
  // shared value (`scrollOffsetValue`, or the deprecated `defaultScrollOffsetValue`)
  // to observe/drive it from outside; otherwise we own one. The selection is made
  // once and must be stable across renders.
  const internalOffset = useSharedValue(0);
  const offset = props.scrollOffsetValue ?? props.defaultScrollOffsetValue ?? internalOffset;
  const size = useSharedValue(0);
  const [pageSize, setPageSize] = React.useState(0);
  const progress = useSharedValue(0);
  const lastReportedIndex = useSharedValue(-1);

  const [active, setActive] = React.useState(defaultIndex);
  const activeRef = React.useRef(defaultIndex);

  const seededRef = React.useRef(false);
  const prevSizeRef = React.useRef(0);

  // Keep the latest callbacks/flags in refs so worklet→JS hops use fresh values
  // without re-subscribing the animated reactions.
  const cbs = React.useRef(props);
  cbs.current = props;

  /* ---- size reconciliation ------------------------------------------- */
  const setSize = React.useCallback(
    (next: number) => {
      if (!(next > 0) || size.value === next) return;
      const prev = prevSizeRef.current;
      if (!seededRef.current || !(prev > 0)) {
        offset.value = offsetFor(defaultIndex, next);
        seededRef.current = true;
      } else {
        offset.value = (offset.value / prev) * next;
      }
      size.value = next;
      prevSizeRef.current = next;
      setPageSize(next);
    },
    [offset, size, defaultIndex],
  );

  // Explicit page size (itemSize / itemWidth / itemHeight) wins and updates reactively.
  React.useEffect(() => {
    if (config.itemSize > 0) setSize(config.itemSize);
  }, [config.itemSize, setSize]);

  // On a data-length change, keep the displayed item stable (clamp if it shrank).
  React.useEffect(() => {
    if (!seededRef.current || !(size.value > 0)) return;
    const idx = clamp(activeRef.current, 0, Math.max(0, count - 1));
    const to = offsetFor(idx, size.value);
    offset.value = to;
    seekRef?.current?.(to, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  /* ---- progress + index reporting (UI thread) ------------------------ */
  const reportIndex = React.useCallback((idx: number) => {
    activeRef.current = idx;
    setActive(idx);
    cbs.current.onIndexChange?.(idx);
    cbs.current.onSnapToItem?.(idx);
  }, []);

  const reportProgress = React.useCallback((offsetProgress: number, abs: number) => {
    const cb = cbs.current.onProgressChange;
    if (typeof cb === "function") cb(offsetProgress, abs);
  }, []);

  // External progress targets are resolved OUTSIDE the worklet: reading the
  // `cbs` React ref inside a worklet and then reassigning `cbs.current` on the
  // next render trips Reanimated's "modified a value already passed to a
  // worklet" warning. `progress`/`onProgressChange` SharedValues are stable
  // proxies, so capturing them directly is safe.
  const externalProgress = props.progress;
  const onProgressChange = props.onProgressChange;
  const progressSV = typeof onProgressChange === "function" ? undefined : onProgressChange;
  const hasProgressCb = typeof onProgressChange === "function";

  useAnimatedReaction(
    () => offset.value,
    (cur) => {
      if (!(size.value > 0) || count <= 0) return;
      // Progress/index are reported in REAL-item space (mod rawCount), so
      // auto-filled duplicate slides collapse onto the same logical item.
      const abs = progressFor(cur, size.value, count, loop);
      const realAbs = rawCount > 0 ? mod(abs, rawCount) : abs;
      progress.value = realAbs;
      if (externalProgress) externalProgress.value = realAbs;
      // `onProgressChange` is either a callback (JS hop) or a SharedValue we
      // write straight on the UI thread.
      if (progressSV) progressSV.value = realAbs;
      if (hasProgressCb) scheduleOnRN(reportProgress, cur, realAbs);

      const real = rawCount > 0 ? mod(activeIndex(cur, size.value, count, loop), rawCount) : 0;
      if (real !== lastReportedIndex.value) {
        lastReportedIndex.value = real;
        scheduleOnRN(reportIndex, real);
      }
    },
    [count, rawCount, loop, externalProgress, progressSV, hasProgressCb],
  );

  // Web: Reanimated's `useAnimatedReaction` does not re-run on shared-value
  // changes under this repo's web tooling (the same limitation the slide painter
  // exists for — see painter.web.ts), so the reaction above never fires and
  // `progress` would freeze at 0. `offset.addListener` *does* fire on web — and
  // fires synchronously on the direct `.value` writes the jest suite makes, so
  // this republish path is now actually test-covered (the old rAF loop was
  // skipped under jsdom). Gated to web; native keeps the UI-thread reaction.
  useSharedValueListener(
    offset,
    (cur) => {
      if (!(size.value > 0) || count <= 0) return;
      const abs = progressFor(cur, size.value, count, loop);
      const realAbs = rawCount > 0 ? mod(abs, rawCount) : abs;
      progress.value = realAbs;
      if (externalProgress) externalProgress.value = realAbs;
      if (progressSV) progressSV.value = realAbs;
      if (hasProgressCb) reportProgress(cur, realAbs);
      const real = rawCount > 0 ? mod(activeIndex(cur, size.value, count, loop), rawCount) : 0;
      if (real !== lastReportedIndex.value) {
        lastReportedIndex.value = real;
        reportIndex(real);
      }
    },
    isWeb,
  );

  /* ---- controlled index ---------------------------------------------- */
  // A controlled `index` is authoritative: snap to it immediately rather than
  // animating (animation is available via the imperative ref). This keeps the
  // prop and any in-flight internal motion from fighting.
  React.useEffect(() => {
    if (props.index === undefined || !seededRef.current || !(size.value > 0)) return;
    const target = clamp(props.index, 0, Math.max(0, count - 1));
    if (target === activeRef.current) return;
    const to = offsetFor(target, size.value);
    offset.value = to;
    // In native mode the offset write alone doesn't move the scroll container;
    // seek it too (unanimated — a controlled prop is authoritative).
    seekRef?.current?.(to, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.index]);

  /* ---- imperative controller ----------------------------------------- */
  const onInteractionStart = React.useCallback(() => {
    autoplayRef.current?.pause();
    cbs.current.onScrollStart?.();
  }, [autoplayRef]);

  const onInteractionEnd = React.useCallback(() => {
    autoplayRef.current?.resume();
    // Report the index of the FINAL offset, not the lagging React ref (the
    // index reaction may not have run yet when a non-animated jump settles).
    const idx =
      size.value > 0 && count > 0
        ? toReal(activeIndex(offset.value, size.value, count, loop))
        : activeRef.current;
    cbs.current.onScrollEnd?.(idx);
  }, [autoplayRef, offset, size, count, loop, toReal]);

  const goToPage = React.useCallback(
    (page: number, opts?: ScrollToOptions) => {
      if (!(size.value > 0)) return;
      const target = offsetFor(page, size.value);
      const animated = opts?.animated ?? true;
      cbs.current.onScrollStart?.();
      const done = () => {
        opts?.onFinished?.();
        onInteractionEnd();
      };
      const seek = seekRef?.current;
      if (seek) {
        // Native scroll mode: drive the real scroll container. Capture the
        // offset we're leaving BEFORE seeding the target, so a looping track can
        // travel to the nearest ring copy (shortest visual path). Then seed the
        // target offset synchronously so progress/index report the landing page
        // immediately (correct even where scroll events don't fire — jsdom /
        // programmatic); the live scroll events keep the offset — and thus the
        // pagination — in sync during the animation.
        const from = offset.value;
        offset.value = target;
        seek(target, animated, from);
        done();
        return;
      }
      if (!animated) {
        offset.value = target;
        done();
      } else {
        animateOffset(offset, target, cbs.current.withAnimation, scrollAnimationDuration, done);
      }
    },
    [offset, size, scrollAnimationDuration, onInteractionEnd, seekRef],
  );

  const currentPage = React.useCallback(
    () => Math.round(rawIndex(offset.value, size.value)),
    [offset, size],
  );

  const { fixedDirection } = config;
  const controller = React.useMemo<CarouselRef>(() => {
    const step = (dir: 1 | -1, opts?: StepOptions) => {
      const by = Math.max(1, Math.round(opts?.count ?? 1));
      let target = currentPage() + dir * by;
      if (!loop) target = clamp(target, 0, Math.max(0, count - 1));
      goToPage(target, opts);
    };
    return {
      next: (opts) => step(1, opts),
      prev: (opts) => step(-1, opts),
      getCurrentIndex: () => activeRef.current,
      scrollTo: (opts) => {
        if (opts?.index !== undefined) {
          if (!loop) {
            goToPage(clamp(opts.index, 0, Math.max(0, count - 1)), opts);
          } else {
            // `index` is a REAL data index; travel the short way to the nearest
            // effective copy of it (rawCount === count when not auto-filled).
            const cur = rawIndex(offset.value, size.value);
            const laps = Math.round((cur - opts.index) / rawCount);
            let target = opts.index + laps * rawCount;
            // `fixedDirection` (experimental) forces the travel direction: a
            // higher page index moves forward ("positive"), lower backward
            // ("negative"). Add/drop a lap so the nearest copy lies that way.
            if (fixedDirection === "positive" && target < cur) target += rawCount;
            else if (fixedDirection === "negative" && target > cur) target -= rawCount;
            goToPage(target, opts);
          }
          return;
        }
        const by = Math.round(opts?.count ?? 0);
        if (by !== 0) step(by > 0 ? 1 : -1, { ...opts, count: Math.abs(by) });
      },
    };
  }, [loop, count, rawCount, currentPage, goToPage, offset, size, fixedDirection]);

  return {
    offset,
    size,
    pageSize,
    progress,
    config,
    activeIndex: active,
    setSize,
    controller,
    onInteractionStart,
    onInteractionEnd,
  };
}
