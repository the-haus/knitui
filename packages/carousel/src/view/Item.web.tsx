import * as React from "react";
import { useSharedValue } from "react-native-reanimated";

import { Box } from "@knitui/components";

import { itemProgress, rawIndex } from "../engine";
import { sanitizeAnimationStyle } from "../layouts";
import { SlideBox, useSlideStyle } from "./chrome";
import { SLIDE_BASE, slideContent, slideDimension } from "./Item.shared";
import type { ItemProps } from "./Item.types";

/**
 * One absolutely-positioned slide (web). Reanimated's `useAnimatedStyle` does
 * not re-run on shared-value changes under this repo's Vite tooling, so instead
 * of an animated style the item registers its DOM element with the imperative
 * painter (see painter.web.ts), which writes the transform whenever the offset
 * changes. We still derive an initial transform inline (RNW converts the RN
 * transform array to CSS) to avoid a first-frame flash, and pass a per-item
 * `progress` shared value the painter keeps current for `renderItem`.
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
  register,
}: ItemProps<T>) {
  const ref = React.useRef<unknown>(null);
  const progress = useSharedValue(0);

  React.useEffect(() => {
    register(index, { el: ref.current, progress });
    return () => register(index, null);
  }, [index, register, progress]);

  // Initial (pre-paint) transform so the first frame isn't stacked at origin.
  const s = size.value > 0 ? size.value : pageSize;
  const initialStyle =
    s > 0
      ? sanitizeAnimationStyle(
          animationStyle(itemProgress(rawIndex(offset.value, s), index, count, loop), index),
        )
      : undefined;

  // Per-slide visual box (`styles.slide`). The host `Box` stays the painter's
  // target (`ref`) — on web Tamagui forwards the ref to the underlying DOM node,
  // and `SlideBox` is a plain styled child, so the painter keeps writing the
  // transform to the right element.
  const slideStyle = useSlideStyle();

  return (
    <Box ref={ref as never} style={[SLIDE_BASE, slideDimension(vertical, pageSize), initialStyle]}>
      <SlideBox {...slideStyle}>
        {slideContent(item, index, progress, renderItem, renderPlaceholder)}
      </SlideBox>
    </Box>
  );
}

export const Item = React.memo(ItemInner) as typeof ItemInner;
