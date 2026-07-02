import type { KeyboardEventHandler } from "react";
import type { AccessibilityActionEvent, AccessibilityActionInfo } from "react-native";

/**
 * Semantic interactions for a host that is NOT a native `<button>` (a styled
 * `Box` with role button/checkbox/radio/switch/slider). Callers describe INTENT;
 * `useKeyboardActions` maps each intent to the right mechanism per platform:
 *
 * | intent        | web (`onKeyDown`)        | native (`onAccessibilityAction`) |
 * | ------------- | ------------------------ | -------------------------------- |
 * | `onActivate`  | Space / Enter            | — (host `onPress` already fires) |
 * | `onIncrement` | ArrowUp / ArrowRight     | `increment`                      |
 * | `onDecrement` | ArrowDown / ArrowLeft    | `decrement`                      |
 * | `onEscape`    | Escape                   | `escape`                         |
 *
 * `onActivate` has no native action on purpose: native activation flows through
 * the host's `onPress`, so emitting an `activate` accessibility action too would
 * double-fire. `keys` is a web-only escape hatch for extra `KeyboardEvent.key`
 * bindings (e.g. `Home` / `End` / `PageUp`) that have no cross-platform analog.
 */
export interface KeyboardActions {
  /** Primary activation — Space/Enter on web; `onPress` on native. */
  onActivate?: () => void;
  /** Step up — ArrowUp/ArrowRight on web; the `increment` AT action on native. */
  onIncrement?: () => void;
  /** Step down — ArrowDown/ArrowLeft on web; the `decrement` AT action on native. */
  onDecrement?: () => void;
  /** Dismiss — Escape on web; the `escape` AT action on native. */
  onEscape?: () => void;
  /** Web-only extra key bindings (`KeyboardEvent.key` → handler). Ignored on native. */
  keys?: Record<string, (() => void) | undefined>;
}

export interface UseKeyboardActionsOptions {
  /** Tab order for the host on web. `-1` removes it from sequential focus. @default 0 */
  tabIndex?: number;
  /** Disable all handling and drop the host from the tab order. @default false */
  disabled?: boolean;
}

/**
 * Props to spread onto the interactive host. The web hook fills
 * `tabIndex`/`onKeyDown`; the native hook fills `accessibilityActions`/
 * `onAccessibilityAction`. Every field is optional, so the opposite platform's
 * fields are simply absent (and harmlessly ignored if spread).
 */
export interface KeyboardActionProps {
  tabIndex?: number;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  accessibilityActions?: ReadonlyArray<AccessibilityActionInfo>;
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}
