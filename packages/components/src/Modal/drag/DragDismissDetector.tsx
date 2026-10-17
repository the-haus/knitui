/// <reference lib="dom" />
import * as React from "react";

import type { WebDragGesture } from "./useDragDismiss";

/**
 * Attaches the web drag-to-dismiss gesture (`useDragDismiss`) to its one child's
 * DOM node — the web twin of the native `GestureDetector` wrapper
 * (`DragDismissDetector.native.tsx`). The child must forward its ref to a DOM
 * element (every kit `Box` / Tamagui view does).
 *
 * While enabled the node gets `touch-action: none`, so a touch drag on it reaches
 * the gesture instead of panning the page. A scroll container INSIDE it (a
 * modal's scrolling body) still scrolls: the browser only intersects
 * `touch-action` up to the nearest scroll container.
 */
export function DragDismissDetector({
  gesture,
  children,
}: {
  gesture: WebDragGesture;
  children: React.ReactElement;
}) {
  const [node, setNode] = React.useState<HTMLElement | null>(null);
  const childRef = (children as { props: { ref?: React.Ref<unknown> } }).props.ref;

  const ref = React.useCallback(
    (next: unknown) => {
      setNode(next instanceof HTMLElement ? next : null);
      if (typeof childRef === "function") childRef(next);
      else if (childRef && typeof childRef === "object")
        (childRef as React.MutableRefObject<unknown>).current = next;
    },
    [childRef],
  );

  const { attach, enabled } = gesture;
  React.useEffect(() => (node ? attach(node) : undefined), [node, attach]);

  React.useEffect(() => {
    if (!node || !enabled) return;
    const previous = node.style.touchAction;
    node.style.touchAction = "none";
    return () => {
      node.style.touchAction = previous;
    };
  }, [node, enabled]);

  return React.cloneElement(children as React.ReactElement<{ ref?: React.Ref<unknown> }>, {
    ref,
  });
}
