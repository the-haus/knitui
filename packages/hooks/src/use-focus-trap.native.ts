import type { TamaguiElement } from "@knitui/core";

/**
 * Native counterpart of `use-focus-trap` — a no-op. React Native has no DOM
 * focus model, so focus trapping cannot be implemented cross-platform; the
 * returned ref callback simply ignores the node. Documented parity gap, same
 * class as `Overlay`'s web-only `blur`/`gradient`.
 */
const noop = (_node: TamaguiElement | null): void => {};

export function useFocusTrap(_active = true): (node: TamaguiElement | null) => void {
  return noop;
}
