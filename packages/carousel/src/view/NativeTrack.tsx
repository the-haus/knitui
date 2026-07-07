import * as React from "react";
import type { ScrollView as RNScrollView } from "react-native";
import Animated, { useAnimatedScrollHandler, useDerivedValue } from "react-native-reanimated";

import { Box } from "@knitui/components";

import { itemProgress, mod, rawIndex } from "../engine";
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
} from "./NativeTrack.shared";

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
  const ref = React.useRef<RNScrollView>(null);

  const slideCount = renderedCount(count, loop);
  const ring = loop ? ringLength(count, pageSize) : 0;

  const scrollToPos = React.useCallback(
    (pos: number, animated: boolean) => {
      ref.current?.scrollTo(vertical ? { y: pos, animated } : { x: pos, animated });
    },
    [vertical],
  );

  // Mirror the live scroll position into the engine offset on the UI thread —
  // no JS hop per frame. Writing `offset` drives the core's animated reaction,
  // so progress and the active index update as the user scrolls. A whole-ring
  // recentre (loop) is mod-invariant, so the mirror stays correct across it.
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (e) => {
        "worklet";
        offset.value = -(vertical ? e.contentOffset.y : e.contentOffset.x);
      },
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
        scrollToPos(pos, animated);
      } else {
        scrollToPos(-target, animated);
      }
    };
    registerSeek(seek);
    return () => registerSeek(null);
  }, [registerSeek, scrollToPos, loop, ring, offset]);

  // Keep the scroll position aligned to the engine offset when the page size
  // changes (initial measure / resize) — offset writes alone don't move a
  // native ScrollView. In loop mode rest in the middle copy so a full ring of
  // cloned buffer sits on each side. Non-animated: a reconcile, not a navigation.
  React.useEffect(() => {
    if (!(pageSize > 0)) return;
    if (loop) {
      const pos = middleRingPos(mod(defaultIndex, count), count, pageSize);
      offset.value = -pos;
      scrollToPos(pos, false);
    } else {
      scrollToPos(-offset.value, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, vertical, loop]);

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

  // Loop recentre: on a settled scroll, snap the resting position back into the
  // middle ring by whole ring-lengths (invisible — identical pixels, exact ring).
  const recentre = React.useCallback(() => {
    if (!(loop && ring > 0)) return;
    const next = recentredPos(-offset.value, ring);
    if (next === null) return;
    offset.value = -next;
    scrollToPos(next, false);
  }, [loop, ring, offset, scrollToPos]);

  const reportSettle = React.useCallback(() => {
    clearSettle();
    if (!interacting.current) return;
    interacting.current = false;
    recentre();
    onInteractionEnd();
  }, [clearSettle, recentre, onInteractionEnd]);

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
  const startPos = loop
    ? middleRingPos(mod(defaultIndex, count), count, pageSize)
    : defaultIndex * pageSize;
  const contentOffset = React.useMemo(
    () => ({
      x: vertical ? 0 : startPos,
      y: vertical ? startPos : 0,
    }),
    [vertical, startPos],
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
  "vertical" | "pageSize" | "offset" | "size" | "renderItem" | "renderPlaceholder"
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
 * One flow slide (native). Its `progress` (0 = at the leading slot, ±1 = one
 * page away) is derived from the engine offset on the UI thread and handed to
 * `renderItem` — so progress-driven content still works, without any transform.
 * Progress is measured from the rendered `slot` (each clone is its own flow
 * slide); `index` stays the real data index.
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
  renderItem,
  renderPlaceholder,
  slideStyle,
}: NativeSlideProps<T>) {
  const progress = useDerivedValue(() => {
    "worklet";
    if (!(size.value > 0)) return slot;
    return itemProgress(rawIndex(offset.value, size.value), slot, slotCount, false);
  }, [slot, slotCount]);

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
