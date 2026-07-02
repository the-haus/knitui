import * as React from "react";
import type { ReactElement } from "react";
import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { prefetchWindow, rawIndex, visibleWindow } from "../engine";
import type { AnimationStyle, RenderItem } from "../types";
import { Item } from "./Item";
import { useWebPainter } from "./painter";

export interface TrackProps<T> {
  getItem: (index: number) => T | undefined;
  ensure: (indices: number[]) => void;
  renderItem: RenderItem<T>;
  renderPlaceholder?: (index: number) => ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  count: number;
  loop: boolean;
  vertical: boolean;
  windowSize: number;
  prefetchCount: number;
  defaultIndex: number;
  pageSize: number;
  offset: SharedValue<number>;
  size: SharedValue<number>;
  animationStyle: AnimationStyle;
}

/**
 * Renders only the items inside the virtualization window. The window is
 * recomputed on the UI thread (from the scroll position) and mirrored to React
 * state only when the centered index actually changes — so continuous scrolling
 * doesn't churn the mounted set. Each window change also asks the data source to
 * `ensure` those indices are loaded (a no-op for eager array data).
 */
export function Track<T>(props: TrackProps<T>) {
  const {
    getItem,
    ensure,
    renderItem,
    renderPlaceholder,
    keyExtractor,
    count,
    loop,
    vertical,
    windowSize,
    prefetchCount,
    defaultIndex,
    pageSize,
    offset,
    size,
    animationStyle,
  } = props;

  // The centered (rounded) scroll index drives both the mounted window and the
  // prefetch span. Kept as the raw page index (not mod'd): it advances
  // monotonically as the ring loops, so its delta gives a reliable travel
  // direction without wrap bookkeeping.
  const [center, setCenter] = React.useState(defaultIndex);
  const directionRef = React.useRef(1);

  // Advance when the centered item changes. Native drives this from the
  // UI-thread reaction below; web drives it from the painter's `onCenter`
  // (reactions don't re-run on shared-value changes under web tooling).
  const onCenter = React.useCallback((next: number) => {
    setCenter((prev) => {
      // Bail if unchanged so an idle painter frame causes no re-render.
      if (next === prev) return prev;
      directionRef.current = next >= prev ? 1 : -1;
      return next;
    });
  }, []);

  // Web imperative painter (no-op on native — native items use useAnimatedStyle).
  const register = useWebPainter({ offset, size, count, loop, animationStyle, onCenter });

  // Reset to the default position when the data shape changes.
  React.useEffect(() => {
    setCenter(defaultIndex);
    directionRef.current = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, windowSize, loop]);

  // The mounted (drawn) set: a tight window centered on the active item.
  const mounted = React.useMemo(
    () => visibleWindow(center, count, windowSize, loop),
    [center, count, windowSize, loop],
  );

  // Load the window plus a lead in the travel direction. For eager data `ensure`
  // is a no-op; for an async source this fetches upcoming pages early so slides
  // don't flash a placeholder as they scroll in.
  React.useEffect(() => {
    const toLoad = prefetchWindow(
      center,
      count,
      windowSize,
      loop,
      directionRef.current,
      prefetchCount,
    );
    if (toLoad.length > 0) ensure(toLoad);
  }, [center, count, windowSize, loop, prefetchCount, ensure]);

  useAnimatedReaction(
    () => {
      "worklet";
      if (!(size.value > 0)) return -1;
      return Math.round(rawIndex(offset.value, size.value));
    },
    (center, prev) => {
      if (center === prev || center === -1) return;
      scheduleOnRN(onCenter, center);
    },
    [onCenter],
  );

  return (
    <>
      {mounted.map((index) => {
        const item = getItem(index);
        const key = item !== undefined && keyExtractor ? keyExtractor(item, index) : String(index);
        return (
          <Item
            key={key}
            item={item}
            index={index}
            count={count}
            loop={loop}
            vertical={vertical}
            pageSize={pageSize}
            offset={offset}
            size={size}
            animationStyle={animationStyle}
            renderItem={renderItem}
            renderPlaceholder={renderPlaceholder}
            register={register}
          />
        );
      })}
    </>
  );
}
