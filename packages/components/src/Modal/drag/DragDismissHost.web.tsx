import * as React from "react";

import { Box } from "../../Box";
import { nextListenerId } from "./listener-id";
import type { DragDismissHostProps } from "./types";

/**
 * Web drag host. Reanimated's `useAnimatedStyle` doesn't re-run on shared-value
 * changes under the repo's web tooling, so the dismiss translation is written
 * imperatively to the DOM node whenever `offset` changes (subscribed via
 * `addListener`). The initial value is written in a layout effect (before paint),
 * not read from `offset.value` during render — a render-phase `.value` read warns
 * and flashes. Layout-neutral, like the native host.
 */
export const DragDismissHost = React.forwardRef<unknown, DragDismissHostProps>(
  function DragDismissHost({ offset, axis, sign, style, pointerEvents, children }, forwardedRef) {
    const innerRef = React.useRef<unknown>(null);

    // The painter and the GestureDetector must address the SAME node, so merge
    // our painting ref with the ref GestureDetector forwards in.
    const setRef = React.useCallback(
      (node: unknown) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) (forwardedRef as React.MutableRefObject<unknown>).current = node;
      },
      [forwardedRef],
    );

    const paint = React.useCallback(
      (v: number) => {
        const el = innerRef.current as HTMLElement | null;
        if (!el) return;
        const t = sign * v;
        el.style.transform = axis === "x" ? `translateX(${t}px)` : `translateY(${t}px)`;
      },
      [axis, sign],
    );

    React.useLayoutEffect(() => {
      paint(offset.value);
      const id = nextListenerId();
      offset.addListener(id, paint);
      return () => offset.removeListener(id);
    }, [offset, paint]);

    return (
      <Box ref={setRef as never} style={style} pointerEvents={pointerEvents}>
        {children}
      </Box>
    );
  },
);
