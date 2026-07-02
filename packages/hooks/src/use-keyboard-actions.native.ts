import { useMemo, useRef } from "react";
import type { AccessibilityActionEvent, AccessibilityActionInfo } from "react-native";

import type {
  KeyboardActionProps,
  KeyboardActions,
  UseKeyboardActionsOptions,
} from "./use-keyboard-actions.types";

/**
 * Keyboard/accessibility activation for an interactive host that is NOT a native
 * `<button>` — native counterpart of `use-keyboard-actions`. React Native has no
 * DOM key event, so instead of `onKeyDown` this exposes the adjustable / escape
 * intents as accessibility actions (`{ accessibilityActions, onAccessibilityAction }`)
 * that screen readers can trigger.
 *
 * `onActivate` intentionally yields no action here — native activation already
 * flows through the host's `onPress`, so adding an `activate` accessibility
 * action would double-fire. The web-only `keys` escape hatch is ignored (there
 * is no cross-platform key event for arbitrary keys). `react-native` is imported
 * for types only, so nothing is pulled into a bundle.
 */
export function useKeyboardActions(
  actions: KeyboardActions,
  options: UseKeyboardActionsOptions = {},
): KeyboardActionProps {
  const { disabled = false } = options;

  // Always-latest mirror so the stable handler never reads stale actions.
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const hasIncrement = actions.onIncrement !== undefined;
  const hasDecrement = actions.onDecrement !== undefined;
  const hasEscape = actions.onEscape !== undefined;

  return useMemo<KeyboardActionProps>(() => {
    if (disabled) return {};

    const accessibilityActions: AccessibilityActionInfo[] = [];
    if (hasIncrement) accessibilityActions.push({ name: "increment" });
    if (hasDecrement) accessibilityActions.push({ name: "decrement" });
    if (hasEscape) accessibilityActions.push({ name: "escape" });
    if (accessibilityActions.length === 0) return {};

    return {
      accessibilityActions,
      onAccessibilityAction: (event: AccessibilityActionEvent) => {
        const current = actionsRef.current;
        switch (event.nativeEvent.actionName) {
          case "increment":
            current.onIncrement?.();
            break;
          case "decrement":
            current.onDecrement?.();
            break;
          case "escape":
            current.onEscape?.();
            break;
        }
      },
    };
  }, [disabled, hasIncrement, hasDecrement, hasEscape]);
}
