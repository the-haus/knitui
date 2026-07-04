import * as React from "react";
import type { ScrollView as RNScrollView } from "react-native";
import Animated, { useAnimatedScrollHandler, useDerivedValue } from "react-native-reanimated";

import { Box } from "@knitui/components";

import { itemProgress, rawIndex } from "../engine";
import type { SeekFn } from "../motion/useCarouselCore";
import { SlideBox, useSlideStyle } from "./chrome";
import { slideContent } from "./Item.shared";
import { flowSlideStyle, type NativeTrackProps } from "./NativeTrack.shared";

/**
 * Native "normal scroll" track. Renders every slide in flow inside a real
 * `Animated.ScrollView`, so scrolling, momentum and rubber-band overscroll are
 * the OS's own — nothing runs per frame on the JS thread. A worklet scroll
 * handler mirrors the live content offset into the engine `offset` shared value
 * (forward = negative), which keeps pagination / progress / the active index in
 * sync through the carousel's existing UI-thread reaction.
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
  const ref = React.useRef<RNScrollView>(null);

  // Mirror the live scroll position into the engine offset on the UI thread —
  // no JS hop per frame. Writing `offset` drives the core's animated reaction,
  // so progress and the active index update as the user scrolls.
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (e) => {
        "worklet";
        offset.value = -(vertical ? e.contentOffset.y : e.contentOffset.x);
      },
    },
    [vertical],
  );

  // Register the imperative seek: convert an engine offset (negative) to a
  // content offset (positive) and scroll there.
  React.useEffect(() => {
    const seek: SeekFn = (target, animated) => {
      const to = -target;
      ref.current?.scrollTo(vertical ? { y: to, animated } : { x: to, animated });
    };
    registerSeek(seek);
    return () => registerSeek(null);
  }, [registerSeek, vertical]);

  // Keep the scroll position aligned to the engine offset when the page size
  // changes (initial measure / resize) — offset writes alone don't move a
  // native ScrollView. Non-animated: this is a reconcile, not a navigation.
  React.useEffect(() => {
    if (!(pageSize > 0)) return;
    const to = -offset.value;
    ref.current?.scrollTo(vertical ? { y: to, animated: false } : { x: to, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, vertical]);

  // No windowing in native mode: mount all slides so the scroll container sizes
  // its content correctly. Ask the source to load them all (no-op for eager data).
  React.useEffect(() => {
    if (count > 0) ensure(Array.from({ length: count }, (_, i) => i));
  }, [count, ensure]);

  // Settle detection: `onScrollBeginDrag` is the only user-start signal a native
  // ScrollView emits (a programmatic `scrollTo` never fires it), so it cannot
  // false-trigger on controller-driven scrolls. A drag ends either directly
  // (`onScrollEndDrag`, no fling) or after momentum (`onMomentumScrollEnd`).
  const interacting = React.useRef(false);
  const settleTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSettle = React.useCallback(() => {
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  const reportSettle = React.useCallback(() => {
    clearSettle();
    if (!interacting.current) return;
    interacting.current = false;
    onInteractionEnd();
  }, [clearSettle, onInteractionEnd]);

  const onScrollBeginDrag = React.useCallback(() => {
    clearSettle();
    if (interacting.current) return;
    interacting.current = true;
    onInteractionStart();
  }, [clearSettle, onInteractionStart]);

  // A finger lift with no fling settles shortly; a fling begins momentum first
  // (which cancels the pending settle) and ends via `onMomentumScrollEnd`.
  const onScrollEndDrag = React.useCallback(() => {
    clearSettle();
    settleTimer.current = setTimeout(reportSettle, 80);
  }, [clearSettle, reportSettle]);

  const onMomentumScrollBegin = React.useCallback(() => clearSettle(), [clearSettle]);
  const onMomentumScrollEnd = React.useCallback(() => reportSettle(), [reportSettle]);

  React.useEffect(() => clearSettle, [clearSettle]);

  const slideStyle = useSlideStyle();
  const contentOffset = React.useMemo(
    () => ({
      x: vertical ? 0 : defaultIndex * pageSize,
      y: vertical ? defaultIndex * pageSize : 0,
    }),
    [vertical, defaultIndex, pageSize],
  );

  return (
    <Animated.ScrollView
      ref={ref as never}
      testID={testID}
      style={{ flex: 1 }}
      horizontal={!vertical}
      scrollEnabled={enabled}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bounces={overscrollEnabled}
      overScrollMode={overscrollEnabled ? "auto" : "never"}
      decelerationRate={snapEnabled ? "fast" : "normal"}
      snapToInterval={snapEnabled ? pageSize : undefined}
      snapToAlignment="start"
      disableIntervalMomentum={pagingEnabled}
      contentOffset={contentOffset}
      scrollEventThrottle={16}
      onScroll={scrollHandler}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollBegin={onMomentumScrollBegin}
      onMomentumScrollEnd={onMomentumScrollEnd}
      // `@knitui/core`'s style type carries the web CSS union; the RN ScrollView
      // wants the plain RN style — the runtime shape is identical.
      contentContainerStyle={contentContainerStyle as never}
    >
      {Array.from({ length: count }, (_, index) => {
        const item = getItem(index);
        const key = item !== undefined && keyExtractor ? keyExtractor(item, index) : String(index);
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
            renderItem={renderItem}
            renderPlaceholder={renderPlaceholder}
            slideStyle={slideStyle}
          />
        );
      })}
    </Animated.ScrollView>
  );
}

interface NativeSlideProps<T> extends Pick<
  NativeTrackProps<T>,
  "vertical" | "pageSize" | "offset" | "size" | "renderItem" | "renderPlaceholder" | "count"
> {
  item: T | undefined;
  index: number;
  slideStyle: ReturnType<typeof useSlideStyle>;
}

/**
 * One flow slide (native). Its `progress` (0 = at the leading slot, ±1 = one
 * page away) is derived from the engine offset on the UI thread and handed to
 * `renderItem` — so progress-driven content still works, without any transform.
 */
function NativeSlideInner<T>({
  item,
  index,
  count,
  vertical,
  pageSize,
  offset,
  size,
  renderItem,
  renderPlaceholder,
  slideStyle,
}: NativeSlideProps<T>) {
  const progress = useDerivedValue(() => {
    "worklet";
    if (!(size.value > 0)) return index;
    return itemProgress(rawIndex(offset.value, size.value), index, count, false);
  }, [index, count]);

  return (
    <Box style={flowSlideStyle(vertical, pageSize)}>
      <SlideBox {...slideStyle}>
        {slideContent(item, index, progress, renderItem, renderPlaceholder)}
      </SlideBox>
    </Box>
  );
}

const NativeSlide = React.memo(NativeSlideInner) as typeof NativeSlideInner;

export const NativeTrack = NativeTrackInner;
