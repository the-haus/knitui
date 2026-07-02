import * as React from "react";

import { Box } from "../../Box";
import { Overlay } from "../../Overlay";
import { dragOverlayOpacity } from "./engine";
import { nextListenerId } from "./listener-id";
import type { DragDismissOverlayProps } from "./types";

/**
 * Web scrim whose opacity the painter writes imperatively whenever `offset`
 * changes (reanimated's `useAnimatedStyle` doesn't re-run under the repo's web
 * tooling). The initial value is written in a layout effect, not read from
 * `offset.value` during render. `box-none` passes taps to the `Overlay`.
 */
export function DragDismissOverlay({
  offset,
  extent,
  maxOpacity = 1,
  onPress,
  overlayProps,
}: DragDismissOverlayProps) {
  const ref = React.useRef<unknown>(null);

  const paint = React.useCallback(
    (v: number) => {
      const el = ref.current as HTMLElement | null;
      if (el) el.style.opacity = String(dragOverlayOpacity(v, extent, maxOpacity));
    },
    [extent, maxOpacity],
  );
  React.useLayoutEffect(() => {
    paint(offset.value);
    const id = nextListenerId();
    offset.addListener(id, paint);
    return () => offset.removeListener(id);
  }, [offset, paint]);

  return (
    <Box
      ref={ref as never}
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
    >
      <Overlay onPress={onPress} zIndex={0} {...overlayProps} />
    </Box>
  );
}
