import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

/**
 * Web focus-trap — port of Mantine's `useFocusTrap`. Returns a ref callback to
 * attach to the container element. While `active`, focus is moved into the
 * container (`[data-autofocus]` → first focusable → the container itself) and a
 * `keydown` handler keeps Tab / Shift+Tab cycling between the first and last
 * focusable descendants, so focus can never leave the trapped region.
 *
 * The `use-focus-trap.native` sibling is a no-op (there is no DOM focus model on
 * native). Consumed by the `FocusTrap` component and the `Modal`/`Drawer` base.
 */

const FOCUS_SELECTOR = [
  "input:not([disabled])",
  "button:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  "area[href]",
  "[tabindex]",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
].join(",");

function getFocusable(node: HTMLElement): HTMLElement[] {
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUS_SELECTOR)).filter(
    (el) => el.getAttribute("aria-hidden") !== "true" && el.tabIndex !== -1,
  );
}

/**
 * Whether the most recent user input was a pointer (mouse, pen, touch) rather than
 * a key. Tracked once per page, in the capture phase so nothing can stop it.
 */
let lastInputWasPointer = false;
// Installed at load, not on first use: the tap that opens the first overlay comes
// before that overlay's trap ever runs. Inert under SSR (no `document`).
if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", () => (lastInputWasPointer = true), true);
  document.addEventListener("keydown", () => (lastInputWasPointer = false), true);
}

export interface UseFocusTrapOptions {
  /**
   * When the trap activates right after a pointer or touch input, focus the
   * container rather than its first focusable. Browsers may still draw a
   * `:focus-visible` ring on a control focused by script after a tap, so the
   * first control (often a close button) shows a ring nobody asked for. Tab
   * still lands on that first control. `[data-autofocus]` always wins.
   * @default false
   */
  containerOnPointer?: boolean;
}

export function useFocusTrap(
  active = true,
  options: UseFocusTrapOptions = {},
): (node: TamaguiElement | null) => void {
  const { containerOnPointer = false } = options;
  const nodeRef = React.useRef<HTMLElement | null>(null);

  const setRef = React.useCallback((node: TamaguiElement | null) => {
    // Only DOM nodes support `querySelectorAll`; on native the trap is a no-op
    // and `node` is a `View` instance, so we simply never store it.
    nodeRef.current = node && "querySelectorAll" in node ? node : null;
  }, []);

  React.useEffect(() => {
    const node = nodeRef.current;
    if (!active || !node || typeof document === "undefined") return;

    const focusables = getFocusable(node);
    const autofocus = node.querySelector<HTMLElement>("[data-autofocus]");
    const preferContainer = containerOnPointer && lastInputWasPointer;
    const initial = autofocus ?? (preferContainer ? node : (focusables[0] ?? node));
    if (initial === node && !node.hasAttribute("tabindex")) {
      node.setAttribute("tabindex", "-1");
      // A container focused by script is not a control: no UA focus outline on it.
      if (preferContainer) node.style.outline = "none";
    }
    initial.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = getFocusable(node);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey) {
        if (current === first || current === node) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
    // `containerOnPointer` is read on activation only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return setRef;
}
