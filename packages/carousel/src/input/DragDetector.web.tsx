import * as React from "react";
import type { PanGesture } from "react-native-gesture-handler";

import type { WebPan } from "./webPan";

type RefLike = ((node: unknown) => void) | { current: unknown } | null | undefined;

function assign(ref: RefLike, node: unknown): void {
  if (typeof ref === "function") ref(node);
  else if (ref) ref.current = node;
}

/**
 * Web twin of `./DragDetector`: hands the child's element to the web pan (the
 * object a `.web` gesture hook returns, typed as the native `PanGesture` so the
 * call sites stay one file). Like RNGH's detector it renders no element of its
 * own; the child keeps any ref it already had.
 */
export function DragDetector({
  gesture,
  children,
}: {
  gesture: PanGesture;
  children: React.ReactElement;
}): React.ReactElement {
  const pan = gesture as unknown as WebPan;
  const child = children as React.ReactElement & { ref?: RefLike; props: { ref?: RefLike } };
  const own = child.props.ref ?? child.ref;
  const ref = React.useCallback(
    (node: unknown) => {
      assign(own, node);
      pan.attach(node);
    },
    [own, pan],
  );
  return React.cloneElement(child, { ref } as Record<string, unknown>);
}
