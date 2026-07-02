import { type KeyboardEvent, useCallback, useMemo, useRef } from "react";

import type {
  KeyboardActionProps,
  KeyboardActions,
  UseKeyboardActionsOptions,
} from "./use-keyboard-actions.types";

/** `KeyboardEvent.key` → the semantic action it triggers on web. */
const KEY_TO_ACTION: Record<string, keyof Omit<KeyboardActions, "keys">> = {
  " ": "onActivate",
  Enter: "onActivate",
  ArrowUp: "onIncrement",
  ArrowRight: "onIncrement",
  ArrowDown: "onDecrement",
  ArrowLeft: "onDecrement",
  Escape: "onEscape",
};

/**
 * Keyboard/accessibility activation for an interactive host that is NOT a native
 * `<button>` — web implementation. Returns `{ tabIndex, onKeyDown }` to spread
 * onto the host so it is focusable and the configured {@link KeyboardActions}
 * fire from the keyboard. The `use-keyboard-actions.native` sibling maps the same
 * intents to React Native accessibility actions instead.
 *
 * The `onKeyDown` identity is stable across renders (it reads the latest actions
 * through a ref), so spreading it does not churn the host. A key with no binding
 * passes through to the browser, and a chord with Ctrl/Alt/Meta held is ignored
 * so browser/OS shortcuts keep working. A matched key is `preventDefault()`ed so
 * Space does not scroll and arrows do not pan the page.
 */
export function useKeyboardActions(
  actions: KeyboardActions,
  options: UseKeyboardActionsOptions = {},
): KeyboardActionProps {
  const { tabIndex = 0, disabled = false } = options;

  // Always-latest mirror so the stable handler never reads stale actions.
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    const current = actionsRef.current;
    const semantic = KEY_TO_ACTION[event.key];
    const handler = (semantic ? current[semantic] : undefined) ?? current.keys?.[event.key];
    if (handler === undefined) return;
    event.preventDefault();
    handler();
  }, []);

  return useMemo<KeyboardActionProps>(
    () => (disabled ? { tabIndex: -1 } : { tabIndex, onKeyDown }),
    [disabled, tabIndex, onKeyDown],
  );
}
