import * as React from "react";
import Animated, { useAnimatedStyle, useDerivedValue } from "react-native-reanimated";

import { itemProgress, rawIndex } from "../engine";
import { sanitizeAnimationStyle } from "../layouts";
import { SlideBox, useSlideStyle } from "./chrome";
import { SLIDE_BASE, slideContent, slideDimension } from "./Item.shared";
import type { ItemProps } from "./Item.types";

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
}: ItemProps<T>) {
  const progress = useDerivedValue(() => {
    "worklet";
    if (!(size.value > 0)) return index;
    return itemProgress(rawIndex(offset.value, size.value), index, count, loop);
  }, [index, count, loop]);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return sanitizeAnimationStyle(animationStyle(progress.value, index));
  }, [animationStyle, index]);

  // Per-slide visual box (`styles.slide`) — a styled child of the animated host,
  // which keeps owning the transform (never share a node with a Tamagui driver).
  const slideStyle = useSlideStyle();

  return (
    <Animated.View style={[SLIDE_BASE, slideDimension(vertical, pageSize), animatedStyle]}>
      <SlideBox {...slideStyle}>
        {slideContent(item, index, progress, renderItem, renderPlaceholder)}
      </SlideBox>
    </Animated.View>
  );
}

export const Item = React.memo(ItemInner) as typeof ItemInner;
