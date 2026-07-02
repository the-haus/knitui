import type * as React from "react";

import type { TamaguiElement } from "@knitui/core";

/**
 * Close an open overlay when the page scrolls (the idiomatic native behavior).
 *
 * Web variant: a **no-op**. On web a floating engine typically follows scroll
 * cheaply via `scroll`/`resize` listeners, so the overlay tracks its target
 * instead of closing. The `.native` sibling implements the close-on-scroll
 * detection. Lives in `@knitui/hooks` so any overlay can reuse it.
 */
export function useDismissOnScroll(
  _enabled: boolean,
  _referenceRef: React.RefObject<TamaguiElement | null>,
  _onDismiss: () => void,
): void {
  // intentionally empty on web
}
