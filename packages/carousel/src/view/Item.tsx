import * as React from "react";
import Animated, { useAnimatedStyle, useDerivedValue } from "react-native-reanimated";
import { isAndroid, isWeb } from "@knitui/core";

import { itemProgress, rawIndex } from "../engine";
import { sanitizeAnimationStyle } from "../layouts";
import { SlideBox, useSlideStyle } from "./chrome";
import { SLIDE_BASE, slideContent, slideDimension } from "./Item.shared";
import type { ItemProps } from "./Item.types";

/**
 * Android orders sibling views from the `zIndex` PROP of a React commit;
 * Reanimated's UI-thread writes change the value without re-sorting, and its
 * commit hook would merge a stale animated value back over the settled one. So
 * on Android the animated `zIndex` is dropped and paint order comes only from
 * the settled `paintZ` prop + the track's child order. iOS (layer zPosition) and
 * web honour the animated value, which keeps mid-drag order exact there.
 */
const STRIP_ANIMATED_Z = isAndroid;

/**
 * One absolutely-positioned slide (native). Every item overlaps at the origin
 * and the layout worklet's transform places it (so unmounting an offscreen item
 * leaves no gap). The item's live `progress` (0 = centered) is derived on the UI
 * thread and handed to both the layout worklet and `renderItem`.
 *
 * `register` is part of the shared prop contract but unused on native — items
 * animate through Reanimated's `useAnimatedStyle`. The web variant
 * (`Item.web.tsx`) uses `register` with the imperative painter instead.
 */
function ItemInner<T>({
  item,
  index,
  count,
  loop,
  vertical,
  pageSize,
  offset,
  size,
  animationStyle,
  renderItem,
  renderPlaceholder,
  crossStyle,
  motionAxis,
  paintZ,
  paintRank,
}: ItemProps<T>) {
  const progress = useDerivedValue(
    () => {
      "worklet";
      if (!(size.value > 0)) return index;
      return itemProgress(rawIndex(offset.value, size.value), index, count, loop);
    },
    // Web-only deps: Reanimated 4.7 ignores them on native and warns when given.
    isWeb ? [index, count, loop] : undefined,
  );

  const animatedStyle = useAnimatedStyle(
    () => {
      "worklet";
      // Read `motionAxis` HERE (not inside the layout closure) so the mapper
      // subscribes to it and re-runs when a cross motion starts or lands.
      const cross = crossStyle !== undefined && motionAxis !== undefined && motionAxis.value === 1;
      const style = sanitizeAnimationStyle(
        (cross ? crossStyle : animationStyle)(progress.value, index),
      );
      if (STRIP_ANIMATED_Z) delete (style as { zIndex?: number }).zIndex;
      return style;
    },
    isWeb ? [animationStyle, crossStyle, motionAxis, index] : undefined,
  );

  // Settled paint order as a real prop (see `paintOrder`): Android re-sorts its
  // children on this commit; `elevation` backs it up (a transparent host casts
  // no shadow). Absent for layouts that set no zIndex — exactly today's host.
  const paintStyle = React.useMemo(
    () =>
      paintZ === undefined
        ? null
        : isAndroid
          ? { zIndex: paintZ, elevation: paintRank ?? 0 }
          : { zIndex: paintZ },
    [paintZ, paintRank],
  );

  // The slide body only depends on these: a paint-rank change (every step on an
  // overlapping layout) re-renders the host, not the caller's `renderItem`.
  const content = React.useMemo(
    () => slideContent(item, index, progress, renderItem, renderPlaceholder),
    [item, index, progress, renderItem, renderPlaceholder],
  );

  // Per-slide visual box (`styles.slide`) — a styled child of the animated host,
  // which keeps owning the transform (never share a node with a Tamagui driver).
  const slideStyle = useSlideStyle();

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[SLIDE_BASE, slideDimension(vertical, pageSize), paintStyle, animatedStyle]}
    >
      <SlideBox {...slideStyle}>{content}</SlideBox>
    </Animated.View>
  );
}

export const Item = React.memo(ItemInner) as typeof ItemInner;
