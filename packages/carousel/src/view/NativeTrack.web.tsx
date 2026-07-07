import * as React from "react";
import { useSharedValue } from "react-native-reanimated";

import { Box } from "@knitui/components";
import type { StyleProp, ViewStyle } from "@knitui/core";

import { itemProgress, mod, rawIndex } from "../engine";
import { useSharedValueListener } from "../hooks/useSharedValueListener";
import type { SeekFn } from "../motion/useCarouselCore";
import { SlideBox, useSlideStyle } from "./chrome";
import { slideContent } from "./Item.shared";
import {
  flowSlideStyle,
  loopSeekPos,
  middleRingPos,
  type NativeTrackProps,
  recentredPos,
  renderedCount,
  ringLength,
  SCROLL_END_DELAY,
} from "./NativeTrack.shared";

/**
 * Web "normal scroll" track. The viewport is a real overflow-scroll surface, so
 * scrolling, momentum and rubber-banding are the browser's own; snapping rides
 * CSS scroll-snap (GPU-driven, no per-frame JS). A JS `onScroll` handler mirrors
 * the live scroll position into the engine `offset` shared value (forward =
 * negative), which republishes progress / the active index through the core's
 * web offset listener — the same seam the transform painter uses.
 */
function NativeTrackInner<T>({
  getItem,
  ensure,
  renderItem,
  renderPlaceholder,
  keyExtractor,
  count,
  loop,
  vertical,
  pageSize,
  defaultIndex,
  offset,
  size,
  enabled,
  snapEnabled,
  pagingEnabled,
  overscrollEnabled,
  contentContainerStyle,
  onInteractionStart,
  onInteractionEnd,
  registerSeek,
  testID,
}: NativeTrackProps<T>) {
  const nodeRef = React.useRef<HTMLElement | null>(null);

  const interacting = React.useRef(false);
  const programmatic = React.useRef(false);
  const settleTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideCount = renderedCount(count, loop);
  const ring = loop ? ringLength(count, pageSize) : 0;

  const clearSettle = React.useCallback(() => {
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  const scrollTo = React.useCallback(
    (contentOffset: number, animated: boolean) => {
      const node = nodeRef.current;
      if (!node) return;
      const left = vertical ? node.scrollLeft : contentOffset;
      const top = vertical ? contentOffset : node.scrollTop;
      // A programmatic scroll must not report as a user interaction — the
      // controller already reports it. Guard until the resulting events settle.
      programmatic.current = true;
      if (typeof node.scrollTo === "function") {
        node.scrollTo({ left, top, behavior: animated ? "smooth" : "auto" });
      } else {
        // jsdom / very old engines: no `scrollTo`, assign directly.
        node.scrollLeft = left;
        node.scrollTop = top;
      }
    },
    [vertical],
  );

  // Register the imperative seek. Looping travels to the nearest ring copy of
  // the target (using the `from` the controller was leaving); otherwise the
  // content offset is just `-offset`.
  React.useEffect(() => {
    const seek: SeekFn = (target, animated, from) => {
      if (loop && ring > 0) {
        const pos = loopSeekPos(target, ring, from === undefined ? undefined : -from);
        offset.value = -pos;
        scrollTo(pos, animated);
      } else {
        scrollTo(-target, animated);
      }
    };
    registerSeek(seek);
    return () => registerSeek(null);
  }, [registerSeek, scrollTo, loop, ring, offset]);

  // Re-align the scroll position to the engine offset when the page size changes
  // (initial / resize). In loop mode we rest in the middle copy so there's a full
  // ring of cloned buffer on each side. `useEffect` (not layout) so SSR (Next.js)
  // doesn't warn; a non-zero start settles on the first client frame.
  React.useEffect(() => {
    if (!(pageSize > 0)) return;
    if (loop) {
      const pos = middleRingPos(mod(defaultIndex, count), count, pageSize);
      offset.value = -pos;
      scrollTo(pos, false);
    } else {
      scrollTo(-offset.value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, vertical, loop]);

  // No windowing in native mode: mount everything (a no-op `ensure` for eager data).
  React.useEffect(() => {
    if (count > 0) ensure(Array.from({ length: count }, (_, i) => i));
  }, [count, ensure]);

  // Loop recentre: on a settled scroll, snap the resting position back into the
  // middle ring by whole ring-lengths. Reads the engine offset (kept in sync by
  // `handleScroll`) rather than the DOM so it's robust where layout is inert
  // (jsdom). Invisible: the copies are identical and the jump is exactly a ring.
  const recentre = React.useCallback(() => {
    if (!(loop && ring > 0)) return;
    const pos = -offset.value;
    const next = recentredPos(pos, ring);
    if (next === null) return;
    offset.value = -next;
    scrollTo(next, false);
  }, [loop, ring, offset, scrollTo]);

  const reportSettle = React.useCallback(() => {
    clearSettle();
    // A settled programmatic scroll just clears the guard — no user report.
    if (programmatic.current) {
      programmatic.current = false;
      return;
    }
    if (!interacting.current) return;
    interacting.current = false;
    recentre();
    onInteractionEnd();
  }, [clearSettle, recentre, onInteractionEnd]);

  const handleScroll = React.useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const node = e.currentTarget;
      nodeRef.current = node;
      const pos = vertical ? node.scrollTop : node.scrollLeft;
      // Mirror into the engine offset; the core's web listener republishes
      // progress + the active index off this write.
      offset.value = -pos;

      if (!programmatic.current && !interacting.current) {
        interacting.current = true;
        onInteractionStart();
      }
      clearSettle();
      settleTimer.current = setTimeout(reportSettle, SCROLL_END_DELAY);
    },
    [vertical, offset, clearSettle, reportSettle, onInteractionStart],
  );

  React.useEffect(() => clearSettle, [clearSettle]);

  const slideStyle = useSlideStyle();

  // Viewport: a real scroll surface. CSS scroll-snap gives snapping without any
  // JS; `scroll-snap-stop: always` (on the slides) enforces one page per swipe.
  const snapAxis = snapEnabled ? (vertical ? "y mandatory" : "x mandatory") : "none";
  const viewportStyle = {
    flex: 1,
    display: "flex",
    flexDirection: vertical ? "column" : "row",
    overflowX: vertical ? "hidden" : enabled ? "scroll" : "hidden",
    overflowY: vertical ? (enabled ? "scroll" : "hidden") : "hidden",
    scrollSnapType: snapAxis,
    overscrollBehavior: overscrollEnabled ? "auto" : "contain",
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
  } as unknown as ViewStyle;

  const contentStyle = [
    {
      display: "flex",
      flexDirection: vertical ? "column" : "row",
      flexGrow: 1,
    } as unknown as ViewStyle,
    contentContainerStyle,
  ];

  return (
    <Box
      ref={nodeRef as never}
      testID={testID}
      style={viewportStyle}
      {...({ onScroll: handleScroll } as { onScroll: (e: React.UIEvent<HTMLElement>) => void })}
    >
      <Box style={contentStyle as StyleProp<ViewStyle>}>
        {Array.from({ length: slideCount }, (_, rendered) => {
          // `getItem` already maps rendered → real via `mod`; derive the real
          // index for a stable key and suffix the copy so cloned slides stay
          // uniquely keyed (a consumer keying by item id would otherwise clash).
          const real = loop ? mod(rendered, count) : rendered;
          const item = getItem(rendered);
          const base = item !== undefined && keyExtractor ? keyExtractor(item, real) : String(real);
          const key = loop ? `${base}#${Math.floor(rendered / count)}` : base;
          return (
            <NativeSlide
              key={key}
              item={item}
              index={real}
              slot={rendered}
              slotCount={slideCount}
              vertical={vertical}
              pageSize={pageSize}
              offset={offset}
              size={size}
              snapEnabled={snapEnabled}
              pagingEnabled={pagingEnabled}
              renderItem={renderItem}
              renderPlaceholder={renderPlaceholder}
              slideStyle={slideStyle}
            />
          );
        })}
      </Box>
    </Box>
  );
}

interface NativeSlideProps<T> extends Pick<
  NativeTrackProps<T>,
  | "vertical"
  | "pageSize"
  | "offset"
  | "size"
  | "renderItem"
  | "renderPlaceholder"
  | "snapEnabled"
  | "pagingEnabled"
> {
  item: T | undefined;
  /** Real data index handed to `renderItem` (wrapped onto `[0, count)` in loop). */
  index: number;
  /** Rendered flow position — this slide's slot among all mounted copies. */
  slot: number;
  /** Total mounted slots (`count * LOOP_COPIES` in loop mode). */
  slotCount: number;
  slideStyle: ReturnType<typeof useSlideStyle>;
}

/**
 * One flow slide (web). Its `progress` is republished from the engine offset via
 * the shared-value listener (reanimated's reactive hooks don't re-run under this
 * repo's web tooling) and handed to `renderItem`. Carries the CSS scroll-snap
 * alignment so the browser snaps to it. Progress is measured from the rendered
 * `slot` (each clone is its own flow slide); `index` stays the real data index.
 */
function NativeSlideInner<T>({
  item,
  index,
  slot,
  slotCount,
  vertical,
  pageSize,
  offset,
  size,
  snapEnabled,
  pagingEnabled,
  renderItem,
  renderPlaceholder,
  slideStyle,
}: NativeSlideProps<T>) {
  const progress = useSharedValue(0);
  useSharedValueListener(offset, () => {
    const s = size.value;
    progress.value = s > 0 ? itemProgress(rawIndex(offset.value, s), slot, slotCount, false) : slot;
  });

  const style = [
    flowSlideStyle(vertical, pageSize),
    snapEnabled
      ? ({
          scrollSnapAlign: "start",
          scrollSnapStop: pagingEnabled ? "always" : "normal",
        } as unknown as ViewStyle)
      : null,
  ];

  return (
    <Box style={style as StyleProp<ViewStyle>}>
      <SlideBox {...slideStyle}>
        {slideContent(item, index, progress, renderItem, renderPlaceholder)}
      </SlideBox>
    </Box>
  );
}

const NativeSlide = React.memo(NativeSlideInner) as typeof NativeSlideInner;

export const NativeTrack = NativeTrackInner;
