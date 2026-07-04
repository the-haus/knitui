import * as React from "react";
import { useSharedValue } from "react-native-reanimated";

import { Box } from "@knitui/components";
import type { StyleProp, ViewStyle } from "@knitui/core";

import { itemProgress, rawIndex } from "../engine";
import { useSharedValueListener } from "../hooks/useSharedValueListener";
import type { SeekFn } from "../motion/useCarouselCore";
import { SlideBox, useSlideStyle } from "./chrome";
import { slideContent } from "./Item.shared";
import { flowSlideStyle, type NativeTrackProps, SCROLL_END_DELAY } from "./NativeTrack.shared";

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
  vertical,
  pageSize,
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

  // Register the imperative seek (engine offset → content offset = -offset).
  React.useEffect(() => {
    const seek: SeekFn = (target, animated) => scrollTo(-target, animated);
    registerSeek(seek);
    return () => registerSeek(null);
  }, [registerSeek, scrollTo]);

  // Re-align to the engine offset when the page size changes (initial / resize).
  // `useEffect` (not layout) so SSR (Next.js) doesn't warn; defaultIndex=0 needs
  // no scroll anyway, and a non-zero start settles on the first client frame.
  React.useEffect(() => {
    if (!(pageSize > 0)) return;
    scrollTo(-offset.value, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, vertical]);

  // No windowing in native mode: mount everything (a no-op `ensure` for eager data).
  React.useEffect(() => {
    if (count > 0) ensure(Array.from({ length: count }, (_, i) => i));
  }, [count, ensure]);

  const reportSettle = React.useCallback(() => {
    clearSettle();
    // A settled programmatic scroll just clears the guard — no user report.
    if (programmatic.current) {
      programmatic.current = false;
      return;
    }
    if (!interacting.current) return;
    interacting.current = false;
    onInteractionEnd();
  }, [clearSettle, onInteractionEnd]);

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
        {Array.from({ length: count }, (_, index) => {
          const item = getItem(index);
          const key =
            item !== undefined && keyExtractor ? keyExtractor(item, index) : String(index);
          return (
            <NativeSlide
              key={key}
              item={item}
              index={index}
              count={count}
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
  | "count"
  | "snapEnabled"
  | "pagingEnabled"
> {
  item: T | undefined;
  index: number;
  slideStyle: ReturnType<typeof useSlideStyle>;
}

/**
 * One flow slide (web). Its `progress` is republished from the engine offset via
 * the shared-value listener (reanimated's reactive hooks don't re-run under this
 * repo's web tooling) and handed to `renderItem`. Carries the CSS scroll-snap
 * alignment so the browser snaps to it.
 */
function NativeSlideInner<T>({
  item,
  index,
  count,
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
    progress.value = s > 0 ? itemProgress(rawIndex(offset.value, s), index, count, false) : index;
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
