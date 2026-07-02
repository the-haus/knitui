// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel. Shared by the calendar grids (`Month`/`MonthsList`/`YearsList`) when
// they build the `FocusableControl` descriptors that drive roving focus, so the
// host-ref narrowing lives in one place instead of being copied per grid.

import type { TamaguiElement } from "@knitui/core";

/**
 * Best-effort, cross-platform focus.
 *
 * `TamaguiElement` is `(HTMLElement & TamaguiElementMethods) | View`: the web
 * branch carries a `focus()` method, the native `View` branch does not. This
 * narrows to the focusable branch at runtime and calls `focus()` only there —
 * a no-op on native (where roving focus is a web affordance). No DOM types, no
 * `any`.
 */
export function focusElement(node: TamaguiElement): void {
  if ("focus" in node && typeof node.focus === "function") {
    node.focus();
  }
}
